'use client';

import { useState, useSyncExternalStore, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { APPS } from '@/data/apps';
import { ShareButton } from '@/components/share-button';
import { ThemeSelector } from '@/components/theme-selector';
import { OneDecisionApp } from '@/components/apps/one-decision';
import { ThisCareerApp } from '@/components/apps/this-career';
import { ParallelYouApp } from '@/components/apps/parallel-you';
import { LifeStatsApp } from '@/components/apps/life-stats';
import { AntiMotivationalApp } from '@/components/apps/anti-motivational';
import { WhatYoullSeeApp } from '@/components/apps/what-youll-see';
import { LifeCalendarApp } from '@/components/apps/life-calendar';
import { PickOneDeleteApp } from '@/components/apps/pick-one-delete';
import { SoundOfYourBirthApp } from '@/components/apps/sound-of-your-birth';
import { WhileHereApp } from '@/components/apps/while-here';

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
  'life-calendar':    { accent: '#f43f5e', tint: 'rgba(244,63,94,0.07)',    label: 'Mortality'    },
  'pick-one-delete':  { accent: '#ef4444', tint: 'rgba(239,68,68,0.07)',    label: 'Values'       },
  'sound-of-your-birth': { accent: '#f43f5e', tint: 'rgba(244,63,94,0.07)', label: 'Nostalgia'    },
  'while-here':       { accent: '#0ea5e9', tint: 'rgba(14,165,233,0.07)',   label: 'Mindfulness'  },
};

function HubPage({ onSelectApp }: { onSelectApp: (id: string) => void }) {
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
        <div className="max-w-5xl mx-auto px-5 pt-14 pb-10 text-center">
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Curio</span>
            </h1>
            <p className="text-base sm:text-lg font-medium tracking-wide" style={{ color: 'var(--curio-text-secondary)' }}>
              Questions worth sitting with.
            </p>
          </motion.div>
        </div>
        {/* Hairline separator */}
        <div className="h-px mx-4" style={{ background: 'var(--curio-header-line)' }} />
      </header>

      {/* ── App grid ──────────────────────────────────── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {APPS.map((app, index) => {
            const meta = APP_META[app.id] ?? { accent: '#8b5cf6', tint: 'rgba(139,92,246,0.07)', label: '' };
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index, duration: 0.35 }}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectApp(app.id)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: 'var(--curio-bg-card)',
                  border: '1px solid var(--curio-border-subtle)',
                  boxShadow: 'var(--curio-card-shadow)',
                  transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${meta.accent}30, 0 8px 32px ${meta.accent}18, 0 2px 8px rgba(0,0,0,0.3)`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${meta.accent}40`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--curio-card-shadow)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--curio-border-subtle)';
                }}
              >
                {/* App-color tint: stronger on hover via opacity transition */}
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
                  className="absolute top-3 right-3.5 text-3xl sm:text-4xl font-black tabular-nums leading-none select-none pointer-events-none transition-opacity duration-300"
                  style={{ color: meta.accent, opacity: 0.12 }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Card body */}
                <div className="relative p-4 sm:p-5 flex flex-col h-full min-h-[148px] sm:min-h-[168px]">
                  {/* Icon */}
                  <div className="mb-3 sm:mb-4">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
                      style={{ boxShadow: `0 4px 16px ${meta.accent}40` }}
                    >
                      <app.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm sm:text-base leading-snug mb-1" style={{ color: 'var(--curio-text)' }}>
                      {app.name}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--curio-text-muted)' }}>
                      {app.tagline}
                    </p>
                  </div>

                  {/* Footer: label + arrow */}
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
            );
          })}
        </div>
      </main>

      <footer className="relative z-10 max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--curio-border-subtle)', color: 'var(--curio-text-muted)' }}>
        <span>Built with curiosity.</span>
        <span>{APPS.length} experiments</span>
      </footer>
    </motion.div>
  );
}

function AppPage({ appId, onBack }: { appId: string; onBack: () => void }) {
  const app = APPS.find(a => a.id === appId);
  if (!app) return null;

  const renderApp = () => {
    switch (appId) {
      case 'one-decision': return <OneDecisionApp />;
      case 'this-career': return <ThisCareerApp />;
      case 'parallel-you': return <ParallelYouApp />;
      case 'life-stats': return <LifeStatsApp />;
      case 'anti-motivational': return <AntiMotivationalApp />;
      case 'what-youll-see': return <WhatYoullSeeApp />;
      case 'life-calendar': return <LifeCalendarApp />;
      case 'pick-one-delete': return <PickOneDeleteApp />;
      case 'sound-of-your-birth': return <SoundOfYourBirthApp />;
      case 'while-here': return <WhileHereApp />;
      default: return null;
    }
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
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-safe">{renderApp()}</main>
    </motion.div>
  );
}
