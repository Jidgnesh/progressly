// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
    const { useState, useEffect } = React;
    const today = new Date();
  
    // ==================== STATE ====================
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authPage, setAuthPage] = useState('signin'); // 'signin', 'signup', 'login'
    const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', confirmPassword: '' });
    const [authError, setAuthError] = useState('');
    const [tasks, setTasks] = useState([]);
    const [trash, setTrash] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [showAdd, setShowAdd] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', priority: 'medium', category: 'Personal', dueDate: '' });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedTask, setExpandedTask] = useState(null);
    const [expandedSubtask, setExpandedSubtask] = useState(null);
    const [addingSubtaskTo, setAddingSubtaskTo] = useState(null);
    const [newSubtask, setNewSubtask] = useState('');
    const [currentPage, setCurrentPage] = useState('home');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', priority: 'medium', category: 'Personal', dueDate: '' });
    const [sortBy, setSortBy] = useState('priority'); // 'priority', 'dueDate', 'progress'
    const [searchQuery, setSearchQuery] = useState('');
  
    // ==================== AUTHENTICATION FUNCTIONS ====================
    const checkAuth = () => {
      const auth = localStorage.getItem(AUTH_KEY);
      if (auth) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    };

    const handleSignUp = (e) => {
      e.preventDefault();
      setAuthError('');
      
      if (!authForm.name || !authForm.email || !authForm.password) {
        setAuthError('All fields are required');
        return;
      }
      
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('Passwords do not match');
        return;
      }
      
      if (authForm.password.length < 6) {
        setAuthError('Password must be at least 6 characters');
        return;
      }
      
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      if (users.find(u => u.email === authForm.email)) {
        setAuthError('Email already exists');
        return;
      }
      
      const newUser = {
        id: Date.now(),
        name: authForm.name,
        email: authForm.email,
        password: authForm.password, // In production, hash this!
        createdAt: Date.now()
      };
      
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email: authForm.email, name: authForm.name }));
      setIsAuthenticated(true);
      setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
    };

    const handleSignIn = (e) => {
      e.preventDefault();
      setAuthError('');
      
      if (!authForm.email || !authForm.password) {
        setAuthError('Email and password are required');
        return;
      }
      
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const user = users.find(u => u.email === authForm.email && u.password === authForm.password);
      
      if (!user) {
        setAuthError('Invalid email or password');
        return;
      }
      
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email: user.email, name: user.name }));
      setIsAuthenticated(true);
      setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
    };

    const handleLogout = () => {
      localStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
      setAuthPage('signin');
    };

    // ==================== EFFECTS ====================
    useEffect(() => {
      if (checkAuth()) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          let loadedTasks = JSON.parse(saved);
          loadedTasks = migrateIncompleteTasks(loadedTasks, today);
          setTasks(loadedTasks);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedTasks));
        }
        const savedTrash = localStorage.getItem(TRASH_KEY);
        if (savedTrash) {
          setTrash(JSON.parse(savedTrash));
        }
      }
      setLoading(false);
    }, [isAuthenticated]);
  
    // ==================== STORAGE FUNCTIONS ====================
    const saveTasks = (newTasks) => {
      setTasks(newTasks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    };
  
    const saveTrash = (newTrash) => {
      setTrash(newTrash);
      localStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));
    };
  
    // ==================== UI FUNCTIONS ====================
    const closeAll = () => {
      setExpandedTask(null);
      setExpandedSubtask(null);
      setAddingSubtaskTo(null);
    };
  
    const changeMonth = (delta) => {
      let m = currentMonth + delta, y = currentYear;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      setCurrentMonth(m);
      setCurrentYear(y);
    };
  
    // ==================== TASK OPERATIONS ====================
    const addTask = () => {
      if (!newTask.title.trim()) return;
      const task = {
        id: Date.now(),
        ...newTask,
        month: currentMonth,
        year: currentYear,
        progress: 0,
        subtasks: [],
        dueDate: newTask.dueDate || null
      };
      saveTasks([...tasks, task]);
      setNewTask({ title: '', priority: 'medium', category: 'Personal', dueDate: '' });
      setShowAdd(false);
    };
  
    const moveToTrash = (id) => {
      const taskToDelete = tasks.find(t => t.id === id);
      if (taskToDelete) {
        saveTrash([{ ...taskToDelete, deletedAt: Date.now() }, ...trash]);
        saveTasks(tasks.filter(t => t.id !== id));
      }
      if (expandedTask === id) setExpandedTask(null);
      setDeleteConfirm(null);
    };
  
    const restoreFromTrash = (id) => {
      const taskToRestore = trash.find(t => t.id === id);
      if (taskToRestore) {
        const { deletedAt, ...restoredTask } = taskToRestore;
        saveTasks([...tasks, restoredTask]);
        saveTrash(trash.filter(t => t.id !== id));
      }
    };
  
    const permanentDelete = (id) => saveTrash(trash.filter(t => t.id !== id));
    const emptyTrash = () => saveTrash([]);
  
    const openEditModal = (task) => {
      setEditForm({ title: task.title, priority: task.priority, category: task.category, dueDate: task.dueDate || '' });
      setEditingTask(task.id);
    };
  
    const saveEdit = () => {
      if (!editForm.title.trim()) return;
      saveTasks(tasks.map(t => t.id === editingTask ? { ...t, ...editForm } : t));
      setEditingTask(null);
    };
  
    const updateProgress = (id, progress) => {
      saveTasks(tasks.map(t => t.id === id ? { ...t, progress: Math.min(100, Math.max(0, progress)) } : t));
    };
  
    // ==================== SUBTASK OPERATIONS ====================
    const addSubtask = (taskId) => {
      if (!newSubtask.trim()) return;
      saveTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), { id: Date.now(), title: newSubtask.trim(), progress: 0 }] } : t));
      setNewSubtask('');
      setAddingSubtaskTo(null);
    };
  
    const deleteSubtask = (taskId, subtaskId) => {
      saveTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId) } : t));
    };
  
    const updateSubtaskProgress = (taskId, subtaskId, progress) => {
      saveTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, progress: Math.min(100, Math.max(0, progress)) } : st) } : t));
    };
  
    // ==================== COMPUTED VALUES ====================
    const getMonthsWithTasks = () => {
      const monthsMap = {};
      tasks.forEach(task => {
        const key = `${task.year}-${task.month}`;
        if (!monthsMap[key]) monthsMap[key] = { month: task.month, year: task.year, tasks: [] };
        monthsMap[key].tasks.push(task);
      });
      return Object.values(monthsMap).sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
    };
  
    // Search function
    const searchTasks = (query, taskList) => {
      if (!query.trim()) return taskList;
      const lowerQuery = query.toLowerCase();
      return taskList.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) ||
        t.category.toLowerCase().includes(lowerQuery) ||
        t.priority.toLowerCase().includes(lowerQuery) ||
        (t.dueDate && formatDate(t.dueDate).toLowerCase().includes(lowerQuery)) ||
        (t.subtasks && t.subtasks.some(st => st.title.toLowerCase().includes(lowerQuery)))
      );
    };
    
    const monthTasks = tasks.filter(t => t.month === currentMonth && t.year === currentYear);
    const searchedTasks = searchQuery ? searchTasks(searchQuery, tasks) : monthTasks;
    const completedCount = monthTasks.filter(t => getTaskProgress(t) === 100).length;
    const totalCount = monthTasks.length;
    const avgProgress = totalCount > 0 ? Math.round(monthTasks.reduce((s, t) => s + getTaskProgress(t), 0) / totalCount) : 0;
    const inProgressCount = monthTasks.filter(t => { const p = getTaskProgress(t); return p > 0 && p < 100; }).length;
  
    const filteredTasks = (searchQuery ? searchedTasks : monthTasks).filter(t => {
      const p = getTaskProgress(t);
      if (filter === 'pending') return p < 100;
      if (filter === 'completed') return p === 100;
      if (filter === 'inprogress') return p > 0 && p < 100;
      if (filter === 'overdue') return t.dueDate && isOverdue(t.dueDate) && p < 100;
      if (filter === 'dueToday') return t.dueDate && isDueToday(t.dueDate);
      if (filter === 'dueThisWeek') return t.dueDate && isDueThisWeek(t.dueDate);
      return true;
    });
  
    const sortedTasks = filteredTasks.sort((a, b) => {
      // Sort by completion status first
      const pa = getTaskProgress(a), pb = getTaskProgress(b);
      if ((pa === 100) !== (pb === 100)) return pa === 100 ? 1 : -1;
      
      // Then sort by selected criteria
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) {
          return { high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority];
        }
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      
      if (sortBy === 'progress') {
        return pb - pa;
      }
      
      // Default: sort by priority
      return { high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority];
    });
  
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const monthsWithTasks = getMonthsWithTasks();
    const allTasksProgress = tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + getTaskProgress(t), 0) / tasks.length) : 0;
    const taskToDelete = tasks.find(t => t.id === deleteConfirm);
  
    // ==================== LOADING ====================
    if (loading) {
      return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>;
    }

    // ==================== AUTHENTICATION PAGES ====================
    if (!isAuthenticated) {
      const currentUser = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
      
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Progressly</h1>
              <p className="text-slate-400">Keep moving forward!</p>
            </div>

            {/* Auth Form Card */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => { setAuthPage('signin'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    authPage === 'signin' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthPage('signup'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    authPage === 'signup' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => { setAuthPage('login'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    authPage === 'login' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  Login
                </button>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {authError}
                </div>
              )}

              {/* Sign Up Form */}
              {authPage === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Name</label>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Password</label>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Create a password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                      className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Sign Up
                  </button>
                </form>
              )}

              {/* Sign In Form */}
              {authPage === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Password</label>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Sign In
                  </button>
                </form>
              )}

              {/* Login Form (same as Sign In) */}
              {authPage === 'login' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Password</label>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Login
                  </button>
                </form>
              )}

              {/* Footer Links */}
              <div className="mt-6 text-center text-sm text-slate-400">
                {authPage === 'signup' ? (
                  <p>
                    Already have an account?{' '}
                    <button onClick={() => { setAuthPage('signin'); setAuthError(''); }} className="text-violet-400 hover:text-violet-300">
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have an account?{' '}
                    <button onClick={() => { setAuthPage('signup'); setAuthError(''); }} className="text-violet-400 hover:text-violet-300">
                      Sign Up
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  
    // ==================== TRASH PAGE ====================
    if (currentPage === 'trash') {
      return (
        <div className="min-h-screen bg-slate-900 text-white pb-24">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-4 pt-8 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Trash2" size={24}/>
                  <h1 className="text-2xl font-bold">Trash</h1>
                </div>
                <p className="text-red-200 text-sm">{trash.length} deleted task{trash.length !== 1 ? 's' : ''}</p>
              </div>
              {trash.length > 0 && (
                <button onClick={emptyTrash} className="bg-white/20 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30">Empty All</button>
              )}
            </div>
          </div>
  
          <div className="px-4 mt-4">
            {trash.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Icon name="Trash2" size={64} className="mx-auto opacity-30"/>
                <p className="mt-4 text-lg">Trash is empty</p>
                <p className="text-sm mt-1">Deleted tasks will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trash.map(task => (
                  <TrashItem 
                    key={task.id} 
                    task={task} 
                    onRestore={() => restoreFromTrash(task.id)} 
                    onDelete={() => permanentDelete(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
  
          <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trash.length} />
        </div>
      );
    }
  
    // ==================== STATISTICS PAGE ====================
    if (currentPage === 'statistics') {
      const categoryStats = getCategoryStats(tasks);
      const priorityStats = getPriorityStats(tasks);
      const weeklyStats = getWeeklyStats(tasks);
      const monthlyTrends = getMonthlyTrends(tasks);
      const completionStreak = getCompletionStreak(tasks);
      const dailyCompletion = getDailyCompletion(tasks);
      const maxDailyCount = Math.max(...dailyCompletion.map(d => d.count), 1);
      
      return (
        <div className="min-h-screen bg-slate-900 text-white pb-24">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 pt-8 pb-6">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="BarChart3" size={24} />
              <h1 className="text-2xl font-bold">Statistics</h1>
            </div>
            <p className="text-violet-200 text-sm">Track your productivity trends</p>
          </div>

          <div className="px-4 mt-4 space-y-4">
            {/* Overall Stats */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4">Overall Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-violet-400">{tasks.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{completionStreak}</div>
                  <div className="text-xs text-slate-400 mt-1">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{tasks.filter(t => getTaskProgress(t) === 100).length}</div>
                  <div className="text-xs text-slate-400 mt-1">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{allTasksProgress}%</div>
                  <div className="text-xs text-slate-400 mt-1">Avg Progress</div>
                </div>
              </div>
            </div>

            {/* Daily Completion Chart */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4">Last 7 Days</h2>
              <div className="flex items-end justify-between gap-2 h-32">
                {dailyCompletion.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '100px' }}>
                      <div 
                        className="w-full bg-violet-600 rounded-t transition-all"
                        style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-2">{day.day}</div>
                    <div className="text-xs font-bold mt-1">{day.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4">By Category</h2>
              <div className="space-y-3">
                {Object.entries(categoryStats).map(([cat, stats]) => (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{cat}</span>
                      <span className="text-xs text-slate-400">{stats.completed}/{stats.total} • {stats.avgProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${stats.avgProgress}%`, backgroundColor: getProgressColor(stats.avgProgress) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4">Priority Distribution</h2>
              <div className="space-y-3">
                {Object.entries(priorityStats).map(([priority, count]) => {
                  const total = Object.values(priorityStats).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={priority}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium capitalize" style={{ color: PRIORITIES[priority] }}>{priority}</span>
                        <span className="text-xs text-slate-400">{count} tasks • {percentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: PRIORITIES[priority] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4">Monthly Trends (Last 6 Months)</h2>
              <div className="space-y-3">
                {monthlyTrends.map((trend, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{trend.month} {trend.year}</span>
                      <span className="text-xs text-slate-400">{trend.completed}/{trend.total} • {trend.completionRate}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${trend.completionRate}%`, backgroundColor: getProgressColor(trend.completionRate) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trash.length} />
        </div>
      );
    }

    // ==================== HISTORY PAGE ====================
    if (currentPage === 'history') {
      return (
        <div className="min-h-screen bg-slate-900 text-white pb-24">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 pt-8 pb-6">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">Progressly</h1>
            </div>
            <p className="text-violet-200 text-sm">View progress across all months</p>
          </div>
  
          <div className="mx-4 mt-4 bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center relative">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#334155" strokeWidth="6" fill="none"/>
                  <circle cx="32" cy="32" r="28" stroke="url(#gradAll)" strokeWidth="6" fill="none" strokeDasharray={`${allTasksProgress * 1.76} 176`} strokeLinecap="round"/>
                  <defs><linearGradient id="gradAll" x1="0%" y1="0%" x2="100%"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs>
                </svg>
                <span className="absolute text-sm font-bold">{allTasksProgress}%</span>
              </div>
              <div>
                <div className="text-lg font-semibold">All Time Progress</div>
                <div className="text-slate-400 text-sm">{tasks.length} total tasks • {monthsWithTasks.length} months</div>
              </div>
            </div>
          </div>
  
          <div className="px-4 mt-6">
            <div className="text-sm text-slate-400 mb-3">All Months</div>
            {monthsWithTasks.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {monthsWithTasks.map(({ month, year, tasks: mTasks }) => {
                  const stats = getMonthStats(mTasks);
                  const isCurrent = month === today.getMonth() && year === today.getFullYear();
                  return (
                    <div
                      key={`${year}-${month}`}
                      onClick={() => { setCurrentMonth(month); setCurrentYear(year); setCurrentPage('home'); }}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${isCurrent ? 'bg-violet-600 ring-2 ring-violet-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-xs text-slate-400">{year}</div>
                          <div className="text-lg font-bold">{MONTHS_FULL[month]}</div>
                        </div>
                        {isCurrent && <span className="text-xs bg-white/20 px-2 py-1 rounded">Current</span>}
                      </div>
                      <div className="mt-3 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${stats.avgProgress}%`, backgroundColor: getProgressColor(stats.avgProgress) }}/>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-lg font-bold" style={{ color: getProgressColor(stats.avgProgress) }}>{stats.avgProgress}%</span>
                        <span className="text-sm text-slate-400">{stats.completed}/{stats.total} done</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Icon name="Calendar" size={48} className="mx-auto opacity-50"/>
                <p className="mt-3">No tasks yet</p>
              </div>
            )}
          </div>
  
          <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trash.length} />
        </div>
      );
    }
  
    // ==================== HOME PAGE ====================
    return (
      <div className="min-h-screen bg-slate-900 text-white pb-24" onClick={closeAll}>
        {/* Modals */}
        {deleteConfirm && <DeleteConfirmModal task={taskToDelete} onCancel={() => setDeleteConfirm(null)} onConfirm={() => moveToTrash(deleteConfirm)} />}
        {editingTask && <EditTaskModal editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={() => setEditingTask(null)} />}
        {showAdd && <AddTaskModal newTask={newTask} setNewTask={setNewTask} onAdd={addTask} onCancel={() => setShowAdd(false)} />}
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 pt-8 pb-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-bold">Progressly</h1>
              <p className="text-violet-200 text-sm">Keep moving forward !</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/20 rounded-full transition-all"
              title="Logout"
            >
              <Icon name="LogOut" size={24} color="white"/>
            </button>
          </div>
        </div>
  
        {/* Month Navigator */}
        <div className="bg-slate-800 px-4 py-4 flex items-center justify-between">
          <button onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="p-2 hover:bg-slate-700 rounded-full">
            <Icon name="ChevronLeft" size={24}/>
          </button>
          <div className="text-center">
            <div className="text-xl font-bold">{MONTHS_FULL[currentMonth]}</div>
            <div className="text-slate-400 text-sm">{currentYear} {isCurrentMonth && <span className="text-violet-400">• Current</span>}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="p-2 hover:bg-slate-700 rounded-full">
            <Icon name="ChevronRight" size={24}/>
          </button>
        </div>
  
        {/* Stats Card */}
        <div className="mx-4 mt-4 bg-slate-800 rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center relative">
              <svg className="w-14 h-14 -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="#334155" strokeWidth="6" fill="none"/>
                <circle cx="28" cy="28" r="24" stroke="url(#grad)" strokeWidth="6" fill="none" strokeDasharray={`${avgProgress*1.51} 151`} strokeLinecap="round"/>
                <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs>
              </svg>
              <span className="absolute text-sm font-bold">{avgProgress}%</span>
            </div>
            <div>
              <div className="text-lg font-semibold">Overall Progress</div>
              <div className="text-slate-400 text-sm">{totalCount} total tasks</div>
            </div>
          </div>
          <div className="flex justify-between pt-4 border-t border-slate-700">
            <div className="text-center">
              <div className="text-xl font-bold text-orange-400">{totalCount - completedCount - inProgressCount}</div>
              <div className="text-xs text-slate-400">Not Started</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-400">{inProgressCount}</div>
              <div className="text-xs text-slate-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">{completedCount}</div>
              <div className="text-xs text-slate-400">Completed</div>
            </div>
          </div>
        </div>
  
        {/* Search Bar */}
        <div className="px-4 mt-4" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-500 focus:bg-slate-700"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <Icon name="X" size={18}/>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-slate-400 text-xs mt-2">
              Found {searchedTasks.length} task{searchedTasks.length !== 1 ? 's' : ''} across all months
            </p>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {[['all','All'],['pending','To Do'],['inprogress','In Progress'],['completed','Done'],['overdue','Overdue'],['dueToday','Today'],['dueThisWeek','This Week']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${filter===k?'bg-violet-600':'bg-slate-800 text-slate-400'}`}>{l}</button>
          ))}
        </div>
        
        {/* Sort Options */}
        <div className="flex gap-2 px-4 mt-3" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-slate-400 self-center">Sort by:</span>
          {[['priority','Priority'],['dueDate','Due Date'],['progress','Progress']].map(([k,l]) => (
            <button key={k} onClick={() => setSortBy(k)} className={`px-3 py-1 rounded-lg text-xs font-medium ${sortBy===k?'bg-violet-600':'bg-slate-800 text-slate-400'}`}>{l}</button>
          ))}
        </div>
  
        {/* Task List */}
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="ListTodo" size={18} color="#a78bfa"/>
            <span className="font-medium">
              {searchQuery ? `Search Results (${sortedTasks.length})` : 'Tasks'}
            </span>
          </div>
  
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Icon name={searchQuery ? "Search" : "Circle"} size={48} className="mx-auto opacity-50"/>
              <p className="mt-3">
                {searchQuery 
                  ? `No tasks found for "${searchQuery}"` 
                  : filter==='all'?'No tasks this month':'No tasks here'}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="mt-2 text-violet-400 text-sm hover:text-violet-300"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isExpanded={expandedTask === task.id}
                  expandedSubtask={expandedSubtask}
                  addingSubtaskTo={addingSubtaskTo}
                  newSubtask={newSubtask}
                  setNewSubtask={setNewSubtask}
                  onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  onToggleSubtask={(id) => setExpandedSubtask(expandedSubtask === id ? null : id)}
                  onEdit={() => openEditModal(task)}
                  onDelete={() => setDeleteConfirm(task.id)}
                  onUpdateProgress={(p) => updateProgress(task.id, p)}
                  onAddSubtask={() => addSubtask(task.id)}
                  onDeleteSubtask={(stId) => deleteSubtask(task.id, stId)}
                  onUpdateSubtaskProgress={(stId, p) => updateSubtaskProgress(task.id, stId, p)}
                  onToggleAddSubtask={() => setAddingSubtaskTo(addingSubtaskTo === task.id ? null : task.id)}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
  
        {/* Add Task Button */}
        <button onClick={(e) => { e.stopPropagation(); setShowAdd(true); }} className="fixed bottom-20 right-6 w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-600/30 hover:bg-violet-500">
          <Icon name="Plus" size={28}/>
        </button>
  
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trash.length} />
      </div>
    );
  }
  
  // ============================================
  // RENDER APP
  // ============================================
  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);