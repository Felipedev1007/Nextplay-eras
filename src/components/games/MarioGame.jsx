import React, { useEffect, useRef, useState } from 'react';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import { useCountdown } from './useGameLoop';
import { playJump, playCoin, playExplosion } from '@/lib/sound';

const W = 640, H = 360;
const GROUND = H - 50;
const GRAVITY = 0.6;

// Procedurally seeded level segments
const buildLevel = () => {
  const platforms = [];
  const coins = [];
  const enemies = [];
  for (let i = 0; i < 30; i++) {
    const x = 400 + i * 250 + Math.random() * 100;
    const y = GROUND - 70 - Math.random() * 50;
    platforms.push({ x, y, w: 80 + Math.random() * 60, h: 14 });
    coins.push({ x: x + 20, y: y - 30, taken: false });
    coins.push({ x: x + 50, y: y - 30, taken: false });
    if (i % 2 === 0) {
      enemies.push({ x: x + 100 + Math.random() * 200, y: GROUND - 28, w: 28, h: 28, dir: -1, alive: true });
    }
  }
  // ground gaps - actually just use solid ground for simplicity
  return { platforms, coins, enemies };
};

export default function MarioGame({ onComplete }) {
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
    const level = buildLevel();
    stateRef.current = {
      px: 80, py: GROUND - 32,
      vx: 0, vy: 0,
      onGround: true,
      camX: 0,
      keys: { left: false, right: false, jump: false },
      ...level,
      anim: 0,
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
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { s.keys.jump = true; e.preventDefault(); }
    };
    const up = (e) => {
      if (!stateRef.current) return;
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') s.keys.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') s.keys.jump = false;
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
    const PW = 28, PH = 32;

    const tick = () => {
      const s = stateRef.current;
      if (!s) return;
      s.anim += 1;

      // Movement
      if (s.keys.left) s.vx = -2.6;
      else if (s.keys.right) s.vx = 2.6;
      else s.vx *= 0.8;

      if (s.keys.jump && s.onGround) {
        s.vy = -12;
        s.onGround = false;
        playJump();
      }

      s.vy += GRAVITY;
      s.px += s.vx;
      s.py += s.vy;

      // Ground collision
      if (s.py + PH >= GROUND) {
        s.py = GROUND - PH;
        s.vy = 0;
        s.onGround = true;
      }

      // Platform collision (top only)
      s.platforms.forEach(p => {
        if (s.px + PW > p.x && s.px < p.x + p.w &&
            s.py + PH >= p.y && s.py + PH <= p.y + p.h + 8 &&
            s.vy >= 0) {
          s.py = p.y - PH;
          s.vy = 0;
          s.onGround = true;
        }
      });

      // Camera follows player
      s.camX = Math.max(0, s.px - W / 3);

      // Coin collection
      s.coins.forEach(c => {
        if (!c.taken && Math.abs(c.x - (s.px + PW/2)) < 18 && Math.abs(c.y - (s.py + PH/2)) < 22) {
          c.taken = true;
          scoreRef.current += 50;
          setScore(scoreRef.current);
          playCoin();
        }
      });

      // Enemy AI + collision
      s.enemies.forEach(e => {
        if (!e.alive) return;
        e.x += e.dir * 1.2;
        if (Math.random() < 0.005) e.dir *= -1;

        // Collision with player
        if (s.px + PW > e.x && s.px < e.x + e.w &&
            s.py + PH > e.y && s.py < e.y + e.h) {
          if (s.vy > 0 && s.py + PH - e.y < 16) {
            // Stomp - mata inimigo
            e.alive = false;
            s.vy = -8;
            scoreRef.current += 100;
            setScore(scoreRef.current);
            playCoin();
          } else {
            // Encostou de frente - game over
            playExplosion();
            endGame();
          }
        }
      });

      // Render
      // Sky gradient
      const grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#7dd3fc');
      grd.addColorStop(1, '#bae6fd');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Clouds (parallax)
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 200 - s.camX * 0.3) % (W + 200)) - 100;
        const cy = 40 + (i % 2) * 30;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy - 6, 14, 0, Math.PI * 2);
        ctx.arc(cx + 32, cy, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hills (parallax)
      ctx.fillStyle = '#16a34a';
      for (let i = 0; i < 8; i++) {
        const hx = ((i * 280 - s.camX * 0.5) % (W + 400)) - 200;
        ctx.beginPath();
        ctx.arc(hx, GROUND, 100, Math.PI, 0);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(-s.camX, 0);

      // Ground
      ctx.fillStyle = '#a16207';
      ctx.fillRect(s.camX, GROUND, W, H - GROUND);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(s.camX, GROUND - 4, W, 6);
      // Bricks pattern
      ctx.fillStyle = '#854d0e';
      for (let bx = Math.floor(s.camX / 32) * 32; bx < s.camX + W; bx += 32) {
        ctx.fillRect(bx, GROUND + 8, 30, 6);
        ctx.fillRect(bx, GROUND + 24, 30, 6);
      }

      // Platforms
      s.platforms.forEach(p => {
        if (p.x + p.w < s.camX || p.x > s.camX + W) return;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(p.x, p.y, p.w, 3);
      });

      // Coins
      s.coins.forEach(c => {
        if (c.taken) return;
        if (c.x < s.camX - 20 || c.x > s.camX + W) return;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8 + Math.sin(s.anim * 0.1) * 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(c.x - 1, c.y - 5, 2, 10);
      });

      // Enemies (Goombas)
      s.enemies.forEach(e => {
        if (!e.alive) return;
        if (e.x + e.w < s.camX || e.x > s.camX + W) return;
        ctx.fillStyle = '#92400e';
        ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(e.x + 5, e.y + 8, 6, 6);
        ctx.fillRect(e.x + 17, e.y + 8, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x + 7, e.y + 10, 3, 3);
        ctx.fillRect(e.x + 19, e.y + 10, 3, 3);
      });

      // Player (Mario-like)
      const facing = s.vx >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(s.px + PW/2, s.py);
      ctx.scale(facing, 1);
      // Hat
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-PW/2 + 4, 0, PW - 8, 8);
      ctx.fillRect(-PW/2 + 8, 4, PW - 16, 4);
      // Face
      ctx.fillStyle = '#fbcfa6';
      ctx.fillRect(-PW/2 + 6, 8, PW - 12, 8);
      // Eye
      ctx.fillStyle = '#000';
      ctx.fillRect(2, 10, 2, 3);
      // Body (overalls)
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-PW/2 + 4, 16, PW - 8, 12);
      // Shirt sleeves
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-PW/2, 16, 4, 8);
      ctx.fillRect(PW/2 - 4, 16, 4, 8);
      // Legs
      ctx.fillStyle = '#1d4ed8';
      const legPhase = Math.floor(s.anim / 6) % 2;
      ctx.fillRect(-PW/2 + 4, 28, 8, 4);
      ctx.fillRect(PW/2 - 12, 28, 8, 4);
      // Shoes
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-PW/2 + 2 + (s.onGround ? legPhase * 2 : 0), 30, 10, 3);
      ctx.fillRect(PW/2 - 12 - (s.onGround ? legPhase * 2 : 0), 30, 10, 3);
      ctx.restore();

      ctx.restore();

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  return (
    <div className="w-full">
      <GameHUD score={score} time={time} color="pink" />
      <div className="relative w-full max-w-[640px] mx-auto aspect-[640/360] border-2 border-neon-pink/50 glow-pink rounded overflow-hidden bg-sky-300">
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-full pixelated" />
        <GameOverlay
          state={gameState}
          score={score}
          color="pink"
          onStart={start}
          onRestart={start}
          onNext={() => onComplete?.(scoreRef.current, true)}
          controls="← → para mover, ESPAÇO/↑ para pular. Pegue moedas e pule nos inimigos!"
        />
      </div>
      <div className="flex md:hidden justify-between max-w-[640px] mx-auto mt-3 gap-2 px-2">
        <button
          onTouchStart={() => touchControl('left', true)} onTouchEnd={() => touchControl('left', false)}
          className="flex-1 py-3 bg-neon-pink/20 border border-neon-pink text-neon-pink font-pixel text-xs rounded">←</button>
        <button
          onTouchStart={() => touchControl('right', true)} onTouchEnd={() => touchControl('right', false)}
          className="flex-1 py-3 bg-neon-pink/20 border border-neon-pink text-neon-pink font-pixel text-xs rounded">→</button>
        <button
          onTouchStart={() => touchControl('jump', true)} onTouchEnd={() => touchControl('jump', false)}
          className="flex-1 py-3 bg-neon-yellow/20 border border-neon-yellow text-neon-yellow font-pixel text-xs rounded">PULO</button>
      </div>
    </div>
  );
}