'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────
// DON'T MOVE — The Hunt
// Predators home in on your cursor. Stay still while they close in.
// Near-misses build your multiplier. Movement kills.
// ─────────────────────────────────────────────────────────────────

const ARENA_W = 700;
const ARENA_H = 420;

const INITIAL_THRESHOLD = 8;   // px movement = death
const SPAWN_INTERVAL    = 20;  // seconds between new predators
const MAX_PREDATORS     = 8;
const TICK_MS           = 30;  // physics tick

const DIFFICULTY_STAGES = [
  { after: 0,   label: 'Calm',     speedMult: 1.0, threshold: 8 },
  { after: 30,  label: 'Stirring', speedMult: 1.3, threshold: 6 },
  { after: 60,  label: 'Shaking',  speedMult: 1.7, threshold: 4 },
  { after: 100, label: 'Critical', speedMult: 2.3, threshold: 2 },
] as const;

const SHAPE_TYPES = ['circle', 'square', 'triangle'] as const;
type ShapeType = typeof SHAPE_TYPES[number];

const PREDATOR_COLORS = [
  '#f43f5e', '#a855f7', '#3b82f6', '#f97316',
  '#10b981', '#eab308', '#ec4899', '#06b6d4',
];

const TAUNTS: Array<{ min: number; text: string }> = [
  { min: 0,   text: 'Stay still…' },
  { min: 20,  text: 'Not bad…' },
  { min: 50,  text: 'They\'re getting closer…' },
  { min: 100, text: 'Impressive…' },
  { min: 180, text: 'Are you even breathing?!' },
  { min: 280, text: 'Absolutely unhinged.' },
  { min: 400, text: '🗿' },
];

const SHAME_MESSAGES = [
  'The average person lasts longer.',
  'My grandma could do better.',
  'Twitchy fingers.',
  'A valiant effort. (Not really.)',
  'Try being a statue next time.',
  'Even your heartbeat counts.',
  'They smelled the fear.',
  'So close. So pathetically close.',
];

interface Predator {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: ShapeType;
  speed: number;
  orbitPhase: number;
}

function randomEdgeSpawn(): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) return { x: Math.random() * ARENA_W, y: -30 };
  if (edge === 1) return { x: ARENA_W + 30, y: Math.random() * ARENA_H };
  if (edge === 2) return { x: Math.random() * ARENA_W, y: ARENA_H + 30 };
  return { x: -30, y: Math.random() * ARENA_H };
}

function makePredator(id: number, speedMult = 1): Predator {
  const pos = randomEdgeSpawn();
  return {
    id,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    size: 14 + Math.random() * 18,
    color: PREDATOR_COLORS[id % PREDATOR_COLORS.length],
    shape: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
    speed: (0.8 + Math.random() * 0.7) * speedMult,
    orbitPhase: Math.random() * Math.PI * 2,
  };
}

function PredatorShape({ p, critical }: { p: Predator; critical: boolean }) {
  const s = p.size;
  const fill = p.color;
  const pulse = critical ? { scale: [1, 1.25, 1], filter: [`drop-shadow(0 0 6px ${fill})`, `drop-shadow(0 0 14px ${fill})`, `drop-shadow(0 0 6px ${fill})`] } : { scale: 1 };
  const pulseT = critical ? { duration: 0.45, repeat: Infinity } : {};
  if (p.shape === 'circle') {
    return (
      <motion.div
        animate={pulse} transition={pulseT}
        style={{ position: 'absolute', left: p.x - s / 2, top: p.y - s / 2,
          width: s, height: s, borderRadius: '50%', background: fill, opacity: 0.92 }}
      />
    );
  }
  if (p.shape === 'square') {
    return (
      <motion.div
        animate={pulse} transition={pulseT}
        style={{ position: 'absolute', left: p.x - s / 2, top: p.y - s / 2,
          width: s, height: s, borderRadius: 3, background: fill, opacity: 0.92 }}
      />
    );
  }
  // triangle via clip-path
  return (
    <motion.div
      animate={pulse} transition={pulseT}
      style={{ position: 'absolute', left: p.x - s / 2, top: p.y - s / 2,
        width: s, height: s, background: fill, opacity: 0.92,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
    />
  );
}

export function DontMoveApp() {
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'playing' | 'lost'>('ready');
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [nerveFlash, setNerveFlash] = useState(false);
  const [shakeArena, setShakeArena] = useState(false);
  const [shameMsg, setShameMsg] = useState('');
  const [predators, setPredators] = useState<Predator[]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [nearestDist, setNearestDist] = useState(999);
  const [diffLabel, setDiffLabel] = useState('Calm');
  const [lostPos, setLostPos] = useState({ x: 0, y: 0 });

  const arenaRef      = useRef<HTMLDivElement>(null);
  const stateRef      = useRef(gameState);
  const scoreRef      = useRef(0);
  const startRef      = useRef(0);
  const multRef       = useRef(1);
  const lastPosRef    = useRef({ x: -1, y: -1 });
  const predatorsRef  = useRef<Predator[]>([]);
  const cursorRef     = useRef<{ x: number; y: number } | null>(null);
  const threshRef     = useRef(INITIAL_THRESHOLD);
  const tickRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const idCounterRef  = useRef(0);
  const nearMissRef   = useRef<Set<number>>(new Set());

  stateRef.current     = gameState;
  predatorsRef.current = predators;
  cursorRef.current    = cursorPos;
  multRef.current      = multiplier;

  // ── Taunt ──────────────────────────────────────────────────────
  const currentTaunt = TAUNTS.filter(t => score >= t.min).pop()?.text ?? '';

  // ── Die ────────────────────────────────────────────────────────
  const die = useCallback((finalScore: number) => {
    if (tickRef.current)  clearInterval(tickRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    setHighScore(h => Math.max(h, finalScore));
    setShameMsg(SHAME_MESSAGES[Math.floor(Math.random() * SHAME_MESSAGES.length)]);
    setShakeArena(true);
    setTimeout(() => setShakeArena(false), 600);
    setGameState('lost');
    setScore(finalScore);
  }, []);

  // ── Countdown ─────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);
    let c = 3;
    const iv = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(iv);
        beginGame();
      }
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Begin game ────────────────────────────────────────────────
  const beginGame = useCallback(() => {
    idCounterRef.current = 0;
    nearMissRef.current  = new Set();
    lastPosRef.current   = { x: -1, y: -1 };
    threshRef.current    = INITIAL_THRESHOLD;
    startRef.current     = Date.now();
    scoreRef.current     = 0;
    multRef.current      = 1;

    const initial: Predator[] = [
      makePredator(idCounterRef.current++),
      makePredator(idCounterRef.current++),
      makePredator(idCounterRef.current++),
    ];
    predatorsRef.current = initial;
    setPredators(initial);
    setScore(0);
    setMultiplier(1);
    setNearestDist(999);
    setDiffLabel('Calm');
    setCursorPos(null);
    cursorRef.current = null;
    setGameState('playing');

    // Physics tick
    tickRef.current = setInterval(() => {
      if (stateRef.current !== 'playing') return;

      const elapsed = (Date.now() - startRef.current) / 1000;

      // Difficulty
      const stage = [...DIFFICULTY_STAGES].reverse().find(s => elapsed >= s.after) ?? DIFFICULTY_STAGES[0];
      threshRef.current = stage.threshold;
      setDiffLabel(stage.label);

      // Score
      const newScore = Math.floor(elapsed * multRef.current);
      scoreRef.current = newScore;
      setScore(newScore);

      const target = cursorRef.current;
      const ps     = predatorsRef.current;

      // Update predators
      let minDist  = 999;
      const newPs  = ps.map(p => {
        // If cursor hasn't entered arena yet, predators wander slowly toward center
        const tx = target ? target.x : ARENA_W / 2 + (Math.random() - 0.5) * 200;
        const ty = target ? target.y : ARENA_H / 2 + (Math.random() - 0.5) * 200;
        const dx = tx - p.x;
        const dy = ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (target && dist < minDist) minDist = dist;

        // Orbit offset — adds a swirling approach
        const orbitR      = Math.max(0, dist * 0.15);
        const orA         = p.orbitPhase + (elapsed * 1.2);
        const orbitX      = Math.cos(orA) * orbitR;
        const orbitY      = Math.sin(orA) * orbitR;
        const effectiveDX = dx + orbitX;
        const effectiveDY = dy + orbitY;
        const eff         = Math.sqrt(effectiveDX * effectiveDX + effectiveDY * effectiveDY) || 1;

        // Approach speed scales with difficulty and proximity
        const urgency   = dist < 80 ? 1.6 : 1.0;
        const spd       = p.speed * stage.speedMult * urgency;
        const ax        = (effectiveDX / eff) * spd;
        const ay        = (effectiveDY / eff) * spd;
        const friction  = 0.84;
        const nvx       = (p.vx + ax) * friction;
        const nvy       = (p.vy + ay) * friction;

        // Near-miss: passed within 26px (only counts when cursor is in arena)
        if (target && dist < 26 && !nearMissRef.current.has(p.id)) {
          nearMissRef.current.add(p.id);
          multRef.current = parseFloat((multRef.current + 0.5).toFixed(1));
          setMultiplier(multRef.current);
          setNerveFlash(true);
          setTimeout(() => setNerveFlash(false), 600);
        }
        // Reset near-miss tracker once they leave
        if (dist > 50) nearMissRef.current.delete(p.id);

        return { ...p, x: p.x + nvx, y: p.y + nvy, vx: nvx, vy: nvy };
      });

      setNearestDist(minDist);
      predatorsRef.current = newPs;
      setPredators([...newPs]);
    }, TICK_MS);

    // Spawn new predators
    spawnRef.current = setInterval(() => {
      if (stateRef.current !== 'playing') return;
      if (predatorsRef.current.length >= MAX_PREDATORS) return;
      const elapsed2 = (Date.now() - startRef.current) / 1000;
      const stage2 = [...DIFFICULTY_STAGES].reverse().find(s => elapsed2 >= s.after) ?? DIFFICULTY_STAGES[0];
      const newP = makePredator(idCounterRef.current++, stage2.speedMult);
      predatorsRef.current = [...predatorsRef.current, newP];
      setPredators([...predatorsRef.current]);
    }, SPAWN_INTERVAL * 1000);
  }, []);

  // ── Mouse / touch ─────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (stateRef.current !== 'playing') return;
    const rect = arenaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
    cursorRef.current = { x, y };

    if (lastPosRef.current.x === -1) { lastPosRef.current = { x, y }; return; }
    const dist = Math.sqrt((x - lastPosRef.current.x) ** 2 + (y - lastPosRef.current.y) ** 2);
    lastPosRef.current = { x, y };
    if (dist > threshRef.current) {
      setLostPos({ x, y });
      die(scoreRef.current);
    }
  }, [die]);

  const handleMouseLeave = useCallback(() => {
    if (stateRef.current !== 'playing') return;
    die(scoreRef.current);
  }, [die]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (stateRef.current !== 'playing') return;
    e.preventDefault();
    const rect = arenaRef.current?.getBoundingClientRect();
    if (!rect || !e.touches[0]) return;
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    setCursorPos({ x, y });
    cursorRef.current = { x, y };
    if (lastPosRef.current.x === -1) { lastPosRef.current = { x, y }; return; }
    const dist = Math.sqrt((x - lastPosRef.current.x) ** 2 + (y - lastPosRef.current.y) ** 2);
    lastPosRef.current = { x, y };
    if (dist > threshRef.current) die(scoreRef.current);
  }, [die]);

  // ── Cleanup ────────────────────────────────────────────────────
  useEffect(() => () => {
    if (tickRef.current)  clearInterval(tickRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
  }, []);

  // ── Vignette intensity based on nearest predator ───────────────
  const vignetteIntensity = cursorPos ? Math.max(0, Math.min(1, 1 - nearestDist / 140)) : 0;
  const criticalZone      = !!cursorPos && nearestDist < 40;

  // ── Shapes for lost state scatter ─────────────────────────────
  const finalPredators = predators;

  return (
    <div className="py-4 sm:py-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-4xl sm:text-6xl mb-3 sm:mb-4"
      >
        ✋
      </motion.div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Don&apos;t Move</h2>
      <p className="text-zinc-400 text-sm sm:text-base mb-5 px-4">Stay perfectly still. They hunt you.</p>

      {/* Arena */}
      <motion.div
        animate={shakeArena ? {
          x: [0, -10, 10, -8, 8, -4, 4, 0],
          y: [0, 4, -4, 4, -2, 2, 0],
        } : { x: 0, y: 0 }}
        transition={{ duration: 0.5 }}
        ref={arenaRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        className="relative w-full rounded-2xl overflow-hidden touch-none select-none border border-zinc-800"
        style={{
          maxWidth: ARENA_W,
          height: ARENA_H,
          margin: '0 auto',
          background: '#0a0a0f',
          cursor: gameState === 'playing' ? 'none' : 'default',
        }}
      >
        {/* Vignette overlay — intensifies as predators close in */}
        <div
          className="absolute inset-0 pointer-events-none z-[5] rounded-2xl transition-opacity duration-100"
          style={{
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(220,38,38,${(vignetteIntensity * 0.55).toFixed(2)}) 100%)`,
          }}
        />

        {/* Pulsing border ring — critical warning */}
        <motion.div
          animate={criticalZone ? { opacity: [0.4, 1, 0.4] } : { opacity: 0 }}
          transition={{ duration: 0.35, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none z-[6] rounded-2xl"
          style={{ border: '2px solid rgba(239,68,68,0.8)', boxShadow: 'inset 0 0 30px rgba(239,68,68,0.25)' }}
        />

        {/* Nerve flash overlay */}
        <AnimatePresence>
          {nerveFlash && (
            <motion.div
              key="nerve"
              initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 pointer-events-none z-[25] rounded-2xl"
              style={{ background: 'rgba(168,85,247,0.18)' }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ── READY ── */}
          {gameState === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 z-10"
            >
              <motion.div
                animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 2.2, repeat: Infinity }}
                className="w-16 h-16 rounded-full border border-fuchsia-500/30 flex items-center justify-center"
                style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.15), transparent)' }}
              >
                <span className="text-2xl">🤫</span>
              </motion.div>
              <div className="flex flex-col gap-2 text-left max-w-xs w-full">
                {([
                  ['1', 'Move your cursor into this arena to set your start position.'],
                  ['2', 'Then physically freeze your mouse. Any movement kills you.'],
                  ['3', 'Predators hunt you. They\'re a distraction — don\'t flinch.'],
                  ['4', 'Near-misses build a score multiplier. No movement = high score.'],
                ] as [string, string][]).map(([n, text]) => (
                  <div key={n} className="flex gap-3 items-start">
                    <span className="text-[11px] font-black text-fuchsia-500 w-4 mt-0.5 shrink-0">{n}</span>
                    <span className="text-zinc-400 text-[12px] leading-snug">{text}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={startCountdown}
                size="lg"
                className="bg-gradient-to-r from-fuchsia-600 to-violet-600 min-h-[48px] px-10 shadow-lg shadow-fuchsia-500/25 mt-1"
              >
                Start Game
              </Button>
            </motion.div>
          )}

          {/* ── COUNTDOWN ── */}
          {gameState === 'countdown' && (
            <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="text-8xl font-black tabular-nums"
                  style={{ color: countdown === 1 ? '#f43f5e' : countdown === 2 ? '#f97316' : '#a3e635' }}
                >
                  {countdown === 0 ? 'GO' : countdown}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── PLAYING ── */}
          {gameState === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
              {/* Predators — inset-0 container at z-10, above vignette (z-5) */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {predators.map(p => (
                  <PredatorShape key={p.id} p={p} critical={criticalZone} />
                ))}
              </div>

              {/* Cursor reticle — only when cursor has entered arena */}
              {cursorPos && <div
                className="absolute pointer-events-none z-20 transition-colors duration-100"
                style={{
                  left: cursorPos.x - 10,
                  top:  cursorPos.y - 10,
                  width: 20,
                  height: 20,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8"
                    fill="none"
                    stroke={criticalZone ? '#ef4444' : nearestDist < 80 ? '#f97316' : 'rgba(255,255,255,0.5)'}
                    strokeWidth="1.2"
                  />
                  <circle cx="10" cy="10" r="2"
                    fill={criticalZone ? '#ef4444' : 'rgba(255,255,255,0.7)'}
                  />
                  {/* crosshair ticks */}
                  <line x1="10" y1="1" x2="10" y2="5" stroke={criticalZone ? '#ef4444' : 'rgba(255,255,255,0.4)'} strokeWidth="1" />
                  <line x1="10" y1="15" x2="10" y2="19" stroke={criticalZone ? '#ef4444' : 'rgba(255,255,255,0.4)'} strokeWidth="1" />
                  <line x1="1" y1="10" x2="5" y2="10" stroke={criticalZone ? '#ef4444' : 'rgba(255,255,255,0.4)'} strokeWidth="1" />
                  <line x1="15" y1="10" x2="19" y2="10" stroke={criticalZone ? '#ef4444' : 'rgba(255,255,255,0.4)'} strokeWidth="1" />
                </svg>
              </div>}

              {/* HUD */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
                {/* Multiplier badge */}
                <AnimatePresence>
                  {multiplier > 1 && (
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0, y: -10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className="mb-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                      style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc' }}
                    >
                      ×{multiplier.toFixed(1)} NERVE
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Score */}
                <motion.div
                  className="text-6xl font-black tabular-nums"
                  style={{
                    color: criticalZone ? '#f87171' : '#d946ef',
                    textShadow: criticalZone
                      ? '0 0 40px rgba(239,68,68,0.5)'
                      : '0 0 40px rgba(217,70,239,0.3)',
                  }}
                >
                  {score}
                </motion.div>

                {/* Taunt */}
                <motion.p
                  key={currentTaunt}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-zinc-600 text-xs mt-2"
                >
                  {currentTaunt}
                </motion.p>

                {/* Difficulty badge + threshold */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{
                      background: diffLabel === 'Critical' ? 'rgba(239,68,68,0.2)' : diffLabel === 'Shaking' ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)',
                      color: diffLabel === 'Critical' ? '#f87171' : diffLabel === 'Shaking' ? '#fb923c' : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${diffLabel === 'Critical' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {diffLabel}
                  </span>
                  <span className="text-[9px] font-mono tabular-nums"
                    style={{ color: diffLabel === 'Critical' ? '#f87171' : 'rgba(255,255,255,0.22)' }}>
                    ≤ {diffLabel === 'Critical' ? 2 : diffLabel === 'Shaking' ? 4 : diffLabel === 'Stirring' ? 6 : 8}px allowed
                  </span>
                </div>

                {/* Predator count */}
                <div className="absolute top-3 left-3 text-[10px] font-mono text-zinc-600">
                  {predators.length} hunters
                </div>
              </div>
            </motion.div>
          )}

          {/* ── LOST ── */}
          {gameState === 'lost' && (
            <motion.div
              key="lost"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10"
              style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, transparent 70%)' }}
            >
              {/* Predators scatter on death */}
              {finalPredators.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ x: p.x - ARENA_W / 2, y: p.y - ARENA_H / 2, opacity: 0.9, scale: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 600,
                    y: (Math.random() - 0.5) * 400,
                    opacity: 0,
                    scale: 2,
                  }}
                  transition={{ duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute',
                    left: ARENA_W / 2,
                    top: ARENA_H / 2,
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? 3 : undefined,
                    clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
                    pointerEvents: 'none',
                  }}
                />
              ))}

              <motion.div
                initial={{ scale: 0.4, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                className="text-5xl mb-3 z-10"
              >
                💀
              </motion.div>
              <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1 z-10">You moved!</div>
              <p className="text-zinc-500 text-xs italic mb-5 z-10">{shameMsg}</p>
              <div className="text-2xl text-zinc-300 mb-1 z-10">
                Score: <span className="text-fuchsia-400 font-black">{score}</span>
              </div>
              {multiplier > 1 && (
                <div className="text-xs text-violet-400 mb-1 z-10">× {multiplier.toFixed(1)} nerve multiplier</div>
              )}
              <div className="text-zinc-500 text-sm mb-6 z-10">
                Best: <span className="text-violet-400 font-bold">{highScore}</span>
              </div>
              <Button
                onClick={startCountdown}
                className="z-10 bg-gradient-to-r from-fuchsia-600 to-violet-600 min-h-[44px] px-8 shadow-lg shadow-fuchsia-500/25"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Legend */}
      {(gameState === 'playing' || gameState === 'lost') && (
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3 text-[10px] text-zinc-600">
          <span><span className="text-zinc-500">Any mouse movement</span> → death</span>
          <span>Near-miss &lt;26px → <span className="text-violet-400">+×0.5 nerve</span></span>
          <span>New hunter every {SPAWN_INTERVAL}s</span>
          <span>Leaving arena → instant death</span>
        </div>
      )}
    </div>
  );
}
