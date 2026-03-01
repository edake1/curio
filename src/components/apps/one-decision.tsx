'use client';

import { useEffect, useCallback, useRef, useMemo, useReducer, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, History, ChevronDown, ChevronUp, Scale, Timer, TimerOff, Flame, Users, Zap, Brain, Heart, Shield, Eye, Activity, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSessionId } from '@/lib/session';
import type { Dilemma } from '@/lib/types';

// ── Category styling ────────────────────────────────────────────
const CATEGORY_THEMES: Record<string, { gradient: string; badge: string; accentA: string; accentB: string; glow: string; tintA: string; tintB: string }> = {
  ethics:        { gradient: 'from-violet-600 to-fuchsia-500', badge: 'bg-violet-500/15 dark:text-violet-200 text-violet-700 border-violet-400/30', accentA: 'from-violet-500 to-violet-400', accentB: 'from-fuchsia-500 to-pink-400',   glow: 'shadow-[0_0_40px_-8px] shadow-violet-500/30', tintA: 'bg-violet-500/[0.06]', tintB: 'bg-fuchsia-500/[0.06]' },
  family:        { gradient: 'from-amber-500 to-orange-500',   badge: 'bg-amber-500/15 dark:text-amber-200 text-amber-700 border-amber-400/30',   accentA: 'from-amber-500 to-yellow-400',  accentB: 'from-rose-500 to-red-400',      glow: 'shadow-[0_0_40px_-8px] shadow-amber-500/30',   tintA: 'bg-amber-500/[0.06]',  tintB: 'bg-rose-500/[0.06]' },
  relationships: { gradient: 'from-rose-500 to-pink-500',      badge: 'bg-rose-500/15 dark:text-rose-200 text-rose-700 border-rose-400/30',      accentA: 'from-rose-500 to-rose-400',     accentB: 'from-violet-500 to-purple-400', glow: 'shadow-[0_0_40px_-8px] shadow-rose-500/30',    tintA: 'bg-rose-500/[0.06]',   tintB: 'bg-violet-500/[0.06]' },
  career:        { gradient: 'from-blue-500 to-cyan-500',      badge: 'bg-blue-500/15 dark:text-blue-200 text-blue-700 border-blue-400/30',      accentA: 'from-blue-500 to-blue-400',     accentB: 'from-emerald-500 to-teal-400',  glow: 'shadow-[0_0_40px_-8px] shadow-blue-500/30',    tintA: 'bg-blue-500/[0.06]',   tintB: 'bg-emerald-500/[0.06]' },
  society:       { gradient: 'from-emerald-500 to-teal-500',   badge: 'bg-emerald-500/15 dark:text-emerald-200 text-emerald-700 border-emerald-400/30', accentA: 'from-emerald-500 to-green-400', accentB: 'from-amber-500 to-yellow-400', glow: 'shadow-[0_0_40px_-8px] shadow-emerald-500/30', tintA: 'bg-emerald-500/[0.06]', tintB: 'bg-amber-500/[0.06]' },
  technology:    { gradient: 'from-sky-500 to-indigo-500',     badge: 'bg-sky-500/15 dark:text-sky-200 text-sky-700 border-sky-400/30',         accentA: 'from-sky-500 to-cyan-400',      accentB: 'from-indigo-500 to-purple-400', glow: 'shadow-[0_0_40px_-8px] shadow-sky-500/30',     tintA: 'bg-sky-500/[0.06]',    tintB: 'bg-indigo-500/[0.06]' },
  money:         { gradient: 'from-lime-500 to-green-500',     badge: 'bg-lime-500/15 dark:text-lime-200 text-lime-700 border-lime-400/30',      accentA: 'from-lime-500 to-green-400',    accentB: 'from-orange-500 to-amber-400',  glow: 'shadow-[0_0_40px_-8px] shadow-lime-500/30',    tintA: 'bg-lime-500/[0.06]',   tintB: 'bg-orange-500/[0.06]' },
  health:        { gradient: 'from-red-500 to-rose-500',       badge: 'bg-red-500/15 dark:text-red-200 text-red-700 border-red-400/30',         accentA: 'from-red-500 to-red-400',       accentB: 'from-sky-500 to-blue-400',      glow: 'shadow-[0_0_40px_-8px] shadow-red-500/30',     tintA: 'bg-red-500/[0.06]',    tintB: 'bg-sky-500/[0.06]' },
  philosophy:    { gradient: 'from-purple-500 to-violet-500',  badge: 'bg-purple-500/15 dark:text-purple-200 text-purple-700 border-purple-400/30', accentA: 'from-purple-500 to-purple-400', accentB: 'from-cyan-500 to-teal-400',     glow: 'shadow-[0_0_40px_-8px] shadow-purple-500/30',  tintA: 'bg-purple-500/[0.06]', tintB: 'bg-cyan-500/[0.06]' },
};
const DEFAULT_THEME = CATEGORY_THEMES.ethics;
function getTheme(category?: string) {
  return CATEGORY_THEMES[(category || '').toLowerCase()] || DEFAULT_THEME;
}

// ── Personality engine ──────────────────────────────────────────
type PersonalityAxes = { heart: number; head: number; action: number; caution: number; truth: number; peace: number };

function computePersonality(history: HistoryEntry[]): { label: string; icon: typeof Brain; description: string } | null {
  if (history.length < 3) return null;
  const axes: PersonalityAxes = { heart: 0, head: 0, action: 0, caution: 0, truth: 0, peace: 0 };
  for (const entry of history) {
    if (entry.userChoice === 'A') { axes.action++; axes.truth++; axes.head++; }
    else { axes.caution++; axes.peace++; axes.heart++; }
  }
  const total = history.length;
  const actionRatio = axes.action / total;
  const truthRatio = axes.truth / total;
  if (actionRatio > 0.7 && truthRatio > 0.7) return { label: 'The Reckoner', icon: Zap, description: 'You choose action and truth, even when it costs you.' };
  if (actionRatio > 0.6) return { label: 'The Catalyst', icon: Flame, description: "You'd rather break something than let it rot quietly." };
  if (truthRatio > 0.6) return { label: 'The Mirror', icon: Eye, description: 'You believe the truth matters more than comfort — but pick your battles.' };
  if (axes.peace > axes.truth && axes.caution > axes.action) return { label: 'The Guardian', icon: Shield, description: 'You protect people from hard truths. Stability over upheaval.' };
  if (axes.heart > axes.head) return { label: 'The Empath', icon: Heart, description: 'You lead with feeling. The human cost always comes first.' };
  return { label: 'The Strategist', icon: Brain, description: 'You weigh every angle. Rarely impulsive, never careless.' };
}

// ── Types ───────────────────────────────────────────────────────
interface HistoryEntry {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  category: string;
  userChoice: 'A' | 'B';
  votesA: number;
  votesB: number;
}

interface AppState {
  dilemma: Dilemma | null;
  loading: boolean;
  voting: boolean;
  hasVoted: boolean;
  userChoice: 'A' | 'B' | null;
  history: HistoryEntry[];
  seenIds: string[];
  showHistory: boolean;
  allSeen: boolean;
  revealPhase: 'idle' | 'pulse' | 'counting' | 'done';
  displayPercentA: number;
  displayPercentB: number;
  timerEnabled: boolean;
  timerSeconds: number;
  timerActive: boolean;
  liveVotesA: number;
  liveVotesB: number;
  prefetchedDilemma: Dilemma | null;
}

type Action =
  | { type: 'setDilemma'; dilemma: Dilemma; allSeen?: boolean }
  | { type: 'setLoading'; loading: boolean }
  | { type: 'setVoting'; voting: boolean }
  | { type: 'voted'; userChoice: 'A' | 'B'; dilemma: Dilemma }
  | { type: 'reset' }
  | { type: 'toggleHistory' }
  | { type: 'setRevealPhase'; phase: AppState['revealPhase'] }
  | { type: 'setDisplayPercents'; a: number; b: number }
  | { type: 'toggleTimer' }
  | { type: 'tickTimer' }
  | { type: 'resetTimer' }
  | { type: 'updateLiveVotes'; votesA: number; votesB: number }
  | { type: 'loadSeenIds'; ids: string[] }
  | { type: 'setPrefetched'; dilemma: Dilemma | null };

const TIMER_DURATION = 15;

function reducer(prev: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setDilemma':
      return { ...prev, dilemma: action.dilemma, loading: false, allSeen: action.allSeen || false, seenIds: [...new Set([...prev.seenIds, action.dilemma.id])], revealPhase: 'idle', displayPercentA: 0, displayPercentB: 0, liveVotesA: action.dilemma.votesA, liveVotesB: action.dilemma.votesB, timerSeconds: TIMER_DURATION, timerActive: prev.timerEnabled };
    case 'setLoading':
      return { ...prev, loading: action.loading, timerActive: false };
    case 'setVoting':
      return { ...prev, voting: action.voting, timerActive: false };
    case 'voted': {
      const entry: HistoryEntry = { id: action.dilemma.id, question: action.dilemma.question, optionA: action.dilemma.optionA, optionB: action.dilemma.optionB, category: action.dilemma.category || 'ethics', userChoice: action.userChoice, votesA: action.dilemma.votesA, votesB: action.dilemma.votesB };
      return { ...prev, voting: false, hasVoted: true, userChoice: action.userChoice, dilemma: action.dilemma, history: [entry, ...prev.history], revealPhase: 'pulse', liveVotesA: action.dilemma.votesA, liveVotesB: action.dilemma.votesB, timerActive: false };
    }
    case 'reset':
      return { ...prev, hasVoted: false, userChoice: null, voting: false, revealPhase: 'idle', displayPercentA: 0, displayPercentB: 0 };
    case 'toggleHistory':
      return { ...prev, showHistory: !prev.showHistory };
    case 'setRevealPhase':
      return { ...prev, revealPhase: action.phase };
    case 'setDisplayPercents':
      return { ...prev, displayPercentA: action.a, displayPercentB: action.b };
    case 'toggleTimer':
      return { ...prev, timerEnabled: !prev.timerEnabled, timerActive: !prev.timerEnabled && !prev.hasVoted && !!prev.dilemma, timerSeconds: TIMER_DURATION };
    case 'tickTimer':
      return { ...prev, timerSeconds: Math.max(0, prev.timerSeconds - 1), timerActive: prev.timerSeconds - 1 > 0 };
    case 'resetTimer':
      return { ...prev, timerSeconds: TIMER_DURATION, timerActive: prev.timerEnabled };
    case 'updateLiveVotes':
      return { ...prev, liveVotesA: action.votesA, liveVotesB: action.votesB };
    case 'loadSeenIds':
      return { ...prev, seenIds: [...new Set([...prev.seenIds, ...action.ids])] };
    case 'setPrefetched':
      return { ...prev, prefetchedDilemma: action.dilemma };
    default:
      return prev;
  }
}

// ── LocalStorage helpers ────────────────────────────────────────
const SEEN_KEY = 'curio_dilemma_seen';
function loadSeenIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { const raw = localStorage.getItem(SEEN_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveSeenIds(ids: string[]) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids)); } catch { /* quota */ }
}

const INITIAL: AppState = {
  dilemma: null, loading: true, voting: false, hasVoted: false, userChoice: null,
  history: [], seenIds: [], showHistory: false, allSeen: false,
  revealPhase: 'idle', displayPercentA: 0, displayPercentB: 0,
  timerEnabled: false, timerSeconds: TIMER_DURATION, timerActive: false,
  liveVotesA: 0, liveVotesB: 0, prefetchedDilemma: null,
};

// ── Main component ──────────────────────────────────────────────
export function OneDecisionApp() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [voteBurst, setVoteBurst] = useState(false);
  const initRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenRef = useRef(state.seenIds);
  seenRef.current = state.seenIds;
  const isPrefetchingRef = useRef(false);

  const prefetchNext = useCallback(async (currentSeenIds: string[]) => {
    if (isPrefetchingRef.current) return;
    isPrefetchingRef.current = true;
    try {
      const params = new URLSearchParams({ type: 'random', sessionId });
      if (currentSeenIds.length) params.set('seen', currentSeenIds.join(','));
      const res = await fetch(`/api/dilemma?${params}`);
      const data = await res.json();
      if (data?.id && data?.question && !data.error) {
        dispatch({ type: 'setPrefetched', dilemma: data });
      }
    } catch { /* silent */ }
    finally { isPrefetchingRef.current = false; }
  }, [sessionId]);

  // Persist seenIds to localStorage whenever they change
  useEffect(() => { saveSeenIds(state.seenIds); }, [state.seenIds]);

  // Restore seenIds from localStorage on mount
  useEffect(() => {
    const stored = loadSeenIds();
    if (stored.length) dispatch({ type: 'loadSeenIds', ids: stored });
  }, []);

  const generateFresh = useCallback(async (): Promise<Dilemma | null> => {
    try {
      const res = await fetch('/api/dilemma', { method: 'POST' });
      const data = await res.json();
      if (data?.id && data?.question) return data as Dilemma;
    } catch { /* silent */ }
    return null;
  }, []);

  const fetchDilemma = useCallback(async (type: 'daily' | 'random' = 'daily') => {
    dispatch({ type: 'setLoading', loading: true });
    dispatch({ type: 'reset' });
    try {
      const params = new URLSearchParams({ type, sessionId });
      const currentSeen = seenRef.current;
      if (currentSeen.length) params.set('seen', currentSeen.join(','));
      const res = await fetch(`/api/dilemma?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // If all seed dilemmas have been seen, generate a fresh AI one
      if (data.allSeen) {
        const fresh = await generateFresh();
        if (fresh) {
          dispatch({ type: 'setDilemma', dilemma: fresh, allSeen: false });
          return;
        }
      }

      dispatch({ type: 'setDilemma', dilemma: data, allSeen: data.allSeen });
      // Prefetch next right away if we just loaded
      if (type === 'daily') {
        const seenAfter = [...new Set([...seenRef.current, data.id])];
        prefetchNext(seenAfter);
      }
    } catch { dispatch({ type: 'setLoading', loading: false }); }
  }, [sessionId, generateFresh, prefetchNext]);

  useEffect(() => { if (!initRef.current) { initRef.current = true; fetchDilemma('daily'); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const vote = useCallback(async (choice: 'A' | 'B') => {
    if (!state.dilemma || state.hasVoted || state.voting) return;
    dispatch({ type: 'setVoting', voting: true });
    setVoteBurst(true);
    setTimeout(() => setVoteBurst(false), 600);
    try {
      const res = await fetch('/api/dilemma/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dilemmaId: state.dilemma.id, choice, sessionId }) });
      const data = await res.json();
      if (data.dilemma) {
        dispatch({ type: 'voted', userChoice: choice, dilemma: data.dilemma });
        // Prefetch next dilemma silently
        const newSeenIds = [...new Set([...seenRef.current, data.dilemma.id])];
        prefetchNext(newSeenIds);
      }
    } catch { dispatch({ type: 'setVoting', voting: false }); }
  }, [state.dilemma, state.hasVoted, state.voting, sessionId, prefetchNext]);

  // ── Reveal animation ──────────────────────────────────────
  useEffect(() => {
    if (state.revealPhase === 'pulse') {
      const t = setTimeout(() => dispatch({ type: 'setRevealPhase', phase: 'counting' }), 800);
      return () => clearTimeout(t);
    }
    if (state.revealPhase === 'counting') {
      const total = state.liveVotesA + state.liveVotesB;
      const tA = total > 0 ? Math.round((state.liveVotesA / total) * 100) : 50;
      const tB = total > 0 ? Math.round((state.liveVotesB / total) * 100) : 50;
      let f = 0;
      const frames = 30;
      const iv = setInterval(() => {
        f++;
        const ease = 1 - Math.pow(1 - f / frames, 3);
        dispatch({ type: 'setDisplayPercents', a: Math.round(tA * ease), b: Math.round(tB * ease) });
        if (f >= frames) { clearInterval(iv); dispatch({ type: 'setDisplayPercents', a: tA, b: tB }); dispatch({ type: 'setRevealPhase', phase: 'done' }); }
      }, 30);
      return () => clearInterval(iv);
    }
  }, [state.revealPhase, state.liveVotesA, state.liveVotesB]);

  // ── Real-time polling ─────────────────────────────────────
  useEffect(() => {
    if (state.hasVoted && state.dilemma && state.revealPhase === 'done') {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/dilemma/vote?dilemmaId=${state.dilemma!.id}`);
          const d = await res.json();
          if (d.dilemma) {
            dispatch({ type: 'updateLiveVotes', votesA: d.dilemma.votesA, votesB: d.dilemma.votesB });
            const t = d.dilemma.votesA + d.dilemma.votesB;
            if (t > 0) dispatch({ type: 'setDisplayPercents', a: Math.round((d.dilemma.votesA / t) * 100), b: Math.round((d.dilemma.votesB / t) * 100) });
          }
        } catch { /* silent */ }
      }, 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [state.hasVoted, state.dilemma, state.revealPhase]);

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!state.timerActive || state.hasVoted) return;
    const iv = setInterval(() => dispatch({ type: 'tickTimer' }), 1000);
    return () => clearInterval(iv);
  }, [state.timerActive, state.hasVoted]);

  useEffect(() => {
    if (state.timerEnabled && state.timerSeconds === 0 && !state.hasVoted && !state.loading) fetchDilemma('random');
  }, [state.timerSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Go to next ─────────────────────────────────────────
  const goToNext = useCallback(() => {
    if (state.prefetchedDilemma) {
      dispatch({ type: 'setDilemma', dilemma: state.prefetchedDilemma });
      dispatch({ type: 'reset' });
      dispatch({ type: 'setPrefetched', dilemma: null });
      const newSeen = [...new Set([...seenRef.current, state.prefetchedDilemma.id])];
      prefetchNext(newSeen);
    } else {
      fetchDilemma('random');
    }
  }, [state.prefetchedDilemma, prefetchNext, fetchDilemma]);

  // ── Computed ──────────────────────────────────────────────
  const personality = useMemo(() => computePersonality(state.history), [state.history]);
  const totalLive = state.liveVotesA + state.liveVotesB;
  const isHot = totalLive >= 2 && Math.abs(state.displayPercentA - state.displayPercentB) <= 12;
  const isMinority = state.userChoice && state.revealPhase === 'done' && ((state.userChoice === 'A' && state.displayPercentA < 45) || (state.userChoice === 'B' && state.displayPercentB < 45));
  const isMajority = state.userChoice && state.revealPhase === 'done' && !isHot && ((state.userChoice === 'A' && state.displayPercentA > 55) || (state.userChoice === 'B' && state.displayPercentB > 55));

  // ── Loading state ─────────────────────────────────────────
  if (state.loading || !state.dilemma) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <motion.div animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <Scale className="w-10 h-10 text-violet-400" />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="dark:text-zinc-500 text-zinc-400 text-sm">
          Finding a dilemma worth your time...
        </motion.p>
      </div>
    );
  }

  const d = state.dilemma;
  const theme = getTheme(d.category);
  const timerProg = state.timerSeconds / TIMER_DURATION;

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto">
      {/* Timer toggle */}
      <div className="flex justify-end mb-3">
        <button onClick={() => dispatch({ type: 'toggleTimer' })} className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full transition-all ${state.timerEnabled ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'dark:bg-zinc-800/50 dark:border-zinc-700/30 dark:text-zinc-500 dark:hover:text-zinc-400 bg-zinc-100 border border-zinc-300/60 text-zinc-500 hover:text-zinc-700'}`}>
          {state.timerEnabled ? <Timer className="w-3 h-3" /> : <TimerOff className="w-3 h-3" />}
          {state.timerEnabled ? `${state.timerSeconds}s` : 'Pressure mode'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={d.id} initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.98 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

          {/* ── Glassmorphism question card ────────────────── */}
          <div className={`relative rounded-2xl overflow-hidden mb-6 ${theme.glow}`}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-[0.12]`} />
            <div className="absolute inset-0 rounded-2xl dark:border-white/[0.08] border-black/[0.07] border" />

            {/* Timer bar */}
            {state.timerEnabled && state.timerActive && !state.hasVoted && (
              <div className="absolute top-0 left-0 right-0 h-0.5 dark:bg-zinc-800 bg-zinc-200 overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-amber-400 to-red-500" initial={{ width: '100%' }} animate={{ width: `${timerProg * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            )}

            {/* Breathing ambient orbs */}
            <motion.div
              aria-hidden
              className="absolute -top-12 -left-8 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${orbColorA(theme)} 0%, transparent 65%)`, filter: 'blur(28px)', opacity: 0.55 }}
              animate={{ x: [0, 12, -8, 0], y: [0, -12, 10, 0], scale: [1, 1.08, 0.96, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-10 -right-6 w-44 h-44 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${orbColorB(theme)} 0%, transparent 65%)`, filter: 'blur(28px)', opacity: 0.45 }}
              animate={{ x: [0, -14, 8, 0], y: [0, 10, -12, 0], scale: [1, 0.92, 1.06, 1] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            />

            <div className="relative px-5 sm:px-8 py-6 sm:py-8">
              <div className="flex items-center justify-center gap-2 mb-5">
                <Badge className={`${theme.badge} text-[10px] font-medium tracking-wider uppercase border`}>{d.category || 'ethics'}</Badge>
                <span className="dark:text-zinc-700 text-zinc-400 text-[10px]">&bull;</span>
                <Badge className="dark:bg-zinc-800/40 dark:text-zinc-500 dark:border-zinc-700/30 bg-zinc-200/60 text-zinc-500 border-zinc-300/60 text-[10px] font-medium tracking-wider uppercase border">{d.difficulty || 'medium'}</Badge>
                {state.allSeen && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] border">revisited</Badge>}
              </div>
              <h2 className="text-center text-base sm:text-lg md:text-xl font-medium leading-relaxed dark:text-zinc-200 text-zinc-800 tracking-tight">{d.question}</h2>
            </div>
          </div>

          {/* ── Pre-vote live presence ──────────────────────── */}
          {!state.hasVoted && (state.liveVotesA + state.liveVotesB) > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] dark:text-zinc-500 text-zinc-400">
                {(state.liveVotesA + state.liveVotesB).toLocaleString()} people have faced this
              </span>
            </motion.div>
          )}

          {/* ── Choice buttons ─────────────────────────────── */}
          <div className="relative flex flex-col gap-2.5 mb-5">
            {/* Vote burst ring */}
            {voteBurst && (
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-2xl pointer-events-none"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                style={{ border: `2px solid ${orbColorA(theme)}`, boxShadow: `0 0 30px ${orbColorA(theme)}` }}
              />
            )}
            <ChoiceBtn label={d.optionA} side="A" theme={theme} state={state} onVote={() => vote('A')} />
            {!state.hasVoted && (
              <div className="flex items-center justify-center py-0.5">
                <div className="h-px w-10 dark:bg-zinc-800/60 bg-zinc-300/70" /><span className="px-3 text-[10px] dark:text-zinc-600 text-zinc-400 font-medium tracking-[0.2em] uppercase">or</span><div className="h-px w-10 dark:bg-zinc-800/60 bg-zinc-300/70" />
              </div>
            )}
            <ChoiceBtn label={d.optionB} side="B" theme={theme} state={state} onVote={() => vote('B')} />
          </div>

          {/* ── Post-vote reveal ───────────────────────────── */}
          <AnimatePresence>
            {state.hasVoted && state.revealPhase !== 'idle' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.5, delay: 0.2 }} className="overflow-hidden">
                {state.revealPhase === 'pulse' && (
                  <motion.div className="text-center py-6" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }} transition={{ duration: 0.8 }}>
                    <p className="text-zinc-400 text-sm animate-pulse">Revealing what others think...</p>
                  </motion.div>
                )}

                {(state.revealPhase === 'counting' || state.revealPhase === 'done') && (
                  <div className="space-y-4">
                    {/* Crowd dots visualization */}
                    <CrowdDots pctA={state.displayPercentA} theme={theme} />

                    {/* Percentage read-out */}
                    <div className="flex items-center justify-between max-w-sm mx-auto px-1">
                      <span className={`text-sm font-bold tabular-nums bg-gradient-to-r ${theme.accentA} bg-clip-text text-transparent`}>{state.displayPercentA}%</span>
                      <span className="text-[10px] dark:text-zinc-600 text-zinc-400 uppercase tracking-wider">vs</span>
                      <span className={`text-sm font-bold tabular-nums bg-gradient-to-r ${theme.accentB} bg-clip-text text-transparent`}>{state.displayPercentB}%</span>
                    </div>

                    {/* Badges row */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="dark:text-zinc-500 text-zinc-400 text-xs tabular-nums flex items-center gap-1">
                        <Users className="w-3 h-3" />{totalLive.toLocaleString()} {totalLive === 1 ? 'vote' : 'votes'}
                      </span>
                      {isHot && state.revealPhase === 'done' && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}>
                          <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/25 text-[10px] border gap-1"><Flame className="w-2.5 h-2.5" /> Divisive</Badge>
                        </motion.span>
                      )}
                      {isMinority && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.7 }}>
                          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/25 text-[10px] border">You&apos;re in the minority</Badge>
                        </motion.span>
                      )}
                      {isMajority && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.7 }}>
                          <Badge className="dark:bg-zinc-700/50 dark:text-zinc-300 dark:border-zinc-500/30 bg-zinc-200/80 text-zinc-600 border-zinc-300/60 text-[10px] border">With the crowd</Badge>
                        </motion.span>
                      )}
                    </div>

                    {/* Argument cards */}
                    {state.revealPhase === 'done' && (d.argumentA || d.argumentB) && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {d.argumentA && (
                          <div className={`relative rounded-xl ${theme.tintA} dark:border-zinc-800/40 border-zinc-200/80 border p-4 overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.accentA}`} />
                            <p className="text-[11px] dark:text-zinc-400 text-zinc-500 font-semibold uppercase tracking-wider mb-2">Case for A</p>
                            <p className="text-[13px] dark:text-zinc-300 text-zinc-700 leading-relaxed">{d.argumentA}</p>
                          </div>
                        )}
                        {d.argumentB && (
                          <div className={`relative rounded-xl ${theme.tintB} dark:border-zinc-800/40 border-zinc-200/80 border p-4 overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.accentB}`} />
                            <p className="text-[11px] dark:text-zinc-400 text-zinc-500 font-semibold uppercase tracking-wider mb-2">Case for B</p>
                            <p className="text-[13px] dark:text-zinc-300 text-zinc-700 leading-relaxed">{d.argumentB}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Next dilemma teaser */}
                    {state.revealPhase === 'done' && (
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }} className="pt-2">
                        {state.prefetchedDilemma ? (
                          <NextTeaser dilemma={state.prefetchedDilemma} theme={theme} onReveal={goToNext} />
                        ) : (
                          <div className="text-center">
                            <Button variant="ghost" onClick={goToNext} className="dark:text-zinc-400 dark:hover:text-white text-zinc-500 hover:text-zinc-900 min-h-[44px] text-sm">
                              <RefreshCw className="w-3.5 h-3.5 mr-2" />Next dilemma
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* ── Personality card ──────────────────────────────── */}
      {personality && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 rounded-xl dark:border-zinc-800/40 border-zinc-200 border p-4 ${theme.tintA}`}
          style={{ background: 'var(--curio-bg-elevated)' }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.gradient} opacity-80 flex items-center justify-center`}>
              <personality.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold dark:text-zinc-200 text-zinc-800">{personality.label}</p>
              <p className="text-[11px] dark:text-zinc-500 text-zinc-400">Based on {state.history.length} decisions</p>
            </div>
          </div>
          <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed">{personality.description}</p>
        </motion.div>
      )}

      {/* ── History ──────────────────────────────────────── */}
      {state.history.length > 0 && (
        <div className="mt-5 dark:border-zinc-800/40 border-zinc-200 border-t pt-4">
          <button onClick={() => dispatch({ type: 'toggleHistory' })} className="flex items-center gap-2 dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-500 hover:text-zinc-700 transition-colors text-xs w-full">
            <History className="w-3.5 h-3.5" /><span className="font-medium">Your decisions ({state.history.length})</span>
            {state.showHistory ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
          </button>
          <AnimatePresence>
            {state.showHistory && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {state.history.map((entry, i) => {
                    const et = getTheme(entry.category);
                    const tot = entry.votesA + entry.votesB;
                    const pA = tot > 0 ? Math.round((entry.votesA / tot) * 100) : 50;
                    const pB = tot > 0 ? Math.round((entry.votesB / tot) * 100) : 50;
                    const chose = entry.userChoice === 'A' ? entry.optionA : entry.optionB;
                    const pct = entry.userChoice === 'A' ? pA : pB;
                    return (
                      <motion.div key={entry.id + '-' + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="dark:bg-zinc-900/40 bg-zinc-50 rounded-lg px-3 py-2.5 dark:border-zinc-800/30 border-zinc-200/80 border">
                        <p className="text-[11px] dark:text-zinc-400 text-zinc-600 line-clamp-2 mb-1.5">{entry.question}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${et.badge} border`}>{entry.category}</span>
                          <span className="text-[10px] dark:text-zinc-500 text-zinc-500">Chose: <span className="dark:text-zinc-300 text-zinc-700 font-medium">{chose}</span></span>
                          <span className="text-[10px] dark:text-zinc-600 text-zinc-400 ml-auto tabular-nums">{pct}%</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Orb color helpers ──────────────────────────────────────────
function orbColorA(theme: ReturnType<typeof getTheme>): string {
  // Extract first gradient color approximate hex from tailwind class
  const map: Record<string, string> = {
    'from-violet-600': 'rgba(124,58,237,0.55)', 'from-amber-500': 'rgba(245,158,11,0.55)',
    'from-rose-500': 'rgba(244,63,94,0.55)', 'from-blue-500': 'rgba(59,130,246,0.55)',
    'from-emerald-500': 'rgba(16,185,129,0.55)', 'from-sky-500': 'rgba(14,165,233,0.55)',
    'from-lime-500': 'rgba(132,204,22,0.55)', 'from-red-500': 'rgba(239,68,68,0.55)',
    'from-purple-500': 'rgba(168,85,247,0.55)',
  };
  const key = theme.gradient.split(' ')[0];
  return map[key] || 'rgba(139,92,246,0.55)';
}
function orbColorB(theme: ReturnType<typeof getTheme>): string {
  const map: Record<string, string> = {
    'to-fuchsia-500': 'rgba(217,70,239,0.45)', 'to-orange-500': 'rgba(249,115,22,0.45)',
    'to-pink-500': 'rgba(236,72,153,0.45)', 'to-cyan-500': 'rgba(6,182,212,0.45)',
    'to-teal-500': 'rgba(20,184,166,0.45)', 'to-indigo-500': 'rgba(99,102,241,0.45)',
    'to-green-500': 'rgba(34,197,94,0.45)', 'to-rose-500': 'rgba(244,63,94,0.45)',
    'to-violet-500': 'rgba(139,92,246,0.45)',
  };
  const key = theme.gradient.split(' ')[1];
  return map[key] || 'rgba(217,70,239,0.45)';
}

// ── Crowd dots ──────────────────────────────────────────────────
function CrowdDots({ pctA, theme }: { pctA: number; theme: ReturnType<typeof getTheme> }) {
  const TOTAL = 60;
  const aCount = Math.round((pctA / 100) * TOTAL);
  return (
    <div className="flex flex-wrap justify-center gap-1 py-1 px-2">
      {Array.from({ length: TOTAL }).map((_, i) => {
        const isA = i < aCount;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: isA ? 0.85 : 0.65 }}
            transition={{ delay: i * 0.012, type: 'spring', stiffness: 400, damping: 22 }}
            className={`w-2 h-2 rounded-full flex-shrink-0 bg-gradient-to-br ${isA ? theme.accentA : theme.accentB}`}
          />
        );
      })}
    </div>
  );
}

// ── Next dilemma teaser ─────────────────────────────────────────
function NextTeaser({
  dilemma, theme, onReveal
}: { dilemma: Dilemma; theme: ReturnType<typeof getTheme>; onReveal: () => void }) {
  const [hovered, setHovered] = useState(false);
  const t = getTheme(dilemma.category);
  return (
    <motion.button
      onClick={onReveal}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full group relative rounded-xl overflow-hidden text-left transition-all duration-300"
      style={{
        background: 'var(--curio-bg-elevated)',
        border: `1px solid ${hovered ? orbColorA(theme) + '60' : 'var(--curio-border-subtle)'}`,
        boxShadow: hovered ? `0 0 24px ${orbColorA(theme)}25` : 'none',
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Top accent strip */}
      <div className={`h-px w-full bg-gradient-to-r ${t.gradient} opacity-60`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider dark:text-zinc-500 text-zinc-400 flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> Next up
          </span>
          <ChevronRight className="w-3.5 h-3.5 dark:text-zinc-600 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <p
          className="text-sm dark:text-zinc-300 text-zinc-700 leading-snug transition-all duration-400"
          style={{ filter: hovered ? 'blur(0)' : 'blur(4px)' }}
        >
          {dilemma.question}
        </p>
        {!hovered && (
          <p className="text-[11px] dark:text-zinc-600 text-zinc-400 mt-1.5">Hover to peek →</p>
        )}
      </div>
    </motion.button>
  );
}

// ── Choice button ───────────────────────────────────────────────
function ChoiceBtn({ label, side, theme, state, onVote }: {
  label: string; side: 'A' | 'B'; theme: ReturnType<typeof getTheme>;
  state: AppState; onVote: () => void;
}) {
  const isChosen = state.userChoice === side;
  const accent = side === 'A' ? theme.accentA : theme.accentB;
  const show = state.revealPhase === 'counting' || state.revealPhase === 'done';
  const pct = side === 'A' ? state.displayPercentA : state.displayPercentB;

  return (
    <motion.button
      whileHover={!state.hasVoted ? { scale: 1.01, y: -1 } : {}}
      whileTap={!state.hasVoted ? { scale: 0.99 } : {}}
      onClick={onVote}
      disabled={state.hasVoted || state.voting}
      className={`relative overflow-hidden rounded-xl text-left transition-all duration-300 ${state.hasVoted ? (isChosen ? 'ring-1 ring-white/20' : 'opacity-60') : 'hover:ring-1 hover:ring-white/10 cursor-pointer'}`}
    >
      {state.hasVoted && show && <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${accent} transition-all duration-500`} style={{ width: `${pct}%`, opacity: isChosen ? 0.25 : 0.1 }} />}
      {state.hasVoted && state.revealPhase === 'pulse' && isChosen && (
        <motion.div className={`absolute inset-0 bg-gradient-to-r ${accent}`} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 0.8 }} />
      )}
      <div className={`relative px-4 sm:px-5 py-4 sm:py-5 ${!state.hasVoted ? `bg-gradient-to-r ${accent} opacity-90 hover:opacity-100` : 'dark:bg-zinc-800/50 bg-zinc-100/80'}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-medium text-sm sm:text-base ${state.hasVoted && !isChosen ? 'dark:text-zinc-400 text-zinc-500' : 'text-white'}`}>{label}</span>
          {state.hasVoted && show && (
            <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className={`text-sm font-bold tabular-nums shrink-0 ${isChosen ? 'text-white' : 'dark:text-zinc-500 text-zinc-400'}`}>{pct}%</motion.span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
