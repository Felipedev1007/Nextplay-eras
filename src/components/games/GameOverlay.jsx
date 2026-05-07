import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GameOverlay({ state, score, onStart, onRestart, onNext, color = 'green', controls }) {
  const colorClass = {
    green: 'text-neon-green',
    cyan: 'text-neon-cyan',
    yellow: 'text-neon-yellow',
    pink: 'text-neon-pink',
    purple: 'text-neon-purple',
  }[color];

  if (state === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-20 p-4"
      >
        <h3 className={`font-pixel text-sm sm:text-lg mb-4 ${colorClass}`}>PRONTO?</h3>
        {controls && (
          <p className="font-retro text-lg sm:text-xl text-muted-foreground mb-6 text-center max-w-xs">
            {controls}
          </p>
        )}
        <Button onClick={onStart} size="lg" className="font-pixel text-xs gap-2 bg-foreground text-background hover:bg-foreground/90">
          <Play className="w-4 h-4 fill-current" /> JOGAR
        </Button>
      </motion.div>
    );
  }

  if (state === 'over') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-20 p-4"
      >
        <h3 className="font-pixel text-sm sm:text-base text-muted-foreground mb-2">FIM DE JOGO</h3>
        <div className={`font-pixel text-2xl sm:text-4xl mb-1 ${colorClass}`}>
          {String(score).padStart(6, '0')}
        </div>
        <p className="font-retro text-base text-muted-foreground mb-6">PONTOS</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onRestart} className="font-pixel text-[10px] gap-2">
            <RotateCcw className="w-3 h-3" /> JOGAR DE NOVO
          </Button>
          <Button onClick={onNext} className="font-pixel text-[10px] gap-2 bg-foreground text-background hover:bg-foreground/90">
            PRÓXIMA ERA <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}