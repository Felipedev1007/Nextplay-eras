import React, { useEffect, useRef, useState } from 'react';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import { useCountdown } from './useGameLoop';
import { playGunshot, playExplosion } from '@/lib/sound';

const W = 640, H = 400;
const HORIZON = H * 0.55;

// Posições "no mundo" onde inimigos podem surgir (atrás de coberturas no mapa)
const SPAWN_POINTS = [
  { x: 140, depth: 0.45 }, // longe esquerda
  { x: 260, depth: 0.35 }, // muito longe centro-esq
  { x: 380, depth: 0.40 }, // longe centro-dir
  { x: 500, depth: 0.55 }, // médio direita
  { x: 200, depth: 0.65 }, // perto esquerda
  { x: 440, depth: 0.70 }, // perto direita
];

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

  const spawnEnemy = () => {
    const sp = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
    // tamanho do inimigo baseado em "profundidade" (perspectiva)
    const scale = 0.4 + sp.depth * 1.1;
    const baseY = HORIZON + (H - HORIZON) * sp.depth;
    return {
      worldX: sp.x + (Math.random() - 0.5) * 30,
      baseY,
      scale,
      depth: sp.depth,
      hp: 1,
      hit: false,
      bonus: Math.random() < 0.18,
      spawnTime: performance.now(),
      lifetime: 2200 + Math.random() * 1500,
      popOffset: 0, // 0 = totalmente atrás da cobertura, 1 = exposto
    };
  };

  const start = () => {
    stateRef.current = {
      crossX: W / 2,
      crossY: H / 2,
      enemies: [spawnEnemy(), spawnEnemy()],
      bullets: [],
      bloodSplats: [],
      smokeParticles: [],
      shells: [],
      ammo: 30,
      reloading: false,
      reloadStart: 0,
      muzzle: 0,
      kickback: 0,
      hits: 0,
      misses: 0,
      lastShot: 0,
      breathPhase: 0,
      cameraX: 0,    // posição lateral do jogador no mundo
      walkPhase: 0,  // animação de balanço ao andar
      keys: { left: false, right: false },
    };
    scoreRef.current = 0;
    setScore(0);
    resetTime(60);
    setGameState('playing');
  };

  // Mira via mouse / toque
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

  const startReload = () => {
    const s = stateRef.current;
    if (!s || s.reloading || s.ammo === 30) return;
    s.reloading = true;
    s.reloadStart = performance.now();
  };

  const shoot = (e) => {
    if (gameState !== 'playing') return;
    if (e) e.preventDefault();
    const s = stateRef.current;
    if (!s || s.reloading) return;
    if (s.ammo <= 0) {
      startReload();
      return;
    }
    const now = performance.now();
    if (now - s.lastShot < 90) return; // rate of fire
    s.lastShot = now;
    s.ammo -= 1;
    s.muzzle = 8;
    s.kickback = 12;
    playGunshot();

    // Cápsulas ejetadas (duas, uma por cano)
    s.shells.push({
      x: W / 2 - 5, y: H - 115,
      vx: -2 - Math.random() * 1.5, vy: -4 - Math.random() * 2,
      rot: 0, vrot: -0.4, life: 60,
    });
    s.shells.push({
      x: W / 2 + 20, y: H - 115,
      vx: 2 + Math.random() * 1.5, vy: -4 - Math.random() * 2,
      rot: 0, vrot: 0.4, life: 60,
    });
    // Fumacinha dos dois canos
    for (let i = 0; i < 5; i++) {
      const fromLeft = i % 2 === 0;
      s.smokeParticles.push({
        x: W / 2 + (fromLeft ? -11 : 23) + (Math.random() - 0.5) * 8,
        y: H - 165 + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -1 - Math.random() * 0.7,
        life: 40 + Math.random() * 20,
        size: 6 + Math.random() * 5,
      });
    }

    // Hit detection
    let hit = false;
    s.enemies.forEach(en => {
      if (en.hit || en.popOffset < 0.3) return;
      // Hitbox do inimigo na tela (usa screenX calculado no último render)
      const ex = en.screenX != null ? en.screenX : en.worldX;
      const ey = en.baseY;
      const w = 36 * en.scale;
      const h = 80 * en.scale;
      const headY = ey - h;
      const bodyTop = headY + h * 0.22;
      // recorta pelo popOffset (parte visível acima da cobertura)
      const visibleTop = ey - h * en.popOffset;
      // crosshair com pequeno spread baseado em rate
      const sx = s.crossX, sy = s.crossY;
      if (sx > ex - w / 2 && sx < ex + w / 2 && sy > visibleTop && sy < ey) {
        en.hit = true;
        s.hits += 1;
        // Headshot?
        const isHead = sy < bodyTop && visibleTop < bodyTop;
        const points = (en.bonus ? 200 : 100) * (isHead ? 2 : 1);
        scoreRef.current += points;
        setScore(scoreRef.current);
        playExplosion();
        // Sangue
        for (let i = 0; i < 12; i++) {
          s.bloodSplats.push({
            x: sx + (Math.random() - 0.5) * 10,
            y: sy + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 1,
            size: 2 + Math.random() * 3,
            life: 40 + Math.random() * 20,
          });
        }
        en.deathHead = isHead;
        hit = true;
      }
    });
    if (!hit) s.misses += 1;
  };

  // Recarga R + movimento A/D
  useEffect(() => {
    const down = (e) => {
      const s = stateRef.current;
      if (e.key === 'r' || e.key === 'R') startReload();
      if (!s) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') s.keys.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') s.keys.right = true;
    };
    const up = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') s.keys.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') s.keys.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const touchMove = (action, value) => {
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
      const now = performance.now();
      s.breathPhase += 0.04;

      // Movimento lateral (A/D)
      const moveSpeed = 2.2;
      let moving = false;
      if (s.keys.left) { s.cameraX -= moveSpeed; moving = true; }
      if (s.keys.right) { s.cameraX += moveSpeed; moving = true; }
      if (moving) s.walkPhase += 0.18;

      // Recarga
      if (s.reloading && now - s.reloadStart > 1500) {
        s.ammo = 30;
        s.reloading = false;
      }

      // Atualiza inimigos (animação pop-up)
      s.enemies.forEach((en, i) => {
        const age = now - en.spawnTime;
        if (en.hit) {
          en.popOffset = Math.max(0, en.popOffset - 0.05);
        } else if (age < 300) {
          en.popOffset = Math.min(1, age / 300);
        } else if (age > en.lifetime - 300) {
          en.popOffset = Math.max(0, (en.lifetime - age) / 300);
        } else {
          en.popOffset = 1;
        }
      });
      // Substitui inimigos mortos/expirados
      s.enemies = s.enemies.map(en => {
        if (en.hit && en.popOffset <= 0) return spawnEnemy();
        if (now - en.spawnTime > en.lifetime) {
          // perdeu o tiro - penalidade leve
          return spawnEnemy();
        }
        return en;
      });
      // Garante 2-3 inimigos ativos
      while (s.enemies.length < 2) s.enemies.push(spawnEnemy());

      // Decay de efeitos
      s.muzzle = Math.max(0, s.muzzle - 0.6);
      s.kickback = Math.max(0, s.kickback - 0.8);
      s.bloodSplats = s.bloodSplats.filter(b => {
        b.x += b.vx; b.y += b.vy; b.vy += 0.15; b.life -= 1;
        return b.life > 0;
      });
      s.smokeParticles = s.smokeParticles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 1; p.size += 0.15;
        return p.life > 0;
      });
      s.shells = s.shells.filter(sh => {
        sh.x += sh.vx; sh.y += sh.vy; sh.vy += 0.4; sh.rot += sh.vrot; sh.life -= 1;
        return sh.life > 0;
      });

      // ============ RENDER ============

      // Céu
      const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
      sky.addColorStop(0, '#5b6b85');
      sky.addColorStop(1, '#c8a878');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, HORIZON);

      // Sol/poeira (parallax muito leve)
      const skyOffset = -((s.cameraX * 0.05) % W);
      ctx.fillStyle = 'rgba(255, 220, 150, 0.4)';
      ctx.beginPath();
      ctx.arc(W * 0.7 + skyOffset, HORIZON * 0.4, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(W * 0.7 + skyOffset + W, HORIZON * 0.4, 80, 0, Math.PI * 2);
      ctx.fill();

      // ===== Camada de prédios (parallax médio) - se repete =====
      ctx.save();
      const buildOffset = -((s.cameraX * 0.35) % W);
      ctx.translate(buildOffset, 0);
      // desenha 2 cópias para loop infinito
      for (let copy = 0; copy < 2; copy++) {
        const ox = copy * W;
      // Edifícios distantes (de_dust feel)
      ctx.fillStyle = '#9b7d52';
      // Construção esquerda
      ctx.fillRect(ox + 20, HORIZON - 70, 110, 70);
      ctx.fillStyle = '#7a6240';
      ctx.fillRect(ox + 20, HORIZON - 70, 110, 8);
      // Janelas
      ctx.fillStyle = '#3a2f20';
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.fillRect(ox + 35 + i * 30, HORIZON - 55 + j * 25, 14, 14);
        }
      }
      // Construção direita
      ctx.fillStyle = '#a88860';
      ctx.fillRect(ox + W - 160, HORIZON - 90, 140, 90);
      ctx.fillStyle = '#8a6d48';
      ctx.fillRect(ox + W - 160, HORIZON - 90, 140, 10);
      ctx.fillStyle = '#3a2f20';
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.fillRect(ox + W - 145 + i * 35, HORIZON - 75 + j * 25, 16, 14);
        }
      }
      // Construção centro distante
      ctx.fillStyle = '#8c7048';
      ctx.fillRect(ox + W / 2 - 80, HORIZON - 50, 160, 50);
      ctx.fillStyle = '#3a2f20';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(ox + W / 2 - 70 + i * 38, HORIZON - 38, 22, 12);
      }
      } // fim loop copies
      ctx.restore();

      // Chão arenoso com perspectiva
      const ground = ctx.createLinearGradient(0, HORIZON, 0, H);
      ground.addColorStop(0, '#b89668');
      ground.addColorStop(1, '#6b5235');
      ctx.fillStyle = ground;
      ctx.fillRect(0, HORIZON, W, H - HORIZON);

      // Linhas de perspectiva no chão (rolam com câmera para sensação de movimento)
      ctx.strokeStyle = 'rgba(80, 60, 40, 0.35)';
      ctx.lineWidth = 1;
      const groundShift = (s.cameraX * 0.6) % 90;
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(W / 2 - groundShift * 0.1, HORIZON);
        ctx.lineTo(W / 2 + i * 90 - groundShift, H);
        ctx.stroke();
      }
      // Linhas horizontais (profundidade)
      for (let i = 1; i <= 5; i++) {
        const t = i / 5;
        const y = HORIZON + (H - HORIZON) * Math.pow(t, 1.5);
        ctx.strokeStyle = `rgba(80, 60, 40, ${0.15 + t * 0.15})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Helper: wrap horizontal para parecer infinito
      const wrap = (x) => {
        const range = W * 1.5;
        let v = ((x - s.cameraX) % range + range) % range - range / 2 + W / 2;
        return v;
      };

      // Coberturas/barricadas (caixas de madeira) onde inimigos surgem
      SPAWN_POINTS.forEach(sp => {
        const baseY = HORIZON + (H - HORIZON) * sp.depth;
        const scale = 0.4 + sp.depth * 1.1;
        const w = 50 * scale;
        const h = 28 * scale;
        const x = wrap(sp.x);
        // sombra
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x - w / 2 + 3, baseY - 2, w, 4);
        // caixa
        ctx.fillStyle = '#6b4a28';
        ctx.fillRect(x - w / 2, baseY - h, w, h);
        ctx.fillStyle = '#8a6238';
        ctx.fillRect(x - w / 2, baseY - h, w, 4);
        // tábuas
        ctx.strokeStyle = '#3a2810';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - w / 2, baseY - h, w, h);
        ctx.beginPath();
        ctx.moveTo(x, baseY - h);
        ctx.lineTo(x, baseY);
        ctx.stroke();
      });

      // Inimigos (ordenados por profundidade - mais distantes primeiro)
      const sorted = [...s.enemies].sort((a, b) => a.depth - b.depth);
      sorted.forEach(en => {
        if (en.popOffset <= 0) return;
        en.screenX = wrap(en.worldX); // armazena para uso na hit detection
        const ex = en.screenX;
        const ey = en.baseY;
        const w = 36 * en.scale;
        const h = 80 * en.scale;
        const visibleH = h * en.popOffset;
        const top = ey - visibleH;

        ctx.save();
        // Clip para mostrar só a parte acima da cobertura
        ctx.beginPath();
        ctx.rect(ex - w / 2 - 4, top, w + 8, visibleH);
        ctx.clip();

        // Corpo do inimigo (terrorista estilo CS)
        const headR = w * 0.32;
        const headCY = ey - h + headR;
        // Pernas
        ctx.fillStyle = '#3a2f1f';
        ctx.fillRect(ex - w / 2 + 4, ey - h * 0.45, w * 0.35, h * 0.45);
        ctx.fillRect(ex + w / 2 - w * 0.35 - 4, ey - h * 0.45, w * 0.35, h * 0.45);
        // Torso (camuflagem)
        ctx.fillStyle = '#4a5c3a';
        ctx.fillRect(ex - w / 2, ey - h * 0.75, w, h * 0.32);
        // Manchas camuflagem
        ctx.fillStyle = '#3a4a2a';
        ctx.fillRect(ex - w * 0.3, ey - h * 0.7, w * 0.2, h * 0.1);
        ctx.fillRect(ex + w * 0.05, ey - h * 0.65, w * 0.18, h * 0.12);
        ctx.fillStyle = '#5c6e48';
        ctx.fillRect(ex - w * 0.1, ey - h * 0.55, w * 0.15, h * 0.08);
        // Braços com arma
        ctx.fillStyle = '#4a5c3a';
        ctx.fillRect(ex - w / 2 - 4, ey - h * 0.7, 8, h * 0.25);
        ctx.fillRect(ex + w / 2 - 4, ey - h * 0.7, 8, h * 0.25);
        // Arma do inimigo
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(ex - 4, ey - h * 0.55, w * 0.6, 4);
        // Cabeça/máscara
        ctx.fillStyle = '#d4a574'; // pele
        ctx.beginPath();
        ctx.arc(ex, headCY, headR, 0, Math.PI * 2);
        ctx.fill();
        // Touca/máscara preta
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(ex - headR, headCY - headR, headR * 2, headR * 1.2);
        ctx.beginPath();
        ctx.arc(ex, headCY, headR, Math.PI, 0);
        ctx.fill();
        // Olhos (vermelhos brilhantes - bonus marcado)
        ctx.fillStyle = en.bonus ? '#fbbf24' : '#fff';
        ctx.fillRect(ex - headR * 0.5, headCY - headR * 0.1, headR * 0.3, headR * 0.25);
        ctx.fillRect(ex + headR * 0.2, headCY - headR * 0.1, headR * 0.3, headR * 0.25);
        ctx.fillStyle = '#000';
        ctx.fillRect(ex - headR * 0.4, headCY - headR * 0.05, headR * 0.15, headR * 0.18);
        ctx.fillRect(ex + headR * 0.3, headCY - headR * 0.05, headR * 0.15, headR * 0.18);

        // Marca de bônus (faixa amarela no braço)
        if (en.bonus) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(ex - w / 2 - 4, ey - h * 0.6, 8, 4);
          ctx.fillRect(ex + w / 2 - 4, ey - h * 0.6, 8, 4);
        }

        ctx.restore();

        // Indicador sutil de tempo restante (não muito intrusivo)
        const ageRatio = (now - en.spawnTime) / en.lifetime;
        if (!en.hit && ageRatio > 0.6 && ageRatio < 0.95) {
          ctx.fillStyle = `rgba(239, 68, 68, ${(ageRatio - 0.6) * 1.5})`;
          ctx.fillRect(ex - 12, ey - h - 6, 24 * (1 - ageRatio), 2);
        }
      });

      // Sangue
      s.bloodSplats.forEach(b => {
        ctx.fillStyle = `rgba(180, 30, 30, ${Math.min(1, b.life / 40)})`;
        ctx.fillRect(b.x, b.y, b.size, b.size);
      });

      // Cápsulas ejetadas
      s.shells.forEach(sh => {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rot);
        ctx.fillStyle = '#d4a04a';
        ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
      });

      // Fumaça
      s.smokeParticles.forEach(p => {
        ctx.fillStyle = `rgba(180, 180, 180, ${(p.life / 50) * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ============ ARMA EM PRIMEIRA PESSOA (Shotgun estilo DOOM, uma mão) ============
      const breath = Math.sin(s.breathPhase) * 1.5;
      const walkBobY = Math.abs(Math.sin(s.walkPhase)) * (moving ? 6 : 0);
      const walkBobX = Math.sin(s.walkPhase) * (moving ? 5 : 0);
      const gunY = H + s.kickback * 1.2 + breath + walkBobY;
      const gunX = W / 2 + walkBobX;
      ctx.save();
      ctx.translate(gunX, gunY);
      ctx.imageSmoothingEnabled = false;

      // Helper para desenhar pixel grande (estilo DOOM low-res)
      const px = (x, y, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), w, h);
      };

      // Sombra escura por baixo (DOOM tem chão escuro próximo)
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(-160, -10, 320, 30);

      // ===== ÚNICA MÃO (direita) — vinda do canto inferior direito, segurando o forearm =====
      // Antebraço (manga marrom estilo Doomguy)
      const armCol1 = '#6b3a1a';
      const armCol2 = '#4a2410';
      // forma trapezoidal pixelada
      px(60, 10, 110, 18, armCol1);
      px(50, -10, 110, 22, armCol1);
      px(40, -30, 100, 22, armCol1);
      px(30, -50, 90, 22, armCol2);
      px(25, -70, 80, 22, armCol1);
      // sombra interna
      px(60, -50, 60, 6, armCol2);
      px(50, -10, 70, 4, armCol2);
      // detalhes da manga (faixas)
      px(60, 0, 90, 3, '#3a1d08');
      px(50, -22, 90, 3, '#3a1d08');

      // PUNHO / mão (cor de pele DOOM clássico)
      const skin = '#d8a06a';
      const skinShade = '#a06840';
      // mão pixelada
      px(-15, -88, 60, 28, skin);
      px(-10, -100, 50, 14, skin);
      px(-15, -60, 60, 8, skinShade);
      // dedos enrolados no grip
      px(-20, -82, 8, 18, skin);
      px(-22, -78, 4, 12, skinShade);
      // nós dos dedos
      px(0, -92, 6, 4, skinShade);
      px(12, -92, 6, 4, skinShade);
      px(24, -92, 6, 4, skinShade);

      // ===== SHOTGUN (cano duplo, vista de baixo apontando pra frente) =====
      // Pump/grip de madeira embaixo da arma (perto da mão)
      px(-30, -100, 70, 14, '#7a4218');
      px(-30, -100, 70, 3, '#a05828');
      px(-30, -89, 70, 3, '#3a1d08');
      // ranhuras da pump
      for (let i = 0; i < 6; i++) {
        px(-26 + i * 11, -98, 7, 10, '#5a2e10');
      }

      // Receiver (corpo principal de aço)
      px(-32, -118, 74, 20, '#2a2a2a');
      px(-32, -118, 74, 3, '#4a4a4a');
      px(-32, -101, 74, 3, '#1a1a1a');
      // parafusos
      px(-26, -112, 4, 4, '#5a5a5a');
      px(36, -112, 4, 4, '#5a5a5a');
      // gatilho visível na lateral
      px(-2, -100, 6, 4, '#1a1a1a');

      // Barril duplo (cano duplo lado a lado, vista frontal — DOOM SSG style)
      // Sombra do barril
      px(-22, -160, 56, 4, '#0a0a0a');
      // Barril esquerdo
      px(-22, -156, 22, 38, '#1a1a1a');
      px(-22, -156, 22, 4, '#3a3a3a');
      px(-22, -122, 22, 4, '#0a0a0a');
      // boca do cano esquerdo (círculo escuro)
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-11, -150, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(-11, -150, 5, 0, Math.PI * 2);
      ctx.fill();

      // Barril direito
      px(12, -156, 22, 38, '#1a1a1a');
      px(12, -156, 22, 4, '#3a3a3a');
      px(12, -122, 22, 4, '#0a0a0a');
      // boca do cano direito
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(23, -150, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(23, -150, 5, 0, Math.PI * 2);
      ctx.fill();

      // Mira frontal pequena entre os canos
      px(4, -162, 4, 6, '#5a5a5a');
      px(5, -164, 2, 3, '#fff');

      // Reflexo nos canos
      px(-19, -154, 2, 30, '#4a4a4a');
      px(15, -154, 2, 30, '#4a4a4a');

      // Muzzle flash (sai dos DOIS canos)
      if (s.muzzle > 0) {
        const intensity = s.muzzle / 8;
        [{ fx: -11, fy: -158 }, { fx: 23, fy: -158 }].forEach(({ fx, fy }) => {
          // Halo
          const flashGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, 60);
          flashGrad.addColorStop(0, `rgba(255, 245, 200, ${intensity})`);
          flashGrad.addColorStop(0.3, `rgba(255, 180, 60, ${intensity * 0.85})`);
          flashGrad.addColorStop(0.7, `rgba(255, 100, 0, ${intensity * 0.4})`);
          flashGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
          ctx.fillStyle = flashGrad;
          ctx.fillRect(fx - 60, fy - 60, 120, 120);
          // Estrela do flash (DOOM-like, pixelada)
          ctx.fillStyle = `rgba(255, 240, 180, ${intensity})`;
          px(fx - 4, fy - 30, 8, 30, `rgba(255, 240, 180, ${intensity})`);
          px(fx - 30, fy - 4, 60, 8, `rgba(255, 240, 180, ${intensity})`);
          px(fx - 20, fy - 20, 40, 40, `rgba(255, 220, 120, ${intensity * 0.6})`);
          // Núcleo branco
          ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 8, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();

      // Iluminação do flash no ambiente
      if (s.muzzle > 0) {
        ctx.fillStyle = `rgba(255, 200, 100, ${(s.muzzle / 8) * 0.12})`;
        ctx.fillRect(0, 0, W, H);
      }

      // ============ HUD ============

      // Crosshair (dinâmico - abre com tiro)
      const spread = 6 + s.kickback * 0.8;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 2;
      ctx.beginPath();
      ctx.moveTo(s.crossX - spread - 6, s.crossY); ctx.lineTo(s.crossX - spread, s.crossY);
      ctx.moveTo(s.crossX + spread, s.crossY); ctx.lineTo(s.crossX + spread + 6, s.crossY);
      ctx.moveTo(s.crossX, s.crossY - spread - 6); ctx.lineTo(s.crossX, s.crossY - spread);
      ctx.moveTo(s.crossX, s.crossY + spread); ctx.lineTo(s.crossX, s.crossY + spread + 6);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(s.crossX - 1, s.crossY - 1, 2, 2);

      // HUD inferior estilo CS
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(8, H - 44, 140, 36);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, H - 44, 140, 36);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('SUPER SHOTGUN', 16, H - 30);
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = s.reloading ? '#fbbf24' : (s.ammo <= 5 ? '#ef4444' : '#fff');
      ctx.fillText(s.reloading ? 'RELOADING' : `${s.ammo}/30`, 16, H - 14);

      // Accuracy
      const totalShots = s.hits + s.misses;
      const accuracy = totalShots > 0 ? Math.round((s.hits / totalShots) * 100) : 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(W - 110, 8, 100, 28);
      ctx.strokeStyle = '#22c55e';
      ctx.strokeRect(W - 110, 8, 100, 28);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`ACC ${accuracy}%`, W - 100, 27);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`HITS ${s.hits}`, W - 50, 27);

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
          controls="A/D para se mover, mouse para mirar, CLIQUE para atirar. Headshots = 2x! R recarrega."
        />
      </div>
      {/* Controles mobile */}
      <div className="flex md:hidden justify-between max-w-[640px] mx-auto mt-3 gap-2 px-2">
        <button
          onTouchStart={() => touchMove('left', true)} onTouchEnd={() => touchMove('left', false)}
          className="flex-1 py-3 bg-neon-purple/20 border border-neon-purple text-neon-purple font-pixel text-xs rounded">← A</button>
        <button
          onClick={shoot}
          className="flex-1 py-3 bg-neon-pink/20 border border-neon-pink text-neon-pink font-pixel text-xs rounded">FIRE</button>
        <button
          onTouchStart={() => touchMove('right', true)} onTouchEnd={() => touchMove('right', false)}
          className="flex-1 py-3 bg-neon-purple/20 border border-neon-purple text-neon-purple font-pixel text-xs rounded">D →</button>
      </div>
    </div>
  );
}