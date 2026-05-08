import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Home as HomeIcon, Sparkles, Globe, Users, Eye, Brain, Glasses,
  Trophy, RotateCcw, CheckCircle2 } from
'lucide-react';
import ComparisonCard from '@/components/modern/ComparisonCard';
import { ERAS } from '@/lib/erasData';
import { getProgress, getTotalScore, resetProgress } from '@/lib/progress';
import { Button } from '@/components/ui/button';

const FEATURES = [
{ icon: Sparkles, title: 'Ray Tracing', desc: 'Iluminação fotorrealista calculada em tempo real, simulando como a luz se comporta no mundo real.', gradient: 'from-amber-500 to-rose-500', year: '2018+' },
{ icon: Globe, title: 'Mundo Aberto', desc: 'Mapas gigantescos com sistemas dinâmicos, NPCs com rotinas e física emergente.', gradient: 'from-emerald-500 to-cyan-500', year: '2010+' },
{ icon: Users, title: 'Multiplayer Massivo', desc: 'Milhões de jogadores compartilhando o mesmo universo persistente.', gradient: 'from-fuchsia-500 to-purple-500', year: '2000+' },
{ icon: Eye, title: 'Realismo Gráfico', desc: 'Personagens indistinguíveis de atores reais com captura de movimento avançada.', gradient: 'from-blue-500 to-indigo-500', year: '2020+' },
{ icon: Brain, title: 'IA Generativa', desc: 'NPCs que conversam dinamicamente e mundos gerados proceduralmente em tempo real.', gradient: 'from-rose-500 to-orange-500', year: '2024+' },
{ icon: Glasses, title: 'VR & AR', desc: 'Experiências totalmente imersivas em 360° com presença física e interação corporal.', gradient: 'from-cyan-500 to-blue-500', year: '2016+' }];


const COMPARISONS = [
{ from: { year: '1972', game: 'Pong', specs: '128 bytes RAM · 2 cores · 60Hz CRT' }, to: { year: '2025', game: 'GTA VI', specs: '64 GB RAM · 16M cores · 8K 120Hz HDR' } },
{ from: { year: '1980', game: 'Pac-Man', specs: '~16 KB ROM · sprites 2D · 4 fantasmas' }, to: { year: '2023', game: 'BG3', specs: '150 GB · centenas de NPCs · IA reativa' } },
{ from: { year: '1985', game: 'Super Mario', specs: '40 KB · scroll lateral · 32 níveis' }, to: { year: '2024', game: 'Elden Ring', specs: '60 GB · mundo aberto · física global' } }];


export default function ModernEra() {
  const [progress, setProgress] = useState({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setProgress(getProgress());
    setTotal(getTotalScore());
    window.scrollTo(0, 0);
  }, []);

  const allCompleted = ERAS.every((e) => progress[e.id]?.completed);

  const handleReset = () => {
    if (confirm('Reiniciar todo o progresso?')) {
      resetProgress();
      setProgress(getProgress());
      setTotal(0);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/era/fps" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-pixel text-[10px]">ERA ANTERIOR</span>
          </Link>
          <span className="font-pixel text-[10px] text-foreground">2026 · MODERNO</span>
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <HomeIcon className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-fuchsia-500/10 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="font-pixel text-[10px] tracking-widest text-muted-foreground mb-4">
            
            [ HOJE · 2026 ]
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tight mb-6">
            
            A era em que jogos viraram{' '}
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent font-light italic">
              experiências
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-retro text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
            
            De 128 bytes a 128 GB. De duas barras numa tela preta a universos fotorrealistas
            povoados por inteligência artificial.
          </motion.p>
        </div>
      </section>

      {/* Trophy / Stats */}
      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-neon-green/10 via-card to-neon-pink/10 border border-border rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-foreground/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-neon-yellow" />
              </div>
              <div>
                <p className="font-pixel text-[10px] text-muted-foreground tracking-widest mb-1">PONTUAÇÃO TOTAL</p>
                <p className="font-pixel text-2xl sm:text-3xl text-neon-green">{String(total).padStart(6, '0')}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {ERAS.map((era) => {
                const done = progress[era.id]?.completed;
                return (
                  <div key={era.id} className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${done ? 'border-neon-green bg-neon-green/10' : 'border-border bg-muted/30'}`}>
                      {done ? <CheckCircle2 className="w-5 h-5 text-neon-green" /> : <span className="font-pixel text-[8px] text-muted-foreground">?</span>}
                    </div>
                    <span className="font-pixel text-[8px] text-muted-foreground">{era.year}</span>
                  </div>);

              })}
            </div>
          </div>
          {allCompleted &&
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t border-border text-center">
            
              <p className="font-pixel text-xs text-neon-yellow text-glow-yellow mb-1">★ CONQUISTA DESBLOQUEADA ★</p>
              <p className="font-retro text-lg">Historiador dos Pixels — Você completou todas as eras!</p>
            </motion.div>
          }
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mb-12 text-center">
            
            <p className="font-pixel text-[10px] text-neon-cyan tracking-widest mb-3">[ TECNOLOGIAS ATUAIS ]</p>
            <h2 className="text-3xl sm:text-4xl font-light">O estado da arte hoje</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) =>
            <ComparisonCard key={i} {...f} />
            )}
          </div>
        </div>
      </section>

      {/* Then vs Now */}
      <section className="py-16 px-6 bg-gradient-to-b from-background via-card/30 to-background">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mb-12 text-center">
            
            <p className="font-pixel text-[10px] text-neon-yellow tracking-widest mb-3">[ ANTES vs AGORA ]</p>
            <h2 className="text-3xl sm:text-4xl font-light">A escala da evolução</h2>
          </motion.div>

          <div className="space-y-6">
            {COMPARISONS.map((c, i) =>
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4 p-6 rounded-xl border border-border bg-card/50">
              
                <div className="text-center md:text-right">
                  <span className="font-pixel text-[10px] text-muted-foreground">{c.from.year}</span>
                  <h3 className="font-pixel text-sm sm:text-base mt-1 mb-2 text-neon-green">{c.from.game}</h3>
                  <p className="font-retro text-base text-muted-foreground">{c.from.specs}</p>
                </div>
                <div className="flex justify-center">
                  <div className="font-pixel text-[10px] px-3 py-1 rounded-full border border-border bg-background text-muted-foreground">
                    →
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-pixel text-[10px] text-muted-foreground">{c.to.year}</span>
                  <h3 className="font-pixel text-sm sm:text-base mt-1 mb-2 text-neon-pink">{c.to.game}</h3>
                  <p className="font-retro text-base text-muted-foreground">{c.to.specs}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto">
          
          <p className="font-pixel text-[10px] text-muted-foreground tracking-widest mb-4">[ FIM DA JORNADA ]</p>
          <h2 className="text-3xl sm:text-4xl font-light mb-4">
            E a história continua escrevendo<br />
            <span className="italic text-neon-pink">o próximo nível</span>.
          </h2>
          <p className="font-retro text-lg text-muted-foreground mb-8">
            Obrigado por viajar pelo tempo conosco. O futuro dos jogos está só começando.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button size="lg" className="font-pixel text-xs gap-2 bg-foreground text-background hover:bg-foreground/90">
                <HomeIcon className="w-4 h-4" /> VOLTAR AO INÍCIO
              </Button>
            </Link>
            <Button onClick={handleReset} size="lg" variant="outline" className="font-pixel text-xs gap-2">
              <RotateCcw className="w-4 h-4" /> JOGAR NOVAMENTE
            </Button>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/50 py-8 px-6 text-center">
        <p className="font-pixel text-[10px] text-muted-foreground">1972 ◆ 2026

        </p>
      </footer>
    </div>);

}