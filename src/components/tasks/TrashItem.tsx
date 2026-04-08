import { RotateCcw, X, Clock } from 'lucide-react';
import type { TrashTask } from '@/types';
import { PRIORITIES } from '@/constants';
import { getTaskProgress } from '@/utils/tasks';
import { formatDeletedTime } from '@/utils/dates';
import ProgressCircle from '@/components/ui/ProgressCircle';

interface TrashItemProps {
  task: TrashTask;
  onRestore: () => void;
  onDelete: () => void;
}

const TrashItem = ({ task, onRestore, onDelete }: TrashItemProps) => {
  const taskProgress = getTaskProgress(task);
  const priorityColor = PRIORITIES[task.priority] || 'var(--text-muted)';

  return (
    <div
      className="task-card rounded-2xl p-4"
      style={{
        '--priority-color': priorityColor,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
      } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <div className="opacity-50">
          <ProgressCircle progress={taskProgress} size={36} strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.category}</span>
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Clock size={12} />
            Deleted {formatDeletedTime(task.deletedAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-card)' }}>
        <button
          onClick={onRestore}
          className="pressable flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white"
          style={{ background: 'var(--accent)' }}
        >
          <RotateCcw size={16} /> Restore
        </button>
        <button
          onClick={onDelete}
          className="pressable flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          style={{ background: 'var(--divider)', color: 'var(--text-primary)' }}
        >
          <X size={16} /> Delete Forever
        </button>
      </div>
    </div>
  );
};

export default TrashItem;
