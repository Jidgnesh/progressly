import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, TrashTask, AppUser } from '@/types';
import { STORAGE_KEY, TRASH_KEY } from '@/constants';
import { getTaskProgress, migrateIncompleteTasks } from '@/utils/tasks';
import * as FirebaseService from '@/lib/firebase-service';

interface UseTasksParams {
  currentUser: AppUser | null;
  useFirebase: boolean;
  isAuthenticated: boolean;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  checkAuth: () => Promise<{ authenticated: boolean; user: AppUser | null; isFirebase: boolean }>;
}

const isFirebaseAvailable = (): boolean => {
  try {
    return !!FirebaseService.getCurrentUser || true;
  } catch {
    return false;
  }
};

export const useTasks = ({ currentUser, useFirebase, isAuthenticated, showToast, checkAuth }: UseTasksParams) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trash, setTrash] = useState<TrashTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [celebratingTask, setCelebratingTask] = useState<number | null>(null);

  // Use refs for current values in async closures
  const currentUserRef = useRef(currentUser);
  const useFirebaseRef = useRef(useFirebase);
  const tasksRef = useRef(tasks);
  const trashRef = useRef(trash);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { useFirebaseRef.current = useFirebase; }, [useFirebase]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { trashRef.current = trash; }, [trash]);

  const saveTasks = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks);
    if (useFirebaseRef.current && currentUserRef.current && isFirebaseAvailable()) {
      setSyncing(true);
      const result = await FirebaseService.saveTasks(currentUserRef.current.uid, newTasks);
      setSyncing(false);
      if (!result.success) {
        showToast('Failed to sync — changes saved locally', 'error');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    }
  }, [showToast]);

  const saveTrash = useCallback(async (newTrash: TrashTask[]) => {
    setTrash(newTrash);
    if (useFirebaseRef.current && currentUserRef.current && isFirebaseAvailable()) {
      const result = await FirebaseService.saveTrash(currentUserRef.current.uid, newTrash);
      if (!result.success) {
        showToast('Failed to sync trash — changes saved locally', 'error');
        localStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));
      }
    } else {
      localStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));
    }
  }, [showToast]);

  const addTask = useCallback((newTask: { title: string; priority: 'high' | 'medium' | 'low'; category: string; dueDate: string }, currentMonth: number, currentYear: number) => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now(),
      title: newTask.title.trim(),
      priority: newTask.priority,
      category: newTask.category,
      month: currentMonth,
      year: currentYear,
      progress: 0,
      subtasks: [],
      dueDate: newTask.dueDate || null,
    };
    saveTasks([...tasksRef.current, task]);
  }, [saveTasks]);

  const quickAddTask = useCallback((title: string, currentMonth: number, currentYear: number) => {
    if (!title.trim()) return;
    const task: Task = {
      id: Date.now(),
      title: title.trim(),
      priority: 'medium',
      category: 'Personal',
      month: currentMonth,
      year: currentYear,
      progress: 0,
      subtasks: [],
      dueDate: null,
    };
    saveTasks([...tasksRef.current, task]);
    showToast('Task added');
  }, [saveTasks, showToast]);

  const moveToTrash = useCallback((id: number) => {
    const taskToDelete = tasksRef.current.find(t => t.id === id);
    if (taskToDelete) {
      saveTrash([{ ...taskToDelete, deletedAt: Date.now() }, ...trashRef.current]);
      saveTasks(tasksRef.current.filter(t => t.id !== id));
    }
  }, [saveTasks, saveTrash]);

  const restoreFromTrash = useCallback((id: number) => {
    const taskToRestore = trashRef.current.find(t => t.id === id);
    if (taskToRestore) {
      const { deletedAt: _, ...restoredTask } = taskToRestore;
      saveTasks([...tasksRef.current, restoredTask as Task]);
      saveTrash(trashRef.current.filter(t => t.id !== id));
    }
  }, [saveTasks, saveTrash]);

  const permanentDelete = useCallback((id: number) => {
    saveTrash(trashRef.current.filter(t => t.id !== id));
  }, [saveTrash]);

  const emptyTrash = useCallback(() => {
    saveTrash([]);
  }, [saveTrash]);

  const updateProgress = useCallback((id: number, progress: number) => {
    const clamped = Math.min(100, Math.max(0, progress));
    const prevTask = tasksRef.current.find(t => t.id === id);
    const wasComplete = prevTask ? getTaskProgress(prevTask) === 100 : false;

    saveTasks(tasksRef.current.map(t => t.id === id ? { ...t, progress: clamped } : t));

    if (clamped === 100 && !wasComplete) {
      setCelebratingTask(id);
      setTimeout(() => setCelebratingTask(null), 600);
    }
  }, [saveTasks]);

  const saveEdit = useCallback((taskId: number, editForm: { title: string; priority: 'high' | 'medium' | 'low'; category: string; dueDate: string }) => {
    if (!editForm.title.trim()) return;
    saveTasks(tasksRef.current.map(t => t.id === taskId ? { ...t, ...editForm } : t));
  }, [saveTasks]);

  const addSubtask = useCallback((taskId: number, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return;
    saveTasks(tasksRef.current.map(t =>
      t.id === taskId
        ? { ...t, subtasks: [...(t.subtasks || []), { id: Date.now(), title: subtaskTitle.trim(), progress: 0 }] }
        : t
    ));
  }, [saveTasks]);

  const deleteSubtask = useCallback((taskId: number, subtaskId: number) => {
    saveTasks(tasksRef.current.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId) }
        : t
    ));
  }, [saveTasks]);

  const updateSubtaskProgress = useCallback((taskId: number, subtaskId: number, progress: number) => {
    saveTasks(tasksRef.current.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, progress: Math.min(100, Math.max(0, progress)) } : st) }
        : t
    ));
  }, [saveTasks]);

  // Load data on mount / auth change
  useEffect(() => {
    const today = new Date();

    const loadData = async () => {
      try {
        const authResult = await checkAuth();
        if (authResult.authenticated) {
          if (authResult.isFirebase && authResult.user) {
            setSyncing(true);
            try {
              const tasksResult = await FirebaseService.getTasks(authResult.user.uid);
              const trashResult = await FirebaseService.getTrash(authResult.user.uid);

              if (tasksResult.success) {
                let loadedTasks = tasksResult.tasks || [];
                loadedTasks = migrateIncompleteTasks(loadedTasks, today);
                setTasks(loadedTasks);
              }

              if (trashResult.success) {
                setTrash(trashResult.trash || []);
              }

              // Set up real-time listener
              FirebaseService.subscribeToTasks(authResult.user.uid, (realtimeTasks) => {
                let loadedTasks = realtimeTasks || [];
                loadedTasks = migrateIncompleteTasks(loadedTasks, today);
                setTasks(loadedTasks);
              });
            } catch (error) {
              console.error('Error loading from Firebase:', error);
              // Fallback to localStorage
              const saved = localStorage.getItem(STORAGE_KEY);
              if (saved) {
                let loadedTasks: Task[] = JSON.parse(saved);
                loadedTasks = migrateIncompleteTasks(loadedTasks, today);
                setTasks(loadedTasks);
              }
              const savedTrash = localStorage.getItem(TRASH_KEY);
              if (savedTrash) {
                setTrash(JSON.parse(savedTrash));
              }
            }
            setSyncing(false);
          } else {
            // Load from localStorage
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              let loadedTasks: Task[] = JSON.parse(saved);
              loadedTasks = migrateIncompleteTasks(loadedTasks, today);
              setTasks(loadedTasks);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedTasks));
            }
            const savedTrash = localStorage.getItem(TRASH_KEY);
            if (savedTrash) {
              setTrash(JSON.parse(savedTrash));
            }
          }
        }
      } catch (error) {
        console.error('Error in loadData:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, checkAuth]);

  return {
    tasks,
    trash,
    loading,
    syncing,
    celebratingTask,
    saveTasks,
    saveTrash,
    addTask,
    quickAddTask,
    moveToTrash,
    restoreFromTrash,
    permanentDelete,
    emptyTrash,
    updateProgress,
    saveEdit,
    addSubtask,
    deleteSubtask,
    updateSubtaskProgress,
  };
};
