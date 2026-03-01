'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LIFE_STATS, MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, computeLifeStat } from '@/data/life-stats';
import { DEFAULT_BIRTH_YEAR } from '@/data/countries';

// How many per second for each stat
const RATES_PER_SEC: Record<string, number> = {
  heartbeats: 72 / 60,
  breaths:    16 / 60,
  blinks:     15 / 60,
  dreams:     0.1 / 3600,
  laughs:     15 / 86400,
  steps:      8_000 / 86400,
  words:      16_000 / 86400,
  sleep:      8 / 86400,
  meals:      3 / 86400,
};

const STAT_CONTEXT: Record<string, (n: number) => string> = {
  heartbeats: n => `≈ ${Math.round(n * 0.07 / 1_000).toLocaleString()}k litres of blood pumped`,
  breaths:    n => `≈ ${Math.round(n * 0.5 / 1_000).toLocaleString()}k litres of air inhaled`,
  blinks:     n => `≈ ${Math.round(n * 0.15 / 3_600).toFixed(0)} hrs with eyes closed`,
  dreams:     _ => `a rich inner world you'll mostly forget`,
  laughs:     n => `≈ ${(n / 365.25).toFixed(0)} laughs per day, every day`,
  steps:      n => `≈ ${(n * 0.000762).toFixed(0)} km walked in your lifetime`,
  words:      n => `≈ ${(n / 80_000).toFixed(1)} novels worth of speech`,
  sleep:      n => `≈ ${(n / 8 / 365.25).toFixed(1)} years spent unconscious`,
  meals:      n => `${Math.round(n / 7)} weeks of food consumed`,
};

const ACCENT = '#f59e0b';

// ── "Right now" pulsing cards ────────────────────────────────────
function HeartbeatCard({ sessionBeats }: { sessionBeats: number }) {
  return (
    <motion.div
      animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 20px 6px rgba(239,68,68,0.25)', '0 0 0 0 rgba(239,68,68,0)'] }}
      transition={{ duration: 60 / 72, repeat: Infinity, ease: 'easeOut' }}
      className="flex-1 rounded-2xl p-4 border dark:border-white/[0.07] border-black/[0.08] dark:bg-white/[0.03] bg-black/[0.03] flex flex-col items-center gap-2"
    >
      <motion.span
        className="text-3xl leading-none"
        animate={{ scale: [1, 1.45, 1.2, 1] }}
        transition={{ duration: 60 / 72, repeat: Infinity, times: [0, 0.14, 0.28, 1], ease: 'easeOut' }}
      >
        💓
      </motion.span>
      <p className="text-[1.4rem] font-black tabular-nums text-rose-400 leading-none">{sessionBeats.toLocaleString()}</p>
      <p className="text-[10px] font-semibold dark:text-zinc-500 text-zinc-400 text-center">Beats since<br/>you arrived</p>
      <p className="text-[10px] dark:text-zinc-600 text-zinc-400">72 bpm</p>
    </motion.div>
  );
}

function BreathCard({ sessionBreaths }: { sessionBreaths: number }) {
  return (
    <div className="flex-1 rounded-2xl p-4 border dark:border-white/[0.07] border-black/[0.08] dark:bg-white/[0.03] bg-black/[0.03] flex flex-col items-center gap-2">
      <motion.span
        className="text-3xl leading-none"
        animate={{ scale: [1, 1.18, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 60 / 16, repeat: Infinity, ease: 'easeInOut' }}
      >
        🫁
      </motion.span>
      <p className="text-[1.4rem] font-black tabular-nums text-sky-400 leading-none">{sessionBreaths.toLocaleString()}</p>
      <p className="text-[10px] font-semibold dark:text-zinc-500 text-zinc-400 text-center">Breaths since<br/>you arrived</p>
      <p className="text-[10px] dark:text-zinc-600 text-zinc-400">16 /min</p>
    </div>
  );
}

function BlinkCard({ sessionBlinks }: { sessionBlinks: number }) {
  return (
    <div className="flex-1 rounded-2xl p-4 border dark:border-white/[0.07] border-black/[0.08] dark:bg-white/[0.03] bg-black/[0.03] flex flex-col items-center gap-2">
      <motion.span
        className="text-3xl leading-none inline-block"
        animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
        transition={{ duration: 60 / 15, repeat: Infinity, times: [0, 0.78, 0.84, 0.9, 1], ease: 'easeInOut' }}
        style={{ display: 'inline-block' }}
      >
        👁️
      </motion.span>
      <p className="text-[1.4rem] font-black tabular-nums text-violet-400 leading-none">{sessionBlinks.toLocaleString()}</p>
      <p className="text-[10px] font-semibold dark:text-zinc-500 text-zinc-400 text-center">Blinks since<br/>you arrived</p>
      <p className="text-[10px] dark:text-zinc-600 text-zinc-400">15 /min</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export function LifeStatsApp() {
  const [birthDate, setBirthDate]     = useState(`${DEFAULT_BIRTH_YEAR}-01-01`);
  const [dateFocused, setDateFocused] = useState(false);
  const [now, setNow]                 = useState(() => Date.now());
  const pageOpenTime                  = useRef(Date.now());

  useEffect(() => {
    pageOpenTime.current = Date.now();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const birthTime = useMemo(
    () => new Date(birthDate + 'T00:00:00').getTime(),
    [birthDate],
  );

  // Lifetime elapsed
  const elapsed   = Math.max(0, now - birthTime);
  const totalDays = Math.floor(elapsed / MS_PER_DAY);
  const years     = Math.floor(elapsed / (MS_PER_DAY * 365.25));
  const hours     = Math.floor(elapsed / MS_PER_HOUR);
  const minutes   = Math.floor(elapsed / MS_PER_MINUTE);
  const seconds   = Math.floor(elapsed / 1000);

  // Since-you-opened elapsed
  const sessionElapsed  = Math.max(0, now - pageOpenTime.current);
  const sessionBeats    = Math.floor(sessionElapsed / 1000 * RATES_PER_SEC.heartbeats);
  const sessionBreaths  = Math.floor(sessionElapsed / 1000 * RATES_PER_SEC.breaths);
  const sessionBlinks   = Math.floor(sessionElapsed / 1000 * RATES_PER_SEC.blinks);
  const sessionSeconds  = Math.floor(sessionElapsed / 1000);

  // Lifetime stat cards (skip heartbeats/breaths/blinks — shown above)
  const lifetimeCards = LIFE_STATS
    .filter(s => !['heartbeats', 'breaths', 'blinks'].includes(s.key))
    .map(stat => ({
      ...stat,
      value: computeLifeStat(stat, elapsed),
      context: STAT_CONTEXT[stat.key]?.(computeLifeStat(stat, elapsed)) ?? '',
    }));

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">

      {/* ── Birthday chip + live dot ──────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Your Birthday</p>
          <motion.label
            animate={{
              boxShadow: dateFocused
                ? `0 0 0 1.5px ${ACCENT}55, 0 0 18px ${ACCENT}22`
                : '0 0 0 1px rgba(255,255,255,0)',
            }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-2xl cursor-pointer
              dark:bg-white/[0.05] bg-black/[0.04]
              border dark:border-white/[0.08] border-black/[0.08]"
          >
            <span className="text-base select-none">🎂</span>
            <input
              type="date"
              value={birthDate}
              onFocus={() => setDateFocused(true)}
              onBlur={() => setDateFocused(false)}
              onChange={e => { setBirthDate(e.target.value); pageOpenTime.current = Date.now(); }}
              className="bg-transparent outline-none text-[13px] font-semibold dark:text-white text-zinc-900
                cursor-pointer [color-scheme:dark]"
            />
          </motion.label>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span className="text-[10px] dark:text-zinc-500 text-zinc-400 font-medium">live</span>
        </div>
      </div>

      {/* ── Hero: alive for ───────────────────────────── */}
      <div
        className="rounded-2xl border dark:border-white/[0.07] border-black/[0.09] p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, transparent 55%)' }}
      >
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2">
          You&apos;ve been alive for
        </p>
        {/* Days — hero number */}
        <p className="text-[3.5rem] sm:text-[4.5rem] font-black tabular-nums leading-none text-amber-400">
          {totalDays.toLocaleString()}
        </p>
        <p className="text-[13px] dark:text-zinc-500 text-zinc-400 mt-1 font-medium">days</p>

        {/* Sub-row: years / hours / minutes / seconds */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t dark:border-white/[0.06] border-black/[0.06]">
          {[
            { label: 'Years',   val: years,   color: 'text-orange-400' },
            { label: 'Hours',   val: hours,   color: 'text-violet-400' },
            { label: 'Minutes', val: minutes, color: 'text-sky-400' },
            { label: 'Seconds', val: seconds, color: 'text-emerald-400' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">{label}</p>
              <p className={`text-[1.5rem] font-bold tabular-nums leading-none ${color}`}>
                {val.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right now in your body ────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">
          Right now in your body
        </p>
        <div className="flex gap-2 sm:gap-3">
          <HeartbeatCard sessionBeats={sessionBeats} />
          <BreathCard    sessionBreaths={sessionBreaths} />
          <BlinkCard     sessionBlinks={sessionBlinks} />
        </div>
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-2 text-center">
          counted in the {sessionSeconds}s you&apos;ve been on this page
        </p>
      </div>

      {/* ── Lifetime stats ────────────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">
          In your lifetime, your body has…
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {lifetimeCards.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl sm:rounded-2xl p-3.5 sm:p-4
                dark:bg-white/[0.03] bg-black/[0.03]
                border dark:border-white/[0.07] border-black/[0.07]"
            >
              <span className="text-2xl leading-none">{stat.emoji}</span>
              <p className={`text-[1.35rem] font-bold tabular-nums leading-none mt-2.5 ${stat.color}`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-[11px] font-semibold dark:text-white/70 text-zinc-600 mt-1">{stat.label}</p>
              {stat.context && (
                <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mt-1 leading-snug">{stat.context}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
