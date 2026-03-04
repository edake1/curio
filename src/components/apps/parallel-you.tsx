'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import {
  LIFE_EXPECTANCY, COUNTRY_STATS, DEFAULT_COUNTRY_STATS,
  DEFAULT_COUNTRY, DEFAULT_BIRTH_YEAR, BIRTH_YEAR_MIN, BIRTH_YEAR_MAX,
  WEEKS_PER_YEAR, COUNTRY_FLAGS,
} from '@/data/countries';

const ALL_COUNTRIES = Object.keys(COUNTRY_FLAGS).sort();
const YOU_ACCENT   = '#818cf8';
const PAR_ACCENT   = '#38bdf8';
const WIN          = '#4ade80';

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
  const workHrsDay = +(stat.workHoursPerWeek / 5).toFixed(1);
  return { ...stat, lifeExpectancy: le, age, yearsLeft, pctLived, hoursWorked, incomeNum, workHrsDay };
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

// ── LifeBar (thicker, with pulsing "you are here" dot) ──────────
function LifeBar({ pctLived, accent, lifeExpectancy, yearsLeft, age }: {
  pctLived: number; accent: string; lifeExpectancy: number; yearsLeft: number; age: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="relative h-2.5 rounded-full dark:bg-white/[0.07] bg-black/[0.09] overflow-hidden">
        <motion.div className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pctLived * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
          style={{ background: `linear-gradient(to right, ${accent}55, ${accent})`,
                   boxShadow: `0 0 12px ${accent}40` }} />
        {/* pulsing "now" dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
          initial={{ left: 0 }}
          animate={{ left: `calc(${pctLived * 100}% - 6px)` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
          style={{ background: accent, borderColor: 'var(--background, #000)',
                   boxShadow: `0 0 8px ${accent}60` }}
        />
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="dark:text-zinc-500 text-zinc-400">Age {age}</span>
        <span style={{ color: accent }} className="font-semibold">{Math.round(yearsLeft)} yrs left</span>
        <span className="dark:text-zinc-500 text-zinc-400">{lifeExpectancy.toFixed(1)} avg</span>
      </div>
    </div>
  );
}

// ── InsightCard (staggered entrance + tangible sub-headline) ─────
function InsightCard({ icon, headline, subline, story, accent, delay }: {
  icon: string; headline: string; subline?: string; story: string; accent: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 min-w-[150px] rounded-2xl p-4 sm:p-5 space-y-1.5
        dark:bg-white/[0.03] bg-black/[0.03]
        border dark:border-white/[0.06] border-black/[0.07]">
      <span className="text-xl leading-none block">{icon}</span>
      <p className="text-[22px] font-bold leading-none tabular-nums" style={{ color: accent }}>{headline}</p>
      {subline && <p className="text-[10px] font-medium tracking-wide" style={{ color: `${accent}bb` }}>{subline}</p>}
      <p className="text-[11px] dark:text-zinc-400 text-zinc-500 leading-relaxed">{story}</p>
    </motion.div>
  );
}

// ── DayBar (stacked horizontal day breakdown) ────────────────────
function DayBar({ label, accent, flag, sleepHrs, commuteHrs, workHrs }: {
  label: string; accent: string; flag: string; sleepHrs: number; commuteHrs: number; workHrs: number;
}) {
  const leisureHrs = Math.max(0, +(24 - sleepHrs - commuteHrs - workHrs).toFixed(1));
  const segments = [
    { label: 'Sleep',   hrs: sleepHrs,   color: '#64748b' },
    { label: 'Commute', hrs: commuteHrs, color: '#a78bfa' },
    { label: 'Work',    hrs: workHrs,    color: accent },
    { label: 'Free',    hrs: leisureHrs, color: WIN },
  ];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm">{flag}</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">{label}</span>
      </div>
      <div className="flex h-5 rounded-full overflow-hidden">
        {segments.map(seg => (
          <motion.div
            key={seg.label}
            initial={{ width: 0 }}
            animate={{ width: `${(seg.hrs / 24) * 100}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.15 }}
            className="relative group cursor-default"
            style={{ background: seg.color + '55' }}
            title={`${seg.label}: ${seg.hrs}hrs`}
          >
            {seg.hrs >= 2.5 && (
              <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] font-semibold dark:text-white/70 text-black/60 whitespace-nowrap">
                {seg.hrs}h {seg.label.toLowerCase()}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Verdict ──────────────────────────────────────────────────────
function Verdict({ you, parallel, yourCountry, parallelCountry, lifeDiff, vacationDiff, annualIncomeDiff, happinessDiff }: {
  you: ReturnType<typeof computeLife>; parallel: ReturnType<typeof computeLife>;
  yourCountry: string; parallelCountry: string;
  lifeDiff: number; vacationDiff: number; annualIncomeDiff: number; happinessDiff: number;
}) {
  const gains: string[] = [];
  const losses: string[] = [];

  if (lifeDiff > 0.3) gains.push(`${lifeDiff.toFixed(1)} extra years`);
  else if (lifeDiff < -0.3) losses.push(`${(-lifeDiff).toFixed(1)} fewer years`);
  if (vacationDiff > 0) gains.push(`${vacationDiff * 40} more vacation days over your career`);
  else if (vacationDiff < 0) losses.push(`${Math.abs(vacationDiff * 40)} fewer vacation days`);
  if (annualIncomeDiff > 1000) gains.push(`${fmtMoney(annualIncomeDiff)}/yr more income`);
  else if (annualIncomeDiff < -1000) losses.push(`${fmtMoney(Math.abs(annualIncomeDiff))}/yr less income`);
  if (happinessDiff < -3) gains.push(`a happier country (#${parallel.happinessRank} vs #${you.happinessRank})`);
  else if (happinessDiff > 3) losses.push(`a less happy country (#${parallel.happinessRank} vs #${you.happinessRank})`);

  const verdict = gains.length > 0 && losses.length > 0
    ? `You'd trade ${losses.join(' and ')} for ${gains.join(' and ')}.`
    : gains.length > 0
    ? `You'd gain ${gains.join(', ')}.`
    : losses.length > 0
    ? `You'd lose ${losses.join(', ')}.`
    : `Remarkably similar lives — different language, same story.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center space-y-3"
    >
      <div className="flex items-center justify-center gap-3">
        <div className="h-px w-16 dark:bg-white/[0.08] bg-black/[0.1]" />
        <span className="text-[10px] tracking-widest dark:text-zinc-600 text-zinc-400">✦</span>
        <div className="h-px w-16 dark:bg-white/[0.08] bg-black/[0.1]" />
      </div>
      <p className="text-[13px] dark:text-zinc-300 text-zinc-600 leading-relaxed max-w-md mx-auto">
        {verdict}
      </p>
      <p className="text-[15px] font-semibold dark:text-white text-zinc-900">
        Would you take the deal?
      </p>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export function ParallelYouApp() {
  const [birthYear,       setBirthYear]       = useState(DEFAULT_BIRTH_YEAR);
  const [rawYear,         setRawYear]         = useState(String(DEFAULT_BIRTH_YEAR));
  const [yearFocused,     setYearFocused]     = useState(false);
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

// Comparison stats rows [label, your value, parallel value, who "wins" (1 = you, -1 = parallel, 0 = tie)]
  const statsRows: [string, string, string, number][] = [
    ['Life exp.',   `${you.lifeExpectancy.toFixed(1)} yrs`,  `${parallel.lifeExpectancy.toFixed(1)} yrs`, Math.sign(you.lifeExpectancy - parallel.lifeExpectancy)],
    ['Vacation/yr', `${you.vacationDays} days`,              `${parallel.vacationDays} days`, Math.sign(you.vacationDays - parallel.vacationDays)],
    ['Retirement',  `age ${you.retirementAge}`,              `age ${parallel.retirementAge}`, Math.sign(parallel.retirementAge - you.retirementAge)],
    ['Work week',   `${you.workHoursPerWeek} hrs`,           `${parallel.workHoursPerWeek} hrs`, Math.sign(parallel.workHoursPerWeek - you.workHoursPerWeek)],
    ['Income',      you.avgIncome + '/yr',                   parallel.avgIncome + '/yr', Math.sign(you.incomeNum - parallel.incomeNum)],
    ['Happiness',   `#${you.happinessRank} global`,          `#${parallel.happinessRank} global`, Math.sign(parallel.happinessRank - you.happinessRank)],
  ];

  // Narrative insights with tangible sublines
  const GREEN = '#4ade80';
  const RED   = '#f87171';

  const insights = [
    {
      icon: '⏳',
      headline: `${sign(lifeDiff)}${Math.abs(lifeDiff).toFixed(1)} yrs`,
      subline: Math.abs(lifeDiff) >= 0.3 ? `${Math.abs(Math.round(lifeDiff * 365)).toLocaleString()} ${lifeDiff > 0 ? 'extra' : 'fewer'} sunrises` : undefined,
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
      subline: `${Math.abs(Math.round(vacationDiff * 40 / 7))} ${vacationDiff > 0 ? 'extra' : 'fewer'} weeks off over your career`,
      story: vacationDiff > 0
        ? `${vacationDiff} extra vacation days yearly. Over a 40-year career that's ${vacationDiff * 40} more days — ${Math.round(vacationDiff * 40 / 7)} extra weeks not at a desk.`
        : `You'd give up ${Math.abs(vacationDiff)} paid days every year — ${Math.abs(vacationDiff) * 40} days over a full career.`,
      accent: vacationDiff > 0 ? GREEN : RED,
    } : null,
    retireDiff !== 0 ? {
      icon: '🏁',
      headline: retireDiff < 0 ? `${Math.abs(retireDiff)} yrs earlier` : `${retireDiff} yrs later`,
      subline: retireDiff < 0
        ? `${Math.abs(retireDiff)} extra years of freedom`
        : `${retireDiff} more years at a desk`,
      story: retireDiff < 0
        ? `You'd retire at ${parallel.retirementAge} instead of ${you.retirementAge} — ${Math.abs(retireDiff)} extra years of freedom before the finish line.`
        : `You'd keep working until ${parallel.retirementAge}, ${retireDiff} years longer than in ${yourCountry}.`,
      accent: retireDiff <= 0 ? GREEN : RED,
    } : null,
    {
      icon: '💰',
      headline: `${sign(annualIncomeDiff)}${fmtMoney(Math.abs(annualIncomeDiff))}/yr`,
      subline: Math.abs(annualIncomeDiff) > 500 ? `${fmtMoney(Math.abs(annualIncomeDiff * 40))} over a 40-year career` : undefined,
      story: annualIncomeDiff === 0
        ? `Income would be roughly the same in both timelines.`
        : `A ${fmtMoney(Math.abs(annualIncomeDiff))} annual gap that becomes ${fmtMoney(Math.abs(annualIncomeDiff * 40))} over a 40-year career — before cost of living.`,
      accent: annualIncomeDiff >= 0 ? GREEN : RED,
    },
    Math.abs(happinessDiff) >= 5 ? {
      icon: '🌍',
      headline: `#${parallel.happinessRank} vs #${you.happinessRank}`,
      subline: `${Math.abs(happinessDiff)} places ${happinessDiff < 0 ? 'higher' : 'lower'} on the Happiness Index`,
      story: happinessDiff < 0
        ? `${parallelCountry} ranks ${Math.abs(happinessDiff)} places higher in the World Happiness Report. That gap is real and measurable.`
        : `${parallelCountry} ranks ${happinessDiff} places lower in the World Happiness Report than ${yourCountry}.`,
      accent: happinessDiff <= 0 ? GREEN : RED,
    } : null,
    Math.abs(hoursDiff) > 500 ? {
      icon: '🕐',
      headline: `${sign(-hoursDiff)}${Math.abs(hoursDiff).toLocaleString()} hrs`,
      subline: `${Math.abs(Math.round(hoursDiff / 8)).toLocaleString()} ${hoursDiff < 0 ? 'fewer' : 'extra'} workdays since age 22`,
      story: hoursDiff < 0
        ? `You'd have worked ${Math.abs(hoursDiff).toLocaleString()} fewer hours since age 22 — that's ${Math.round(Math.abs(hoursDiff) / 8)} fewer workdays.`
        : `You'd have clocked ${hoursDiff.toLocaleString()} more hours since age 22 — ${Math.round(hoursDiff / 8)} extra workdays.`,
      accent: hoursDiff <= 0 ? GREEN : RED,
    } : null,
  ].filter(Boolean) as { icon: string; headline: string; subline?: string; story: string; accent: string }[];

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-6">

      {/* ── Birth year ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Born in</p>
          <motion.label
            animate={{
              boxShadow: yearFocused
                ? `0 0 0 1.5px ${YOU_ACCENT}55, 0 0 18px ${YOU_ACCENT}22`
                : '0 0 0 1px rgba(255,255,255,0)',
            }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-2xl cursor-text
              dark:bg-white/[0.05] bg-black/[0.04]
              border dark:border-white/[0.08] border-black/[0.08]"
          >
            <span className="text-base select-none">🗓️</span>
            <input
              type="text"
              inputMode="numeric"
              value={yearFocused ? rawYear : String(birthYear)}
              onFocus={() => { setYearFocused(true); setRawYear(String(birthYear)); }}
              onBlur={() => {
                setYearFocused(false);
                const v = parseInt(rawYear, 10);
                if (!isNaN(v) && v >= BIRTH_YEAR_MIN && v <= BIRTH_YEAR_MAX) setBirthYear(v);
                else setRawYear(String(birthYear));
              }}
              onChange={e => setRawYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'ArrowUp') { e.preventDefault(); const next = Math.min(BIRTH_YEAR_MAX, birthYear + 1); setBirthYear(next); setRawYear(String(next)); }
                if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.max(BIRTH_YEAR_MIN, birthYear - 1); setBirthYear(next); setRawYear(String(next)); }
              }}
              className="text-[1.85rem] font-bold tabular-nums bg-transparent outline-none w-[4.8rem] transition-colors duration-200 dark:text-white text-zinc-900
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color: yearFocused ? YOU_ACCENT : undefined }}
            />
          </motion.label>
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
        <CountrySelect value={parallelCountry} onChange={setParallelCountry} accent={PAR_ACCENT} label="Parallel you" />
      </div>

      {/* ── Comparison card with row-level "who wins" ── */}
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
              <LifeBar pctLived={you.pctLived} accent={YOU_ACCENT} lifeExpectancy={you.lifeExpectancy} yearsLeft={you.yearsLeft} age={you.age} />
              <div className="space-y-1.5">
                {statsRows.map(([label, yourVal, , winner]) => (
                  <div key={label} className="flex justify-between gap-2 text-[11px] items-center">
                    <span className="dark:text-zinc-500 text-zinc-400 shrink-0">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {winner === 1 && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: WIN }} />}
                      <span className={`font-medium text-right ${winner === 1 ? 'dark:text-white text-zinc-900' : 'dark:text-zinc-300 text-zinc-600'}`}>{yourVal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parallel side */}
            <div className="p-4 sm:p-5 space-y-3"
              style={{ background: `linear-gradient(150deg, ${PAR_ACCENT}0d 0%, transparent 60%)` }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{COUNTRY_FLAGS[parallelCountry] ?? '🏳'}</span>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: PAR_ACCENT }}>Parallel you</p>
                  <p className="text-[12px] font-bold dark:text-white text-zinc-900 leading-tight mt-0.5">{parallelCountry}</p>
                </div>
              </div>
              <LifeBar pctLived={parallel.pctLived} accent={PAR_ACCENT} lifeExpectancy={parallel.lifeExpectancy} yearsLeft={parallel.yearsLeft} age={parallel.age} />
              <div className="space-y-1.5">
                {statsRows.map(([label, , parallelVal, winner]) => (
                  <div key={label} className="flex justify-between gap-2 text-[11px] items-center">
                    <span className="dark:text-zinc-500 text-zinc-400 shrink-0">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {winner === -1 && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: WIN }} />}
                      <span className={`font-medium text-right ${winner === -1 ? 'dark:text-white text-zinc-900' : 'dark:text-zinc-300 text-zinc-600'}`}>{parallelVal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Daily rhythm bars ─────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={`day-${yourCountry}-${parallelCountry}`}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-4 sm:p-5 space-y-4
            dark:bg-white/[0.02] bg-black/[0.02]
            border dark:border-white/[0.06] border-black/[0.07]">
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">A typical day</p>
          <DayBar label={yourCountry}     accent={YOU_ACCENT} flag={COUNTRY_FLAGS[yourCountry] ?? '🏳'} sleepHrs={8} commuteHrs={1} workHrs={you.workHrsDay} />
          <DayBar label={parallelCountry} accent={PAR_ACCENT} flag={COUNTRY_FLAGS[parallelCountry] ?? '🏳'} sleepHrs={8} commuteHrs={1} workHrs={parallel.workHrsDay} />
          <div className="flex justify-center gap-4 text-[9px] dark:text-zinc-600 text-zinc-400">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#64748b55' }} /> Sleep</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#a78bfa55' }} /> Commute</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: `${YOU_ACCENT}55` }} /> Work</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: `${WIN}55` }} /> Free</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Insights (staggered) ─────────────────────── */}
      {insights.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">What this means for your life</p>
          <AnimatePresence mode="wait">
            <motion.div key={`ins-${yourCountry}-${parallelCountry}-${birthYear}`}
              className="flex flex-wrap gap-2.5">
              {insights.map((ins, i) => (
                <InsightCard key={i} icon={ins.icon} headline={ins.headline} subline={ins.subline} story={ins.story} accent={ins.accent} delay={0.08 * i} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Fun facts (uses existing data) ────────────── */}
      {(you.funFact || parallel.funFact) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">Life in each reality</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Your reality */}
            <div className="rounded-2xl p-4 space-y-2 dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.06] border-black/[0.07]">
              <div className="flex items-center gap-2">
                <span className="text-lg">{COUNTRY_FLAGS[yourCountry] ?? '🏳'}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: YOU_ACCENT }}>{yourCountry}</span>
              </div>
              <p className="text-[12px] dark:text-zinc-300 text-zinc-600 leading-relaxed">{you.funFact}</p>
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400">
                🗣 {you.primaryLanguage} · 👶 {you.avgChildren} children avg
              </p>
            </div>
            {/* Parallel reality */}
            <div className="rounded-2xl p-4 space-y-2 dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.06] border-black/[0.07]">
              <div className="flex items-center gap-2">
                <span className="text-lg">{COUNTRY_FLAGS[parallelCountry] ?? '🏳'}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: PAR_ACCENT }}>{parallelCountry}</span>
              </div>
              <p className="text-[12px] dark:text-zinc-300 text-zinc-600 leading-relaxed">{parallel.funFact}</p>
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400">
                🗣 {parallel.primaryLanguage} · 👶 {parallel.avgChildren} children avg
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── The Verdict ──────────────────────────────── */}
      <Verdict
        you={you} parallel={parallel}
        yourCountry={yourCountry} parallelCountry={parallelCountry}
        lifeDiff={lifeDiff} vacationDiff={vacationDiff}
        annualIncomeDiff={annualIncomeDiff} happinessDiff={happinessDiff}
      />

    </div>
  );
}


