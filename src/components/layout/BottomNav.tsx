import { useState, useEffect } from 'react';
import { Home, History, Trash2, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Page } from '@/types';

const SIDEBAR_KEY = 'planner-sidebar-collapsed';

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
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');
  const activeIndex = tabs.findIndex(t => t.id === currentPage);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  // Dispatch custom event so pages can react to width change
  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  const sidebarWidth = collapsed ? 48 : 180;

  return (
    <>
      <nav
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col"
        role="navigation"
        aria-label="Main navigation"
        style={{
          width: sidebarWidth,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-card)',
          transition: 'width 200ms var(--ease-out)',
        }}
      >
        {/* Header — collapse toggle */}
        <div className="flex items-center px-2 py-4" style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <span className="text-sm font-semibold pl-2" style={{ color: 'var(--text-primary)' }}>
              Progressly
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="pressable p-1.5 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1 px-2 flex-1">
          {/* Active indicator */}
          <div className="relative">
            <div
              className="nav-pill absolute left-0 w-[3px] rounded-full"
              style={{
                height: 20,
                background: 'var(--accent)',
                top: `calc(${activeIndex * 40}px + 10px)`,
                transition: 'top 200ms var(--ease-out)',
              }}
            />
          </div>

          {tabs.map((tab) => {
            const isActive = currentPage === tab.id;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentPage(tab.id)}
                className="pressable relative flex items-center gap-3 rounded-lg"
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  height: 40,
                  padding: collapsed ? '0 12px' : '0 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  background: isActive ? 'var(--accent)' + '12' : 'transparent',
                  transition: 'background 150ms, color 150ms',
                }}
              >
                <div className="relative flex-shrink-0">
                  <IconComponent size={18} />
                  {tab.id === 'trash' && trashCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                      style={{ background: 'var(--priority-high)' }}
                    >
                      {trashCount > 9 ? '9+' : trashCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add task button at bottom */}
        <div className="px-2 pb-4">
          <button
            onClick={onAddTask}
            className="pressable flex items-center gap-3 rounded-lg w-full text-white"
            style={{
              height: 40,
              padding: collapsed ? '0 12px' : '0 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'var(--accent)',
              transition: 'all 150ms',
            }}
            aria-label="Add new task"
          >
            <Plus size={18} />
            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap">New Task</span>
            )}
          </button>
        </div>
      </nav>

      {/* Spacer — pushes page content to the right */}
      <style>{`
        .page-with-nav {
          padding-left: ${sidebarWidth + 8}px !important;
          transition: padding-left 200ms var(--ease-out);
        }
      `}</style>
    </>
  );
};

export default SideNav;
