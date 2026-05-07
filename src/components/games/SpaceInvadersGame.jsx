import React, { useEffect, useRef, useState } from 'react';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import { useCountdown } from './useGameLoop';
import { playLaser, playExplosion } from '@/lib/sound';

const W = 640, H = 480;

export default function SpaceInvadersGame({ onComplete }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const scoreRef = useRef(0);
  const [time, resetTime] = useCountdown(60, gameState === 'playing', () => endGame());

  const initEnemies = () => {
    const enemies = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        enemies.push({ x: 60 + c * 60, y: 50 + r * 40, alive: true, type: r });
      }
    }
    return enemies;
  };

  const endGame = () => {
    setGameState('over');
    onComplete?.(scoreRef.current);
  };

  const start = () => {
    stateRef.current = {
      px: W/2 - 20,
      enemies: initEnemies(),
      bullets: [],
      enemyBullets: [],
      eDir: 1,
      eSpeed: 0.5,
      lastShot: 0,
      keys: { left: false, right: false, shoot: false },
      lives: 3,
    };
    scoreRef.current = 0;
    setScore(0);
    resetTime(60);
    setGameState('playing');
  };

  useEffect(() => {
    const down = (e) => {
      if (!stateRef.current) return;
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') s.keys.right = true;
      if (e.key === ' ') { s.keys.shoot = true; e.preventDefault(); }
    };
    const up = (e) => {
      if (!stateRef.current) return;
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') s.keys.right = false;
      if (e.key === ' ') s.keys.shoot = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const touchControl = (action, value) => {
    if (!stateRef.current) return;
    stateRef.current.keys[action] = value;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const tick = () => {
      const s = stateRef.current;
      if (!s) return;

      // Player movement
      if (s.keys.left) s.px = Math.max(0, s.px - 5);
      if (s.keys.right) s.px = Math.min(W - 40, s.px + 5);

      // Shoot
      const now = performance.now();
      if (s.keys.shoot && now - s.lastShot > 300) {
        s.bullets.push({ x: s.px + 18, y: H - 60, vy: -8 });
        s.lastShot = now;
        playLaser();
      }

      // Enemy movement
      let edge = false;
      s.enemies.forEach(e => {
        if (!e.alive) return;
        e.x += s.eDir * s.eSpeed;
        if (e.x <= 10 || e.x >= W - 50) edge = true;
      });
      if (edge) {
        s.eDir *= -1;
        s.enemies.forEach(e => { if (e.alive) e.y += 15; });
      }

      // Enemy shoot
      if (Math.random() < 0.02) {
        const alive = s.enemies.filter(e => e.alive);
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          s.enemyBullets.push({ x: shooter.x + 15, y: shooter.y + 20, vy: 4 });
        }
      }

      // Bullets
      s.bullets = s.bullets.filter(b => { b.y += b.vy; return b.y > -10; });
      s.enemyBullets = s.enemyBullets.filter(b => { b.y += b.vy; return b.y < H + 10; });

      // Bullet vs enemy
      s.bullets.forEach(b => {
        s.enemies.forEach(e => {
          if (e.alive && b.x > e.x && b.x < e.x + 30 && b.y > e.y && b.y < e.y + 20) {
            e.alive = false;
            b.y = -100;
            scoreRef.current += [40, 30, 20, 10][e.type] || 10;
            setScore(scoreRef.current);
            playExplosion();
          }
        });
      });

      // Enemy bullet vs player
      s.enemyBullets.forEach(b => {
        if (b.x > s.px && b.x < s.px + 40 && b.y > H - 60 && b.y < H - 30) {
          b.y = H + 100;
          s.lives -= 1;
          playExplosion();
          if (s.lives <= 0) endGame();
        }
      });

      // Vitória: todos os inimigos eliminados
      if (s.enemies.every(e => !e.alive)) {
        scoreRef.current += 500 + time * 10; // bônus de vitória + tempo restante
        setScore(scoreRef.current);
        endGame();
        return;
      }

      // Render
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const x = (i * 137) % W;
        const y = ((i * 71) + (now / 50)) % H;
        ctx.fillRect(x, y, 1, 1);
      }

      // Player
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(s.px, H - 50, 40, 20);
      ctx.fillRect(s.px + 16, H - 60, 8, 10);

      // Enemies
      const colors = ['#ec4899', '#a855f7', '#22d3ee', '#10b981'];
      s.enemies.forEach(e => {
        if (!e.alive) return;
        ctx.fillStyle = colors[e.type];
        ctx.fillRect(e.x, e.y, 30, 20);
        ctx.fillRect(e.x + 5, e.y - 5, 5, 5);
        ctx.fillRect(e.x + 20, e.y - 5, 5, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x + 8, e.y + 8, 4, 4);
        ctx.fillRect(e.x + 18, e.y + 8, 4, 4);
      });

      // Bullets
      ctx.fillStyle = '#22d3ee';
      s.bullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 10));
      ctx.fillStyle = '#ec4899';
      s.enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 8));

      // Lives
      ctx.fillStyle = '#22d3ee';
      ctx.font = '14px monospace';
      ctx.fillText(`LIVES: ${s.lives}`, 10, 20);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  return (
    <div className="w-full">
      <GameHUD score={score} time={time} color="cyan" />
      <div className="relative w-full max-w-[640px] mx-auto aspect-[640/480] border-2 border-neon-cyan/50 glow-cyan rounded overflow-hidden bg-black">
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-full pixelated" />
        <GameOverlay
          state={gameState}
          score={score}
          color="cyan"
          onStart={start}
          onRestart={start}
          onNext={() => onComplete?.(scoreRef.current, true)}
          controls="← → para mover, ESPAÇO para atirar. No mobile use os botões abaixo."
        />
      </div>
      {/* Mobile controls */}
      <div className="flex md:hidden justify-between max-w-[640px] mx-auto mt-3 gap-2 px-2">
        <button
          onTouchStart={() => touchControl('left', true)} onTouchEnd={() => touchControl('left', false)}
          className="flex-1 py-3 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-pixel text-xs rounded">←</button>
        <button
          onTouchStart={() => touchControl('shoot', true)} onTouchEnd={() => touchControl('shoot', false)}
          className="flex-1 py-3 bg-neon-pink/20 border border-neon-pink text-neon-pink font-pixel text-xs rounded">FIRE</button>
        <button
          onTouchStart={() => touchControl('right', true)} onTouchEnd={() => touchControl('right', false)}
          className="flex-1 py-3 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-pixel text-xs rounded">→</button>
      </div>
    </div>
  );
}