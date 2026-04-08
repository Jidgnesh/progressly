import { Trash2 } from 'lucide-react';
import type { TrashTask, Page, ToastState, ToastAction } from '@/types';
import TrashItem from '@/components/tasks/TrashItem';
import BottomNav from '@/components/layout/BottomNav';
import Toast from '@/components/ui/Toast';

interface TrashPageProps {
  trash: TrashTask[];
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onRestore: (id: number) => void;
  onPermanentDelete: (id: number) => void;
  onEmptyTrash: () => void;
  onAddTask: () => void;
  toast: ToastState;
  onDismissToast: () => void;
  toastAction?: ToastAction | null;
}

const TrashPage = ({
  trash,
  currentPage,
  setCurrentPage,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  onAddTask,
  toast,
  onDismissToast,
  toastAction,
}: TrashPageProps) => {
  return (
    <div key="trash" className="page-with-nav page-content min-h-screen pb-6" style={{ background: 'var(--bg-base)' }}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={onDismissToast} action={toastAction} />

      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trash2 size={24} color="var(--priority-high)" />
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Trash</h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{trash.length} deleted task{trash.length !== 1 ? 's' : ''}</p>
          </div>
          {trash.length > 0 && (
            <div className="relative">
              <button
                className="hold-delete-btn pressable relative overflow-hidden px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--divider)', color: 'var(--text-primary)' }}
                onPointerUp={(e) => {
                  const start = parseInt((e.currentTarget as HTMLButtonElement).dataset.pressStart || '0');
                  if (Date.now() - start > 1900) onEmptyTrash();
                }}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).dataset.pressStart = String(Date.now());
                }}
              >
                <div className="hold-delete-overlay" />
                <span className="relative z-10">Hold 2s to empty all</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4">
        {trash.length === 0 ? (
          <div className="empty-state-enter text-center py-16">
            <Trash2 size={64} className="mx-auto opacity-20" color="var(--text-muted)" />
            <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>Trash is empty</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Deleted tasks will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trash.map(task => (
              <TrashItem
                key={task.id}
                task={task}
                onRestore={() => onRestore(task.id)}
                onDelete={() => onPermanentDelete(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trash.length} onAddTask={onAddTask} />
    </div>
  );
};

export default TrashPage;
