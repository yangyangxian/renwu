import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'theme';

function readStoredMode(): ThemeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch (e) {
    // ignore (e.g., SSR)
  }
  return null;
}

function saveMode(mode: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (e) {
    // ignore
  }
}

function prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(dark: boolean) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.classList.toggle('dark', dark);
}

export function useDarkMode() {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode() ?? 'system');
  const [isDark, setIsDark] = useState<boolean>(() => (readStoredMode() === 'dark' ? true : readStoredMode() === 'light' ? false : prefersDark()));

  // keep DOM in sync when mode changes
  useEffect(() => {
    if (mode === 'dark') {
      applyTheme(true);
      setIsDark(true);
    } else if (mode === 'light') {
      applyTheme(false);
      setIsDark(false);
    } else {
      const pd = prefersDark();
      applyTheme(pd);
      setIsDark(pd);
    }
  }, [mode]);

  // listen for system changes only when following system
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      applyTheme(e.matches);
      setIsDark(e.matches);
    };
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handler as any);
    else if (typeof mq.addListener === 'function') (mq as any).addListener(handler);
    return () => {
      try {
        if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handler as any);
        else if (typeof mq.removeListener === 'function') (mq as any).removeListener(handler);
      } catch (e) {
        // ignore
      }
    };
  }, [mode]);

  const setDark = useCallback(() => {
    saveMode('dark');
    setMode('dark');
  }, []);

  const setLight = useCallback(() => {
    saveMode('light');
    setMode('light');
  }, []);

  const setSystem = useCallback(() => {
    saveMode('system');
    setMode('system');
  }, []);

  const toggleDark = useCallback(() => {
    // toggle explicit dark/light
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      saveMode(next);
      return next;
    });
  }, []);

  const resetToSystem = useCallback(() => setSystem(), [setSystem]);

  return { isDark, toggleDark, resetToSystem, setDark, setLight, setSystem, mode } as const;
}
