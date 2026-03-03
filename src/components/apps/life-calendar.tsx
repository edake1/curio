'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LIFE_EXPECTANCY, DEFAULT_COUNTRY,
  BIRTH_YEAR_MIN, WEEKS_PER_YEAR,
} from '@/data/countries';

// ─────────────────────────────────────────────────────────────────
// THE HOURGLASS — your life, draining in real-time
// Canvas-based · minimal DOM · contemplative
// ─────────────────────────────────────────────────────────────────

const ACCENT = '#c9a95c';         // warm gold
const GLASS_STROKE = '#484335';   // muted frame
const SAND_TOP = '#e8c872';       // bright sand (future)
const SAND_BOT = '#a68b4b';       // darker sand (past)
const SAND_FALL = '#f0d98c';      // falling grain

// Milestones shown on the hourglass
const MILESTONES: { age: number; label: string; emoji: string }[] = [
  { age: 5,  label: 'First day of school', emoji: '🎒' },
  { age: 13, label: 'Became a teenager', emoji: '🔥' },
  { age: 18, label: 'Adulthood', emoji: '🎓' },
  { age: 25, label: 'Quarter-century', emoji: '✨' },
  { age: 30, label: 'Thirties', emoji: '🚀' },
  { age: 40, label: 'Forties', emoji: '💎' },
  { age: 50, label: 'Half-century', emoji: '👑' },
  { age: 60, label: 'Sixties', emoji: '🌅' },
  { age: 65, label: 'Retirement', emoji: '🏖️' },
  { age: 75, label: 'Seventy-five', emoji: '🕊️' },
];

interface Grain {
  x: number;
  y: number;
  vy: number;
  size: number;
  opacity: number;
  settled: boolean;
}

// Draw the hourglass silhouette path
function drawHourglassPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  const hw = w / 2;
  const hh = h / 2;
  const neck = w * 0.06;  // narrow neck
  const curve = h * 0.38; // bezier control offset

  ctx.beginPath();
  // Top-left → neck-left
  ctx.moveTo(cx - hw, cy - hh);
  ctx.bezierCurveTo(cx - hw, cy - hh + curve, cx - neck, cy - neck * 0.8, cx - neck, cy);
  // neck-left → bottom-left
  ctx.bezierCurveTo(cx - neck, cy + neck * 0.8, cx - hw, cy + hh - curve, cx - hw, cy + hh);
  // Bottom edge
  ctx.lineTo(cx + hw, cy + hh);
  // Bottom-right → neck-right
  ctx.bezierCurveTo(cx + hw, cy + hh - curve, cx + neck, cy + neck * 0.8, cx + neck, cy);
  // neck-right → top-right
  ctx.bezierCurveTo(cx + neck, cy - neck * 0.8, cx + hw, cy - hh + curve, cx + hw, cy - hh);
  // Top edge
  ctx.lineTo(cx - hw, cy - hh);
  ctx.closePath();
}

// Get the width of the hourglass at a given y position (normalised 0=top, 1=bottom)
function hourglassWidthAt(t: number, hw: number, neck: number): number {
  // Simple approximation: wide at top/bottom, narrow at middle
  const mid = 0.5;
  const dist = Math.abs(t - mid);
  // Cubic ease — fast narrowing near middle
  const spread = Math.pow(dist * 2, 1.6);
  return neck + (hw - neck) * spread;
}

// ── Canvas Hourglass component ───────────────────────────────────
function HourglassCanvas({
  pctLived,
  weeksLived,
  totalWeeks,
}: {
  pctLived: number;
  weeksLived: number;
  totalWeeks: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grainsRef = useRef<Grain[]>([]);
  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width * dpr;
    const H = rect.height * dpr;
    canvas.width = W;
    canvas.height = H;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    const cx = w / 2;
    const cy = h / 2;
    const glassW = Math.min(w * 0.55, 220);
    const glassH = Math.min(h * 0.82, 420);
    const hw = glassW / 2;
    const neck = glassW * 0.06;

    ctx.clearRect(0, 0, w, h);

    // --- Draw glass outline ---
    ctx.save();
    drawHourglassPath(ctx, cx, cy, glassW, glassH);
    ctx.strokeStyle = GLASS_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Clip to hourglass for sand fill
    ctx.clip();

    // --- Sand in top bulb (future — drains) ---
    const topFill = Math.max(0, 1 - pctLived);  // fraction of top still full
    const topBase = cy - glassH / 2;
    const topHeight = (glassH / 2 - 4) * topFill;
    const topSandY = cy - 4 - topHeight;  // sand surface

    if (topFill > 0.005) {
      const grad1 = ctx.createLinearGradient(cx, topSandY, cx, cy - 4);
      grad1.addColorStop(0, SAND_TOP);
      grad1.addColorStop(1, '#d4b85e');
      ctx.fillStyle = grad1;
      ctx.fillRect(cx - hw - 2, topSandY, glassW + 4, topHeight + 4);
    }

    // --- Sand in bottom bulb (past — accumulates) ---
    const botFill = Math.min(1, pctLived);
    const botBase = cy + glassH / 2;
    const botHeight = (glassH / 2 - 4) * botFill;
    const botSandY = botBase - botHeight;

    if (botFill > 0.005) {
      const grad2 = ctx.createLinearGradient(cx, botSandY, cx, botBase);
      grad2.addColorStop(0, '#c9a95c');
      grad2.addColorStop(1, SAND_BOT);
      ctx.fillStyle = grad2;
      ctx.fillRect(cx - hw - 2, botSandY, glassW + 4, botHeight + 4);
    }

    // --- Falling grains through the neck ---
    const now = Date.now();
    const grains = grainsRef.current;

    // Spawn new grains
    if (now - lastSpawnRef.current > 120 && topFill > 0.005) {
      lastSpawnRef.current = now;
      const count = Math.random() < 0.3 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        grains.push({
          x: cx + (Math.random() - 0.5) * neck * 1.2,
          y: cy - 2,
          vy: 0.6 + Math.random() * 0.8,
          size: 1.2 + Math.random() * 1.2,
          opacity: 0.7 + Math.random() * 0.3,
          settled: false,
        });
      }
    }

    // Update & draw grains
    for (let i = grains.length - 1; i >= 0; i--) {
      const g = grains[i];
      g.y += g.vy;
      g.vy += 0.04; // gravity

      // Remove if settled into bottom sand or out of bounds
      if (g.y > botSandY - 2 || g.y > cy + glassH / 2) {
        grains.splice(i, 1);
        continue;
      }

      // Constrain x to hourglass width at current y
      const t = (g.y - (cy - glassH / 2)) / glassH;
      const maxX = hourglassWidthAt(t, hw, neck) * 0.85;
      g.x = Math.max(cx - maxX, Math.min(cx + maxX, g.x));

      ctx.fillStyle = SAND_FALL;
      ctx.globalAlpha = g.opacity;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // --- Redraw glass outline on top ---
    drawHourglassPath(ctx, cx, cy, glassW, glassH);
    ctx.strokeStyle = GLASS_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Top & bottom caps ---
    const capW = glassW * 0.7;
    const capH = 6;
    ctx.fillStyle = GLASS_STROKE;
    // Top cap
    ctx.beginPath();
    ctx.roundRect(cx - capW / 2, cy - glassH / 2 - capH, capW, capH, 3);
    ctx.fill();
    // Bottom cap
    ctx.beginPath();
    ctx.roundRect(cx - capW / 2, cy + glassH / 2, capW, capH, 3);
    ctx.fill();

    // --- Center glow at neck ---
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, neck * 4);
    glow.addColorStop(0, 'rgba(232,200,114,0.12)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - neck * 4, cy - neck * 4, neck * 8, neck * 8);

    frameRef.current = requestAnimationFrame(draw);
  }, [pctLived]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: 420, maxHeight: '55vh' }}
    />
  );
}


// ── Stat Pill ────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center min-w-0">
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-0.5">{label}</p>
      <p className="text-[1.2rem] sm:text-[1.6rem] font-black tabular-nums leading-none" style={{ color }}>{value}</p>
    </div>
  );
}

// ── Milestone timeline ───────────────────────────────────────────
function MilestoneTimeline({ currentAge, lifeExpectancy }: { currentAge: number; lifeExpectancy: number }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2">
        Milestones
      </p>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-0 bottom-0 w-px dark:bg-white/[0.06] bg-black/[0.06]" />
        <div className="space-y-1">
          {MILESTONES.filter(m => m.age <= Math.ceil(lifeExpectancy)).map((m) => {
            const isPast = m.age <= currentAge;
            const isCurrent = m.age === Math.floor(currentAge / 5) * 5 || (currentAge >= m.age && currentAge < m.age + 5);
            return (
              <div key={m.age} className="flex items-center gap-3 pl-0">
                {/* Dot */}
                <div
                  className="w-[15px] h-[15px] rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{
                    background: isPast ? ACCENT : 'var(--curio-bg, #1a1a1a)',
                    border: isPast ? 'none' : `1.5px solid ${GLASS_STROKE}`,
                    boxShadow: isCurrent ? `0 0 8px ${ACCENT}80` : undefined,
                  }}
                >
                  {isPast && <span className="text-[8px]">✓</span>}
                </div>
                {/* Label */}
                <div className="flex items-center gap-2 py-1">
                  <span className="text-sm">{m.emoji}</span>
                  <span
                    className="text-[12px] font-medium"
                    style={{
                      color: isPast
                        ? 'var(--curio-text, #e8e0d4)'
                        : 'var(--curio-text-muted, rgba(255,255,255,0.35))',
                      opacity: isPast ? 1 : 0.5,
                    }}
                  >
                    {m.label}
                  </span>
                  <span className="text-[10px] font-mono dark:text-zinc-600 text-zinc-400">{m.age}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Reflection prompt ────────────────────────────────────────────
const REFLECTIONS = [
  "What would you do if you could see all your remaining weeks?",
  "Which decade would you relive if you could?",
  "What's the one thing you keep postponing?",
  "If your life were a book, what chapter are you in?",
  "What would your 80-year-old self tell you right now?",
  "What are you saving for a 'someday' that may never come?",
  "If you had half the time left, what would you change today?",
];

// ── MAIN EXPORT ──────────────────────────────────────────────────
export function LifeCalendarApp() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [showMilestones, setShowMilestones] = useState(false);

  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);
  const yearOptions = useMemo(() =>
    Array.from({ length: currentYear - BIRTH_YEAR_MIN + 1 }, (_, i) => currentYear - i),
    [currentYear],
  );

  const birthYear = year ? parseInt(year) : currentYear - 30;
  const lifeExpectancy = LIFE_EXPECTANCY[country] ?? 73;
  const currentAge = currentYear - birthYear;
  const totalWeeks = Math.floor(lifeExpectancy * WEEKS_PER_YEAR);
  const weeksLived = Math.max(0, Math.floor(currentAge * WEEKS_PER_YEAR));
  const weeksLeft = Math.max(0, totalWeeks - weeksLived);
  const pctLived = Math.min(1, Math.max(0, weeksLived / totalWeeks));
  const daysLived = Math.floor(currentAge * 365.25);
  const daysLeft = Math.max(0, Math.floor((lifeExpectancy - currentAge) * 365.25));

  // Daily reflection — deterministic per day
  const reflection = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(currentYear, 0, 1).getTime()) / 86400000);
    return REFLECTIONS[dayOfYear % REFLECTIONS.length];
  }, [currentYear]);

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-6">

      {/* ── Inputs ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Birth Year</p>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }}
          >
            <option value="">Year</option>
            {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-1.5">Country</p>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: '1px solid var(--curio-border)' }}
          >
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── The Hourglass ── */}
      <div className="relative">
        <HourglassCanvas pctLived={pctLived} weeksLived={weeksLived} totalWeeks={totalWeeks} />

        {/* Overlay stats on left & right of hourglass */}
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-1 sm:px-4">
          <div className="space-y-6 text-center">
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">Weeks</p>
              <p className="text-[9px] uppercase tracking-widest dark:text-zinc-600 text-zinc-400">lived</p>
              <p className="text-[1.1rem] sm:text-[1.4rem] font-black tabular-nums leading-none text-emerald-400 mt-0.5">{weeksLived.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">Days</p>
              <p className="text-[9px] uppercase tracking-widest dark:text-zinc-600 text-zinc-400">lived</p>
              <p className="text-[1rem] sm:text-[1.2rem] font-bold tabular-nums leading-none dark:text-zinc-400 text-zinc-500 mt-0.5">{daysLived.toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-6 text-center">
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">Weeks</p>
              <p className="text-[9px] uppercase tracking-widest dark:text-zinc-600 text-zinc-400">left</p>
              <p className="text-[1.1rem] sm:text-[1.4rem] font-black tabular-nums leading-none text-rose-400 mt-0.5">{weeksLeft.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500">Days</p>
              <p className="text-[9px] uppercase tracking-widest dark:text-zinc-600 text-zinc-400">left</p>
              <p className="text-[1rem] sm:text-[1.2rem] font-bold tabular-nums leading-none dark:text-zinc-400 text-zinc-500 mt-0.5">{daysLeft.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] dark:text-zinc-500 text-zinc-400">Born</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: ACCENT }}>{(pctLived * 100).toFixed(1)}% used</span>
          <span className="text-[10px] dark:text-zinc-500 text-zinc-400">~{Math.round(lifeExpectancy)}</span>
        </div>
        <div className="relative h-2 rounded-full dark:bg-white/[0.06] bg-black/[0.07] overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: `linear-gradient(90deg, ${SAND_BOT}, ${ACCENT}, ${SAND_TOP})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pctLived * 100}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* ── Core stats ── */}
      <div className="flex justify-around gap-4">
        <Stat label="Age" value={String(currentAge)} color={ACCENT} />
        <Stat label="Expected" value={`~${Math.round(lifeExpectancy)}`} color="var(--curio-text-muted, rgba(255,255,255,0.5))" />
        <Stat label="Remaining" value={`~${Math.max(0, Math.round(lifeExpectancy - currentAge))}`} color="#f87171" />
      </div>

      {/* ── Reflection ── */}
      <div
        className="rounded-2xl border dark:border-white/[0.05] border-black/[0.06] p-4 sm:p-5 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(201,169,92,0.05) 0%, transparent 60%)' }}
      >
        <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-600 text-zinc-400 mb-2">Daily Reflection</p>
        <p className="text-[14px] sm:text-[15px] italic dark:text-zinc-300 text-zinc-600 leading-relaxed">
          &ldquo;{reflection}&rdquo;
        </p>
      </div>

      {/* ── Milestones toggle ── */}
      <div>
        <button
          onClick={() => setShowMilestones(p => !p)}
          className="text-[11px] font-medium tracking-wide px-4 py-2 rounded-full transition-all"
          style={{
            color: showMilestones ? ACCENT : 'var(--curio-text-muted, rgba(255,255,255,0.4))',
            background: showMilestones ? `${ACCENT}15` : 'transparent',
            border: `1px solid ${showMilestones ? `${ACCENT}30` : 'var(--curio-border, rgba(255,255,255,0.08))'}`,
          }}
        >
          {showMilestones ? 'Hide Milestones' : 'Show Milestones'}
        </button>
        <AnimatePresence>
          {showMilestones && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              <MilestoneTimeline currentAge={currentAge} lifeExpectancy={lifeExpectancy} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Quiet footer ── */}
      <div className="text-center pt-2 pb-4">
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400">
          Every grain is a moment. You can&apos;t get them back.
        </p>
      </div>
    </div>
  );
}
