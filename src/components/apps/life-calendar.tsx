'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LIFE_EXPECTANCY, DEFAULT_COUNTRY_STATS, DEFAULT_COUNTRY,
  DEFAULT_BIRTH_YEAR, BIRTH_YEAR_MIN, BIRTH_YEAR_MAX, WEEKS_PER_YEAR,
} from '@/data/countries';

const COLS   = 52;
const ACCENT = '#818cf8';

// Milestone labels that appear as row dividers
const MILESTONES: Record<number, { emoji: string; label: string }> = {
  5:  { emoji: '🎒', label: 'Started school' },
  13: { emoji: '🧒', label: 'Teenager' },
  18: { emoji: '🎓', label: 'Adult' },
  30: { emoji: '✨', label: 'Thirty' },
  40: { emoji: '🔥', label: 'Forty' },
  50: { emoji: '👑', label: 'Half century' },
  65: { emoji: '🏖', label: 'Retirement' },
};

// Ages where we add extra gap (decade breaks)
const DECADE_BREAKS = new Set([10, 20, 30, 40, 50, 60, 70, 80]);

function getPhaseColor(weekIdx: number, totalWeeks: number): string {
  const pct = weekIdx / totalWeeks;
  if (pct < 0.25) return '#10b981'; // emerald — youth
  if (pct < 0.5)  return '#06b6d4'; // cyan — young adult
  if (pct < 0.75) return '#f59e0b'; // amber — middle age
  return '#f87171';                  // rose  — later years
}

function getPhaseName(weekIdx: number, totalWeeks: number): string {
  const pct = weekIdx / totalWeeks;
  if (pct < 0.25) return 'Youth';
  if (pct < 0.5)  return 'Young adult';
  if (pct < 0.75) return 'Middle age';
  return 'Later years';
}

type TooltipInfo = {
  week: number; age: number; calYear: number;
  phase: string; color: string; lived: boolean;
  x: number; y: number;
};

// ── BirthYearInput ────────────────────────────────────────────────
function BirthYearInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw]       = useState(String(value));
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Birth Year</p>
      <motion.label
        animate={{
          boxShadow: focused
            ? `0 0 0 1.5px ${ACCENT}55, 0 0 18px ${ACCENT}22`
            : '0 0 0 1px rgba(255,255,255,0)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-2xl cursor-text
          dark:bg-white/[0.05] bg-black/[0.04]
          border dark:border-white/[0.08] border-black/[0.08]"
      >
        <span className="text-base select-none">🗓️</span>
        <input
          type="text" inputMode="numeric"
          value={focused ? raw : String(value)}
          onFocus={() => { setFocused(true); setRaw(String(value)); }}
          onBlur={() => {
            setFocused(false);
            const v = parseInt(raw, 10);
            if (!isNaN(v) && v >= BIRTH_YEAR_MIN && v <= BIRTH_YEAR_MAX) onChange(v);
            else setRaw(String(value));
          }}
          onChange={e => setRaw(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'ArrowUp')   { e.preventDefault(); onChange(Math.min(BIRTH_YEAR_MAX, value + 1)); }
            if (e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(BIRTH_YEAR_MIN, value - 1)); }
          }}
          className="text-[1.6rem] font-bold tabular-nums bg-transparent outline-none w-[4.5rem]
            transition-colors duration-200 dark:text-white text-zinc-900
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ color: focused ? ACCENT : undefined }}
        />
      </motion.label>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export function LifeCalendarApp() {
  const [birthYear, setBirthYear] = useState(DEFAULT_BIRTH_YEAR);
  const [country,   setCountry]   = useState(DEFAULT_COUNTRY);
  const [tooltip,   setTooltip]   = useState<TooltipInfo | null>(null);
  const gridRef                   = useRef<HTMLDivElement>(null);

  const lifeExpectancy = LIFE_EXPECTANCY[country] || DEFAULT_COUNTRY_STATS.lifeExpectancy;
  const currentYear    = new Date().getFullYear();
  const weeksLived     = Math.floor((currentYear - birthYear) * WEEKS_PER_YEAR);
  const totalWeeks     = Math.floor(lifeExpectancy * WEEKS_PER_YEAR);
  const weeksLeft      = Math.max(0, totalWeeks - weeksLived);
  const pct            = Math.min(100, Math.max(0, (weeksLived / totalWeeks) * 100));
  const currentAge     = currentYear - birthYear;
  const totalYears     = Math.ceil(lifeExpectancy);

  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);

  // Event-delegated tooltip handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest('[data-week]') as HTMLElement | null;
    if (!el) { setTooltip(null); return; }
    const weekIdx  = parseInt(el.dataset.week!, 10);
    const lived    = weekIdx < weeksLived;
    const age      = Math.floor(weekIdx / COLS);
    const calYear  = birthYear + age;
    const rect     = gridRef.current?.getBoundingClientRect();
    setTooltip({
      week: weekIdx + 1, age, calYear,
      phase: getPhaseName(weekIdx, totalWeeks),
      color: getPhaseColor(weekIdx, totalWeeks),
      lived,
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top  ?? 0),
    });
  }, [weeksLived, totalWeeks, birthYear]);

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">

      {/* ── Controls row ──────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <BirthYearInput value={birthYear} onChange={setBirthYear} />
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Country</p>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="bg-transparent outline-none text-[13px] font-semibold dark:text-white text-zinc-900
              cursor-pointer rounded-2xl px-3 pr-8 py-2
              dark:bg-white/[0.05] bg-black/[0.04]
              border dark:border-white/[0.08] border-black/[0.08]
              [color-scheme:dark]"
          >
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Hero stat row ─────────────────────────────── */}
      <div
        className="rounded-2xl border dark:border-white/[0.07] border-black/[0.09] p-4 sm:p-5"
        style={{ background: `linear-gradient(135deg, ${ACCENT}0d 0%, transparent 55%)` }}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3 items-end">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-0.5">You are in</p>
            <p className="text-[2.8rem] font-black tabular-nums leading-none" style={{ color: ACCENT }}>
              week {Math.max(1, weeksLived).toLocaleString()}
            </p>
            <p className="text-[12px] dark:text-zinc-500 text-zinc-400 mt-0.5">age {currentAge}</p>
          </div>
          <div className="w-px self-stretch dark:bg-white/[0.06] bg-black/[0.06]" />
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">Weeks lived</p>
              <p className="text-[1.4rem] font-bold tabular-nums text-emerald-400 leading-none">{weeksLived.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">Weeks left</p>
              <p className="text-[1.4rem] font-bold tabular-nums text-rose-400 leading-none">{weeksLeft.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">Life used</p>
              <p className="text-[1.4rem] font-bold tabular-nums text-amber-400 leading-none">{pct.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        {/* Sub-bar */}
        <div className="relative h-1.5 rounded-full dark:bg-white/[0.06] bg-black/[0.07] mt-4 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4, #f59e0b, #f87171)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2">
          Every dot is one week of your life
        </p>

        {/* Scrollable grid wrapper */}
        <div className="overflow-x-auto rounded-2xl border dark:border-white/[0.07] border-black/[0.09] dark:bg-white/[0.02] bg-black/[0.02] p-3 sm:p-4">
          <div
            ref={gridRef}
            className="relative min-w-[500px] pl-7"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {tooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.12 }}
                  className="absolute z-50 pointer-events-none px-2.5 py-2 rounded-xl border text-left"
                  style={{
                    left: Math.min(tooltip.x + 12, 420),
                    top:  tooltip.y - 70,
                    borderColor: tooltip.lived ? `${tooltip.color}55` : 'rgba(255,255,255,0.1)',
                    background:  tooltip.lived ? `${tooltip.color}15` : 'rgba(20,20,30,0.9)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <p className="text-[11px] font-bold" style={{ color: tooltip.lived ? tooltip.color : '#71717a' }}>
                    Week {tooltip.week.toLocaleString()}
                  </p>
                  <p className="text-[10px] dark:text-zinc-400 text-zinc-500">
                    Age {tooltip.age} · ~{tooltip.calYear}
                  </p>
                  {tooltip.lived && (
                    <p className="text-[10px] mt-0.5" style={{ color: tooltip.color }}>{tooltip.phase}</p>
                  )}
                  {!tooltip.lived && (
                    <p className="text-[10px] text-zinc-600 mt-0.5">not yet lived</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Year rows */}
            {Array.from({ length: totalYears }, (_, yearIdx) => {
              const milestone    = MILESTONES[yearIdx];
              const isDecade     = DECADE_BREAKS.has(yearIdx) && !milestone;
              const showAgeLabel = yearIdx % 5 === 0;

              return (
                <div key={yearIdx}>
                  {/* Decade spacer */}
                  {isDecade && <div className="h-2" />}

                  {/* Milestone divider */}
                  {milestone && (
                    <div className="flex items-center gap-2 my-1.5">
                      <div className="flex-1 h-px dark:bg-white/[0.08] bg-black/[0.08]" />
                      <span className="text-[9px] font-semibold dark:text-zinc-500 text-zinc-400 whitespace-nowrap">
                        {milestone.emoji} {milestone.label}
                      </span>
                      <div className="flex-1 h-px dark:bg-white/[0.08] bg-black/[0.08]" />
                    </div>
                  )}

                  {/* Row with age label + 52 dots */}
                  <div className="relative flex items-center gap-[2px] mb-[2px]">
                    {/* Age label rail */}
                    <div className="absolute -left-7 w-6 text-right">
                      {showAgeLabel && (
                        <span className="text-[9px] tabular-nums dark:text-zinc-600 text-zinc-400 leading-none">
                          {yearIdx}
                        </span>
                      )}
                    </div>

                    {/* 52 week dots */}
                    {Array.from({ length: COLS }, (_, colIdx) => {
                      const weekIdx      = yearIdx * COLS + colIdx;
                      const isCurrentWeek = weekIdx === weeksLived;
                      const isLived       = weekIdx < weeksLived;
                      const isFuture      = weekIdx > totalWeeks;

                      if (isFuture) return <div key={colIdx} className="w-[9px] h-[9px] sm:w-[10px] sm:h-[10px] flex-shrink-0" />;

                      if (isCurrentWeek) {
                        return (
                          <motion.div
                            key={colIdx}
                            data-week={weekIdx}
                            className="w-[9px] h-[9px] sm:w-[10px] sm:h-[10px] flex-shrink-0 rounded-[2px] relative z-10"
                            style={{ backgroundColor: '#ffffff' }}
                            animate={{
                              boxShadow: [
                                `0 0 0 0px ${ACCENT}00`,
                                `0 0 0 3px ${ACCENT}90`,
                                `0 0 0 0px ${ACCENT}00`,
                              ],
                            }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        );
                      }

                      return (
                        <div
                          key={colIdx}
                          data-week={weekIdx}
                          className="w-[9px] h-[9px] sm:w-[10px] sm:h-[10px] flex-shrink-0 rounded-[2px] cursor-pointer transition-opacity hover:opacity-80"
                          style={
                            isLived
                              ? { backgroundColor: getPhaseColor(weekIdx, totalWeeks) }
                              : { backgroundColor: 'rgba(255,255,255,0.055)' }
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 justify-center">
          {[
            { color: '#10b981', label: 'Youth (0–25%)' },
            { color: '#06b6d4', label: 'Young adult (25–50%)' },
            { color: '#f59e0b', label: 'Middle age (50–75%)' },
            { color: '#f87171', label: 'Later years (75–100%)' },
            { color: 'rgba(255,255,255,0.055)', label: 'Remaining', border: true },
            { color: '#ffffff',   label: 'You, right now' },
          ].map(({ color, label, border }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-[2px] flex-shrink-0"
                style={{
                  backgroundColor: color,
                  border: border ? '1px solid rgba(255,255,255,0.12)' : undefined,
                }}
              />
              <span className="text-[10px] dark:text-zinc-500 text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
