import type { Task, Subtask, CategoryStats, MonthlyTrend } from '@/types';
import { CATEGORIES, MONTHS } from '@/constants';

/** Get color based on progress percentage */
export const getProgressColor = (p: number): string => {
  if (p === 100) return '#22c55e';
  if (p >= 75) return '#84cc16';
  if (p >= 50) return '#eab308';
  if (p >= 25) return '#f97316';
  return '#64748b';
};

/** Calculate parent task progress from subtasks */
export const calcParentProgress = (subtasks: Subtask[]): number | null => {
  if (!subtasks || subtasks.length === 0) return null;
  return Math.round(subtasks.reduce((sum, st) => sum + st.progress, 0) / subtasks.length);
};

/** Get task progress (from subtasks or manual) */
export const getTaskProgress = (task: Task): number => {
  const calc = calcParentProgress(task.subtasks);
  return calc !== null ? calc : task.progress;
};

/** Get month statistics */
export const getMonthStats = (monthTasks: Task[]): { total: number; completed: number; avgProgress: number } => {
  const total = monthTasks.length;
  const completed = monthTasks.filter(t => getTaskProgress(t) === 100).length;
  const avgProgress = total > 0 ? Math.round(monthTasks.reduce((s, t) => s + getTaskProgress(t), 0) / total) : 0;
  return { total, completed, avgProgress };
};

/** Migrate incomplete tasks from past months to current month */
export const migrateIncompleteTasks = (taskList: Task[], today: Date): Task[] => {
  const nowMonth = today.getMonth();
  const nowYear = today.getFullYear();

  return taskList.map(task => {
    const taskProgress = getTaskProgress(task);
    const isPast = task.year < nowYear || (task.year === nowYear && task.month < nowMonth);

    if (isPast && taskProgress < 100) {
      return { ...task, month: nowMonth, year: nowYear, migratedFrom: { month: task.month, year: task.year } };
    }
    return task;
  });
};

/** Get category breakdown */
export const getCategoryStats = (tasks: Task[]): Record<string, CategoryStats> => {
  const stats: Record<string, CategoryStats> = {};
  CATEGORIES.forEach(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const completed = catTasks.filter(t => getTaskProgress(t) === 100).length;
    const total = catTasks.length;
    const avgProgress = total > 0 ? Math.round(catTasks.reduce((s, t) => s + getTaskProgress(t), 0) / total) : 0;
    stats[cat] = { total, completed, avgProgress };
  });
  return stats;
};

/** Get priority distribution */
export const getPriorityStats = (tasks: Task[]): Record<'high' | 'medium' | 'low', number> => {
  const stats: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 0, low: 0 };
  tasks.forEach(task => {
    stats[task.priority] = (stats[task.priority] || 0) + 1;
  });
  return stats;
};

/** Get monthly trends (last 6 months) */
export const getMonthlyTrends = (tasks: Task[]): MonthlyTrend[] => {
  const trends: MonthlyTrend[] = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();

    const monthTasks = tasks.filter(t => t.month === month && t.year === year);
    const completed = monthTasks.filter(t => getTaskProgress(t) === 100).length;
    const total = monthTasks.length;
    const avgProgress = total > 0 ? Math.round(monthTasks.reduce((s, t) => s + getTaskProgress(t), 0) / total) : 0;

    trends.push({
      month: MONTHS[month] ?? '',
      monthNum: month,
      year,
      total,
      completed,
      avgProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }
  return trends;
};

/** Calculate completion streak (consecutive days with at least one completed task) */
export const getCompletionStreak = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter(t => getTaskProgress(t) === 100);
  if (completedTasks.length === 0) return 0;

  // Group by completion date (using task ID as proxy for creation date)
  const completionDates = new Set<number>();
  completedTasks.forEach(task => {
    const date = new Date(task.id);
    date.setHours(0, 0, 0, 0);
    completionDates.add(date.getTime());
  });

  const sortedDates = Array.from(completionDates).sort((a, b) => b - a);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  let streak = 0;
  let currentDate = todayTime;

  for (const dateTime of sortedDates) {
    const daysDiff = Math.floor((currentDate - dateTime) / (1000 * 60 * 60 * 24));
    if (daysDiff === streak) {
      streak++;
      currentDate = dateTime - (1000 * 60 * 60 * 24);
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
};
