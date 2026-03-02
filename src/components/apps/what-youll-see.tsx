'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Rocket, Cpu, Leaf, Users, FlaskConical, Palette } from 'lucide-react';
import { LIFE_EXPECTANCY, DEFAULT_COUNTRY_STATS, DEFAULT_COUNTRY, DEFAULT_AGE } from '@/data/countries';
import { FUTURE_EVENTS, type FutureEvent } from '@/data/future-events';

// ── design tokens ─────────────────────────────────────────────
const IVORY  = 'var(--curio-text, #e8e0d4)';
const MUTED  = 'var(--curio-muted, #a09882)';
const FAINT  = 'rgba(222,198,163,0.10)';
const BG     = 'var(--curio-card, rgba(30,30,28,0.55))';
const GREEN  = '#34d399';
const RED    = '#f87171';
const INDIGO = '#818cf8';

// ── category config ───────────────────────────────────────────
const CAT: Record<string, { color: string; icon: typeof Cpu; label: string }> = {
  tech:    { color: '#06b6d4', icon: Cpu,          label: 'Tech' },
  space:   { color: '#a78bfa', icon: Rocket,       label: 'Space' },
  climate: { color: '#34d399', icon: Leaf,          label: 'Climate' },
  society: { color: '#fb923c', icon: Users,         label: 'Society' },
  science: { color: '#f472b6', icon: FlaskConical,  label: 'Science' },
  culture: { color: '#fbbf24', icon: Palette,       label: 'Culture' },
};

function certaintyLabel(c: number): string {
  if (c >= 0.9) return 'Near certain';
  if (c >= 0.7) return 'Very likely';
  if (c >= 0.5) return 'Likely';
  if (c >= 0.3) return 'Possible';
  return 'Uncertain';
}
function certaintyColor(c: number): string {
  if (c >= 0.7) return GREEN;
  if (c >= 0.4) return '#fbbf24';
  return '#f87171';
}

// ── decade grouping helper ────────────────────────────────────
function groupByDecade(events: FutureEvent[]): { decade: string; events: FutureEvent[] }[] {
  const map = new Map<string, FutureEvent[]>();
  for (const e of events) {
    const d = `${Math.floor(e.year / 10) * 10}s`;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(e);
  }
  return [...map.entries()].map(([decade, events]) => ({ decade, events }));
}

export function WhatYoullSeeApp() {
  const [age, setAge] = useState(DEFAULT_AGE);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);

  const lifeExpectancy = useMemo(
    () => LIFE_EXPECTANCY[country] || DEFAULT_COUNTRY_STATS.lifeExpectancy,
    [country]
  );
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const deathYear = birthYear + lifeExpectancy;
  const yearsLeft = Math.max(0, deathYear - currentYear);

  const allFuture = useMemo(
    () => FUTURE_EVENTS.filter(e => e.year >= currentYear),
    [currentYear]
  );
  const willSee = useMemo(
    () => allFuture.filter(e => e.year <= deathYear),
    [allFuture, deathYear]
  );
  const willMiss = useMemo(
    () => allFuture.filter(e => e.year > deathYear),
    [allFuture, deathYear]
  );
  const witnessPct = allFuture.length > 0 ? Math.round((willSee.length / allFuture.length) * 100) : 0;

  // Decade groups
  const seeDecades = useMemo(() => groupByDecade(willSee), [willSee]);
  const missDecades = useMemo(() => groupByDecade(willMiss), [willMiss]);

  // Category breakdown for stats
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of willSee) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [willSee]);

  // Life bar proportions
  const totalSpan = Math.max(deathYear - birthYear, 1);
  const livedPct = Math.round(((currentYear - birthYear) / totalSpan) * 100);
  const futurePct = 100 - livedPct;

  // Nearest event
  const nearest = willSee.length > 0 ? willSee[0] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-7">
      {/* ── Header ── */}
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

      {/* ── Input form ── */}
      <div className="rounded-xl p-4" style={{ background: BG, border: `1px solid ${FAINT}` }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] tracking-widest uppercase mb-1 block" style={{ color: MUTED }}>Your Age</label>
            <Input
              type="number" value={age}
              onChange={(e) => setAge(Math.min(120, Math.max(1, parseInt(e.target.value) || DEFAULT_AGE)))}
              min={1} max={120} className="h-10 text-sm"
              style={{ background: 'rgba(222,198,163,0.04)', borderColor: 'rgba(222,198,163,0.15)', color: IVORY }}
            />
          </div>
          <div>
            <label className="text-[10px] tracking-widest uppercase mb-1 block" style={{ color: MUTED }}>Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm h-10"
              style={{ background: 'rgba(222,198,163,0.04)', border: '1px solid rgba(222,198,163,0.15)', color: IVORY }}>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Hero stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={`${yearsLeft}`} label="years of future" sub={`until ~${deathYear}`} color={INDIGO} />
        <StatCard value={`${witnessPct}%`} label="of events you'll see" sub={`${willSee.length} of ${allFuture.length}`} color={GREEN} />
        <StatCard value={nearest ? `${nearest.year}` : '—'} label="next milestone" sub={nearest ? nearest.event.slice(0, 30) + (nearest.event.length > 30 ? '…' : '') : ''} color="#fbbf24" />
      </div>

      {/* ── Life position bar ── */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] tabular-nums" style={{ color: MUTED }}>
          <span>Born {birthYear}</span>
          <span>Now ({currentYear})</span>
          <span>~{deathYear}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: FAINT }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${livedPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-l-full"
            style={{ background: 'rgba(222,198,163,0.25)' }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${futurePct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-r-full relative"
            style={{ background: `linear-gradient(to right, ${INDIGO}, ${GREEN})` }}
          >
            {/* Event dots on the bar */}
            {willSee.map((e, i) => {
              const pos = ((e.year - currentYear) / Math.max(deathYear - currentYear, 1)) * 100;
              return (
                <div key={`dot-${i}`}
                  className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${pos}%`, background: 'rgba(255,255,255,0.3)' }}
                />
              );
            })}
          </motion.div>
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px]" style={{ color: FAINT }}>
          <span>{livedPct}% lived</span>
          <span>•</span>
          <span>{futurePct}% remaining</span>
        </div>
      </div>

      {/* ── Category breakdown ── */}
      {catCounts.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {catCounts.map(([cat, count]) => {
            const c = CAT[cat];
            if (!c) return null;
            const Icon = c.icon;
            return (
              <span key={cat} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium"
                style={{ background: c.color + '10', color: c.color, border: `1px solid ${c.color}20` }}>
                <Icon className="w-3 h-3" />
                {c.label} ({count})
              </span>
            );
          })}
        </div>
      )}

      {/* ── Witness/miss summary ── */}
      <div className="flex justify-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(52,211,153,0.08)', color: GREEN, border: '1px solid rgba(52,211,153,0.15)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
          {willSee.length} you&apos;ll witness
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(248,113,113,0.08)', color: RED, border: '1px solid rgba(248,113,113,0.15)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: RED }} />
          {willMiss.length} you&apos;ll miss
        </div>
      </div>

      {/* ── YOU'LL WITNESS — by decade ── */}
      {seeDecades.map(({ decade, events }, di) => (
        <div key={`see-${decade}`} className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-wider" style={{ color: GREEN }}>{decade}</span>
            <div className="flex-1 h-px" style={{ background: FAINT }} />
            <span className="text-[10px]" style={{ color: FAINT }}>{events.length} event{events.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {events.map((event, i) => (
              <EventCard
                key={`see-${event.year}-${event.event}`}
                event={event}
                birthYear={birthYear}
                delay={di * 0.05 + i * 0.03}
                variant="witness"
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Death year divider ── */}
      {willMiss.length > 0 && willSee.length > 0 && (
        <div className="flex items-center gap-4 py-3">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${RED}40, transparent)` }} />
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[0.25em]" style={{ color: RED }}>estimated end</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: RED }}>~{deathYear}</div>
          </div>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${RED}40, transparent)` }} />
        </div>
      )}

      {/* ── YOU'LL MISS — by decade ── */}
      {missDecades.map(({ decade, events }, di) => (
        <div key={`miss-${decade}`} className="space-y-2 opacity-50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-wider" style={{ color: RED }}>{decade}</span>
            <div className="flex-1 h-px" style={{ background: FAINT }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {events.map((event, i) => (
              <EventCard
                key={`miss-${event.year}-${event.event}`}
                event={event}
                birthYear={birthYear}
                delay={di * 0.05 + i * 0.03 + 0.2}
                variant="miss"
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Footer ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-center py-4 space-y-2">
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

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-3.5 text-center space-y-1"
      style={{ background: BG, border: `1px solid ${color}18` }}
    >
      <div className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[10px] tracking-wider uppercase" style={{ color: MUTED }}>{label}</div>
      {sub && <div className="text-[9px] truncate" style={{ color: FAINT }}>{sub}</div>}
    </motion.div>
  );
}

// ── Event card ────────────────────────────────────────────────
function EventCard({ event, birthYear, delay, variant }: {
  event: FutureEvent; birthYear: number; delay: number; variant: 'witness' | 'miss';
}) {
  const cat = CAT[event.category];
  const ageAtEvent = event.year - birthYear;
  const isWitness = variant === 'witness';
  const certClr = certaintyColor(event.certainty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl p-3.5 space-y-2.5 group relative overflow-hidden"
      style={{ background: BG, border: `1px solid ${isWitness ? (cat?.color || GREEN) + '18' : FAINT}` }}
    >
      {/* Soft top accent */}
      {isWitness && cat && (
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: cat.color + '40' }} />
      )}

      {/* Year + category + age */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tabular-nums" style={{ color: isWitness ? INDIGO : `${INDIGO}88` }}>
          {event.year}
        </span>
        {cat && (
          <span className="text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded"
            style={{ color: cat.color, background: cat.color + '10' }}>
            {cat.label}
          </span>
        )}
        <span className="ml-auto text-[10px] tabular-nums" style={{ color: isWitness ? MUTED : FAINT }}>
          age {ageAtEvent}
        </span>
      </div>

      {/* Event text */}
      <p className="text-[13px] leading-relaxed" style={{ color: isWitness ? IVORY : MUTED }}>
        {event.event}
      </p>

      {/* Certainty + source */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: FAINT }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${event.certainty * 100}%` }}
            transition={{ duration: 0.5, delay: delay + 0.15 }}
            className="h-full rounded-full"
            style={{ background: certClr }}
          />
        </div>
        <span className="text-[9px] tabular-nums shrink-0" style={{ color: certClr }}>
          {certaintyLabel(event.certainty)}
        </span>
      </div>
      {event.source && (
        <p className="text-[9px] truncate" style={{ color: FAINT }}>
          Source: {event.source}
        </p>
      )}
    </motion.div>
  );
}
