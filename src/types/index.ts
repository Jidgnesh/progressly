export interface Subtask {
  id: number;
  title: string;
  progress: number;
}

export interface Task {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  month: number;
  year: number;
  progress: number;
  subtasks: Subtask[];
  dueDate: string | null;
  migratedFrom?: { month: number; year: number };
}

export interface TrashTask extends Task {
  deletedAt: number;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AppUser;
  redirect?: boolean;
}

export type Page = 'home' | 'history' | 'trash';
export type Filter = 'all' | 'pending' | 'inprogress' | 'completed' | 'overdue';
export type SortBy = 'priority' | 'dueDate' | 'progress';
export type Theme = 'dark' | 'light';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface CategoryStats {
  total: number;
  completed: number;
  avgProgress: number;
}

export interface MonthData {
  month: number;
  year: number;
  tasks: Task[];
}

export interface MonthlyTrend {
  month: string;
  monthNum: number;
  year: number;
  total: number;
  completed: number;
  avgProgress: number;
  completionRate: number;
}
