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

// Life expectancy baseline (global average)
const LIFE_EXP_YEARS        = 73;
const LIFE_EXP_MS           = LIFE_EXP_YEARS * 365.25 * MS_PER_DAY;
const TOTAL_LIFETIME_BEATS  = Math.round(LIFE_EXP_YEARS * 365.25 * 24 * 60 * 72); // ~2.76B

// Round-number milestones to count toward
const DAY_MILESTONES  = [5_000, 10_000, 15_000, 20_000, 25_000, 30_000];

function getNextMilestone(totalDays: number): { label: string; daysLeft: number } | null {
  for (const m of DAY_MILESTONES) {
    if (totalDays < m) return { label: `${m.toLocaleString()} days alive`, daysLeft: m - totalDays };
  }
  return null;
}

// ── Mana bar (life remaining) ────────────────────────────────────
function ManaBar({ pct }: { pct: number }) {
  const clamped  = Math.min(1, Math.max(0, pct));
  const remaining = 1 - clamped;
  const manaDisplay = (remaining * 100).toFixed(1);
  // Colour shifts: high mana = indigo, low = fading violet
  const barColor = remaining > 0.4
    ? 'linear-gradient(90deg, #6366f1, #818cf8)'
    : remaining > 0.2
    ? 'linear-gradient(90deg, #7c3aed, #a78bfa)'
    : 'linear-gradient(90deg, #7f1d1d, #ef4444)';
  const glowColor = remaining > 0.4 ? 'rgba(99,102,241,0.6)' : 'rgba(239,68,68,0.5)';
  return (
    <div
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: remaining > 0.4 ? 'rgba(99,102,241,0.2)' : 'rgba(239,68,68,0.2)',
        background: remaining > 0.4
          ? 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 55%)'
          : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 55%)',
      }}
    >
      <div className="flex justify-between items-baseline mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔮</span>
          <p className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: remaining > 0.4 ? '#818cf8' : '#f87171' }}>
            Mana
          </p>
        </div>
        <p className="text-[13px] font-bold"
          style={{ color: remaining > 0.4 ? '#818cf8' : '#f87171' }}>
          {manaDisplay}%
        </p>
      </div>
      {/* Track — shows remaining (right to empty) */}
      <div className="relative h-2.5 rounded-full dark:bg-white/[0.06] bg-black/[0.07] overflow-visible">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${remaining * 100}%` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Glowing cursor */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full"
          style={{ background: '#fff', boxShadow: `0 0 10px 3px ${glowColor}`, border: `2px solid ${remaining > 0.4 ? '#818cf8' : '#ef4444'}` }}
          initial={{ left: 0 }}
          animate={{ left: `calc(${remaining * 100}% - 7px)` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400">Full at birth</p>
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400">Depletes at ~{LIFE_EXP_YEARS}</p>
      </div>
    </div>
  );
}

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

  // Life progress
  const pctLived       = elapsed / LIFE_EXP_MS;
  const beatsLived     = Math.floor((elapsed / MS_PER_MINUTE) * 72);
  const beatsRemaining = Math.max(0, TOTAL_LIFETIME_BEATS - beatsLived);
  const milestone      = getNextMilestone(totalDays);

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

      {/* ── Mana bar ──────────────────────────────────── */}
      <ManaBar pct={pctLived} />

      {/* ── Hero: alive for ───────────────────────────── */}
      <div
        className="rounded-2xl border dark:border-white/[0.07] border-black/[0.09] p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, transparent 55%)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">
            You&apos;ve been alive for
          </p>
          {/* Level badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30"
            style={{ background: 'rgba(245,158,11,0.1)' }}>
            <span className="text-[10px]">⚔️</span>
            <span className="text-[11px] font-black tracking-wide text-amber-400">LVL {years}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* XP (days) — hero number */}
          <div className="flex-shrink-0">
            <p className="text-[3.5rem] sm:text-[4.5rem] font-black tabular-nums leading-none text-amber-400">
              {totalDays.toLocaleString()}
            </p>
            <p className="text-[13px] dark:text-zinc-500 text-zinc-400 mt-1 font-medium">XP &nbsp;<span className="text-[11px] opacity-60">(days)</span></p>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch dark:bg-white/[0.06] bg-black/[0.06]" />

          {/* Sub-stats grid — fills remaining space */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { label: 'Years',   val: years,   color: 'text-orange-400' },
              { label: 'Hours',   val: hours,   color: 'text-violet-400' },
              { label: 'Minutes', val: minutes, color: 'text-sky-400' },
              { label: 'Seconds', val: seconds, color: 'text-emerald-400' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">{label}</p>
                <p className={`text-[1.2rem] font-bold tabular-nums leading-none ${color}`}>
                  {val.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Heartbeats remaining + next milestone ─────── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">

        {/* Beats remaining — ticks down */}
        <div
          className="rounded-2xl border border-rose-500/20 p-4 flex flex-col gap-1"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, transparent 60%)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <motion.span
              className="text-xl leading-none"
              animate={{ scale: [1, 1.35, 1.15, 1] }}
              transition={{ duration: 60 / 72, repeat: Infinity, times: [0, 0.14, 0.28, 1], ease: 'easeOut' }}
            >
              ❤️
            </motion.span>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-rose-400/70">HP Remaining</p>
          </div>
          <p className="text-[1.4rem] font-black tabular-nums text-rose-400 leading-none">
            {beatsRemaining.toLocaleString()}
          </p>
          <p className="text-[10px] dark:text-zinc-500 text-zinc-400 leading-snug mt-0.5">
            estimated heartbeats left in your life
          </p>
        </div>

        {/* Next milestone */}
        {milestone && (
          <div
            className="rounded-2xl border border-amber-500/20 p-4 flex flex-col gap-1"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, transparent 60%)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xl leading-none">�</span>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-amber-400/70">Next Achievement</p>
            </div>
            <p className="text-[1.4rem] font-black tabular-nums text-amber-400 leading-none">
              {milestone.daysLeft.toLocaleString()}
            </p>
            <p className="text-[10px] dark:text-zinc-500 text-zinc-400 leading-snug mt-0.5">
              XP until {milestone.label}
            </p>
          </div>
        )}
      </div>

      {/* ── Right now in your body ────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">
          ⚡ Active abilities
        </p>
        <div className="flex gap-2 sm:gap-3">
          <HeartbeatCard sessionBeats={sessionBeats} />
          <BreathCard    sessionBreaths={sessionBreaths} />
          <BlinkCard     sessionBlinks={sessionBlinks} />
        </div>
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-2 text-center">
          counted in the {sessionSeconds}s you&apos;ve been on this page
        </p>
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-1 text-center">
          meanwhile, ~{(9_600_000_000 * sessionSeconds).toLocaleString()} heartbeats happened across all 8B humans
        </p>
      </div>

      {/* ── Lifetime stats ────────────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">
          📜 Lifetime records
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
