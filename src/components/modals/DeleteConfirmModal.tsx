import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import type { Task } from '@/types';

interface DeleteConfirmModalProps {
  task: Task | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal = ({ task, onCancel, onConfirm }: DeleteConfirmModalProps) => {
  const [exiting, setExiting] = useState(false);

  if (!task) return null;

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleClose = (callback: () => void) => {
    setExiting(true);
    setTimeout(callback, 150);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => handleClose(onCancel)}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose(onCancel); }}>
      <div className={`${exiting ? 'modal-exit' : 'modal-enter'} rounded-2xl p-6 max-w-sm w-full`}
        role="dialog" aria-modal="true" aria-labelledby="delete-modal-title"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)', transformOrigin: 'center' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
          <Trash2 size={32} color="var(--priority-high)" />
        </div>
        <h3 id="delete-modal-title" className="text-xl font-semibold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Delete Task?</h3>
        <p className="text-center mb-2" style={{ color: 'var(--text-secondary)' }}>"{task.title}"</p>
        {hasSubtasks && (
          <p className="text-sm text-center mb-4" style={{ color: '#f59e0b' }}>
            <AlertTriangle size={14} className="inline mr-1" />
            This will also delete {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
          </p>
        )}
        <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>You can restore this task from the trash later.</p>
        <div className="flex gap-3">
          <button onClick={() => handleClose(onCancel)} className="pressable flex-1 py-3 rounded-xl font-medium" style={{ background: 'var(--divider)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={() => handleClose(onConfirm)} className="pressable flex-1 py-3 rounded-xl font-medium text-white" style={{ background: 'var(--priority-high)' }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
