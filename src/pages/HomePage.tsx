import { Fragment } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Plus,
  Filter,
  RefreshCw,
  LogOut,
  X,
  ArrowRight,
  ArrowLeft,
  Grip,
} from 'lucide-react';
import type { Task, Page, Theme, Filter as FilterType, SortBy, ToastState, ToastAction } from '@/types';
import { MONTHS_FULL } from '@/constants';
import { getProgressColor, getCompletionStreak } from '@/utils/tasks';
import { getGreeting, getFormattedDate } from '@/utils/auth';
import SwipeableTaskItem from '@/components/tasks/SwipeableTaskItem';
import QuickAdd from '@/components/tasks/QuickAdd';
import AddTaskModal from '@/components/modals/AddTaskModal';
import EditTaskModal from '@/components/modals/EditTaskModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import BottomNav from '@/components/layout/BottomNav';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Toast from '@/components/ui/Toast';
import StatsSummary from '@/components/ui/StatsSummary';

interface NewTaskForm {
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
}

interface EditForm {
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
}

interface HomePageProps {
  // Task data
  tasks: Task[];
  monthTasks: Task[];
  sortedTasks: Task[];
  totalCount: number;
  completedCount: number;
  avgProgress: number;
  trashCount: number;

  // Navigation
  currentMonth: number;
  currentYear: number;
  isCurrentMonth: boolean;
  onChangeMonth: (delta: number) => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  // User
  currentUserName: string | undefined;
  syncing: boolean;
  onLogout: () => void;

  // Theme
  theme: Theme;
  onThemeToggle: () => void;

  // Filter / Sort / Search
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showFilterDropdown: boolean;
  setShowFilterDropdown: (show: boolean) => void;

  // Task expansion
  expandedTask: number | null;
  setExpandedTask: (id: number | null) => void;
  expandedSubtask: number | null;
  setExpandedSubtask: (id: number | null) => void;
  addingSubtaskTo: number | null;
  setAddingSubtaskTo: (id: number | null) => void;
  newSubtask: string;
  setNewSubtask: (value: string) => void;

  // Celebrating
  celebratingTask: number | null;

  // Quick add
  quickAddTitle: string;
  setQuickAddTitle: (title: string) => void;
  onQuickAddWithOptions: (title: string, priority: 'high' | 'medium' | 'low', category: string, dueDate: string) => void;

  // Add task modal
  showAdd: boolean;
  setShowAdd: (show: boolean) => void;
  newTask: NewTaskForm;
  setNewTask: (task: NewTaskForm) => void;
  onAddTask: () => void;

  // Edit modal
  editingTask: number | null;
  setEditingTask: (id: number | null) => void;
  editForm: EditForm;
  setEditForm: (form: EditForm) => void;
  onSaveEdit: () => void;

  // Delete modal
  deleteConfirm: number | null;
  setDeleteConfirm: (id: number | null) => void;
  taskToDelete: Task | undefined;
  onMoveToTrash: (id: number) => void;

  // Task operations
  onUpdateProgress: (id: number, progress: number) => void;
  onOpenEditModal: (task: Task) => void;
  onAddSubtask: (taskId: number) => void;
  onDeleteSubtask: (taskId: number, subtaskId: number) => void;
  onUpdateSubtaskProgress: (taskId: number, subtaskId: number, progress: number) => void;

  // Complete with undo
  onComplete: (id: number) => void;

  // Stats
  showStats: boolean;
  setShowStats: (show: boolean) => void;

  // Toast
  toast: ToastState;
  onDismissToast: () => void;
  toastAction?: ToastAction | null;

  // Swipe hint
  showSwipeHint: boolean;
  onDismissSwipeHint: () => void;

  // Help overlay
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;

  // Close all expanded
  onCloseAll: () => void;
}

const HomePage = ({
  tasks,
  monthTasks,
  sortedTasks,
  totalCount,
  completedCount,
  avgProgress,
  trashCount,
  currentMonth,
  currentYear,
  isCurrentMonth,
  onChangeMonth,
  currentPage,
  setCurrentPage,
  currentUserName,
  syncing,
  onLogout,
  theme,
  onThemeToggle,
  filter,
  setFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  showFilterDropdown,
  setShowFilterDropdown,
  expandedTask,
  setExpandedTask,
  expandedSubtask,
  setExpandedSubtask,
  addingSubtaskTo,
  setAddingSubtaskTo,
  newSubtask,
  setNewSubtask,
  celebratingTask,
  quickAddTitle,
  setQuickAddTitle,
  onQuickAddWithOptions,
  showAdd,
  setShowAdd,
  newTask,
  setNewTask,
  onAddTask,
  editingTask,
  setEditingTask,
  editForm,
  setEditForm,
  onSaveEdit,
  deleteConfirm,
  setDeleteConfirm,
  taskToDelete,
  onMoveToTrash,
  onUpdateProgress,
  onOpenEditModal,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateSubtaskProgress,
  onComplete,
  showStats,
  setShowStats,
  toast,
  onDismissToast,
  toastAction,
  showSwipeHint,
  onDismissSwipeHint,
  showHelp,
  setShowHelp,
  onCloseAll,
}: HomePageProps) => {
  return (
    <div key="home" className="page-with-nav page-content min-h-screen pb-6" style={{ background: 'var(--bg-base)' }}>
      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={onDismissToast}
        action={toastAction}
      />

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {getGreeting(currentUserName || 'User')}
          </h1>
          <div className="flex items-center gap-1">
            <ThemeToggle preference={theme} onToggle={onThemeToggle} />
            {syncing && <RefreshCw size={16} color="var(--accent)" className="animate-spin" />}
            <button onClick={onLogout} className="pressable p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{getFormattedDate()}</p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-3 px-4 mb-3">
        <button onClick={() => onChangeMonth(-1)} className="pressable-sm p-2" style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {MONTHS_FULL[currentMonth]} {currentYear}
          </h2>
          <span className="text-sm font-bold tabular-nums" style={{ color: getProgressColor(avgProgress) }}>
            {avgProgress}%
          </span>
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {completedCount}/{totalCount}
          </span>
        </div>
        <button onClick={() => onChangeMonth(1)} className="pressable-sm p-2" style={{ color: 'var(--text-secondary)' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 mb-3">
        <StatsSummary
          totalCount={totalCount}
          completedCount={completedCount}
          streak={getCompletionStreak(tasks)}
          allTasks={monthTasks}
          expanded={showStats}
          onToggle={() => setShowStats(!showStats)}
        />
      </div>

      {/* Filter Bar */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Task filters">
            {([
              { id: 'all' as FilterType, label: 'All' },
              { id: 'pending' as FilterType, label: 'To Do' },
              { id: 'inprogress' as FilterType, label: 'In Progress' },
              { id: 'completed' as FilterType, label: 'Done' },
            ]).map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                role="tab"
                aria-selected={filter === f.id}
                className="pressable filter-pill px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                style={{
                  background: filter === f.id ? 'var(--accent)' : 'var(--bg-card)',
                  color: filter === f.id ? 'white' : 'var(--text-secondary)',
                  border: filter === f.id ? '1px solid transparent' : '1px solid var(--border-card)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Search toggle */}
          <button
            onClick={() => setSearchQuery(searchQuery ? '' : ' ')}
            className="pressable p-2 rounded-xl"
            style={{ color: searchQuery ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <Search size={18} />
          </button>
          {/* Sort */}
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="pressable p-2 rounded-xl"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowUpDown size={18} />
          </button>
        </div>

        {/* Search input */}
        {searchQuery !== '' && (
          <>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery.trim() ? searchQuery : ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-enter w-full mt-2 rounded-xl px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              autoFocus
            />
            {searchQuery.trim() && (
              <p className="text-xs mt-1 ml-1" style={{ color: 'var(--text-muted)' }}>
                Searching across all months
              </p>
            )}
          </>
        )}

        {/* Sort dropdown */}
        {showFilterDropdown && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowFilterDropdown(false)} />
            <div className="relative">
              <div className="popover-enter absolute right-0 top-2 rounded-xl py-1 z-30"
                role="menu" aria-label="Sort options"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)', minWidth: 160 }}>
                {([
                  { id: 'priority' as SortBy, label: 'Priority' },
                  { id: 'dueDate' as SortBy, label: 'Due Date' },
                  { id: 'progress' as SortBy, label: 'Progress' },
                ]).map(s => (
                  <button key={s.id}
                    role="menuitem"
                    onClick={() => { setSortBy(s.id); setShowFilterDropdown(false); }}
                    className="pressable w-full text-left px-4 py-2 text-sm hover-bg"
                    style={{ color: sortBy === s.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Add */}
      <div className="px-4 mb-3">
        <QuickAdd
          value={quickAddTitle}
          onChange={setQuickAddTitle}
          onAddWithOptions={onQuickAddWithOptions}
        />
      </div>

      {/* Task List */}
      <div className="px-4 space-y-3" onClick={onCloseAll}>
        {sortedTasks.length === 0 ? (
          <div className="empty-state-enter text-center py-16">
            {filter !== 'all' ? <Filter size={48} className="mx-auto opacity-20" color="var(--text-muted)" /> : <Plus size={48} className="mx-auto opacity-20" color="var(--text-muted)" />}
            <p className="mt-4 text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
              {filter !== 'all' ? 'No tasks match this filter' : isCurrentMonth ? 'No tasks yet' : 'No tasks this month'}
            </p>
            {filter !== 'all' ? (
              <button
                onClick={() => setFilter('all')}
                className="pressable mt-3 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Show all tasks
              </button>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="pressable mt-3 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Add your first task
              </button>
            )}
          </div>
        ) : (
          sortedTasks.map((task, i) => (
            <Fragment key={task.id}>
              <div className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                <SwipeableTaskItem
                  task={task}
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
                  searchQuery={searchQuery.trim() || ''}
                  celebrating={celebratingTask === task.id}
                  onComplete={onComplete}
                  onSwipeDelete={(id) => setDeleteConfirm(id)}
                  onLongPressEdit={(id) => { const t = tasks.find(x => x.id === id); if (t) onOpenEditModal(t); }}
                />
              </div>
              {i === 0 && showSwipeHint && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs stagger-item"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', animationDelay: '200ms' }}>
                  <div className="flex items-center gap-4" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <ArrowRight size={12} /> Complete
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowLeft size={12} /> Delete
                    </span>
                    <span className="flex items-center gap-1">
                      <Grip size={12} /> Hold to edit
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDismissSwipeHint(); }} className="pressable p-1" style={{ color: 'var(--text-muted)' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </Fragment>
          ))
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddTaskModal newTask={newTask} setNewTask={setNewTask} onAdd={onAddTask} onCancel={() => setShowAdd(false)} />}
      {editingTask !== null && <EditTaskModal editForm={editForm} setEditForm={setEditForm} onSave={onSaveEdit} onCancel={() => setEditingTask(null)} />}
      {deleteConfirm !== null && taskToDelete && <DeleteConfirmModal task={taskToDelete} onCancel={() => setDeleteConfirm(null)} onConfirm={() => onMoveToTrash(deleteConfirm)} />}

      {/* Keyboard Shortcut Help Overlay */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-enter"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHelp(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowHelp(false); }}>
          <div className="modal-enter rounded-2xl p-5 w-full max-w-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Shortcuts</h3>
              <button onClick={() => setShowHelp(false)} className="pressable p-1" style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                ['n', 'New task'],
                ['/', 'Search'],
                ['\u2190 \u2192', 'Change month'],
                ['1-4', 'Filter tasks'],
                ['?', 'This help'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</span>
                  <kbd className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-card)' }}>
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trashCount} onAddTask={() => setShowAdd(true)} />
    </div>
  );
};

export default HomePage;
