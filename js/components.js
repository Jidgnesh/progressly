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
// THEME TOGGLE COMPONENT
// ============================================
const ThemeToggle = ({ preference, onToggle }) => {
  const [rotating, setRotating] = React.useState(false);

  const handleClick = () => {
    setRotating(true);
    onToggle();
    setTimeout(() => setRotating(false), 200);
  };

  const iconName = preference === 'light' ? 'Sun' : 'Moon';

  return (
    <button
      onClick={handleClick}
      className="pressable p-2 rounded-xl"
      style={{ color: 'var(--text-secondary)' }}
      aria-label={`Switch to ${preference === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className={`theme-icon inline-flex ${rotating ? 'theme-icon-rotate' : ''}`}>
        <Icon name={iconName} size={20} />
      </span>
    </button>
  );
};

// ============================================
// GOOGLE SIGN-IN BUTTON
// ============================================
const GoogleSignInButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="pressable w-full font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3"
    style={{ background: 'var(--divider)', border: '1px solid var(--border-card)', color: 'var(--text-primary)' }}
  >
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
    Continue with Google
  </button>
);

// ============================================
// TOAST COMPONENT
// ============================================
const Toast = ({ message, type = 'success', visible, onDismiss, action }) => {
  const [exiting, setExiting] = React.useState(false);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (!visible) return;
    setExiting(false);

    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(onDismiss, 200);
      }, 3000);
    };

    startTimer();

    const handleVisChange = () => {
      if (document.hidden) {
        clearTimeout(timerRef.current);
      } else {
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisChange);
    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, [visible, message]);

  if (!visible) return null;

  const accentColor = type === 'success' ? 'var(--priority-low)' : 'var(--priority-high)';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[360px] px-4`} role="alert" aria-live="polite">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${exiting ? 'toast-exit' : 'toast-enter'}`}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-elevated)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            width: 3,
            height: 24,
            borderRadius: 2,
            background: accentColor,
            flexShrink: 0,
          }}
        />
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
          {message}
        </span>
        {action && (
          <button
            onClick={action.onClick}
            className="pressable text-sm font-bold px-2 py-1 rounded-lg"
            style={{ color: 'var(--accent)' }}
          >
            {action.label}
          </button>
        )}
        <button
          onClick={() => { setExiting(true); setTimeout(onDismiss, 200); }}
          className="pressable p-1"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Dismiss notification"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
    </div>
  );
};

// ============================================
// PROGRESS CIRCLE COMPONENT
// ============================================
const ProgressCircle = ({ progress, size = 40, strokeWidth = 4, animate = false }) => {
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = radius * 2 * Math.PI;
  const fillLength = (progress / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" style={{ width: size, height: size }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--divider)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor(progress)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${fillLength} ${circumference}`}
          strokeLinecap="round"
          className={animate ? 'progress-ring-circle' : ''}
        />
      </svg>
    </div>
  );
};

// ============================================
// STATS SUMMARY COMPONENT
// ============================================
const StatsSummary = ({ totalCount, completedCount, streak, allTasks, expanded, onToggle }) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="pressable flex items-center gap-2 mx-auto text-xs font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        <Icon name="BarChart3" size={14} />
        <span className="uppercase tracking-wider">Stats</span>
        <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
      </button>

      <div className="expand-content" style={{ maxHeight: expanded ? '600px' : '0px', opacity: expanded ? 1 : 0 }}>
        <div className="pt-3 space-y-4">
          {/* Mini stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tasks', value: totalCount },
              { label: 'Done', value: completedCount },
              { label: 'Streak', value: `${streak}d` },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl p-3 text-center"
                style={{ background: 'var(--bg-card-60)', border: '1px solid var(--border-input)' }}>
                <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{card.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>By Category</h4>
            <div className="space-y-2">
              {Object.entries(getCategoryStats(allTasks)).map(([cat, stats]) => (
                stats.total > 0 && (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                        <div className="h-full rounded-full" style={{ width: `${stats.avgProgress}%`, background: getProgressColor(stats.avgProgress) }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{stats.avgProgress}%</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Monthly trends */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Monthly Trends</h4>
            <div className="flex items-end gap-1 h-16">
              {getMonthlyTrends(allTasks).map((trend) => (
                <div key={`${trend.month}-${trend.year}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{ height: `${Math.max(4, (trend.avgProgress / 100) * 48)}px`, background: trend.avgProgress > 0 ? 'var(--accent)' : 'var(--divider)', opacity: trend.avgProgress > 0 ? 0.7 : 0.3 }} />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{trend.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================
const DeleteConfirmModal = ({ task, onCancel, onConfirm }) => {
  if (!task) return null;
  const [exiting, setExiting] = React.useState(false);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleClose = (callback) => {
    setExiting(true);
    setTimeout(callback, 150);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => handleClose(onCancel)}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose(onCancel); }}>
      <div className={`${exiting ? 'modal-exit' : 'modal-enter'} rounded-2xl p-6 max-w-sm w-full`}
        role="dialog" aria-modal="true" aria-labelledby="delete-modal-title"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)', transformOrigin: 'center' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
          <Icon name="Trash2" size={32} color="var(--priority-high)" />
        </div>
        <h3 id="delete-modal-title" className="text-xl font-semibold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Delete Task?</h3>
        <p className="text-center mb-2" style={{ color: 'var(--text-secondary)' }}>"{task.title}"</p>
        {hasSubtasks && (
          <p className="text-sm text-center mb-4" style={{ color: '#f59e0b' }}>
            <Icon name="AlertTriangle" size={14} className="inline mr-1" />
            This will also delete {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
          </p>
        )}
        <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>You can restore this task from the trash later.</p>
        <div className="flex gap-3">
          <button onClick={() => handleClose(onCancel)} className="pressable flex-1 py-3 rounded-xl font-medium" style={{ background: 'var(--divider)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={() => handleClose(onConfirm)} className="pressable flex-1 py-3 rounded-xl font-medium text-white" style={{ background: 'var(--priority-high)' }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EDIT TASK MODAL
// ============================================
const EditTaskModal = ({ editForm, setEditForm, onSave, onCancel }) => {
  const [exiting, setExiting] = React.useState(false);

  const handleClose = (callback) => {
    setExiting(true);
    setTimeout(callback, 200);
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (editForm.title.trim()) handleClose(onSave);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => handleClose(onCancel)}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose(onCancel); }}>
      <div className={`${exiting ? 'drawer-exit' : 'drawer-enter'} w-full rounded-t-3xl max-h-[85vh] overflow-y-auto`}
        role="dialog" aria-modal="true" aria-labelledby="edit-modal-title"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.4 }} />
        </div>

        <div className="px-5 pb-5">
          {/* Title input — hero element, no border */}
          <input type="text" placeholder="Task name"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && editForm.title.trim()) handleSubmit(); }}
            className="w-full py-4 outline-none text-xl font-medium"
            style={{ background: 'transparent', color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
            autoFocus />

          {/* Compact options row */}
          <div className="flex items-center gap-2 flex-wrap mb-5" style={{ borderTop: '1px solid var(--border-card)', paddingTop: 12 }}>
            {/* Category chips */}
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setEditForm({ ...editForm, category: c })}
                className="pressable px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: editForm.category === c ? 'var(--accent)' : 'transparent',
                  color: editForm.category === c ? 'white' : 'var(--text-muted)',
                  border: editForm.category === c ? '1px solid transparent' : '1px solid var(--border-card)',
                }}>
                {c}
              </button>
            ))}

            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />

            {/* Priority — compact colored dots */}
            {Object.entries(PRIORITIES).map(([k, c]) => (
              <button key={k} onClick={() => setEditForm({ ...editForm, priority: k })}
                className="pressable flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={{
                  background: editForm.priority === k ? c + '20' : 'transparent',
                  color: editForm.priority === k ? c : 'var(--text-muted)',
                  border: editForm.priority === k ? `1px solid ${c}40` : '1px solid transparent',
                }}>
                <span className="w-2 h-2 rounded-full" style={{ background: c, opacity: editForm.priority === k ? 1 : 0.4 }} />
                {k}
              </button>
            ))}
          </div>

          {/* Due date — inline */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => {
                const picker = document.getElementById('edit-date-picker');
                if (picker) picker.showPicker ? picker.showPicker() : picker.click();
              }}
              className="pressable flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: editForm.dueDate ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                color: editForm.dueDate ? '#60a5fa' : 'var(--text-muted)',
                border: editForm.dueDate ? '1px solid rgba(96, 165, 250, 0.2)' : '1px solid var(--border-card)',
              }}>
              <Icon name="Calendar" size={14} />
              {editForm.dueDate ? formatDate(editForm.dueDate) : 'Add date'}
            </button>
            <input id="edit-date-picker" type="date"
              value={getDateInputValue(editForm.dueDate)}
              onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value || '' })}
              min={new Date().toISOString().split('T')[0]}
              className="sr-only" tabIndex={-1} />
            {editForm.dueDate && (
              <button onClick={() => setEditForm({ ...editForm, dueDate: '' })}
                className="pressable p-1 rounded-full" style={{ color: 'var(--text-muted)' }}>
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!editForm.title.trim()}
            className="pressable w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-30"
            style={{ background: 'var(--accent)' }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADD TASK MODAL
// ============================================
const AddTaskModal = ({ newTask, setNewTask, onAdd, onCancel }) => {
  const [exiting, setExiting] = React.useState(false);

  const handleClose = (callback) => {
    setExiting(true);
    setTimeout(callback, 200);
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (newTask.title.trim()) handleClose(onAdd);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => handleClose(onCancel)}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose(onCancel); }}>
      <div className={`${exiting ? 'drawer-exit' : 'drawer-enter'} w-full rounded-t-3xl max-h-[85vh] overflow-y-auto`}
        role="dialog" aria-modal="true" aria-labelledby="add-modal-title"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.4 }} />
        </div>

        <div className="px-5 pb-5">
          {/* Title input — hero element, no border, large */}
          <input type="text" placeholder="What's your task?"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && newTask.title.trim()) handleSubmit(); }}
            className="w-full py-4 outline-none text-xl font-medium"
            style={{ background: 'transparent', color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
            autoFocus />

          {/* Compact options row */}
          <div className="flex items-center gap-2 flex-wrap mb-5" style={{ borderTop: '1px solid var(--border-card)', paddingTop: 12 }}>
            {/* Category chips — smaller, pill-shaped */}
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setNewTask({ ...newTask, category: c })}
                className="pressable px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: newTask.category === c ? 'var(--accent)' : 'transparent',
                  color: newTask.category === c ? 'white' : 'var(--text-muted)',
                  border: newTask.category === c ? '1px solid transparent' : '1px solid var(--border-card)',
                }}>
                {c}
              </button>
            ))}

            {/* Divider dot */}
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />

            {/* Priority — compact colored dots with labels */}
            {Object.entries(PRIORITIES).map(([k, c]) => (
              <button key={k} onClick={() => setNewTask({ ...newTask, priority: k })}
                className="pressable flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={{
                  background: newTask.priority === k ? c + '20' : 'transparent',
                  color: newTask.priority === k ? c : 'var(--text-muted)',
                  border: newTask.priority === k ? `1px solid ${c}40` : '1px solid transparent',
                }}>
                <span className="w-2 h-2 rounded-full" style={{ background: c, opacity: newTask.priority === k ? 1 : 0.4 }} />
                {k}
              </button>
            ))}
          </div>

          {/* Due date — inline, not a full-width block */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => {
                const picker = document.getElementById('add-date-picker');
                if (picker) picker.showPicker ? picker.showPicker() : picker.click();
              }}
              className="pressable flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: newTask.dueDate ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                color: newTask.dueDate ? '#60a5fa' : 'var(--text-muted)',
                border: newTask.dueDate ? '1px solid rgba(96, 165, 250, 0.2)' : '1px solid var(--border-card)',
              }}>
              <Icon name="Calendar" size={14} />
              {newTask.dueDate ? formatDate(newTask.dueDate) : 'Add date'}
            </button>
            <input id="add-date-picker" type="date"
              value={getDateInputValue(newTask.dueDate)}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value || '' })}
              min={new Date().toISOString().split('T')[0]}
              className="sr-only" tabIndex={-1} />
            {newTask.dueDate && (
              <button onClick={() => setNewTask({ ...newTask, dueDate: '' })}
                className="pressable p-1 rounded-full" style={{ color: 'var(--text-muted)' }}>
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {/* Submit — clean, not oversized */}
          <button onClick={handleSubmit} disabled={!newTask.title.trim()}
            className="pressable w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-30"
            style={{ background: 'var(--accent)' }}>
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// BOTTOM NAVIGATION
// ============================================
const BottomNav = ({ currentPage, setCurrentPage, trashCount }) => {
  const tabs = [
    { id: 'home', icon: 'Home', label: 'Home' },
    { id: 'history', icon: 'History', label: 'History' },
    { id: 'trash', icon: 'Trash2', label: 'Trash' },
  ];

  const activeIndex = tabs.findIndex(t => t.id === currentPage);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      role="navigation"
      aria-label="Main navigation"
      style={{
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-card)',
      }}
    >
      <div className="relative flex justify-around items-center px-4 py-3">
        {/* Sliding pill indicator */}
        <div
          className="nav-pill absolute bottom-1 h-[3px] rounded-full"
          style={{
            width: 32,
            background: 'var(--accent)',
            left: `calc(${(activeIndex / tabs.length) * 100}% + ${100 / tabs.length / 2}% - 16px)`,
          }}
        />

        {tabs.map((tab) => {
          const isActive = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentPage(tab.id)}
              className="pressable relative flex flex-col items-center gap-1 p-2"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                ...(isActive ? { filter: 'drop-shadow(0 0 8px var(--accent-glow))' } : {}),
              }}
            >
              <Icon name={tab.icon} size={22} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.id === 'trash' && trashCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: 'var(--priority-high)' }}
                >
                  {trashCount > 9 ? '9+' : trashCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ============================================
// TASK ITEM COMPONENT
// ============================================
const TaskItem = ({
  task, isExpanded, expandedSubtask, addingSubtaskTo, newSubtask, setNewSubtask,
  onToggleExpand, onToggleSubtask, onEdit, onDelete, onUpdateProgress,
  onAddSubtask, onDeleteSubtask, onUpdateSubtaskProgress, onToggleAddSubtask, searchQuery, celebrating
}) => {
  const taskProgress = getTaskProgress(task);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const overdue = task.dueDate && isOverdue(task.dueDate) && taskProgress < 100;

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? React.createElement('mark', { key: i, style: { background: 'rgba(250, 204, 21, 0.3)', color: '#fde047', borderRadius: 2, padding: '0 2px' } }, part)
        : part
    );
  };

  const priorityColor = PRIORITIES[task.priority] || 'var(--text-muted)';

  return (
    <div
      className={`task-card rounded-2xl ${taskProgress === 100 ? 'opacity-60' : ''} ${celebrating ? 'celebration-glow' : ''}`}
      style={{
        '--priority-color': priorityColor,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        ...(overdue ? { boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)' } : {}),
      }}
    >
      <div className="pressable-card p-4 flex items-center gap-3 cursor-pointer" onClick={onToggleExpand} aria-expanded={isExpanded}>
        <ProgressCircle progress={taskProgress} size={36} strokeWidth={3} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-base ${taskProgress === 100 ? 'line-through' : ''} ${!isExpanded ? 'truncate' : ''}`}
            style={{ color: taskProgress === 100 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {searchQuery ? highlightText(task.title, searchQuery) : task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.category}</span>
            {task.dueDate && (
              <span className="text-xs flex items-center gap-1"
                style={{ color: overdue ? 'var(--priority-high)' : isDueToday(task.dueDate) ? '#f97316' : '#60a5fa' }}>
                <Icon name={overdue ? "AlertCircle" : "Calendar"} size={10} />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
        <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={18} color="var(--text-muted)" />
      </div>

      <div className="px-4 pb-2">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
          <div className="h-full rounded-full" style={{ width: `${taskProgress}%`, background: getProgressColor(taskProgress), transition: 'width 300ms var(--ease-out)' }} />
        </div>
      </div>

      {isExpanded && (
        <div className="task-detail-enter px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border-card)' }}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subtasks</span>
              <button onClick={onToggleAddSubtask} className="pressable text-xs px-3 py-1 rounded-lg flex items-center gap-1" style={{ background: 'var(--accent)', color: 'white' }}>
                <Icon name="Plus" size={14} /> Add
              </button>
            </div>

            {addingSubtaskTo === task.id && (
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="Subtask name..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddSubtask()}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  autoFocus />
                <button onClick={onAddSubtask} className="pressable px-4 rounded-lg text-sm text-white" style={{ background: 'var(--accent)' }}>Add</button>
              </div>
            )}

            {hasSubtasks ? (
              <div className="space-y-2">
                {task.subtasks.map(st => (
                  <div key={st.id} className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-input)' }}>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggleSubtask(st.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm truncate ${st.progress === 100 ? 'line-through' : ''}`}
                            style={{ color: st.progress === 100 ? 'var(--text-muted)' : 'var(--text-primary)' }}>{st.title}</span>
                          <span className="text-xs font-bold tabular-nums ml-2" style={{ color: getProgressColor(st.progress) }}>{st.progress}</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                          <div className="h-full rounded-full" style={{ width: `${st.progress}%`, background: getProgressColor(st.progress), transition: 'width 200ms var(--ease-out)' }} />
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteSubtask(st.id); }} className="pressable w-6 h-6 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                        <Icon name="Trash2" size={12} />
                      </button>
                    </div>
                    {expandedSubtask === st.id && (
                      <div className="flex items-center justify-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-card)' }}>
                        <button onClick={() => onUpdateSubtaskProgress(st.id, Math.max(0, st.progress - 10))} className="pressable w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--divider)' }}>
                          <Icon name="Minus" size={14} />
                        </button>
                        <input type="number" min="0" max="100" value={st.progress}
                          onChange={(e) => onUpdateSubtaskProgress(st.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-14 h-7 rounded text-center text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          style={{ background: 'var(--divider)', color: getProgressColor(st.progress) }} />
                        <button onClick={() => onUpdateSubtaskProgress(st.id, Math.min(100, st.progress + 10))} className="pressable w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--divider)' }}>
                          <Icon name="Plus" size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>No subtasks yet</p>
            )}
          </div>

          {!hasSubtasks && (
            <div>
              <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Manual Progress</div>
              <div className="flex gap-2 mb-3">
                {[0, 25, 50, 75, 100].map(v => (
                  <button key={v} onClick={() => onUpdateProgress(v)} className="pressable flex-1 py-2 rounded-lg text-sm font-medium"
                    style={{ background: task.progress === v ? getProgressColor(v) : 'var(--divider)', color: task.progress === v ? 'white' : 'var(--text-secondary)',
                      ...(task.progress === v ? { boxShadow: '0 0 0 2px var(--accent)' } : {}) }}>
                    {v}%
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => onUpdateProgress(task.progress - 5)} className="pressable w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--divider)' }}>
                  <Icon name="Minus" size={18} />
                </button>
                <input type="range" min="0" max="100" value={task.progress} onChange={(e) => onUpdateProgress(parseInt(e.target.value))} className="flex-1 h-2 rounded-lg appearance-none cursor-pointer" />
                <button onClick={() => onUpdateProgress(task.progress + 5)} className="pressable w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--divider)' }}>
                  <Icon name="Plus" size={18} />
                </button>
              </div>
            </div>
          )}

          {hasSubtasks && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>Progress auto-calculated from subtasks</p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// SWIPEABLE TASK ITEM WRAPPER
// ============================================
const SwipeableTaskItem = ({ task, onComplete, onSwipeDelete, onLongPressEdit, ...taskProps }) => {
  const swipe = useSwipe(
    () => onComplete(task.id),
    () => onSwipeDelete(task.id),
    () => onLongPressEdit(task.id)
  );

  return (
    <div ref={swipe.ref} className="swipe-card rounded-2xl">
      {swipe.offset > 0 && (
        <div className="swipe-bg swipe-bg-right rounded-2xl">
          <Icon name="Check" size={24} color="var(--priority-low)" />
        </div>
      )}
      {swipe.offset < 0 && (
        <div className="swipe-bg swipe-bg-left rounded-2xl">
          <Icon name="Trash2" size={24} color="var(--priority-high)" />
        </div>
      )}
      <div
        className={`swipe-card-content rounded-2xl ${swipe.releasing ? 'releasing' : ''}`}
        style={{ transform: `translateX(${swipe.offset}px)` }}
        onPointerDown={swipe.handlePointerDown}
        onPointerMove={swipe.handlePointerMove}
        onPointerUp={swipe.handlePointerUp}
      >
        <TaskItem task={task} {...taskProps} />
      </div>
    </div>
  );
};

// ============================================
// TRASH ITEM COMPONENT
// ============================================
const TrashItem = ({ task, onRestore, onDelete }) => {
  const taskProgress = getTaskProgress(task);
  const priorityColor = PRIORITIES[task.priority] || 'var(--text-muted)';

  return (
    <div className="task-card rounded-2xl p-4"
      style={{ '--priority-color': priorityColor, background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
      <div className="flex items-start gap-3">
        <div className="opacity-50">
          <ProgressCircle progress={taskProgress} size={36} strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.category}</span>
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Icon name="Clock" size={12} />
            Deleted {formatDeletedTime(task.deletedAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-card)' }}>
        <button onClick={onRestore} className="pressable flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white" style={{ background: 'var(--accent)' }}>
          <Icon name="RotateCcw" size={16} /> Restore
        </button>
        <button onClick={onDelete} className="pressable flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ background: 'var(--divider)', color: 'var(--text-primary)' }}>
          <Icon name="X" size={16} /> Delete Forever
        </button>
      </div>
    </div>
  );
};

