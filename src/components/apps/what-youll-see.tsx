'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { LIFE_EXPECTANCY, DEFAULT_COUNTRY_STATS, DEFAULT_COUNTRY, DEFAULT_AGE } from '@/data/countries';
import { FUTURE_EVENTS } from '@/data/future-events';

export function WhatYoullSeeApp() {
  const [age, setAge] = useState(DEFAULT_AGE);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);
  const events = useMemo(() => {
    const lifeExpectancy = LIFE_EXPECTANCY[country] || DEFAULT_COUNTRY_STATS.lifeExpectancy;
    const yearsLeft = Math.max(0, lifeExpectancy - age);
    const currentYear = new Date().getFullYear();
    return FUTURE_EVENTS.filter(e => e.year <= currentYear + yearsLeft && e.year >= currentYear);
  }, [age, country]);

  return (
    <div className="py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔭</div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">What You&apos;ll See</h2>
        <p className="text-zinc-400 text-sm sm:text-base">Future events you might witness.</p>
      </div>
      <div className="max-w-md mx-auto mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 px-4">
        <div>
          <label className="text-xs sm:text-sm text-zinc-400 mb-1 block">Your Age</label>
          <Input 
            type="number" 
            value={age} 
            onChange={(e) => setAge(parseInt(e.target.value) || DEFAULT_AGE)} 
            min={1} 
            max={120} 
            className="bg-zinc-900 border-zinc-700 h-11 sm:h-10"
          />
        </div>
        <div>
          <label className="text-xs sm:text-sm text-zinc-400 mb-1 block">Country</label>
          <select 
            value={country} 
            onChange={(e) => setCountry(e.target.value)} 
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2.5 sm:py-2 text-zinc-100 text-base h-11 sm:h-10"
          >
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="max-w-2xl mx-auto space-y-2 sm:space-y-3 px-4">
        {events.map((event, i) => (
          <motion.div 
            key={event.year + event.event} 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: i * 0.05 }} 
            className="flex items-start sm:items-center gap-3 sm:gap-4 bg-zinc-900/50 border border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4"
          >
            <div className="text-base sm:text-lg font-bold text-indigo-400 w-12 sm:w-16 shrink-0">{event.year}</div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-200 text-sm sm:text-base">{event.event}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${event.certainty * 100}%` }} />
                </div>
                <span className="text-[10px] sm:text-xs text-zinc-500 shrink-0">{Math.round(event.certainty * 100)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
