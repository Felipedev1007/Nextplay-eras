import React, { useEffect, useRef, useState } from 'react';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import { useCountdown } from './useGameLoop';
import { playGunshot, playExplosion } from '@/lib/sound';

const W = 640, H = 400;

// 2D top-down FPS-style: player at center, rotates with mouse, targets pop up
// Visual: first-person crosshair view + a small minimap; targets are 3D-looking blocks rendered as scaled rectangles based on distance.
export default function FPSGame({ onComplete }) {
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

  const spawnTarget = () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 200 + Math.random() * 200;
    return {
      x: 320 + Math.cos(angle) * dist,
      y: 200 + Math.sin(angle) * dist,
      hp: 1,
      hit: false,
      spawnTime: performance.now(),
      type: Math.random() < 0.2 ? 'bonus' : 'normal',
    };
  };

  const start = () => {
    stateRef.current = {
      angle: 0, // player look angle
      crossX: W/2,
      crossY: H/2,
      targets: Array.from({ length: 3 }, spawnTarget),
      ammo: 30,
      muzzle: 0,
      kickback: 0,
      hits: 0,
      misses: 0,
    };
    scoreRef.current = 0;
    setScore(0);
    resetTime(60);
    setGameState('playing');
  };

  // Mouse aim
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      stateRef.current.crossX = Math.max(0, Math.min(W, x));
      stateRef.current.crossY = Math.max(0, Math.min(H, y));
    };
    const touchMove = (e) => {
      if (e.touches[0]) move({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    };
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('touchmove', touchMove, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('touchmove', touchMove);
    };
  }, [gameState]);

  const shoot = (e) => {
    if (gameState !== 'playing') return;
    if (e) e.preventDefault();
    const s = stateRef.current;
    if (!s || s.ammo <= 0) return;
    s.ammo -= 1;
    s.muzzle = 6;
    s.kickback = 8;
    playGunshot();

    // Hit detection: targets within radius of crosshair
    let hit = false;
    s.targets.forEach(t => {
      if (t.hit) return;
      const size = 60; // visual hitbox radius
      if (Math.abs(t.x - s.crossX) < size/2 && Math.abs(t.y - s.crossY) < size/2) {
        t.hit = true;
        t.hp = 0;
        s.hits += 1;
        const points = t.type === 'bonus' ? 200 : 100;
        scoreRef.current += points;
        setScore(scoreRef.current);
        playExplosion();
        hit = true;
      }
    });
    if (!hit) s.misses += 1;
  };

  // Keyboard reload
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        if (stateRef.current) stateRef.current.ammo = 30;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const tick = () => {
      const s = stateRef.current;
      if (!s) return;

      // Replace dead targets after a delay
      const now = performance.now();
      s.targets = s.targets.map(t => {
        if (t.hit && now - t.spawnTime > 0) return spawnTarget();
        if (now - t.spawnTime > 4000) {
          // missed - they leave
          return spawnTarget();
        }
        return t;
      });

      s.muzzle = Math.max(0, s.muzzle - 0.5);
      s.kickback = Math.max(0, s.kickback - 0.5);

      // Render: industrial CS-style scene
      // Floor / wall split
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, W, H/2);
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, H/2, W, H/2);
      // Wall texture lines
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i + 1) * H/16);
        ctx.lineTo(W, (i + 1) * H/16);
        ctx.stroke();
      }
      // Perspective floor lines
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(W/2, H/2);
        ctx.lineTo(i * (W/9), H);
        ctx.strokeStyle = '#1f2937';
        ctx.stroke();
      }
      // Horizon glow
      const grd = ctx.createLinearGradient(0, H/2 - 10, 0, H/2 + 10);
      grd.addColorStop(0, 'rgba(168, 85, 247, 0)');
      grd.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
      grd.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, H/2 - 10, W, 20);

      // Targets
      s.targets.forEach(t => {
        if (t.hit) return;
        const age = now - t.spawnTime;
        const fadeIn = Math.min(1, age / 200);
        const size = 50;
        ctx.fillStyle = t.type === 'bonus' ? `rgba(250, 204, 21, ${fadeIn})` : `rgba(168, 85, 247, ${fadeIn})`;
        ctx.fillRect(t.x - size/2, t.y - size/2, size, size);
        // Bullseye ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${fadeIn * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, size/2 - 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(239, 68, 68, ${fadeIn})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
        ctx.fill();
        // Timer ring
        const remaining = Math.max(0, 1 - age / 4000);
        ctx.strokeStyle = `rgba(34, 211, 238, ${fadeIn})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, size/2 + 4, -Math.PI/2, -Math.PI/2 + remaining * Math.PI * 2);
        ctx.stroke();
      });

      // Gun (bottom right)
      ctx.save();
      ctx.translate(W - 120, H + s.kickback);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-30, -120, 60, 80);
      ctx.fillStyle = '#374151';
      ctx.fillRect(-25, -110, 50, 60);
      ctx.fillStyle = '#111827';
      ctx.fillRect(-8, -180, 16, 70);
      // Muzzle flash
      if (s.muzzle > 0) {
        ctx.fillStyle = `rgba(250, 204, 21, ${s.muzzle / 6})`;
        ctx.beginPath();
        ctx.arc(0, -190, 16 + s.muzzle * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${s.muzzle / 6})`;
        ctx.beginPath();
        ctx.arc(0, -190, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Crosshair
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      const c = 12;
      ctx.beginPath();
      ctx.moveTo(s.crossX - c, s.crossY); ctx.lineTo(s.crossX - 4, s.crossY);
      ctx.moveTo(s.crossX + 4, s.crossY); ctx.lineTo(s.crossX + c, s.crossY);
      ctx.moveTo(s.crossX, s.crossY - c); ctx.lineTo(s.crossX, s.crossY - 4);
      ctx.moveTo(s.crossX, s.crossY + 4); ctx.lineTo(s.crossX, s.crossY + c);
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(s.crossX - 1, s.crossY - 1, 2, 2);

      // HUD: ammo
      ctx.fillStyle = '#000';
      ctx.fillRect(10, H - 40, 110, 30);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, H - 40, 110, 30);
      ctx.fillStyle = '#22c55e';
      ctx.font = '14px monospace';
      ctx.fillText(`AMMO ${s.ammo}/30`, 20, H - 20);

      // Kill feed accuracy
      const totalShots = s.hits + s.misses;
      const accuracy = totalShots > 0 ? Math.round((s.hits / totalShots) * 100) : 0;
      ctx.fillStyle = '#fff';
      ctx.fillText(`ACC ${accuracy}%`, W - 100, 20);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  return (
    <div className="w-full">
      <GameHUD score={score} time={time} color="purple" />
      <div className="relative w-full max-w-[640px] mx-auto aspect-[640/400] border-2 border-neon-purple/50 rounded overflow-hidden bg-black"
           style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-full cursor-crosshair touch-none"
          onClick={shoot}
          onTouchEnd={shoot}
        />
        <GameOverlay
          state={gameState}
          score={score}
          color="purple"
          onStart={start}
          onRestart={start}
          onNext={() => onComplete?.(scoreRef.current, true)}
          controls="Mire com o mouse / dedo. CLIQUE para atirar. Tecla R para recarregar."
        />
      </div>
    </div>
  );
}