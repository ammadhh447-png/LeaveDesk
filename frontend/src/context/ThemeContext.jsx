import { createContext, useContext, useLayoutEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const applyThemeClass = (theme) => {
  const isDark = theme === 'dark';
  const html = document.documentElement;
  const body = document.body;
  const root = document.getElementById('root');

  html.classList.toggle('dark', isDark);
  html.dataset.theme = theme;
  html.style.colorScheme = theme;
  body.dataset.theme = theme;
  if (root) root.dataset.theme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#030712' : '#f3f4f6');
};

const getInitialTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const initial = getInitialTheme();
    applyThemeClass(initial);
    return initial;
  });

  useLayoutEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyThemeClass(next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
