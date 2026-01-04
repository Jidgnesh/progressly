// ============================================
// CONSTANTS
// ============================================
const PRIORITIES = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Other'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];
const STORAGE_KEY = 'planner-tasks-v4';

// ============================================
// ICON COMPONENT
// ============================================
const Icon = ({ name, size = 24, className = '', color }) => {
  const ref = React.useRef();
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      const icon = lucide.createElement(lucide.icons[name]);
      icon.setAttribute('width', size);
      icon.setAttribute('height', size);
      if (color) icon.setAttribute('stroke', color);
      ref.current.appendChild(icon);
    }
  }, [name, size, color]);
  return React.createElement('span', { ref, className, style: { display: 'inline-flex' } });
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const getProgressColor = (p) => {
  if (p === 100) return '#22c55e';
  if (p >= 75) return '#84cc16';
  if (p >= 50) return '#eab308';
  if (p >= 25) return '#f97316';
  return '#64748b';
};

const calcParentProgress = (subtasks) => {
  if (!subtasks || subtasks.length === 0) return null;
  return Math.round(subtasks.reduce((sum, st) => sum + st.progress, 0) / subtasks.length);
};

const getTaskProgress = (task) => {
  const calc = calcParentProgress(task.subtasks);
  return calc !== null ? calc : task.progress;
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const { useState, useEffect } = React;
  
  // State
  const [tasks, setTasks] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', category: 'Work' });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedTask, setExpandedTask] = useState(null);
  const [expandedSubtask, setExpandedSubtask] = useState(null);
  const [addingSubtaskTo, setAddingSubtaskTo] = useState(null);
  const [newSubtask, setNewSubtask] = useState('');

  // Load tasks on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setTasks(JSON.parse(saved));
    setLoading(false);
  }, []);

  // Save tasks
  const saveTasks = (newTasks) => {
    setTasks(newTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
  };

  // Close all expanded items
  const closeAll = () => {
    setExpandedTask(null);
    setExpandedSubtask(null);
    setAddingSubtaskTo(null);
  };

  // Task operations
  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task = {
      id: Date.now(),
      ...newTask,
      month: currentMonth,
      year: currentYear,
      progress: 0,
      subtasks: []
    };
    saveTasks([...tasks, task]);
    setNewTask({ title: '', priority: 'medium', category: 'Work' });
    setShowAdd(false);
  };

  const deleteTask = (id) => {
    saveTasks(tasks.filter(t => t.id !== id));
    if (expandedTask === id) setExpandedTask(null);
  };

  const updateProgress = (id, progress) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, progress: Math.min(100, Math.max(0, progress)) } : t));
  };

  // Subtask operations
  const addSubtask = (taskId) => {
    if (!newSubtask.trim()) return;
    saveTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: [...(t.subtasks || []), { id: Date.now(), title: newSubtask.trim(), progress: 0 }] };
      }
      return t;
    }));
    setNewSubtask('');
    setAddingSubtaskTo(null);
  };

  const deleteSubtask = (taskId, subtaskId) => {
    saveTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId) };
      }
      return t;
    }));
  };

  const updateSubtaskProgress = (taskId, subtaskId, progress) => {
    saveTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, progress: Math.min(100, Math.max(0, progress)) } : st) };
      }
      return t;
    }));
  };

  // Month navigation
  const changeMonth = (delta) => {
    let m = currentMonth + delta, y = currentYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  // Computed values
  const monthTasks = tasks.filter(t => t.month === currentMonth && t.year === currentYear);
  const completedCount = monthTasks.filter(t => getTaskProgress(t) === 100).length;
  const totalCount = monthTasks.length;
  const avgProgress = totalCount > 0 ? Math.round(monthTasks.reduce((s, t) => s + getTaskProgress(t), 0) / totalCount) : 0;
  const inProgressCount = monthTasks.filter(t => { const p = getTaskProgress(t); return p > 0 && p < 100; }).length;

  const filteredTasks = monthTasks.filter(t => {
    const p = getTaskProgress(t);
    if (filter === 'pending') return p < 100;
    if (filter === 'completed') return p === 100;
    if (filter === 'inprogress') return p > 0 && p < 100;
    return true;
  });

  const sortedTasks = filteredTasks.sort((a, b) => {
    const pa = getTaskProgress(a), pb = getTaskProgress(b);
    if ((pa === 100) !== (pb === 100)) return pa === 100 ? 1 : -1;
    return { high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority];
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24" onClick={closeAll}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold mb-1">Progressly</h1>
        <p className="text-violet-200 text-sm">Track tasks & subtasks</p>
      </div>

      {/* Month Navigator */}
      <div className="bg-slate-800 px-4 py-4 flex items-center justify-between">
        <button onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="p-2 hover:bg-slate-700 rounded-full">
          <Icon name="ChevronLeft" size={24}/>
        </button>
        <div className="text-center">
          <div className="text-xl font-bold">{MONTHS[currentMonth]}</div>
          <div className="text-slate-400 text-sm">{currentYear}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="p-2 hover:bg-slate-700 rounded-full">
          <Icon name="ChevronRight" size={24}/>
        </button>
      </div>

      {/* Stats Card */}
      <div className="mx-4 mt-4 bg-slate-800 rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center relative">
              <svg className="w-14 h-14 -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="#334155" strokeWidth="6" fill="none"/>
                <circle cx="28" cy="28" r="24" stroke="url(#grad)" strokeWidth="6" fill="none" strokeDasharray={`${avgProgress*1.51} 151`} strokeLinecap="round"/>
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%">
                    <stop offset="0%" stopColor="#8b5cf6"/>
                    <stop offset="100%" stopColor="#6366f1"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-sm font-bold">{avgProgress}%</span>
            </div>
            <div>
              <div className="text-lg font-semibold">Overall Progress</div>
              <div className="text-slate-400 text-sm">{totalCount} total tasks</div>
            </div>
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

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
        {[['all','All'],['pending','To Do'],['inprogress','In Progress'],['completed','Done']].map(([k,l]) => (
          <button 
            key={k} 
            onClick={() => setFilter(k)} 
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${filter===k?'bg-violet-600':'bg-slate-800 text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="ListTodo" size={18} color="#a78bfa"/>
          <span className="font-medium">Tasks</span>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Icon name="Circle" size={48} className="mx-auto opacity-50"/>
            <p className="mt-3">{filter==='all'?'No tasks this month':'No tasks here'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map(task => {
              const taskProgress = getTaskProgress(task);
              const hasSubtasks = task.subtasks && task.subtasks.length > 0;
              const isExpanded = expandedTask === task.id;
              
              return (
                <div 
                  key={task.id} 
                  onClick={(e) => e.stopPropagation()} 
                  className={`bg-slate-800 rounded-xl overflow-hidden ${taskProgress===100?'opacity-70':''}`}
                >
                  {/* Task Header */}
                  <div 
                    className="p-4 flex items-center gap-3 cursor-pointer" 
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    {/* Progress Circle */}
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke="#334155" strokeWidth="4" fill="none"/>
                        <circle cx="20" cy="20" r="16" stroke={getProgressColor(taskProgress)} strokeWidth="4" fill="none" strokeDasharray={`${taskProgress*1.005} 100.5`} strokeLinecap="round"/>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{taskProgress}</span>
                    </div>
                    
                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${taskProgress===100?'line-through text-slate-500':''}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:PRIORITIES[task.priority]+'22',color:PRIORITIES[task.priority]}}>{task.priority}</span>
                        <span className="text-xs text-slate-500">{task.category}</span>
                        {hasSubtasks && <span className="text-xs text-violet-400">{task.subtasks.length} subtasks</span>}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isExpanded ? <Icon name="ChevronUp" size={18} color="#94a3b8"/> : <Icon name="ChevronDown" size={18} color="#94a3b8"/>}
                      <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="p-2 text-slate-500 hover:text-red-400">
                        <Icon name="Trash2" size={18}/>
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="px-4 pb-2">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:`${taskProgress}%`,backgroundColor:getProgressColor(taskProgress)}}/>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-700 mt-2">
                      
                      {/* Subtasks Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-slate-400">Subtasks</span>
                          <button 
                            onClick={() => setAddingSubtaskTo(addingSubtaskTo === task.id ? null : task.id)} 
                            className="text-xs bg-violet-600 px-3 py-1 rounded-lg flex items-center gap-1"
                          >
                            <Icon name="Plus" size={14}/> Add
                          </button>
                        </div>
                        
                        {/* Add Subtask Input */}
                        {addingSubtaskTo === task.id && (
                          <div className="flex gap-2 mb-3">
                            <input
                              type="text"
                              placeholder="Subtask name..."
                              value={newSubtask}
                              onChange={(e) => setNewSubtask(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addSubtask(task.id)}
                              className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                              autoFocus
                            />
                            <button onClick={() => addSubtask(task.id)} className="bg-violet-600 px-4 rounded-lg text-sm">Add</button>
                          </div>
                        )}

                        {/* Subtask List */}
                        {hasSubtasks ? (
                          <div className="space-y-2">
                            {task.subtasks.map(st => (
                              <div key={st.id} className="bg-slate-700/50 rounded-lg px-3 py-2">
                                <div 
                                  className="flex items-center gap-3 cursor-pointer"
                                  onClick={() => setExpandedSubtask(expandedSubtask === st.id ? null : st.id)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`text-sm truncate ${st.progress===100?'line-through text-slate-500':''}`}>{st.title}</span>
                                      <span className="text-xs font-bold ml-2" style={{color:getProgressColor(st.progress)}}>{st.progress}</span>
                                    </div>
                                    <div className="h-1 bg-slate-600 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{width:`${st.progress}%`,backgroundColor:getProgressColor(st.progress)}}/>
                                    </div>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); deleteSubtask(task.id, st.id); }} className="w-6 h-6 text-slate-500 hover:text-red-400 flex items-center justify-center">
                                    <Icon name="Trash2" size={12}/>
                                  </button>
                                </div>
                                {expandedSubtask === st.id && (
                                  <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-slate-600">
                                    <button onClick={() => updateSubtaskProgress(task.id, st.id, Math.max(0, st.progress - 10))} className="w-7 h-7 bg-slate-600 rounded flex items-center justify-center hover:bg-slate-500">
                                      <Icon name="Minus" size={14}/>
                                    </button>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max="100" 
                                      value={st.progress} 
                                      onChange={(e) => updateSubtaskProgress(task.id, st.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-14 h-7 bg-slate-600 rounded text-center text-sm font-bold outline-none focus:ring-1 focus:ring-violet-500"
                                      style={{color:getProgressColor(st.progress)}}
                                    />
                                    <button onClick={() => updateSubtaskProgress(task.id, st.id, Math.min(100, st.progress + 10))} className="w-7 h-7 bg-slate-600 rounded flex items-center justify-center hover:bg-slate-500">
                                      <Icon name="Plus" size={14}/>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-3">No subtasks yet</p>
                        )}
                      </div>

                      {/* Manual Progress (only if no subtasks) */}
                      {!hasSubtasks && (
                        <div>
                          <div className="text-sm text-slate-400 mb-3">Manual Progress</div>
                          <div className="flex gap-2 mb-3">
                            {[0,25,50,75,100].map(v => (
                              <button 
                                key={v} 
                                onClick={() => updateProgress(task.id, v)} 
                                className={`flex-1 py-2 rounded-lg text-sm font-medium ${task.progress===v?'ring-2 ring-violet-500':'bg-slate-700'}`} 
                                style={task.progress===v?{backgroundColor:getProgressColor(v)}:{}}
                              >
                                {v}%
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => updateProgress(task.id, task.progress - 5)} className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                              <Icon name="Minus" size={18}/>
                            </button>
                            <input type="range" min="0" max="100" value={task.progress} onChange={(e) => updateProgress(task.id, parseInt(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"/>
                            <button onClick={() => updateProgress(task.id, task.progress + 5)} className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                              <Icon name="PlusCircle" size={18}/>
                            </button>
                          </div>
                        </div>
                      )}

                      {hasSubtasks && (
                        <p className="text-xs text-slate-500 text-center mt-2">Progress auto-calculated from subtasks</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); setShowAdd(true); }} 
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-600/30 hover:bg-violet-500"
      >
        <Icon name="Plus" size={28}/>
      </button>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={() => setShowAdd(false)}>
          <div className="bg-slate-800 w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Task</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 text-2xl">×</button>
            </div>
            <input 
              type="text" 
              placeholder="What's your task?" 
              value={newTask.title} 
              onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
              className="w-full bg-slate-700 rounded-xl px-4 py-4 mb-4 outline-none text-lg" 
              autoFocus
            />
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setNewTask({...newTask, category: c})} 
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${newTask.category===c?'bg-violet-600':'bg-slate-700 text-slate-400'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Priority</label>
              <div className="flex gap-2">
                {Object.entries(PRIORITIES).map(([k,c]) => (
                  <button 
                    key={k} 
                    onClick={() => setNewTask({...newTask, priority: k})} 
                    className={`flex-1 py-3 rounded-xl capitalize font-medium ${newTask.priority===k?'ring-2 ring-offset-2 ring-offset-slate-800':'opacity-50'}`} 
                    style={{backgroundColor:c+'33',color:c}}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={addTask} 
              disabled={!newTask.title.trim()} 
              className="w-full bg-violet-600 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
            >
              Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// RENDER APP
// ============================================
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);