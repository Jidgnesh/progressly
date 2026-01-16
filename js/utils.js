// ============================================
// HELPER FUNCTIONS
// ============================================

// Get color based on progress percentage
const getProgressColor = (p) => {
    if (p === 100) return '#22c55e';
    if (p >= 75) return '#84cc16';
    if (p >= 50) return '#eab308';
    if (p >= 25) return '#f97316';
    return '#64748b';
  };
  
  // Calculate parent task progress from subtasks
  const calcParentProgress = (subtasks) => {
    if (!subtasks || subtasks.length === 0) return null;
    return Math.round(subtasks.reduce((sum, st) => sum + st.progress, 0) / subtasks.length);
  };
  
  // Get task progress (from subtasks or manual)
  const getTaskProgress = (task) => {
    const calc = calcParentProgress(task.subtasks);
    return calc !== null ? calc : task.progress;
  };
  
  // Format deleted time for trash items
  const formatDeletedTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  // Get month statistics
  const getMonthStats = (monthTasks) => {
    const total = monthTasks.length;
    const completed = monthTasks.filter(t => getTaskProgress(t) === 100).length;
    const avgProgress = total > 0 ? Math.round(monthTasks.reduce((s, t) => s + getTaskProgress(t), 0) / total) : 0;
    return { total, completed, avgProgress };
  };
  
  // Migrate incomplete tasks from past months to current month
  const migrateIncompleteTasks = (taskList, today) => {
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

  // ============================================
  // DUE DATE FUNCTIONS
  // ============================================
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };
  
  // Check if task is overdue
  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  // Check if task is due today
  const isDueToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };
  
  // Check if task is due this week
  const isDueThisWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };
  
  // Get date input value (YYYY-MM-DD format)
  const getDateInputValue = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };