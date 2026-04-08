import { History as HistoryIcon } from 'lucide-react';
import type { Task, Page, ToastState, ToastAction, MonthData } from '@/types';
import { MONTHS_FULL } from '@/constants';
import { getMonthStats } from '@/utils/tasks';
import SwipeableTaskItem from '@/components/tasks/SwipeableTaskItem';
import BottomNav from '@/components/layout/BottomNav';
import Toast from '@/components/ui/Toast';
import EditTaskModal from '@/components/modals/EditTaskModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import ProgressCircle from '@/components/ui/ProgressCircle';

interface EditForm {
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
}

interface HistoryPageProps {
  tasks: Task[];
  monthsWithTasks: MonthData[];
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  trashCount: number;
  expandedTask: number | null;
  setExpandedTask: (id: number | null) => void;
  expandedSubtask: number | null;
  setExpandedSubtask: (id: number | null) => void;
  addingSubtaskTo: number | null;
  setAddingSubtaskTo: (id: number | null) => void;
  newSubtask: string;
  setNewSubtask: (value: string) => void;
  celebratingTask: number | null;
  editingTask: number | null;
  setEditingTask: (id: number | null) => void;
  editForm: EditForm;
  setEditForm: (form: EditForm) => void;
  deleteConfirm: number | null;
  setDeleteConfirm: (id: number | null) => void;
  taskToDelete: Task | undefined;
  onUpdateProgress: (id: number, progress: number) => void;
  onOpenEditModal: (task: Task) => void;
  onSaveEdit: () => void;
  onMoveToTrash: (id: number) => void;
  onAddSubtask: (taskId: number) => void;
  onDeleteSubtask: (taskId: number, subtaskId: number) => void;
  onUpdateSubtaskProgress: (taskId: number, subtaskId: number, progress: number) => void;
  toast: ToastState;
  onDismissToast: () => void;
  toastAction?: ToastAction | null;
}

const HistoryPage = ({
  tasks,
  monthsWithTasks,
  currentPage,
  setCurrentPage,
  trashCount,
  expandedTask,
  setExpandedTask,
  expandedSubtask,
  setExpandedSubtask,
  addingSubtaskTo,
  setAddingSubtaskTo,
  newSubtask,
  setNewSubtask,
  celebratingTask,
  editingTask,
  setEditingTask,
  editForm,
  setEditForm,
  deleteConfirm,
  setDeleteConfirm,
  taskToDelete,
  onUpdateProgress,
  onOpenEditModal,
  onSaveEdit,
  onMoveToTrash,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateSubtaskProgress,
  toast,
  onDismissToast,
  toastAction,
}: HistoryPageProps) => {
  return (
    <div key="history" className="page-content min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={onDismissToast} action={toastAction} />

      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <HistoryIcon size={24} color="var(--accent)" />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>History</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>All your tasks across months</p>
      </div>

      <div className="px-4 space-y-6">
        {monthsWithTasks.length === 0 ? (
          <div className="empty-state-enter text-center py-16">
            <HistoryIcon size={64} className="mx-auto opacity-20" color="var(--text-muted)" />
            <p className="mt-4 text-lg font-medium" style={{ color: 'var(--text-muted)' }}>No history yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Completed months will appear here</p>
          </div>
        ) : (
          monthsWithTasks.map((monthData, gi) => {
            const stats = getMonthStats(monthData.tasks);
            return (
              <div key={`${monthData.year}-${monthData.month}`} className="stagger-item" style={{ animationDelay: `${gi * 80}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <ProgressCircle progress={stats.avgProgress} size={24} strokeWidth={3} />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {MONTHS_FULL[monthData.month]} {monthData.year}
                  </h3>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stats.completed}/{stats.total} done
                  </span>
                </div>
                <div className="space-y-2">
                  {monthData.tasks.map((task, ti) => (
                    <div key={task.id} className="stagger-item" style={{ animationDelay: `${gi * 80 + ti * 40}ms` }}>
                      <SwipeableTaskItem
                        task={task}
                        onComplete={(id) => onUpdateProgress(id, 100)}
                        onSwipeDelete={(id) => setDeleteConfirm(id)}
                        onLongPressEdit={(id) => { const t = tasks.find(x => x.id === id); if (t) onOpenEditModal(t); }}
                        celebrating={celebratingTask === task.id}
                        isExpanded={expandedTask === task.id}
                        expandedSubtask={expandedSubtask}
                        addingSubtaskTo={addingSubtaskTo}
                        newSubtask={newSubtask}
                        setNewSubtask={setNewSubtask}
                        onToggleExpand={() => { setExpandedTask(expandedTask === task.id ? null : task.id); setExpandedSubtask(null); }}
                        onToggleSubtask={(stId) => setExpandedSubtask(expandedSubtask === stId ? null : stId)}
                        onEdit={() => onOpenEditModal(task)}
                        onDelete={() => setDeleteConfirm(task.id)}
                        onUpdateProgress={(p) => onUpdateProgress(task.id, p)}
                        onAddSubtask={() => onAddSubtask(task.id)}
                        onDeleteSubtask={(stId) => onDeleteSubtask(task.id, stId)}
                        onUpdateSubtaskProgress={(stId, p) => onUpdateSubtaskProgress(task.id, stId, p)}
                        onToggleAddSubtask={() => setAddingSubtaskTo(addingSubtaskTo === task.id ? null : task.id)}
                        searchQuery=""
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingTask !== null && <EditTaskModal editForm={editForm} setEditForm={setEditForm} onSave={onSaveEdit} onCancel={() => setEditingTask(null)} />}
      {deleteConfirm !== null && taskToDelete && <DeleteConfirmModal task={taskToDelete} onCancel={() => setDeleteConfirm(null)} onConfirm={() => onMoveToTrash(deleteConfirm)} />}

      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trashCount} />
    </div>
  );
};

export default HistoryPage;
