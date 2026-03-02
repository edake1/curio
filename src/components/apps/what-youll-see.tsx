'use client';

import { useState, useMemo, useCallback } from 'react';
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
  const deathYear = Math.round(birthYear + lifeExpectancy);
  const yearsLeft = Math.max(0, deathYear - currentYear);

  // Track expanded card
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const toggleExpand = useCallback((id: string) => {
    setExpandedCard(prev => prev === id ? null : id);
  }, []);

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
        <StatCard value={`${Math.round(yearsLeft)}`} label="years of future" sub={`until ~${deathYear}`} color={INDIGO} />
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
            {events.map((event, i) => {
              const cardId = `see-${event.year}-${event.event}`;
              return (
                <EventCard
                  key={cardId}
                  event={event}
                  birthYear={birthYear}
                  delay={di * 0.05 + i * 0.03}
                  variant="witness"
                  isExpanded={expandedCard === cardId}
                  onToggle={() => toggleExpand(cardId)}
                />
              );
            })}
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
            {events.map((event, i) => {
              const cardId = `miss-${event.year}-${event.event}`;
              return (
                <EventCard
                  key={cardId}
                  event={event}
                  birthYear={birthYear}
                  delay={di * 0.05 + i * 0.03 + 0.2}
                  variant="miss"
                  isExpanded={expandedCard === cardId}
                  onToggle={() => toggleExpand(cardId)}
                />
              );
            })}
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
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-xl p-3.5 text-center space-y-1 cursor-default"
      style={{ background: BG, border: `1px solid ${color}25` }}
    >
      <div className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[10px] tracking-wider uppercase" style={{ color: MUTED }}>{label}</div>
      {sub && <div className="text-[10px] truncate" style={{ color: MUTED, opacity: 0.7 }}>{sub}</div>}
    </motion.div>
  );
}

// ── Event card ────────────────────────────────────────────────
function EventCard({ event, birthYear, delay, variant, isExpanded, onToggle }: {
  event: FutureEvent; birthYear: number; delay: number; variant: 'witness' | 'miss';
  isExpanded: boolean; onToggle: () => void;
}) {
  const cat = CAT[event.category];
  const ageAtEvent = event.year - birthYear;
  const isWitness = variant === 'witness';
  const certClr = certaintyColor(event.certainty);
  const certPct = Math.round(event.certainty * 100);
  const accentClr = isWitness ? (cat?.color || GREEN) : MUTED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={isWitness ? {
        y: -3,
        boxShadow: `0 8px 30px ${accentClr}15`,
        transition: { duration: 0.25 },
      } : {}}
      onClick={onToggle}
      className="rounded-xl p-3.5 space-y-2.5 group relative overflow-hidden cursor-pointer select-none"
      style={{
        background: BG,
        border: `1px solid ${isWitness ? accentClr + '22' : 'rgba(222,198,163,0.08)'}`,
      }}
    >
      {/* Top accent glow line */}
      {isWitness && cat && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(to right, transparent, ${cat.color}60, transparent)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        />
      )}

      {/* Year + category + age */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tabular-nums" style={{ color: isWitness ? INDIGO : `${INDIGO}66` }}>
          {event.year}
        </span>
        {cat && (
          <span className="text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-md font-medium"
            style={{ color: cat.color, background: cat.color + '15', border: `1px solid ${cat.color}20` }}>
            {cat.label}
          </span>
        )}
        <span className="ml-auto text-[10px] tabular-nums font-medium" style={{ color: isWitness ? MUTED : 'rgba(222,198,163,0.35)' }}>
          age {ageAtEvent}
        </span>
      </div>

      {/* Event text */}
      <p className="text-[13px] leading-relaxed" style={{ color: isWitness ? IVORY : MUTED }}>
        {event.event}
      </p>

      {/* Certainty bar + label */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(222,198,163,0.08)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${certPct}%` }}
            transition={{ duration: 0.6, delay: delay + 0.15, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: certClr }}
          />
        </div>
        <span className="text-[10px] tabular-nums shrink-0 font-medium" style={{ color: certClr }}>
          {certaintyLabel(event.certainty)}
        </span>
      </div>

      {/* Source — always visible with better contrast */}
      {event.source && (
        <p className="text-[10px]" style={{ color: MUTED, opacity: 0.8 }}>
          {event.source}
        </p>
      )}

      {/* Expandable detail panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-2 mt-1 space-y-2" style={{ borderTop: `1px solid ${accentClr}15` }}>
              {/* Detail stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: accentClr }}>{certPct}%</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: MUTED }}>Certainty</div>
                </div>
                <div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: INDIGO }}>{event.year - new Date().getFullYear()}y</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: MUTED }}>From now</div>
                </div>
                <div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: isWitness ? GREEN : RED }}>
                    {isWitness ? '✓ Witness' : '✗ Miss'}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: MUTED }}>Outcome</div>
                </div>
              </div>
              {/* Category description */}
              {cat && (
                <div className="flex items-center gap-2 pt-1">
                  <cat.icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                  <span className="text-[10px] font-medium" style={{ color: cat.color }}>
                    {cat.label} — {isWitness ? 'You\'ll be there for this' : 'This happens after your time'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand indicator */}
      <div className="flex justify-center">
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: MUTED }}
        >
          ▾
        </motion.div>
      </div>
    </motion.div>
  );
}
