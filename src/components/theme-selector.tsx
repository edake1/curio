'use client';

import { motion } from 'framer-motion';
import { Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme, type Theme } from './theme-provider';

const THEMES: { id: Theme; icon: typeof Moon; label: string }[] = [
  { id: 'midnight', icon: Moon, label: 'Midnight' },
  { id: 'cosmos', icon: Sparkles, label: 'Cosmos' },
  { id: 'light', icon: Sun, label: 'Light' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-0.5 backdrop-blur-sm"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--curio-border-subtle)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {THEMES.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="relative flex items-center justify-center w-7 h-7 rounded-full transition-all active:scale-90"
            title={t.label}
            aria-label={`Switch to ${t.label} theme`}
          >
            {active && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'var(--curio-glow)',
                  border: '1px solid var(--curio-border)',
                  boxShadow: '0 0 8px var(--curio-glow)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <t.icon
              className="relative w-3 h-3 transition-colors"
              style={{ color: active ? 'var(--curio-text)' : 'var(--curio-text-muted)' }}
            />
          </button>
        );
      })}
    </div>
  );
}
