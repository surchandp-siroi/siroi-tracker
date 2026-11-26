import { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  type ThemeMode,
  THEME_CHANGE_EVENT,
  getEffectiveTheme,
  getScheduledTheme,
  getNextTransitionTimestamp,
  clearManualOverride,
} from '@/utils/themeSchedule';
import { applyTheme } from '@/components/application/theme/theme-toggle';

export type Theme = ThemeMode;

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
  const [theme, setThemeState] = useState<Theme>(() => getEffectiveTheme());
  const [mounted, setMounted] = useState(false);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme, { persist: true, isManual: true });
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  // Synchronize Capacitor Native Status Bar whenever theme changes
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          if (theme === 'dark') {
            await StatusBar.setStyle({ style: Style.Dark });
          } else {
            await StatusBar.setStyle({ style: Style.Light });
          }
        } catch (e) {
          console.warn('Theme native sync failed:', e);
        }
      })();
    }
  }, [theme]);

  // Main lifecycle: initial application, scheduled IST transitions & visibility listeners
  useEffect(() => {
    setMounted(true);

    // Initial theme resolution
    const initial = getEffectiveTheme();
    setThemeState(initial);
    applyTheme(initial, { persist: false, isManual: false });

    // Sync state when ThemeToggle in sidebar or elsewhere fires THEME_CHANGE_EVENT
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail === 'light' || customEvent.detail === 'dark') {
        setThemeState(customEvent.detail);
      }
    };
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    // Schedule exact timeout for next IST transition (17:00 or 06:00)
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;

    const setupTransitionTimer = () => {
      if (transitionTimer) clearTimeout(transitionTimer);

      const next = getNextTransitionTimestamp();
      transitionTimer = setTimeout(() => {
        // Auto-shift to scheduled theme and clear manual override
        clearManualOverride();
        const scheduled = getScheduledTheme();
        setThemeState(scheduled);
        applyTheme(scheduled, { persist: true, isManual: false });
        setupTransitionTimer();
      }, next.msUntilNext);
    };

    setupTransitionTimer();

    // Verify theme on wake (tab visibility/focus) and periodically (every 15s)
    const checkSchedule = () => {
      const effective = getEffectiveTheme();
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      if (effective !== current) {
        setThemeState(effective);
        applyTheme(effective, { persist: true, isManual: false });
        setupTransitionTimer();
      }
    };

    const intervalId = setInterval(checkSchedule, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSchedule();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkSchedule);

    return () => {
      if (transitionTimer) clearTimeout(transitionTimer);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkSchedule);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background-full" />;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
