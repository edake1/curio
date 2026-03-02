'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LIFE_EXPECTANCY, DEFAULT_COUNTRY_STATS, DEFAULT_COUNTRY,
  DEFAULT_BIRTH_YEAR, BIRTH_YEAR_MIN, BIRTH_YEAR_MAX, WEEKS_PER_YEAR,
} from '@/data/countries';

// ─────────────────────────────────────────────────────────────────
// TREE RINGS — concentric circles, 1 ring = 1 year, filled by
// strokeDasharray. No spokes, no spiral. Everything at a glance.
// ─────────────────────────────────────────────────────────────────

const ACCENT      = '#818cf8';
const VBOX        = 560;
const CX          = VBOX / 2;   // 280
const CY          = VBOX / 2;   // 280
const R_MIN       = 16;
const R_MAX       = 268;
const WEEKS_PER_RING = 52;

const MILESTONES: Record<number, { emoji: string; label: string }> = {
  5:  { emoji: '🎒', label: 'School'     },
  13: { emoji: '🧒', label: 'Teenage'    },
  18: { emoji: '🎓', label: 'Adult'      },
  30: { emoji: '✨', label: 'Thirties'   },
  40: { emoji: '🔥', label: 'Forties'    },
  50: { emoji: '👑', label: 'Fifty'      },
  65: { emoji: '🏖️', label: 'Retirement'},
};

// Sorted milestone ages — used to assign evenly-spaced clock positions
const MILESTONE_AGES = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b);

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

// ── BirthYearInput ────────────────────────────────────────────────
function BirthYearInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw]         = useState(String(value));
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Birth Year</p>
      <motion.label
        animate={{
          boxShadow: focused
            ? `0 0 0 1.5px ${ACCENT}55, 0 0 18px ${ACCENT}22`
            : '0 0 0 1px rgba(255,255,255,0)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-2xl cursor-text
          dark:bg-white/[0.05] bg-black/[0.04]
          border dark:border-white/[0.08] border-black/[0.08]"
      >
        <span className="text-base select-none">🗓️</span>
        <input
          type="text" inputMode="numeric"
          value={focused ? raw : String(value)}
          onFocus={() => { setFocused(true); setRaw(String(value)); }}
          onBlur={() => {
            setFocused(false);
            const v = parseInt(raw, 10);
            if (!isNaN(v) && v >= BIRTH_YEAR_MIN && v <= BIRTH_YEAR_MAX) onChange(v);
            else setRaw(String(value));
          }}
          onChange={e => setRaw(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => {
            if (e.key === 'Enter')     (e.target as HTMLInputElement).blur();
            if (e.key === 'ArrowUp')   { e.preventDefault(); onChange(Math.min(BIRTH_YEAR_MAX, value + 1)); }
            if (e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(BIRTH_YEAR_MIN, value - 1)); }
          }}
          className="text-[1.6rem] font-bold tabular-nums bg-transparent outline-none w-[4.5rem]
            transition-colors duration-200 dark:text-white text-zinc-900
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none"
          style={{ color: focused ? ACCENT : undefined }}
        />
      </motion.label>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export function LifeCalendarApp() {
  const [birthYear,     setBirthYear]     = useState(DEFAULT_BIRTH_YEAR);
  const [country,       setCountry]       = useState(DEFAULT_COUNTRY);
  const [hoveredYear,   setHoveredYear]   = useState<number | null>(null);
  const [mousePos,      setMousePos]      = useState({ x: 0, y: 0 });
  const [hoveredMs,     setHoveredMs]     = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const lifeExpectancy = LIFE_EXPECTANCY[country] ?? DEFAULT_COUNTRY_STATS.lifeExpectancy;
  const currentYear    = new Date().getFullYear();
  const weeksLived     = Math.max(0, Math.floor((currentYear - birthYear) * WEEKS_PER_YEAR));
  const totalWeeks     = Math.floor(lifeExpectancy * WEEKS_PER_YEAR);
  const weeksLeft      = Math.max(0, totalWeeks - weeksLived);
  const pct            = Math.min(100, Math.max(0, (weeksLived / totalWeeks) * 100));
  const currentAge     = currentYear - birthYear;
  const totalYears     = Math.ceil(lifeExpectancy);

  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);

  // Ring geometry
  const ringSpacing = (R_MAX - R_MIN) / Math.max(totalYears - 1, 1);
  const ringThick   = Math.max(1.2, ringSpacing * 0.68);

  // Per-year data
  const rings = useMemo(() => {
    return Array.from({ length: totalYears }, (_, yr) => {
      const yearStartWeek  = yr * WEEKS_PER_RING;
      const yearEndWeek    = yearStartWeek + WEEKS_PER_RING;
      const weeksIn        = Math.min(WEEKS_PER_RING, Math.max(0, weeksLived - yearStartWeek));
      const fillFraction   = weeksIn / WEEKS_PER_RING;
      const isCurrent      = weeksLived >= yearStartWeek && weeksLived < yearEndWeek;
      const isPast         = weeksLived >= yearEndWeek;
      const centerR        = R_MIN + yr * ringSpacing;
      const circumference  = 2 * Math.PI * centerR;
      const color          = getPhaseColor(yr, totalYears);
      const phase          = getPhaseName(yr, totalYears);
      const dotAngle       = -Math.PI / 2 + (weeksIn / WEEKS_PER_RING) * 2 * Math.PI;
      const dotX           = CX + centerR * Math.cos(dotAngle);
      const dotY           = CY + centerR * Math.sin(dotAngle);
      return { yr, centerR, circumference, fillFraction, isCurrent, isPast, color, phase, dotX, dotY };
    });
  }, [totalYears, weeksLived, ringSpacing]);

  // Decade guide rings — for subtle visual anchors every 10 years
  const decadeRings = useMemo(() =>
    Array.from({ length: Math.floor(totalYears / 10) }, (_, i) => {
      const yr = (i + 1) * 10;
      if (yr >= totalYears) return null;
      const centerR = R_MIN + yr * ringSpacing;
      // Label position: 3 o'clock (angle = 0)
      const labelAngle = -Math.PI / 2 + Math.PI / 10; // ~72° from top, just right of the ring
      const labelR     = centerR + ringThick / 2 + 5;
      return {
        yr,
        centerR,
        lx: CX + labelR * Math.cos(labelAngle),
        ly: CY + labelR * Math.sin(labelAngle),
      };
    }).filter(Boolean) as { yr: number; centerR: number; lx: number; ly: number }[],
  [totalYears, ringSpacing, ringThick]);

  // Milestone markers — distributed evenly around clock face (not all at 12 o'clock)
  const milestoneMarkers = useMemo(() => {
    const n = MILESTONE_AGES.length;
    return MILESTONE_AGES.flatMap((age, idx) => {
      if (age >= totalYears) return [];
      const centerR   = R_MIN + age * ringSpacing;
      // Spread milestones evenly around the circle, starting from 12 o'clock
      const angle     = -Math.PI / 2 + (idx / n) * 2 * Math.PI;
      const innerR    = centerR - ringThick / 2 - 1;
      const outerR    = centerR + ringThick / 2 + 8;
      const calloutR  = centerR + ringThick / 2 + 22;
      const labelR    = centerR + ringThick / 2 + 38;
      const cos       = Math.cos(angle);
      const ms        = MILESTONES[age];
      return [{
        age,
        emoji:     ms.emoji,
        label:     ms.label,
        angle,
        // Tick endpoints
        ix: CX + innerR   * Math.cos(angle),
        iy: CY + innerR   * Math.sin(angle),
        ox: CX + outerR   * Math.cos(angle),
        oy: CY + outerR   * Math.sin(angle),
        // Emoji callout position
        ex: CX + calloutR * Math.cos(angle),
        ey: CY + calloutR * Math.sin(angle),
        // Text label position (further out)
        lx: CX + labelR   * Math.cos(angle),
        ly: CY + labelR   * Math.sin(angle),
        anchor: (cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle') as 'start' | 'end' | 'middle',
      }];
    });
  }, [totalYears, ringSpacing, ringThick]);

  // Phase boundary dashed rings (25/50/75%)
  const phaseBoundaries = useMemo(() =>
    [0.25, 0.50, 0.75].map(p => {
      const yr = Math.round(p * totalYears);
      return R_MIN + yr * ringSpacing;
    }),
  [totalYears, ringSpacing]);

  // Hover via polar math
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx  = ((e.clientX - rect.left) / rect.width)  * VBOX;
    const my  = ((e.clientY - rect.top)  / rect.height) * VBOX;
    const r   = Math.sqrt((mx - CX) ** 2 + (my - CY) ** 2);

    if (r < R_MIN - ringThick || r > R_MAX + ringThick) {
      setHoveredYear(null);
      return;
    }
    const yr = Math.min(totalYears - 1, Math.max(0, Math.round((r - R_MIN) / ringSpacing)));
    setHoveredYear(yr);
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [totalYears, ringSpacing, ringThick]);

  const hy = hoveredYear !== null ? rings[hoveredYear] : null;
  const hovered = hy ? {
    yr:        hy.yr,
    age:       hy.yr,
    calYear:   birthYear + hy.yr,
    phase:     hy.phase,
    color:     hy.color,
    fillPct:   hy.fillFraction,
    isCurrent: hy.isCurrent,
    isPast:    hy.isPast,
    centerR:   hy.centerR,
    ms:        MILESTONES[hy.yr],
  } : null;

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <BirthYearInput value={birthYear} onChange={setBirthYear} />
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Country</p>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="bg-transparent outline-none text-[13px] font-semibold dark:text-white text-zinc-900
              cursor-pointer rounded-2xl px-3 pr-8 py-2
              dark:bg-white/[0.05] bg-black/[0.04]
              border dark:border-white/[0.08] border-black/[0.08]
              [color-scheme:dark]"
          >
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Hero card */}
      <div
        className="rounded-2xl border dark:border-white/[0.07] border-black/[0.09] p-4 sm:p-5"
        style={{ background: `linear-gradient(135deg, ${ACCENT}0d 0%, transparent 55%)` }}
      >
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
        <div className="relative h-1.5 rounded-full dark:bg-white/[0.06] bg-black/[0.07] mt-4 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4, #f59e0b, #f87171)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Tree rings */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2">
          Every ring is one year · filled clockwise from the top · hover to explore
        </p>

        <div className="relative rounded-2xl border dark:border-white/[0.07] border-black/[0.09]
          dark:bg-[#09090f] bg-zinc-50 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VBOX} ${VBOX}`}
            className="w-full cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredYear(null)}
          >
            {/* ── Layer 0: dim background rings (all years) ── */}
            {rings.map(({ yr, centerR }) => (
              <circle key={`bg-${yr}`}
                cx={CX} cy={CY} r={centerR}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={ringThick}
              />
            ))}

            {/* ── Layer 1: decade guide rings (slightly brighter) ── */}
            {decadeRings.map(({ yr, centerR }) => (
              <circle key={`dec-${yr}`}
                cx={CX} cy={CY} r={centerR}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={0.5}
              />
            ))}

            {/* ── Layer 2: phase boundary dashed rings (25/50/75%) ── */}
            {phaseBoundaries.map((r, i) => (
              <circle key={`pb-${i}`}
                cx={CX} cy={CY} r={r}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={0.6}
                strokeDasharray="3 5"
              />
            ))}

            {/* ── Layer 3: filled lived arcs ── */}
            {rings.filter(r => r.fillFraction > 0 && !r.isCurrent).map(({ yr, centerR, circumference, fillFraction, color }) => (
              <motion.circle key={`fill-${yr}`}
                cx={CX} cy={CY} r={centerR}
                fill="none"
                stroke={color}
                strokeWidth={ringThick}
                strokeDasharray={`${fillFraction * circumference} ${circumference}`}
                strokeLinecap="butt"
                transform={`rotate(-90 ${CX} ${CY})`}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${fillFraction * circumference} ${circumference}` }}
                transition={{ duration: 0.5, delay: yr * 0.005, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}

            {/* ── Layer 4: current year ring (brighter, prominent glow) ── */}
            {rings.filter(r => r.isCurrent).map(({ yr, centerR, circumference, fillFraction, color, dotX, dotY }) => (
              <g key={`cur-${yr}`}>
                {/* Wide glow halo */}
                <motion.circle
                  cx={CX} cy={CY} r={centerR}
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth={ringThick * 3.5}
                  animate={{ opacity: [0, 0.28, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Lived arc — thicker */}
                <motion.circle
                  cx={CX} cy={CY} r={centerR}
                  fill="none"
                  stroke={color}
                  strokeWidth={ringThick * 1.6}
                  strokeDasharray={`${fillFraction * circumference} ${circumference}`}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${CX} ${CY})`}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${fillFraction * circumference} ${circumference}` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* Bright outline ring */}
                <circle
                  cx={CX} cy={CY} r={centerR}
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth={0.8}
                  opacity={0.6}
                />
                {/* Current week dot — pulsing */}
                <circle cx={dotX} cy={dotY} r={ringThick * 1.2} fill={ACCENT} opacity={0.3}>
                  <animate attributeName="r"
                    values={`${ringThick * 1.2};${ringThick * 3.2};${ringThick * 1.2}`}
                    dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={dotX} cy={dotY} r={ringThick * 0.9} fill="#ffffff" />
              </g>
            ))}

            {/* ── Layer 5: milestone markers (evenly distributed around clock) ── */}
            {milestoneMarkers.map(({ age, emoji, label, ix, iy, ox, oy, ex, ey, lx, ly, anchor }) => {
              const isHovered = hoveredMs === age;
              return (
                <g key={`ms-${age}`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => {
                    setHoveredMs(age);
                    setHoveredYear(age);
                    const rect = svgRef.current?.getBoundingClientRect();
                    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                  onMouseLeave={() => { setHoveredMs(null); setHoveredYear(null); }}
                >
                  {/* Invisible hit-area circle around emoji */}
                  <circle cx={ex} cy={ey} r={14} fill="transparent" />
                  {/* Highlight ring on hover */}
                  {isHovered && (
                    <circle cx={CX} cy={CY} r={R_MIN + age * ringSpacing}
                      fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={ringThick * 1.2} />
                  )}
                  {/* Tick line through ring */}
                  <line x1={ix} y1={iy} x2={ox} y2={oy}
                    stroke={isHovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={isHovered ? '1.3' : '0.9'} />
                  {/* Callout stem */}
                  <line x1={ox} y1={oy} x2={ex} y2={ey}
                    stroke={isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.14)'}
                    strokeWidth="0.7" strokeDasharray="2 2" />
                  {/* Emoji */}
                  <text x={ex} y={ey}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={isHovered ? '13' : '11'}
                    opacity={isHovered ? 1 : 0.85}>
                    {emoji}
                  </text>
                  {/* Age + label text */}
                  <text x={lx} y={ly - 4}
                    textAnchor={anchor} dominantBaseline="middle"
                    fontSize="5.8"
                    fill={isHovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)'}
                    fontFamily="ui-monospace, monospace"
                    fontWeight="600"
                  >
                    {age}
                  </text>
                  <text x={lx} y={ly + 4}
                    textAnchor={anchor} dominantBaseline="middle"
                    fontSize="5.5"
                    fill={isHovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)'}
                    fontFamily="ui-sans-serif, sans-serif"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* ── Layer 6: decade age labels ── */}
            {decadeRings.map(({ yr, lx, ly }) => (
              <text key={`dlabel-${yr}`}
                x={lx} y={ly}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="6.5"
                fill="rgba(255,255,255,0.28)"
                fontFamily="ui-monospace, monospace"
                fontWeight="600"
              >
                {yr}
              </text>
            ))}

            {/* ── Layer 7: hover radial clock-hand ── */}
            {hoveredYear !== null && rings[hoveredYear] && (() => {
              const ring = rings[hoveredYear];
              const endX = CX + ring.centerR * Math.cos(-Math.PI / 2);
              const endY = CY + ring.centerR * Math.sin(-Math.PI / 2);
              return (
                <line
                  x1={CX} y1={CY} x2={endX} y2={endY}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                />
              );
            })()}

            {/* ── Layer 8: hovered ring highlight ── */}
            {hoveredYear !== null && (() => {
              const ring = rings[hoveredYear];
              return ring ? (
                <circle
                  cx={CX} cy={CY} r={ring.centerR}
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={ring.isCurrent ? ringThick * 1.7 : ringThick * 1.2}
                />
              ) : null;
            })()}

            {/* ── Center: current age ── */}
            <text x={CX} y={CY - 4}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8.5"
              fill={ACCENT}
              fontFamily="ui-monospace, monospace"
              fontWeight="700"
            >
              {currentAge > 0 ? currentAge : ''}
            </text>
            <text x={CX} y={CY + 6}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="4.5"
              fill="rgba(255,255,255,0.22)"
              fontFamily="ui-monospace, monospace"
            >
              {currentAge > 0 ? 'yrs' : 'birth'}
            </text>
          </svg>

          {/* Floating tooltip */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                key={hovered.yr}
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.1 }}
                className="absolute pointer-events-none z-50 px-3 py-2.5 rounded-xl border text-left min-w-[130px]"
                style={{
                  left: Math.min(mousePos.x + 14, 360),
                  top:  Math.max(mousePos.y - 80, 8),
                  borderColor: `${hovered.color}50`,
                  background: `color-mix(in srgb, ${hovered.color} 12%, rgba(10,10,20,0.95))`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p className="text-[12px] font-bold leading-none" style={{ color: hovered.color }}>
                  {hovered.ms ? `${hovered.ms.emoji} ` : ''}Age {hovered.age}
                </p>
                <p className="text-[10px] dark:text-zinc-400 text-zinc-500 mt-1">{hovered.calYear}</p>
                <p className="text-[10px] mt-0.5 font-medium" style={{ color: hovered.color }}>{hovered.phase}</p>
                {hovered.isCurrent && (
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {Math.round(hovered.fillPct * 52)} / 52 weeks — current
                  </p>
                )}
                {hovered.isPast && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">completed</p>
                )}
                {!hovered.isPast && !hovered.isCurrent && (
                  <p className="text-[10px] text-zinc-600 mt-0.5">not yet lived</p>
                )}
                {hovered.ms && (
                  <p className="text-[10px] font-semibold mt-1" style={{ color: hovered.color }}>{hovered.ms.label}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 justify-center">
          {([
            { color: '#10b981', label: 'Youth (0–25%)' },
            { color: '#06b6d4', label: 'Young adult (25–50%)' },
            { color: '#f59e0b', label: 'Middle age (50–75%)' },
            { color: '#f87171', label: 'Later years (75–100%)' },
            { color: 'rgba(255,255,255,0.07)', label: 'Future', border: true },
            { color: '#ffffff',  label: 'You, right now' },
          ] as { color: string; label: string; border?: boolean }[]).map(({ color, label, border }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color, border: border ? '1px solid rgba(255,255,255,0.15)' : undefined }}
              />
              <span className="text-[10px] dark:text-zinc-500 text-zinc-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Milestone strip */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
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

    </div>
  );
}
