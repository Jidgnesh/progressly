import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import type { Theme } from '@/types';

interface ThemeToggleProps {
  preference: Theme;
  onToggle: () => void;
}

const ThemeToggle = ({ preference, onToggle }: ThemeToggleProps) => {
  const [rotating, setRotating] = useState(false);

  const handleClick = () => {
    setRotating(true);
    onToggle();
    setTimeout(() => setRotating(false), 200);
  };

  const IconComponent = preference === 'light' ? Sun : Moon;

  return (
    <button
      onClick={handleClick}
      className="pressable p-2 rounded-xl"
      style={{ color: 'var(--text-secondary)' }}
      aria-label={`Switch to ${preference === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className={`theme-icon inline-flex ${rotating ? 'theme-icon-rotate' : ''}`}>
        <IconComponent size={20} />
      </span>
    </button>
  );
};

export default ThemeToggle;
