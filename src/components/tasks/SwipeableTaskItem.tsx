import { Check, Trash2 } from 'lucide-react';
import type { Task } from '@/types';
import { useSwipe } from '@/hooks/useSwipe';
import TaskItem from '@/components/tasks/TaskItem';

interface SwipeableTaskItemProps {
  task: Task;
  onComplete: (taskId: number) => void;
  onSwipeDelete: (taskId: number) => void;
  onLongPressEdit: (taskId: number) => void;
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

const SwipeableTaskItem = ({ task, onComplete, onSwipeDelete, onLongPressEdit, ...taskProps }: SwipeableTaskItemProps) => {
  const swipe = useSwipe(
    () => onComplete(task.id),
    () => onSwipeDelete(task.id),
    () => onLongPressEdit(task.id)
  );

  return (
    <div ref={swipe.ref} className="swipe-card rounded-2xl">
      {swipe.offset > 0 && (
        <div className="swipe-bg swipe-bg-right rounded-2xl">
          <Check size={24} color="var(--priority-low)" />
        </div>
      )}
      {swipe.offset < 0 && (
        <div className="swipe-bg swipe-bg-left rounded-2xl">
          <Trash2 size={24} color="var(--priority-high)" />
        </div>
      )}
      <div
        className={`swipe-card-content rounded-2xl ${swipe.releasing ? 'releasing' : ''}`}
        style={{ transform: `translateX(${swipe.offset}px)` }}
        onPointerDown={swipe.handlePointerDown}
        onPointerMove={swipe.handlePointerMove}
        onPointerUp={swipe.handlePointerUp}
      >
        <TaskItem task={task} {...taskProps} />
      </div>
    </div>
  );
};

export default SwipeableTaskItem;
