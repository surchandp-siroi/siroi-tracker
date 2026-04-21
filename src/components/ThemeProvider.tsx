import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    // Theme toggling disabled as requested
  };

  if (!mounted) {
      return <div className="min-h-screen bg-[#0f172a]" />; // fallback dark background while loading
  }

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
