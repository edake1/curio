'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';

// ─────────────────────────────────────────────────────────────────
// YOUR SATURDAY COUNT
// A life is ~4,160 Saturdays. How many have you spent?
// ─────────────────────────────────────────────────────────────────

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

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShort(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

interface SaturdayResult {
  all: Date[];
  lived: number;
  remaining: number;
  total: number;
  currentIdx: number;
  currentSat: Date | null;
}

function computeSaturdays(birthday: Date): SaturdayResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the first Saturday on or after birthday
  const first = new Date(birthday);
  first.setHours(0, 0, 0, 0);
  const dow = first.getDay(); // 0=Sun … 6=Sat
  if (dow !== 6) first.setDate(first.getDate() + (6 - dow));

  // End: 80 years after birthday
  const end = new Date(birthday);
  end.setFullYear(end.getFullYear() + 80);

  const all: Date[] = [];
  const cur = new Date(first);
  while (cur <= end && all.length < 4200) {
    all.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }

  // Most recent Saturday ≤ today
  let currentIdx = -1;
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i] <= today) { currentIdx = i; break; }
  }

  const lived = Math.max(0, currentIdx + 1);
  const remaining = all.length - lived;
  const currentSat = currentIdx >= 0 ? all[currentIdx] : null;

  return { all, lived, remaining, total: all.length, currentIdx, currentSat };
}

/** Next Saturday from today (or today if today is Saturday) */
function getThisSaturday(): Date {
  const d = new Date();
  const dow = d.getDay();
  if (dow !== 6) d.setDate(d.getDate() + (6 - dow));
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─────────────────────────────────────────────────────────────────
// DOT GRID — 52 columns (weeks/year) × up to 80 rows (years)
// Each filled dot = one lived Saturday; dim = remaining; pulse = current
// ─────────────────────────────────────────────────────────────────

function SaturdayGrid({ result }: { result: SaturdayResult }) {
  const COLS = 52;
  const { all, lived, currentIdx } = result;

  // Pad to exact multiple of COLS so the grid is rectangular
  const padded = all.length % COLS === 0
    ? all.length
    : all.length + (COLS - (all.length % COLS));

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: 'var(--curio-text-muted)' }}>
        Each dot is one Saturday — {result.total.toLocaleString()} across an 80-year life.
        Each row is one year.
      </p>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--curio-text-muted)' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'rgba(245,158,11,0.8)' }} />
          Lived
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--curio-text-muted)' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 5px 2px rgba(245,158,11,0.7)' }} />
          This week
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--curio-text-muted)' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'rgba(128,128,128,0.15)', border: '1px solid rgba(128,128,128,0.25)' }} />
          Ahead
        </span>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: '2px',
        }}
      >
        {Array.from({ length: padded }, (_, i) => {
          if (i >= all.length) {
            // padding dot (invisible)
            return <div key={`pad-${i}`} style={{ aspectRatio: '1' }} />;
          }
          const isLived = i < lived;
          const isCurrent = i === currentIdx;
          return (
            <div
              key={i}
              title={formatShort(all[i])}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                background: isCurrent
                  ? '#f59e0b'
                  : isLived
                  ? 'rgba(245,158,11,0.75)'
                  : 'rgba(128,128,128,0.13)',
                border: isCurrent
                  ? 'none'
                  : isLived
                  ? 'none'
                  : '1px solid rgba(128,128,128,0.18)',
                boxShadow: isCurrent ? '0 0 5px 2px rgba(245,158,11,0.65)' : undefined,
              }}
            />
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

  const cardRef = useRef<HTMLDivElement>(null);

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
    // Short delay for animation feel
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
          await navigator.share({ files: [file], title: 'My Saturday Count — Curio' });
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
  const pct = result ? Math.round((result.lived / result.total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto py-4 px-1 space-y-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--curio-text)' }}
        >
          Your Saturday Count
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--curio-text-secondary)' }}>
          A lifetime is roughly <strong>4,160 Saturdays</strong>.
          How many have you already spent?
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
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i)}>{m}</option>
            ))}
          </select>

          {/* Day */}
          <select
            value={day}
            onChange={e => { setDay(e.target.value); setResult(null); }}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: 'var(--curio-input)',
              color: 'var(--curio-text)',
              border: '1px solid var(--curio-border)',
            }}
          >
            <option value="">Day</option>
            {dayOptions.map(d => (
              <option key={d} value={String(d)}>{d}</option>
            ))}
          </select>

          {/* Year */}
          <select
            value={year}
            onChange={e => { setYear(e.target.value); setResult(null); }}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: 'var(--curio-input)',
              color: 'var(--curio-text)',
              border: '1px solid var(--curio-border)',
            }}
          >
            <option value="">Year</option>
            {yearOptions.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={month === '' || day === '' || year === '' || loading}
          className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            color: '#fff',
          }}
        >
          {loading ? 'Counting your Saturdays…' : 'Count my Saturdays →'}
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
          >
            {/* Shareable card */}
            <div
              ref={cardRef}
              className="rounded-2xl p-6 space-y-6"
              style={{ background: 'var(--curio-card)', border: '1px solid var(--curio-border)' }}
            >
              {/* Stat row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div
                  className="rounded-xl py-4 px-2"
                  style={{ background: 'var(--curio-surface)' }}
                >
                  <div
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: '#f59e0b' }}
                  >
                    {result.lived.toLocaleString()}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: 'var(--curio-text-muted)' }}
                  >
                    Saturdays lived
                  </div>
                </div>

                <div
                  className="rounded-xl py-4 px-2"
                  style={{ background: 'var(--curio-surface)' }}
                >
                  <div
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: 'var(--curio-text)' }}
                  >
                    {pct}%
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: 'var(--curio-text-muted)' }}
                  >
                    of lifetime spent
                  </div>
                </div>

                <div
                  className="rounded-xl py-4 px-2"
                  style={{ background: 'var(--curio-surface)' }}
                >
                  <div
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: 'var(--curio-text-secondary)' }}
                  >
                    {result.remaining.toLocaleString()}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: 'var(--curio-text-muted)' }}
                  >
                    remaining (to 80)
                  </div>
                </div>
              </div>

              {/* Dot grid */}
              <SaturdayGrid result={result} />

              {/* Emotional footer */}
              <div
                className="rounded-xl py-4 px-4 text-center"
                style={{ background: 'var(--curio-surface)' }}
              >
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--curio-text-secondary)' }}
                >
                  {result.currentSat ? (
                    <>
                      Your most recent Saturday was{' '}
                      <span
                        className="font-semibold"
                        style={{ color: '#f59e0b' }}
                      >
                        {formatDate(result.currentSat)}
                      </span>
                      .
                    </>
                  ) : (
                    <>Your first Saturday hasn&apos;t arrived yet.</>
                  )}
                </p>
                <p
                  className="text-sm mt-1 font-medium"
                  style={{ color: 'var(--curio-text)' }}
                >
                  This Saturday —{' '}
                  <span style={{ color: '#f59e0b' }}>{formatShort(thisSaturday)}</span>{' '}
                  — what will you do with it?
                </p>
              </div>

              {/* Curio watermark */}
              <p
                className="text-center text-xs"
                style={{ color: 'var(--curio-text-muted)' }}
              >
                curio · your saturday count
              </p>
            </div>

            {/* Save button */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  color: '#fff',
                }}
              >
                {saving ? 'Preparing…' : 'Pocket this moment'}
              </button>
              {saveError && (
                <p className="text-center text-xs" style={{ color: '#ef4444' }}>
                  {saveError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
