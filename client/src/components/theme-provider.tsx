import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

type ResolvedTheme = 'dark' | 'light';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const THEME_TOKENS: Record<ResolvedTheme, Record<string, string>> = {
  light: {
    '--background': '#f7f4ec',
    '--foreground': '#141521',
    '--muted': '#ebe6dc',
    '--muted-foreground': '#595a68',
    '--card': 'rgba(255, 255, 255, 0.8)',
    '--card-foreground': '#1f212f',
    '--popover': 'rgba(255, 255, 255, 0.95)',
    '--popover-foreground': '#141521',
    '--primary': '#1f8a70',
    '--primary-foreground': '#fdfbf5',
    '--secondary': '#233746',
    '--secondary-foreground': '#f5efe2',
    '--accent': '#f6c542',
    '--accent-foreground': '#1f212f',
    '--destructive': '#c24747',
    '--destructive-foreground': '#fff8f8',
    '--border': '#d9d1c1',
    '--input': '#d2c8b7',
    '--ring': '#2ea285',
    '--chart-1': '#1f8a70',
    '--chart-2': '#f6c542',
    '--chart-3': '#e76f51',
    '--chart-4': '#33658a',
    '--chart-5': '#7d6394',
    '--sidebar-background': 'rgba(255, 255, 255, 0.75)',
    '--sidebar-foreground': '#1f212f',
    '--sidebar-primary': '#1f8a70',
    '--sidebar-primary-foreground': '#fdfbf5',
    '--sidebar-accent': 'rgba(31, 138, 112, 0.08)',
    '--sidebar-accent-foreground': '#1f8a70',
    '--sidebar-border': 'rgba(31, 138, 112, 0.12)',
    '--sidebar-ring': 'rgba(31, 138, 112, 0.5)',
    '--felt-green': '#145a3d',
    '--action-emerald': '#2ea285',
    '--victory-gold': '#f6c542',
    '--loss-crimson': '#c24747',
    '--surface-cream': '#fdfbf5',
    '--felt-base': '#145a3d',
    '--felt-grid': 'rgba(11, 102, 66, 0.28)',
    '--felt-border': 'rgba(10, 55, 36, 0.45)',
    '--chip-gold': '#f6c542',
    '--chip-slate': '#233746',
    '--chip-emerald': '#2ea285',
    '--chip-ruby': '#c24747',
    '--font-sans': "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    '--font-display': "'Poppins', 'Inter', sans-serif",
    '--font-mono': "'IBM Plex Mono', 'SFMono-Regular', ui-monospace, monospace",
    '--heading-weight': '600',
    '--body-weight': '400',
    '--tracking-normal': '0',
    '--line-height-tight': '1.2',
    '--line-height-normal': '1.55',
    '--radius': '18px',
    '--shadow-table': '0 32px 45px -40px rgba(12, 64, 44, 0.8)',
    '--shadow-ambient': '0 18px 30px -20px rgba(24, 32, 48, 0.35)',
    '--transition-snappy': '200ms cubic-bezier(0.33, 1, 0.68, 1)',
  },
  dark: {
    '--background': '#0c1016',
    '--foreground': '#e9ecf5',
    '--muted': 'rgba(20, 31, 45, 0.85)',
    '--muted-foreground': '#a1a9c1',
    '--card': 'rgba(10, 17, 26, 0.82)',
    '--card-foreground': '#f2f5ff',
    '--popover': 'rgba(10, 17, 26, 0.95)',
    '--popover-foreground': '#f2f5ff',
    '--primary': '#47c7a4',
    '--primary-foreground': '#06231a',
    '--secondary': '#1a2733',
    '--secondary-foreground': '#dbe3f5',
    '--accent': '#f6c542',
    '--accent-foreground': '#1a1f29',
    '--destructive': '#ff7269',
    '--destructive-foreground': '#1b090a',
    '--border': 'rgba(85, 120, 135, 0.35)',
    '--input': 'rgba(55, 85, 103, 0.55)',
    '--ring': 'rgba(71, 199, 164, 0.75)',
    '--chart-1': '#47c7a4',
    '--chart-2': '#f6c542',
    '--chart-3': '#ff8f6b',
    '--chart-4': '#5b7bff',
    '--chart-5': '#a891ff',
    '--sidebar-background': 'rgba(16, 22, 31, 0.82)',
    '--sidebar-foreground': '#e9ecf5',
    '--sidebar-primary': '#47c7a4',
    '--sidebar-primary-foreground': '#06231a',
    '--sidebar-accent': 'rgba(71, 199, 164, 0.12)',
    '--sidebar-accent-foreground': '#47c7a4',
    '--sidebar-border': 'rgba(71, 199, 164, 0.2)',
    '--sidebar-ring': 'rgba(71, 199, 164, 0.45)',
    '--felt-green': '#0a3424',
    '--action-emerald': '#47c7a4',
    '--victory-gold': '#f6c542',
    '--loss-crimson': '#ff7269',
    '--surface-cream': '#10161f',
    '--felt-base': '#0a3424',
    '--felt-grid': 'rgba(22, 110, 78, 0.26)',
    '--felt-border': 'rgba(5, 26, 17, 0.6)',
    '--chip-gold': '#f6c542',
    '--chip-slate': '#1a2733',
    '--chip-emerald': '#47c7a4',
    '--chip-ruby': '#ff7269',
    '--font-sans': "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    '--font-display': "'Poppins', 'Inter', sans-serif",
    '--font-mono': "'IBM Plex Mono', 'SFMono-Regular', ui-monospace, monospace",
    '--heading-weight': '600',
    '--body-weight': '400',
    '--tracking-normal': '0',
    '--line-height-tight': '1.25',
    '--line-height-normal': '1.6',
    '--radius': '20px',
    '--shadow-table': '0 36px 48px -38px rgba(5, 28, 20, 0.9)',
    '--shadow-ambient': '0 24px 42px -28px rgba(8, 14, 25, 0.8)',
    '--transition-snappy': '220ms cubic-bezier(0.33, 1, 0.68, 1)',
  },
};

const resolveSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyThemeTokens = (theme: ResolvedTheme) => {
  const root = window.document.documentElement;
  const tokens = THEME_TOKENS[theme];

  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'furious-five-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => {
      if (typeof window === 'undefined') return defaultTheme;
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
  );

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    return theme === 'system' ? resolveSystemTheme() : theme;
  }, [theme]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.dataset.theme = resolvedTheme;

    applyThemeTokens(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const nextTheme = resolveSystemTheme();
      applyThemeTokens(nextTheme);
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(nextTheme);
      root.dataset.theme = nextTheme;
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
