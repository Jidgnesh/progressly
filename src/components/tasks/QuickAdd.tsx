import { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { CATEGORIES, PRIORITIES } from '@/constants';
import { formatDate, getDateInputValue } from '@/utils/dates';

const LAST_CATEGORY_KEY = 'planner-last-category';
const LAST_PRIORITY_KEY = 'planner-last-priority';

interface QuickAddProps {
  value: string;
  onChange: (value: string) => void;
  onAddWithOptions: (title: string, priority: 'high' | 'medium' | 'low', category: string, dueDate: string) => void;
}

const QuickAdd = ({ value, onChange, onAddWithOptions }: QuickAddProps) => {
  const [expanded, setExpanded] = useState(false);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(
    () => (localStorage.getItem(LAST_PRIORITY_KEY) as 'high' | 'medium' | 'low') || 'medium'
  );
  const [category, setCategory] = useState(
    () => localStorage.getItem(LAST_CATEGORY_KEY) || 'Personal'
  );
  const [dueDate, setDueDate] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!value.trim()) setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const handleAdd = () => {
    if (!value.trim()) return;
    localStorage.setItem(LAST_CATEGORY_KEY, category);
    localStorage.setItem(LAST_PRIORITY_KEY, priority);
    onAddWithOptions(value.trim(), priority, category, dueDate);
    onChange('');
    setDueDate('');
    setExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') {
      onChange('');
      setExpanded(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const priorityColor = PRIORITIES[priority];

  return (
    <div ref={containerRef} className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
      }}>
      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Priority dot — shows current priority at a glance */}
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: priorityColor, opacity: expanded ? 1 : 0.5 }} />
        <input
          type="text"
          placeholder="Add a task..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm outline-none"
          style={{ background: 'transparent', color: 'var(--text-primary)' }}
        />
        {value.trim() && (
          <button
            onClick={handleAdd}
            className="pressable px-3 py-1 rounded-lg text-xs font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Add
          </button>
        )}
      </div>

      {/* Expandable options — slides in on focus */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 flex items-center gap-1.5 flex-wrap"
          style={{ borderTop: '1px solid var(--border-card)' }}>
          {/* Category chips */}
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className="pressable px-2.5 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                background: category === c ? 'var(--accent)' : 'transparent',
                color: category === c ? 'white' : 'var(--text-muted)',
                border: category === c ? '1px solid transparent' : '1px solid var(--border-card)',
              }}>
              {c}
            </button>
          ))}

          <span className="w-px h-3 mx-0.5" style={{ background: 'var(--border-card)' }} />

          {/* Priority chips */}
          {Object.entries(PRIORITIES).map(([k, c]) => (
            <button key={k} onClick={() => setPriority(k as 'high' | 'medium' | 'low')}
              className="pressable flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
              style={{
                background: priority === k ? c + '20' : 'transparent',
                color: priority === k ? c : 'var(--text-muted)',
                border: priority === k ? `1px solid ${c}40` : '1px solid transparent',
              }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c, opacity: priority === k ? 1 : 0.4 }} />
              {k}
            </button>
          ))}

          <span className="w-px h-3 mx-0.5" style={{ background: 'var(--border-card)' }} />

          {/* Due date */}
          <button
            onClick={() => {
              const picker = document.getElementById('quick-date-picker') as HTMLInputElement | null;
              if (picker) {
                if (typeof picker.showPicker === 'function') picker.showPicker();
                else picker.click();
              }
            }}
            className="pressable flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              background: dueDate ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
              color: dueDate ? '#60a5fa' : 'var(--text-muted)',
              border: dueDate ? '1px solid rgba(96, 165, 250, 0.2)' : '1px solid transparent',
            }}>
            <Calendar size={11} />
            {dueDate ? formatDate(dueDate) : 'Date'}
          </button>
          <input id="quick-date-picker" type="date"
            value={getDateInputValue(dueDate)}
            onChange={(e) => setDueDate(e.target.value || '')}
            min={new Date().toISOString().split('T')[0]}
            className="sr-only" tabIndex={-1} />
          {dueDate && (
            <button onClick={() => setDueDate('')}
              className="pressable p-0.5 rounded-full" style={{ color: 'var(--text-muted)' }}>
              <X size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickAdd;
