'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = 'sitepulse_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default matches the no-flash script in layout.tsx (dark).
  const [theme, setThemeState] = useState<Theme>('dark');

  // Sync from whatever the inline script already applied to <html>.
  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || 'dark';
    setThemeState(current);
  }, []);

  const apply = (t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* storage may be unavailable — ignore */
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme: apply,
    toggleTheme: () => apply(theme === 'dark' ? 'light' : 'dark'),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/** Inline script string injected before paint to avoid a theme flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;
