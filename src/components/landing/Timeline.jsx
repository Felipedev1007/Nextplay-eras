import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ERAS } from '@/lib/erasData';
import { ChevronRight, CheckCircle2, Lock } from 'lucide-react';
import { getProgress } from '@/lib/progress';

const COLOR_MAP = {
  green: { text: 'text-neon-green', border: 'border-neon-green', bg: 'bg-neon-green', glow: 'glow-green' },
  cyan: { text: 'text-neon-cyan', border: 'border-neon-cyan', bg: 'bg-neon-cyan', glow: 'glow-cyan' },
  yellow: { text: 'text-neon-yellow', border: 'border-neon-yellow', bg: 'bg-neon-yellow', glow: '' },
  pink: { text: 'text-neon-pink', border: 'border-neon-pink', bg: 'bg-neon-pink', glow: 'glow-pink' },
  purple: { text: 'text-neon-purple', border: 'border-neon-purple', bg: 'bg-neon-purple', glow: '' },
};

export default function Timeline() {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  return (
    <section id="timeline" className="relative py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="font-pixel text-[10px] text-neon-cyan tracking-widest mb-4">[ SELECT YOUR ERA ]</p>
        <h2 className="font-pixel text-2xl sm:text-3xl md:text-4xl mb-4">
          Linha do <span className="text-neon-pink text-glow-pink">Tempo</span>
        </h2>
        <p className="font-retro text-xl text-muted-foreground max-w-2xl mx-auto">
          Cinco eras. Cinco mini-games. Uma viagem completa pela história dos pixels.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-green via-neon-pink to-neon-purple md:-translate-x-1/2" />

        <div className="space-y-12">
          {ERAS.map((era, i) => {
            const c = COLOR_MAP[era.color];
            const isCompleted = progress[era.id]?.completed;
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={era.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Node */}
                <div className={`absolute left-8 md:left-1/2 -translate-x-1/2 w-5 h-5 ${c.bg} rounded-sm ${c.glow} z-10 flex items-center justify-center`}>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-background" />}
                </div>

                {/* Card */}
                <div className={`pl-20 md:pl-0 w-full md:w-[calc(50%-2rem)] ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                  <Link to={`/era/${era.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`group relative bg-card/80 backdrop-blur border ${c.border}/30 rounded-lg p-6 cursor-pointer hover:${c.border} transition-all overflow-hidden`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${c.text.replace('text-', 'from-')}/0 to-transparent group-hover:${c.text.replace('text-', 'from-')}/5 transition-opacity`} />
                      <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'md:justify-end' : ''}`}>
                        <span className={`font-pixel text-[10px] ${c.text} tracking-widest`}>
                          {era.era.toUpperCase()}
                        </span>
                      </div>
                      <div className={`flex items-baseline gap-3 mb-3 ${isLeft ? 'md:justify-end' : ''}`}>
                        <h3 className={`font-pixel text-lg sm:text-xl ${c.text}`}>{era.title}</h3>
                        <span className="font-pixel text-xs text-muted-foreground">{era.year}</span>
                      </div>
                      <p className="font-retro text-lg text-muted-foreground mb-4 leading-snug">
                        {era.subtitle}
                      </p>
                      <div className={`flex items-center gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                        {isCompleted && (
                          <span className="font-pixel text-[9px] text-neon-green flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {progress[era.id].score} PTS
                          </span>
                        )}
                        <span className={`font-pixel text-[10px] ${c.text} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                          JOGAR <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                </div>

                {/* Year on opposite side (desktop) */}
                <div className={`hidden md:block w-[calc(50%-2rem)] ${isLeft ? 'pl-12' : 'pr-12 text-right'}`}>
                  <span className={`font-pixel text-4xl lg:text-6xl ${c.text}/30`}>{era.year}</span>
                </div>
              </motion.div>
            );
          })}

          {/* Modern era */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex items-center md:flex-row"
          >
            <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-5 h-5 bg-foreground rounded-full z-10 animate-pulse-glow" />
            <div className="pl-20 md:pl-0 w-full md:w-[calc(50%-2rem)] md:pr-12 md:text-right">
              <Link to="/modern">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-card to-card/50 border border-foreground/20 rounded-lg p-6 cursor-pointer hover:border-foreground/50 transition-all"
                >
                  <span className="font-pixel text-[10px] text-foreground tracking-widest">2020s · HOJE</span>
                  <h3 className="font-pixel text-lg sm:text-xl mt-2 mb-3">Era Moderna</h3>
                  <p className="font-retro text-lg text-muted-foreground">
                    Ray tracing, mundos abertos, IA, VR e jogos como serviço.
                  </p>
                </motion.div>
              </Link>
            </div>
            <div className="hidden md:block w-[calc(50%-2rem)] pl-12">
              <span className="font-pixel text-4xl lg:text-6xl text-foreground/20">2026</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}