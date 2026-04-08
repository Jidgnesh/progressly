import { useState, useEffect, useCallback } from 'react';
import type { Task, Page, Filter, SortBy, MonthData, ToastAction } from '@/types';
import { SWIPE_HINT_KEY } from '@/constants';
import { getTaskProgress } from '@/utils/tasks';
import { isOverdue } from '@/utils/dates';
import { formatDate } from '@/utils/dates';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import HistoryPage from '@/pages/HistoryPage';
import TrashPage from '@/pages/TrashPage';

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

const App = () => {
  const today = new Date();

  // ==================== HOOKS ====================
  const { theme, toggleTheme } = useTheme();
  const { toast, showToast, dismissToast } = useToast();

  const authHook = useAuth(showToast);
  const {
    isAuthenticated,
    currentUser,
    useFirebase,
    checkAuth,
  } = authHook;

  const taskHook = useTasks({
    currentUser,
    useFirebase,
    isAuthenticated,
    showToast,
    checkAuth,
  });

  const {
    tasks,
    trash,
    loading,
    syncing,
    celebratingTask,
    addTask,
    quickAddTask,
    moveToTrash,
    restoreFromTrash,
    permanentDelete,
    emptyTrash,
    updateProgress,
    saveEdit: taskSaveEdit,
    addSubtask: taskAddSubtask,
    deleteSubtask,
    updateSubtaskProgress,
  } = taskHook;

  // ==================== UI STATE ====================
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [filter, setFilter] = useState<Filter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [expandedSubtask, setExpandedSubtask] = useState<number | null>(null);
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<number | null>(null);
  const [newSubtask, setNewSubtask] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState<NewTaskForm>({ title: '', priority: 'medium', category: 'Personal', dueDate: '' });

  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: '', priority: 'medium', category: 'Personal', dueDate: '' });

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [showSwipeHint, setShowSwipeHint] = useState(() => !localStorage.getItem(SWIPE_HINT_KEY));

  // Pending complete undo
  const [pendingComplete, setPendingComplete] = useState<{ id: number; prevProgress: number } | null>(null);

  // ==================== DERIVED VALUES ====================
  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    localStorage.setItem(SWIPE_HINT_KEY, 'true');
  }, []);

  const changeMonth = useCallback((delta: number) => {
    setCurrentMonth(prev => {
      let m = prev + delta;
      let y = currentYear;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      setCurrentYear(y);
      return m;
    });
  }, [currentYear]);

  const closeAll = useCallback(() => {
    setExpandedTask(null);
    setExpandedSubtask(null);
    setAddingSubtaskTo(null);
    setShowFilterDropdown(false);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditForm({ title: task.title, priority: task.priority, category: task.category, dueDate: task.dueDate || '' });
    setEditingTask(task.id);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingTask === null) return;
    taskSaveEdit(editingTask, editForm);
    setEditingTask(null);
  }, [editingTask, editForm, taskSaveEdit]);

  const handleAddTask = useCallback(() => {
    addTask(newTask, currentMonth, currentYear);
    setNewTask({ title: '', priority: 'medium', category: 'Personal', dueDate: '' });
    setShowAdd(false);
  }, [addTask, newTask, currentMonth, currentYear]);

  const handleQuickAdd = useCallback(() => {
    quickAddTask(quickAddTitle, currentMonth, currentYear);
    setQuickAddTitle('');
  }, [quickAddTask, quickAddTitle, currentMonth, currentYear]);

  const handleMoveToTrash = useCallback((id: number) => {
    moveToTrash(id);
    if (expandedTask === id) setExpandedTask(null);
    setDeleteConfirm(null);
  }, [moveToTrash, expandedTask]);

  const handleAddSubtask = useCallback((taskId: number) => {
    taskAddSubtask(taskId, newSubtask);
    setNewSubtask('');
    setAddingSubtaskTo(null);
  }, [taskAddSubtask, newSubtask]);

  const undoComplete = useCallback(() => {
    if (pendingComplete) {
      updateProgress(pendingComplete.id, pendingComplete.prevProgress);
      setPendingComplete(null);
      dismissToast();
    }
  }, [pendingComplete, updateProgress, dismissToast]);

  const handleComplete = useCallback((id: number) => {
    const prevTask = tasks.find(t => t.id === id);
    const prevProgress = prevTask ? prevTask.progress : 0;
    updateProgress(id, 100);
    setPendingComplete({ id, prevProgress });
    showToast('Task completed');
  }, [tasks, updateProgress, showToast]);

  const toastAction: ToastAction | null = pendingComplete
    ? { label: 'Undo', onClick: undoComplete }
    : null;

  const handleDismissToast = useCallback(() => {
    dismissToast();
    setPendingComplete(null);
  }, [dismissToast]);

  // Search function
  const searchTasks = useCallback((query: string, taskList: Task[]): Task[] => {
    if (!query.trim()) return taskList;
    const lowerQuery = query.toLowerCase();
    return taskList.filter(t =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery) ||
      t.priority.toLowerCase().includes(lowerQuery) ||
      (t.dueDate && formatDate(t.dueDate)?.toLowerCase().includes(lowerQuery)) ||
      (t.subtasks && t.subtasks.some(st => st.title.toLowerCase().includes(lowerQuery)))
    );
  }, []);

  // Computed values
  const monthTasks = tasks.filter(t => t.month === currentMonth && t.year === currentYear);
  const searchedTasks = searchQuery ? searchTasks(searchQuery, tasks) : monthTasks;
  const completedCount = monthTasks.filter(t => getTaskProgress(t) === 100).length;
  const totalCount = monthTasks.length;
  const avgProgress = totalCount > 0 ? Math.round(monthTasks.reduce((s, t) => s + getTaskProgress(t), 0) / totalCount) : 0;

  const filteredTasks = (searchQuery ? searchedTasks : monthTasks).filter(t => {
    const p = getTaskProgress(t);
    if (filter === 'pending') return p < 100;
    if (filter === 'completed') return p === 100;
    if (filter === 'inprogress') return p > 0 && p < 100;
    if (filter === 'overdue') return t.dueDate !== null && isOverdue(t.dueDate) && p < 100;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const pa = getTaskProgress(a);
    const pb = getTaskProgress(b);
    if ((pa === 100) !== (pb === 100)) return pa === 100 ? 1 : -1;

    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) {
        return ({ high: 0, medium: 1, low: 2 }[a.priority]) - ({ high: 0, medium: 1, low: 2 }[b.priority]);
      }
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }

    if (sortBy === 'progress') {
      return pb - pa;
    }

    return ({ high: 0, medium: 1, low: 2 }[a.priority]) - ({ high: 0, medium: 1, low: 2 }[b.priority]);
  });

  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const getMonthsWithTasks = useCallback((): MonthData[] => {
    const monthsMap: Record<string, MonthData> = {};
    tasks.forEach(task => {
      const key = `${task.year}-${task.month}`;
      if (!monthsMap[key]) monthsMap[key] = { month: task.month, year: task.year, tasks: [] };
      monthsMap[key].tasks.push(task);
    });
    return Object.values(monthsMap).sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
  }, [tasks]);

  const monthsWithTasks = getMonthsWithTasks();
  const taskToDelete = tasks.find(t => t.id === deleteConfirm);

  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (!isAuthenticated || currentPage !== 'home') return;
      if (showAdd || editingTask || deleteConfirm || showHelp) return;

      switch (e.key) {
        case 'n':
          e.preventDefault();
          setShowAdd(true);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          changeMonth(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          changeMonth(1);
          break;
        case '1':
          setFilter('all');
          break;
        case '2':
          setFilter('pending');
          break;
        case '3':
          setFilter('inprogress');
          break;
        case '4':
          setFilter('completed');
          break;
        case '/':
          e.preventDefault();
          setSearchQuery(searchQuery ? '' : ' ');
          break;
        case '?':
          e.preventDefault();
          setShowHelp(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, currentPage, showAdd, editingTask, deleteConfirm, showHelp, searchQuery, changeMonth]);

  // ==================== LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  // ==================== AUTH GATE ====================
  if (!isAuthenticated) {
    return (
      <AuthPage
        authPage={authHook.authPage}
        setAuthPage={authHook.setAuthPage}
        authForm={authHook.authForm}
        setAuthForm={authHook.setAuthForm}
        authError={authHook.authError}
        setAuthError={authHook.setAuthError}
        showPassword={authHook.showPassword}
        setShowPassword={authHook.setShowPassword}
        forgotEmail={authHook.forgotEmail}
        setForgotEmail={authHook.setForgotEmail}
        resetPassword={authHook.resetPassword}
        setResetPassword={authHook.setResetPassword}
        forgotStep={authHook.forgotStep}
        setForgotStep={authHook.setForgotStep}
        resetEmailSent={authHook.resetEmailSent}
        setResetEmailSent={authHook.setResetEmailSent}
        authSubmitting={authHook.authSubmitting}
        onSignUp={authHook.handleSignUp}
        onSignIn={authHook.handleSignIn}
        onGoogleSignIn={authHook.handleGoogleSignIn}
        onForgotPassword={authHook.handleForgotPassword}
        onResetPassword={authHook.handleResetPassword}
        toast={toast}
        onDismissToast={dismissToast}
      />
    );
  }

  // ==================== TRASH PAGE ====================
  if (currentPage === 'trash') {
    return (
      <TrashPage
        trash={trash}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onRestore={restoreFromTrash}
        onPermanentDelete={permanentDelete}
        onEmptyTrash={emptyTrash}
        toast={toast}
        onDismissToast={dismissToast}
      />
    );
  }

  // ==================== HISTORY PAGE ====================
  if (currentPage === 'history') {
    return (
      <HistoryPage
        tasks={tasks}
        monthsWithTasks={monthsWithTasks}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        trashCount={trash.length}
        expandedTask={expandedTask}
        setExpandedTask={setExpandedTask}
        expandedSubtask={expandedSubtask}
        setExpandedSubtask={setExpandedSubtask}
        addingSubtaskTo={addingSubtaskTo}
        setAddingSubtaskTo={setAddingSubtaskTo}
        newSubtask={newSubtask}
        setNewSubtask={setNewSubtask}
        celebratingTask={celebratingTask}
        editingTask={editingTask}
        setEditingTask={setEditingTask}
        editForm={editForm}
        setEditForm={setEditForm}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        taskToDelete={taskToDelete}
        onUpdateProgress={updateProgress}
        onOpenEditModal={openEditModal}
        onSaveEdit={handleSaveEdit}
        onMoveToTrash={handleMoveToTrash}
        onAddSubtask={handleAddSubtask}
        onDeleteSubtask={deleteSubtask}
        onUpdateSubtaskProgress={updateSubtaskProgress}
        toast={toast}
        onDismissToast={dismissToast}
      />
    );
  }

  // ==================== HOME PAGE ====================
  return (
    <HomePage
      tasks={tasks}
      monthTasks={monthTasks}
      sortedTasks={sortedTasks}
      totalCount={totalCount}
      completedCount={completedCount}
      avgProgress={avgProgress}
      trashCount={trash.length}
      currentMonth={currentMonth}
      currentYear={currentYear}
      isCurrentMonth={isCurrentMonth}
      onChangeMonth={changeMonth}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      currentUserName={currentUser?.name}
      syncing={syncing}
      onLogout={authHook.handleLogout}
      theme={theme}
      onThemeToggle={toggleTheme}
      filter={filter}
      setFilter={setFilter}
      sortBy={sortBy}
      setSortBy={setSortBy}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      showFilterDropdown={showFilterDropdown}
      setShowFilterDropdown={setShowFilterDropdown}
      expandedTask={expandedTask}
      setExpandedTask={setExpandedTask}
      expandedSubtask={expandedSubtask}
      setExpandedSubtask={setExpandedSubtask}
      addingSubtaskTo={addingSubtaskTo}
      setAddingSubtaskTo={setAddingSubtaskTo}
      newSubtask={newSubtask}
      setNewSubtask={setNewSubtask}
      celebratingTask={celebratingTask}
      quickAddTitle={quickAddTitle}
      setQuickAddTitle={setQuickAddTitle}
      onQuickAdd={handleQuickAdd}
      showAdd={showAdd}
      setShowAdd={setShowAdd}
      newTask={newTask}
      setNewTask={setNewTask}
      onAddTask={handleAddTask}
      editingTask={editingTask}
      setEditingTask={setEditingTask}
      editForm={editForm}
      setEditForm={setEditForm}
      onSaveEdit={handleSaveEdit}
      deleteConfirm={deleteConfirm}
      setDeleteConfirm={setDeleteConfirm}
      taskToDelete={taskToDelete}
      onMoveToTrash={handleMoveToTrash}
      onUpdateProgress={updateProgress}
      onOpenEditModal={openEditModal}
      onAddSubtask={handleAddSubtask}
      onDeleteSubtask={deleteSubtask}
      onUpdateSubtaskProgress={updateSubtaskProgress}
      onComplete={handleComplete}
      showStats={showStats}
      setShowStats={setShowStats}
      toast={toast}
      onDismissToast={handleDismissToast}
      toastAction={toastAction}
      showSwipeHint={showSwipeHint}
      onDismissSwipeHint={dismissSwipeHint}
      showHelp={showHelp}
      setShowHelp={setShowHelp}
      onCloseAll={closeAll}
    />
  );
};

export default App;
