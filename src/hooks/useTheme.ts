import { useState } from 'react';
import type { Theme } from '@/types';
import { THEME_KEY } from '@/constants';
import { initTheme, applyTheme, toggleTheme as toggle } from '@/utils/theme';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => initTheme());

  const toggleTheme = () => {
    const next = toggle(theme);
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.body.classList.add('theme-transitioning');
    applyTheme(next);
    setTimeout(() => document.body.classList.remove('theme-transitioning'), 300);
  };

  return { theme, toggleTheme };
};
