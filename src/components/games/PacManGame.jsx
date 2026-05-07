import React, { useEffect, useRef, useState } from 'react';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import { useCountdown } from './useGameLoop';
import { playChomp, playExplosion } from '@/lib/sound';

// Simple maze: 0=path, 1=wall, 2=dot
const MAZE_TEMPLATE = [
  '111111111111111',
  '1.............1',
  '1.111.111.111.1',
  '1.............1',
  '1.11.11111.11.1',
  '1.............1',
  '1.11.11.11.11.1',
  '1......P......1',
  '1.11.11.11.11.1',
  '1.............1',
  '1.11.11111.11.1',
  '1.............1',
  '1.111.111.111.1',
  '1.............1',
  '111111111111111',
];

const TILE = 28;
const COLS = MAZE_TEMPLATE[0].length;
const ROWS = MAZE_TEMPLATE.length;
const W = COLS * TILE;
const H = ROWS * TILE;

const buildMaze = () => MAZE_TEMPLATE.map(row =>
  row.split('').map(c => c === '1' ? 1 : c === 'P' ? 0 : 2)
);

export default function PacManGame({ onComplete }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const scoreRef = useRef(0);
  const [time, resetTime] = useCountdown(60, gameState === 'playing', () => endGame());

  const endGame = () => {
    setGameState('over');
    onComplete?.(scoreRef.current);
  };

  const start = () => {
    stateRef.current = {
      maze: buildMaze(),
      px: 7, py: 7, // tile coords
      pxF: 7 * TILE, pyF: 7 * TILE, // pixel coords
      dir: { x: 0, y: 0 },
      nextDir: { x: 0, y: 0 },
      ghosts: [
        { x: 1 * TILE, y: 1 * TILE, color: '#ef4444', dir: { x: 1, y: 0 } },
        { x: 13 * TILE, y: 1 * TILE, color: '#f9a8d4', dir: { x: -1, y: 0 } },
        { x: 1 * TILE, y: 13 * TILE, color: '#22d3ee', dir: { x: 1, y: 0 } },
        { x: 13 * TILE, y: 13 * TILE, color: '#fb923c', dir: { x: -1, y: 0 } },
      ].filter(g => {
        const tx = g.x / TILE, ty = g.y / TILE;
        return MAZE_TEMPLATE[ty] && MAZE_TEMPLATE[ty][tx] !== '1';
      }),
      mouthAngle: 0,
      anim: 0,
    };
    scoreRef.current = 0;
    setScore(0);
    resetTime(60);
    setGameState('playing');
  };

  useEffect(() => {
    const handler = (e) => {
      if (!stateRef.current) return;
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') s.nextDir = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' || e.key === 's') s.nextDir = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' || e.key === 'a') s.nextDir = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' || e.key === 'd') s.nextDir = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const setDir = (x, y) => {
    if (stateRef.current) stateRef.current.nextDir = { x, y };
  };

  // Touch swipe
  useEffect(() => {
    let startX = 0, startY = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ts = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const te = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
      else setDir(0, dy > 0 ? 1 : -1);
    };
    canvas.addEventListener('touchstart', ts);
    canvas.addEventListener('touchend', te);
    return () => {
      canvas.removeEventListener('touchstart', ts);
      canvas.removeEventListener('touchend', te);
    };
  }, [gameState]);

  const isWall = (maze, tx, ty) => {
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
    return maze[ty][tx] === 1;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    const SPEED = 2;

    const tick = () => {
      const s = stateRef.current;
      if (!s) return;
      s.anim += 1;

      // Pacman: change direction at tile boundary
      const onTile = s.pxF % TILE === 0 && s.pyF % TILE === 0;
      if (onTile) {
        const tx = s.pxF / TILE;
        const ty = s.pyF / TILE;
        // try next dir
        if (!isWall(s.maze, tx + s.nextDir.x, ty + s.nextDir.y)) {
          s.dir = { ...s.nextDir };
        }
        // collide check current dir
        if (isWall(s.maze, tx + s.dir.x, ty + s.dir.y)) {
          s.dir = { x: 0, y: 0 };
        }
        // eat dot
        if (s.maze[ty][tx] === 2) {
          s.maze[ty][tx] = 0;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          playChomp();
        }
        // win condition - new maze
        if (!s.maze.some(row => row.includes(2))) {
          s.maze = buildMaze();
          scoreRef.current += 200;
          setScore(scoreRef.current);
        }
      }
      s.pxF += s.dir.x * SPEED;
      s.pyF += s.dir.y * SPEED;
      s.mouthAngle = Math.abs(Math.sin(s.anim * 0.15)) * 0.4;

      // Ghosts
      const GHOST_SPEED = 2; // matches player speed; TILE(28) % SPEED(2) === 0 keeps grid alignment
      s.ghosts.forEach(g => {
        const gOnTile = Math.abs(g.x - Math.round(g.x / TILE) * TILE) < 0.01 &&
                        Math.abs(g.y - Math.round(g.y / TILE) * TILE) < 0.01;
        if (gOnTile) {
          // snap to grid to prevent drift
          g.x = Math.round(g.x / TILE) * TILE;
          g.y = Math.round(g.y / TILE) * TILE;
          const gx = g.x / TILE;
          const gy = g.y / TILE;
          // valid (non-wall) directions
          const allDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
          const valid = allDirs.filter(d => !isWall(s.maze, gx + d.x, gy + d.y));
          // prefer not to reverse, unless it's the only option
          const nonReverse = valid.filter(d => !(d.x === -g.dir.x && d.y === -g.dir.y));
          const opts = nonReverse.length > 0 ? nonReverse : valid;
          if (opts.length > 0) {
            const ptx = s.pxF / TILE;
            const pty = s.pyF / TILE;
            opts.sort((a, b) => {
              const da = Math.abs(gx + a.x - ptx) + Math.abs(gy + a.y - pty);
              const db = Math.abs(gx + b.x - ptx) + Math.abs(gy + b.y - pty);
              return da - db;
            });
            g.dir = Math.random() < 0.7 ? opts[0] : opts[Math.floor(Math.random() * opts.length)];
          } else {
            g.dir = { x: 0, y: 0 };
          }
        }
        g.x += g.dir.x * GHOST_SPEED;
        g.y += g.dir.y * GHOST_SPEED;

        // safety clamp - never let ghost escape the board
        g.x = Math.max(TILE, Math.min((COLS - 2) * TILE, g.x));
        g.y = Math.max(TILE, Math.min((ROWS - 2) * TILE, g.y));

        // collision with pacman
        if (Math.abs(g.x - s.pxF) < TILE * 0.7 && Math.abs(g.y - s.pyF) < TILE * 0.7) {
          playExplosion();
          endGame();
        }
      });

      // Render
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      // Maze
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const v = s.maze[y][x];
          if (v === 1) {
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
          } else if (v === 2) {
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.arc(x * TILE + TILE/2, y * TILE + TILE/2, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      // Pacman
      ctx.fillStyle = '#facc15';
      const cx = s.pxF + TILE/2;
      const cy = s.pyF + TILE/2;
      const angle = Math.atan2(s.dir.y, s.dir.x);
      ctx.beginPath();
      ctx.arc(cx, cy, TILE/2 - 2, angle + s.mouthAngle, angle - s.mouthAngle + Math.PI * 2);
      ctx.lineTo(cx, cy);
      ctx.fill();

      // Ghosts
      s.ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        const gcx = g.x + TILE/2;
        const gcy = g.y + TILE/2;
        ctx.beginPath();
        ctx.arc(gcx, gcy - 2, TILE/2 - 3, Math.PI, 0);
        ctx.lineTo(gcx + TILE/2 - 3, gcy + TILE/2 - 4);
        ctx.lineTo(gcx + TILE/4, gcy + TILE/2 - 8);
        ctx.lineTo(gcx, gcy + TILE/2 - 4);
        ctx.lineTo(gcx - TILE/4, gcy + TILE/2 - 8);
        ctx.lineTo(gcx - TILE/2 + 3, gcy + TILE/2 - 4);
        ctx.fill();
        // eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(gcx - 6, gcy - 4, 4, 5);
        ctx.fillRect(gcx + 2, gcy - 4, 4, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(gcx - 5 + g.dir.x * 2, gcy - 3 + g.dir.y * 2, 2, 3);
        ctx.fillRect(gcx + 3 + g.dir.x * 2, gcy - 3 + g.dir.y * 2, 2, 3);
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  return (
    <div className="w-full">
      <GameHUD score={score} time={time} color="yellow" />
      <div className="relative w-full max-w-[640px] mx-auto border-2 border-neon-yellow/50 rounded overflow-hidden bg-black"
           style={{ aspectRatio: `${W}/${H}`, boxShadow: '0 0 30px rgba(250, 204, 21, 0.4)' }}>
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-full pixelated" />
        <GameOverlay
          state={gameState}
          score={score}
          color="yellow"
          onStart={start}
          onRestart={start}
          onNext={() => onComplete?.(scoreRef.current, true)}
          controls="Use as setas ou WASD. No mobile, deslize na tela. Coma todos os pontos!"
        />
      </div>
    </div>
  );
}