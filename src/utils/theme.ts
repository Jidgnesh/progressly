import type { Theme } from '@/types';
import { THEME_KEY } from '@/constants';

/** Get system preferred theme */
export const getSystemTheme = (): Theme => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** Apply theme to document */
export const applyTheme = (theme: Theme): void => {
  if (theme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

/** Toggle between dark and light theme */
export const toggleTheme = (current: Theme): Theme => {
  return current === 'dark' ? 'light' : 'dark';
};

/** Initialize theme from storage or system preference */
export const initTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_KEY);
  const theme: Theme = stored === 'dark' || stored === 'light' ? stored : getSystemTheme();
  applyTheme(theme);
  return theme;
};
