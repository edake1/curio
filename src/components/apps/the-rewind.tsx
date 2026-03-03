'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, MapPin, Clock, History, SkipForward, Hand, Play, ChevronRight, ChevronUp, BookOpen, ChevronDown } from 'lucide-react';
import { HISTORICAL_MOMENTS, type HistoricalMoment } from '@/data/historical-moments';

// ── design tokens ────────────────────────────────────────────
const IVORY   = 'var(--curio-text, #e8e0d4)';
const MUTED   = 'var(--curio-muted, #a09882)';
const FAINT   = 'rgba(222,198,163,0.10)';
const BG      = 'var(--curio-card, rgba(30,30,28,0.55))';
const AMBER   = '#d97706';
const AMBER_D = 'rgba(217,119,6,0.08)';
const AMBER_B = 'rgba(217,119,6,0.18)';
const SERIF   = 'var(--font-cormorant), Georgia, serif';

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

// ── era mapping ──────────────────────────────────────────────
function getEra(year: number): string {
  if (year < 0)    return 'Ancient World';
  if (year < 500)  return 'Classical Antiquity';
  if (year < 1400) return 'The Middle Ages';
  if (year < 1600) return 'The Renaissance';
  if (year < 1700) return 'Age of Exploration';
  if (year < 1800) return 'The Enlightenment';
  if (year < 1850) return 'Industrial Revolution';
  if (year < 1914) return 'The Modern Age';
  if (year < 1945) return 'The World Wars';
  if (year < 1970) return 'The Atomic Age';
  if (year < 1990) return 'The Cold War';
  if (year < 2000) return 'End of the Century';
  return 'The 21st Century';
}

function yearsAgo(year: number): string {
  const diff = new Date().getFullYear() - year;
  if (diff < 1) return 'This year';
  if (diff === 1) return '1 year ago';
  return `${diff.toLocaleString()} years ago`;
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year < 100) return `AD ${year}`;
  return String(year);
}

// ── localStorage ─────────────────────────────────────────────
const SEEN_KEY    = 'curio-rewind-seen';
const HISTORY_KEY = 'curio-rewind-history';

interface HistoryEntry {
  index: number;
  year: number;
  location: string;
  category: string;
  reflection: string;
  viewedAt: number;
}

function getSeenIds(): number[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
}
function saveSeen(ids: number[]) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
}
function getHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(h: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

// ── pick random unseen moment ────────────────────────────────
function pickMoment(seen: number[]): { moment: HistoricalMoment; index: number } {
  const unseen = HISTORICAL_MOMENTS.map((m, i) => ({ m, i })).filter(x => !seen.includes(x.i));
  const pool   = unseen.length > 0 ? unseen : HISTORICAL_MOMENTS.map((m, i) => ({ m, i }));
  const pick   = pool[Math.floor(Math.random() * pool.length)];
  return { moment: pick.m, index: pick.i };
}

// ── main ─────────────────────────────────────────────────────
type Phase = 'idle' | 'revealing' | 'done';
type RevealMode = 'auto' | 'manual';

export function TheRewindApp() {
  const [phase, setPhase]             = useState<Phase>('idle');
  const [moment, setMoment]           = useState<HistoricalMoment | null>(null);
  const [visibleLines, setVisibleLines] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [seen, setSeen]               = useState<number[]>([]);
  const [history, setHistory]         = useState<HistoryEntry[]>([]);
  const [count, setCount]             = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [revealMode, setRevealMode]   = useState<RevealMode>('auto');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    setSeen(getSeenIds());
    setHistory(getHistory());
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  // Auto-reveal lines
  useEffect(() => {
    if (phase !== 'revealing' || !moment || revealMode !== 'auto') return;
    if (visibleLines >= moment.lines.length) {
      timerRef.current = setTimeout(() => {
        setShowReflection(true);
        setPhase('done');
      }, 1200);
      return cleanup;
    }
    timerRef.current = setTimeout(() => {
      setVisibleLines(v => v + 1);
    }, visibleLines === 0 ? 800 : 2200);
    return cleanup;
  }, [phase, visibleLines, moment, cleanup, revealMode]);

  const advanceLine = useCallback(() => {
    if (!moment || phase !== 'revealing') return;
    if (visibleLines >= moment.lines.length) {
      setShowReflection(true);
      setPhase('done');
    } else {
      setVisibleLines(v => v + 1);
    }
  }, [moment, phase, visibleLines]);

  const skipToEnd = useCallback(() => {
    if (!moment) return;
    cleanup();
    setVisibleLines(moment.lines.length);
    setTimeout(() => { setShowReflection(true); setPhase('done'); }, 400);
  }, [moment, cleanup]);

  const startRewind = useCallback(() => {
    cleanup();
    setShowHistory(false);
    setShowContext(false);
    const { moment: m, index } = pickMoment(seen);
    setMoment(m);
    setVisibleLines(0);
    setShowReflection(false);
    setPhase('revealing');
    setCount(c => c + 1);
    const nextSeen = [...seen, index];
    setSeen(nextSeen);
    saveSeen(nextSeen);
    const entry: HistoryEntry = {
      index, year: m.year, location: m.location,
      category: m.category, reflection: m.reflection,
      viewedAt: Date.now(),
    };
    const nextHistory = [entry, ...history];
    setHistory(nextHistory);
    saveHistory(nextHistory);
  }, [seen, history, cleanup]);

  const replayMoment = useCallback((idx: number) => {
    cleanup();
    setShowHistory(false);
    setShowContext(false);
    const m = HISTORICAL_MOMENTS[idx];
    if (!m) return;
    setMoment(m);
    setVisibleLines(0);
    setShowReflection(false);
    setPhase('revealing');
    setCount(c => c + 1);
  }, [cleanup]);

  const cat      = moment ? (CAT_STYLE[moment.category] || { color: MUTED, label: moment.category }) : null;
  const catColor = cat?.color || AMBER;

  // Stats
  const uniqueSeen = useMemo(() => new Set(seen), [seen]);
  const seenPct    = Math.round((uniqueSeen.size / HISTORICAL_MOMENTS.length) * 100);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { seen: number; total: number }> = {};
    for (const c of Object.keys(CAT_STYLE)) counts[c] = { seen: 0, total: 0 };
    HISTORICAL_MOMENTS.forEach((m, i) => {
      if (!counts[m.category]) counts[m.category] = { seen: 0, total: 0 };
      counts[m.category].total++;
      if (uniqueSeen.has(i)) counts[m.category].seen++;
    });
    return counts;
  }, [uniqueSeen]);

  const centuries = useMemo(() => {
    const years = Array.from(uniqueSeen).map(i => HISTORICAL_MOMENTS[i]?.year).filter(Boolean) as number[];
    if (years.length === 0) return 0;
    return Math.ceil((Math.max(...years) - Math.min(...years)) / 100);
  }, [uniqueSeen]);

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <>
      {/* Film grain — full viewport */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* Vignette — full viewport */}
      <div className="pointer-events-none fixed inset-0 z-40"
        style={{ boxShadow: 'inset 0 0 150px 60px rgba(0,0,0,0.5)' }} />

      {/* Category ambient glow — full viewport */}
      {moment && phase !== 'idle' && !showHistory && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <motion.div
            key={`glow-${count}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            transition={{ duration: 1.5 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[180px]"
            style={{ background: catColor }}
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5 relative z-10">

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: IVORY, fontFamily: SERIF }}>
            The Rewind
          </h2>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: MUTED }}>
            Witness a moment in human history
          </p>
        </div>

        {/* Top bar: history + mode toggle */}
        {uniqueSeen.size > 0 && !showHistory && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-1.5 text-xs tracking-wider px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ color: MUTED, background: FAINT }}>
              <History className="w-3 h-3" /> {uniqueSeen.size} witnessed
            </button>
            {phase === 'revealing' && (
              <button onClick={() => setRevealMode(m => m === 'auto' ? 'manual' : 'auto')}
                className="inline-flex items-center gap-1.5 text-[10px] tracking-wider px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ color: MUTED, background: FAINT }}>
                {revealMode === 'auto'
                  ? <><Hand className="w-3 h-3" /> Manual</>
                  : <><Play className="w-3 h-3" /> Auto</>}
              </button>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ═══════ HISTORY PANEL ═══════ */}
          {showHistory && (
            <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="space-y-4">

              {/* Journey stats */}
              <div className="rounded-2xl p-5" style={{ background: BG, border: `1px solid ${FAINT}` }}>
                <h3 className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: MUTED }}>Your Journey</h3>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Witnessed', value: uniqueSeen.size, sub: `of ${HISTORICAL_MOMENTS.length}` },
                    { label: 'Centuries', value: centuries, sub: 'spanned' },
                    { label: 'Complete', value: `${seenPct}%`, sub: '' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-xl font-bold" style={{ color: IVORY }}>{s.value}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>{s.label}</div>
                      {s.sub && <div className="text-[9px]" style={{ color: MUTED }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Category progress bars */}
                <div className="space-y-2">
                  {Object.entries(categoryCounts).map(([key, { seen: s, total }]) => {
                    const st = CAT_STYLE[key];
                    if (!st || total === 0) return null;
                    const pct = Math.round((s / total) * 100);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] w-20 text-right uppercase tracking-wider" style={{ color: st.color }}>{st.label}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${st.color}15` }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full" style={{ background: st.color }} />
                        </div>
                        <span className="text-[10px] w-8 tabular-nums" style={{ color: MUTED }}>{s}/{total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* History list */}
              <div className="rounded-2xl p-5" style={{ background: BG, border: `1px solid ${FAINT}` }}>
                <h3 className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: MUTED }}>Moments Witnessed</h3>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {Array.from(uniqueSeen).reverse().map((idx) => {
                    const m = HISTORICAL_MOMENTS[idx];
                    if (!m) return null;
                    const st = CAT_STYLE[m.category];
                    return (
                      <button key={idx} onClick={() => replayMoment(idx)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = FAINT)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: st?.color || MUTED }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs tabular-nums" style={{ color: MUTED }}>{formatYear(m.year)}</span>
                            <span className="text-xs" style={{ color: FAINT }}>·</span>
                            <span className="text-xs truncate" style={{ color: MUTED }}>{m.location}</span>
                          </div>
                          <p className="text-sm leading-snug" style={{ color: IVORY, fontFamily: SERIF }}>{m.reflection}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: MUTED }} />
                      </button>
                    );
                  })}
                  {uniqueSeen.size === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: MUTED }}>No moments witnessed yet.</p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowHistory(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-wider transition-all"
                  style={{ color: MUTED, background: FAINT }}>
                  <ChevronUp className="w-3 h-3" /> Close
                </button>
                <button onClick={startRewind}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all"
                  style={{ background: AMBER_D, color: AMBER, border: `1px solid ${AMBER_B}` }}>
                  <RotateCcw className="w-3.5 h-3.5" /> Rewind
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════ IDLE: rich intro ═══════ */}
          {phase === 'idle' && !moment && !showHistory && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-10 space-y-8">

              <div className="relative inline-block">
                <button onClick={startRewind}
                  className="group relative inline-flex items-center justify-center w-36 h-36 rounded-full transition-all"
                  style={{ background: AMBER_D, border: `2px solid ${AMBER_B}` }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.15, 0] }}
                      transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full"
                      style={{ border: `1px solid ${AMBER}` }}
                    />
                  ))}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: `radial-gradient(circle, ${AMBER}22, transparent)` }}
                  />
                  <RotateCcw className="w-10 h-10 transition-transform group-hover:rotate-[-45deg]" style={{ color: AMBER }} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-sm" style={{ color: MUTED }}>Press to travel back in time</p>
                <div className="flex items-center justify-center gap-6">
                  {[
                    { val: HISTORICAL_MOMENTS.length, label: 'moments' },
                    { val: '3,000+', label: 'years' },
                    { val: '7', label: 'categories' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-base font-bold" style={{ color: IVORY }}>{s.val}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color: MUTED }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════ REVEALING / DONE ═══════ */}
          {moment && (phase === 'revealing' || phase === 'done') && !showHistory && (
            <motion.div key={`moment-${count}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4 relative">

              {/* Year watermark */}
              <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 select-none">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 0.04, scale: 1 }}
                  transition={{ duration: 1.5 }}
                  className="text-[120px] sm:text-[160px] font-black leading-none block"
                  style={{ color: catColor, fontFamily: SERIF }}
                >
                  {moment.year < 0 ? Math.abs(moment.year) : moment.year}
                </motion.span>
              </div>

              {/* Era + time context */}
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-center">
                <span className="text-[10px] uppercase tracking-[0.25em] px-3 py-1 rounded-full"
                  style={{ color: AMBER, background: AMBER_D, fontFamily: SERIF }}>
                  {getEra(moment.year)} &middot; {yearsAgo(moment.year)}
                </span>
              </motion.div>

              {/* Location + year + category */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-sm tracking-wider" style={{ color: MUTED }}>
                  <Clock className="w-3.5 h-3.5" /> {formatYear(moment.year)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm tracking-wider" style={{ color: MUTED }}>
                  <MapPin className="w-3.5 h-3.5" /> {moment.location}
                </span>
                {cat && (
                  <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                    style={{ color: cat.color, background: cat.color + '12', border: `1px solid ${cat.color}22` }}>
                    {cat.label}
                  </span>
                )}
              </motion.div>

              {/* Lines card */}
              <div
                className="rounded-2xl p-5 sm:p-7 space-y-0 min-h-[200px] relative overflow-hidden cursor-default"
                style={{ background: BG, border: `1px solid ${FAINT}` }}
                onClick={revealMode === 'manual' && phase === 'revealing' ? advanceLine : undefined}
              >
                {/* Left accent bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${moment.lines.length > 0 ? (visibleLines / moment.lines.length) * 100 : 0}%` }}
                  transition={{ duration: 0.4 }}
                  className="absolute left-0 top-0 w-[2px] rounded-full"
                  style={{ background: catColor }}
                />

                {moment.lines.map((line, i) => (
                  <AnimatePresence key={i}>
                    {i < visibleLines && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="text-base sm:text-lg leading-relaxed py-2.5"
                        style={{
                          color: i === moment.lines.length - 1 ? IVORY : MUTED,
                          fontWeight: i === moment.lines.length - 1 ? 600 : 400,
                          fontFamily: SERIF,
                        }}
                      >
                        {line}
                      </motion.p>
                    )}
                  </AnimatePresence>
                ))}

                {/* Typing indicator */}
                {phase === 'revealing' && visibleLines < moment.lines.length && (
                  <div className="flex items-center justify-between py-3">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex gap-1"
                    >
                      {[0, 1, 2].map(j => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
                      ))}
                    </motion.div>
                    {revealMode === 'manual' && (
                      <span className="text-[9px] tracking-wider" style={{ color: FAINT }}>tap to reveal</span>
                    )}
                  </div>
                )}
              </div>

              {/* Line progress dots + skip */}
              {phase === 'revealing' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    {moment.lines.map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          background: i < visibleLines ? catColor : `${catColor}25`,
                          transform: i < visibleLines ? 'scale(1)' : 'scale(0.7)',
                        }}
                      />
                    ))}
                  </div>
                  <button onClick={skipToEnd}
                    className="ml-3 inline-flex items-center gap-1 text-[9px] tracking-wider px-2 py-1 rounded-md transition-all hover:opacity-80"
                    style={{ color: MUTED, background: FAINT }}>
                    <SkipForward className="w-2.5 h-2.5" /> Skip
                  </button>
                </motion.div>
              )}

              {/* Reflection + Learn More */}
              <AnimatePresence>
                {showReflection && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="space-y-5"
                  >
                    <p className="text-base sm:text-lg italic leading-relaxed text-center px-2" style={{ color: AMBER, fontFamily: SERIF }}>
                      {moment.reflection}
                    </p>

                    {/* Learn More — collapsible */}
                    {moment.context && (
                      <div className="rounded-xl overflow-hidden" style={{ background: BG, border: `1px solid ${FAINT}` }}>
                        <button
                          onClick={() => setShowContext(v => !v)}
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors"
                          style={{ color: MUTED }}
                          onMouseEnter={e => (e.currentTarget.style.background = FAINT)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span className="inline-flex items-center gap-2 text-[11px] tracking-wider uppercase">
                            <BookOpen className="w-3.5 h-3.5" /> Learn More
                          </span>
                          <motion.div animate={{ rotate: showContext ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {showContext && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-4 text-sm sm:text-base leading-relaxed" style={{ color: MUTED, fontFamily: SERIF }}>
                                {moment.context}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-8 h-px" style={{ background: FAINT }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER_B }} />
                      <div className="w-8 h-px" style={{ background: FAINT }} />
                    </div>

                    <div className="text-center">
                      <button onClick={startRewind}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all"
                        style={{ background: AMBER_D, color: AMBER, border: `1px solid ${AMBER_B}` }}>
                        <RotateCcw className="w-3.5 h-3.5" /> Rewind Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {uniqueSeen.size > 0 && !showHistory && (
          <div className="text-center text-xs tabular-nums" style={{ color: MUTED }}>
            {uniqueSeen.size} of {HISTORICAL_MOMENTS.length} moments witnessed ({seenPct}%)
          </div>
        )}
      </div>
    </>
  );
}
