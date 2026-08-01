import { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });
  const [mounted, setMounted] = useState(false);

  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', nextTheme);
      return nextTheme;
    });
  };

  useEffect(() => {
    setMounted(true);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
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
      return <div className="min-h-screen bg-slate-50" />; // fallback light background while loading
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
