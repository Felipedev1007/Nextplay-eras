import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, BookOpen } from 'lucide-react';

const COLOR_MAP = {
  green: 'text-neon-green border-neon-green/30',
  cyan: 'text-neon-cyan border-neon-cyan/30',
  yellow: 'text-neon-yellow border-neon-yellow/30',
  pink: 'text-neon-pink border-neon-pink/30',
  purple: 'text-neon-purple border-neon-purple/30',
};

export default function EraIntro({ era }) {
  const c = COLOR_MAP[era.color];
  const [main, border] = c.split(' ');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`border ${border} rounded-lg p-5 bg-card/50 backdrop-blur`}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className={`w-4 h-4 ${main}`} />
          <span className={`font-pixel text-[10px] ${main} tracking-widest`}>HISTÓRIA</span>
        </div>
        <p className="font-retro text-lg sm:text-xl text-foreground/90 leading-relaxed">
          {era.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`border ${border} rounded-lg p-5 bg-card/50 backdrop-blur`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Cpu className={`w-4 h-4 ${main}`} />
          <span className={`font-pixel text-[10px] ${main} tracking-widest`}>TECNOLOGIA</span>
        </div>
        <p className="font-retro text-lg text-muted-foreground leading-relaxed">
          {era.tech}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`border ${border} rounded-lg p-5 bg-card/50 backdrop-blur`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className={`w-4 h-4 ${main}`} />
          <span className={`font-pixel text-[10px] ${main} tracking-widest`}>VOCÊ SABIA?</span>
        </div>
        <ul className="space-y-3">
          {era.facts.map((fact, i) => (
            <li key={i} className="font-retro text-base sm:text-lg text-muted-foreground leading-relaxed flex gap-2">
              <span className={main}>▸</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}