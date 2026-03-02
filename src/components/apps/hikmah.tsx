'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WISDOM_REGIONS, WISDOM_CATEGORIES, REFLECTION_TAGS } from '@/data/wisdom';

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS — warm earth tones
// ─────────────────────────────────────────────────────────────────
const SAND      = 'rgba(222,198,163,0.92)';
const IVORY     = 'rgba(245,240,230,0.92)';
const TEAL      = '#0d9488';
const TEAL_DIM  = 'rgba(13,148,136,0.08)';
const TEAL_BRD  = 'rgba(13,148,136,0.18)';
const TERRA     = '#b45309';
const MUTED     = 'rgba(222,198,163,0.55)';
const FAINT     = 'rgba(222,198,163,0.25)';
const BG_CARD   = 'rgba(13,148,136,0.05)';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────
interface Saying {
  id: string;
  text: string;
  originalText?: string | null;
  attribution: string;
  origin: string;
  region: string;
  category: string;
  totalReflections: number;
  dailyDate?: string | null;
  contextOrigin?: string | null;
  contextMeaning?: string | null;
  contextPractice?: string | null;
}

interface Reflection {
  id: string;
  text: string;
  tag: string | null;
  upvotes: number;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────
// SESSION ID (persistent)
// ─────────────────────────────────────────────────────────────────
const HK_SESSION_KEY = 'curio-hk-session';

function getHKSession(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(HK_SESSION_KEY);
  if (!id) {
    id = 'hk_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(HK_SESSION_KEY, id);
  }
  return id;
}

// Upvote tracking
const HK_UPVOTED_KEY = 'curio-hk-upvoted';
function getUpvoted(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HK_UPVOTED_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function markUpvoted(id: string) {
  const s = getUpvoted(); s.add(id);
  localStorage.setItem(HK_UPVOTED_KEY, JSON.stringify([...s]));
}

// Bookmark / save tracking
const HK_SAVED_KEY = 'curio-hk-saved';
function getSavedSayings(): Saying[] {
  try { return JSON.parse(localStorage.getItem(HK_SAVED_KEY) ?? '[]'); }
  catch { return []; }
}
function getSavedIds(): Set<string> {
  return new Set(getSavedSayings().map(s => s.id));
}
function toggleSaved(saying: Saying): Saying[] {
  const current = getSavedSayings();
  const exists = current.some(s => s.id === saying.id);
  const next = exists ? current.filter(s => s.id !== saying.id) : [saying, ...current];
  localStorage.setItem(HK_SAVED_KEY, JSON.stringify(next));
  return next;
}

// ─────────────────────────────────────────────────────────────────
// REGION DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────────
const REGION_EMOJI: Record<string, string> = {
  'africa': '🌍', 'east-asia': '🏯', 'south-asia': '🕉️',
  'southeast-asia': '🌺', 'middle-east': '🕌', 'europe': '🏛️',
  'americas': '🌎', 'oceania': '🌊',
};

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  WISDOM_CATEGORIES.filter(c => c.id !== 'all').map(c => [c.id, c.label])
);

// ─────────────────────────────────────────────────────────────────
// DAILY SAYING — the hero section
// ─────────────────────────────────────────────────────────────────
function DailySaying({ onViewDetails, savedIds, onToggleSave }: {
  onViewDetails: (s: Saying) => void;
  savedIds: Set<string>;
  onToggleSave: (s: Saying) => void;
}) {
  const [saying, setSaying] = useState<Saying | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/wisdom/daily');
        const data = await res.json();
        if (data.saying) setSaying(data.saying);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-8 space-y-4 animate-pulse" style={{ background: BG_CARD, border: `1px solid ${FAINT}` }}>
        <div className="h-3 rounded-full w-1/3 mx-auto" style={{ background: FAINT }} />
        <div className="h-5 rounded-full w-3/4 mx-auto" style={{ background: TEAL_BRD }} />
        <div className="h-5 rounded-full w-2/3 mx-auto" style={{ background: TEAL_BRD }} />
        <div className="h-3 rounded-full w-1/4 mx-auto" style={{ background: FAINT }} />
      </div>
    );
  }

  if (!saying) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: BG_CARD, border: `1px solid ${FAINT}` }}>
        <p className="text-sm" style={{ color: MUTED }}>No daily saying yet. Seed the database first.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
      className="rounded-2xl p-6 sm:p-8 space-y-5"
      style={{ background: BG_CARD, border: `1px solid ${TEAL_BRD}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{REGION_EMOJI[saying.region] ?? '🌐'}</span>
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: MUTED }}>
            {saying.origin}
          </span>
        </div>
        <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ color: TEAL, background: TEAL_DIM, border: `1px solid ${TEAL_BRD}` }}>
          Today&apos;s Wisdom
        </span>
      </div>

      {/* The saying */}
      <div className="space-y-3 text-center py-2">
        {saying.originalText && (
          <p className="text-sm" style={{ color: MUTED, fontStyle: 'italic' }}>
            {saying.originalText}
          </p>
        )}
        <p className="text-xl sm:text-2xl leading-relaxed font-serif" style={{ color: IVORY, lineHeight: 1.8 }}>
          &ldquo;{saying.text}&rdquo;
        </p>
        <p className="text-sm font-medium" style={{ color: SAND }}>
          — {saying.attribution}
        </p>
      </div>

      {/* Category tag */}
      <div className="flex justify-center">
        <span className="text-[10px] tracking-wider uppercase px-3 py-1 rounded-full"
          style={{ color: MUTED, background: 'rgba(222,198,163,0.06)', border: `1px solid ${FAINT}` }}>
          {CATEGORY_LABEL[saying.category] ?? saying.category}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 pt-1">
        <button
          onClick={() => onViewDetails(saying)}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all"
          style={{ background: TEAL_DIM, color: TEAL, border: `1px solid ${TEAL_BRD}` }}
        >
          Explore This Saying
        </button>
        <button
          onClick={() => onToggleSave(saying)}
          className="px-3 py-2.5 rounded-xl text-xs transition-all"
          style={{
            background: savedIds.has(saying.id) ? 'rgba(217,119,6,0.1)' : TEAL_DIM,
            color: savedIds.has(saying.id) ? TERRA : MUTED,
            border: `1px solid ${savedIds.has(saying.id) ? 'rgba(217,119,6,0.25)' : TEAL_BRD}`,
          }}
        >
          {savedIds.has(saying.id) ? '★' : '☆'}
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SAYING DETAIL — context, reflections, TTS
// ─────────────────────────────────────────────────────────────────
function SayingDetail({ saying, onBack, savedIds, onToggleSave }: {
  saying: Saying; onBack: () => void;
  savedIds: Set<string>; onToggleSave: (s: Saying) => void;
}) {
  const [context, setContext] = useState<{ origin: string; meaning: string; practice: string } | null>(null);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const [playingTTS, setPlayingTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load context
  useEffect(() => {
    (async () => {
      setLoadingCtx(true);
      try {
        const res = await fetch(`/api/wisdom/context?id=${saying.id}`);
        const data = await res.json();
        if (data.origin) setContext(data);
      } finally { setLoadingCtx(false); }
    })();
  }, [saying.id]);

  const playTTS = async () => {
    if (playingTTS) {
      audioRef.current?.pause();
      setPlayingTTS(false);
      return;
    }
    setPlayingTTS(true);
    try {
      const res = await fetch('/api/generate/dao-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${saying.text}. ${saying.attribution}.` }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingTTS(false);
      audio.play();
    } catch {
      setPlayingTTS(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* Back */}
      <button onClick={onBack}
        className="text-xs font-medium tracking-wider flex items-center gap-1.5 transition-colors"
        style={{ color: MUTED }}
      >
        ← Back
      </button>

      {/* The saying card */}
      <div className="rounded-2xl p-6 sm:p-8 space-y-4"
        style={{ background: BG_CARD, border: `1px solid ${TEAL_BRD}` }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{REGION_EMOJI[saying.region] ?? '🌐'}</span>
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: MUTED }}>
            {saying.origin}
          </span>
        </div>
        {saying.originalText && (
          <p className="text-sm text-center" style={{ color: MUTED, fontStyle: 'italic' }}>{saying.originalText}</p>
        )}
        <p className="text-xl sm:text-2xl leading-relaxed font-serif text-center" style={{ color: IVORY, lineHeight: 1.8 }}>
          &ldquo;{saying.text}&rdquo;
        </p>
        <p className="text-sm font-medium text-center" style={{ color: SAND }}>
          — {saying.attribution}
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <span className="text-[10px] tracking-wider uppercase px-3 py-1 rounded-full"
            style={{ color: MUTED, background: 'rgba(222,198,163,0.06)', border: `1px solid ${FAINT}` }}>
            {CATEGORY_LABEL[saying.category] ?? saying.category}
          </span>
          <button
            onClick={playTTS}
            className="text-[10px] tracking-wider uppercase px-3 py-1 rounded-full transition-all"
            style={{ color: playingTTS ? TERRA : TEAL, background: TEAL_DIM, border: `1px solid ${TEAL_BRD}` }}
          >
            {playingTTS ? '⏸ Pause' : '🔊 Listen'}
          </button>
          <button
            onClick={() => onToggleSave(saying)}
            className="text-[10px] tracking-wider uppercase px-3 py-1 rounded-full transition-all"
            style={{
              color: savedIds.has(saying.id) ? TERRA : MUTED,
              background: savedIds.has(saying.id) ? 'rgba(217,119,6,0.1)' : 'rgba(222,198,163,0.06)',
              border: `1px solid ${savedIds.has(saying.id) ? 'rgba(217,119,6,0.25)' : FAINT}`,
            }}
          >
            {savedIds.has(saying.id) ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>

      {/* Context sections */}
      {loadingCtx ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 space-y-2 animate-pulse"
              style={{ background: BG_CARD, border: `1px solid ${FAINT}`, opacity: 0.6 - i * 0.15 }}>
              <div className="h-3 rounded-full w-1/4" style={{ background: TEAL_BRD }} />
              <div className="h-3 rounded-full w-3/4" style={{ background: FAINT }} />
              <div className="h-3 rounded-full w-2/3" style={{ background: FAINT }} />
            </div>
          ))}
        </div>
      ) : context && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-3">
          {/* Origin */}
          <div className="rounded-2xl p-5 space-y-2" style={{ background: BG_CARD, border: `1px solid ${TEAL_BRD}` }}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: TEAL }}>
              Origin
            </p>
            <p className="text-sm leading-relaxed" style={{ color: IVORY, lineHeight: 1.85 }}>
              {context.origin}
            </p>
          </div>
          {/* Meaning */}
          <div className="rounded-2xl p-5 space-y-2" style={{ background: BG_CARD, border: `1px solid ${TEAL_BRD}` }}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: TEAL }}>
              Deeper Meaning
            </p>
            <p className="text-sm leading-relaxed" style={{ color: IVORY, lineHeight: 1.85 }}>
              {context.meaning}
            </p>
          </div>
          {/* Practice */}
          <div className="rounded-2xl p-5 space-y-2" style={{ background: BG_CARD, border: `1px solid ${TEAL_BRD}` }}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: TEAL }}>
              In Practice
            </p>
            <p className="text-sm leading-relaxed" style={{ color: IVORY, lineHeight: 1.85 }}>
              {context.practice}
            </p>
          </div>
        </motion.div>
      )}

      {/* Reflections section */}
      <ReflectionsSection sayingId={saying.id} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// REFLECTIONS — community thoughts on a saying
// ─────────────────────────────────────────────────────────────────
function ReflectionsSection({ sayingId }: { sayingId: string }) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'top' | 'recent'>('top');
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [upvoting, setUpvoting] = useState<string | null>(null);

  // Write state
  const [text, setText] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { setUpvoted(getUpvoted()); }, []);

  const load = useCallback(async (s: string, p: number, reset: boolean) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ sayingId, sort: s, page: String(p) });
      const res = await fetch(`/api/wisdom/reflections?${q}`);
      const data = await res.json();
      if (!res.ok) return;
      const fetched: Reflection[] = data.reflections ?? [];
      setTotal(data.total ?? 0);
      setReflections(prev => reset ? fetched : [...prev, ...fetched]);
      setHasMore((p + 1) * (data.limit ?? 5) < (data.total ?? 0));
      setPage(p);
    } finally { setLoading(false); }
  }, [sayingId]);

  useEffect(() => { load(sort, 0, true); }, [sort, load]);

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const sessionId = getHKSession();
      const res = await fetch('/api/wisdom/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sayingId, text: text.trim(), tag, sessionId }),
      });
      if (res.ok) {
        setSubmitted(true);
        setText('');
        setTag(null);
        load(sort, 0, true); // Refresh list
      }
    } finally { setSubmitting(false); }
  };

  const upvote = async (id: string) => {
    if (upvoted.has(id) || upvoting) return;
    setUpvoting(id);
    try {
      const res = await fetch('/api/wisdom/reflections/upvote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setReflections(prev => prev.map(r => r.id === id ? { ...r, upvotes: data.upvotes } : r));
      markUpvoted(id);
      setUpvoted(prev => new Set([...prev, id]));
    } finally { setUpvoting(null); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: MUTED }}>
          ✦ Reflections {total > 0 && <span style={{ color: FAINT }}>· {total}</span>}
        </p>
        <div className="flex gap-1.5">
          {(['top', 'recent'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className="px-2.5 py-1 rounded-lg text-[10px] transition-all"
              style={{
                background: sort === s ? TEAL_DIM : 'transparent',
                color: sort === s ? TEAL : FAINT,
                border: `1px solid ${sort === s ? TEAL_BRD : 'transparent'}`,
              }}>
              {s === 'top' ? '↑ Top' : '⏱ Recent'}
            </button>
          ))}
        </div>
      </div>

      {/* Write reflection */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: BG_CARD, border: `1px solid ${FAINT}` }}>
        {submitted ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-center py-2" style={{ color: TEAL }}>
            Your reflection has been added. ✦
          </motion.p>
        ) : (
          <>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 500))}
              placeholder="What does this saying mean to you?"
              rows={3}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none transition-all"
              style={{
                background: 'rgba(13,148,136,0.04)',
                color: IVORY,
                border: `1px solid ${FAINT}`,
                fontStyle: text ? 'normal' : 'italic',
              }}
            />
            <div className="flex flex-wrap gap-1.5">
              {REFLECTION_TAGS.map(t => (
                <button key={t.id} onClick={() => setTag(tag === t.id ? null : t.id)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
                  style={{
                    background: tag === t.id ? `${t.color}18` : 'transparent',
                    color: tag === t.id ? t.color : MUTED,
                    border: `1px solid ${tag === t.id ? `${t.color}40` : FAINT}`,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] tabular-nums" style={{ color: FAINT }}>{text.length}/500</span>
              <button
                onClick={submit}
                disabled={!text.trim() || submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all disabled:opacity-30"
                style={{ background: TEAL_DIM, color: TEAL, border: `1px solid ${TEAL_BRD}` }}
              >
                {submitting ? 'Submitting…' : 'Share Reflection'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Reflections list */}
      {loading && reflections.length === 0 ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse"
              style={{ background: BG_CARD, border: `1px solid ${FAINT}`, opacity: 0.5 - i * 0.15 }}>
              <div className="h-3 rounded-full w-3/4" style={{ background: FAINT }} />
            </div>
          ))}
        </div>
      ) : reflections.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: FAINT }}>
          No reflections yet. Be the first to share yours.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {reflections.map((r, i) => {
              const tagInfo = REFLECTION_TAGS.find(t => t.id === r.tag);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i < 5 ? i * 0.04 : 0 }}
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: BG_CARD, border: `1px solid ${FAINT}` }}
                >
                  {tagInfo && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-block"
                      style={{ color: tagInfo.color, background: `${tagInfo.color}14`, border: `1px solid ${tagInfo.color}30` }}>
                      {tagInfo.label}
                    </span>
                  )}
                  <p className="text-sm leading-relaxed" style={{ color: IVORY, lineHeight: 1.75 }}>
                    {r.text}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: FAINT }}>
                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => upvote(r.id)}
                      disabled={upvoted.has(r.id) || !!upvoting}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                      style={{
                        background: upvoted.has(r.id) ? `${TEAL}18` : 'transparent',
                        color: upvoted.has(r.id) ? TEAL : FAINT,
                        border: `1px solid ${upvoted.has(r.id) ? TEAL_BRD : FAINT}`,
                      }}
                    >
                      <span>{upvoted.has(r.id) ? '♥' : '♡'}</span>
                      {r.upvotes > 0 && <span>{r.upvotes}</span>}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {hasMore && (
            <div className="space-y-1 pt-1">
              <button
                onClick={() => load(sort, page + 1, false)}
                disabled={loading}
                className="w-full py-2 text-xs rounded-xl font-medium transition-all disabled:opacity-40"
                style={{ background: TEAL_DIM, color: TEAL, border: `1px solid ${TEAL_BRD}` }}
              >
                {loading ? 'Loading…' : 'Show more reflections'}
              </button>
              <p className="text-center text-[10px]" style={{ color: FAINT }}>
                showing {reflections.length} of {total}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BROWSE — archive of all sayings
// ─────────────────────────────────────────────────────────────────
function BrowseSection({ onViewDetails, savedIds, onToggleSave }: {
  onViewDetails: (s: Saying) => void;
  savedIds: Set<string>;
  onToggleSave: (s: Saying) => void;
}) {
  const [sayings, setSayings] = useState<Saying[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (r: string, c: string, s: string, p: number, reset: boolean) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ region: r, category: c, page: String(p) });
      if (s.trim()) q.set('search', s.trim());
      const res = await fetch(`/api/wisdom/browse?${q}`);
      const data = await res.json();
      if (!res.ok) return;
      const fetched: Saying[] = data.sayings ?? [];
      setTotal(data.total ?? 0);
      setSayings(prev => reset ? fetched : [...prev, ...fetched]);
      setHasMore((p + 1) * (data.limit ?? 12) < (data.total ?? 0));
      setPage(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(region, category, search, 0, true); }, [region, category, search, load]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 400);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>
          ✦ &nbsp; The Archive &nbsp; ✦
        </p>
        <p className="text-sm" style={{ color: IVORY }}>
          Sayings from around the world
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={e => handleSearchInput(e.target.value)}
          placeholder="Search sayings, authors, cultures…"
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            background: BG_CARD,
            color: IVORY,
            border: `1px solid ${FAINT}`,
            fontStyle: searchInput ? 'normal' : 'italic',
          }}
        />
      </div>

      {/* Region filters — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {WISDOM_REGIONS.map(r => (
          <button key={r.id} onClick={() => setRegion(r.id)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-medium flex-shrink-0 transition-all"
            style={{
              background: region === r.id ? TEAL_DIM : 'transparent',
              color: region === r.id ? TEAL : MUTED,
              border: `1px solid ${region === r.id ? TEAL_BRD : FAINT}`,
            }}>
            {r.id !== 'all' && REGION_EMOJI[r.id] ? `${REGION_EMOJI[r.id]} ` : ''}{r.label}
          </button>
        ))}
      </div>

      {/* Category filters — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {WISDOM_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0 transition-all"
            style={{
              background: category === c.id ? 'rgba(222,198,163,0.1)' : 'transparent',
              color: category === c.id ? SAND : FAINT,
              border: `1px solid ${category === c.id ? 'rgba(222,198,163,0.2)' : 'rgba(222,198,163,0.08)'}`,
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Sayings grid */}
      {loading && sayings.length === 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-3 space-y-1.5 animate-pulse"
              style={{ background: BG_CARD, border: `1px solid ${FAINT}`, opacity: 0.5 - i * 0.08 }}>
              <div className="h-2.5 rounded-full w-1/3" style={{ background: FAINT }} />
              <div className="h-3 rounded-full w-full" style={{ background: TEAL_BRD }} />
              <div className="h-2.5 rounded-full w-1/2" style={{ background: FAINT }} />
            </div>
          ))}
        </div>
      ) : sayings.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: FAINT }}>
          No sayings found.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AnimatePresence>
              {sayings.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i < 8 ? i * 0.03 : 0 }}
                  className="rounded-xl p-3 space-y-1.5 group relative"
                  style={{ background: BG_CARD, border: `1px solid ${FAINT}` }}
                >
                  <button
                    onClick={() => onViewDetails(s)}
                    className="w-full text-left space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{REGION_EMOJI[s.region] ?? '🌐'}</span>
                      <span className="text-[9px] tracking-widest uppercase truncate" style={{ color: FAINT }}>
                        {s.origin}
                      </span>
                    </div>
                    <p className="text-[13px] leading-snug font-serif line-clamp-3" style={{ color: IVORY }}>
                      &ldquo;{s.text}&rdquo;
                    </p>
                    <p className="text-[10px] truncate" style={{ color: MUTED }}>
                      — {s.attribution}
                    </p>
                  </button>
                  {/* Save button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSave(s); }}
                    className="absolute top-2.5 right-2.5 text-sm leading-none transition-all opacity-50 group-hover:opacity-100"
                    style={{ color: savedIds.has(s.id) ? TERRA : FAINT }}
                  >
                    {savedIds.has(s.id) ? '★' : '☆'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {hasMore && (
            <div className="space-y-1 pt-1">
              <button
                onClick={() => load(region, category, search, page + 1, false)}
                disabled={loading}
                className="w-full py-2.5 text-xs rounded-xl font-medium transition-all disabled:opacity-40"
                style={{ background: TEAL_DIM, color: TEAL, border: `1px solid ${TEAL_BRD}` }}
              >
                {loading ? 'Loading…' : 'Show more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────
function HKDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${TEAL_BRD})` }} />
      <span className="text-xs tracking-widest" style={{ color: FAINT }}>✦</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${TEAL_BRD})` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SAVED — bookmarked sayings
// ─────────────────────────────────────────────────────────────────
function SavedSection({ onViewDetails, savedIds, onToggleSave, saved }: {
  onViewDetails: (s: Saying) => void;
  savedIds: Set<string>;
  onToggleSave: (s: Saying) => void;
  saved: Saying[];
}) {
  if (saved.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center space-y-2" style={{ background: BG_CARD, border: `1px solid ${FAINT}` }}>
        <p className="text-sm" style={{ color: MUTED }}>No saved sayings yet.</p>
        <p className="text-xs" style={{ color: FAINT }}>
          Tap ☆ on any saying to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-center" style={{ color: MUTED }}>
        {saved.length} saved saying{saved.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {saved.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i < 8 ? i * 0.03 : 0 }}
            className="rounded-xl p-3 space-y-1.5 group relative"
            style={{ background: BG_CARD, border: `1px solid ${FAINT}` }}
          >
            <button
              onClick={() => onViewDetails(s)}
              className="w-full text-left space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{REGION_EMOJI[s.region] ?? '🌐'}</span>
                <span className="text-[9px] tracking-widest uppercase truncate" style={{ color: FAINT }}>
                  {s.origin}
                </span>
              </div>
              <p className="text-[13px] leading-snug font-serif line-clamp-3" style={{ color: IVORY }}>
                &ldquo;{s.text}&rdquo;
              </p>
              <p className="text-[10px] truncate" style={{ color: MUTED }}>
                — {s.attribution}
              </p>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(s); }}
              className="absolute top-2.5 right-2.5 text-sm leading-none transition-all opacity-50 group-hover:opacity-100"
              style={{ color: savedIds.has(s.id) ? TERRA : FAINT }}
            >
              {savedIds.has(s.id) ? '★' : '☆'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────
type HikmahTab = 'today' | 'archive' | 'saved';

export function HikmahApp() {
  const [detailSaying, setDetailSaying] = useState<Saying | null>(null);
  const [tab, setTab] = useState<HikmahTab>('today');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Saying[]>([]);

  useEffect(() => {
    setSavedIds(getSavedIds());
    setSaved(getSavedSayings());
  }, []);

  const doToggleSave = useCallback((s: Saying) => {
    const next = toggleSaved(s);
    setSaved(next);
    setSavedIds(new Set(next.map(x => x.id)));
  }, []);

  const viewDetails = useCallback((s: Saying) => setDetailSaying(s), []);
  const goBack = useCallback(() => setDetailSaying(null), []);

  const TABS: { id: HikmahTab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'archive', label: 'Archive' },
    { id: 'saved', label: `Saved${saved.length > 0 ? ` (${saved.length})` : ''}` },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif" style={{ color: IVORY }}>
          حكمة
        </h2>
        <p className="text-lg font-medium" style={{ color: SAND }}>
          Hikmah
        </p>
        <p className="text-xs tracking-wider" style={{ color: MUTED }}>
          Wisdom from every corner of the earth
        </p>
      </div>

      <AnimatePresence mode="wait">
        {detailSaying ? (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SayingDetail saying={detailSaying} onBack={goBack} savedIds={savedIds} onToggleSave={doToggleSave} />
          </motion.div>
        ) : (
          <motion.div key="tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-5">
            {/* Tab bar */}
            <div className="flex justify-center gap-1.5">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all"
                  style={{
                    background: tab === t.id ? TEAL_DIM : 'transparent',
                    color: tab === t.id ? TEAL : MUTED,
                    border: `1px solid ${tab === t.id ? TEAL_BRD : 'transparent'}`,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tab === 'today' && (
                <motion.div key="t-today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <DailySaying onViewDetails={viewDetails} savedIds={savedIds} onToggleSave={doToggleSave} />
                </motion.div>
              )}
              {tab === 'archive' && (
                <motion.div key="t-archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <BrowseSection onViewDetails={viewDetails} savedIds={savedIds} onToggleSave={doToggleSave} />
                </motion.div>
              )}
              {tab === 'saved' && (
                <motion.div key="t-saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SavedSection onViewDetails={viewDetails} savedIds={savedIds} onToggleSave={doToggleSave} saved={saved} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
