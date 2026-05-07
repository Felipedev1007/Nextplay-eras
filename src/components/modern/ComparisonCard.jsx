import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function ComparisonCard({ year, title, desc, gradient, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="w-7 h-7 text-foreground" />
          <span className="font-pixel text-[10px] text-muted-foreground">{year}</span>
        </div>
        <h3 className="font-pixel text-sm mb-3">{title}</h3>
        <p className="font-retro text-lg text-muted-foreground leading-snug">{desc}</p>
      </div>
    </motion.div>
  );
}