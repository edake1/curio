'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, MapPin, Clock } from 'lucide-react';
import { HISTORICAL_MOMENTS, type HistoricalMoment } from '@/data/historical-moments';

// ── design tokens ────────────────────────────────────────────
const IVORY  = 'var(--curio-text, #e8e0d4)';
const MUTED  = 'var(--curio-muted, #a09882)';
const FAINT  = 'rgba(222,198,163,0.10)';
const BG     = 'var(--curio-card, rgba(30,30,28,0.55))';
const AMBER  = '#d97706';
const AMBER_D = 'rgba(217,119,6,0.08)';
const AMBER_B = 'rgba(217,119,6,0.18)';

// ── category styling ─────────────────────────────────────────
const CAT_STYLE: Record<string, { color: string; label: string }> = {
  war:         { color: '#ef4444', label: 'War' },
  science:     { color: '#06b6d4', label: 'Science' },
  culture:     { color: '#a78bfa', label: 'Culture' },
  disaster:    { color: '#f97316', label: 'Disaster' },
  revolution:  { color: '#f43f5e', label: 'Revolution' },
  exploration: { color: '#10b981', label: 'Exploration' },
  invention:   { color: '#eab308', label: 'Invention' },
};

// ── localStorage ─────────────────────────────────────────────
const SEEN_KEY = 'curio-rewind-seen';
function getSeenIds(): number[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
}
function saveSeen(ids: number[]) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
}

// ── pick a random unseen moment (or any if all seen) ─────────
function pickMoment(seen: number[]): { moment: HistoricalMoment; index: number } {
  const unseen = HISTORICAL_MOMENTS.map((m, i) => ({ m, i })).filter(x => !seen.includes(x.i));
  const pool = unseen.length > 0 ? unseen : HISTORICAL_MOMENTS.map((m, i) => ({ m, i }));
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { moment: pick.m, index: pick.i };
}

// ── main ─────────────────────────────────────────────────────
type Phase = 'idle' | 'revealing' | 'done';

export function TheRewindApp() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [moment, setMoment] = useState<HistoricalMoment | null>(null);
  const [visibleLines, setVisibleLines] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [seen, setSeen] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate seen list
  useEffect(() => { setSeen(getSeenIds()); }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  // Reveal lines one at a time
  useEffect(() => {
    if (phase !== 'revealing' || !moment) return;
    if (visibleLines >= moment.lines.length) {
      // All lines shown → pause, then show reflection
      timerRef.current = setTimeout(() => {
        setShowReflection(true);
        setPhase('done');
      }, 1200);
      return cleanup;
    }
    timerRef.current = setTimeout(() => {
      setVisibleLines(v => v + 1);
    }, visibleLines === 0 ? 800 : 2200); // first line faster
    return cleanup;
  }, [phase, visibleLines, moment, cleanup]);

  const startRewind = useCallback(() => {
    cleanup();
    const { moment: m, index } = pickMoment(seen);
    setMoment(m);
    setVisibleLines(0);
    setShowReflection(false);
    setPhase('revealing');
    setCount(c => c + 1);
    const nextSeen = [...seen, index];
    setSeen(nextSeen);
    saveSeen(nextSeen);
  }, [seen, cleanup]);

  const cat = moment ? (CAT_STYLE[moment.category] || { color: MUTED, label: moment.category }) : null;
  const seenPct = Math.round((seen.length / HISTORICAL_MOMENTS.length) * 100);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: IVORY }}>
          The Rewind
        </h2>
        <p className="text-xs tracking-wider" style={{ color: MUTED }}>
          Witness a random moment in human history.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── IDLE: big button ── */}
        {phase === 'idle' && !moment && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-12 space-y-6">
            <button onClick={startRewind}
              className="group relative inline-flex items-center justify-center w-36 h-36 rounded-full transition-all"
              style={{ background: AMBER_D, border: `2px solid ${AMBER_B}` }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${AMBER}22, transparent)` }}
              />
              <RotateCcw className="w-10 h-10 transition-transform group-hover:rotate-[-45deg]" style={{ color: AMBER }} />
            </button>
            <p className="text-xs" style={{ color: FAINT }}>Press to travel back</p>
          </motion.div>
        )}

        {/* ── REVEALING / DONE ── */}
        {moment && (phase === 'revealing' || phase === 'done') && (
          <motion.div key={`moment-${count}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-5">

            {/* Location + year header */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs tracking-wider"
                style={{ color: MUTED }}>
                <Clock className="w-3 h-3" />
                {moment.year < 0 ? `${Math.abs(moment.year)} BC` : moment.year === 79 ? 'AD 79' : moment.year}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs tracking-wider"
                style={{ color: MUTED }}>
                <MapPin className="w-3 h-3" />
                {moment.location}
              </span>
              {cat && (
                <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                  style={{ color: cat.color, background: cat.color + '12', border: `1px solid ${cat.color}22` }}>
                  {cat.label}
                </span>
              )}
            </motion.div>

            {/* Lines — revealed one by one */}
            <div className="rounded-2xl p-5 sm:p-7 space-y-0 min-h-[200px]"
              style={{ background: BG, border: `1px solid ${FAINT}` }}>
              {moment.lines.map((line, i) => (
                <AnimatePresence key={i}>
                  {i < visibleLines && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="text-sm sm:text-base leading-relaxed py-2"
                      style={{
                        color: i === moment.lines.length - 1 ? IVORY : MUTED,
                        fontWeight: i === moment.lines.length - 1 ? 600 : 400,
                      }}
                    >
                      {line}
                    </motion.p>
                  )}
                </AnimatePresence>
              ))}

              {/* Typing indicator while revealing */}
              {phase === 'revealing' && visibleLines < moment.lines.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex gap-1 py-3"
                >
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER }} />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Reflection */}
            <AnimatePresence>
              {showReflection && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-center space-y-5"
                >
                  <p className="text-sm italic leading-relaxed px-2" style={{ color: AMBER }}>
                    {moment.reflection}
                  </p>

                  {/* Divider */}
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-8 h-px" style={{ background: FAINT }} />
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER_B }} />
                    <div className="w-8 h-px" style={{ background: FAINT }} />
                  </div>

                  {/* Rewind again */}
                  <button onClick={startRewind}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all"
                    style={{ background: AMBER_D, color: AMBER, border: `1px solid ${AMBER_B}` }}>
                    <RotateCcw className="w-3.5 h-3.5" /> Rewind Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer stats */}
      {seen.length > 0 && (
        <div className="text-center text-[10px] tabular-nums" style={{ color: FAINT }}>
          {seen.length} of {HISTORICAL_MOMENTS.length} moments witnessed ({seenPct}%)
        </div>
      )}
    </div>
  );
}
