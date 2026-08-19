import { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'light';
  });
  const [mounted, setMounted] = useState(false);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', nextTheme);
      return nextTheme;
    });
  };

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          if (theme === 'dark') {
            await StatusBar.setStyle({ style: Style.Dark });
            await NavigationBar.setNavigationBarColor({ color: '#0f172a', darkButtons: false });
          } else {
            await StatusBar.setStyle({ style: Style.Light });
            await NavigationBar.setNavigationBarColor({ color: '#f1f5f9', darkButtons: true });
          }
        } catch (e) {
          console.warn('Theme native sync failed:', e);
        }
      })();
    }
  }, [theme]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
