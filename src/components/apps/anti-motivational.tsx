'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2, Copy, Check, Download, Share2, Bookmark, Trash2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DEMOTIVATIONAL_QUOTES } from '@/data/demotivational';
import type { DemotivationalPoster } from '@/lib/types';

// ── Categories ──────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'ambition',     label: 'Ambition',     emoji: '🎯' },
  { id: 'existence',    label: 'Existence',    emoji: '🌌' },
  { id: 'career',       label: 'Career',       emoji: '💼' },
  { id: 'love',         label: 'Love',         emoji: '💔' },
  { id: 'time',         label: 'Time',         emoji: '⏳' },
  { id: 'money',        label: 'Money',        emoji: '💸' },
  { id: 'fitness',      label: 'Fitness',      emoji: '🏃' },
  { id: 'selfhelp',     label: 'Self-help',    emoji: '📚' },
  { id: 'socialmedia',  label: 'Social Media', emoji: '📱' },
  { id: 'creativity',   label: 'Creativity',   emoji: '🎨' },
  { id: 'dating',       label: 'Dating',       emoji: '💘' },
  { id: 'productivity', label: 'Productivity', emoji: '📋' },
] as const;
type CategoryId = typeof CATEGORIES[number]['id'];

// ── Cruelty levels ──────────────────────────────────────────────
const CRUELTY = [
  { id: 'dry',        label: 'Dry',        color: '#94a3b8', desc: 'Implied'  },
  { id: 'bleak',      label: 'Bleak',      color: '#60a5fa', desc: 'Honest'   },
  { id: 'brutal',     label: 'Brutal',     color: '#f97316', desc: 'Stings'   },
  { id: 'nihilistic', label: 'Nihilistic', color: '#c084fc', desc: 'No mercy' },
] as const;
type CrueltyId = typeof CRUELTY[number]['id'];

// ── Poster visual themes ────────────────────────────────────────
const POSTER_THEMES = [
  { bg: '#0d0010', orb1: 'rgba(139,0,180,0.45)', orb2: 'rgba(80,0,100,0.3)',  accent: '#c084fc' },
  { bg: '#000d15', orb1: 'rgba(0,100,160,0.45)', orb2: 'rgba(0,60,90,0.3)',   accent: '#38bdf8' },
  { bg: '#150000', orb1: 'rgba(180,0,0,0.45)',   orb2: 'rgba(110,0,0,0.3)',   accent: '#f87171' },
  { bg: '#00100d', orb1: 'rgba(0,140,80,0.45)',  orb2: 'rgba(0,80,40,0.3)',   accent: '#4ade80' },
  { bg: '#05000f', orb1: 'rgba(80,0,200,0.45)',  orb2: 'rgba(40,0,120,0.3)',  accent: '#818cf8' },
  { bg: '#100a00', orb1: 'rgba(180,80,0,0.45)',  orb2: 'rgba(110,40,0,0.3)',  accent: '#fb923c' },
] as const;

// Pick ambient quotes from fallback pool to rotate on screen
const AMBIENT = DEMOTIVATIONAL_QUOTES.filter((_, i) => i % 3 === 0).slice(0, 9);

interface SavedQuote extends DemotivationalPoster {
  category: CategoryId;
  cruelty: CrueltyId;
  accent: string;
  id: string;
}

const LS_KEY = 'void_history_v1';

function loadHistory(): SavedQuote[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveHistory(h: SavedQuote[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(h)); } catch { /* storage full */ }
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
}

export function AntiMotivationalApp() {
  const [category, setCategory]     = useState<CategoryId>('ambition');
  const [cruelty, setCruelty]       = useState<CrueltyId>('brutal');
  const [poster, setPoster]         = useState<DemotivationalPoster>({ quote: '', subtext: '' });
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const [history, setHistory]       = useState<SavedQuote[]>([]);
  const [doseCount, setDoseCount]   = useState(0);
  const [ambientIdx, setAmbientIdx] = useState(0);
  const recentQuotesRef             = useRef<string[]>([]);
  const exportCardRef               = useRef<HTMLDivElement>(null);
  const mountedRef                  = useRef(false);

  // Load persisted history on mount
  useEffect(() => { setHistory(loadHistory()); }, []);

  // Rotate ambient quotes every 18s
  useEffect(() => {
    const t = setInterval(() => setAmbientIdx(i => (i + 1) % AMBIENT.length), 18000);
    return () => clearInterval(t);
  }, []);

  const fetchPoster = useCallback(async (cat: CategoryId, cruel: CrueltyId) => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch('/api/generate/demotivational', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat,
          intensity: cruel,
          recentQuotes: recentQuotesRef.current.slice(-3),
        }),
      });
      const data = await res.json();
      setPoster(data);
      setThemeIndex(Math.floor(Math.random() * POSTER_THEMES.length));
      setDoseCount(c => c + 1);
      recentQuotesRef.current = [...recentQuotesRef.current, data.quote].slice(-3);
    } catch {
      setPoster({ quote: 'Something went wrong.', subtext: 'Which tracks.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchPoster(category, cruelty);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const theme          = POSTER_THEMES[themeIndex];
  const words          = useMemo(() => poster.quote.split(' '), [poster.quote]);
  const currentCruelty = CRUELTY.find(c => c.id === cruelty)!;
  const currentCat     = CATEGORIES.find(c => c.id === category)!;
  const mobile         = isMobileDevice();

  const copyQuote = () => {
    if (!poster.quote) return;
    navigator.clipboard.writeText(`"${poster.quote}"\n— ${poster.subtext}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToHistory = () => {
    if (!poster.quote) return;
    const entry: SavedQuote = { ...poster, category, cruelty, accent: theme.accent, id: `${Date.now()}` };
    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    saveHistory(next);
    setSaved(true);
  };

  const removeFromHistory = (id: string) => {
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    saveHistory(next);
  };

  const clearHistory = () => { setHistory([]); saveHistory([]); };

  const buildPng = async () => {
    if (!exportCardRef.current) return null;
    return toPng(exportCardRef.current, { pixelRatio: 2, cacheBust: true });
  };

  const downloadCard = async () => {
    setExporting(true);
    try {
      const dataUrl = await buildPng();
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = 'void-wisdom.png';
      link.href = dataUrl;
      link.click();
    } catch (e) { console.error('Export failed', e); }
    finally { setExporting(false); }
  };

  const shareCard = async () => {
    setExporting(true);
    try {
      const dataUrl = await buildPng();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'void-wisdom.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'The Void Speaks' });
      } else {
        navigator.clipboard.writeText(`"${poster.quote}" — ${poster.subtext}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* cancelled */ }
    finally { setExporting(false); }
  };

  const iconBtn = "w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:scale-110 active:scale-95 disabled:opacity-40 dark:bg-white/[0.04] bg-black/[0.06] dark:border-white/[0.09] border-black/10";

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">

      {/* ── Despairmeter ────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] dark:opacity-50 opacity-40">☁︎</span>
          <span className="text-[10px] uppercase tracking-widest dark:text-zinc-500 text-zinc-500 font-semibold">Despairmeter</span>
        </div>

        {/* Rising-bar intensity cards */}
        <div className="grid grid-cols-4 gap-1.5">
          {CRUELTY.map((c, i) => {
            const active   = cruelty === c.id;
            const fillPct  = (i + 1) / CRUELTY.length * 100; // 25 / 50 / 75 / 100
            return (
              <button key={c.id}
                onClick={() => { setCruelty(c.id); fetchPoster(category, c.id); }}
                className="relative overflow-hidden rounded-xl h-[68px] flex flex-col items-center justify-end pb-2.5 transition-all duration-200 active:scale-[0.96] select-none"
                style={active ? {
                  border:    `1px solid ${c.color}55`,
                  boxShadow: `0 0 24px ${c.color}22, inset 0 0 1px ${c.color}40`,
                } : {
                  border: '1px solid transparent',
                  boxShadow: 'inset 0 0 0 1px rgba(120,120,140,0.18)',
                }}>

                {/* Rising fill */}
                <motion.div
                  animate={{ height: `${fillPct}%` }}
                  transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                  style={{ background: active ? `${c.color}1e` : 'rgba(120,120,140,0.07)' }}
                  className="absolute bottom-0 inset-x-0 rounded-b-xl">
                  <div className="absolute top-0 inset-x-0 h-px"
                    style={{ background: active
                      ? `linear-gradient(to right, transparent, ${c.color}70, transparent)`
                      : `linear-gradient(to right, transparent, rgba(140,140,160,0.25), transparent)` }} />
                </motion.div>

                {/* Label — plain span; active colour via style, inactive via className so nothing stomps Tailwind */}
                <span
                  className={`relative z-10 text-[11px] font-bold leading-none mb-0.5 transition-colors duration-200 ${active ? '' : 'dark:text-zinc-300 text-zinc-700'}`}
                  style={active ? { color: c.color } : {}}>
                  {c.label}
                </span>

                {/* Desc */}
                <span
                  className={`relative z-10 text-[9px] leading-none font-medium transition-colors duration-200 ${active ? '' : 'dark:text-zinc-500 text-zinc-400'}`}
                  style={active ? { color: c.color, opacity: 0.7 } : {}}>
                  {c.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category pills ─────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <button key={cat.id}
            onClick={() => { setCategory(cat.id); fetchPoster(cat.id, cruelty); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 border ${
              category === cat.id
                ? 'dark:bg-white/10 bg-black/[0.07] dark:border-white/[0.22] border-black/20 dark:text-white text-zinc-900'
                : 'bg-transparent dark:border-white/[0.06] border-black/[0.08] dark:text-white/[0.38] text-zinc-500 hover:text-zinc-700 dark:hover:text-white/60'
            }`}>
            <span>{cat.emoji}</span>{cat.label}
          </button>
        ))}
      </div>

      {/* ── Poster card ────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-3" style={{ minHeight: 260 }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: theme.accent }} />
            <p className="text-[12px] text-zinc-600 italic">Consulting the abyss…</p>
          </motion.div>
        ) : poster.quote ? (
          <motion.div key={poster.quote}
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}>

            <div className="relative overflow-hidden rounded-2xl"
              style={{ background: theme.bg, border: `1px solid ${theme.accent}22`, boxShadow: `0 0 80px ${theme.orb1}, 0 1px 0 ${theme.accent}28` }}>
              {/* Noise texture */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
              {/* Ambient orbs */}
              <motion.div aria-hidden className="absolute -top-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 65%)`, filter: 'blur(55px)' }}
                animate={{ x: [0, 20, -12, 0], y: [0, -16, 14, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div aria-hidden className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 65%)`, filter: 'blur(55px)' }}
                animate={{ x: [0, -18, 10, 0], y: [0, 16, -12, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />

              <div className="relative px-8 sm:px-14 py-10 sm:py-14">
                {/* Giant quote watermark */}
                <div className="absolute top-0 left-3 sm:left-5 font-serif text-[8rem] sm:text-[10rem] text-white select-none leading-none pointer-events-none" style={{ opacity: 0.04 }}>&ldquo;</div>

                {/* Category + cruelty badges */}
                <div className="flex justify-center gap-2 mb-7">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ color: theme.accent, background: `${theme.accent}14`, border: `1px solid ${theme.accent}28` }}>
                    {currentCat.emoji} {currentCat.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ color: currentCruelty.color, background: `${currentCruelty.color}14`, border: `1px solid ${currentCruelty.color}28` }}>
                    {currentCruelty.label}
                  </span>
                </div>

                {/* Quote with word-by-word reveal */}
                <blockquote className="relative z-10 text-xl sm:text-2xl md:text-[1.65rem] font-bold text-white leading-relaxed tracking-tight mb-7 text-center">
                  {words.map((word, i) => (
                    <motion.span key={`${poster.quote}-${i}`}
                      initial={{ opacity: 0, y: 8, filter: 'blur(5px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.18 + i * 0.038, duration: 0.38, ease: 'easeOut' }}
                      className="inline-block mr-[0.26em]">
                      {word}
                    </motion.span>
                  ))}
                </blockquote>

                {/* Accent divider */}
                <motion.div className="mb-6 origin-center" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="h-px w-16 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)`, opacity: 0.65 }} />
                </motion.div>

                {/* Subtext */}
                <motion.p className="text-sm sm:text-base italic text-center font-medium" style={{ color: theme.accent }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}>
                  {poster.subtext}
                </motion.p>
              </div>
            </div>

            {/* Action bar */}
            <motion.div className="mt-3.5 flex items-center justify-between px-0.5"
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}>
              <div className="flex items-center gap-1.5">
                <button onClick={saveToHistory} title="Save" className={iconBtn}>
                  <Bookmark className={`w-3.5 h-3.5 transition-colors ${saved ? 'fill-amber-400 stroke-amber-400' : 'dark:text-zinc-400 text-zinc-500'}`} />
                </button>
                <button onClick={copyQuote} title="Copy" className={iconBtn}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 dark:text-zinc-400 text-zinc-500" />}
                </button>
                {/* Mobile: one share button that opens native sheet. Desktop: download + share separately. */}
                {mobile ? (
                  <button onClick={shareCard} disabled={exporting} title="Share image" className={iconBtn}>
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin dark:text-zinc-400 text-zinc-500" /> : <Share2 className="w-3.5 h-3.5 dark:text-zinc-400 text-zinc-500" />}
                  </button>
                ) : (
                  <>
                    <button onClick={downloadCard} disabled={exporting} title="Download PNG" className={iconBtn}>
                      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin dark:text-zinc-400 text-zinc-500" /> : <Download className="w-3.5 h-3.5 dark:text-zinc-400 text-zinc-500" />}
                    </button>
                    <button onClick={shareCard} disabled={exporting} title="Share" className={iconBtn}>
                      <Share2 className="w-3.5 h-3.5 dark:text-zinc-400 text-zinc-500" />
                    </button>
                  </>
                )}
              </div>

              <button onClick={() => fetchPoster(category, cruelty)} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.97]"
                style={{ background: `${theme.accent}16`, border: `1px solid ${theme.accent}38`, color: theme.accent }}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                More despair
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Ambient dispatches — fills whitespace ───────── */}
      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className="rounded-xl overflow-hidden dark:border-white/[0.05] border-black/[0.07] border">
          <div className="px-4 py-2 flex items-center justify-between dark:bg-white/[0.02] bg-black/[0.03] dark:border-b-white/[0.04] border-b-black/[0.06] border-b">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-600">From the archives</span>
            {doseCount > 0 && (
              <span className="text-[10px] text-zinc-700">{doseCount} dose{doseCount !== 1 ? 's' : ''} this session</span>
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={ambientIdx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.5 }} className="px-5 py-4">
              <p className="text-[13px] dark:text-zinc-500 text-zinc-600 leading-relaxed italic">
                &ldquo;{AMBIENT[ambientIdx].quote}&rdquo;
              </p>
              <p className="text-[11px] dark:text-zinc-600 text-zinc-500 mt-1.5">— {AMBIENT[ambientIdx].subtext}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Persisted history ──────────────────────────── */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] uppercase tracking-widest dark:text-zinc-600 text-zinc-500 font-semibold">Saved</span>
            <button onClick={clearHistory}
              className="text-[10px] dark:text-zinc-600 text-zinc-500 dark:hover:text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>
          <div className="space-y-2">
            {history.map(h => {
              const cat = CATEGORIES.find(c => c.id === h.category);
              return (
                <motion.div key={h.id} layout
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                  className="group relative rounded-xl px-4 py-3 overflow-hidden"
                  style={{ background: `${h.accent}10`, border: `1px solid ${h.accent}28` }}>
                  <div className="absolute top-0 left-0 w-[3px] h-full rounded-l-xl" style={{ background: h.accent, opacity: 0.55 }} />
                  <p className="text-[12.5px] font-medium dark:text-white/75 text-zinc-800 leading-snug mb-1 pl-2">{h.quote}</p>
                  <p className="text-[11px] italic pl-2 mb-1.5" style={{ color: h.accent }}>— {h.subtext}</p>
                  <div className="flex items-center justify-between pl-2">
                    <div className="flex gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full dark:text-zinc-500 text-zinc-600 dark:bg-white/[0.05] bg-black/[0.06]">{cat?.emoji} {cat?.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full dark:text-zinc-500 text-zinc-600 dark:bg-white/[0.05] bg-black/[0.06] capitalize">{h.cruelty}</span>
                    </div>
                    <button onClick={() => removeFromHistory(h.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 dark:text-zinc-600 text-zinc-400 dark:hover:text-zinc-400 hover:text-zinc-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Export card (off-screen, html-to-image target) */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
        <div ref={exportCardRef} style={{
          width: '800px', padding: '64px 72px 56px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: theme.bg, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -80, left: -80, width: 400, height: 400, borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 65%)`, filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: -60, right: -60, width: 360, height: 360, borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 65%)`, filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: 8, left: 16, fontSize: '160px', lineHeight: 1,
            color: 'rgba(255,255,255,0.04)', fontFamily: 'Georgia, serif' }}>&ldquo;</div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 34 }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600,
                padding: '4px 12px', borderRadius: '999px', color: theme.accent,
                background: `${theme.accent}18`, border: `1px solid ${theme.accent}35` }}>
                {currentCat.emoji} {currentCat.label}
              </span>
              <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600,
                padding: '4px 12px', borderRadius: '999px', color: currentCruelty.color,
                background: `${currentCruelty.color}18`, border: `1px solid ${currentCruelty.color}35` }}>
                {currentCruelty.label}
              </span>
            </div>
            <p style={{ fontSize: '30px', fontWeight: 700, color: '#fff', lineHeight: 1.5,
              letterSpacing: '-0.02em', marginBottom: 34 }}>{poster.quote}</p>
            <div style={{ width: 72, height: 1, margin: '0 0 26px',
              background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)`, opacity: 0.65 }} />
            <p style={{ fontSize: '15px', fontStyle: 'italic', color: theme.accent, fontWeight: 500, marginBottom: 52 }}>
              {poster.subtext}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.05em' }}>The Void</span>
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}>curio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
