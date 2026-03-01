'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'midnight' | 'cosmos' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'midnight',
  setTheme: () => {},
});

const STORAGE_KEY = 'curio_theme';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'midnight';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'midnight' || stored === 'cosmos' || stored === 'light') return stored;
  } catch { /* */ }
  // Auto-detect system preference
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'midnight';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('midnight');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Keep the dark class for shadcn components in dark themes
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* */ }
  }, [theme, mounted]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
