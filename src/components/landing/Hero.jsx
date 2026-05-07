import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg animate-grid">
      {/* Floating pixel decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { color: 'bg-neon-green', x: '10%', y: '20%', delay: 0 },
          { color: 'bg-neon-pink', x: '80%', y: '15%', delay: 0.5 },
          { color: 'bg-neon-cyan', x: '15%', y: '75%', delay: 1 },
          { color: 'bg-neon-yellow', x: '85%', y: '70%', delay: 1.5 },
          { color: 'bg-neon-purple', x: '50%', y: '85%', delay: 2 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className={`absolute w-4 h-4 ${p.color}`}
            style={{ left: p.x, top: p.y }}
            animate={{ y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-neon-green/30 rounded-full bg-neon-green/5"
        >
          <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          <span className="font-pixel text-[10px] text-neon-green tracking-widest">PRESS START · 1972 → 2026</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-pixel text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.2] mb-6"
        >
          <span className="text-glow-green text-neon-green">A EVOLUÇÃO</span>
          <br />
          <span className="text-foreground">DOS</span>{' '}
          <span className="text-glow-pink text-neon-pink">JOGOS</span>
          <br />
          <span className="text-glow-cyan text-neon-cyan">DIGITAIS</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-retro text-xl sm:text-2xl md:text-3xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Um museu interativo onde você joga 5 mini-games icônicos e revive
          54 anos de história dos videogames em primeira pessoa.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/era/pong">
            <Button size="lg" className="font-pixel text-xs gap-3 bg-neon-green hover:bg-neon-green/90 text-background glow-green h-14 px-8">
              <Play className="w-4 h-4 fill-current" /> COMEÇAR JORNADA
            </Button>
          </Link>
          <a href="#timeline">
            <Button size="lg" variant="outline" className="font-pixel text-xs gap-3 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 h-14 px-8">
              <Gamepad2 className="w-4 h-4" /> VER LINHA DO TEMPO
            </Button>
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          {[
            { v: '5', l: 'ERAS' },
            { v: '54', l: 'ANOS' },
            { v: '∞', l: 'NOSTALGIA' },
          ].map((s, i) => (
            <div key={i} className="border border-border/50 rounded-lg p-4 backdrop-blur-sm bg-card/30">
              <div className={`font-pixel text-2xl sm:text-3xl mb-1 ${i === 0 ? 'text-neon-green' : i === 1 ? 'text-neon-pink' : 'text-neon-cyan'}`}>{s.v}</div>
              <div className="font-pixel text-[9px] text-muted-foreground tracking-widest">{s.l}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <span className="font-pixel text-[9px] text-muted-foreground animate-blink">▼ ROLE PARA EXPLORAR ▼</span>
        </motion.div>
      </div>
    </section>
  );
}