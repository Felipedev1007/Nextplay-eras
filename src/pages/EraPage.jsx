import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home as HomeIcon, SkipForward } from 'lucide-react';
import { getEra, ERAS } from '@/lib/erasData';
import { saveEraResult, getCompletedCount } from '@/lib/progress';
import { playSuccess } from '@/lib/sound';
import EraIntro from '@/components/era/EraIntro';
import EraProgress from '@/components/era/EraProgress';
import PongGame from '@/components/games/PongGame';
import SpaceInvadersGame from '@/components/games/SpaceInvadersGame';
import PacManGame from '@/components/games/PacManGame';
import MarioGame from '@/components/games/MarioGame';
import FPSGame from '@/components/games/FPSGame';

const GAME_MAP = {
  pong: PongGame,
  invaders: SpaceInvadersGame,
  pacman: PacManGame,
  mario: MarioGame,
  fps: FPSGame,
};

const COLOR_HEX = {
  green: '#22c55e',
  cyan: '#22d3ee',
  yellow: '#facc15',
  pink: '#ec4899',
  purple: '#a855f7',
};

export default function EraPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const era = getEra(id);
  const [transitioning, setTransitioning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    setCompletedCount(getCompletedCount());
    setTransitioning(false);
    window.scrollTo(0, 0);
  }, [id]);

  if (!era) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-pixel text-sm">ERA NOT FOUND</p>
      </div>
    );
  }

  const Game = GAME_MAP[id];

  const handleComplete = (score, goNext = false) => {
    saveEraResult(id, score);
    setCompletedCount(getCompletedCount());
    if (goNext) {
      playSuccess();
      setTransitioning(true);
      setTimeout(() => {
        if (era.next === 'modern') navigate('/modern');
        else navigate(`/era/${era.next}`);
      }, 1200);
    }
  };

  const colorHex = COLOR_HEX[era.color];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${era.bgGradient} text-foreground relative overflow-hidden`}>
      {/* Era-specific grid */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
           style={{
             backgroundImage: `linear-gradient(${colorHex}10 1px, transparent 1px), linear-gradient(90deg, ${colorHex}10 1px, transparent 1px)`,
             backgroundSize: '40px 40px',
           }} />

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-background/40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-pixel text-[10px]">VOLTAR</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[10px]" style={{ color: colorHex }}>{era.year}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-pixel text-[10px] text-foreground">{era.title.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTransitioning(true);
                setTimeout(() => {
                  if (era.next === 'modern') navigate('/modern');
                  else navigate(`/era/${era.next}`);
                }, 800);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors hover:bg-foreground/5"
              style={{ borderColor: `${colorHex}60`, color: colorHex }}
              title="Pular para a próxima era"
            >
              <span className="font-pixel text-[9px]">PULAR ERA</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <HomeIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 py-8 px-4 max-w-6xl mx-auto">
        <EraProgress currentEra={id} completedCount={completedCount} />

        {/* Era title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="font-pixel text-[10px] text-muted-foreground tracking-widest mb-2">
            {era.era.toUpperCase()} · {era.year}
          </p>
          <h1 className="font-pixel text-3xl sm:text-4xl md:text-5xl mb-2"
              style={{ color: colorHex, textShadow: `0 0 20px ${colorHex}80` }}>
            {era.title}
          </h1>
          <p className="font-retro text-xl sm:text-2xl text-muted-foreground">{era.subtitle}</p>
        </motion.div>

        {/* Game + Info grid */}
        <div className="grid lg:grid-cols-[1fr,400px] gap-8 items-start">
          <div>
            <Game onComplete={handleComplete} />
          </div>
          <div className="lg:sticky lg:top-24">
            <EraIntro era={era} />
          </div>
        </div>
      </main>

      {/* Cinematic transition */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-pixel text-2xl sm:text-3xl mb-3"
                style={{ color: colorHex }}
              >
                ERA COMPLETA
              </motion.div>
              <motion.div
                initial={{ width: 0 }} animate={{ width: '100%' }}
                transition={{ duration: 1 }}
                className="h-0.5 bg-gradient-to-r from-transparent via-foreground to-transparent max-w-xs mx-auto"
              />
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-retro text-lg text-muted-foreground mt-3"
              >
                Carregando próxima geração...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}