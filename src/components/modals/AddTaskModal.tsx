import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { CATEGORIES, PRIORITIES } from '@/constants';
import { formatDate, getDateInputValue } from '@/utils/dates';

interface NewTaskForm {
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
}

interface AddTaskModalProps {
  newTask: NewTaskForm;
  setNewTask: (task: NewTaskForm) => void;
  onAdd: () => void;
  onCancel: () => void;
}

const AddTaskModal = ({ newTask, setNewTask, onAdd, onCancel }: AddTaskModalProps) => {
  const [exiting, setExiting] = useState(false);

  const handleClose = (callback: () => void) => {
    setExiting(true);
    setTimeout(callback, 200);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newTask.title.trim()) handleClose(onAdd);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => handleClose(onCancel)}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose(onCancel); }}>
      <div className={`${exiting ? 'drawer-exit' : 'drawer-enter'} w-full rounded-t-3xl max-h-[85vh] overflow-y-auto`}
        role="dialog" aria-modal="true" aria-labelledby="add-modal-title"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.4 }} />
        </div>

        <div className="px-5 pb-5">
          {/* Title input */}
          <input type="text" placeholder="What's your task?"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && newTask.title.trim()) handleSubmit(); }}
            className="w-full py-4 outline-none text-xl font-medium"
            style={{ background: 'transparent', color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
            autoFocus />

          {/* Compact options row */}
          <div className="flex items-center gap-2 flex-wrap mb-5" style={{ borderTop: '1px solid var(--border-card)', paddingTop: 12 }}>
            {/* Category chips */}
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setNewTask({ ...newTask, category: c })}
                className="pressable px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: newTask.category === c ? 'var(--accent)' : 'transparent',
                  color: newTask.category === c ? 'white' : 'var(--text-muted)',
                  border: newTask.category === c ? '1px solid transparent' : '1px solid var(--border-card)',
                }}>
                {c}
              </button>
            ))}

            {/* Divider dot */}
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />

            {/* Priority chips */}
            {Object.entries(PRIORITIES).map(([k, c]) => (
              <button key={k} onClick={() => setNewTask({ ...newTask, priority: k as 'high' | 'medium' | 'low' })}
                className="pressable flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={{
                  background: newTask.priority === k ? c + '20' : 'transparent',
                  color: newTask.priority === k ? c : 'var(--text-muted)',
                  border: newTask.priority === k ? `1px solid ${c}40` : '1px solid transparent',
                }}>
                <span className="w-2 h-2 rounded-full" style={{ background: c, opacity: newTask.priority === k ? 1 : 0.4 }} />
                {k}
              </button>
            ))}
          </div>

          {/* Due date */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => {
                const picker = document.getElementById('add-date-picker') as HTMLInputElement | null;
                if (picker) {
                  if (typeof picker.showPicker === 'function') picker.showPicker();
                  else picker.click();
                }
              }}
              className="pressable flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: newTask.dueDate ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                color: newTask.dueDate ? '#60a5fa' : 'var(--text-muted)',
                border: newTask.dueDate ? '1px solid rgba(96, 165, 250, 0.2)' : '1px solid var(--border-card)',
              }}>
              <Calendar size={14} />
              {newTask.dueDate ? formatDate(newTask.dueDate) : 'Add date'}
            </button>
            <input id="add-date-picker" type="date"
              value={getDateInputValue(newTask.dueDate)}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value || '' })}
              min={new Date().toISOString().split('T')[0]}
              className="sr-only" tabIndex={-1} />
            {newTask.dueDate && (
              <button onClick={() => setNewTask({ ...newTask, dueDate: '' })}
                className="pressable p-1 rounded-full" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Submit */}
          <button onClick={() => handleSubmit()} disabled={!newTask.title.trim()}
            className="pressable w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-30"
            style={{ background: 'var(--accent)' }}>
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
