import React from 'react';
import { ERAS } from '@/lib/erasData';
import { motion } from 'framer-motion';

export default function EraProgress({ currentEra, completedCount }) {
  const total = ERAS.length;
  const currentIdx = ERAS.findIndex(e => e.id === currentEra);
  const percent = ((currentIdx + 1) / (total + 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-pixel text-[9px] text-muted-foreground tracking-widest">EVOLUÇÃO TECNOLÓGICA</span>
        <span className="font-pixel text-[9px] text-neon-green">{completedCount}/{total} COMPLETAS</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-pink rounded-full"
        />
      </div>
      <div className="flex justify-between mt-2">
        {ERAS.map((e, i) => (
          <div key={e.id} className="flex flex-col items-center" style={{ width: `${100/total}%` }}>
            <div className={`w-1.5 h-1.5 rounded-full ${i <= currentIdx ? 'bg-neon-green' : 'bg-muted'}`} />
            <span className={`font-pixel text-[8px] mt-1 ${e.id === currentEra ? 'text-foreground' : 'text-muted-foreground'}`}>
              {e.year}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}