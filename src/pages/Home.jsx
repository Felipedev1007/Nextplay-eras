import React from 'react';
import Hero from '@/components/landing/Hero';
import Timeline from '@/components/landing/Timeline';
import { motion } from 'framer-motion';
import { Trophy, Gamepad2, Zap, History } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-neon-green" />
            <span className="font-pixel text-[10px] tracking-widest">Evolução dos Jogos  </span>
          </div>
          

          
        </div>
      </header>

      <Hero />
      <Timeline />

      {/* Why section */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-center mb-12">
          
          <p className="font-pixel text-[10px] text-neon-yellow tracking-widest mb-4">[ POR QUE JOGAR? ]</p>
          <h2 className="font-pixel text-2xl sm:text-3xl">
            Mais que um <span className="text-neon-yellow text-glow-yellow">site</span>.
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
          { icon: History, title: 'Educativo', desc: 'Aprenda como jogos evoluíram graficamente, mecanicamente e tecnologicamente.', color: 'text-neon-green' },
          { icon: Gamepad2, title: 'Jogável', desc: 'Cinco mini-games autorais inspirados em clássicos absolutos da história.', color: 'text-neon-pink' },
          { icon: Trophy, title: 'Nostálgico', desc: 'Som retrô, pixel art e uma estética que faz justiça aos pioneiros do gênero.', color: 'text-neon-cyan' }].
          map((item, i) =>
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="border border-border rounded-lg p-6 bg-card/50 hover:bg-card transition-colors">
            
              <item.icon className={`w-8 h-8 mb-4 ${item.color}`} />
              <h3 className="font-pixel text-sm mb-2">{item.title}</h3>
              <p className="font-retro text-lg text-muted-foreground leading-snug">{item.desc}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6 text-center">
        <p className="font-pixel text-[10px] text-muted-foreground">InfoNet III

        </p>
      </footer>
    </div>);

}