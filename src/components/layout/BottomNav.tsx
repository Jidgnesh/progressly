import { Home, History, Trash2, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Page } from '@/types';

interface SideNavProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  trashCount: number;
  onAddTask: () => void;
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

const SideNav = ({ currentPage, setCurrentPage, trashCount, onAddTask }: SideNavProps) => {
  const activeIndex = tabs.findIndex(t => t.id === currentPage);

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col items-center py-6 px-2 gap-2"
      role="navigation"
      aria-label="Main navigation"
      style={{
        width: 64,
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid var(--border-card)',
      }}
    >
      {/* Sliding pill indicator */}
      <div className="relative flex flex-col items-center gap-1 flex-1">
        <div
          className="nav-pill absolute left-0 w-[3px] rounded-full"
          style={{
            height: 24,
            background: 'var(--accent)',
            top: `calc(${activeIndex * 56}px + 14px)`,
            transition: 'top 200ms var(--ease-out)',
          }}
        />

        {tabs.map((tab) => {
          const isActive = currentPage === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentPage(tab.id)}
              className="pressable relative flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                background: isActive ? 'var(--accent)' + '12' : 'transparent',
              }}
            >
              <IconComponent size={20} />
              <span className="text-[9px] font-medium leading-none">{tab.label}</span>
              {tab.id === 'trash' && trashCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                  style={{ background: 'var(--priority-high)' }}
                >
                  {trashCount > 9 ? '9+' : trashCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add task button — fixed bottom-right */}
      <button
        onClick={onAddTask}
        className="pressable fixed flex items-center justify-center text-white"
        style={{
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 4px 20px var(--accent-glow)',
          zIndex: 50,
        }}
        aria-label="Add new task"
      >
        <Plus size={22} />
      </button>
    </nav>
  );
};

export default SideNav;
