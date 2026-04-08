import { Plus } from 'lucide-react';

interface QuickAddProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

const QuickAdd = ({ value, onChange, onAdd }: QuickAddProps) => {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
    >
      <Plus size={16} color="var(--text-muted)" />
      <input
        type="text"
        placeholder="Add a task..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onAdd();
          if (e.key === 'Escape') {
            onChange('');
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="flex-1 text-sm outline-none"
        style={{ background: 'transparent', color: 'var(--text-primary)' }}
      />
      {value.trim() && (
        <button
          onClick={onAdd}
          className="pressable px-3 py-1 rounded-lg text-xs font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          Add
        </button>
      )}
    </div>
  );
};

export default QuickAdd;
