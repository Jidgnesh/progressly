import { Home, History, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Page } from '@/types';

interface BottomNavProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  trashCount: number;
}

interface NavTab {
  id: Page;
  icon: LucideIcon;
  label: string;
}

const tabs: NavTab[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'trash', icon: Trash2, label: 'Trash' },
];

const BottomNav = ({ currentPage, setCurrentPage, trashCount }: BottomNavProps) => {
  const activeIndex = tabs.findIndex(t => t.id === currentPage);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      role="navigation"
      aria-label="Main navigation"
      style={{
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-card)',
      }}
    >
      <div className="relative flex justify-around items-center px-4 py-3">
        {/* Sliding pill indicator */}
        <div
          className="nav-pill absolute bottom-1 h-[3px] rounded-full"
          style={{
            width: 32,
            background: 'var(--accent)',
            left: `calc(${(activeIndex / tabs.length) * 100}% + ${100 / tabs.length / 2}% - 16px)`,
          }}
        />

        {tabs.map((tab) => {
          const isActive = currentPage === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentPage(tab.id)}
              className="pressable relative flex flex-col items-center gap-1 p-2"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                ...(isActive ? { filter: 'drop-shadow(0 0 8px var(--accent-glow))' } : {}),
              }}
            >
              <IconComponent size={22} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.id === 'trash' && trashCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: 'var(--priority-high)' }}
                >
                  {trashCount > 9 ? '9+' : trashCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
