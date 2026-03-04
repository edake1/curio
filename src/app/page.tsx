'use client';

import React, { useState, useSyncExternalStore, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  DndContext, closestCenter, DragEndEvent,
  MouseSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { APPS } from '@/data/apps';
import { ShareButton } from '@/components/share-button';
import { ThemeSelector } from '@/components/theme-selector';

// ── Lazy-loaded app components ──────────────────────
const DynLoading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
  </div>
);
const APP_COMPONENTS: Record<string, React.ComponentType> = {
  'one-decision': dynamic(() => import('@/components/apps/one-decision').then(m => ({ default: m.OneDecisionApp })), { loading: DynLoading }),
  'this-career': dynamic(() => import('@/components/apps/this-career').then(m => ({ default: m.ThisCareerApp })), { loading: DynLoading }),
  'parallel-you': dynamic(() => import('@/components/apps/parallel-you').then(m => ({ default: m.ParallelYouApp })), { loading: DynLoading }),
  'life-stats': dynamic(() => import('@/components/apps/life-stats').then(m => ({ default: m.LifeStatsApp })), { loading: DynLoading }),
  'anti-motivational': dynamic(() => import('@/components/apps/anti-motivational').then(m => ({ default: m.AntiMotivationalApp })), { loading: DynLoading }),
  'what-youll-see': dynamic(() => import('@/components/apps/what-youll-see').then(m => ({ default: m.WhatYoullSeeApp })), { loading: DynLoading }),
  'life-calendar': dynamic(() => import('@/components/apps/life-calendar').then(m => ({ default: m.LifeCalendarApp })), { loading: DynLoading }),
  'pick-one-delete': dynamic(() => import('@/components/apps/pick-one-delete').then(m => ({ default: m.PickOneDeleteApp })), { loading: DynLoading }),
  'sound-of-your-birth': dynamic(() => import('@/components/apps/sound-of-your-birth').then(m => ({ default: m.SoundOfYourBirthApp })), { loading: DynLoading }),
  'the-grand-dao': dynamic(() => import('@/components/apps/the-grand-dao').then(m => ({ default: m.TheGrandDaoApp })), { loading: DynLoading }),
  'your-last-words': dynamic(() => import('@/components/apps/your-last-words').then(m => ({ default: m.YourLastWordsApp })), { loading: DynLoading }),
  'hikmah': dynamic(() => import('@/components/apps/hikmah').then(m => ({ default: m.HikmahApp })), { loading: DynLoading }),
  'dead-app': dynamic(() => import('@/components/apps/dead-app').then(m => ({ default: m.DeadApp })), { loading: DynLoading }),
  'the-rewind': dynamic(() => import('@/components/apps/the-rewind').then(m => ({ default: m.TheRewindApp })), { loading: DynLoading }),
  'the-auction': dynamic(() => import('@/components/apps/the-auction').then(m => ({ default: m.TheAuctionApp })), { loading: DynLoading }),
};

// ── Error boundary ──────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4" style={{ color: 'var(--curio-text-muted)' }}>
          <p className="text-lg font-medium">Something went wrong</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ backgroundColor: 'var(--curio-bg-card)', border: '1px solid var(--curio-border-subtle)' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Drag-to-reorder persistence ─────────────────────
const STORAGE_KEY = 'curio-app-order';

function useAppOrder() {
  const [order, setOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return APPS.map(a => a.id);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const allIds = new Set(APPS.map(a => a.id));
        if (Array.isArray(parsed) && parsed.every((id: string) => allIds.has(id))) {
          const remaining = APPS.filter(a => !parsed.includes(a.id)).map(a => a.id);
          return [...parsed, ...remaining];
        }
      }
    } catch { /* ignore corrupt storage */ }
    return APPS.map(a => a.id);
  });

  const reorder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder)); } catch {}
  }, []);

  return [order, reorder] as const;
}

// Client-side hydration helper
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ViralAppsHub() {
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const isClient = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  // Read ?app=xxx deeplink on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const app = params.get('app');
    if (app && APPS.find(a => a.id === app)) {
      setCurrentApp(app);
    }
  }, []);

  // Sync URL param when navigating
  const navigate = (appId: string | null) => {
    setCurrentApp(appId);
    const url = new URL(window.location.href);
    if (appId) url.searchParams.set('app', appId);
    else url.searchParams.delete('app');
    window.history.pushState({}, '', url.toString());
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--curio-bg)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--curio-bg)', color: 'var(--curio-text)' }}>
      <AnimatePresence mode="wait">
        {!currentApp ? <HubPage onSelectApp={navigate} /> : <AppPage appId={currentApp} onBack={() => navigate(null)} />}
      </AnimatePresence>
    </div>
  );
}

// Per-app accent color for icon glow + tint
const APP_META: Record<string, { accent: string; tint: string; label: string }> = {
  'one-decision':     { accent: '#8b5cf6', tint: 'rgba(139,92,246,0.07)',   label: 'Ethics'       },
  'this-career':      { accent: '#06b6d4', tint: 'rgba(6,182,212,0.07)',    label: 'AI + Humor'   },
  'parallel-you':     { accent: '#10b981', tint: 'rgba(16,185,129,0.07)',   label: 'Identity'     },
  'life-stats':       { accent: '#f97316', tint: 'rgba(249,115,22,0.07)',   label: 'Perspective'  },
  'anti-motivational':{ accent: '#a78bfa', tint: 'rgba(167,139,250,0.07)', label: 'Despair'      },
  'what-youll-see':   { accent: '#6366f1', tint: 'rgba(99,102,241,0.07)',   label: 'Future'       },
  'life-calendar':    { accent: '#c9a95c', tint: 'rgba(201,169,92,0.07)',    label: 'Mortality'    },
  'pick-one-delete':  { accent: '#ef4444', tint: 'rgba(239,68,68,0.07)',    label: 'Values'       },
  'sound-of-your-birth': { accent: '#f43f5e', tint: 'rgba(244,63,94,0.07)', label: 'Nostalgia'    },
  'the-grand-dao':    { accent: '#c9a227', tint: 'rgba(201,162,39,0.07)',   label: 'Cultivation'  },
  'your-last-words':  { accent: '#c8956c', tint: 'rgba(200,149,108,0.07)', label: 'Mortality'    },
  'hikmah':           { accent: '#0d9488', tint: 'rgba(13,148,136,0.07)',   label: 'Wisdom'       },
  'dead-app':         { accent: '#71717a', tint: 'rgba(113,113,122,0.07)',   label: 'Meta'         },
  'the-rewind':       { accent: '#d97706', tint: 'rgba(217,119,6,0.07)',     label: 'History'      },
  'the-auction':      { accent: '#eab308', tint: 'rgba(234,179,8,0.07)',     label: 'Self'         },
};

// ── Sortable card (drag-to-reorder + keyboard a11y) ──
function SortableCard({ app, index, meta, onSelectApp }: {
  app: (typeof APPS)[number]; index: number;
  meta: { accent: string; tint: string; label: string };
  onSelectApp: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' }}
      {...attributes}
      {...listeners}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isDragging ? 0.6 : 1, y: 0 }}
        transition={{ delay: 0.04 * index, duration: 0.35 }}
        whileHover={isDragging ? undefined : { y: -4, transition: { duration: 0.18 } }}
        whileTap={isDragging ? undefined : { scale: 0.97 }}
        onClick={() => onSelectApp(app.id)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSelectApp(app.id); } }}
        role="button"
        tabIndex={0}
        aria-label={`Open ${app.name}`}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl${isDragging ? ' ring-2 ring-white/20 shadow-2xl' : ''}`}
        style={{
          backgroundColor: 'var(--curio-bg-card)',
          border: '1px solid var(--curio-border-subtle)',
          boxShadow: isDragging ? `0 16px 48px ${meta.accent}30` : 'var(--curio-card-shadow)',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
        }}
        onMouseEnter={e => {
          if (isDragging) return;
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${meta.accent}30, 0 8px 32px ${meta.accent}18, 0 2px 8px rgba(0,0,0,0.3)`;
          (e.currentTarget as HTMLElement).style.borderColor = `${meta.accent}40`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--curio-card-shadow)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--curio-border-subtle)';
        }}
      >
        {/* App-color tint */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ background: `radial-gradient(ellipse at 5% 5%, ${meta.accent}18 0%, transparent 65%)`, opacity: 0.6 }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `radial-gradient(ellipse at 5% 5%, ${meta.accent}28 0%, transparent 65%)` }}
        />

        {/* Watermark number */}
        <div
          className="absolute top-3 right-3.5 text-3xl sm:text-4xl font-black tabular-nums leading-none select-none pointer-events-none"
          style={{ color: meta.accent, opacity: 0.12 }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Card body */}
        <div className="relative p-4 sm:p-5 flex flex-col h-full min-h-[148px] sm:min-h-[168px]">
          <div className="mb-3 sm:mb-4">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
              style={{ boxShadow: `0 4px 16px ${meta.accent}40` }}
            >
              <app.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm sm:text-base leading-snug mb-1" style={{ color: 'var(--curio-text)' }}>
              {app.name}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--curio-text-muted)' }}>
              {app.tagline}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span
              className="text-[10px] sm:text-xs font-medium tracking-wider uppercase px-1.5 py-0.5 rounded"
              style={{ color: meta.accent, backgroundColor: `${meta.accent}18` }}
            >
              {meta.label}
            </span>
            <ArrowUpRight
              className="w-3.5 h-3.5 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ color: meta.accent, opacity: 0.7 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HubPage({ onSelectApp }: { onSelectApp: (id: string) => void }) {
  const [appOrder, setAppOrder] = useAppOrder();
  const orderedApps = appOrder.map(id => APPS.find(a => a.id === id)!).filter(Boolean);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = appOrder.indexOf(active.id as string);
      const newIdx = appOrder.indexOf(over.id as string);
      setAppOrder(arrayMove(appOrder, oldIdx, newIdx));
    }
  }, [appOrder, setAppOrder]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen relative overflow-x-hidden">

      {/* ── Atmospheric background orbs ─────────────── */}
      {/* These are large blurred gradient blobs — static, not animated, crisp perf */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-left: violet */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        {/* Top-right: cyan */}
        <div className="absolute -top-16 right-0 w-[420px] h-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        {/* Center: fuchsia */}
        <div className="absolute top-[35%] left-[38%] w-[480px] h-[480px] rounded-full -translate-x-1/2"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        {/* Bottom-right: emerald */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* ── Hero header ───────────────────────────────── */}
      <header className="relative z-10">
        {/* ThemeSelector pinned top-right */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeSelector />
        </div>
        <div className="max-w-5xl mx-auto px-5 pt-16 pb-12 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}>
            {/* Glow bloom behind title */}
            <div className="relative inline-block">
              <div
                className="curio-title-glow absolute inset-0 blur-3xl -z-10 scale-150"
                style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.35) 0%, rgba(236,72,153,0.2) 40%, rgba(103,232,249,0.15) 70%, transparent 100%)' }}
              />
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4">
                <span className="curio-title-gradient">Curio</span>
              </h1>
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-sm sm:text-base font-normal tracking-[0.15em] uppercase"
            style={{ color: 'var(--curio-text-muted)' }}
          >
            A quiet corner of the internet
          </motion.p>
        </div>
        {/* Hairline separator */}
        <div className="h-px mx-4" style={{ background: 'var(--curio-header-line)' }} />
      </header>

      {/* ── App grid ──────────────────────────────────── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={appOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {orderedApps.map((app, index) => {
                const meta = APP_META[app.id] ?? { accent: '#8b5cf6', tint: 'rgba(139,92,246,0.07)', label: '' };
                return <SortableCard key={app.id} app={app} index={index} meta={meta} onSelectApp={onSelectApp} />;
              })}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      <footer className="relative z-10 max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--curio-border-subtle)', color: 'var(--curio-text-muted)' }}>
        <span>Built with curiosity.</span>
        <span>{APPS.length} curiosities</span>
      </footer>
    </motion.div>
  );
}

function AppPage({ appId, onBack }: { appId: string; onBack: () => void }) {
  const app = APPS.find(a => a.id === appId);
  if (!app) return null;

  const renderApp = () => {
    const Component = APP_COMPONENTS[appId];
    return Component ? <Component /> : null;
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen">
      <header className="sticky top-0 z-50 overflow-hidden">
        {/* Frosted glass base — low opacity so backdrop blur is visible */}
        <div className="absolute inset-0 backdrop-blur-2xl" style={{ background: 'var(--curio-header-glass)' }} />
        {/* Top inner highlight — simulates light bouncing off glass surface */}
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'var(--curio-header-top-shine)' }} />
        {/* Bottom hairline — gradient glow, not flat color */}
        <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'var(--curio-header-line)' }} />

        <div className="relative max-w-4xl mx-auto px-3 sm:px-4 h-[52px] flex items-center">
          {/* Left: Back */}
          <button 
            onClick={onBack} 
            className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium tracking-widest uppercase transition-all hover:bg-white/5 active:scale-95"
            style={{ color: 'var(--curio-text-secondary)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Center: Title — absolutely placed so it's never squeezed by siblings */}
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <h1 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--curio-text)' }}>{app.name}</h1>
          </div>

          {/* Right: Actions */}
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeSelector />
            <ShareButton
              title={app.name}
              url={typeof window !== 'undefined' ? `${window.location.origin}?app=${app.id}` : undefined}
            />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-safe">
        <ErrorBoundary>{renderApp()}</ErrorBoundary>
      </main>
    </motion.div>
  );
}
