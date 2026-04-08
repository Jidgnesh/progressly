import { ReactNode } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Calendar,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import type { Task } from '@/types';
import { PRIORITIES } from '@/constants';
import { getTaskProgress, getProgressColor } from '@/utils/tasks';
import { formatDate, isOverdue, isDueToday } from '@/utils/dates';
import ProgressCircle from '@/components/ui/ProgressCircle';

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  expandedSubtask: number | null;
  addingSubtaskTo: number | null;
  newSubtask: string;
  setNewSubtask: (value: string) => void;
  onToggleExpand: () => void;
  onToggleSubtask: (subtaskId: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateProgress: (progress: number) => void;
  onAddSubtask: () => void;
  onDeleteSubtask: (subtaskId: number) => void;
  onUpdateSubtaskProgress: (subtaskId: number, progress: number) => void;
  onToggleAddSubtask: () => void;
  searchQuery: string;
  celebrating?: boolean;
}

const highlightText = (text: string, query: string): ReactNode => {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'rgba(250, 204, 21, 0.3)', color: '#fde047', borderRadius: 2, padding: '0 2px' }}>{part}</mark>
      : part
  );
};

const TaskItem = ({
  task,
  isExpanded,
  expandedSubtask,
  addingSubtaskTo,
  newSubtask,
  setNewSubtask,
  onToggleExpand,
  onToggleSubtask,
  onEdit: _onEdit,
  onDelete: _onDelete,
  onUpdateProgress,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateSubtaskProgress,
  onToggleAddSubtask,
  searchQuery,
  celebrating,
}: TaskItemProps) => {
  const taskProgress = getTaskProgress(task);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const overdue = task.dueDate && isOverdue(task.dueDate) && taskProgress < 100;

  const priorityColor = PRIORITIES[task.priority] || 'var(--text-muted)';

  return (
    <div
      className={`task-card rounded-2xl ${taskProgress === 100 ? 'opacity-60' : ''} ${celebrating ? 'celebration-glow' : ''}`}
      style={{
        '--priority-color': priorityColor,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        ...(overdue ? { boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)' } : {}),
      } as React.CSSProperties}
    >
      <div className="pressable-card p-4 flex items-center gap-3 cursor-pointer" onClick={onToggleExpand} aria-expanded={isExpanded}>
        <ProgressCircle progress={taskProgress} size={36} strokeWidth={3} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-base ${taskProgress === 100 ? 'line-through' : ''} ${!isExpanded ? 'truncate' : ''}`}
            style={{ color: taskProgress === 100 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {searchQuery ? highlightText(task.title, searchQuery) : task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.category}</span>
            {task.dueDate && (
              <span className="text-xs flex items-center gap-1"
                style={{ color: overdue ? 'var(--priority-high)' : isDueToday(task.dueDate) ? '#f97316' : '#60a5fa' }}>
                {overdue ? <AlertCircle size={10} /> : <Calendar size={10} />}
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} color="var(--text-muted)" />
        ) : (
          <ChevronDown size={18} color="var(--text-muted)" />
        )}
      </div>

      <div className="px-4 pb-2">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
          <div className="h-full rounded-full" style={{ width: `${taskProgress}%`, background: getProgressColor(taskProgress), transition: 'width 300ms var(--ease-out)' }} />
        </div>
      </div>

      {isExpanded && (
        <div className="task-detail-enter px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border-card)' }}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subtasks</span>
              <button onClick={onToggleAddSubtask} className="pressable text-xs px-3 py-1 rounded-lg flex items-center gap-1" style={{ background: 'var(--accent)', color: 'white' }}>
                <Plus size={14} /> Add
              </button>
            </div>

            {addingSubtaskTo === task.id && (
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="Subtask name..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onAddSubtask(); }}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  autoFocus />
                <button onClick={onAddSubtask} className="pressable px-4 rounded-lg text-sm text-white" style={{ background: 'var(--accent)' }}>Add</button>
              </div>
            )}

            {hasSubtasks ? (
              <div className="space-y-2">
                {task.subtasks.map(st => (
                  <div key={st.id} className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-input)' }}>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggleSubtask(st.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm truncate ${st.progress === 100 ? 'line-through' : ''}`}
                            style={{ color: st.progress === 100 ? 'var(--text-muted)' : 'var(--text-primary)' }}>{st.title}</span>
                          <span className="text-xs font-bold tabular-nums ml-2" style={{ color: getProgressColor(st.progress) }}>{st.progress}</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                          <div className="h-full rounded-full" style={{ width: `${st.progress}%`, background: getProgressColor(st.progress), transition: 'width 200ms var(--ease-out)' }} />
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteSubtask(st.id); }} className="pressable w-6 h-6 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {expandedSubtask === st.id && (
                      <div className="flex items-center justify-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-card)' }}>
                        <button onClick={() => onUpdateSubtaskProgress(st.id, Math.max(0, st.progress - 10))} className="pressable w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--divider)' }}>
                          <Minus size={14} />
                        </button>
                        <input type="number" min="0" max="100" value={st.progress}
                          onChange={(e) => onUpdateSubtaskProgress(st.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-14 h-7 rounded text-center text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          style={{ background: 'var(--divider)', color: getProgressColor(st.progress) }} />
                        <button onClick={() => onUpdateSubtaskProgress(st.id, Math.min(100, st.progress + 10))} className="pressable w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--divider)' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>No subtasks yet</p>
            )}
          </div>

          {!hasSubtasks && (
            <div>
              <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Manual Progress</div>
              <div className="flex gap-2 mb-3">
                {[0, 25, 50, 75, 100].map(v => (
                  <button key={v} onClick={() => onUpdateProgress(v)} className="pressable flex-1 py-2 rounded-lg text-sm font-medium"
                    style={{
                      background: task.progress === v ? getProgressColor(v) : 'var(--divider)',
                      color: task.progress === v ? 'white' : 'var(--text-secondary)',
                      ...(task.progress === v ? { boxShadow: '0 0 0 2px var(--accent)' } : {}),
                    }}>
                    {v}%
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => onUpdateProgress(task.progress - 5)} className="pressable w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--divider)' }}>
                  <Minus size={18} />
                </button>
                <input type="range" min="0" max="100" value={task.progress} onChange={(e) => onUpdateProgress(parseInt(e.target.value))} className="flex-1 h-2 rounded-lg appearance-none cursor-pointer" />
                <button onClick={() => onUpdateProgress(task.progress + 5)} className="pressable w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--divider)' }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>
          )}

          {hasSubtasks && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>Progress auto-calculated from subtasks</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
