'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LIFE_EXPECTANCY, DEFAULT_COUNTRY,
  BIRTH_YEAR_MIN, WEEKS_PER_YEAR,
} from '@/data/countries';

// ─────────────────────────────────────────────────────────────────
// THE HOURGLASS — your life, draining in real-time
// Canvas-based · grain texture · ambient dust · contemplative
// ─────────────────────────────────────────────────────────────────

const ACCENT = '#c9a95c';
const GLASS_STROKE = '#484335';
const SAND_TOP = '#e8c872';
const SAND_BOT = '#a68b4b';
const SAND_FALL = '#f0d98c';
const GRAIN_SHADOW = '#8b7434';
const GRAIN_LIGHT = '#f5e6a3';

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

// ── Types ────────────────────────────────────────────────────────

interface Grain {
  x: number; y: number;
  vy: number; vx: number;
  size: number; opacity: number;
  settled: boolean;
}

interface StaticGrain {
  xPct: number; yPct: number;
  size: number; opacity: number;
  colorIdx: number;
}

interface DustMote {
  baseX: number; baseY: number;
  size: number; opacity: number;
  speed: number; phase: number;
}

// ── Deterministic random for consistent grain placement ──────────

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateStaticGrains(count: number, seed: number): StaticGrain[] {
  const rng = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    xPct: rng(), yPct: rng(),
    size: 0.6 + rng() * 1.4,
    opacity: 0.25 + rng() * 0.45,
    colorIdx: Math.floor(rng() * 3),
  }));
}

const TOP_GRAINS = generateStaticGrains(220, 42);
const BOT_GRAINS = generateStaticGrains(220, 137);
const GRAIN_COLORS = [GRAIN_SHADOW, ACCENT, GRAIN_LIGHT];

// ── Geometry helpers ─────────────────────────────────────────────

function drawHourglassPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  const hw = w / 2, hh = h / 2;
  const neck = w * 0.06, curve = h * 0.38;
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - hh);
  ctx.bezierCurveTo(cx - hw, cy - hh + curve, cx - neck, cy - neck * 0.8, cx - neck, cy);
  ctx.bezierCurveTo(cx - neck, cy + neck * 0.8, cx - hw, cy + hh - curve, cx - hw, cy + hh);
  ctx.lineTo(cx + hw, cy + hh);
  ctx.bezierCurveTo(cx + hw, cy + hh - curve, cx + neck, cy + neck * 0.8, cx + neck, cy);
  ctx.bezierCurveTo(cx + neck, cy - neck * 0.8, cx + hw, cy - hh + curve, cx + hw, cy - hh);
  ctx.lineTo(cx - hw, cy - hh);
  ctx.closePath();
}

function hourglassWidthAt(t: number, hw: number, neck: number): number {
  const spread = Math.pow(Math.abs(t - 0.5) * 2, 1.6);
  return neck + (hw - neck) * spread;
}

function createDustMotes(cx: number, cy: number, glassW: number, glassH: number): DustMote[] {
  return Array.from({ length: 15 }, (_, i) => {
    const angle = (i / 15) * Math.PI * 2;
    const dist = glassW * 0.55 + Math.random() * glassW * 0.35;
    return {
      baseX: cx + Math.cos(angle) * dist,
      baseY: cy + Math.sin(angle) * (glassH * 0.3) + (Math.random() - 0.5) * glassH * 0.25,
      size: 0.5 + Math.random() * 1,
      opacity: 0.12 + Math.random() * 0.2,
      speed: 0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    };
  });
}

// ── Canvas Hourglass ─────────────────────────────────────────────

function HourglassCanvas({ pctLived }: { pctLived: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grainsRef = useRef<Grain[]>([]);
  const dustRef = useRef<DustMote[]>([]);
  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const dustInitRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const cx = w / 2, cy = h / 2;
    const glassW = Math.min(w * 0.55, 220);
    const glassH = Math.min(h * 0.82, 420);
    const hw = glassW / 2, neck = glassW * 0.06;
    const now = Date.now();

    if (!dustInitRef.current) {
      dustRef.current = createDustMotes(cx, cy, glassW, glassH);
      dustInitRef.current = true;
    }

    ctx.clearRect(0, 0, w, h);

    // ── 1. Ambient dust (behind glass) ──
    for (const d of dustRef.current) {
      const t = now * 0.001;
      const dx = d.baseX + Math.sin(t * d.speed + d.phase) * 15;
      const dy = d.baseY + Math.cos(t * d.speed * 0.7 + d.phase) * 10;
      ctx.globalAlpha = d.opacity * (0.5 + 0.5 * Math.sin(t * 0.8 + d.phase));
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── 2. Glass outline + clip ──
    ctx.save();
    drawHourglassPath(ctx, cx, cy, glassW, glassH);
    ctx.strokeStyle = GLASS_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();

    // ── 3. Top sand (future — drains) ──
    const topFill = Math.max(0, 1 - pctLived);
    const topHeight = (glassH / 2 - 4) * topFill;
    const topSandY = cy - 4 - topHeight;

    if (topFill > 0.005) {
      const grad1 = ctx.createLinearGradient(cx, topSandY, cx, cy - 4);
      grad1.addColorStop(0, SAND_TOP);
      grad1.addColorStop(1, '#d4b85e');
      ctx.fillStyle = grad1;
      ctx.fillRect(cx - hw - 2, topSandY, glassW + 4, topHeight + 4);

      // Grain texture
      for (const g of TOP_GRAINS) {
        const gx = cx + (g.xPct - 0.5) * glassW * 0.95;
        const gy = topSandY + g.yPct * topHeight;
        if (gy >= topSandY && gy <= cy - 6) {
          const tN = (gy - (cy - glassH / 2)) / glassH;
          const maxW = hourglassWidthAt(tN, hw, neck) * 0.88;
          if (Math.abs(gx - cx) < maxW) {
            ctx.globalAlpha = g.opacity;
            ctx.fillStyle = GRAIN_COLORS[g.colorIdx];
            ctx.fillRect(gx - g.size * 0.5, gy - g.size * 0.5, g.size, g.size);
          }
        }
      }
      ctx.globalAlpha = 1;

      // Funnel depression at drain point
      const funnelD = Math.min(16, topHeight * 0.2);
      const funnelW = neck * 3.5;
      if (funnelD > 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(cx - funnelW, cy - 4);
        ctx.quadraticCurveTo(cx, cy - 4 - funnelD, cx + funnelW, cy - 4);
        ctx.lineTo(cx + funnelW, cy);
        ctx.lineTo(cx - funnelW, cy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // ── 4. Bottom sand (past — accumulates) ──
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

      // Cone mound at deposit point
      const coneH = Math.min(22, botHeight * 0.15);
      const coneW = neck * 4;
      if (coneH > 2) {
        const cg = ctx.createLinearGradient(cx, botSandY - coneH, cx, botSandY);
        cg.addColorStop(0, SAND_TOP);
        cg.addColorStop(1, '#c9a95c');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.moveTo(cx - coneW, botSandY);
        ctx.quadraticCurveTo(cx, botSandY - coneH, cx + coneW, botSandY);
        ctx.closePath();
        ctx.fill();
      }

      // Grain texture
      for (const g of BOT_GRAINS) {
        const gx = cx + (g.xPct - 0.5) * glassW * 0.95;
        const gy = botSandY + g.yPct * botHeight;
        if (gy >= botSandY && gy <= botBase) {
          const tN = (gy - (cy - glassH / 2)) / glassH;
          const maxW = hourglassWidthAt(tN, hw, neck) * 0.88;
          if (Math.abs(gx - cx) < maxW) {
            ctx.globalAlpha = g.opacity * 0.7;
            ctx.fillStyle = GRAIN_COLORS[g.colorIdx];
            ctx.fillRect(gx - g.size * 0.5, gy - g.size * 0.5, g.size, g.size);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // ── 5. Falling grains with sparkle ──
    const grains = grainsRef.current;
    if (now - lastSpawnRef.current > 100 && topFill > 0.005) {
      lastSpawnRef.current = now;
      const count = Math.random() < 0.35 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        grains.push({
          x: cx + (Math.random() - 0.5) * neck * 1.4,
          y: cy - 2,
          vy: 0.5 + Math.random() * 0.8,
          vx: (Math.random() - 0.5) * 0.3,
          size: 1 + Math.random() * 1.4,
          opacity: 0.6 + Math.random() * 0.4,
          settled: false,
        });
      }
    }

    for (let i = grains.length - 1; i >= 0; i--) {
      const g = grains[i];
      g.y += g.vy; g.x += g.vx; g.vy += 0.04;
      if (g.y > botSandY - 2 || g.y > cy + glassH / 2) { grains.splice(i, 1); continue; }

      const tP = (g.y - (cy - glassH / 2)) / glassH;
      const maxX = hourglassWidthAt(tP, hw, neck) * 0.85;
      g.x = Math.max(cx - maxX, Math.min(cx + maxX, g.x));

      const sparkle = Math.sin(now * 0.008 + i * 23) > 0.93;
      ctx.fillStyle = sparkle ? '#fffbe6' : SAND_FALL;
      ctx.globalAlpha = sparkle ? 1 : g.opacity;
      ctx.beginPath();
      ctx.arc(g.x, g.y, sparkle ? g.size * 1.3 : g.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // ── 6. Redraw glass outline on top ──
    drawHourglassPath(ctx, cx, cy, glassW, glassH);
    ctx.strokeStyle = GLASS_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── 7. Glass reflections ──
    ctx.save();
    drawHourglassPath(ctx, cx, cy, glassW, glassH);
    ctx.clip();
    const hl1 = ctx.createLinearGradient(cx - hw * 0.65, cy - glassH * 0.4, cx - hw * 0.25, cy - glassH * 0.05);
    hl1.addColorStop(0, 'rgba(255,255,255,0)');
    hl1.addColorStop(0.3, 'rgba(255,255,255,0.055)');
    hl1.addColorStop(0.7, 'rgba(255,255,255,0.035)');
    hl1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl1;
    ctx.fillRect(cx - hw, cy - glassH / 2, hw * 0.55, glassH * 0.48);
    const hl2 = ctx.createLinearGradient(cx + hw * 0.25, cy + glassH * 0.05, cx + hw * 0.65, cy + glassH * 0.4);
    hl2.addColorStop(0, 'rgba(255,255,255,0)');
    hl2.addColorStop(0.3, 'rgba(255,255,255,0.04)');
    hl2.addColorStop(0.7, 'rgba(255,255,255,0.025)');
    hl2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl2;
    ctx.fillRect(cx + hw * 0.15, cy + glassH * 0.02, hw * 0.55, glassH * 0.48);
    ctx.restore();

    // ── 8. Caps ──
    const capW = glassW * 0.7, capH = 6;
    ctx.fillStyle = GLASS_STROKE;
    ctx.beginPath();
    ctx.roundRect(cx - capW / 2, cy - glassH / 2 - capH, capW, capH, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx - capW / 2, cy + glassH / 2, capW, capH, 3);
    ctx.fill();

    // ── 9. Pulsing neck glow ──
    const pulse = 0.08 + 0.06 * Math.sin(now * 0.002);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, neck * 5);
    glow.addColorStop(0, `rgba(232,200,114,${pulse.toFixed(3)})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - neck * 5, cy - neck * 5, neck * 10, neck * 10);

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


// ── Time Unit (for ticker) ───────────────────────────────────────

function TimeUnit({ value, label, pad }: { value: number; label: string; pad?: number }) {
  return (
    <div className="text-center">
      <span
        className="text-[1.15rem] sm:text-[1.4rem] font-black tabular-nums"
        style={{ color: ACCENT }}
      >
        {String(value).padStart(pad ?? 2, '0')}
      </span>
      <p className="text-[7px] sm:text-[8px] uppercase tracking-wider dark:text-zinc-600 text-zinc-400 -mt-0.5">
        {label}
      </p>
    </div>
  );
}

// ── Live Ticker ──────────────────────────────────────────────────

function LiveTicker({ birthYear }: { birthYear: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - new Date(birthYear, 0, 1).getTime();
  const totalSec = Math.max(0, Math.floor(elapsed / 1000));
  const days = Math.floor(totalSec / 86400);
  const hrs = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const heartbeats = Math.floor(totalSec * 1.2);
  const breaths = Math.floor(totalSec * 0.25);

  return (
    <div className="text-center space-y-2 py-1">
      <p className="text-[9px] uppercase tracking-[0.2em] font-semibold dark:text-zinc-600 text-zinc-400">
        Time Alive
      </p>
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <TimeUnit value={days} label="days" pad={1} />
        <span className="text-zinc-600 text-lg font-light pb-3">:</span>
        <TimeUnit value={hrs} label="hrs" />
        <span className="text-zinc-600 text-lg font-light pb-3">:</span>
        <TimeUnit value={mins} label="min" />
        <span className="text-zinc-600 text-lg font-light pb-3 animate-pulse">:</span>
        <TimeUnit value={secs} label="sec" />
      </div>
      <div className="flex justify-center gap-4 sm:gap-6">
        <span className="text-[9px] sm:text-[10px] dark:text-zinc-600 text-zinc-400 tabular-nums">
          ❤️ ~{(heartbeats / 1e9).toFixed(2)}B heartbeats
        </span>
        <span className="text-[9px] sm:text-[10px] dark:text-zinc-600 text-zinc-400 tabular-nums">
          💨 ~{Math.floor(breaths / 1e6)}M breaths
        </span>
      </div>
    </div>
  );
}

// ── Shuffling Reflections ────────────────────────────────────────

const REFLECTIONS = [
  "What would you do if you could see all your remaining weeks?",
  "Which decade would you relive if you could?",
  "What\u2019s the one thing you keep postponing?",
  "If your life were a book, what chapter are you in?",
  "What would your 80-year-old self tell you right now?",
  "What are you saving for a \u2018someday\u2019 that may never come?",
  "If you had half the time left, what would you change today?",
  "What memory would you choose to relive one more time?",
  "What are you holding onto that you should let go of?",
  "When was the last time you did something for the first time?",
  "What would you attempt if you knew you could not fail?",
  "Who would you call if you had one hour left?",
  "What will matter most in ten years?",
  "What are you most afraid of never doing?",
  "If today were your last, would you be at peace?",
];

function ShufflingReflection() {
  const [idx, setIdx] = useState(() => {
    const doy = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000,
    );
    return doy % REFLECTIONS.length;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(prev => (prev + 1) % REFLECTIONS.length);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-2xl border dark:border-white/[0.05] border-black/[0.06] p-4 sm:p-5 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(201,169,92,0.05) 0%, transparent 60%)', minHeight: 85 }}
    >
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-600 text-zinc-400 mb-2">
        Reflection
      </p>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          className="text-[13px] sm:text-[15px] italic dark:text-zinc-300 text-zinc-600 leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.6 }}
        >
          &ldquo;{REFLECTIONS[idx]}&rdquo;
        </motion.p>
      </AnimatePresence>
    </div>
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

// ── Milestone Timeline ───────────────────────────────────────────

function MilestoneTimeline({ currentAge, lifeExpectancy }: { currentAge: number; lifeExpectancy: number }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest font-semibold dark:text-zinc-500 text-zinc-500 mb-2">
        Milestones
      </p>
      <div className="relative">
        <div className="absolute left-[7px] top-0 bottom-0 w-px dark:bg-white/[0.06] bg-black/[0.06]" />
        <div className="space-y-1">
          {MILESTONES.filter(m => m.age <= Math.ceil(lifeExpectancy)).map((m) => {
            const isPast = m.age <= currentAge;
            const isCurrent = currentAge >= m.age && currentAge < m.age + 5;
            return (
              <div key={m.age} className="flex items-center gap-3 pl-0">
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
                <div className="flex items-center gap-2 py-1">
                  <span className="text-sm">{m.emoji}</span>
                  <span
                    className="text-[12px] font-medium"
                    style={{
                      color: isPast ? 'var(--curio-text, #e8e0d4)' : 'var(--curio-text-muted, rgba(255,255,255,0.35))',
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

// ── MAIN EXPORT ──────────────────────────────────────────────────

export function LifeCalendarApp() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [showMilestones, setShowMilestones] = useState(false);

  const countries = useMemo(() => Object.keys(LIFE_EXPECTANCY).sort(), []);
  const yearOptions = useMemo(
    () => Array.from({ length: currentYear - BIRTH_YEAR_MIN + 1 }, (_, i) => currentYear - i),
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
        <HourglassCanvas pctLived={pctLived} />

        {/* Overlay stats flanking the hourglass */}
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

      {/* ── Live Ticker ── */}
      <LiveTicker birthYear={birthYear} />

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

      {/* ── Shuffling Reflection ── */}
      <ShufflingReflection />

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

      {/* ── Footer ── */}
      <div className="text-center pt-2 pb-4">
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400">
          Every grain is a moment. You can&apos;t get them back.
        </p>
      </div>
    </div>
  );
}
