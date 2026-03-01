'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { LIFE_EXPECTANCY, COUNTRY_STATS, DEFAULT_COUNTRY_STATS, DEFAULT_COUNTRY, DEFAULT_BIRTH_YEAR, BIRTH_YEAR_MIN, BIRTH_YEAR_MAX } from '@/data/countries';

export function ParallelYouApp() {
  const [birthYear, setBirthYear] = useState(DEFAULT_BIRTH_YEAR);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);

  const parallelLife = useMemo(() => {
    const le = LIFE_EXPECTANCY[country] || DEFAULT_COUNTRY_STATS.lifeExpectancy;
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const yearsLeft = Math.max(0, Math.round(le - age));
    const stat = COUNTRY_STATS[country] || DEFAULT_COUNTRY_STATS;
    return { country, age, lifeExpectancy: Math.round(le), yearsLeft, workHoursPerWeek: stat.workHoursPerWeek, avgIncome: stat.avgIncome, funFact: stat.funFact };
  }, [birthYear, country]);

  return (
    <div className="py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🌍</div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Parallel You</h2>
        <p className="text-zinc-400 text-sm sm:text-base">What if you were born somewhere else?</p>
      </div>
      <div className="max-w-md mx-auto space-y-4 sm:space-y-6 px-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm text-zinc-400 mb-1 block">Birth Year</label>
            <Input 
              type="number" 
              value={birthYear} 
              onChange={(e) => setBirthYear(parseInt(e.target.value) || DEFAULT_BIRTH_YEAR)} 
              min={BIRTH_YEAR_MIN} 
              max={BIRTH_YEAR_MAX} 
              className="bg-zinc-900 border-zinc-700 h-11 sm:h-10 text-base"
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
        <motion.div key={country + birthYear} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-emerald-400 mb-3 sm:mb-4">If you were born in {parallelLife.country} in {birthYear}:</h3>
          <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Your age</span><span className="text-zinc-100">{parallelLife.age} years old</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Life expectancy</span><span className="text-zinc-100">{parallelLife.lifeExpectancy} years</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Years left (average)</span><span className={parallelLife.yearsLeft > 20 ? 'text-emerald-400' : 'text-amber-400'}>{parallelLife.yearsLeft} years</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Avg. work week</span><span className="text-zinc-100">{parallelLife.workHoursPerWeek} hours</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Avg. income</span><span className="text-zinc-100">{parallelLife.avgIncome}/year</span></div>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-emerald-800/50">
            <p className="text-emerald-300 italic text-xs sm:text-sm">💡 {parallelLife.funFact}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
