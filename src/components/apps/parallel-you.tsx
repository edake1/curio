'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ChevronDown, Search } from 'lucide-react';
import {
  LIFE_EXPECTANCY, COUNTRY_STATS, DEFAULT_COUNTRY_STATS,
  DEFAULT_COUNTRY, DEFAULT_BIRTH_YEAR, BIRTH_YEAR_MIN, BIRTH_YEAR_MAX,
  WEEKS_PER_YEAR, COUNTRY_FLAGS,
} from '@/data/countries';

const ALL_COUNTRIES = Object.keys(COUNTRY_FLAGS).sort();
const YOU_ACCENT    = '#818cf8';

// ── Helpers ──────────────────────────────────────────────────────
function parseIncome(s: string): number {
  return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
}
function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}
function sign(n: number) { return n >= 0 ? '+' : '−'; }

function computeLife(birthYear: number, country: string) {
  const stat      = COUNTRY_STATS[country] || DEFAULT_COUNTRY_STATS;
  const le        = LIFE_EXPECTANCY[country] || stat.lifeExpectancy;
  const age       = new Date().getFullYear() - birthYear;
  const yearsLeft = Math.max(0, le - age);
  const pctLived  = Math.min(1, Math.max(0, age / le));
  const workYears = Math.max(0, age - 22);
  const hoursWorked = Math.round(workYears * WEEKS_PER_YEAR * stat.workHoursPerWeek);
  const incomeNum = parseIncome(stat.avgIncome);
  return { ...stat, lifeExpectancy: le, age, yearsLeft, pctLived, hoursWorked, incomeNum };
}

// ── CountrySelect ─────────────────────────────────────────────────
function CountrySelect({
  value, onChange, accent, label,
}: {
  value: string; onChange: (c: string) => void; accent: string; label: string;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const inputRef          = useRef<HTMLInputElement>(null);
  const wrapRef           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const filtered = useMemo(
    () => query.trim()
      ? ALL_COUNTRIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
      : ALL_COUNTRIES,
    [query],
  );

  const le = LIFE_EXPECTANCY[value] || DEFAULT_COUNTRY_STATS.lifeExpectancy;

  return (
    <div ref={wrapRef} className="flex-1 min-w-0 space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">{label}</p>

      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
          dark:bg-white/[0.04] bg-black/[0.04]
          border dark:border-white/[0.08] border-black/[0.09]
          hover:dark:bg-white/[0.07] hover:bg-black/[0.07]
          transition-colors duration-150 text-left"
        style={open ? { border: `1px solid ${accent}45` } : {}}>
        <span className="text-xl leading-none flex-shrink-0">{COUNTRY_FLAGS[value] ?? '🏳'}</span>
        <span className="text-[13px] font-semibold dark:text-white text-zinc-900 flex-1 truncate">{value}</span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}35` }}>
          {le.toFixed(1)}yr
        </span>
        <ChevronDown className="w-3 h-3 dark:text-zinc-500 text-zinc-400 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {/* Inline panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-xl border dark:border-white/[0.08] border-black/[0.09] dark:bg-black/40 bg-white/80 backdrop-blur-sm"
            style={{ borderColor: `${accent}30` }}>
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg dark:bg-white/[0.05] bg-black/[0.04] mb-2">
                <Search className="w-3 h-3 dark:text-zinc-500 text-zinc-400 flex-shrink-0" />
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search countries…"
                  className="flex-1 bg-transparent text-[12px] dark:text-white text-zinc-900 placeholder:dark:text-zinc-600 placeholder:text-zinc-400 outline-none" />
              </div>
              <div className="flex flex-wrap gap-1 max-h-[150px] overflow-y-auto
                [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:transparent
                [&::-webkit-scrollbar-thumb]:rounded-full"
                style={{ scrollbarColor: `${accent}40 transparent` }}>
                {filtered.length === 0 && (
                  <p className="text-[11px] dark:text-zinc-500 text-zinc-400 px-1 py-1">No matches</p>
                )}
                {filtered.map(c => {
                  const sel = c === value;
                  return (
                    <button key={c}
                      onClick={() => { onChange(c); setOpen(false); setQuery(''); }}
                      className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-all duration-100 font-medium whitespace-nowrap ${
                        sel ? '' : 'dark:border-white/[0.06] border-black/[0.07] dark:text-zinc-400 text-zinc-600 dark:hover:text-white hover:text-zinc-900'
                      }`}
                      style={sel ? { background: `${accent}1a`, border: `1px solid ${accent}45`, color: accent } : {}}>
                      {COUNTRY_FLAGS[c]} {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── LifeBar ───────────────────────────────────────────────────────
function LifeBar({ pctLived, accent, lifeExpectancy, yearsLeft }: {
  pctLived: number; accent: string; lifeExpectancy: number; yearsLeft: number;
}) {
  return (
    <div className="space-y-1">
      <div className="relative h-1.5 rounded-full dark:bg-white/[0.07] bg-black/[0.09] overflow-hidden">
        <motion.div className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pctLived * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
          style={{ background: `linear-gradient(to right, ${accent}55, ${accent})` }} />
      </div>
      <div className="flex justify-between text-[9px]">
        <span className="dark:text-zinc-600 text-zinc-400">Age {Math.round(pctLived * lifeExpectancy)}</span>
        <span style={{ color: accent }} className="font-semibold">{Math.round(yearsLeft)} yrs left</span>
        <span className="dark:text-zinc-600 text-zinc-400">{lifeExpectancy} avg</span>
      </div>
    </div>
  );
}

// ── InsightCard ───────────────────────────────────────────────────
function InsightCard({ icon, headline, story, accent }: {
  icon: string; headline: string; story: string; accent: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex-1 min-w-[150px] rounded-2xl p-4 space-y-1.5
        dark:bg-white/[0.03] bg-black/[0.03]
        border dark:border-white/[0.06] border-black/[0.07]">
      <span className="text-lg leading-none block">{icon}</span>
      <p className="text-[22px] font-bold leading-none tabular-nums" style={{ color: accent }}>{headline}</p>
      <p className="text-[11px] dark:text-zinc-400 text-zinc-500 leading-relaxed">{story}</p>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export function ParallelYouApp() {
  const [birthYear,       setBirthYear]       = useState(DEFAULT_BIRTH_YEAR);
  const [yourCountry,     setYourCountry]     = useState(DEFAULT_COUNTRY);
  const [parallelCountry, setParallelCountry] = useState('Japan');

  const you      = useMemo(() => computeLife(birthYear, yourCountry),     [birthYear, yourCountry]);
  const parallel = useMemo(() => computeLife(birthYear, parallelCountry), [birthYear, parallelCountry]);

  // Diffs
  const lifeDiff         = parallel.lifeExpectancy - you.lifeExpectancy;
  const vacationDiff     = parallel.vacationDays - you.vacationDays;
  const retireDiff       = parallel.retirementAge - you.retirementAge;
  const annualIncomeDiff = parallel.incomeNum - you.incomeNum;
  const happinessDiff    = parallel.happinessRank - you.happinessRank; // lower = happier
  const hoursDiff        = parallel.hoursWorked - you.hoursWorked;

  // Comparison stats rows [label, your value, parallel value]
  const statsRows: [string, string, string][] = [
    ['Life exp.',   `${you.lifeExpectancy.toFixed(1)} yrs`,  `${parallel.lifeExpectancy.toFixed(1)} yrs`],
    ['Vacation/yr', `${you.vacationDays} days`,              `${parallel.vacationDays} days`],
    ['Retirement',  `age ${you.retirementAge}`,              `age ${parallel.retirementAge}`],
    ['Work week',   `${you.workHoursPerWeek} hrs`,           `${parallel.workHoursPerWeek} hrs`],
    ['Income',      you.avgIncome + '/yr',                   parallel.avgIncome + '/yr'],
    ['Happiness',   `#${you.happinessRank} global`,          `#${parallel.happinessRank} global`],
  ];

  // Narrative insights
  const GREEN = '#4ade80';
  const RED   = '#f87171';

  const insights = [
    {
      icon: '⏳',
      headline: `${sign(lifeDiff)}${Math.abs(lifeDiff).toFixed(1)} yrs`,
      story: Math.abs(lifeDiff) < 0.3
        ? `Your life expectancy would be nearly identical to your current reality.`
        : lifeDiff > 0
        ? `In ${parallelCountry} you'd live ${lifeDiff.toFixed(1)} more years — ${Math.round(lifeDiff * 365).toLocaleString()} extra days.`
        : `In ${parallelCountry} you'd die ${(-lifeDiff).toFixed(1)} years earlier on average.`,
      accent: lifeDiff >= -0.3 ? GREEN : RED,
    },
    vacationDiff !== 0 ? {
      icon: '🏖',
      headline: `${sign(vacationDiff)}${Math.abs(vacationDiff)} days/yr`,
      story: vacationDiff > 0
        ? `${vacationDiff} extra vacation days yearly. Over a 40-year career that's ${vacationDiff * 40} more days — ${Math.round(vacationDiff * 40 / 7)} extra weeks not at a desk.`
        : `You'd give up ${Math.abs(vacationDiff)} paid days every year — ${Math.abs(vacationDiff) * 40} days over a full career.`,
      accent: vacationDiff > 0 ? GREEN : RED,
    } : null,
    retireDiff !== 0 ? {
      icon: '🏁',
      headline: retireDiff < 0 ? `${Math.abs(retireDiff)} yrs earlier` : `${retireDiff} yrs later`,
      story: retireDiff < 0
        ? `You'd retire at ${parallel.retirementAge} instead of ${you.retirementAge} — ${Math.abs(retireDiff)} extra years of freedom before the finish line.`
        : `You'd keep working until ${parallel.retirementAge}, ${retireDiff} years longer than in ${yourCountry}.`,
      accent: retireDiff <= 0 ? GREEN : RED,
    } : null,
    {
      icon: '💰',
      headline: `${sign(annualIncomeDiff)}${fmtMoney(Math.abs(annualIncomeDiff))}/yr`,
      story: annualIncomeDiff === 0
        ? `Income would be roughly the same in both timelines.`
        : `A ${fmtMoney(Math.abs(annualIncomeDiff))} annual gap that becomes ${fmtMoney(Math.abs(annualIncomeDiff * 40))} over a 40-year career — before cost of living.`,
      accent: annualIncomeDiff >= 0 ? GREEN : RED,
    },
    Math.abs(happinessDiff) >= 5 ? {
      icon: '🌍',
      headline: `#${parallel.happinessRank} vs #${you.happinessRank}`,
      story: happinessDiff < 0
        ? `${parallelCountry} ranks ${Math.abs(happinessDiff)} places higher in the World Happiness Report. That gap is real and measurable.`
        : `${parallelCountry} ranks ${happinessDiff} places lower in the World Happiness Report than ${yourCountry}.`,
      accent: happinessDiff <= 0 ? GREEN : RED,
    } : null,
    Math.abs(hoursDiff) > 500 ? {
      icon: '🕐',
      headline: `${sign(-hoursDiff)}${Math.abs(hoursDiff).toLocaleString()} hrs`,
      story: hoursDiff < 0
        ? `You'd have worked ${Math.abs(hoursDiff).toLocaleString()} fewer hours since age 22 — that's ${Math.round(Math.abs(hoursDiff) / 8)} fewer workdays.`
        : `You'd have clocked ${hoursDiff.toLocaleString()} more hours since age 22 — ${Math.round(hoursDiff / 8)} extra workdays.`,
      accent: hoursDiff <= 0 ? GREEN : RED,
    } : null,
  ].filter(Boolean) as { icon: string; headline: string; story: string; accent: string }[];

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">

      {/* ── Birth year ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Born in</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setBirthYear(y => Math.max(BIRTH_YEAR_MIN, y - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center border dark:bg-white/[0.04] bg-black/[0.05] dark:border-white/[0.09] border-black/[0.1] hover:scale-110 active:scale-95 transition-transform">
              <Minus className="w-3 h-3 dark:text-zinc-400 text-zinc-600" />
            </button>
            <span className="text-2xl font-bold tabular-nums dark:text-white text-zinc-900 w-16 text-center">{birthYear}</span>
            <button onClick={() => setBirthYear(y => Math.min(BIRTH_YEAR_MAX, y + 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center border dark:bg-white/[0.04] bg-black/[0.05] dark:border-white/[0.09] border-black/[0.1] hover:scale-110 active:scale-95 transition-transform">
              <Plus className="w-3 h-3 dark:text-zinc-400 text-zinc-600" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-bold dark:text-white text-zinc-900">{you.age} <span className="text-[12px] font-normal dark:text-zinc-500 text-zinc-400">yrs old</span></p>
          <p className="text-[11px] dark:text-zinc-500 text-zinc-400">same in both timelines</p>
        </div>
      </div>

      {/* ── Country selectors ─────────────────────────── */}
      <div className="flex gap-4 items-start">
        <CountrySelect value={yourCountry}     onChange={setYourCountry}     accent={YOU_ACCENT} label="Your reality" />
        <div className="flex flex-col items-center gap-1 pt-8 flex-shrink-0">
          <div className="w-px h-5 dark:bg-white/[0.08] bg-black/[0.1]" />
          <span className="text-[10px] dark:text-zinc-600 text-zinc-400 font-semibold">vs</span>
          <div className="w-px h-5 dark:bg-white/[0.08] bg-black/[0.1]" />
        </div>
        <CountrySelect value={parallelCountry} onChange={setParallelCountry} accent="#38bdf8"   label="Parallel you" />
      </div>

      {/* ── Comparison card ───────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={`${yourCountry}-${parallelCountry}-${birthYear}`}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl overflow-hidden border dark:border-white/[0.07] border-black/[0.09]">
          <div className="grid grid-cols-2">

            {/* Your side */}
            <div className="p-4 sm:p-5 border-r dark:border-white/[0.07] border-black/[0.09] space-y-3"
              style={{ background: `linear-gradient(150deg, ${YOU_ACCENT}0d 0%, transparent 60%)` }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{COUNTRY_FLAGS[yourCountry] ?? '🏳'}</span>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: YOU_ACCENT }}>Your life</p>
                  <p className="text-[12px] font-bold dark:text-white text-zinc-900 leading-tight mt-0.5">{yourCountry}</p>
                </div>
              </div>
              <LifeBar pctLived={you.pctLived} accent={YOU_ACCENT} lifeExpectancy={you.lifeExpectancy} yearsLeft={you.yearsLeft} />
              <div className="space-y-1.5">
                {statsRows.map(([label, yourVal]) => (
                  <div key={label} className="flex justify-between gap-2 text-[11px]">
                    <span className="dark:text-zinc-500 text-zinc-400 shrink-0">{label}</span>
                    <span className="dark:text-zinc-200 text-zinc-700 font-medium text-right">{yourVal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parallel side */}
            <div className="p-4 sm:p-5 space-y-3"
              style={{ background: `linear-gradient(150deg, ${'#38bdf8'}0d 0%, transparent 60%)` }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{COUNTRY_FLAGS[parallelCountry] ?? '🏳'}</span>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: '#38bdf8' }}>Parallel you</p>
                  <p className="text-[12px] font-bold dark:text-white text-zinc-900 leading-tight mt-0.5">{parallelCountry}</p>
                </div>
              </div>
              <LifeBar pctLived={parallel.pctLived} accent="#38bdf8" lifeExpectancy={parallel.lifeExpectancy} yearsLeft={parallel.yearsLeft} />
              <div className="space-y-1.5">
                {statsRows.map(([label, , parallelVal]) => (
                  <div key={label} className="flex justify-between gap-2 text-[11px]">
                    <span className="dark:text-zinc-500 text-zinc-400 shrink-0">{label}</span>
                    <span className="dark:text-zinc-200 text-zinc-700 font-medium text-right">{parallelVal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Insights ──────────────────────────────────── */}
      {insights.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">What this means for your life</p>
          <AnimatePresence mode="wait">
            <motion.div key={`ins-${yourCountry}-${parallelCountry}-${birthYear}`}
              className="flex flex-wrap gap-2">
              {insights.map((ins, i) => (
                <InsightCard key={i} icon={ins.icon} headline={ins.headline} story={ins.story} accent={ins.accent} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}


