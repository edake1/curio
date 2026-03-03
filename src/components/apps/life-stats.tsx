'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { LIFE_STATS, MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, computeLifeStat } from "@/data/life-stats";
import { DEFAULT_BIRTH_YEAR } from "@/data/countries";
import { GLOBAL_RATES, NET_POPULATION_DISPLAY, computeGlobalStats } from "@/data/global-rates";
import { formatNumber } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────
// YOUR LIFE STATS — merged You + The World views
// ─────────────────────────────────────────────────────────────────

const ACCENT = "#f59e0b";

// ── You tab constants ────────────────────────────────────────────
const RATES_PER_SEC: Record<string, number> = {
  heartbeats: 72 / 60,
  breaths: 16 / 60,
  blinks: 15 / 60,
  dreams: 0.1 / 3600,
  laughs: 15 / 86400,
  steps: 8_000 / 86400,
  words: 16_000 / 86400,
  sleep: 8 / 86400,
  meals: 3 / 86400,
};

const STAT_CONTEXT: Record<string, (n: number) => string> = {
  heartbeats: (n) => `≈ ${Math.round((n * 0.07) / 1_000).toLocaleString()}k litres of blood pumped`,
  breaths: (n) => `≈ ${Math.round((n * 0.5) / 1_000).toLocaleString()}k litres of air inhaled`,
  blinks: (n) => `≈ ${Math.round((n * 0.15) / 3_600).toFixed(0)} hrs with eyes closed`,
  dreams: (_) => `a rich inner world you'll mostly forget`,
  laughs: (n) => `≈ ${(n / 365.25).toFixed(0)} laughs per day, every day`,
  steps: (n) => `≈ ${(n * 0.000762).toFixed(0)} km walked in your lifetime`,
  words: (n) => `≈ ${(n / 80_000).toFixed(1)} novels worth of speech`,
  sleep: (n) => `≈ ${(n / 8 / 365.25).toFixed(1)} years spent unconscious`,
  meals: (n) => `${Math.round(n / 7)} weeks of food consumed`,
};

const LIFE_EXP_YEARS = 73;
const LIFE_EXP_MS = LIFE_EXP_YEARS * 365.25 * MS_PER_DAY;
const TOTAL_LIFETIME_BEATS = Math.round(LIFE_EXP_YEARS * 365.25 * 24 * 60 * 72);
const DAY_MILESTONES = [5_000, 10_000, 15_000, 20_000, 25_000, 30_000];

function getNextMilestone(totalDays: number): { label: string; daysLeft: number } | null {
  for (const m of DAY_MILESTONES) {
    if (totalDays < m) return { label: `${m.toLocaleString()} days alive`, daysLeft: m - totalDays };
  }
  return null;
}

// ── World tab constants ──────────────────────────────────────────
const WORLD_ACCENT = "#38bdf8";
const FAINT = "rgba(222,198,163,0.13)";

interface StatGroup {
  title: string;
  icon: string;
  keys: string[];
  accent: string;
}

const GROUPS: StatGroup[] = [
  { title: "Life & Death", icon: "🫀", keys: ["births", "deaths", "netPopulation"], accent: "#34d399" },
  { title: "Digital Pulse", icon: "⚡", keys: ["emails", "tweets", "googleSearches"], accent: "#60a5fa" },
  { title: "The Physical World", icon: "🌍", keys: ["pizzas", "youtubeHours", "lightningStrikes"], accent: "#f59e0b" },
];

const RATE_MAP: Record<string, { emoji: string; label: string; color: string; prefix?: string }> = {};
for (const r of GLOBAL_RATES) RATE_MAP[r.key] = { emoji: r.emoji, label: r.label, color: r.color };
RATE_MAP[NET_POPULATION_DISPLAY.key] = {
  emoji: NET_POPULATION_DISPLAY.emoji,
  label: NET_POPULATION_DISPLAY.label,
  color: NET_POPULATION_DISPLAY.color,
  prefix: NET_POPULATION_DISPLAY.prefix,
};

function getWorldContext(key: string, value: number): string | null {
  if (key === "births") {
    if (value >= 1000) return `Enough to fill ${Math.floor(value / 30)} classrooms`;
    if (value >= 100) return `A small village was just born`;
    if (value >= 10) return `A football team of new lives`;
    return null;
  }
  if (key === "deaths") {
    if (value >= 500) return `A neighborhood went silent`;
    if (value >= 50) return `A bus full of final goodbyes`;
    return null;
  }
  if (key === "netPopulation") {
    if (value >= 100) return `Earth just got a little more crowded`;
    return null;
  }
  if (key === "googleSearches") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M questions asked`;
    if (value >= 100_000) return `A city's worth of curiosity`;
    return null;
  }
  if (key === "emails") {
    if (value >= 10_000_000) return `More words than every book in a library`;
    return null;
  }
  if (key === "pizzas") {
    if (value >= 1000) return `A pizza party spanning continents`;
    if (value >= 100) return `Enough to feed a block party`;
    return null;
  }
  if (key === "lightningStrikes") {
    if (value >= 5000) return `The sky has been busy`;
    return null;
  }
  return null;
}

function fmtElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Shared tab button ────────────────────────────────────────────
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase rounded-full transition-all ${
        active
          ? "bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
          : "dark:text-zinc-500 text-zinc-400 hover:text-amber-400/60"
      }`}
    >
      {children}
    </button>
  );
}

// ── Mana bar ─────────────────────────────────────────────────────
function ManaBar({ pct }: { pct: number }) {
  const clamped = Math.min(1, Math.max(0, pct));
  const remaining = 1 - clamped;
  const manaDisplay = (remaining * 100).toFixed(1);
  const barColor =
    remaining > 0.4
      ? "linear-gradient(90deg, #6366f1, #818cf8)"
      : remaining > 0.2
        ? "linear-gradient(90deg, #7c3aed, #a78bfa)"
        : "linear-gradient(90deg, #7f1d1d, #ef4444)";
  const glowColor = remaining > 0.4 ? "rgba(99,102,241,0.6)" : "rgba(239,68,68,0.5)";
  return (
    <div
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: remaining > 0.4 ? "rgba(99,102,241,0.2)" : "rgba(239,68,68,0.2)",
        background:
          remaining > 0.4
            ? "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 55%)"
            : "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 55%)",
      }}
    >
      <div className="flex justify-between items-baseline mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{"🔮"}</span>
          <p
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: remaining > 0.4 ? "#818cf8" : "#f87171" }}
          >
            Mana
          </p>
        </div>
        <p className="text-[13px] font-bold" style={{ color: remaining > 0.4 ? "#818cf8" : "#f87171" }}>
          {manaDisplay}%
        </p>
      </div>
      <div className="relative h-2.5 rounded-full dark:bg-white/[0.06] bg-black/[0.07] overflow-visible">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${remaining * 100}%` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full"
          style={{
            background: "#fff",
            boxShadow: `0 0 10px 3px ${glowColor}`,
            border: `2px solid ${remaining > 0.4 ? "#818cf8" : "#ef4444"}`,
          }}
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


// ── Pulsing body cards ───────────────────────────────────────────
function HeartbeatCard({ sessionBeats }: { sessionBeats: number }) {
  return (
    <motion.div
      animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0)", "0 0 20px 6px rgba(239,68,68,0.25)", "0 0 0 0 rgba(239,68,68,0)"] }}
      transition={{ duration: 60 / 72, repeat: Infinity, ease: "easeOut" }}
      className="flex-1 rounded-2xl p-3 sm:p-4 border dark:border-white/[0.07] border-black/[0.08] dark:bg-white/[0.03] bg-black/[0.03] flex flex-col items-center gap-2 min-w-0 overflow-hidden"
    >
      <motion.span className="text-3xl leading-none" animate={{ scale: [1, 1.45, 1.2, 1] }} transition={{ duration: 60 / 72, repeat: Infinity, times: [0, 0.14, 0.28, 1], ease: "easeOut" }}>
        💓
      </motion.span>
      <p className="text-[1rem] sm:text-[1.4rem] font-black tabular-nums text-rose-400 leading-none">{sessionBeats.toLocaleString()}</p>
      <p className="text-[9px] sm:text-[10px] font-semibold dark:text-zinc-500 text-zinc-400 text-center">Beats since<br />you arrived</p>
      <p className="text-[10px] dark:text-zinc-600 text-zinc-400">72 bpm</p>
    </motion.div>
  );
}

function BreathCard({ sessionBreaths }: { sessionBreaths: number }) {
  return (
    <div className="flex-1 rounded-2xl p-3 sm:p-4 border dark:border-white/[0.07] border-black/[0.08] dark:bg-white/[0.03] bg-black/[0.03] flex flex-col items-center gap-2 min-w-0 overflow-hidden">
      <motion.span className="text-3xl leading-none" animate={{ scale: [1, 1.18, 1], opacity: [0.75, 1, 0.75] }} transition={{ duration: 60 / 16, repeat: Infinity, ease: "easeInOut" }}>
        🫁
      </motion.span>
      <p className="text-[1rem] sm:text-[1.4rem] font-black tabular-nums text-sky-400 leading-none">{sessionBreaths.toLocaleString()}</p>
      <p className="text-[9px] sm:text-[10px] font-semibold dark:text-zinc-500 text-zinc-400 text-center">Breaths since<br />you arrived</p>
      <p className="text-[10px] dark:text-zinc-600 text-zinc-400">16 /min</p>
    </div>
  );
}

function BlinkCard({ sessionBlinks }: { sessionBlinks: number }) {
  return (
    <div className="flex-1 rounded-2xl p-3 sm:p-4 border dark:border-white/[0.07] border-black/[0.08] dark:bg-white/[0.03] bg-black/[0.03] flex flex-col items-center gap-2 min-w-0 overflow-hidden">
      <motion.span className="text-3xl leading-none inline-block" animate={{ scaleY: [1, 1, 0.08, 1, 1] }} transition={{ duration: 60 / 15, repeat: Infinity, times: [0, 0.78, 0.84, 0.9, 1], ease: "easeInOut" }} style={{ display: "inline-block" }}>
        👁️
      </motion.span>
      <p className="text-[1rem] sm:text-[1.4rem] font-black tabular-nums text-violet-400 leading-none">{sessionBlinks.toLocaleString()}</p>
      <p className="text-[9px] sm:text-[10px] font-semibold dark:text-zinc-500 text-zinc-400 text-center">Blinks since<br />you arrived</p>
      <p className="text-[10px] dark:text-zinc-600 text-zinc-400">15 /min</p>
    </div>
  );
}

// ── Milestone flash (world tab) ──────────────────────────────────
function MilestoneFlash({ text }: { text: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.4 }}
      className="block text-[9px] mt-1 tracking-wide dark:text-zinc-500 text-zinc-400"
      style={{ fontStyle: "italic" }}
    >
      {text}
    </motion.span>
  );
}


// ── YOU tab ──────────────────────────────────────────────────────
function YouView({
  birthDate,
  now,
  pageOpenTime,
}: {
  birthDate: string;
  now: number;
  pageOpenTime: number;
}) {
  const birthTime = new Date(birthDate + "T00:00:00").getTime();
  const elapsed = Math.max(0, now - birthTime);
  const totalDays = Math.floor(elapsed / MS_PER_DAY);
  const years = Math.floor(elapsed / (MS_PER_DAY * 365.25));
  const hours = Math.floor(elapsed / MS_PER_HOUR);
  const minutes = Math.floor(elapsed / MS_PER_MINUTE);
  const seconds = Math.floor(elapsed / 1000);

  const pctLived = elapsed / LIFE_EXP_MS;
  const beatsLived = Math.floor((elapsed / MS_PER_MINUTE) * 72);
  const beatsRemaining = Math.max(0, TOTAL_LIFETIME_BEATS - beatsLived);
  const milestone = getNextMilestone(totalDays);

  const sessionElapsed = Math.max(0, now - pageOpenTime);
  const sessionBeats = Math.floor((sessionElapsed / 1000) * RATES_PER_SEC.heartbeats);
  const sessionBreaths = Math.floor((sessionElapsed / 1000) * RATES_PER_SEC.breaths);
  const sessionBlinks = Math.floor((sessionElapsed / 1000) * RATES_PER_SEC.blinks);
  const sessionSeconds = Math.floor(sessionElapsed / 1000);

  const lifetimeCards = LIFE_STATS.filter((s) => !["heartbeats", "breaths", "blinks"].includes(s.key)).map((stat) => ({
    ...stat,
    value: computeLifeStat(stat, elapsed),
    context: STAT_CONTEXT[stat.key]?.(computeLifeStat(stat, elapsed)) ?? "",
  }));

  return (
    <div className="space-y-5">
      {/* Mana bar */}
      <ManaBar pct={pctLived} />

      {/* Hero: alive for */}
      <div
        className="rounded-2xl border dark:border-white/[0.07] border-black/[0.09] p-5 sm:p-6"
        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, transparent 55%)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">You&apos;ve been alive for</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30" style={{ background: "rgba(245,158,11,0.1)" }}>
            <span className="text-[10px]">⚔️</span>
            <span className="text-[11px] font-black tracking-wide text-amber-400">LVL {years}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="min-w-0">
            <p className="text-[2.5rem] sm:text-[4.5rem] font-black tabular-nums leading-none text-amber-400">{totalDays.toLocaleString()}</p>
            <p className="text-[13px] dark:text-zinc-500 text-zinc-400 mt-1 font-medium">XP &nbsp;<span className="text-[11px] opacity-60">(days)</span></p>
          </div>
          <div className="hidden sm:block w-px self-stretch dark:bg-white/[0.06] bg-black/[0.06]" />
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 min-w-0">
            {[
              { label: "Years", val: years, color: "text-orange-400" },
              { label: "Hours", val: hours, color: "text-violet-400" },
              { label: "Minutes", val: minutes, color: "text-sky-400" },
              { label: "Seconds", val: seconds, color: "text-emerald-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="min-w-0 overflow-hidden">
                <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">{label}</p>
                <p className={`text-[1rem] sm:text-[1.2rem] font-bold tabular-nums leading-none ${color}`}>{val.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Beats remaining + next milestone */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-rose-500/20 p-4 flex flex-col gap-1" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.07) 0%, transparent 60%)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <motion.span className="text-xl leading-none" animate={{ scale: [1, 1.35, 1.15, 1] }} transition={{ duration: 60 / 72, repeat: Infinity, times: [0, 0.14, 0.28, 1], ease: "easeOut" }}>❤️</motion.span>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-rose-400/70">HP Remaining</p>
          </div>
          <p className="text-[1.4rem] font-black tabular-nums text-rose-400 leading-none">{beatsRemaining.toLocaleString()}</p>
          <p className="text-[10px] dark:text-zinc-500 text-zinc-400 leading-snug mt-0.5">estimated heartbeats left in your life</p>
        </div>
        {milestone && (
          <div className="rounded-2xl border border-amber-500/20 p-4 flex flex-col gap-1" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.07) 0%, transparent 60%)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xl leading-none">🏆</span>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-amber-400/70">Next Achievement</p>
            </div>
            <p className="text-[1.4rem] font-black tabular-nums text-amber-400 leading-none">{milestone.daysLeft.toLocaleString()}</p>
            <p className="text-[10px] dark:text-zinc-500 text-zinc-400 leading-snug mt-0.5">XP until {milestone.label}</p>
          </div>
        )}
      </div>

      {/* Active abilities */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">⚡ Active abilities</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <HeartbeatCard sessionBeats={sessionBeats} />
          <BreathCard sessionBreaths={sessionBreaths} />
          <BlinkCard sessionBlinks={sessionBlinks} />
        </div>
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-2 text-center">counted in the {sessionSeconds}s you&apos;ve been on this page</p>
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-1 text-center">meanwhile, ~{(9_600_000_000 * sessionSeconds).toLocaleString()} heartbeats happened across all 8B humans</p>
      </div>

      {/* Lifetime records */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2.5">📜 Lifetime records</p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {lifetimeCards.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl sm:rounded-2xl p-3.5 sm:p-4 dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.07] border-black/[0.07]"
            >
              <span className="text-2xl leading-none">{stat.emoji}</span>
              <p className={`text-[1.1rem] sm:text-[1.35rem] font-bold tabular-nums leading-none mt-2.5 overflow-hidden ${stat.color}`}>{stat.value.toLocaleString()}</p>
              <p className="text-[11px] font-semibold dark:text-white/70 text-zinc-600 mt-1">{stat.label}</p>
              {stat.context && <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mt-1 leading-snug">{stat.context}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── THE WORLD tab ────────────────────────────────────────────────
function WorldView({ elapsed }: { elapsed: number }) {
  const stats = useMemo(() => computeGlobalStats(elapsed), [elapsed]);

  return (
    <div className="space-y-6">
      {/* Elapsed clock */}
      <div className="text-center">
        <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="inline-block">
          <span className="text-4xl sm:text-5xl font-mono font-bold tabular-nums" style={{ color: WORLD_ACCENT }}>{fmtElapsed(elapsed)}</span>
        </motion.div>
        <p className="text-[10px] tracking-widest uppercase mt-1 dark:text-zinc-600 text-zinc-400">time on this page</p>
      </div>

      {/* Stat groups */}
      {GROUPS.map((group, gi) => (
        <motion.div key={group.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: gi * 0.15 }} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm">{group.icon}</span>
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase dark:text-zinc-500 text-zinc-400">{group.title}</span>
            <div className="flex-1 h-px" style={{ background: FAINT }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.keys.map((key) => {
              const item = RATE_MAP[key];
              if (!item) return null;
              const val = stats[key] ?? 0;
              const ctx = getWorldContext(key, val);
              return (
                <div key={key} className="rounded-xl p-3 text-center space-y-1 transition-all min-w-0 overflow-hidden dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.06] border-black/[0.06]">
                  <span className="text-lg block">{item.emoji}</span>
                  <span className="text-sm sm:text-xl font-bold tabular-nums block" style={{ color: group.accent }}>{item.prefix ?? ""}{formatNumber(val)}</span>
                  <span className="text-[9px] tracking-wider uppercase block dark:text-zinc-600 text-zinc-400">{item.label}</span>
                  <AnimatePresence mode="wait">{ctx && <MilestoneFlash key={ctx} text={ctx} />}</AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Perspective footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center py-4 space-y-1">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12" style={{ background: FAINT }} />
          <span className="text-[10px] tracking-widest" style={{ color: FAINT }}>✦</span>
          <div className="h-px w-12" style={{ background: FAINT }} />
        </div>
        <p className="text-[11px] dark:text-zinc-500 text-zinc-400">All of this happened while you read a screen.</p>
      </motion.div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────
export function LifeStatsApp() {
  const [tab, setTab] = useState<"you" | "world">("you");
  const [birthDate, setBirthDate] = useState(`${DEFAULT_BIRTH_YEAR}-01-01`);
  const [dateFocused, setDateFocused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pageOpenTime = useRef(Date.now());

  useEffect(() => {
    pageOpenTime.current = Date.now();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const sessionElapsed = Math.max(0, now - pageOpenTime.current) / 1000;

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">
      {/* Birthday + live dot */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Your Birthday</p>
          <motion.label
            animate={{ boxShadow: dateFocused ? `0 0 0 1.5px ${ACCENT}55, 0 0 18px ${ACCENT}22` : "0 0 0 1px rgba(255,255,255,0)" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-2xl cursor-pointer dark:bg-white/[0.05] bg-black/[0.04] border dark:border-white/[0.08] border-black/[0.08]"
          >
            <span className="text-base select-none">🎂</span>
            <input
              type="date"
              value={birthDate}
              onFocus={() => setDateFocused(true)}
              onBlur={() => setDateFocused(false)}
              onChange={(e) => { setBirthDate(e.target.value); pageOpenTime.current = Date.now(); }}
              className="bg-transparent outline-none text-[13px] font-semibold dark:text-white text-zinc-900 cursor-pointer [color-scheme:dark]"
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

      {/* Tab switcher */}
      <div className="flex justify-center gap-1">
        <TabButton active={tab === "you"} onClick={() => setTab("you")}>You</TabButton>
        <TabButton active={tab === "world"} onClick={() => setTab("world")}>The World</TabButton>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "you" ? (
          <motion.div key="you" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <YouView birthDate={birthDate} now={now} pageOpenTime={pageOpenTime.current} />
          </motion.div>
        ) : (
          <motion.div key="world" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <WorldView elapsed={sessionElapsed} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
