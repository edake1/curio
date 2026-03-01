'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { LIFE_STATS, MS_PER_DAY, MS_PER_HOUR, computeLifeStat } from '@/data/life-stats';
import { DEFAULT_BIRTH_YEAR } from '@/data/countries';

/** Top-level age stats with distinct gradients */
const AGE_CARDS = [
  { key: 'years', label: 'Years', gradient: 'from-orange-500/10 to-amber-500/10', border: 'border-orange-500/20', color: 'text-orange-400' },
  { key: 'days', label: 'Days', gradient: 'from-rose-500/10 to-pink-500/10', border: 'border-rose-500/20', color: 'text-rose-400' },
  { key: 'hours', label: 'Hours', gradient: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/20', color: 'text-violet-400' },
] as const;

export function LifeStatsApp() {
  const [birthDate, setBirthDate] = useState(`${DEFAULT_BIRTH_YEAR}-01-01`);
  const stats = useMemo(() => {
    const birth = new Date(birthDate);
    const diff = Date.now() - birth.getTime();
    const days = Math.floor(diff / MS_PER_DAY);
    return {
      years: Math.floor(days / 365),
      days,
      hours: Math.floor(diff / MS_PER_HOUR),
      computed: LIFE_STATS.map(stat => ({
        ...stat,
        value: computeLifeStat(stat, diff),
      })),
    };
  }, [birthDate]);

  const ageValues: Record<string, number> = { years: stats.years, days: stats.days, hours: stats.hours };

  return (
    <div className="py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl sm:text-6xl mb-3 sm:mb-4"
        >
          ⏱️
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Your Life Stats</h2>
        <p className="text-zinc-400 text-sm sm:text-base">Your age in weird, wonderful units.</p>
      </div>
      <div className="max-w-md mx-auto mb-4 sm:mb-6 px-4">
        <label className="text-xs sm:text-sm text-zinc-400 mb-1 block">Your Birthday</label>
        <Input 
          type="date" 
          value={birthDate} 
          onChange={(e) => setBirthDate(e.target.value)} 
          className="bg-zinc-900 border-zinc-700 h-11 sm:h-10"
        />
      </div>

      {/* Primary age cards with gradients */}
      <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2 sm:gap-3 px-4">
        {AGE_CARDS.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.08, ease: 'easeOut' }}
            className={`bg-gradient-to-br ${card.gradient} ${card.border} border rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}
          >
            <div className={`text-xl sm:text-2xl font-bold ${card.color}`}>{(ageValues[card.key] ?? 0).toLocaleString()}</div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Body stats with staggered animations */}
      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4 px-4">
        {stats.computed.map((item, i) => (
          <motion.div 
            key={item.key} 
            initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.25 + i * 0.08, ease: 'easeOut' }}
            className="flex items-center gap-2.5 sm:gap-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 group"
          >
            <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{item.emoji}</div>
            <div className="min-w-0">
              <div className={`text-base sm:text-lg font-bold ${item.color} tabular-nums`}>{item.value.toLocaleString()}</div>
              <div className="text-[10px] sm:text-xs text-zinc-500">{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
