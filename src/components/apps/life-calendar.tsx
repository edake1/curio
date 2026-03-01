'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { LIFE_EXPECTANCY, DEFAULT_COUNTRY_STATS, DEFAULT_COUNTRY, DEFAULT_BIRTH_YEAR, BIRTH_YEAR_MIN, BIRTH_YEAR_MAX, WEEKS_PER_YEAR } from '@/data/countries';

/** Life milestones to annotate on the calendar */
const MILESTONES = [
  { ageYears: 5, label: 'Started school' },
  { ageYears: 18, label: 'Adult' },
  { ageYears: 30, label: 'Thirty' },
  { ageYears: 50, label: 'Half century' },
  { ageYears: 65, label: 'Retirement age' },
] as const;

/** Returns a Tailwind color class based on how far through life that week is */
function weekColor(weekIndex: number, weeksLived: number, totalWeeks: number): string {
  if (weekIndex >= weeksLived) return 'bg-zinc-800/60';
  const pct = weekIndex / totalWeeks;
  if (pct < 0.25) return 'bg-emerald-500';
  if (pct < 0.5) return 'bg-cyan-500';
  if (pct < 0.75) return 'bg-amber-500';
  return 'bg-rose-500';
}

export function LifeCalendarApp() {
  const [birthYear, setBirthYear] = useState(DEFAULT_BIRTH_YEAR);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const lifeExpectancy = LIFE_EXPECTANCY[country] || DEFAULT_COUNTRY_STATS.lifeExpectancy;
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const weeksLived = Math.floor(age * WEEKS_PER_YEAR);
  const totalWeeks = Math.floor(lifeExpectancy * WEEKS_PER_YEAR);
  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);
  const percentLived = totalWeeks > 0 ? Math.round((weeksLived / totalWeeks) * 100) : 0;

  // Determine which milestones have been passed
  const milestoneWeeks = useMemo(() => 
    MILESTONES.map(m => ({ ...m, week: Math.floor(m.ageYears * WEEKS_PER_YEAR), passed: age >= m.ageYears })),
    [age]
  );

  return (
    <div className="py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl sm:text-6xl mb-3 sm:mb-4">📅</motion.div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Life Calendar</h2>
        <p className="text-zinc-400 text-sm sm:text-base">Your life in weeks. One powerful visualization.</p>
      </div>
      <div className="max-w-md mx-auto mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 px-4">
        <div>
          <label className="text-xs sm:text-sm text-zinc-400 mb-1 block">Birth Year</label>
          <Input 
            type="number" 
            value={birthYear} 
            onChange={(e) => setBirthYear(parseInt(e.target.value) || DEFAULT_BIRTH_YEAR)} 
            min={BIRTH_YEAR_MIN} 
            max={BIRTH_YEAR_MAX} 
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

      {/* Progress summary */}
      <div className="text-center mb-4 sm:mb-5 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-zinc-500 text-xs sm:text-sm">{weeksLived.toLocaleString()} weeks lived</span>
            <span className="text-zinc-500 text-xs sm:text-sm">{(totalWeeks - weeksLived).toLocaleString()} remaining</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentLived}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 via-amber-500 to-rose-500"
            />
          </div>
          <p className="text-zinc-400 text-xs mt-1.5">{percentLived}% of expected lifetime</p>
        </div>
      </div>

      {/* Milestones */}
      <div className="max-w-lg mx-auto px-4 mb-4 sm:mb-5">
        <div className="flex flex-wrap gap-2 justify-center">
          {milestoneWeeks.map(m => (
            <div key={m.label} className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border ${
              m.passed 
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-600'
            }`}>
              {m.passed ? '✓' : '○'} {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Week grid */}
      <div className="max-w-2xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.6 }}
          className="flex flex-wrap gap-0.5 justify-center"
        >
          {Array.from({ length: totalWeeks }).map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-sm ${weekColor(i, weeksLived, totalWeeks)} transition-colors`} 
              title={`Week ${i + 1} — Age ${Math.floor(i / WEEKS_PER_YEAR)}`} 
            />
          ))}
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-4 sm:mt-6 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-emerald-500" /><span className="text-zinc-400">Youth</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-cyan-500" /><span className="text-zinc-400">Young adult</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-amber-500" /><span className="text-zinc-400">Middle age</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-rose-500" /><span className="text-zinc-400">Later years</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-zinc-800/60" /><span className="text-zinc-400">Remaining</span></div>
        </div>
      </div>
    </div>
  );
}
