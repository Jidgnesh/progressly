export const PRIORITIES: Record<'high' | 'medium' | 'low', string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

export const CATEGORIES = ['Personal', 'Health', 'Learning', 'Other'] as const;

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

export const STORAGE_KEY = 'planner-tasks-v5';
export const TRASH_KEY = 'planner-trash-v1';
export const AUTH_KEY = 'planner-auth-v1';
export const USERS_KEY = 'planner-users-v1';
export const THEME_KEY = 'planner-theme-v1';
export const SWIPE_HINT_KEY = 'planner-swipe-hint-dismissed';
