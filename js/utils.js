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
  // STATISTICS FUNCTIONS
  // ============================================
  
  // Get category breakdown
  const getCategoryStats = (tasks) => {
    const stats = {};
    CATEGORIES.forEach(cat => {
      const catTasks = tasks.filter(t => t.category === cat);
      const completed = catTasks.filter(t => getTaskProgress(t) === 100).length;
      const total = catTasks.length;
      const avgProgress = total > 0 ? Math.round(catTasks.reduce((s, t) => s + getTaskProgress(t), 0) / total) : 0;
      stats[cat] = { total, completed, avgProgress };
    });
    return stats;
  };
  
  // Get priority distribution
  const getPriorityStats = (tasks) => {
    const stats = { high: 0, medium: 0, low: 0 };
    tasks.forEach(task => {
      stats[task.priority] = (stats[task.priority] || 0) + 1;
    });
    return stats;
  };
  
  // Get weekly progress (last 4 weeks)
  const getWeeklyStats = (tasks) => {
    const weeks = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7 + today.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Get tasks created or completed in this week
      const weekTasks = tasks.filter(t => {
        const taskDate = new Date(t.id); // Using task ID as creation timestamp
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const completed = weekTasks.filter(t => getTaskProgress(t) === 100).length;
      const total = weekTasks.length;
      const avgProgress = total > 0 ? Math.round(weekTasks.reduce((s, t) => s + getTaskProgress(t), 0) / total) : 0;
      
      weeks.push({
        week: `Week ${4 - i}`,
        date: weekStart,
        total,
        completed,
        avgProgress
      });
    }
    return weeks;
  };
  
  // Get monthly trends (last 6 months)
  const getMonthlyTrends = (tasks) => {
    const trends = [];
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
        month: MONTHS[month],
        monthNum: month,
        year,
        total,
        completed,
        avgProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    }
    return trends;
  };
  
  // Calculate completion streak (consecutive days with at least one completed task)
  const getCompletionStreak = (tasks) => {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => getTaskProgress(t) === 100);
    if (completedTasks.length === 0) return 0;
    
    // Group by completion date (using task ID as proxy for creation date)
    const completionDates = new Set();
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
  
  // Get tasks completed per day (last 7 days)
  const getDailyCompletion = (tasks) => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Count tasks that were completed on this day (using ID as proxy)
      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.id);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime() && getTaskProgress(t) === 100;
      });
      
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayTasks.length
      });
    }
    return days;
  };