'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2, Trash2, Skull, X } from 'lucide-react';
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
const GREEN  = '#4ade80';
const GREEN_D = 'rgba(74,222,128,0.08)';

// ── category colors ──────────────────────────────────────────
const CAT_CLR: Record<string, string> = {
  technology: '#06b6d4', society: '#a78bfa', existence: '#f87171',
  culture: '#fb923c', nature: '#34d399',
};

// ── consequence strings (keyed by lowercased option text) ────
const CONSEQUENCES: Record<string, string> = {
  'personal privacy': 'Every thought, search, and message becomes public. Whistleblowers vanish. Relationships are stripped bare. No secret is safe — including yours.',
  'national secrets': 'Every classified document goes public overnight. Intelligence operations collapse. Alliances shatter. The powerful lose their greatest weapon: information asymmetry.',
  'all social media platforms': 'Billions lose their primary connection to friends, news, and community. Small businesses collapse. Movements lose their megaphone. Loneliness spikes — or maybe it drops.',
  'all streaming services': 'No more Netflix, Spotify, YouTube. Theaters return. Piracy surges. An entire generation discovers boredom — and maybe books.',
  'the concept of money': 'Trade reverts to barter. Inequality becomes about physical power. Hospitals, schools, governments — everything built on currency — collapses overnight.',
  'the concept of government': 'No laws. No borders. No police. Communities self-organize or descend into chaos. Freedom is absolute. Safety is not.',
  'human ability to lie': 'Every thought is transparent. Diplomacy dies. Relationships either deepen or shatter. Politics becomes unbearably honest.',
  'human ability to feel physical pain': 'You can\'t feel fire, infection, or broken bones. Injuries go unnoticed until fatal. Empathy for suffering evaporates.',
  'all nuclear weapons': 'Mutually assured destruction ends. But so does the uneasy peace it maintained. Conventional wars become tempting again.',
  'all ai technology': 'Self-driving cars, medical diagnostics, translation — gone. But so are deepfakes, surveillance AI, and algorithmic manipulation.',
  'all religions': 'Billions lose their source of meaning, community, and moral framework. Some feel liberated. Others feel utterly lost.',
  'all countries/borders': 'No passports, no immigration. Resources flow freely. But so do conflicts — with no nation to claim responsibility.',
  'the aging process': 'Nobody gets old. But the population explodes. Resources shrink. Death still comes — just not slowly. Overpopulation becomes the new existential threat.',
  'the need for sleep': '8 extra hours a day for everyone. Productivity doubles. But so does work expectations. Rest becomes a forgotten concept.',
  'all video games': 'A $200 billion industry vanishes. Millions lose their escape, their community, their creative outlet. Esports athletes become historians.',
  'all professional sports': 'No Olympics. No World Cup. No Super Bowl. Athletic excellence loses its stage. National unity rituals disappear.',
  'the internet': 'Libraries matter again. Letters return. Knowledge becomes local. Connection becomes physical. Globalization reverses overnight.',
  'air travel': 'The world shrinks back. Families separated by oceans stay separated. Trade slows. But carbon emissions plummet.',
  'jealousy': 'Competition fades. Ambition weakens. Relationships become more peaceful — but also less passionate.',
  'greed': 'Capitalism loses its engine. Innovation slows. But inequality shrinks dramatically. Sharing becomes instinctive.',
  'coffee': '2.25 billion cups a day — gone. Productivity crashes. Mornings become hostile. An entire global economy collapses.',
  'alcohol': 'Bars close. Drunk driving ends. But so do toasts, celebrations, and liquid courage. Addiction shifts elsewhere.',
  'death': 'Nobody dies. Ever. The population explodes. Resources run out. Immortality becomes a prison, not a gift.',
  'birth (no new humans)': 'The last generation. Every child alive today is the youngest human who will ever exist. Culture becomes a museum.',
  'the ability to fall in love': 'Partnerships become transactional. Art loses its deepest theme. Heartbreak ends — but so does the highest high.',
  'the ability to have children': 'The human race has an expiration date. Legacy becomes about ideas, not bloodlines. Adoption becomes everything.',
  'human violence': 'No war. No murder. No abuse. But self-defense becomes impossible. Nature remains violent. Only humans are disarmed.',
  'human sadness': 'Joy loses its contrast. Empathy becomes shallow. Art becomes hollow. You can\'t miss what you\'ve never lost.',
};

function getConsequence(option: string): string {
  const key = option.toLowerCase().trim();
  return CONSEQUENCES[key] || `Without "${option}," the world reshapes itself in ways no one predicted. Every absence creates a presence.`;
}

// ── philosophical closers ────────────────────────────────────
const CLOSERS = [
  'Every choice reveals what you value.',
  'You can\'t delete without consequence.',
  'What survives says more than what\'s destroyed.',
  'The things we erase define us as much as the things we keep.',
  'There is no delete button without a scar.',
  'Destruction is the shadow of creation.',
];

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
  const closerIdx = useMemo(() => Math.floor(Math.random() * CLOSERS.length), []);

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

      {/* Toolbar: kill count + graveyard toggle */}
      <div className="flex justify-center items-center gap-4">
        {streak > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] tracking-widest tabular-nums" style={{ color: RED }}>
            <Skull className="w-3 h-3" /> {streak} erased
          </span>
        )}
        {hist.length > 0 && (
          <button onClick={() => setShowHist(!showHist)}
            className="text-[10px] tracking-widest underline decoration-dotted underline-offset-2 transition-colors"
            style={{ color: showHist ? RED : MUTED }}>
            {showHist ? 'Close graveyard' : `The Graveyard (${hist.length})`}
          </button>
        )}
      </div>

      {/* Graveyard drawer */}
      <AnimatePresence>
        {showHist && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="rounded-2xl p-4 space-y-2" style={{ background: BG, border: `1px solid ${FAINT}` }}>
              <p className="text-[9px] uppercase tracking-[0.2em] text-center mb-2" style={{ color: FAINT }}>
                ☠ Things you erased from existence ☠
              </p>
              {hist.map((h, i) => {
                const deleted = h.picked === 'A' ? h.a : h.b;
                const kept    = h.picked === 'A' ? h.b : h.a;
                const cClr    = CAT_CLR[h.cat] || MUTED;
                const isLatest = i === 0 && hasVoted;
                return (
                  <motion.div key={`${i}-${deleted}`}
                    initial={isLatest ? { opacity: 0, x: -10 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-[11px] min-w-0 py-1 rounded-lg px-2 transition-colors"
                    style={{ color: MUTED, background: isLatest ? `${RED}10` : 'transparent' }}>
                    <X className="w-3 h-3 shrink-0" style={{ color: RED }} />
                    <span className="truncate font-medium" style={{ color: RED, textDecoration: 'line-through', textDecorationColor: `${RED}60` }}>{deleted}</span>
                    <span className="shrink-0 text-[9px]" style={{ color: FAINT }}>kept</span>
                    <span className="truncate" style={{ color: IVORY }}>{kept}</span>
                    <span className="ml-auto shrink-0 text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                      style={{ color: cClr, background: `${cClr}12` }}>{h.cat}</span>
                  </motion.div>
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
            {hasVoted && choice && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-5">

                {/* ── Consequence card ─────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: BG, border: `1px solid ${FAINT}` }}>
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at top, ${RED} 0%, transparent 70%)` }} />
                  <p className="text-[9px] uppercase tracking-[0.2em] mb-2 font-semibold" style={{ color: RED }}>
                    ☠ Consequence
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: IVORY }}>
                    {getConsequence(userChoice === 'A' ? choice.optionA : choice.optionB)}
                  </p>
                </motion.div>

                {/* ── "The world chose" moment ────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                  className="text-center space-y-1">
                  <p className="text-[15px] sm:text-[17px] font-bold" style={{ color: IVORY }}>
                    {(userChoice === 'A' ? pA : pB) >= 50
                      ? `${userChoice === 'A' ? pA : pB}% of people agreed with you.`
                      : `You're in the minority — only ${userChoice === 'A' ? pA : pB}% chose this.`}
                  </p>
                </motion.div>

                {/* ── Dueling vote columns ─────────────── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="space-y-2">
                  {/* Option A bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] w-8 text-right font-bold tabular-nums" style={{ color: RED }}>{pA}%</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: FAINT }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pA}%` }}
                        transition={{ duration: 0.8, delay: 1.3, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(to right, ${RED}80, ${RED})` }}
                      />
                    </div>
                    <span className="text-[10px] truncate max-w-[120px]" style={{ color: userChoice === 'A' ? RED : MUTED }}>
                      {choice.optionA}
                    </span>
                  </div>
                  {/* Option B bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] w-8 text-right font-bold tabular-nums" style={{ color: ORG }}>{pB}%</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: FAINT }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pB}%` }}
                        transition={{ duration: 0.8, delay: 1.3, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(to right, ${ORG}80, ${ORG})` }}
                      />
                    </div>
                    <span className="text-[10px] truncate max-w-[120px]" style={{ color: userChoice === 'B' ? ORG : MUTED }}>
                      {choice.optionB}
                    </span>
                  </div>
                  <p className="text-center text-[10px] tabular-nums pt-1" style={{ color: FAINT }}>
                    {totalVotes.toLocaleString()} total vote{totalVotes !== 1 ? 's' : ''}
                  </p>
                </motion.div>

                {/* ── Philosophical closer ─────────────── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="h-px w-12" style={{ background: FAINT }} />
                    <span className="text-[9px] tracking-widest" style={{ color: FAINT }}>✦</span>
                    <div className="h-px w-12" style={{ background: FAINT }} />
                  </div>
                  <p className="text-[11px] italic" style={{ color: MUTED }}>
                    {CLOSERS[closerIdx]}
                  </p>
                </motion.div>

                {/* ── Next button ──────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 }}
                  className="text-center">
                  <button onClick={nextChoice}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{ background: RED_D, color: RED, border: `1px solid ${RED_B}` }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Next Dilemma
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ── option button (hover glow + shaking trash + shatter on delete) ──
function OptionButton({ label, side, color, colorDim, colorBrd, hasVoted, userChoice, voting, percent, onVote }: {
  label: string; side: 'A' | 'B'; color: string; colorDim: string; colorBrd: string;
  hasVoted: boolean; userChoice: 'A' | 'B' | null; voting: boolean; percent: number;
  onVote: () => void;
}) {
  const isChosen  = hasVoted && userChoice === side;
  const isSaved   = hasVoted && userChoice !== side;
  const savedColor = GREEN;

  return (
    <motion.button
      onClick={onVote}
      disabled={hasVoted || voting}
      whileTap={hasVoted ? {} : { scale: 0.97 }}
      whileHover={hasVoted ? {} : { boxShadow: `0 0 24px ${color}30, 0 0 60px ${color}10` }}
      className="w-full text-left rounded-2xl p-5 sm:p-6 transition-all relative overflow-hidden group"
      style={{
        background: isChosen ? colorDim : isSaved ? GREEN_D : colorDim,
        border: `1px solid ${isChosen ? colorBrd : isSaved ? `${GREEN}25` : colorBrd}`,
        opacity: 1,
      }}
    >
      {/* Radial shockwave on vote */}
      {isChosen && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 100, height: 100,
            top: '50%', left: '50%',
            marginTop: -50, marginLeft: -50,
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="flex items-center gap-3 relative z-10">
        {/* Trash icon — shakes on idle, goes solid on delete */}
        <motion.div
          animate={!hasVoted ? {
            rotate: [0, -3, 3, -2, 2, 0],
          } : {}}
          transition={!hasVoted ? {
            duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut',
          } : {}}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: isChosen ? color : isSaved ? `${savedColor}20` : `${color}15`,
            boxShadow: isChosen ? `0 0 16px ${color}40` : 'none',
          }}>
          {isSaved ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm">✓</motion.span>
          ) : (
            <Trash2 className="w-4.5 h-4.5" style={{ color: isChosen ? 'white' : color }} />
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5 font-semibold"
            style={{ color: isChosen ? color : isSaved ? savedColor : `${color}99` }}>
            {isChosen ? '☠ Erased' : isSaved ? '✦ Saved' : 'Delete'}
          </div>

          {/* Shatter animation on the chosen text */}
          {isChosen ? (
            <div className="relative overflow-visible">
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: 'easeIn' }}
                className="text-base sm:text-lg font-bold"
                style={{ color: IVORY, textDecoration: 'line-through', textDecorationColor: color }}>
                {label}
              </motion.div>
              {/* Flying fragments */}
              {label.split(' ').map((word, wi) => (
                <motion.span key={wi}
                  initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 120,
                    y: (Math.random() - 0.5) * 80 - 20,
                    rotate: (Math.random() - 0.5) * 45,
                    scale: 0.6,
                  }}
                  transition={{ duration: 0.8, delay: 0.3 + wi * 0.05, ease: 'easeOut' }}
                  className="absolute top-0 text-base sm:text-lg font-bold pointer-events-none"
                  style={{ color, left: `${(wi / Math.max(label.split(' ').length, 1)) * 80}%` }}>
                  {word}
                </motion.span>
              ))}
            </div>
          ) : (
            <div className="text-base sm:text-lg font-bold transition-colors duration-300"
              style={{ color: isSaved ? `${IVORY}cc` : IVORY }}>
              {label}
            </div>
          )}
        </div>

        {/* Percentage counter */}
        {hasVoted && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="text-xl sm:text-2xl font-bold tabular-nums shrink-0"
            style={{ color: isChosen ? color : savedColor }}>
            {percent}%
          </motion.span>
        )}
      </div>

      {/* Background sweep on vote */}
      {isChosen && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 origin-left rounded-2xl pointer-events-none"
          style={{ background: `${color}08` }}
        />
      )}
    </motion.button>
  );
}
