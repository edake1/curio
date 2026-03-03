'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
  LIFE_EXPECTANCY, DEFAULT_COUNTRY,
  BIRTH_YEAR_MIN, WEEKS_PER_YEAR,
} from '@/data/countries';

// ─────────────────────────────────────────────────────────────────
// LIFE CALENDAR — merged Weeks + Saturdays views
// Mobile-friendly flat grid replacing tree rings
// ─────────────────────────────────────────────────────────────────

const ACCENT = '#818cf8';

const MILESTONES: Record<number, { emoji: string; label: string }> = {
  5:  { emoji: '🎒', label: 'School' },
  13: { emoji: '🧒', label: 'Teenage' },
  18: { emoji: '🎓', label: 'Adult' },
  30: { emoji: '✨', label: 'Thirties' },
  40: { emoji: '🔥', label: 'Forties' },
  50: { emoji: '👑', label: 'Fifty' },
  65: { emoji: '🏖️', label: 'Retirement' },
};

function getPhaseColor(yearIdx: number, totalYears: number): string {
  const pct = yearIdx / totalYears;
  if (pct < 0.25) return '#10b981';
  if (pct < 0.50) return '#06b6d4';
  if (pct < 0.75) return '#f59e0b';
  return '#f87171';
}

function getPhaseName(yearIdx: number, totalYears: number): string {
  const pct = yearIdx / totalYears;
  if (pct < 0.25) return 'Youth';
  if (pct < 0.50) return 'Young adult';
  if (pct < 0.75) return 'Middle age';
  return 'Later years';
}

// ── Saturday helpers ─────────────────────────────────────────────
const SAT_MILESTONE_NUMS = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatShort(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatMonthYear(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
}
function getDaysInMonth(mi: number, yr: number) { return new Date(yr, mi + 1, 0).getDate(); }
function toDateKey(d: Date) { return `curio-sat-${d.toISOString().slice(0, 10)}`; }
function getThisSaturday(): Date {
  const d = new Date(); const dow = d.getDay();
  if (dow !== 6) d.setDate(d.getDate() + (6 - dow));
  d.setHours(0, 0, 0, 0); return d;
}

interface SaturdayResult {
  all: Date[];
  lived: number;
  remaining: number;
  total: number;
  currentIdx: number;
  currentSat: Date | null;
  milestones: { n: number; date: Date; isPast: boolean; weeksAway: number }[];
  decades: { label: string; start: number; total: number; lived: number }[];
  nextMilestone: { n: number; date: Date; isPast: boolean; weeksAway: number } | null;
}

function computeSaturdays(birthday: Date): SaturdayResult {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const first = new Date(birthday); first.setHours(0, 0, 0, 0);
  const dow = first.getDay();
  if (dow !== 6) first.setDate(first.getDate() + (6 - dow));
  const end = new Date(birthday); end.setFullYear(end.getFullYear() + 80);
  const all: Date[] = [];
  const cur = new Date(first);
  while (cur <= end && all.length < 4300) { all.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
  let currentIdx = -1;
  for (let i = 0; i < all.length; i++) { if (all[i] >= today) { currentIdx = i; break; } }
  const lived = currentIdx === -1 ? all.length : currentIdx;
  const remaining = all.length - lived;
  const currentSat = currentIdx >= 0 ? all[currentIdx] : null;
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  const milestones = SAT_MILESTONE_NUMS.filter(n => n <= all.length).map(n => {
    const date = all[n - 1]; const isPast = date <= today;
    const weeksAway = Math.round((date.getTime() - today.getTime()) / msInWeek);
    return { n, date, isPast, weeksAway };
  });
  const nextMilestone = milestones.find(m => !m.isPast) ?? null;
  const decades: SaturdayResult['decades'] = [];
  for (let decade = 0; decade < 8; decade++) {
    const ageStart = decade * 10;
    const dStart = new Date(birthday); dStart.setFullYear(dStart.getFullYear() + ageStart);
    const dEnd = new Date(birthday); dEnd.setFullYear(dEnd.getFullYear() + ageStart + 10);
    const inDecade = all.filter(d => d >= dStart && d < dEnd);
    const livedIn = inDecade.filter(d => d <= today).length;
    decades.push({ label: ageStart === 0 ? 'Childhood' : `${ageStart}s`, start: ageStart, total: inDecade.length, lived: livedIn });
  }
  return { all, lived, remaining, total: all.length, currentIdx, currentSat, milestones, decades, nextMilestone };
}

// ── Tab Button ───────────────────────────────────────────────────
function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="relative px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors"
      style={{ color: active ? ACCENT : 'var(--curio-text-muted)' }}>
      {label}
      {active && (
        <motion.div layoutId="cal-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
          style={{ background: ACCENT }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
      )}
    </button>
  );
}

// ── Weeks Grid (mobile-friendly replacement for tree rings) ──────
function WeeksGrid({
  weeksLived, totalWeeks, totalYears, birthYear, currentAge,
}: {
  weeksLived: number; totalWeeks: number; totalYears: number;
  birthYear: number; currentAge: number;
}) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const milestoneWeeks = useMemo(() => {
    const s = new Set<number>();
    for (const age of Object.keys(MILESTONES).map(Number)) {
      s.add(age * 52);
    }
    return s;
  }, []);

  const weeksLeft = Math.max(0, totalWeeks - weeksLived);
  const pct = Math.min(100, Math.max(0, (weeksLived / totalWeeks) * 100));

  // Derive hovered info
  const hoveredInfo = useMemo(() => {
    if (hoveredWeek === null) return null;
    const yearIdx = Math.floor(hoveredWeek / 52);
    const weekInYear = (hoveredWeek % 52) + 1;
    const calYear = birthYear + yearIdx;
    const phase = getPhaseName(yearIdx, totalYears);
    const color = getPhaseColor(yearIdx, totalYears);
    const isLived = hoveredWeek < weeksLived;
    const isCurrent = hoveredWeek === weeksLived;
    const ms = MILESTONES[yearIdx];
    return { yearIdx, weekInYear, calYear, phase, color, isLived, isCurrent, ms };
  }, [hoveredWeek, birthYear, totalYears, weeksLived]);

  return (
    <div className="space-y-4">
      {/* Hero stats */}
      <div className="rounded-2xl border dark:border-white/[0.07] border-black/[0.09] p-4 sm:p-5"
        style={{ background: `linear-gradient(135deg, ${ACCENT}0d 0%, transparent 55%)` }}>
        <div className="flex flex-wrap gap-x-8 gap-y-3 items-end">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-0.5">You are in</p>
            <p className="text-[2rem] sm:text-[2.8rem] font-black tabular-nums leading-none" style={{ color: ACCENT }}>
              week {Math.max(1, weeksLived).toLocaleString()}
            </p>
            <p className="text-[12px] dark:text-zinc-500 text-zinc-400 mt-0.5">age {currentAge}</p>
          </div>
          <div className="w-px self-stretch dark:bg-white/[0.06] bg-black/[0.06]" />
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="min-w-0">
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">Weeks lived</p>
              <p className="text-[1.1rem] sm:text-[1.4rem] font-bold tabular-nums text-emerald-400 leading-none">{weeksLived.toLocaleString()}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">Weeks left</p>
              <p className="text-[1.1rem] sm:text-[1.4rem] font-bold tabular-nums text-rose-400 leading-none">{weeksLeft.toLocaleString()}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mb-0.5">Life used</p>
              <p className="text-[1.1rem] sm:text-[1.4rem] font-bold tabular-nums text-amber-400 leading-none">{pct.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative h-1.5 rounded-full dark:bg-white/[0.06] bg-black/[0.07] mt-4 overflow-hidden">
          <motion.div className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4, #f59e0b, #f87171)' }}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
        </div>
      </div>

      {/* Grid instructions */}
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">
        Every square is one week · every row is one year · tap to explore
      </p>

      {/* The grid */}
      <div className="relative">
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 1fr)', gap: '1.5px' }}
          onMouseMove={(e) => {
            if (tooltipRef.current) {
              tooltipRef.current.style.top = `${e.clientY + 16}px`;
              tooltipRef.current.style.left = `${Math.min(e.clientX + 12, window.innerWidth - 200)}px`;
            }
            const el = (e.target as HTMLElement).closest<HTMLElement>('[data-w]');
            const w = el ? Number(el.dataset.w) : null;
            setHoveredWeek(prev => prev === w ? prev : w);
          }}
          onMouseLeave={() => setHoveredWeek(null)}
          onTouchStart={(e) => {
            const el = (e.target as HTMLElement).closest<HTMLElement>('[data-w]');
            if (el) setHoveredWeek(Number(el.dataset.w));
          }}
          onTouchEnd={() => setTimeout(() => setHoveredWeek(null), 1500)}
        >
          {Array.from({ length: totalWeeks }, (_, i) => {
            const yearIdx = Math.floor(i / 52);
            const isLived = i < weeksLived;
            const isCurrent = i === weeksLived;
            const isMilestone = milestoneWeeks.has(i);
            const isHovered = hoveredWeek === i;
            const color = getPhaseColor(yearIdx, totalYears);

            return (
              <div key={i} data-w={i} style={{
                aspectRatio: '1',
                borderRadius: 2,
                background: isCurrent ? '#ffffff'
                  : isLived ? color
                  : 'rgba(128,128,128,0.12)',
                border: isMilestone
                  ? `1.5px solid ${isLived ? '#ffffff80' : `${color}60`}`
                  : isLived ? 'none' : '0.5px solid rgba(128,128,128,0.15)',
                boxShadow: isHovered
                  ? `0 0 0 2px ${ACCENT}, 0 0 0 6px ${ACCENT}40`
                  : isCurrent
                  ? '0 0 6px 2px rgba(255,255,255,0.5)'
                  : undefined,
                transform: isHovered ? 'scale(1.8)' : undefined,
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                zIndex: isHovered ? 10 : isCurrent ? 5 : undefined,
                position: 'relative',
                cursor: 'default',
              }} />
            );
          })}
        </div>

        {/* Floating tooltip */}
        <div ref={tooltipRef} style={{
          display: hoveredInfo ? 'block' : 'none',
          position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none',
          background: 'rgba(10,12,18,0.96)', border: `1px solid ${ACCENT}50`,
          borderRadius: 10, padding: '8px 12px', maxWidth: 200,
          backdropFilter: 'blur(10px)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          {hoveredInfo && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: hoveredInfo.color }}>
                {hoveredInfo.ms ? `${hoveredInfo.ms.emoji} ` : ''}Age {hoveredInfo.yearIdx}
                <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 4, fontSize: 11 }}>
                  · {hoveredInfo.calYear}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                Week {hoveredInfo.weekInYear} of 52 · {hoveredInfo.phase}
              </div>
              {hoveredInfo.isCurrent && (
                <div style={{ fontSize: 10, color: ACCENT, marginTop: 3, fontWeight: 600 }}>◆ You are here</div>
              )}
              {hoveredInfo.ms && (
                <div style={{ fontSize: 10, color: hoveredInfo.color, marginTop: 2, fontWeight: 600 }}>{hoveredInfo.ms.label}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {([
          { color: '#10b981', label: 'Youth (0–25%)' },
          { color: '#06b6d4', label: 'Young adult (25–50%)' },
          { color: '#f59e0b', label: 'Middle age (50–75%)' },
          { color: '#f87171', label: 'Later years (75–100%)' },
          { color: 'rgba(128,128,128,0.12)', label: 'Future', border: true },
          { color: '#ffffff', label: 'You, right now' },
        ] as { color: string; label: string; border?: boolean }[]).map(({ color, label, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color, border: border ? '1px solid rgba(128,128,128,0.3)' : undefined }} />
            <span className="text-[10px] dark:text-zinc-500 text-zinc-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Milestone strip */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
        {Object.entries(MILESTONES).map(([age, { emoji, label }]) => (
          <div key={age} className="flex items-center gap-1 text-[10px] dark:text-zinc-500 text-zinc-400">
            <span>{emoji}</span>
            <span className="font-mono">{age}</span>
            <span className="dark:text-zinc-600 text-zinc-500">·</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Saturday Dot Grid ────────────────────────────────────────────
function SaturdayGrid({ result, intentions }: { result: SaturdayResult; intentions: Record<string, string> }) {
  const COLS = 52;
  const { all, lived, currentIdx, milestones } = result;
  const milestoneSet = new Set(milestones.map(m => m.n - 1));
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const padded = all.length % COLS === 0 ? all.length : all.length + (COLS - (all.length % COLS));
  const hoveredDate = hoveredIdx !== null && hoveredIdx < all.length ? all[hoveredIdx] : null;
  const hoveredNote = hoveredDate ? intentions[toDateKey(hoveredDate)] : undefined;
  const isMilestoneHovered = hoveredIdx !== null && milestoneSet.has(hoveredIdx);

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">
        Each dot is one Saturday · ringed = milestone · each row = one year
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-1">
        {[
          { bg: 'rgba(245,158,11,0.85)', border: 'none', label: 'Lived' },
          { bg: '#ffffff', border: 'none', label: 'This Saturday' },
          { bg: 'rgba(128,128,128,0.18)', border: '1px solid rgba(128,128,128,0.3)', label: 'Ahead' },
          { bg: 'rgba(245,158,11,0.85)', border: '2px solid #ffffff', label: 'Milestone' },
        ].map(({ bg, border, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--curio-text-muted)' }}>
            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: bg, border }} />
            {label}
          </span>
        ))}
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '2px' }}
        onMouseMove={(e) => {
          if (tooltipRef.current) {
            tooltipRef.current.style.top = `${e.clientY + 16}px`;
            tooltipRef.current.style.left = `${Math.min(e.clientX + 12, window.innerWidth - 224)}px`;
          }
          const el = (e.target as HTMLElement).closest<HTMLElement>('[data-idx]');
          const idx = el ? Number(el.dataset.idx) : null;
          setHoveredIdx(prev => prev === idx ? prev : idx);
        }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {Array.from({ length: padded }, (_, i) => {
          if (i >= all.length) return <div key={`pad-${i}`} style={{ aspectRatio: '1' }} />;
          const isLived = i < lived;
          const isCurrent = i === currentIdx;
          const isMilestone = milestoneSet.has(i);
          const isHovered = hoveredIdx === i;
          const hasNote = !!intentions[toDateKey(all[i])];
          return (
            <div key={i} data-idx={i}
              className={isCurrent && !isHovered ? 'sat-current-dot' : undefined}
              style={{
                aspectRatio: '1', borderRadius: '50%', cursor: 'default',
                background: isCurrent ? '#ffffff' : isLived ? 'rgba(245,158,11,0.85)' : 'rgba(128,128,128,0.13)',
                border: isMilestone
                  ? `2px solid ${isLived || isCurrent ? '#ffffff' : 'rgba(245,158,11,0.55)'}`
                  : isLived || isCurrent ? 'none' : '1px solid rgba(128,128,128,0.18)',
                boxShadow: isHovered
                  ? '0 0 0 2.5px #38bdf8, 0 0 0 8px rgba(56,189,248,0.5)'
                  : isCurrent && hasNote ? '0 0 0 2px rgba(245,158,11,0.9), 0 0 6px 3px rgba(255,255,255,0.4)'
                  : hasNote && isLived ? '0 0 0 2px rgba(255,255,255,0.6)' : undefined,
                transform: isHovered ? 'scale(1.4)' : undefined,
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                position: 'relative', zIndex: isHovered ? 10 : undefined,
              }} />
          );
        })}
      </div>
      <div ref={tooltipRef} style={{
        display: hoveredDate ? 'block' : 'none',
        position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none',
        background: 'rgba(10,12,18,0.96)', border: '1px solid rgba(56,189,248,0.35)',
        borderRadius: 10, padding: '8px 12px', maxWidth: 210,
        backdropFilter: 'blur(10px)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
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

// ── Milestone Cards ──────────────────────────────────────────────
function MilestonesSection({ result }: { result: SaturdayResult }) {
  const futureOnes = result.milestones.filter(m => !m.isPast);
  const visible = result.milestones.filter(m => m.isPast || futureOnes.indexOf(m) < 2);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--curio-text-muted)' }}>
        Milestone Saturdays
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visible.map(m => (
          <div key={m.n} className="rounded-xl px-3 py-3"
            style={{
              background: m.isPast ? 'var(--curio-surface)' : 'rgba(245,158,11,0.06)',
              border: m.isPast ? '1px solid var(--curio-border)' : '1px solid rgba(245,158,11,0.25)',
              opacity: m.isPast ? 1 : 0.85,
            }}>
            <div className="text-lg font-bold tabular-nums" style={{ color: m.isPast ? '#f59e0b' : 'var(--curio-text-muted)' }}>
              #{m.n.toLocaleString()}
            </div>
            <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--curio-text)' }}>{formatMonthYear(m.date)}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--curio-text-muted)' }}>
              {m.isPast ? 'passed' : m.weeksAway === 1 ? 'next week' : `in ${m.weeksAway.toLocaleString()} weeks`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Decade Breakdown ─────────────────────────────────────────────
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
              <span className="text-xs w-[72px] shrink-0 text-right" style={{ color: 'var(--curio-text-muted)' }}>{d.label}</span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(128,128,128,0.15)' }}>
                <div style={{
                  width: `${pctLived}%`, height: '100%', borderRadius: 9999,
                  background: fullyLived ? 'rgba(245,158,11,0.9)' : notStarted ? 'transparent' : 'linear-gradient(90deg, rgba(245,158,11,0.9) 0%, rgba(245,158,11,0.5) 100%)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span className="text-xs tabular-nums w-[60px] shrink-0"
                style={{ color: notStarted ? 'var(--curio-text-muted)' : 'var(--curio-text-secondary)' }}>
                {notStarted ? `0/${d.total}` : `${d.lived}/${d.total}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Saturdays View (full tab content) ────────────────────────────
function SaturdaysView({ birthday }: { birthday: Date }) {
  const [result, setResult] = useState<SaturdayResult | null>(null);
  const [intentions, setIntentions] = useState<Record<string, string>>({});
  const [intentionDraft, setIntentionDraft] = useState('');
  const [intentionSaved, setIntentionSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = computeSaturdays(birthday);
    setResult(r);
    const loaded: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('curio-sat-')) { const v = localStorage.getItem(k); if (v) loaded[k] = v; }
    }
    setIntentions(loaded);
    setIntentionDraft(localStorage.getItem(toDateKey(getThisSaturday())) ?? '');
  }, [birthday]);

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

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      if (isTouchDevice()) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'my-saturdays.png', { type: 'image/png' });
          await navigator.share({ files: [file], title: 'Life Calendar — Curio' });
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          const link = document.createElement('a'); link.download = 'my-saturdays.png'; link.href = dataUrl;
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }
      } else {
        const link = document.createElement('a'); link.download = 'my-saturdays.png'; link.href = dataUrl;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
    } catch { /* ignore */ } finally { setSaving(false); }
  }, []);

  if (!result) return null;
  const thisSaturday = getThisSaturday();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <div className="rounded-xl py-3 px-1.5" style={{ background: 'var(--curio-surface)' }}>
          <div className="text-xl sm:text-3xl font-bold tabular-nums" style={{ color: '#f59e0b' }}>{result.lived.toLocaleString()}</div>
          <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--curio-text-muted)' }}>Saturdays lived</div>
        </div>
        <div className="rounded-xl py-3 px-1.5" style={{ background: 'var(--curio-surface)' }}>
          <div className="text-xl sm:text-3xl font-bold tabular-nums" style={{ color: 'var(--curio-text-secondary)' }}>{result.remaining.toLocaleString()}</div>
          <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--curio-text-muted)' }}>remaining (to 80)</div>
        </div>
        <div className="rounded-xl py-3 px-1.5" style={{ background: 'var(--curio-surface)' }}>
          <div className="text-xl sm:text-3xl font-bold tabular-nums"
            style={{ color: result.nextMilestone ? 'var(--curio-text)' : 'var(--curio-text-muted)' }}>
            {result.nextMilestone ? `#${result.nextMilestone.n.toLocaleString()}` : '—'}
          </div>
          <div className="text-[10px] sm:text-xs mt-1 truncate" style={{ color: 'var(--curio-text-muted)' }}>
            {result.nextMilestone
              ? `next milestone · ${result.nextMilestone.weeksAway <= 1 ? 'next week' : `${result.nextMilestone.weeksAway.toLocaleString()} wks`}`
              : 'all milestones passed'}
          </div>
        </div>
      </div>

      <div ref={cardRef} className="space-y-5">
        <MilestonesSection result={result} />
        <DecadeBreakdown result={result} />
        <SaturdayGrid result={result} intentions={intentions} />

        {/* This Saturday — intention */}
        <div className="rounded-xl py-4 px-4 space-y-3" style={{ background: 'var(--curio-surface)' }}>
          <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold" style={{ color: 'var(--curio-text)' }}>
              This Saturday — <span style={{ color: '#f59e0b' }}>{formatShort(thisSaturday)}</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--curio-text-muted)' }}>
              {result.remaining < 500
                ? 'Every Saturday from here counts more than the last.'
                : "Not every Saturday needs to be epic. But it's worth deciding."}
            </p>
          </div>
          <div className="flex gap-2">
            <input type="text" value={intentionDraft}
              onChange={e => { setIntentionDraft(e.target.value); setIntentionSaved(false); }}
              onKeyDown={e => e.key === 'Enter' && handleSaveIntention()}
              placeholder="What will you do with this Saturday?" maxLength={120}
              className="sat-intention-input flex-1 rounded-lg px-3 py-2 text-xs"
              style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }} />
            <button onClick={handleSaveIntention}
              className="sat-save-btn px-3 py-2 rounded-lg text-xs font-semibold active:scale-95"
              style={{
                background: intentionSaved ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: intentionSaved ? '#22c55e' : '#f59e0b',
                border: `1px solid ${intentionSaved ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
              }}>
              {intentionSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
          <AnimatePresence>
            {intentionSaved && intentionDraft.trim() && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-center" style={{ color: '#22c55e' }}>
                Locked in: &ldquo;{intentionDraft.trim()}&rdquo;
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Save as image */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: '#fff' }}>
        {saving ? 'Preparing…' : 'Save as image'}
      </button>
    </motion.div>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────────
export function LifeCalendarApp() {
  const currentYear = new Date().getFullYear();
  const [tab, setTab] = useState<'weeks' | 'saturdays'>('weeks');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);

  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);

  // Derived
  const hasFullDate = month !== '' && day !== '' && year !== '';
  const birthYear = year ? parseInt(year) : currentYear - 30;
  const birthday = useMemo(() => {
    if (!hasFullDate) return null;
    const d = new Date(parseInt(year), parseInt(month), parseInt(day));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [hasFullDate, year, month, day]);

  const lifeExpectancy = LIFE_EXPECTANCY[country] ?? 73;
  const currentAge = currentYear - birthYear;
  const totalYears = Math.ceil(lifeExpectancy);
  const weeksLived = Math.max(0, Math.floor((currentYear - birthYear) * WEEKS_PER_YEAR));
  const totalWeeks = Math.floor(lifeExpectancy * WEEKS_PER_YEAR);

  const daysInMonth = month !== '' && year !== ''
    ? getDaysInMonth(parseInt(month), parseInt(year))
    : month !== ''
      ? getDaysInMonth(parseInt(month), 2000) // leap year as safe default
      : 31;
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const yearOptions = Array.from({ length: currentYear - BIRTH_YEAR_MIN + 1 }, (_, i) => currentYear - i);

  // Clamp day if it exceeds new daysInMonth (e.g. user picks Feb 29, then changes to non-leap year)
  useEffect(() => {
    if (day !== '' && parseInt(day) > daysInMonth) setDay('');
  }, [daysInMonth, day]);

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes satPulse {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(255,255,255,0.3); }
          50%       { box-shadow: 0 0 14px 7px rgba(255,255,255,0.85); }
        }
        .sat-current-dot { animation: satPulse 2.8s ease-in-out infinite; }
        .sat-intention-input:focus {
          outline: none;
          border-color: rgba(245,158,11,0.6) !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12), 0 0 10px rgba(245,158,11,0.1);
        }
        .sat-save-btn:hover:not(:disabled) {
          filter: brightness(1.12);
          box-shadow: 0 0 12px rgba(245,158,11,0.45);
        }
      ` }} />

      {/* Input row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Birthday</p>
          <div className="grid grid-cols-3 gap-2">
            <select value={month} onChange={e => { setMonth(e.target.value); setDay(''); }}
              className="rounded-xl px-2 py-2 text-sm outline-none"
              style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }}>
              <option value="">Mon</option>
              {MONTHS.map((m, i) => <option key={m} value={String(i)}>{m.slice(0, 3)}</option>)}
            </select>
            <select value={day} onChange={e => setDay(e.target.value)}
              className="rounded-xl px-2 py-2 text-sm outline-none"
              style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }}>
              <option value="">Day</option>
              {dayOptions.map(d => <option key={d} value={String(d)}>{d}</option>)}
            </select>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="rounded-xl px-2 py-2 text-sm outline-none"
              style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }}>
              <option value="">Year</option>
              {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Country</p>
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }}>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--curio-border)' }}>
        <TabButton active={tab === 'weeks'} label="Weeks" onClick={() => setTab('weeks')} />
        <TabButton active={tab === 'saturdays'} label="Saturdays" onClick={() => setTab('saturdays')} />
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'weeks' ? (
          <motion.div key="weeks" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <WeeksGrid
              weeksLived={weeksLived} totalWeeks={totalWeeks}
              totalYears={totalYears} birthYear={birthYear} currentAge={currentAge} />
          </motion.div>
        ) : (
          <motion.div key="saturdays" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
            {hasFullDate && birthday ? (
              <SaturdaysView birthday={birthday} />
            ) : (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: 'var(--curio-text-muted)' }}>
                  Enter your full birthday above to see your Saturdays.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
