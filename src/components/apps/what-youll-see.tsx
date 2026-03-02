'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { LIFE_EXPECTANCY, DEFAULT_COUNTRY_STATS, DEFAULT_COUNTRY, DEFAULT_AGE } from '@/data/countries';
import { FUTURE_EVENTS } from '@/data/future-events';

// ── design tokens ─────────────────────────────────────────────
const IVORY  = 'var(--curio-text, #e8e0d4)';
const MUTED  = 'var(--curio-muted, #a09882)';
const FAINT  = 'rgba(222,198,163,0.13)';
const BG     = 'var(--curio-card, rgba(30,30,28,0.55))';
const GREEN  = '#34d399';
const RED    = '#f87171';
const INDIGO = '#818cf8';

function certaintyLabel(c: number): string {
  if (c >= 0.8) return 'Very likely';
  if (c >= 0.6) return 'Likely';
  if (c >= 0.4) return 'Possible';
  if (c >= 0.2) return 'Uncertain';
  return 'Unlikely';
}

function certaintyColor(c: number): string {
  if (c >= 0.7) return GREEN;
  if (c >= 0.4) return '#fbbf24'; // amber
  return '#f87171'; // red
}

export function WhatYoullSeeApp() {
  const [age, setAge] = useState(DEFAULT_AGE);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [showSetup, setShowSetup] = useState(true);
  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);

  const lifeExpectancy = useMemo(
    () => LIFE_EXPECTANCY[country] || DEFAULT_COUNTRY_STATS.lifeExpectancy,
    [country]
  );
  const deathYear = useMemo(
    () => new Date().getFullYear() + Math.max(0, lifeExpectancy - age),
    [age, lifeExpectancy]
  );
  const currentYear = new Date().getFullYear();

  const willSee = useMemo(
    () => FUTURE_EVENTS.filter(e => e.year >= currentYear && e.year <= deathYear),
    [currentYear, deathYear]
  );
  const willMiss = useMemo(
    () => FUTURE_EVENTS.filter(e => e.year > deathYear),
    [deathYear]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ── header ── */}
      <div className="text-center space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold tracking-tight font-serif"
          style={{ color: IVORY }}
        >
          What You&apos;ll See
        </motion.h2>
        <p className="text-xs tracking-wider" style={{ color: MUTED }}>
          The future is unevenly distributed
        </p>
      </div>

      {/* ── input form ── */}
      <motion.div
        className="rounded-xl p-4 space-y-3"
        style={{ background: BG, border: `1px solid ${FAINT}` }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] tracking-widest uppercase mb-1 block" style={{ color: MUTED }}>
              Your Age
            </label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || DEFAULT_AGE)}
              min={1}
              max={120}
              className="h-10 text-sm"
              style={{
                background: 'rgba(222,198,163,0.04)',
                borderColor: 'rgba(222,198,163,0.15)',
                color: IVORY,
              }}
            />
          </div>
          <div>
            <label className="text-[10px] tracking-widest uppercase mb-1 block" style={{ color: MUTED }}>
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm h-10"
              style={{
                background: 'rgba(222,198,163,0.04)',
                border: `1px solid rgba(222,198,163,0.15)`,
                color: IVORY,
              }}
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px]" style={{ color: FAINT }}>
            Life expectancy in {country}: {lifeExpectancy} years
          </p>
          <p className="text-[10px]" style={{ color: FAINT }}>
            ~{deathYear}
          </p>
        </div>
      </motion.div>

      {/* ── summary badges ── */}
      <div className="flex justify-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(52,211,153,0.1)', color: GREEN, border: '1px solid rgba(52,211,153,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
          {willSee.length} you&apos;ll witness
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(248,113,113,0.1)', color: RED, border: '1px solid rgba(248,113,113,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: RED }} />
          {willMiss.length} you&apos;ll miss
        </div>
      </div>

      {/* ── you'll witness timeline ── */}
      {willSee.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase px-1" style={{ color: GREEN }}>
            ✦ You&apos;ll witness
          </p>
          <div className="relative pl-6">
            {/* timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: `linear-gradient(to bottom, ${GREEN}, ${FAINT})` }} />

            {willSee.map((event, i) => (
              <motion.div
                key={`see-${event.year}-${event.event}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="relative py-2"
              >
                {/* dot */}
                <div className="absolute -left-[15px] top-[14px] w-2.5 h-2.5 rounded-full border-2"
                  style={{ borderColor: GREEN, background: i === 0 ? GREEN : 'var(--curio-bg, #0a0a09)' }} />

                <div className="rounded-lg p-3 space-y-1.5"
                  style={{ background: BG, border: `1px solid ${FAINT}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tabular-nums" style={{ color: INDIGO }}>
                      {event.year}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ color: certaintyColor(event.certainty), background: 'rgba(0,0,0,0.3)' }}>
                      {certaintyLabel(event.certainty)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: IVORY }}>
                    {event.event}
                  </p>
                  {/* certainty bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: FAINT }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${event.certainty * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04 + 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: certaintyColor(event.certainty) }}
                      />
                    </div>
                    <span className="text-[9px] tabular-nums" style={{ color: FAINT }}>
                      {Math.round(event.certainty * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── divider ── */}
      {willMiss.length > 0 && willSee.length > 0 && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px" style={{ background: FAINT }} />
          <span className="text-[10px] tracking-widest" style={{ color: FAINT }}>
            ~{deathYear}
          </span>
          <div className="flex-1 h-px" style={{ background: FAINT }} />
        </div>
      )}

      {/* ── you'll miss timeline ── */}
      {willMiss.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase px-1" style={{ color: RED }}>
            ✦ You&apos;ll miss
          </p>
          <div className="relative pl-6">
            <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: `linear-gradient(to bottom, ${RED}, transparent)` }} />

            {willMiss.map((event, i) => (
              <motion.div
                key={`miss-${event.year}-${event.event}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 + 0.2 }}
                className="relative py-2"
              >
                <div className="absolute -left-[15px] top-[14px] w-2.5 h-2.5 rounded-full border-2"
                  style={{ borderColor: RED, background: 'var(--curio-bg, #0a0a09)' }} />

                <div className="rounded-lg p-3 space-y-1.5 opacity-60"
                  style={{ background: BG, border: `1px solid ${FAINT}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tabular-nums" style={{ color: INDIGO, opacity: 0.6 }}>
                      {event.year}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ color: certaintyColor(event.certainty), background: 'rgba(0,0,0,0.3)', opacity: 0.6 }}>
                      {certaintyLabel(event.certainty)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: IVORY }}>
                    {event.event}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── footer reflection ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-4 space-y-1"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12" style={{ background: FAINT }} />
          <span className="text-[10px] tracking-widest" style={{ color: FAINT }}>✦</span>
          <div className="h-px w-12" style={{ background: FAINT }} />
        </div>
        <p className="text-[11px] font-serif italic" style={{ color: MUTED }}>
          The future is already written. You just won&apos;t read all the pages.
        </p>
      </motion.div>
    </div>
  );
}
