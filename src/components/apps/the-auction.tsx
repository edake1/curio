'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RotateCcw, Minus, Plus } from 'lucide-react';

// ── design tokens ────────────────────────────────────────────
const IVORY  = 'var(--curio-text, #e8e0d4)';
const MUTED  = 'var(--curio-muted, #a09882)';
const FAINT  = 'rgba(222,198,163,0.10)';
const BG     = 'var(--curio-card, rgba(30,30,28,0.55))';
const GOLD   = '#eab308';
const GOLD_D = 'rgba(234,179,8,0.08)';
const GOLD_B = 'rgba(234,179,8,0.18)';

// ── auction items ────────────────────────────────────────────
interface AuctionItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const ITEMS: AuctionItem[] = [
  { id: 'year',       emoji: '⏳', name: 'One Extra Year of Life',       description: 'Added to the end, in full health.' },
  { id: 'memory',     emoji: '🧠', name: 'Perfect Memory',              description: 'Remember everything. Forget nothing. Ever.' },
  { id: 'talent',     emoji: '🎸', name: 'World-Class Talent',          description: 'Instant mastery of one creative skill.' },
  { id: 'love',       emoji: '❤️', name: 'Guaranteed Love',             description: 'One person who will never stop loving you.' },
  { id: 'truth',      emoji: '🪞', name: 'Know the Full Truth',         description: 'About one question. Any question.' },
  { id: 'peace',      emoji: '🕊️', name: 'Permanent Inner Peace',       description: 'No anxiety, no regret, no restless nights.' },
  { id: 'wealth',     emoji: '💰', name: 'Unlimited Wealth',            description: 'Money is never a concern again.' },
  { id: 'influence',  emoji: '📢', name: 'Genuine Influence',           description: 'People listen when you speak. Really listen.' },
  { id: 'rewind',     emoji: '⏪', name: 'Relive One Day',              description: 'Go back to any single day and live it again.' },
  { id: 'invisible',  emoji: '👻', name: '24 Hours of Invisibility',    description: 'One full day, unseen by everyone.' },
];

const TOTAL_TOKENS = 100;

// ── main ─────────────────────────────────────────────────────
type Phase = 'bidding' | 'analyzing' | 'results';

export function TheAuctionApp() {
  const [bids, setBids] = useState<Record<string, number>>(() =>
    Object.fromEntries(ITEMS.map(i => [i.id, 0]))
  );
  const [phase, setPhase] = useState<Phase>('bidding');
  const [analysis, setAnalysis] = useState('');

  const spent = useMemo(() => Object.values(bids).reduce((a, b) => a + b, 0), [bids]);
  const remaining = TOTAL_TOKENS - spent;

  const adjust = useCallback((id: string, delta: number) => {
    setBids(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const totalAfter = spent - current + next;
      if (totalAfter > TOTAL_TOKENS) return prev;
      return { ...prev, [id]: next };
    });
  }, [spent]);

  const submit = useCallback(async () => {
    setPhase('analyzing');
    try {
      const payload = ITEMS.map(i => ({ item: i.name, tokens: bids[i.id] || 0 }));
      const res = await fetch('/api/generate/auction-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bids: payload }),
      });
      const data = await res.json();
      setAnalysis(data.analysis || 'Your choices speak for themselves.');
    } catch {
      setAnalysis('Your choices speak for themselves.');
    }
    setPhase('results');
  }, [bids]);

  const reset = useCallback(() => {
    setBids(Object.fromEntries(ITEMS.map(i => [i.id, 0])));
    setAnalysis('');
    setPhase('bidding');
  }, []);

  const sortedBids = useMemo(() =>
    ITEMS.map(i => ({ ...i, tokens: bids[i.id] || 0 })).sort((a, b) => b.tokens - a.tokens),
    [bids]
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: IVORY }}>
          The Auction
        </h2>
        <p className="text-xs tracking-wider" style={{ color: MUTED }}>
          100 tokens. 10 items. What do you value most?
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── BIDDING PHASE ── */}
        {phase === 'bidding' && (
          <motion.div key="bid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Token bar */}
            <div className="rounded-xl p-3 flex items-center justify-between"
              style={{ background: BG, border: `1px solid ${FAINT}` }}>
              <span className="text-xs tracking-wider" style={{ color: MUTED }}>Tokens remaining</span>
              <span className="text-lg font-bold tabular-nums"
                style={{ color: remaining === 0 ? GOLD : remaining < 20 ? '#f97316' : IVORY }}>
                {remaining}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {ITEMS.map((item, idx) => {
                const tokens = bids[item.id] || 0;
                const barWidth = tokens > 0 ? `${(tokens / TOTAL_TOKENS) * 100}%` : '0%';
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-xl p-3 relative overflow-hidden"
                    style={{ background: BG, border: `1px solid ${tokens > 0 ? GOLD_B : FAINT}` }}>

                    {/* Fill bar behind content */}
                    <motion.div
                      className="absolute inset-y-0 left-0"
                      animate={{ width: barWidth }}
                      transition={{ duration: 0.3 }}
                      style={{ background: GOLD_D, pointerEvents: 'none' }}
                    />

                    <div className="relative flex items-center gap-3">
                      <span className="text-lg shrink-0">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: IVORY }}>{item.name}</div>
                        <div className="text-[10px] truncate" style={{ color: FAINT }}>{item.description}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => adjust(item.id, -5)} disabled={tokens === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
                          style={{ background: FAINT, color: MUTED }}>
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold tabular-nums"
                          style={{ color: tokens > 0 ? GOLD : FAINT }}>
                          {tokens}
                        </span>
                        <button onClick={() => adjust(item.id, 5)} disabled={remaining < 5}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
                          style={{ background: GOLD_D, color: GOLD, border: `1px solid ${GOLD_B}` }}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Submit */}
            <div className="text-center pt-2">
              <button onClick={submit} disabled={spent === 0}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all disabled:opacity-30 inline-flex items-center gap-2"
                style={{ background: GOLD_D, color: GOLD, border: `1px solid ${GOLD_B}` }}>
                Reveal What Your Bids Say
              </button>
              {spent === 0 && (
                <p className="text-[10px] mt-2" style={{ color: FAINT }}>Bid at least some tokens to continue</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ANALYZING ── */}
        {phase === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-16 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: GOLD }} />
            <p className="text-xs italic" style={{ color: MUTED }}>Analyzing your desires…</p>
          </motion.div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-5">

            {/* Bid summary */}
            <div className="rounded-2xl p-5 space-y-3"
              style={{ background: BG, border: `1px solid ${GOLD_B}` }}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-center mb-3" style={{ color: FAINT }}>
                Your Allocation
              </div>
              {sortedBids.filter(b => b.tokens > 0).map((b, i) => (
                <motion.div key={b.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3">
                  <span className="text-base">{b.emoji}</span>
                  <span className="flex-1 text-sm truncate" style={{ color: IVORY }}>{b.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: FAINT }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${b.tokens}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06 }}
                        className="h-full rounded-full"
                        style={{ background: GOLD }}
                      />
                    </div>
                    <span className="text-xs font-bold tabular-nums w-6 text-right" style={{ color: GOLD }}>
                      {b.tokens}
                    </span>
                  </div>
                </motion.div>
              ))}
              {sortedBids.filter(b => b.tokens === 0).length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: FAINT }}>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: FAINT }}>
                    Left behind
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sortedBids.filter(b => b.tokens === 0).map(b => (
                      <span key={b.id} className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: FAINT, color: MUTED }}>
                        {b.emoji} {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl p-5 text-center"
              style={{ background: GOLD_D, border: `1px solid ${GOLD_B}` }}>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: GOLD }}>
                What your bids reveal
              </div>
              <p className="text-sm leading-relaxed" style={{ color: IVORY }}>
                {analysis}
              </p>
            </motion.div>

            {/* Reset */}
            <div className="text-center">
              <button onClick={reset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all"
                style={{ background: GOLD_D, color: GOLD, border: `1px solid ${GOLD_B}` }}>
                <RotateCcw className="w-3.5 h-3.5" /> Auction Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
