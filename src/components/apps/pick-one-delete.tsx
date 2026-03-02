'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { getSessionId } from '@/lib/session';
import type { DeleteChoice } from '@/lib/types';

// ── design tokens ────────────────────────────────────────────
const IVORY = 'var(--curio-text, #e8e0d4)';
const MUTED = 'var(--curio-muted, #a09882)';
const FAINT = 'rgba(222,198,163,0.10)';
const BG    = 'var(--curio-card, rgba(30,30,28,0.55))';

const RED    = '#ef4444';
const RED_D  = 'rgba(239,68,68,0.08)';
const RED_B  = 'rgba(239,68,68,0.18)';
const ORG    = '#f97316';
const ORG_D  = 'rgba(249,115,22,0.08)';
const ORG_B  = 'rgba(249,115,22,0.18)';

// ── category colors ──────────────────────────────────────────
const CAT_CLR: Record<string, string> = {
  technology: '#06b6d4', society: '#a78bfa', existence: '#f87171',
  culture: '#fb923c', nature: '#34d399',
};

// ── localStorage helpers ─────────────────────────────────────
const HIST_KEY = 'curio-pod-history';
type HistEntry = { a: string; b: string; picked: 'A' | 'B'; cat: string };

function getHist(): HistEntry[] {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
}
function saveHist(h: HistEntry[]) {
  localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 50)));
}

// ── main ─────────────────────────────────────────────────────
export function PickOneDeleteApp() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [choice, setChoice] = useState<DeleteChoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userChoice, setUserChoice] = useState<'A' | 'B' | null>(null);
  const [streak, setStreak] = useState(0);
  const [hist, setHist] = useState<HistEntry[]>([]);
  const [showHist, setShowHist] = useState(false);
  const initRef = useRef(false);

  // Hydrate history
  useEffect(() => { setHist(getHist()); }, []);

  // Fetch first choice
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      fetch('/api/delete-choice')
        .then(r => r.json())
        .then(d => { setChoice(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, []);

  const vote = useCallback(async (selected: 'A' | 'B') => {
    if (!choice || hasVoted || voting) return;
    setVoting(true);
    try {
      const res = await fetch('/api/delete-choice/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteChoiceId: choice.id, choice: selected, sessionId }),
      });
      const data = await res.json();
      if (data.deleteChoice) {
        setChoice(data.deleteChoice);
        setUserChoice(selected);
        setHasVoted(true);
        setStreak(s => s + 1);
        const entry: HistEntry = { a: choice.optionA, b: choice.optionB, picked: selected, cat: choice.category };
        setHist(prev => { const next = [entry, ...prev].slice(0, 50); saveHist(next); return next; });
      }
    } catch { /* silent */ }
    setVoting(false);
  }, [choice, hasVoted, voting, sessionId]);

  const nextChoice = useCallback(async () => {
    setHasVoted(false);
    setUserChoice(null);
    setLoading(true);
    try {
      const res = await fetch('/api/delete-choice');
      const data = await res.json();
      setChoice(data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  // ── derived ────────────────────────────────────────────────
  const totalVotes = choice ? choice.votesA + choice.votesB : 0;
  const pA = totalVotes > 0 ? Math.round((choice!.votesA / totalVotes) * 100) : 50;
  const pB = totalVotes > 0 ? Math.round((choice!.votesB / totalVotes) * 100) : 50;
  const catClr = choice ? (CAT_CLR[choice.category] || MUTED) : MUTED;

  // ── render ─────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: IVORY }}>
          Pick One to Delete
        </h2>
        <p className="text-xs tracking-wider" style={{ color: MUTED }}>
          Your choice is permanent and affects everyone.
        </p>
      </div>

      {/* Toolbar: streak + history toggle */}
      <div className="flex justify-center items-center gap-4">
        {streak > 0 && (
          <span className="text-[10px] tracking-widest tabular-nums" style={{ color: FAINT }}>
            {streak} deleted this session
          </span>
        )}
        {hist.length > 0 && (
          <button onClick={() => setShowHist(!showHist)}
            className="text-[10px] tracking-widest underline decoration-dotted underline-offset-2 transition-colors"
            style={{ color: showHist ? RED : MUTED }}>
            {showHist ? 'Hide history' : `History (${hist.length})`}
          </button>
        )}
      </div>

      {/* History drawer */}
      <AnimatePresence>
        {showHist && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: BG, border: `1px solid ${FAINT}` }}>
              {hist.map((h, i) => {
                const deleted = h.picked === 'A' ? h.a : h.b;
                const kept    = h.picked === 'A' ? h.b : h.a;
                const cClr    = CAT_CLR[h.cat] || MUTED;
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px]"
                    style={{ color: MUTED }}>
                    <Trash2 className="w-3 h-3 shrink-0" style={{ color: RED }} />
                    <span style={{ color: RED, textDecoration: 'line-through' }}>{deleted}</span>
                    <span style={{ color: FAINT }}>→ kept</span>
                    <span style={{ color: IVORY }}>{kept}</span>
                    <span className="ml-auto text-[9px] uppercase tracking-widest" style={{ color: cClr }}>{h.cat}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading || !choice ? (
        <div className="flex flex-col items-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: RED }} />
          <p className="text-xs italic" style={{ color: FAINT }}>Loading a dilemma…</p>
        </div>
      ) : (
        <>
          {/* Category badge */}
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full"
              style={{ color: catClr, background: catClr + '12', border: `1px solid ${catClr}20` }}>
              {choice.category}
            </span>
          </div>

          {/* Description */}
          {choice.description && (
            <p className="text-center text-sm" style={{ color: MUTED }}>
              {choice.description}
            </p>
          )}

          {/* VS buttons */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div key={choice.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} className="space-y-3">

                {/* Option A */}
                <OptionButton
                  label={choice.optionA}
                  side="A"
                  color={RED} colorDim={RED_D} colorBrd={RED_B}
                  hasVoted={hasVoted} userChoice={userChoice} voting={voting}
                  percent={pA}
                  onVote={() => vote('A')}
                />

                {/* VS divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: FAINT }} />
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: FAINT }}>
                    or
                  </span>
                  <div className="flex-1 h-px" style={{ background: FAINT }} />
                </div>

                {/* Option B */}
                <OptionButton
                  label={choice.optionB}
                  side="B"
                  color={ORG} colorDim={ORG_D} colorBrd={ORG_B}
                  hasVoted={hasVoted} userChoice={userChoice} voting={voting}
                  percent={pB}
                  onVote={() => vote('B')}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Results panel */}
          <AnimatePresence>
            {hasVoted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-center">

                {/* Split bar */}
                <div className="rounded-full overflow-hidden flex h-2" style={{ background: FAINT }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pA}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ background: RED }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pB}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ background: ORG }} />
                </div>

                {/* Labels */}
                <div className="flex justify-between text-[10px] tabular-nums" style={{ color: MUTED }}>
                  <span><span style={{ color: RED }}>{pA}%</span> deleted {choice.optionA}</span>
                  <span>{choice.optionB} <span style={{ color: ORG }}>{pB}%</span></span>
                </div>

                <p className="text-xs tabular-nums" style={{ color: FAINT }}>
                  {totalVotes.toLocaleString()} total vote{totalVotes !== 1 ? 's' : ''}
                </p>

                {/* Next button */}
                <button onClick={nextChoice}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all"
                  style={{ background: RED_D, color: RED, border: `1px solid ${RED_B}` }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Next Dilemma
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ── option button ────────────────────────────────────────────
function OptionButton({ label, side, color, colorDim, colorBrd, hasVoted, userChoice, voting, percent, onVote }: {
  label: string; side: 'A' | 'B'; color: string; colorDim: string; colorBrd: string;
  hasVoted: boolean; userChoice: 'A' | 'B' | null; voting: boolean; percent: number;
  onVote: () => void;
}) {
  const isChosen  = hasVoted && userChoice === side;
  const isDimmed  = hasVoted && userChoice !== side;

  return (
    <motion.button
      onClick={onVote}
      disabled={hasVoted || voting}
      whileTap={hasVoted ? {} : { scale: 0.97 }}
      className="w-full text-left rounded-xl p-4 sm:p-5 transition-all relative overflow-hidden"
      style={{
        background: isChosen ? colorDim : isDimmed ? BG : colorDim,
        border: `1px solid ${isChosen ? colorBrd : isDimmed ? FAINT : colorBrd}`,
        opacity: isDimmed ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: isChosen ? color : isDimmed ? FAINT : `${color}20`, transition: 'background 0.3s' }}>
          <Trash2 className="w-4 h-4" style={{ color: isChosen || isDimmed ? 'white' : color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5"
            style={{ color: isDimmed ? FAINT : `${color}aa` }}>
            {hasVoted && isChosen ? 'Deleted' : 'Delete'}
          </div>
          <div className="text-sm sm:text-base font-semibold"
            style={{
              color: isDimmed ? MUTED : IVORY,
              textDecoration: isChosen ? 'line-through' : 'none',
              textDecorationColor: color,
            }}>
            {label}
          </div>
        </div>
        {hasVoted && (
          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-lg font-bold tabular-nums shrink-0"
            style={{ color: isChosen ? color : FAINT }}>
            {percent}%
          </motion.span>
        )}
      </div>

      {/* Background fill on vote */}
      {isChosen && (
        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 rounded-xl"
          style={{ background: `${color}08`, pointerEvents: 'none' }}
        />
      )}
    </motion.button>
  );
}
