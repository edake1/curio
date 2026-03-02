'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';

// ─────────────────────────────────────────────────────────────────
// YOUR SATURDAY COUNT
// Life Calendar = weeks of existence.
// Saturday Count = the days you actually got to choose.
// ─────────────────────────────────────────────────────────────────

const MILESTONE_NUMS = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(monthIndex: number, year: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
}

function formatShort(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

interface Milestone {
  n: number;
  date: Date;
  isPast: boolean;
  weeksAway: number;
}

interface DecadeBucket {
  label: string;
  start: number;
  total: number;
  lived: number;
}

interface SaturdayResult {
  all: Date[];
  lived: number;
  remaining: number;
  total: number;
  currentIdx: number;
  currentSat: Date | null;
  milestones: Milestone[];
  decades: DecadeBucket[];
  nextMilestone: Milestone | null;
}

function computeSaturdays(birthday: Date): SaturdayResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const first = new Date(birthday);
  first.setHours(0, 0, 0, 0);
  const dow = first.getDay();
  if (dow !== 6) first.setDate(first.getDate() + (6 - dow));

  const end = new Date(birthday);
  end.setFullYear(end.getFullYear() + 80);

  const all: Date[] = [];
  const cur = new Date(first);
  while (cur <= end && all.length < 4300) {
    all.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }

  // currentIdx = next upcoming Saturday (>= today);
  // on a non-Saturday today IS in the future, so the white dot = the incoming one.
  let currentIdx = -1;
  for (let i = 0; i < all.length; i++) {
    if (all[i] >= today) { currentIdx = i; break; }
  }

  const lived = Math.max(0, currentIdx); // all[0..currentIdx-1] are past
  const remaining = all.length - lived;
  const currentSat = currentIdx >= 0 ? all[currentIdx] : null;

  // Milestones
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  const milestones: Milestone[] = MILESTONE_NUMS
    .filter(n => n <= all.length)
    .map(n => {
      const date = all[n - 1];
      const isPast = date <= today;
      const weeksAway = Math.round((date.getTime() - today.getTime()) / msInWeek);
      return { n, date, isPast, weeksAway };
    });
  const nextMilestone = milestones.find(m => !m.isPast) ?? null;

  // Decade breakdown
  const decades: DecadeBucket[] = [];
  for (let decade = 0; decade < 8; decade++) {
    const ageStart = decade * 10;
    const ageEnd = ageStart + 10;
    const dStart = new Date(birthday);
    dStart.setFullYear(dStart.getFullYear() + ageStart);
    const dEnd = new Date(birthday);
    dEnd.setFullYear(dEnd.getFullYear() + ageEnd);
    const inDecade = all.filter(d => d >= dStart && d < dEnd);
    const livedInDecade = inDecade.filter(d => d <= today).length;
    decades.push({
      label: ageStart === 0 ? 'Childhood' : `${ageStart}s`,
      start: ageStart,
      total: inDecade.length,
      lived: livedInDecade,
    });
  }

  return { all, lived, remaining, total: all.length, currentIdx, currentSat, milestones, decades, nextMilestone };
}

/** Next Saturday from today (or today if today is Saturday) */
function getThisSaturday(): Date {
  const d = new Date();
  const dow = d.getDay();
  if (dow !== 6) d.setDate(d.getDate() + (6 - dow));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** localStorage key for a given Saturday date */
function toDateKey(d: Date) {
  return `curio-sat-${d.toISOString().slice(0, 10)}`;
}

// ─────────────────────────────────────────────────────────────────
// DOT GRID — milestones marked with a ring
// ─────────────────────────────────────────────────────────────────

function SaturdayGrid({ result, intentions }: { result: SaturdayResult; intentions: Record<string, string> }) {
  const COLS = 52;
  const { all, lived, currentIdx, milestones } = result;
  const milestoneSet = new Set(milestones.map(m => m.n - 1));
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  // Tooltip position is updated via DOM ref so it never triggers a React re-render.
  const tooltipRef = useRef<HTMLDivElement>(null);

  const padded = all.length % COLS === 0
    ? all.length
    : all.length + (COLS - (all.length % COLS));

  const hoveredDate = hoveredIdx !== null && hoveredIdx < all.length ? all[hoveredIdx] : null;
  const hoveredNote = hoveredDate ? intentions[toDateKey(hoveredDate)] : undefined;
  const isMilestoneHovered = hoveredIdx !== null && milestoneSet.has(hoveredIdx);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs" style={{ color: 'var(--curio-text-muted)' }}>
          Each dot = one Saturday · ringed = milestone · each row = one year
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        {[
          { bg: 'rgba(245,158,11,0.85)', border: 'none',                              label: 'Lived'         },
          { bg: '#ffffff',               border: 'none',                              label: 'This Saturday' },
          { bg: 'rgba(128,128,128,0.18)', border: '1px solid rgba(128,128,128,0.3)', label: 'Ahead'         },
          { bg: 'rgba(245,158,11,0.85)', border: '2px solid #ffffff',                label: 'Milestone'     },
        ].map(({ bg, border, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--curio-text-muted)' }}>
            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: bg, border }} />
            {label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '2px' }}
        onMouseMove={(e) => {
          // Tooltip position — direct DOM write, no re-render
          if (tooltipRef.current) {
            tooltipRef.current.style.top = `${e.clientY + 16}px`;
            tooltipRef.current.style.left = `${Math.min(e.clientX + 12, window.innerWidth - 224)}px`;
          }
          // Hover detection — runs at mouse-move frequency so no dots are skipped
          const el = (e.target as HTMLElement).closest<HTMLElement>('[data-idx]');
          const idx = el ? Number(el.dataset.idx) : null;
          setHoveredIdx(prev => prev === idx ? prev : idx);
        }}
        onMouseLeave={() => { setHoveredIdx(null); }}
      >
        {Array.from({ length: padded }, (_, i) => {
          if (i >= all.length) return <div key={`pad-${i}`} style={{ aspectRatio: '1' }} />;
          const isLived = i < lived;
          const isCurrent = i === currentIdx;
          const isMilestone = milestoneSet.has(i);
          const isHovered = hoveredIdx === i;
          const hasNote = i < all.length && !!intentions[toDateKey(all[i])];
          return (
            <div
              key={i}
              data-idx={i}
              className={isCurrent && !isHovered ? 'sat-current-dot' : undefined}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                cursor: 'default',
                background: isCurrent ? '#ffffff' : isLived ? 'rgba(245,158,11,0.85)' : 'rgba(128,128,128,0.13)',
                border: isMilestone
                  ? `2px solid ${isLived || isCurrent ? '#ffffff' : 'rgba(245,158,11,0.55)'}`
                  : isLived || isCurrent ? 'none' : '1px solid rgba(128,128,128,0.18)',
                boxShadow: isHovered
                  ? '0 0 0 2.5px #38bdf8, 0 0 0 8px rgba(56,189,248,0.5)'
                  : isCurrent && hasNote
                  ? '0 0 0 2px rgba(245,158,11,0.9), 0 0 6px 3px rgba(255,255,255,0.4)'
                  : hasNote && isLived
                  ? '0 0 0 2px rgba(255,255,255,0.6)'
                  : undefined,
                transform: isHovered ? 'scale(1.4)' : undefined,
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                position: 'relative',
                zIndex: isHovered ? 10 : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Floating cursor tooltip — always in DOM, hidden when not hovering.
          Position is written directly to style by onMouseMove (no React state ⟹ no re-render). */}
      <div
        ref={tooltipRef}
        style={{
          display: hoveredDate ? 'block' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          background: 'rgba(10,12,18,0.96)',
          border: '1px solid rgba(56,189,248,0.35)',
          borderRadius: 10,
          padding: '8px 12px',
          maxWidth: 210,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.1)',
        }}
      >
        {hoveredDate && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0', lineHeight: 1.4 }}>
              Saturday #{(hoveredIdx! + 1).toLocaleString()}
              <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.55)', marginLeft: 4 }}>
                · {formatShort(hoveredDate)}
              </span>
            </div>
            {isMilestoneHovered && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 3, fontWeight: 500 }}>★ Milestone Saturday</div>
            )}
            {hoveredNote && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontStyle: 'italic', lineHeight: 1.4 }}>
                &ldquo;{hoveredNote}&rdquo;
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MILESTONE CARDS
// ─────────────────────────────────────────────────────────────────

function MilestonesSection({ result }: { result: SaturdayResult }) {
  const futureOnes = result.milestones.filter(m => !m.isPast);
  const visible = result.milestones.filter(m => {
    if (m.isPast) return true;
    return futureOnes.indexOf(m) < 2;
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--curio-text-muted)' }}>
        Milestone Saturdays
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visible.map(m => (
          <div
            key={m.n}
            className="rounded-xl px-3 py-3"
            style={{
              background: m.isPast ? 'var(--curio-surface)' : 'rgba(245,158,11,0.06)',
              border: m.isPast ? '1px solid var(--curio-border)' : '1px solid rgba(245,158,11,0.25)',
              opacity: m.isPast ? 1 : 0.85,
            }}
          >
            <div className="text-lg font-bold tabular-nums" style={{ color: m.isPast ? '#f59e0b' : 'var(--curio-text-muted)' }}>
              #{m.n.toLocaleString()}
            </div>
            <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--curio-text)' }}>
              {formatMonthYear(m.date)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--curio-text-muted)' }}>
              {m.isPast ? 'passed' : m.weeksAway === 1 ? 'next week' : `in ${m.weeksAway.toLocaleString()} weeks`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DECADE BREAKDOWN
// ─────────────────────────────────────────────────────────────────

function DecadeBreakdown({ result }: { result: SaturdayResult }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--curio-text-muted)' }}>
        Saturdays by decade
      </p>
      <div className="space-y-1.5">
        {result.decades.map(d => {
          const pctLived = d.total > 0 ? (d.lived / d.total) * 100 : 0;
          const fullyLived = d.lived >= d.total;
          const notStarted = d.lived === 0;
          return (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-xs w-[72px] shrink-0 text-right" style={{ color: 'var(--curio-text-muted)' }}>
                {d.label}
              </span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(128,128,128,0.15)' }}>
                <div
                  style={{
                    width: `${pctLived}%`,
                    height: '100%',
                    borderRadius: 9999,
                    background: fullyLived
                      ? 'rgba(245,158,11,0.9)'
                      : notStarted
                      ? 'transparent'
                      : 'linear-gradient(90deg, rgba(245,158,11,0.9) 0%, rgba(245,158,11,0.5) 100%)',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <span className="text-xs tabular-nums w-[60px] shrink-0" style={{ color: notStarted ? 'var(--curio-text-muted)' : 'var(--curio-text-secondary)' }}>
                {notStarted ? `0/${d.total}` : `${d.lived}/${d.total}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────

export function YourSaturdayCountApp() {
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [result, setResult] = useState<SaturdayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [intentions, setIntentions] = useState<Record<string, string>>({});
  const [intentionDraft, setIntentionDraft] = useState('');
  const [intentionSaved, setIntentionSaved] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Load all saved intentions from localStorage on mount
  useEffect(() => {
    const loaded: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('curio-sat-')) {
        const v = localStorage.getItem(k);
        if (v) loaded[k] = v;
      }
    }
    setIntentions(loaded);
    // Pre-fill draft with any saved note for this Saturday
    const thisKey = toDateKey(getThisSaturday());
    setIntentionDraft(localStorage.getItem(thisKey) ?? '');
  }, []);

  const handleSaveIntention = useCallback(() => {
    const key = toDateKey(getThisSaturday());
    if (intentionDraft.trim()) {
      localStorage.setItem(key, intentionDraft.trim());
      setIntentions(prev => ({ ...prev, [key]: intentionDraft.trim() }));
    } else {
      localStorage.removeItem(key);
      setIntentions(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
    setIntentionSaved(true);
    setTimeout(() => setIntentionSaved(false), 3500);
  }, [intentionDraft]);

  const daysInMonth =
    month !== '' && year !== ''
      ? getDaysInMonth(parseInt(month), parseInt(year))
      : 31;
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const yearOptions = Array.from({ length: currentYear - 1924 }, (_, i) => currentYear - i);

  const handleSubmit = useCallback(() => {
    if (month === '' || day === '' || year === '') return;
    setLoading(true);
    const birthday = new Date(parseInt(year), parseInt(month), parseInt(day));
    birthday.setHours(0, 0, 0, 0);
    setTimeout(() => {
      setResult(computeSaturdays(birthday));
      setLoading(false);
    }, 500);
  }, [month, day, year]);

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setSaving(true);
    setSaveError('');
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      if (isTouchDevice()) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'my-saturdays.png', { type: 'image/png' });
          await navigator.share({ files: [file], title: '4,160 Saturdays — Curio' });
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          // fallback to download
          const link = document.createElement('a');
          link.download = 'my-saturdays.png';
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const link = document.createElement('a');
        link.download = 'my-saturdays.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      setSaveError('Could not generate image. Try again.');
    } finally {
      setSaving(false);
    }
  }, []);

  const thisSaturday = getThisSaturday();

  return (
    <div className="max-w-2xl mx-auto py-4 px-1 space-y-8">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes satPulse {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(255,255,255,0.3); }
          50%       { box-shadow: 0 0 14px 7px rgba(255,255,255,0.85); }
        }
        .sat-current-dot { animation: satPulse 2.8s ease-in-out infinite; }

        @keyframes satShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .sat-cta-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 40%, #f97316 70%, #f59e0b 100%);
          background-size: 300% auto;
          animation: satShimmer 4s linear infinite;
          transition: filter 0.2s ease, box-shadow 0.2s ease;
        }
        .sat-cta-btn:hover:not(:disabled) {
          filter: brightness(1.18);
          box-shadow: 0 0 18px rgba(245,158,11,0.55), 0 0 36px rgba(239,68,68,0.25);
        }
        .sat-cta-btn:disabled { animation: none; opacity: 0.4; }

        @keyframes satSavePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50%       { box-shadow: 0 0 8px 3px rgba(245,158,11,0.45); }
        }
        .sat-save-btn {
          transition: filter 0.2s ease, box-shadow 0.2s ease;
        }
        .sat-save-btn:hover:not(:disabled) {
          filter: brightness(1.12);
          box-shadow: 0 0 12px rgba(245,158,11,0.45);
          animation: satSavePulse 1.6s ease-in-out infinite;
        }
        .sat-intention-input:focus {
          outline: none;
          border-color: rgba(245,158,11,0.6) !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12), 0 0 10px rgba(245,158,11,0.1);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
      ` }} />

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--curio-text)' }}>
          4,160 Saturdays
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--curio-text-secondary)' }}>
          On weekdays you belong to obligations. Saturdays are the days you get to choose.
          <br />
          An 80-year life gives you roughly <strong>4,160</strong> of them. How many are left?
        </p>
      </div>

      {/* Input card */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--curio-card)', border: '1px solid var(--curio-border)' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--curio-text-muted)' }}
        >
          When were you born?
        </p>

        <div className="grid grid-cols-3 gap-3">
          {/* Month */}
          <select
            value={month}
            onChange={e => { setMonth(e.target.value); setDay(''); setResult(null); }}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: 'var(--curio-input)',
              color: 'var(--curio-text)',
              border: '1px solid var(--curio-border)',
            }}
          >
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={String(i)}>{m}</option>)}
          </select>

          <select
            value={day}
            onChange={e => { setDay(e.target.value); setResult(null); }}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }}
          >
            <option value="">Day</option>
            {dayOptions.map(d => <option key={d} value={String(d)}>{d}</option>)}
          </select>

          <select
            value={year}
            onChange={e => { setYear(e.target.value); setResult(null); }}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }}
          >
            <option value="">Year</option>
            {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={month === '' || day === '' || year === '' || loading}
          className="sat-cta-btn w-full py-3 rounded-xl text-sm font-semibold tracking-wide active:scale-[0.98]"
          style={{ color: '#fff' }}
        >
          {loading ? 'Counting…' : 'Show me my Saturdays →'}
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Shareable card */}
            <div
              ref={cardRef}
              className="rounded-2xl p-6 space-y-6"
              style={{ background: 'var(--curio-card)', border: '1px solid var(--curio-border)' }}
            >
              {/* Stat row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="rounded-xl py-3 sm:py-4 px-1.5 sm:px-2 min-w-0 overflow-hidden" style={{ background: 'var(--curio-surface)' }}>
                  <div className="text-xl sm:text-3xl font-bold tabular-nums" style={{ color: '#f59e0b' }}>
                    {result.lived.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--curio-text-muted)' }}>Saturdays lived</div>
                </div>

                <div className="rounded-xl py-3 sm:py-4 px-1.5 sm:px-2 min-w-0 overflow-hidden" style={{ background: 'var(--curio-surface)' }}>
                  <div className="text-xl sm:text-3xl font-bold tabular-nums" style={{ color: 'var(--curio-text-secondary)' }}>
                    {result.remaining.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--curio-text-muted)' }}>remaining (to 80)</div>
                </div>

                <div className="rounded-xl py-3 sm:py-4 px-1.5 sm:px-2 min-w-0 overflow-hidden" style={{ background: 'var(--curio-surface)' }}>
                  <div
                    className="text-xl sm:text-3xl font-bold tabular-nums"
                    style={{ color: result.nextMilestone ? 'var(--curio-text)' : 'var(--curio-text-muted)' }}
                  >
                    {result.nextMilestone ? `#${result.nextMilestone.n.toLocaleString()}` : '—'}
                  </div>
                  <div className="text-[10px] sm:text-xs mt-1 truncate" style={{ color: 'var(--curio-text-muted)' }}>
                    {result.nextMilestone
                      ? `next milestone · ${result.nextMilestone.weeksAway <= 1 ? 'next week' : `${result.nextMilestone.weeksAway.toLocaleString()} wks`}`
                      : 'all milestones passed'}
                  </div>
                </div>
              </div>

              {/* Milestone cards */}
              <MilestonesSection result={result} />

              {/* Decade breakdown */}
              <DecadeBreakdown result={result} />

              {/* Dot grid */}
              <SaturdayGrid result={result} intentions={intentions} />

              {/* This Saturday — intention capture */}
              <div className="rounded-xl py-4 px-4 space-y-3" style={{ background: 'var(--curio-surface)' }}>
                <div className="text-center space-y-0.5">
                  <p className="text-sm font-semibold" style={{ color: 'var(--curio-text)' }}>
                    This Saturday —{' '}
                    <span style={{ color: '#f59e0b' }}>{formatShort(thisSaturday)}</span>
                  </p>
                  <p className="text-xs" style={{ color: 'var(--curio-text-muted)' }}>
                    {result.nextMilestone && result.nextMilestone.weeksAway <= 4
                      ? `Saturday #${result.nextMilestone.n.toLocaleString()} is coming up. Make it one you remember.`
                      : result.remaining < 500
                      ? 'Every Saturday from here counts more than the last. Spend it well.'
                      : "Not every Saturday needs to be epic. But it's worth deciding what you'll do with it."}
                  </p>
                </div>
                {/* Intention input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={intentionDraft}
                    onChange={e => { setIntentionDraft(e.target.value); setIntentionSaved(false); }}
                    onKeyDown={e => e.key === 'Enter' && handleSaveIntention()}
                    placeholder="What will you do with this Saturday?"
                    maxLength={120}
                    className="sat-intention-input flex-1 rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: 'var(--curio-input)',
                      color: 'var(--curio-text)',
                      border: '1px solid var(--curio-border)',
                    }}
                  />
                  <button
                    onClick={handleSaveIntention}
                    className="sat-save-btn px-3 py-2 rounded-lg text-xs font-semibold active:scale-95"
                    style={{
                      background: intentionSaved ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                      color: intentionSaved ? '#22c55e' : '#f59e0b',
                      border: `1px solid ${intentionSaved ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    }}
                  >
                    {intentionSaved ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
                {/* Post-save confirmation */}
                {intentionSaved && intentionDraft.trim() && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-center"
                    style={{ color: '#22c55e' }}
                  >
                    Locked in: &ldquo;{intentionDraft.trim()}&rdquo; — hover this Saturday&apos;s dot to see it.
                  </motion.p>
                )}
                {intentionSaved && !intentionDraft.trim() && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-center"
                    style={{ color: 'var(--curio-text-muted)' }}
                  >
                    Note cleared.
                  </motion.p>
                )}
                {!intentionSaved && (
                  <p className="text-xs text-center" style={{ color: 'var(--curio-text-muted)', opacity: 0.5 }}>
                    Hover past dots to see what you wrote.
                  </p>
                )}
              </div>

              {/* Curio watermark */}
              <p className="text-center text-xs" style={{ color: 'var(--curio-text-muted)' }}>
                curio · 4,160 saturdays
              </p>
            </div>

            {/* Save button */}
            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: '#fff' }}
              >
                {saving ? 'Preparing…' : 'Pocket this moment'}
              </button>
              {saveError && (
                <p className="text-center text-xs" style={{ color: '#ef4444' }}>{saveError}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
