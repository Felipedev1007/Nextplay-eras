import React, { useEffect, useRef, useState } from 'react';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import { useCountdown } from './useGameLoop';
import { playPongHit, playPongScore } from '@/lib/sound';

const W = 640, H = 400;
const PADDLE_W = 8, PADDLE_H = 70;
const BALL_SIZE = 10;

export default function PongGame({ onComplete }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    py: H/2 - PADDLE_H/2,
    cy: H/2 - PADDLE_H/2,
    bx: W/2, by: H/2,
    vx: 4, vy: 3,
    keys: { up: false, down: false },
  });
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle | playing | over
  const scoreRef = useRef(0);
  const [time, resetTime] = useCountdown(60, gameState === 'playing', () => endGame());

  const endGame = () => {
    setGameState('over');
    onComplete?.(scoreRef.current);
  };

  const start = () => {
    stateRef.current = {
      py: H/2 - PADDLE_H/2, cy: H/2 - PADDLE_H/2,
      bx: W/2, by: H/2, vx: 4, vy: 3,
      keys: { up: false, down: false },
    };
    scoreRef.current = 0;
    setScore(0);
    resetTime(60);
    setGameState('playing');
  };

  // Input
  useEffect(() => {
    const down = (e) => {
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') s.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') s.keys.down = true;
    };
    const up = (e) => {
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') s.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') s.keys.down = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Touch / mouse
  const handleMove = (clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = H / rect.height;
    const y = (clientY - rect.top) * ratio;
    stateRef.current.py = Math.max(0, Math.min(H - PADDLE_H, y - PADDLE_H/2));
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const tick = () => {
      const s = stateRef.current;

      // Player paddle keys
      if (s.keys.up) s.py = Math.max(0, s.py - 6);
      if (s.keys.down) s.py = Math.min(H - PADDLE_H, s.py + 6);

      // CPU AI (slightly imperfect)
      const target = s.by - PADDLE_H/2;
      const diff = target - s.cy;
      const cpuSpeed = 3.5;
      if (Math.abs(diff) > cpuSpeed) s.cy += Math.sign(diff) * cpuSpeed;
      s.cy = Math.max(0, Math.min(H - PADDLE_H, s.cy));

      // Ball
      s.bx += s.vx;
      s.by += s.vy;
      if (s.by <= 0 || s.by >= H - BALL_SIZE) { s.vy *= -1; playPongHit(); }

      // Player paddle collision
      if (s.bx <= 20 + PADDLE_W && s.bx >= 20 && s.by + BALL_SIZE >= s.py && s.by <= s.py + PADDLE_H && s.vx < 0) {
        s.vx = Math.abs(s.vx) * 1.05;
        const hit = (s.by - (s.py + PADDLE_H/2)) / (PADDLE_H/2);
        s.vy = hit * 5;
        scoreRef.current += 10;
        setScore(scoreRef.current);
        playPongHit();
      }
      // CPU paddle collision
      if (s.bx + BALL_SIZE >= W - 20 - PADDLE_W && s.bx + BALL_SIZE <= W - 20 && s.by + BALL_SIZE >= s.cy && s.by <= s.cy + PADDLE_H && s.vx > 0) {
        s.vx = -Math.abs(s.vx) * 1.05;
        playPongHit();
      }

      // Score / reset
      if (s.bx < -20) {
        s.bx = W/2; s.by = H/2; s.vx = 4; s.vy = 3;
        playPongScore();
      }
      if (s.bx > W + 20) {
        s.bx = W/2; s.by = H/2; s.vx = -4; s.vy = 3;
        scoreRef.current += 50;
        setScore(scoreRef.current);
        playPongScore();
      }

      // Cap speed
      const maxV = 12;
      s.vx = Math.max(-maxV, Math.min(maxV, s.vx));

      // Render
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      // Center dashed line
      for (let y = 0; y < H; y += 20) {
        ctx.fillRect(W/2 - 1, y, 2, 10);
      }
      ctx.fillRect(20, s.py, PADDLE_W, PADDLE_H);
      ctx.fillRect(W - 20 - PADDLE_W, s.cy, PADDLE_W, PADDLE_H);
      ctx.fillRect(s.bx, s.by, BALL_SIZE, BALL_SIZE);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  return (
    <div className="w-full">
      <GameHUD score={score} time={time} color="green" />
      <div className="relative w-full max-w-[640px] mx-auto aspect-[640/400] border-2 border-neon-green/50 glow-green rounded overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-full pixelated touch-none"
          onMouseMove={(e) => handleMove(e.clientY)}
          onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0].clientY); }}
        />
        <GameOverlay
          state={gameState}
          score={score}
          color="green"
          onStart={start}
          onRestart={start}
          onNext={() => onComplete?.(scoreRef.current, true)}
          controls="Use ↑ ↓ ou mova o mouse / dedo. Marque pontos derrotando o CPU."
        />
      </div>
    </div>
  );
}