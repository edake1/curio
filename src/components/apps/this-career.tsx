'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2, Briefcase, DollarSign, Sparkles, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Career } from '@/lib/types';

// ── design tokens ─────────────────────────────────────────────
const IVORY  = 'var(--curio-text, #e8e0d4)';
const MUTED  = 'var(--curio-muted, #a09882)';
const FAINT  = 'rgba(222,198,163,0.13)';
const BG     = 'var(--curio-card, rgba(30,30,28,0.55))';
const CYAN   = '#06b6d4';
const CYAN_DIM = 'rgba(6,182,212,0.1)';
const CYAN_BRD = 'rgba(6,182,212,0.2)';

// ── localStorage persistence ─────────────────────────────────
const STORAGE_KEY = 'curio-career-history';
const FAV_KEY     = 'curio-career-favs';

function getHistory(): Career[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(h: Career[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 30)));
}
function getFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveFavs(s: Set<string>) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...s]));
}

// ── main ─────────────────────────────────────────────────────
type Tab = 'generate' | 'history' | 'favorites';

export function ThisCareerApp() {
  const [career, setCareer] = useState<Career | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Career[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>('generate');
  const [count, setCount] = useState(0);
  const initRef = useRef(false);

  // Load state from localStorage
  useEffect(() => {
    setHistory(getHistory());
    setFavs(getFavs());
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate/career', { method: 'POST' });
      const data: Career = await res.json();
      if (data.title) {
        setCareer(data);
        setCount(c => c + 1);
        setHistory(prev => {
          const next = [data, ...prev.filter(c => c.title !== data.title)].slice(0, 30);
          saveHistory(next);
          return next;
        });
      }
    } finally { setLoading(false); }
  }, []);

  // Auto-generate on first load
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      generate();
    }
  }, [generate]);

  const toggleFav = useCallback((c: Career) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(c.title)) next.delete(c.title);
      else next.add(c.title);
      saveFavs(next);
      return next;
    });
  }, []);

  const favoriteList = history.filter(c => favs.has(c.title));

  const TABS: { id: Tab; label: string }[] = [
    { id: 'generate', label: 'Generate' },
    { id: 'history', label: `History${history.length ? ` (${history.length})` : ''}` },
    { id: 'favorites', label: `Saved${favoriteList.length ? ` (${favoriteList.length})` : ''}` },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: IVORY }}>
          This Career Does Not Exist
        </h2>
        <p className="text-xs tracking-wider" style={{ color: MUTED }}>
          AI-generated jobs that sound real but aren&apos;t
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex justify-center gap-1.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all"
            style={{
              background: tab === t.id ? CYAN_DIM : 'transparent',
              color: tab === t.id ? CYAN : MUTED,
              border: `1px solid ${tab === t.id ? CYAN_BRD : 'transparent'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── GENERATE TAB ── */}
        {tab === 'generate' && (
          <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-5">
            {loading && !career ? (
              <div className="flex flex-col items-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: CYAN }} />
                <p className="text-xs italic" style={{ color: FAINT }}>Inventing a career path…</p>
              </div>
            ) : career && (
              <CareerCard career={career} loading={loading} isFav={favs.has(career.title)} onToggleFav={() => toggleFav(career)} />
            )}

            {/* Generate button */}
            <div className="text-center">
              <button
                onClick={generate}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all disabled:opacity-40 inline-flex items-center gap-2"
                style={{ background: CYAN_DIM, color: CYAN, border: `1px solid ${CYAN_BRD}` }}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Generate Another
              </button>
              {count > 0 && (
                <p className="text-[10px] mt-2 tabular-nums" style={{ color: FAINT }}>
                  {count} career{count !== 1 ? 's' : ''} generated this session
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: FAINT }} />
                <p className="text-sm" style={{ color: MUTED }}>No history yet. Generate your first career!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((c, i) => (
                  <motion.div
                    key={`${c.title}-${i}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <CareerCardCompact career={c} isFav={favs.has(c.title)} onToggleFav={() => toggleFav(c)} onSelect={() => { setCareer(c); setTab('generate'); }} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── FAVORITES TAB ── */}
        {tab === 'favorites' && (
          <motion.div key="favs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {favoriteList.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-8 h-8 mx-auto mb-2" style={{ color: FAINT }} />
                <p className="text-sm" style={{ color: MUTED }}>No favorites yet.</p>
                <p className="text-xs mt-1" style={{ color: FAINT }}>Tap ☆ on any career to save it.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {favoriteList.map((c, i) => (
                  <motion.div
                    key={`fav-${c.title}-${i}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <CareerCardCompact career={c} isFav={true} onToggleFav={() => toggleFav(c)} onSelect={() => { setCareer(c); setTab('generate'); }} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── full career card ─────────────────────────────────────────
function CareerCard({ career, loading, isFav, onToggleFav }: {
  career: Career; loading: boolean; isFav: boolean; onToggleFav: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={career.title}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="rounded-2xl overflow-hidden relative"
          style={{ background: BG, border: `1px solid ${CYAN_BRD}` }}>
          {/* Accent bar */}
          <div className="h-1" style={{ background: `linear-gradient(to right, ${CYAN}, #6366f1)` }} />

          <div className="p-5 sm:p-6 space-y-5">
            {/* Top row */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${CYAN}, #6366f1)`, boxShadow: `0 4px 16px rgba(6,182,212,0.3)` }}>
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold leading-tight mb-1" style={{ color: IVORY }}>
                  {career.title}
                </h3>
                <Badge className="text-[10px]" style={{ background: CYAN_DIM, color: CYAN, borderColor: CYAN_BRD }}>
                  <Sparkles className="w-3 h-3 mr-1" />AI Generated
                </Badge>
              </div>
              <button
                onClick={onToggleFav}
                className="text-lg transition-all shrink-0"
                style={{ color: isFav ? '#f59e0b' : FAINT }}
              >
                {isFav ? '★' : '☆'}
              </button>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              {career.description}
            </p>

            {/* Salary */}
            <div className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.1)' }}>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] tracking-widest uppercase" style={{ color: FAINT }}>Salary Range</div>
                <div className="text-base font-bold text-emerald-400">{career.salary}</div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: FAINT }}>Required Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {career.skills.map((skill, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(222,198,163,0.06)', color: MUTED, border: `1px solid ${FAINT}` }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── compact card for history/favorites ───────────────────────
function CareerCardCompact({ career, isFav, onToggleFav, onSelect }: {
  career: Career; isFav: boolean; onToggleFav: () => void; onSelect: () => void;
}) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-3 group"
      style={{ background: BG, border: `1px solid ${FAINT}` }}>
      <button onClick={onSelect} className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: IVORY }}>{career.title}</p>
        <p className="text-[11px] truncate" style={{ color: MUTED }}>{career.salary}</p>
      </button>
      <button onClick={onToggleFav} className="text-sm transition-all shrink-0"
        style={{ color: isFav ? '#f59e0b' : FAINT }}>
        {isFav ? '★' : '☆'}
      </button>
    </div>
  );
}
