'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// THE GRAND DAO  ·  cultivation wisdom · dao names · path verdicts
// ─────────────────────────────────────────────────────────────────

const GOLD        = '#c9a227';
const GOLD_DIM    = 'rgba(201,162,39,0.1)';
const GOLD_BORDER = 'rgba(201,162,39,0.2)';
const GOLD_HOVER  = 'rgba(201,162,39,0.18)';
const CREAM       = 'rgba(255,245,210,0.88)';
const MUTED       = 'rgba(201,162,39,0.5)';
const FAINT       = 'rgba(201,162,39,0.28)';

// ─────────────────────────────────────────────────────────────────
// STATIC VAULT — 32 original cultivation-style quotes
// ─────────────────────────────────────────────────────────────────

const VAULT: { text: string; attr: string }[] = [
  { text: 'The Heavens are neither merciful nor cruel. They simply are. It is cultivators who mistake indifference for justice.', attr: 'Elder of the Forsaken Peak' },
  { text: 'To cultivate is not to acquire power. It is to shed everything that prevents you from seeing what you already are.', attr: 'The Void Patriarch, Third Sermon' },
  { text: 'The greatest tribulation a cultivator faces is not lightning from the heavens. It is the silence within.', attr: 'Nameless Inscription, Shattered Vault' },
  { text: 'Power is a river. Those who seek to dam it drown. Those who learn to flow with it become the river itself.', attr: 'Ancient Stele, Sect of the Eternal Current' },
  { text: 'Your enemies are not your obstacles. Your enemies are your most honest teachers.', attr: 'Dao Heart Scripture, Vol. VII' },
  { text: 'The Dao does not reward talent. It rewards the one who endures long after talent has abandoned them.', attr: 'Inscription on the Gate of Ten Thousand Trials' },
  { text: 'To shatter the sky, you must first shatter every belief you hold about what the sky is.', attr: 'Elder Huang, upon reaching the Immortal Realm' },
  { text: 'An immortal who has forgotten mortality is not immortal. They are simply a mortal who has not yet learned that they will die.', attr: 'The Hollow Sage' },
  { text: 'The mountain does not move because it wishes stillness. The mountain does not move because it has become the ground.', attr: 'Dao of the Unmoving, Fragment III' },
  { text: 'Every cultivator believes their path is unique. This is both the greatest truth and the gravest delusion.', attr: 'Records of the Ten Thousand Paths' },
  { text: 'A sword without a wielder is iron. A cultivator without conviction is the same.', attr: 'Patriarch Yanluo' },
  { text: 'That which cannot break cannot grow. The jade that refuses the chisel remains unrefined forever.', attr: 'Refinement Codex, Chapter One' },
  { text: 'One thousand years of cultivation cannot buy a single honest moment of self-knowledge.', attr: 'The Silent Ancestor' },
  { text: 'The heavens grant tribulations not as punishment, but as the only gift powerful enough to forge a sovereign.', attr: 'Supreme Elder\'s Final Words' },
  { text: 'You will know you have found your Dao when the pursuit of it costs you everything you once were.', attr: 'Wall Inscription, Dao Heart Proving Ground' },
  { text: 'A cultivator who fears death will spend their immortality living as though already dead.', attr: 'The Warden of Broken Crowns' },
  { text: 'The strongest technique is not one that overpowers the enemy. It is one that makes you indifferent to being overpowered.', attr: 'Sovereign Scroll of the Unbound Mind' },
  { text: 'Every realm broken through leaves behind a version of you that could not make the crossing.', attr: 'Meditation Record, Anonymous' },
  { text: 'The void is not empty. It is so full that nothing further can be added.', attr: 'Text on the First Heaven' },
  { text: 'Destiny is the story the weak tell themselves. The strong are too busy writing.', attr: 'Words of Patriarch Wuji' },
  { text: 'That which appears as loss to the mortal eye often appears as refinement to the eternal one.', attr: 'Scripture of the Ten Thousand Sorrows' },
  { text: 'To reach the peak of cultivation is to realize there is no peak — only greater and greater distances from where you began.', attr: 'Last Entry, Jade Record of Elder Shen' },
  { text: 'Control nothing. Influence everything. This is the first mystery of the Grand Dao.', attr: 'The Grand Dao, Opening Line' },
  { text: 'The cultivator who chases power chases a shadow. The cultivator who understands emptiness holds the shadow\'s source.', attr: 'Teachings of the Formless Hall' },
  { text: 'Ten thousand years of karma do not arrive as thunder. They arrive as a quiet decision on an ordinary day.', attr: 'Karmic Record, Celestial Bureau' },
  { text: 'The greatest illusion the Heavens ever crafted was the boundary between self and Dao.', attr: 'Inscription on the Final Gate' },
  { text: 'Sever the mortal heart and you lose the only organ capable of understanding why cultivation matters.', attr: 'Elder Mingzhi, upon his disciples' },
  { text: 'A river does not mourn the water it no longer holds. Neither should you mourn the self you are transcending.', attr: 'The River Sutra, Verse 9' },
  { text: 'The path narrows as you ascend — not because the Dao grows harder, but because you are becoming more fully yourself.', attr: 'Summit Record, Third Heaven Stele' },
  { text: 'Those who cultivate in pursuit of longevity often achieve it, only to discover they have outlived every reason they had to live.', attr: 'The Hollow Immortal\'s Lament' },
  { text: 'The first breakthrough costs effort. The second costs blood. The third costs identity. After that, the price changes.', attr: 'What They Do Not Tell Disciples' },
  { text: 'The cosmos was not built for your suffering, nor for your joy. This should terrify you — and then free you.', attr: 'The Wanderer\'s Last Sutra' },
];

function pickRandom<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter(x => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─────────────────────────────────────────────────────────────────
// QUOTE CODEX SECTION
// ─────────────────────────────────────────────────────────────────

function DaoCodex() {
  const [quote, setQuote] = useState<{ text: string; attr: string }>(() => pickRandom(VAULT));
  const [aiLoading, setAiLoading] = useState(false);
  const [isAi, setIsAi] = useState(false);
  const [key, setKey] = useState(0);

  const shuffle = useCallback(() => {
    setQuote(pickRandom(VAULT, isAi ? undefined : quote));
    setIsAi(false);
    setKey(k => k + 1);
  }, [quote, isAi]);

  const invokeAi = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/generate/grand-dao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quote' }),
      });
      const data = await res.json();
      setQuote({ text: data.result, attr: 'The Dao Speaks' });
      setIsAi(true);
      setKey(k => k + 1);
    } finally {
      setAiLoading(false);
    }
  }, []);

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
    >
      <p className="text-xs font-semibold tracking-[0.22em] uppercase text-center" style={{ color: MUTED }}>
        ❧ &nbsp; The Codex &nbsp; ❧
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="space-y-3 text-center"
        >
          <p
            className="text-lg sm:text-xl leading-relaxed"
            style={{ color: CREAM, fontStyle: 'italic', lineHeight: 1.75 }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="text-xs tracking-widest" style={{ color: FAINT }}>
            — {quote.attr}
            {isAi && (
              <span
                className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: GOLD_DIM, color: GOLD, border: `1px solid ${FAINT}` }}
              >
                AI
              </span>
            )}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={shuffle}
          className="dao-btn-ghost px-4 py-2 rounded-xl text-xs font-semibold tracking-wider"
        >
          Another Saying
        </button>
        <button
          onClick={invokeAi}
          disabled={aiLoading}
          className="dao-btn-gold px-4 py-2 rounded-xl text-xs font-semibold tracking-wider disabled:opacity-40"
        >
          {aiLoading ? 'Summoning…' : 'Invoke AI Wisdom'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DAO NAME SECTION — the hero mechanic
// ─────────────────────────────────────────────────────────────────

function DaoNameSection() {
  const [name, setName] = useState('');
  const [result, setResult] = useState<{ title: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reveal = useCallback(async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/generate/grand-dao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dao-name', name: name.trim() }),
      });
      const data = await res.json();
      const lines = (data.result as string).split('\n').filter(Boolean);
      setResult({ title: lines[0] ?? data.result, explanation: lines.slice(1).join(' ') });
    } catch {
      setError('The Heavens did not respond. Try again.');
    } finally {
      setLoading(false);
    }
  }, [name, loading]);

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--curio-card)', border: `1px solid ${GOLD_BORDER}` }}
    >
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>
          ❧ &nbsp; Your Dao Name &nbsp; ❧
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--curio-text-secondary)' }}>
          Every cultivator carries a mortal name. Their Dao Name is what the cosmos hears.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && reveal()}
          placeholder="Enter your mortal name…"
          maxLength={60}
          className="dao-input flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--curio-input)',
            color: 'var(--curio-text)',
            border: `1px solid ${GOLD_BORDER}`,
          }}
        />
        <button
          onClick={reveal}
          disabled={!name.trim() || loading}
          className="dao-btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-40"
        >
          {loading ? 'Consulting the Heavens…' : 'Reveal →'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-5 text-center space-y-2"
            style={{ background: GOLD_DIM, border: `1px solid ${FAINT}` }}
          >
            <p className="text-xs tracking-widest uppercase" style={{ color: MUTED }}>Dao Name</p>
            <p
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: GOLD, textShadow: `0 0 24px rgba(201,162,39,0.4)` }}
            >
              {result.title}
            </p>
            {result.explanation && (
              <p className="text-sm leading-relaxed" style={{ color: CREAM, fontStyle: 'italic' }}>
                {result.explanation}
              </p>
            )}
            <button
              onClick={() => { setResult(null); setName(''); }}
              className="text-xs mt-1"
              style={{ color: MUTED }}
            >
              ↩ reveal another
            </button>
          </motion.div>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-center"
            style={{ color: 'rgba(239,68,68,0.7)' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DAO PATH SECTION — trait → cultivation verdict
// ─────────────────────────────────────────────────────────────────

const EXAMPLE_TRAITS = ['loneliness', 'wrath', 'ambition', 'envy', 'grief', 'obsession'];

function DaoPathSection() {
  const [trait, setTrait] = useState('');
  const [verdict, setVerdict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholder] = useState(() => pickRandom(EXAMPLE_TRAITS));

  const hear = useCallback(async () => {
    if (!trait.trim() || loading) return;
    setLoading(true);
    setError('');
    setVerdict(null);
    try {
      const res = await fetch('/api/generate/grand-dao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'verdict', trait: trait.trim() }),
      });
      const data = await res.json();
      setVerdict(data.result);
    } catch {
      setError('The Dao is silent. Try again.');
    } finally {
      setLoading(false);
    }
  }, [trait, loading]);

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--curio-card)', border: `1px solid ${GOLD_BORDER}` }}
    >
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>
          ❧ &nbsp; Your Path &nbsp; ❧
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--curio-text-secondary)' }}>
          Name your deepest truth — a flaw, a desire, a fear. The Dao will speak.
        </p>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {EXAMPLE_TRAITS.map(t => (
          <button
            key={t}
            onClick={() => { setTrait(t); setVerdict(null); }}
            className="px-2.5 py-1 rounded-lg text-xs transition-all"
            style={{
              background: trait === t ? GOLD_DIM : 'transparent',
              color: trait === t ? GOLD : MUTED,
              border: `1px solid ${trait === t ? GOLD_BORDER : 'transparent'}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={trait}
          onChange={e => { setTrait(e.target.value); setVerdict(null); }}
          onKeyDown={e => e.key === 'Enter' && hear()}
          placeholder={placeholder}
          maxLength={60}
          className="dao-input flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--curio-input)',
            color: 'var(--curio-text)',
            border: `1px solid ${GOLD_BORDER}`,
          }}
        />
        <button
          onClick={hear}
          disabled={!trait.trim() || loading}
          className="dao-btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-40"
        >
          {loading ? 'The Dao Considers…' : 'Hear the Dao'}
        </button>
      </div>

      <AnimatePresence>
        {verdict && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-5 space-y-2"
            style={{ background: GOLD_DIM, border: `1px solid ${FAINT}` }}
          >
            <p className="text-xs tracking-widest uppercase text-center" style={{ color: MUTED }}>
              The Dao Speaks
            </p>
            <p className="text-sm leading-relaxed text-center" style={{ color: CREAM, fontStyle: 'italic', lineHeight: 1.85 }}>
              &ldquo;{verdict}&rdquo;
            </p>
            <div className="text-center">
              <button
                onClick={() => { setVerdict(null); setTrait(''); }}
                className="text-xs mt-1"
                style={{ color: MUTED }}
              >
                ↩ hear another
              </button>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-center"
            style={{ color: 'rgba(239,68,68,0.7)' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────

export function TheGrandDaoApp() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-1 space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes daoGlow {
          0%, 100% { box-shadow: 0 0 8px 1px rgba(201,162,39,0.15); }
          50%       { box-shadow: 0 0 22px 6px rgba(201,162,39,0.38); }
        }
        @keyframes daoShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes daoFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }

        .dao-btn-gold {
          background: linear-gradient(135deg, #c9a227 0%, #e8c547 40%, #b8880f 80%, #c9a227 100%);
          background-size: 300% auto;
          animation: daoShimmer 5s linear infinite;
          color: #1a1200;
          font-weight: 700;
          transition: filter 0.2s, box-shadow 0.2s;
        }
        .dao-btn-gold:hover:not(:disabled) {
          filter: brightness(1.15);
          box-shadow: 0 0 18px rgba(201,162,39,0.5), 0 0 36px rgba(201,162,39,0.2);
        }
        .dao-btn-gold:disabled { animation: none; opacity: 0.4; }

        .dao-btn-ghost {
          background: transparent;
          color: ${MUTED};
          border: 1px solid ${GOLD_BORDER};
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }
        .dao-btn-ghost:hover {
          background: ${GOLD_HOVER};
          color: ${GOLD};
          box-shadow: 0 0 10px rgba(201,162,39,0.2);
        }

        .dao-input:focus {
          border-color: rgba(201,162,39,0.55) !important;
          box-shadow: 0 0 0 3px rgba(201,162,39,0.1), 0 0 12px rgba(201,162,39,0.08);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .dao-flame-icon {
          animation: daoFloat 3.5s ease-in-out infinite, daoGlow 3.5s ease-in-out infinite;
        }
      ` }} />

      {/* Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="flex justify-center">
          <div
            className="dao-flame-icon w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #7c5200 0%, #c9a227 100%)', border: `1px solid ${GOLD_BORDER}` }}
          >
            🔥
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: GOLD }}>
            The Grand Dao
          </h1>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--curio-text-secondary)' }}>
            Cultivation wisdom from ten thousand years of seeking.
            <br />
            Your Dao Name awaits. Your path has already been written.
          </p>
        </div>
      </div>

      {/* Atmospheric divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_BORDER})` }} />
        <span className="text-xs tracking-widest" style={{ color: FAINT }}>⟡</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${GOLD_BORDER})` }} />
      </div>

      <DaoCodex />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_BORDER})` }} />
        <span className="text-xs tracking-widest" style={{ color: FAINT }}>⟡</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${GOLD_BORDER})` }} />
      </div>

      <DaoNameSection />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_BORDER})` }} />
        <span className="text-xs tracking-widest" style={{ color: FAINT }}>⟡</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${GOLD_BORDER})` }} />
      </div>

      <DaoPathSection />

      {/* Footer */}
      <p className="text-center text-xs pb-4" style={{ color: FAINT }}>
        The Dao that can be named is not the eternal Dao.
      </p>
    </div>
  );
}
