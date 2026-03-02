'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLOBAL_RATES, NET_POPULATION_DISPLAY, computeGlobalStats } from '@/data/global-rates';
import { formatNumber } from '@/lib/utils';

// ── design tokens (CSS-var aware) ─────────────────────────────
const IVORY  = 'var(--curio-text, #e8e0d4)';
const MUTED  = 'var(--curio-muted, #a09882)';
const FAINT  = 'rgba(222,198,163,0.13)';
const BG     = 'var(--curio-card, rgba(30,30,28,0.55))';
const ACCENT = '#38bdf8'; // sky-400

// ── stat categories ───────────────────────────────────────────
interface StatGroup {
  title: string;
  icon: string;
  keys: string[];
  accent: string;
}

const GROUPS: StatGroup[] = [
  { title: 'Life & Death', icon: '🫀', keys: ['births', 'deaths', 'netPopulation'], accent: '#34d399' },
  { title: 'Digital Pulse', icon: '⚡', keys: ['emails', 'tweets', 'googleSearches'], accent: '#60a5fa' },
  { title: 'The Physical World', icon: '🌍', keys: ['pizzas', 'youtubeHours', 'lightningStrikes'], accent: '#f59e0b' },
];

// humanizing context at milestone thresholds
function getContext(key: string, value: number): string | null {
  if (key === 'births') {
    if (value >= 1000) return `Enough to fill ${Math.floor(value / 30)} classrooms`;
    if (value >= 100) return `A small village was just born`;
    if (value >= 10) return `A football team of new lives`;
    return null;
  }
  if (key === 'deaths') {
    if (value >= 500) return `A neighborhood went silent`;
    if (value >= 50) return `A bus full of final goodbyes`;
    return null;
  }
  if (key === 'netPopulation') {
    if (value >= 100) return `Earth just got a little more crowded`;
    return null;
  }
  if (key === 'googleSearches') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M questions asked`;
    if (value >= 100_000) return `A city's worth of curiosity`;
    return null;
  }
  if (key === 'emails') {
    if (value >= 10_000_000) return `More words than every book in a library`;
    return null;
  }
  if (key === 'pizzas') {
    if (value >= 1000) return `A pizza party spanning continents`;
    if (value >= 100) return `Enough to feed a block party`;
    return null;
  }
  if (key === 'lightningStrikes') {
    if (value >= 5000) return `The sky has been busy`;
    return null;
  }
  return null;
}

// ── format elapsed as mm:ss ──────────────────────────────────
function fmtElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ── all rate items keyed ─────────────────────────────────────
const RATE_MAP: Record<string, { emoji: string; label: string; color: string; prefix?: string }> = {};
for (const r of GLOBAL_RATES) RATE_MAP[r.key] = { emoji: r.emoji, label: r.label, color: r.color };
RATE_MAP[NET_POPULATION_DISPLAY.key] = {
  emoji: NET_POPULATION_DISPLAY.emoji,
  label: NET_POPULATION_DISPLAY.label,
  color: NET_POPULATION_DISPLAY.color,
  prefix: NET_POPULATION_DISPLAY.prefix,
};

// ── milestone flash ──────────────────────────────────────────
function MilestoneFlash({ text }: { text: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.4 }}
      className="block text-[9px] mt-1 tracking-wide"
      style={{ color: MUTED, fontStyle: 'italic' }}
    >
      {text}
    </motion.span>
  );
}

// ── main app ─────────────────────────────────────────────────
export function WhileHereApp() {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());
  const [showIntro, setShowIntro] = useState(true);

  const stats = useMemo(() => computeGlobalStats(elapsed), [elapsed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Hide intro after 2.5s
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* ── header ── */}
      <div className="text-center space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold tracking-tight font-serif"
          style={{ color: IVORY }}
        >
          While You Were Here
        </motion.h2>
        <p className="text-xs tracking-wider" style={{ color: MUTED }}>
          The world didn&apos;t pause
        </p>
      </div>

      {/* ── elapsed clock ── */}
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="inline-block"
        >
          <span className="text-4xl sm:text-5xl font-mono font-bold tabular-nums" style={{ color: ACCENT }}>
            {fmtElapsed(elapsed)}
          </span>
        </motion.div>
        <p className="text-[10px] tracking-widest uppercase mt-1" style={{ color: FAINT }}>
          time on this page
        </p>
      </div>

      {/* ── intro overlay ── */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center py-8"
          >
            <p className="text-sm font-serif italic" style={{ color: MUTED }}>
              Every second, the world moves&hellip;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── stat groups ── */}
      {!showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {GROUPS.map((group, gi) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: gi * 0.15 }}
              className="space-y-2"
            >
              {/* group header */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-sm">{group.icon}</span>
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: MUTED }}>
                  {group.title}
                </span>
                <div className="flex-1 h-px" style={{ background: FAINT }} />
              </div>

              {/* stat cards */}
              <div className="grid grid-cols-3 gap-2">
                {group.keys.map((key) => {
                  const item = RATE_MAP[key];
                  if (!item) return null;
                  const val = stats[key] ?? 0;
                  const ctx = getContext(key, val);

                  return (
                    <div
                      key={key}
                      className="rounded-xl p-3 text-center space-y-1 transition-all"
                      style={{ background: BG, border: `1px solid ${FAINT}` }}
                    >
                      <span className="text-lg block">{item.emoji}</span>
                      <span
                        className="text-lg sm:text-xl font-bold tabular-nums block"
                        style={{ color: group.accent }}
                      >
                        {item.prefix ?? ''}{formatNumber(val)}
                      </span>
                      <span className="text-[9px] tracking-wider uppercase block" style={{ color: FAINT }}>
                        {item.label}
                      </span>
                      <AnimatePresence mode="wait">
                        {ctx && <MilestoneFlash key={ctx} text={ctx} />}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* ── perspective footer ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-4 space-y-1"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12" style={{ background: FAINT }} />
              <span className="text-[10px] tracking-widest" style={{ color: FAINT }}>✦</span>
              <div className="h-px w-12" style={{ background: FAINT }} />
            </div>
            <p className="text-[11px]" style={{ color: MUTED }}>
              All of this happened while you read a screen.
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
