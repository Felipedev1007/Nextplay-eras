import React, { useEffect, useRef, useState } from 'react';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import { useCountdown } from './useGameLoop';
import { playGunshot, playExplosion } from '@/lib/sound';

const W = 640, H = 400;
const HORIZON = H * 0.55;

// "Lanes" laterais onde caixas/inimigos podem aparecer (em coordenadas mundo)
const LANES = [140, 260, 380, 500, 200, 440];

// Velocidade com que mapa/objetos se aproximam do jogador (em "depth" por frame)
const APPROACH_SPEED = 0.0018;
// Profundidade inicial (longe = 0.05) e final (perto = 0.95)
const DEPTH_MIN = 0.05;
const DEPTH_MAX = 0.95;

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

  // Caixa: nasce longe e se aproxima
  const spawnCrate = (occupiedLanes = []) => {
    const available = LANES.filter(l => !occupiedLanes.includes(l));
    const pool = available.length > 0 ? available : LANES;
    const lane = pool[Math.floor(Math.random() * pool.length)];
    return {
      lane,
      worldX: lane + (Math.random() - 0.5) * 40,
      depth: DEPTH_MIN + Math.random() * 0.05,
    };
  };

  // Inimigo: vinculado a uma caixa (lane). Nasce longe atrás com a caixa.
  const spawnEnemy = (occupiedLanes = []) => {
    const available = LANES.filter(l => !occupiedLanes.includes(l));
    const pool = available.length > 0 ? available : LANES;
    const lane = pool[Math.floor(Math.random() * pool.length)];
    return {
      lane,
      worldX: lane + (Math.random() - 0.5) * 30,
      depth: DEPTH_MIN + Math.random() * 0.05,
      hp: 1,
      hit: false,
      bonus: Math.random() < 0.18,
      spawnTime: performance.now(),
      popOffset: 0, // 0 = atrás da cobertura, 1 = exposto
      didContactDamage: false, // já bateu no jogador?
    };
  };

  const start = () => {
    // Caixas espalhadas em diferentes profundidades iniciais (parecem em distâncias variadas)
    const crates = [];
    const usedLanes = [];
    for (let i = 0; i < 5; i++) {
      const c = spawnCrate(usedLanes);
      c.depth = 0.15 + i * 0.18; // espalha em profundidade
      crates.push(c);
      usedLanes.push(c.lane);
    }
    // 2 inimigos iniciais usando lanes livres
    const e1 = spawnEnemy(usedLanes);
    e1.depth = 0.25;
    usedLanes.push(e1.lane);
    const e2 = spawnEnemy(usedLanes);
    e2.depth = 0.45;

    stateRef.current = {
      crossX: W / 2,
      crossY: H / 2,
      crates,
      enemies: [e1, e2],
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
      mapScroll: 0,  // deslocamento visual do mapa (parallax do chão/prédios)
      walkPhase: 0,  // animação de balanço ao andar
      keys: { left: false, right: false },
      hp: 100,
      damageFlash: 0, // flash vermelho ao tomar dano
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

    // Cápsula ejetada (sai do receiver, lado direito)
    s.shells.push({
      x: W / 2 + 25, y: H - 105,
      vx: 3 + Math.random() * 2, vy: -4 - Math.random() * 2,
      rot: 0, vrot: 0.4, life: 60,
    });
    // Fumacinha do cano (no centro à frente)
    for (let i = 0; i < 4; i++) {
      s.smokeParticles.push({
        x: W / 2 + (Math.random() - 0.5) * 8,
        y: H - 195 + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.8 - Math.random() * 0.6,
        life: 35 + Math.random() * 20,
        size: 5 + Math.random() * 5,
      });
    }

    // Hit detection
    let hit = false;
    s.enemies.forEach(en => {
      if (en.hit || en.popOffset < 0.3) return;
      // Hitbox do inimigo na tela (usa screenX calculado no último render)
      const ex = en.screenX != null ? en.screenX : en.worldX;
      const scale = 0.4 + en.depth * 1.1;
      const ey = HORIZON + (H - HORIZON) * en.depth;
      const w = 36 * scale;
      const h = 80 * scale;
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

      // Movimento lateral (A/D) — jogador FIXO no mundo, mas pode olhar pros lados via cameraX (parallax suave)
      const moveSpeed = 2.2;
      let moving = false;
      if (s.keys.left) { s.cameraX -= moveSpeed; moving = true; }
      if (s.keys.right) { s.cameraX += moveSpeed; moving = true; }
      // Mapa rola sozinho em direção ao jogador (chão/prédios passam)
      s.mapScroll += 1.4;
      // walkPhase só avança quando está se movendo lateralmente (não há balanço se parado)
      if (moving) s.walkPhase += 0.18;

      // Recarga
      if (s.reloading && now - s.reloadStart > 1500) {
        s.ammo = 30;
        s.reloading = false;
      }

      // === Caixas: avançam em direção ao jogador, renascem atrás quando passam ===
      s.crates.forEach(c => { c.depth += APPROACH_SPEED; });
      s.crates = s.crates.map((c, idx, arr) => {
        if (c.depth > DEPTH_MAX) {
          const occupied = arr.filter((_, i) => i !== idx).map(o => o.lane)
            .concat(s.enemies.map(e => e.lane));
          return spawnCrate(occupied);
        }
        return c;
      });

      // === Inimigos: avançam junto com o mapa, animação pop-up baseada em depth ===
      s.enemies.forEach(en => {
        en.depth += APPROACH_SPEED;
        // pop-up: nasce escondido, aparece conforme se aproxima
        if (en.hit) {
          en.popOffset = Math.max(0, en.popOffset - 0.05);
        } else {
          // expõe progressivamente entre depth 0.15 e 0.35
          const t = (en.depth - 0.15) / 0.20;
          en.popOffset = Math.max(0, Math.min(1, t));
        }
        // Dano por contato: quando o inimigo encosta no jogador (depth alta)
        if (!en.hit && !en.didContactDamage && en.depth > 0.85 && en.popOffset > 0.5) {
          en.didContactDamage = true;
          s.hp = Math.max(0, s.hp - 25);
          s.damageFlash = 1;
          playExplosion();
          if (s.hp <= 0) {
            endGame();
          }
        }
      });
      // Respawn quando passou do jogador ou foi morto
      s.enemies = s.enemies.map((en, idx, arr) => {
        const needsRespawn = (en.hit && en.popOffset <= 0) || en.depth > DEPTH_MAX;
        if (needsRespawn) {
          const occupied = arr.filter((_, i) => i !== idx).map(o => o.lane)
            .concat(s.crates.map(c => c.lane));
          return spawnEnemy(occupied);
        }
        return en;
      });
      while (s.enemies.length < 2) {
        const occupied = s.enemies.map(o => o.lane).concat(s.crates.map(c => c.lane));
        s.enemies.push(spawnEnemy(occupied));
      }

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
      s.damageFlash = Math.max(0, s.damageFlash - 0.04);

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

      // ===== Camada de prédios (parallax médio) - se repete + avança =====
      ctx.save();
      const buildOffset = -(((s.cameraX * 0.35) + (s.mapScroll * 0.6)) % W);
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

      // Linhas de perspectiva no chão (raios saindo do horizonte)
      ctx.strokeStyle = 'rgba(80, 60, 40, 0.35)';
      ctx.lineWidth = 1;
      const groundShift = (s.cameraX * 0.6) % 90;
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(W / 2 - groundShift * 0.1, HORIZON);
        ctx.lineTo(W / 2 + i * 90 - groundShift, H);
        ctx.stroke();
      }
      // Linhas horizontais que VÊM EM DIREÇÃO ao jogador (sensação de avançar)
      for (let i = 0; i < 8; i++) {
        // t vai de 0 (longe) a 1 (perto) — anima com mapScroll
        const t = ((i * (1 / 8)) + (s.mapScroll / 200)) % 1;
        const y = HORIZON + (H - HORIZON) * Math.pow(t, 1.6);
        ctx.strokeStyle = `rgba(80, 60, 40, ${0.1 + t * 0.35})`;
        ctx.lineWidth = 1 + t * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Helper: wrap horizontal apenas para câmera lateral (objetos têm depth própria)
      const wrap = (x) => {
        const range = W * 1.5;
        let v = ((x - s.cameraX) % range + range) % range - range / 2 + W / 2;
        return v;
      };

      // Coberturas/barricadas (caixas) — cada uma com depth própria, ordena longe→perto
      const sortedCrates = [...s.crates].sort((a, b) => a.depth - b.depth);
      sortedCrates.forEach(c => {
        const baseY = HORIZON + (H - HORIZON) * c.depth;
        const scale = 0.4 + c.depth * 1.1;
        const w = 50 * scale;
        const h = 28 * scale;
        const x = wrap(c.worldX);
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
        const scale = 0.4 + en.depth * 1.1;
        const ey = HORIZON + (H - HORIZON) * en.depth;
        const w = 36 * scale;
        const h = 80 * scale;
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

        // Indicador sutil quando o inimigo está perto demais (vai escapar)
        if (!en.hit && en.depth > 0.75) {
          const urgency = (en.depth - 0.75) / 0.20;
          ctx.fillStyle = `rgba(239, 68, 68, ${urgency})`;
          ctx.fillRect(ex - 12, ey - h - 6, 24 * (1 - urgency), 2);
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

      // ============ ARMA EM PRIMEIRA PESSOA (AK-47 vista frontal centralizada) ============
      const breath = Math.sin(s.breathPhase) * 1.5;
      const walkBobY = Math.abs(Math.sin(s.walkPhase)) * (moving ? 5 : 0);
      const walkBobX = Math.sin(s.walkPhase) * (moving ? 4 : 0);
      const gunY = H + s.kickback + breath + walkBobY;
      const gunX = W / 2 + walkBobX;
      ctx.save();
      ctx.translate(gunX, gunY);
      ctx.scale(0.6, 0.6);

      const BLACK = '#1a1a1a';
      const WOOD = '#c46a1a';
      const WOOD_D = '#8a4a10';
      const WOOD_L = '#e08a30';
      const skin = '#e0a878';
      const skinShade = '#a87048';

      // Sombra ampla embaixo da arma
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(0, -8, 130, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // ===== Braço único (direito) - sai do canto inferior direito =====
      ctx.fillStyle = '#3a4a2a';
      ctx.beginPath();
      ctx.moveTo(220, 40);
      ctx.lineTo(80, 40);
      ctx.lineTo(30, -90);
      ctx.lineTo(95, -105);
      ctx.closePath();
      ctx.fill();
      // sombras camuflagem
      ctx.fillStyle = '#2a3a1c';
      ctx.fillRect(120, 15, 40, 22);
      ctx.fillRect(95, -45, 28, 15);
      ctx.fillRect(155, -10, 30, 18);

      // ===== Coronha (madeira, perto da câmera = mais larga) =====
      ctx.fillStyle = WOOD;
      ctx.beginPath();
      ctx.moveTo(-32, -40);
      ctx.lineTo(32, -40);
      ctx.lineTo(22, -75);
      ctx.lineTo(-22, -75);
      ctx.closePath();
      ctx.fill();
      // brilho topo coronha
      ctx.fillStyle = WOOD_L;
      ctx.fillRect(-22, -75, 44, 4);
      // sombra fundo coronha
      ctx.fillStyle = WOOD_D;
      ctx.fillRect(-32, -44, 64, 4);

      // ===== Receiver (corpo preto da AK) =====
      ctx.fillStyle = BLACK;
      ctx.fillRect(-26, -110, 52, 35);
      // top highlight
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(-26, -110, 52, 4);
      // sombra fundo receiver
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(-26, -78, 52, 3);
      // detalhe lateral (bolt cover)
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(-22, -100, 44, 3);

      // ===== Carregador (banana mag) descendo do receiver =====
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(-14, -78);
      ctx.lineTo(14, -78);
      ctx.lineTo(18, -50);
      ctx.lineTo(-18, -50);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(-14, -78, 28, 3);

      // ===== Handguard de madeira (laranja, à frente do receiver) =====
      ctx.fillStyle = WOOD;
      ctx.beginPath();
      ctx.moveTo(-20, -135);
      ctx.lineTo(20, -135);
      ctx.lineTo(16, -110);
      ctx.lineTo(-16, -110);
      ctx.closePath();
      ctx.fill();
      // brilho topo
      ctx.fillStyle = WOOD_L;
      ctx.fillRect(-18, -135, 36, 3);
      // ranhuras
      ctx.fillStyle = WOOD_D;
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(-16 + i * 7, -132, 3, 19);
      }

      // ===== Cano (estreita conforme se afasta — perspectiva) =====
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(-9, -135);
      ctx.lineTo(9, -135);
      ctx.lineTo(6, -195);
      ctx.lineTo(-6, -195);
      ctx.closePath();
      ctx.fill();
      // reflexo no cano
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(-1, -195, 2, 60);

      // Mira frontal no topo do cano
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(-3, -202, 6, 8);
      ctx.fillRect(-1, -205, 2, 4);

      // Mira traseira (mais perto = maior) no topo do receiver
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(-12, -114, 24, 5);
      ctx.fillRect(-2, -118, 4, 6);

      // ===== Mão única (direita) — segurando o grip / gatilho =====
      ctx.fillStyle = skin;
      ctx.fillRect(30, -92, 28, 26);
      ctx.fillRect(36, -104, 22, 14);
      ctx.fillStyle = skinShade;
      ctx.fillRect(30, -70, 28, 4);
      // dedo no gatilho
      ctx.fillStyle = skin;
      ctx.fillRect(22, -80, 10, 7);
      ctx.fillStyle = skinShade;
      ctx.fillRect(22, -73, 10, 3);
      // nós dos dedos enrolando o grip
      ctx.fillStyle = skinShade;
      ctx.fillRect(34, -98, 4, 3);
      ctx.fillRect(42, -100, 4, 3);
      ctx.fillRect(50, -98, 4, 3);

      // ===== Muzzle flash (saindo da boca do cano, no centro/cima) =====
      if (s.muzzle > 0) {
        const fx = 0;
        const fy = -200;
        const intensity = s.muzzle / 8;
        // Halo
        const flashGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, 60);
        flashGrad.addColorStop(0, `rgba(255, 245, 200, ${intensity})`);
        flashGrad.addColorStop(0.3, `rgba(255, 180, 60, ${intensity * 0.85})`);
        flashGrad.addColorStop(0.7, `rgba(255, 100, 0, ${intensity * 0.4})`);
        flashGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = flashGrad;
        ctx.fillRect(fx - 60, fy - 60, 120, 120);
        // Estrela pixelada
        ctx.fillStyle = `rgba(255, 240, 180, ${intensity})`;
        ctx.fillRect(fx - 4, fy - 32, 8, 32);
        ctx.fillRect(fx - 32, fy - 4, 64, 8);
        ctx.fillRect(fx - 22, fy - 22, 44, 44);
        // Núcleo branco
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Iluminação do flash no ambiente
      if (s.muzzle > 0) {
        ctx.fillStyle = `rgba(255, 200, 100, ${(s.muzzle / 8) * 0.12})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Flash vermelho ao tomar dano (vinheta)
      if (s.damageFlash > 0) {
        const dmgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W / 1.2);
        dmgGrad.addColorStop(0, 'rgba(255, 0, 0, 0)');
        dmgGrad.addColorStop(1, `rgba(180, 0, 0, ${s.damageFlash * 0.6})`);
        ctx.fillStyle = dmgGrad;
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
      ctx.fillText('AK-47', 16, H - 30);
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = s.reloading ? '#fbbf24' : (s.ammo <= 5 ? '#ef4444' : '#fff');
      ctx.fillText(s.reloading ? 'RELOADING' : `${s.ammo}/30`, 16, H - 14);

      // HP bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(156, H - 44, 140, 36);
      const hpColor = s.hp > 60 ? '#22c55e' : s.hp > 30 ? '#fbbf24' : '#ef4444';
      ctx.strokeStyle = hpColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(156, H - 44, 140, 36);
      ctx.fillStyle = hpColor;
      ctx.font = 'bold 11px monospace';
      ctx.fillText('HP', 164, H - 30);
      // barra
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(186, H - 33, 100, 10);
      ctx.fillStyle = hpColor;
      ctx.fillRect(186, H - 33, Math.max(0, s.hp), 10);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${s.hp}`, 186, H - 14);

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