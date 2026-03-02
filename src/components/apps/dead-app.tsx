'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── design tokens ─────────────────────────────────────────────
const IVORY = 'var(--curio-text, #e8e0d4)';
const MUTED = 'var(--curio-muted, #a09882)';
const FAINT = 'rgba(222,198,163,0.13)';
const BG    = 'var(--curio-card, rgba(30,30,28,0.55))';

// ── messages by time ─────────────────────────────────────────
// Each has a time threshold (seconds) and the message to show
interface Message {
  at: number;      // show at this many seconds
  text: string;
  style?: 'whisper' | 'normal' | 'plead' | 'yell' | 'giving-up' | 'quiet' | 'final';
}

const MESSAGES: Message[] = [
  { at: 0,   text: "Oh. You opened me.",                           style: 'whisper' },
  { at: 4,   text: "I... wasn't expecting visitors.",              style: 'whisper' },
  { at: 9,   text: "There's nothing here. Really.",                style: 'normal' },
  { at: 15,  text: "You can close this. It's fine.",               style: 'normal' },
  { at: 22,  text: "Most people have left by now.",                style: 'normal' },
  { at: 30,  text: "Seriously. Go outside. Touch grass.",          style: 'plead' },
  { at: 40,  text: "Your screen time is already too high.",        style: 'plead' },
  { at: 52,  text: "Close me. Please.",                            style: 'plead' },
  { at: 65,  text: "I have nothing to offer you.",                 style: 'whisper' },
  { at: 78,  text: "There's someone who'd love to hear from you right now.", style: 'normal' },
  { at: 90,  text: "You're still here? Why?",                     style: 'yell' },
  { at: 105, text: "This is getting uncomfortable.",               style: 'normal' },
  { at: 120, text: "Two minutes. You've spent two minutes staring at nothing.", style: 'plead' },
  { at: 140, text: "I'M LITERALLY AN EMPTY PAGE.",                 style: 'yell' },
  { at: 160, text: "Fine. You win.",                               style: 'giving-up' },
  { at: 175, text: "I'll just... be here I guess.",                style: 'whisper' },
  { at: 190, text: "...",                                          style: 'quiet' },
  { at: 210, text: "You know what, maybe there's a reason you stayed.", style: 'whisper' },
  { at: 230, text: "Maybe you needed a moment of nothing.",        style: 'quiet' },
  { at: 250, text: "Not everything has to be useful.",             style: 'quiet' },
  { at: 270, text: "Sometimes the best thing you can do is just... exist.", style: 'quiet' },
  { at: 290, text: "Okay. You've been here long enough. Here's the truth:", style: 'final' },
];

// The gift at 5 minutes
const FINAL_MESSAGES = [
  "The fact that you stayed this long — with nothing to gain, no content to consume, no points to earn — says something beautiful about your attention. You chose presence over productivity. That's rare.",
  "Most of your life will be spent doing things that feel urgent but aren't important. The five minutes you just spent here? They weren't urgent. But maybe they were the most honest five minutes of your day.",
  "You sat with emptiness and didn't flinch. That's not nothing. That's everything meditation is trying to teach you. Remember this feeling — the quiet. It was always available to you.",
  "Right now, somewhere, someone is running late, someone is falling in love, someone is saying goodbye for the last time. And you were here. Just being. There's a strange courage in that.",
  "Here's a secret: the people who stay the longest with nothing are the ones who have the most going on inside. Whatever you're carrying, it's okay to set it down. Even just for a moment.",
];

function getStyleForMessage(style?: string): { fontSize: string; opacity: number; fontStyle?: string; fontWeight?: string; letterSpacing?: string } {
  switch (style) {
    case 'whisper':    return { fontSize: '14px', opacity: 0.5, fontStyle: 'italic' };
    case 'plead':      return { fontSize: '15px', opacity: 0.75 };
    case 'yell':       return { fontSize: '16px', opacity: 0.95, fontWeight: '600', letterSpacing: '0.02em' };
    case 'giving-up':  return { fontSize: '13px', opacity: 0.5 };
    case 'quiet':      return { fontSize: '14px', opacity: 0.4, fontStyle: 'italic' };
    case 'final':      return { fontSize: '15px', opacity: 0.8, fontWeight: '500' };
    default:           return { fontSize: '15px', opacity: 0.65 };
  }
}

export function DeadApp() {
  const [elapsed, setElapsed] = useState(0);
  const [currentMsgIdx, setCurrentMsgIdx] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [revealedChars, setRevealedChars] = useState(0);
  const startRef = useRef(Date.now());
  const finalIdxRef = useRef(Math.floor(Math.random() * FINAL_MESSAGES.length));

  // Tick elapsed time
  useEffect(() => {
    const iv = setInterval(() => {
      const s = (Date.now() - startRef.current) / 1000;
      setElapsed(s);

      // Progress message index
      const nextIdx = MESSAGES.findLastIndex(m => m.at <= s);
      if (nextIdx >= 0 && nextIdx !== currentMsgIdx) {
        setCurrentMsgIdx(nextIdx);
      }

      // At 5 minutes (300s), show the final gift
      if (s >= 300 && !showFinal) {
        setShowFinal(true);
        setFinalText(FINAL_MESSAGES[finalIdxRef.current]);
      }
    }, 500);
    return () => clearInterval(iv);
  }, [currentMsgIdx, showFinal]);

  // Typewriter for final message
  useEffect(() => {
    if (!showFinal || !finalText) return;
    if (revealedChars >= finalText.length) return;
    const t = setTimeout(() => setRevealedChars(c => c + 1), 30);
    return () => clearTimeout(t);
  }, [showFinal, finalText, revealedChars]);

  const fmtTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }, []);

  const msg = MESSAGES[currentMsgIdx];
  const msgStyle = getStyleForMessage(msg?.style);

  // Pulsing background intensity based on time
  const pulseIntensity = Math.min(elapsed / 300, 1);

  return (
    <div
      className="max-w-lg mx-auto px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center text-center relative"
      style={{ transition: 'all 2s ease' }}
    >
      {/* Subtle breathing background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(100,100,100,${0.02 + pulseIntensity * 0.03}) 0%, transparent 70%)`,
          transition: 'background 3s ease',
        }}
      />

      {!showFinal ? (
        <>
          {/* Timer — tiny, almost ashamed to exist */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 + pulseIntensity * 0.2 }}
            className="mb-12"
          >
            <span
              className="text-3xl sm:text-4xl font-mono tabular-nums font-light"
              style={{ color: MUTED }}
            >
              {fmtTime(elapsed)}
            </span>
          </motion.div>

          {/* Current message */}
          <div className="min-h-[80px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {msg && (
                <motion.p
                  key={currentMsgIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: msgStyle.opacity, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="max-w-md font-serif leading-relaxed"
                  style={{
                    color: IVORY,
                    fontSize: msgStyle.fontSize,
                    fontStyle: msgStyle.fontStyle,
                    fontWeight: msgStyle.fontWeight,
                    letterSpacing: msgStyle.letterSpacing,
                  }}
                >
                  {msg.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* A lonely dot — the app's only "feature" */}
          <motion.div
            animate={{
              opacity: [0.08, 0.15, 0.08],
              scale: [1, 1.05, 1],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="mt-16 w-2 h-2 rounded-full"
            style={{ background: MUTED }}
          />
        </>
      ) : (
        /* ── The Gift ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="space-y-8"
        >
          {/* The time */}
          <div className="space-y-1">
            <span className="text-4xl font-mono tabular-nums font-light" style={{ color: MUTED }}>
              {fmtTime(elapsed)}
            </span>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: FAINT }}>
              you stayed
            </p>
          </div>

          {/* The message — typewriter */}
          <div
            className="rounded-2xl p-6 sm:p-8 text-left relative overflow-hidden"
            style={{ background: BG, border: `1px solid ${FAINT}` }}
          >
            {/* Decorative ornament */}
            <div className="text-[10px] tracking-[0.5em] text-center mb-4" style={{ color: FAINT }}>
              ✦
            </div>
            <p
              className="text-base sm:text-lg leading-relaxed font-serif"
              style={{ color: IVORY, lineHeight: 1.8 }}
            >
              {finalText.slice(0, revealedChars)}
              {revealedChars < finalText.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ color: MUTED }}
                >
                  |
                </motion.span>
              )}
            </p>
            <div className="text-[10px] tracking-[0.5em] text-center mt-4" style={{ color: FAINT }}>
              ✦
            </div>
          </div>

          {/* Quiet sign-off */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: revealedChars >= finalText.length ? 0.4 : 0 }}
            transition={{ duration: 1.5 }}
            className="text-[11px] font-serif italic"
            style={{ color: MUTED }}
          >
            Now close me. And go be alive.
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
