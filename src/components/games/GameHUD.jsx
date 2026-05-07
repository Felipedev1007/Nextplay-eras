import React from 'react';
import { Timer, Trophy } from 'lucide-react';

export default function GameHUD({ score, time, color = 'green', label = 'SCORE' }) {
  const colorClass = {
    green: 'text-neon-green border-neon-green',
    cyan: 'text-neon-cyan border-neon-cyan',
    yellow: 'text-neon-yellow',
    pink: 'text-neon-pink border-neon-pink',
    purple: 'text-neon-purple',
  }[color];

  return (
    <div className="flex items-center justify-between w-full max-w-[640px] mx-auto px-2 py-2 mb-3">
      <div className={`font-pixel text-[10px] sm:text-xs ${colorClass}`}>
        {label}: <span className="text-foreground">{String(score).padStart(6, '0')}</span>
      </div>
      <div className={`flex items-center gap-2 font-pixel text-[10px] sm:text-xs ${time <= 10 ? 'text-destructive animate-pulse' : colorClass}`}>
        <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>{String(time).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}