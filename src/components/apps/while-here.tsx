'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GLOBAL_RATES, NET_POPULATION_DISPLAY, computeGlobalStats } from '@/data/global-rates';
import { formatNumber } from '@/lib/utils';

export function WhileHereApp() {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Compute stats entirely client-side — no API calls needed
  const stats = useMemo(() => computeGlobalStats(elapsed), [elapsed]);

  // Build display items from GLOBAL_RATES data (reusable, not hardcoded)
  const displayItems = useMemo(() => {
    const items: Array<{ key: string; emoji: string; label: string; value: number; color: string; prefix?: string }> = GLOBAL_RATES.map(rate => ({
      key: rate.key,
      emoji: rate.emoji,
      label: rate.label,
      value: stats[rate.key] ?? 0,
      color: rate.color,
    }));
    items.push({
      key: NET_POPULATION_DISPLAY.key,
      emoji: NET_POPULATION_DISPLAY.emoji,
      label: NET_POPULATION_DISPLAY.label,
      color: NET_POPULATION_DISPLAY.color,
      prefix: NET_POPULATION_DISPLAY.prefix,
      value: stats.netPopulation ?? 0,
    });
    return items;
  }, [stats]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 250); // 4 fps is smooth enough for counters
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🌍</div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">While You Were Here</h2>
        <p className="text-zinc-400 text-sm sm:text-base">What happened globally while you&apos;ve been here.</p>
      </div>
      <div className="text-center mb-4 sm:mb-6">
        <div className="text-3xl sm:text-4xl font-bold text-sky-400">{Math.floor(elapsed)}s</div>
        <p className="text-zinc-500 text-xs sm:text-sm">time elapsed</p>
      </div>
      {displayItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 px-4"
        >
          {displayItems.map(item => (
            <div key={item.key} className="bg-zinc-900/50 border border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl mb-1">{item.emoji}</div>
              <div className={`text-lg sm:text-xl font-bold ${item.color}`}>
                {'prefix' in item && item.prefix}{formatNumber(item.value)}
              </div>
              <div className="text-[10px] sm:text-xs text-zinc-500">{item.label}</div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
