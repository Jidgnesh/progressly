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
// LOGO COMPONENT
// ============================================
const Logo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M14 24 C14 18 8 18 8 24 C8 30 14 30 14 24 C14 18 24 18 24 24 C24 30 34 30 34 24 C34 18 40 18 40 24 C40 30 34 30 34 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.3"/>
    <path d="M14 24 C14 18 8 18 8 24 C8 30 14 30 14 24 C14 18 24 18 24 24" stroke="white" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

// ============================================
// PROGRESS CIRCLE COMPONENT
// ============================================
const ProgressCircle = ({ progress, size = 40, strokeWidth = 4 }) => {
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = radius * 2 * Math.PI;
  const dashArray = `${(progress / 100) * circumference} ${circumference}`;
  
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" style={{ width: size, height: size }}>
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke="#334155" 
          strokeWidth={strokeWidth} 
          fill="none"
        />
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke={getProgressColor(progress)} 
          strokeWidth={strokeWidth} 
          fill="none" 
          strokeDasharray={dashArray}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{progress}</span>
    </div>
  );
};

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================
const DeleteConfirmModal = ({ task, onCancel, onConfirm }) => {
  if (!task) return null;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4">
          <Icon name="Trash2" size={32} color="#ef4444"/>
        </div>
        <h3 className="text-xl font-bold text-center mb-2">Delete Task?</h3>
        <p className="text-slate-400 text-center mb-2">"{task.title}"</p>
        {hasSubtasks && (
          <p className="text-amber-400 text-sm text-center mb-4">
            <Icon name="AlertTriangle" size={14} className="inline mr-1"/>
            This will also delete {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
          </p>
        )}
        <p className="text-slate-500 text-sm text-center mb-6">
          You can restore this task from the trash later.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-700 font-medium hover:bg-slate-600">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 font-medium hover:bg-red-500">Delete</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EDIT TASK MODAL
// ============================================
const EditTaskModal = ({ editForm, setEditForm, onSave, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onCancel}>
      <div className="bg-slate-800 w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Edit Task</h2>
          <button onClick={onCancel} className="text-slate-400 text-2xl">×</button>
        </div>
        <input 
          type="text" 
          placeholder="Task name" 
          value={editForm.title} 
          onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
          className="w-full bg-slate-700 rounded-xl px-4 py-4 mb-4 outline-none text-lg" 
          autoFocus
        />
        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button 
                key={c} 
                onClick={() => setEditForm({...editForm, category: c})} 
                className={`px-4 py-2 rounded-xl text-sm font-medium ${editForm.category===c?'bg-violet-600':'bg-slate-700 text-slate-400'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-2 block">Priority</label>
          <div className="flex gap-2">
            {Object.entries(PRIORITIES).map(([k,c]) => (
              <button 
                key={k} 
                onClick={() => setEditForm({...editForm, priority: k})} 
                className={`flex-1 py-3 rounded-xl capitalize font-medium ${editForm.priority===k?'ring-2 ring-offset-2 ring-offset-slate-800':'opacity-50'}`} 
                style={{backgroundColor:c+'33',color:c}}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Due Date (Optional)</label>
          <input 
            type="date" 
            value={getDateInputValue(editForm.dueDate)} 
            onChange={(e) => setEditForm({...editForm, dueDate: e.target.value || ''})} 
            className="w-full bg-slate-700 rounded-xl px-4 py-3 outline-none text-white"
            min={new Date().toISOString().split('T')[0]}
          />
          {editForm.dueDate && (
            <button 
              onClick={() => setEditForm({...editForm, dueDate: ''})} 
              className="mt-2 text-xs text-red-400 hover:text-red-300"
            >
              Clear due date
            </button>
          )}
        </div>
        <button 
          onClick={onSave} 
          disabled={!editForm.title.trim()} 
          className="w-full bg-violet-600 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

// ============================================
// ADD TASK MODAL
// ============================================
const AddTaskModal = ({ newTask, setNewTask, onAdd, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onCancel}>
      <div className="bg-slate-800 w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add Task</h2>
          <button onClick={onCancel} className="text-slate-400 text-2xl">×</button>
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
        <div className="mb-4">
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
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Due Date (Optional)</label>
          <input 
            type="date" 
            value={getDateInputValue(newTask.dueDate)} 
            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value || ''})} 
            className="w-full bg-slate-700 rounded-xl px-4 py-3 outline-none text-white"
            min={new Date().toISOString().split('T')[0]}
          />
          {newTask.dueDate && (
            <button 
              onClick={() => setNewTask({...newTask, dueDate: ''})} 
              className="mt-2 text-xs text-red-400 hover:text-red-300"
            >
              Clear due date
            </button>
          )}
        </div>
        <button 
          onClick={onAdd} 
          disabled={!newTask.title.trim()} 
          className="w-full bg-violet-600 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
        >
          Add Task
        </button>
      </div>
    </div>
  );
};

// ============================================
// BOTTOM NAVIGATION
// ============================================
const BottomNav = ({ currentPage, setCurrentPage, trashCount }) => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setCurrentPage('home')} 
            className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-violet-400' : 'text-slate-400'}`}
          >
            <Icon name="Home" size={24}/>
            <span className="text-xs">Home</span>
          </button>
          
          {/* Divider */}
          <div className="w-px h-10 bg-slate-600 rounded-full"></div>
          
          <button 
            onClick={() => setCurrentPage('history')} 
            className={`flex flex-col items-center gap-1 ${currentPage === 'history' ? 'text-violet-400' : 'text-slate-400'}`}
          >
            <Icon name="History" size={24}/>
            <span className="text-xs">History</span>
          </button>
          
          {/* Divider */}
          <div className="w-px h-10 bg-slate-600 rounded-full"></div>
          
          <button 
            onClick={() => setCurrentPage('trash')} 
            className={`flex flex-col items-center gap-1 ${currentPage === 'trash' ? 'text-red-400' : 'text-slate-400'}`}
          >
            <div className="relative">
              <Icon name="Trash2" size={24}/>
              {trashCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">{trashCount}</span>
              )}
            </div>
            <span className="text-xs">Trash</span>
          </button>
        </div>
      </div>
    );
  };

// ============================================
// TASK ITEM COMPONENT
// ============================================
const TaskItem = ({ 
  task, 
  isExpanded, 
  expandedSubtask,
  addingSubtaskTo,
  newSubtask,
  setNewSubtask,
  onToggleExpand,
  onToggleSubtask,
  onEdit,
  onDelete,
  onUpdateProgress,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateSubtaskProgress,
  onToggleAddSubtask,
  searchQuery
}) => {
  const taskProgress = getTaskProgress(task);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  
  // Highlight search matches
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? React.createElement('mark', { key: i, className: 'bg-yellow-400/30 text-yellow-200 rounded px-0.5' }, part)
        : part
    );
  };

  const overdue = task.dueDate && isOverdue(task.dueDate) && taskProgress < 100;
  
  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className={`bg-slate-800 rounded-xl overflow-hidden ${taskProgress===100?'opacity-70':''} ${overdue?'ring-2 ring-red-500/50':''}`}
    >
      {/* Task Header */}
      <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={onToggleExpand}>
        <ProgressCircle progress={taskProgress} size={40} strokeWidth={4} />
        
        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${taskProgress===100?'line-through text-slate-500':''}`}>
            {searchQuery ? highlightText(task.title, searchQuery) : task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:PRIORITIES[task.priority]+'22',color:PRIORITIES[task.priority]}}>{task.priority}</span>
            <span className="text-xs text-slate-500">{task.category}</span>
            {hasSubtasks && <span className="text-xs text-violet-400">{task.subtasks.length} subtasks</span>}
            {task.migratedFrom && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Icon name="ArrowRight" size={10}/> from {MONTHS[task.migratedFrom.month]}
              </span>
            )}
            {task.dueDate && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isOverdue(task.dueDate) && taskProgress < 100 
                  ? 'bg-red-500/20 text-red-400' 
                  : isDueToday(task.dueDate)
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                <Icon name={isOverdue(task.dueDate) && taskProgress < 100 ? "AlertCircle" : "Calendar"} size={10}/>
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-500 hover:text-violet-400">
            <Icon name="Pencil" size={16}/>
          </button>
          {isExpanded ? <Icon name="ChevronUp" size={18} color="#94a3b8"/> : <Icon name="ChevronDown" size={18} color="#94a3b8"/>}
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-500 hover:text-red-400">
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
              <button onClick={onToggleAddSubtask} className="text-xs bg-violet-600 px-3 py-1 rounded-lg flex items-center gap-1">
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
                  onKeyPress={(e) => e.key === 'Enter' && onAddSubtask()}
                  className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                  autoFocus
                />
                <button onClick={onAddSubtask} className="bg-violet-600 px-4 rounded-lg text-sm">Add</button>
              </div>
            )}

            {/* Subtask List */}
            {hasSubtasks ? (
              <div className="space-y-2">
                {task.subtasks.map(st => (
                  <div key={st.id} className="bg-slate-700/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggleSubtask(st.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm truncate ${st.progress===100?'line-through text-slate-500':''}`}>{st.title}</span>
                          <span className="text-xs font-bold ml-2" style={{color:getProgressColor(st.progress)}}>{st.progress}</span>
                        </div>
                        <div className="h-1 bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{width:`${st.progress}%`,backgroundColor:getProgressColor(st.progress)}}/>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteSubtask(st.id); }} className="w-6 h-6 text-slate-500 hover:text-red-400 flex items-center justify-center">
                        <Icon name="Trash2" size={12}/>
                      </button>
                    </div>
                    {expandedSubtask === st.id && (
                      <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-slate-600">
                        <button onClick={() => onUpdateSubtaskProgress(st.id, Math.max(0, st.progress - 10))} className="w-7 h-7 bg-slate-600 rounded flex items-center justify-center hover:bg-slate-500">
                          <Icon name="Minus" size={14}/>
                        </button>
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={st.progress} 
                          onChange={(e) => onUpdateSubtaskProgress(st.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-14 h-7 bg-slate-600 rounded text-center text-sm font-bold outline-none focus:ring-1 focus:ring-violet-500"
                          style={{color:getProgressColor(st.progress)}}
                        />
                        <button onClick={() => onUpdateSubtaskProgress(st.id, Math.min(100, st.progress + 10))} className="w-7 h-7 bg-slate-600 rounded flex items-center justify-center hover:bg-slate-500">
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
                    onClick={() => onUpdateProgress(v)} 
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${task.progress===v?'ring-2 ring-violet-500':'bg-slate-700'}`} 
                    style={task.progress===v?{backgroundColor:getProgressColor(v)}:{}}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => onUpdateProgress(task.progress - 5)} className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Icon name="Minus" size={18}/>
                </button>
                <input type="range" min="0" max="100" value={task.progress} onChange={(e) => onUpdateProgress(parseInt(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"/>
                <button onClick={() => onUpdateProgress(task.progress + 5)} className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
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
};

// ============================================
// TRASH ITEM COMPONENT
// ============================================
const TrashItem = ({ task, onRestore, onDelete }) => {
  const taskProgress = getTaskProgress(task);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="opacity-50">
          <ProgressCircle progress={taskProgress} size={40} strokeWidth={4} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-300">{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:PRIORITIES[task.priority]+'22',color:PRIORITIES[task.priority]}}>{task.priority}</span>
            <span className="text-xs text-slate-500">{task.category}</span>
            {hasSubtasks && <span className="text-xs text-slate-500">{task.subtasks.length} subtasks</span>}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            <Icon name="Clock" size={12} className="inline mr-1"/>
            Deleted {formatDeletedTime(task.deletedAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700">
        <button onClick={onRestore} className="flex-1 py-2 rounded-lg bg-violet-600 text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-500">
          <Icon name="RotateCcw" size={16}/> Restore
        </button>
        <button onClick={onDelete} className="flex-1 py-2 rounded-lg bg-slate-700 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-600">
          <Icon name="X" size={16}/> Delete Forever
        </button>
      </div>
    </div>
  );
};

