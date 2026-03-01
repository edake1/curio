'use client';

import { useState, useCallback, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';

// ─────────────────────────────────────────────────────────────────
// YOUR LAST WORDS — Practice your last words. See what others chose.
// ─────────────────────────────────────────────────────────────────

const AMBER     = '#c8956c';
const AMBER_DIM = 'rgba(200,149,108,0.08)';
const AMBER_BRD = 'rgba(200,149,108,0.18)';
const IVORY     = 'rgba(240,230,215,0.88)';
const MUTED     = 'rgba(200,149,108,0.50)';
const FAINT     = 'rgba(200,149,108,0.22)';

// ─────────────────────────────────────────────────────────────────
// FAMOUS LAST WORDS — real historical records
// ─────────────────────────────────────────────────────────────────

const FAMOUS: { quote: string; person: string; context: string }[] = [
  { quote: "Don't let it end like this. Tell them I said something.",
    person: 'Pancho Villa', context: 'revolutionary general, 1923' },
  { quote: 'More light.',
    person: 'Johann Wolfgang von Goethe', context: 'poet, 1832' },
  { quote: 'Beautiful.',
    person: 'Elizabeth Barrett Browning', context: 'poet, 1861' },
  { quote: "Go on, get out. Last words are for fools who haven't said enough.",
    person: 'Karl Marx', context: 'philosopher, 1883' },
  { quote: 'Now is not the time for making enemies.',
    person: 'Voltaire', context: 'when asked to renounce the devil, 1778' },
  { quote: 'Either that wallpaper goes, or I do.',
    person: 'Oscar Wilde', context: 'writer, 1900' },
  { quote: "I'm bored with it all.",
    person: 'Winston Churchill', context: 'statesman, 1965' },
  { quote: 'I have offended God and mankind because my work did not reach the quality it should have.',
    person: 'Leonardo da Vinci', context: 'artist and inventor, 1519' },
  { quote: "Tell them I've had a wonderful life.",
    person: 'Ludwig Wittgenstein', context: 'philosopher, 1951' },
  { quote: 'Goodnight, my darlings, I\'ll see you tomorrow.',
    person: 'Noël Coward', context: 'playwright, 1973' },
  { quote: 'I am not the least afraid to die.',
    person: 'Charles Darwin', context: 'naturalist, 1882' },
  { quote: 'I only regret that I have but one life to lose for my country.',
    person: 'Nathan Hale', context: 'soldier, executed 1776' },
];

// ─────────────────────────────────────────────────────────────────
// ADDRESSEE OPTIONS
// ─────────────────────────────────────────────────────────────────

interface Addressee {
  id: string;
  label: string;
  placeholder: string;
}

const ADDRESSEES: Addressee[] = [
  { id: 'world',          label: 'The world',          placeholder: 'What would you say to everyone who ever lived or ever will?' },
  { id: 'someone-i-love', label: 'Someone I love',     placeholder: 'The thing you need them to hear, before there\'s no more time.' },
  { id: 'myself',         label: 'Myself',             placeholder: 'What would you tell the version of you who\'s still at the beginning?' },
  { id: 'my-children',    label: 'My children',        placeholder: 'What do you most want them to carry after you\'re gone?' },
  { id: 'a-stranger',     label: 'A stranger',         placeholder: 'A message to someone you\'ll never meet, who might need exactly this.' },
];

const DEFAULT_PLACEHOLDER = 'Say the thing you\'d want in the world after you\'re gone.';

// ─────────────────────────────────────────────────────────────────
// GALLERY ENTRY TYPE
// ─────────────────────────────────────────────────────────────────

interface GalleryEntry {
  id: string;
  text: string;
  addressedTo: string | null;
  upvotes: number;
  createdAt: string;
}

const ADDR_DISPLAY: Record<string, string> = {
  'world':          'the world',
  'someone-i-love': 'someone they love',
  'myself':         'themselves',
  'my-children':    'their children',
  'a-stranger':     'a stranger',
};

// ─────────────────────────────────────────────────────────────────
// PERSISTENT SESSION ID (localStorage — survives tab close)
// ─────────────────────────────────────────────────────────────────

const LW_SESSION_KEY = 'curio-lw-session';

function getLWSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(LW_SESSION_KEY);
  if (!id) {
    id = 'lw_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(LW_SESSION_KEY, id);
  }
  return id;
}

// ─────────────────────────────────────────────────────────────────
// UPVOTE TRACKING (localStorage)
// ─────────────────────────────────────────────────────────────────

const UPVOTED_KEY = 'curio-lw-upvoted';

function getUpvoted(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(UPVOTED_KEY) ?? '[]')); }
  catch { return new Set(); }
}

function markUpvoted(id: string) {
  const s = getUpvoted();
  s.add(id);
  localStorage.setItem(UPVOTED_KEY, JSON.stringify([...s]));
}

// ─────────────────────────────────────────────────────────────────
// COPY TO CLIPBOARD
// ─────────────────────────────────────────────────────────────────

async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(`${text}\n\nfrom Your Last Words · curio`); return true; }
  catch { return false; }
}

// ─────────────────────────────────────────────────────────────────
// EXPORT CARD — always in DOM, captured by toPng via ref
// ─────────────────────────────────────────────────────────────────

const LastWordsExportCard = forwardRef<HTMLDivElement, {
  words: string;
  addressedTo?: string | null;
}>(({ words, addressedTo }, ref) => (
  <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
    <div ref={ref} style={{
      width: '800px',
      padding: '72px 80px 64px',
      background: '#0c0b09',
      fontFamily: 'Georgia, "Times New Roman", serif',
      position: 'relative',
    }}>
      {/* Warm ambient glow */}
      <div style={{
        position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
        width: '400px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,149,108,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />
      <div style={{
        border: '1px solid rgba(200,149,108,0.2)',
        borderRadius: '18px',
        padding: '56px 64px 48px',
        background: 'rgba(200,149,108,0.04)',
        position: 'relative',
      }}>
        {addressedTo && (
          <p style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(200,149,108,0.45)', margin: '0 0 28px', textAlign: 'center',
          }}>
            addressed to {ADDR_DISPLAY[addressedTo] ?? addressedTo}
          </p>
        )}
        <div style={{
          fontSize: '64px', lineHeight: 1, color: 'rgba(200,149,108,0.12)',
          fontFamily: 'Georgia, serif', position: 'absolute', top: 32, left: 40,
        }}>&ldquo;</div>
        <p style={{
          fontSize: '26px', lineHeight: 1.75, fontStyle: 'italic',
          color: 'rgba(240,230,215,0.9)', textAlign: 'center', margin: '0 0 36px',
          position: 'relative',
        }}>{words}</p>
        <div style={{
          height: '1px', margin: '0 0 28px',
          background: 'linear-gradient(to right, transparent, rgba(200,149,108,0.2), transparent)',
        }} />
        <p style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'rgba(200,149,108,0.28)', textAlign: 'center',
        }}>Your Last Words &middot; curio</p>
      </div>
    </div>
  </div>
));
LastWordsExportCard.displayName = 'LastWordsExportCard';

// ─────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────

function LWDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${AMBER_BRD})` }} />
      <span className="text-xs tracking-widest" style={{ color: FAINT }}>✦</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${AMBER_BRD})` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FAMOUS LAST WORDS — rotating display
// ─────────────────────────────────────────────────────────────────

function FamousLastWords() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FAMOUS.length));

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => (i + 1) % FAMOUS.length);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  const entry = FAMOUS[idx];

  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BRD}` }}>
      <p className="text-xs font-semibold tracking-[0.22em] uppercase text-center" style={{ color: MUTED }}>
        ✦ &nbsp; Famous Last Words &nbsp; ✦
      </p>
      {/* Fixed-height container so the card never resizes during crossfade */}
      <div style={{ position: 'relative', minHeight: '150px' }}>
        <AnimatePresence mode="sync">
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0 }}
            className="flex flex-col items-center justify-center gap-3 text-center px-1"
          >
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: IVORY, fontStyle: 'italic', lineHeight: 1.85 }}>
              &ldquo;{entry.quote}&rdquo;
            </p>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold" style={{ color: AMBER }}>{entry.person}</p>
              <p className="text-xs" style={{ color: FAINT }}>{entry.context}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="text-center text-[10px]" style={{ color: FAINT }}>
        {idx + 1} / {FAMOUS.length} &nbsp;·&nbsp; cycles every 9 seconds
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WRITING SECTION
// ─────────────────────────────────────────────────────────────────

interface Reflection {
  id: string;
  mirror: string;
  unsaid: string;
}

type Phase = 'writing' | 'submitting' | 'reflected';

function WritingSection({ onSubmitted }: { onSubmitted: (entry: GalleryEntry) => void }) {
  const [phase,       setPhase]       = useState<Phase>('writing');
  const [text,        setText]        = useState('');
  const [addressedTo, setAddressedTo] = useState<string | null>(null);
  const [reflection,  setReflection]  = useState<Reflection | null>(null);
  const [error,       setError]       = useState('');
  const [copied,      setCopied]      = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const selectedAddr = ADDRESSEES.find(a => a.id === addressedTo);
  const placeholder  = selectedAddr?.placeholder ?? DEFAULT_PLACEHOLDER;
  const charLimit    = 280;

  const submit = useCallback(async () => {
    if (!text.trim() || phase !== 'writing') return;
    setPhase('submitting');
    setError('');
    try {
      const sessionId = getLWSessionId();
      const res  = await fetch('/api/last-words/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), addressedTo, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setReflection({ id: data.id, mirror: data.mirror, unsaid: data.unsaid });
      setPhase('reflected');
      onSubmitted({ id: data.id, text: text.trim(), addressedTo, upvotes: 0, createdAt: new Date().toISOString() });
    } catch (e) {
      setError('Something failed. Your words are worth saying again.');
      setPhase('writing');
      console.error(e);
    }
  }, [text, addressedTo, phase, onSubmitted]);

  const reset = () => { setText(''); setAddressedTo(null); setReflection(null); setPhase('writing'); setError(''); };

  const download = async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      const url = await toPng(exportRef.current, { pixelRatio: 2, cacheBust: true });
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare) {
        try {
          const blob = await (await fetch(url)).blob();
          const file = new File([blob], 'your-last-words.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Your Last Words' });
            return;
          }
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') return;
        }
      }
      const link = document.createElement('a');
      link.download = 'your-last-words.png';
      link.href = url;
      link.click();
    } catch (e) { console.error('Export failed', e); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-4">
      {phase !== 'reflected' && (
        <>
          {/* Addressee chooser */}
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: MUTED }}>
              Addressed to — optional
            </p>
            <div className="flex flex-wrap gap-2">
              {ADDRESSEES.map(a => {
                const active = addressedTo === a.id;
                return (
                  <button key={a.id} onClick={() => setAddressedTo(active ? null : a.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: active ? 'rgba(200,149,108,0.14)' : 'transparent',
                      color: active ? AMBER : MUTED,
                      border: `1px solid ${active ? AMBER_BRD : 'rgba(200,149,108,0.12)'}`,
                    }}>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, charLimit))}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
              disabled={phase !== 'writing'}
              placeholder={placeholder}
              rows={4}
              className="w-full resize-none rounded-2xl px-5 py-4 text-sm leading-relaxed outline-none transition-all lw-textarea"
              style={{
                background: AMBER_DIM,
                color: IVORY,
                border: `1px solid ${AMBER_BRD}`,
                fontStyle: text ? 'normal' : 'italic',
              }}
            />
            <span className="absolute bottom-3 right-4 text-[10px] tabular-nums" style={{ color: FAINT }}>
              {text.length}/{charLimit}
            </span>
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'rgba(239,68,68,0.65)' }}>{error}</p>
          )}
        </>
      )}

      {/* Submit — only while writing */}
      {phase === 'writing' && (
        <motion.button
          onClick={submit}
          disabled={!text.trim()}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold tracking-wider lw-btn-primary disabled:opacity-30"
        >
          Leave These Words
        </motion.button>
      )}

      {/* Submitting state */}
      {phase === 'submitting' && (
        <div className="w-full py-3.5 text-center text-sm" style={{ color: MUTED }}>
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            The mirror is being held up…
          </motion.span>
        </div>
      )}

      {/* Reflection — after submit */}
      <AnimatePresence>
        {phase === 'reflected' && reflection && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {/* The submitted words displayed back */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="rounded-2xl p-5 text-center space-y-2"
              style={{ background: 'rgba(200,149,108,0.06)', border: `1px solid ${FAINT}` }}
            >
              {addressedTo && (
                <p className="text-[10px] tracking-widest uppercase" style={{ color: FAINT }}>
                  to {ADDR_DISPLAY[addressedTo] ?? addressedTo}
                </p>
              )}
              <p className="text-base sm:text-lg leading-relaxed" style={{ color: IVORY, fontStyle: 'italic' }}>
                &ldquo;{text}&rdquo;
              </p>
            </motion.div>

            {/* The Mirror */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }}
              className="rounded-2xl p-5 space-y-2"
              style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BRD}` }}
            >
              <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: AMBER }}>
                The Mirror
              </p>
              <p className="text-sm leading-relaxed" style={{ color: IVORY, lineHeight: 1.85 }}>
                {reflection.mirror}
              </p>
            </motion.div>

            {/* The Unsaid */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.1 }}
              className="rounded-2xl p-5 space-y-2"
              style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BRD}` }}
            >
              <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: AMBER }}>
                The Unsaid
              </p>
              <p className="text-sm leading-relaxed" style={{ color: IVORY, lineHeight: 1.85 }}>
                {reflection.unsaid}
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.5 }}
              className="flex gap-2 flex-wrap"
            >
              <button
                onClick={async () => { if (await copyText(text)) { setCopied(true); setTimeout(() => setCopied(false), 2000); } }}
                className="lw-btn-ghost px-4 py-2 rounded-xl text-xs font-semibold"
              >
                {copied ? '✓ Copied' : '⧉ Copy'}
              </button>
              <button
                onClick={download}
                disabled={exporting}
                className="lw-btn-ghost px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {exporting ? '◌' : '↓ Save card'}
              </button>
              <button onClick={reset} className="text-xs ml-auto" style={{ color: FAINT }}>
                ↩ write again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Off-screen export card */}
      <LastWordsExportCard ref={exportRef} words={text} addressedTo={addressedTo} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// THE MEMORIAL — anonymous gallery
// ─────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { id: 'all',          label: 'All' },
  { id: 'world',        label: 'The world' },
  { id: 'someone-i-love', label: 'Someone they love' },
  { id: 'myself',       label: 'Themselves' },
  { id: 'my-children',  label: 'Their children' },
  { id: 'a-stranger',   label: 'A stranger' },
];

function TheMemorial({ refreshTick }: { refreshTick: number }) {
  const [entries,  setEntries]  = useState<GalleryEntry[]>([]);
  const [total,    setTotal]    = useState(0);
  const [filter,   setFilter]   = useState('all');
  const [sort,     setSort]     = useState<'top' | 'recent'>('top');
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(0);
  const [hasMore,  setHasMore]  = useState(false);
  const [upvoted,  setUpvoted]  = useState<Set<string>>(new Set());
  const [upvoting, setUpvoting] = useState<string | null>(null);

  useEffect(() => { setUpvoted(getUpvoted()); }, []);

  const load = useCallback(async (f: string, s: string, p: number, reset: boolean) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ filter: f, sort: s, page: String(p) });
      const res  = await fetch(`/api/last-words/gallery?${q}`);
      const data = await res.json();
      if (!res.ok) return;
      const fetched: GalleryEntry[] = data.entries ?? [];
      setTotal(data.total ?? 0);
      setEntries(prev => reset ? fetched : [...prev, ...fetched]);
      setHasMore((p + 1) * (data.limit ?? 5) < (data.total ?? 0));
      setPage(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter, sort, 0, true); }, [filter, sort, load, refreshTick]);

  const upvote = async (id: string) => {
    if (upvoted.has(id) || upvoting) return;
    setUpvoting(id);
    try {
      const res  = await fetch('/api/last-words/upvote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setEntries(prev => prev.map(e => e.id === id ? { ...e, upvotes: data.upvotes } : e));
      markUpvoted(id);
      setUpvoted(prev => new Set([...prev, id]));
    } finally { setUpvoting(null); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>
          ✦ &nbsp; The Memorial &nbsp; ✦
        </p>
        <p className="text-sm" style={{ color: IVORY }}>
          {total > 0
            ? <>{total.toLocaleString()} {total === 1 ? 'soul has' : 'souls have'} left their words here.</>
            : 'Be the first to leave your words.'}
        </p>
      </div>

      {/* Filters — horizontal scroll on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {FILTER_OPTIONS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
            style={{
              background: filter === f.id ? 'rgba(200,149,108,0.14)' : 'transparent',
              color: filter === f.id ? AMBER : MUTED,
              border: `1px solid ${filter === f.id ? AMBER_BRD : 'rgba(200,149,108,0.1)'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-1.5">
        {(['top', 'recent'] as const).map(s => (
          <button key={s} onClick={() => setSort(s)}
            className="px-3 py-1 rounded-lg text-xs transition-all"
            style={{
              background: sort === s ? AMBER_DIM : 'transparent',
              color: sort === s ? AMBER : FAINT,
              border: `1px solid ${sort === s ? AMBER_BRD : 'transparent'}`,
            }}>
            {s === 'top' ? '↑ Most resonant' : '⏱ Most recent'}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading && entries.length === 0 ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4 space-y-2 animate-pulse"
              style={{ background: AMBER_DIM, border: `1px solid ${FAINT}`, opacity: 0.5 - i * 0.12 }}>
              <div className="h-3 rounded-full w-3/4" style={{ background: AMBER_BRD }} />
              <div className="h-3 rounded-full w-1/2" style={{ background: FAINT }} />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: FAINT }}>
          No last words here yet.
        </p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i < 5 ? i * 0.05 : 0 }}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: AMBER_DIM, border: `1px solid ${FAINT}` }}
              >
                {entry.addressedTo && (
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: FAINT }}>
                    to {ADDR_DISPLAY[entry.addressedTo] ?? entry.addressedTo}
                  </p>
                )}
                <p className="text-sm leading-relaxed" style={{ color: IVORY, fontStyle: 'italic' }}>
                  &ldquo;{entry.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: FAINT }}>
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => upvote(entry.id)}
                    disabled={upvoted.has(entry.id) || !!upvoting}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: upvoted.has(entry.id) ? 'rgba(200,149,108,0.14)' : 'transparent',
                      color: upvoted.has(entry.id) ? AMBER : FAINT,
                      border: `1px solid ${upvoted.has(entry.id) ? AMBER_BRD : FAINT}`,
                      opacity: upvoting === entry.id ? 0.5 : 1,
                    }}
                  >
                    <span>{upvoted.has(entry.id) ? '♥' : '♡'}</span>
                    <span>{entry.upvotes > 0 ? entry.upvotes.toLocaleString() : 'resonates'}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMore && (
            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => load(filter, sort, page + 1, false)}
                disabled={loading}
                className="w-full py-2.5 text-xs rounded-xl lw-btn-ghost font-medium disabled:opacity-40"
              >
                {loading ? 'Loading…' : `Show more words`}
              </button>
              <p className="text-center text-[10px]" style={{ color: FAINT }}>
                showing {entries.length} of {total.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────

export function YourLastWordsApp() {
  const [galleryTick, setGalleryTick] = useState(0);

  const handleSubmitted = useCallback((entry: GalleryEntry) => {
    // Trigger gallery to prepend the new entry
    setGalleryTick(t => t + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-4 px-1 space-y-8">
      <style dangerouslySetInnerHTML={{ __html: `
        .lw-btn-primary {
          background: linear-gradient(135deg, #c8956c 0%, #e0b090 45%, #b07850 100%);
          background-size: 200% auto;
          color: #1a0e06;
          font-weight: 700;
          transition: filter 0.2s, box-shadow 0.2s;
        }
        .lw-btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          box-shadow: 0 0 20px rgba(200,149,108,0.4), 0 0 40px rgba(200,149,108,0.15);
        }
        .lw-btn-ghost {
          background: transparent;
          color: rgba(200,149,108,0.55);
          border: 1px solid rgba(200,149,108,0.2);
          transition: background 0.15s, color 0.15s;
        }
        .lw-btn-ghost:hover { background: rgba(200,149,108,0.1); color: #c8956c; }
        .lw-textarea::placeholder { color: rgba(200,149,108,0.35); font-style: italic; }
        .lw-textarea:focus {
          border-color: rgba(200,149,108,0.45) !important;
          box-shadow: 0 0 0 3px rgba(200,149,108,0.08), 0 0 14px rgba(200,149,108,0.06);
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />

      {/* Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #3a1a08 0%, #c8956c 100%)', border: `1px solid ${AMBER_BRD}` }}>
            🕯️
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: IVORY }}>
            Your Last Words
          </h1>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: MUTED }}>
            Practice what you&apos;d leave behind.
            <br />
            No performance. No audience. Just the truth beneath the life.
          </p>
        </div>
      </div>

      <FamousLastWords />
      <LWDivider />

      {/* Writing section */}
      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--curio-card)', border: `1px solid ${AMBER_BRD}` }}>
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>
            ✦ &nbsp; Practice Yours &nbsp; ✦
          </p>
          <p className="text-sm" style={{ color: 'var(--curio-text-secondary)' }}>
            No name. No context. Just the words.
            <br />
            When you submit, an honest mirror will be held up.
          </p>
        </div>
        <WritingSection onSubmitted={handleSubmitted} />
      </div>

      <LWDivider />

      {/* Gallery */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--curio-card)', border: `1px solid ${AMBER_BRD}` }}>
        <TheMemorial refreshTick={galleryTick} />
      </div>

      <p className="text-center text-xs pb-4" style={{ color: FAINT }}>
        All submissions are anonymous and permanent. Choose your words carefully.
      </p>
    </div>
  );
}
