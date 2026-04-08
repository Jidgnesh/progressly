// ============================================
// USE SWIPE HOOK
// ============================================
const useSwipe = (onSwipeRight, onSwipeLeft, onLongPress, threshold = 0.4) => {
  const ref = React.useRef(null);
  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const startTime = React.useRef(0);
  const isDragging = React.useRef(false);
  const direction = React.useRef(null);
  const longPressTimer = React.useRef(null);
  const [offset, setOffset] = React.useState(0);
  const [releasing, setReleasing] = React.useState(false);

  const handlePointerDown = (e) => {
    if (isDragging.current) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = Date.now();
    direction.current = null;
    isDragging.current = false;
    setReleasing(false);

    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current && direction.current !== 'horizontal') {
        if (navigator.vibrate) navigator.vibrate(10);
        onLongPress && onLongPress();
      }
    }, 500);
  };

  const handlePointerMove = (e) => {
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!direction.current) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      direction.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      if (direction.current === 'horizontal') {
        e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
        isDragging.current = true;
        clearTimeout(longPressTimer.current);
      } else {
        clearTimeout(longPressTimer.current);
      }
    }

    if (direction.current !== 'horizontal') return;
    e.preventDefault();
    setOffset(dx);
  };

  const handlePointerUp = (e) => {
    clearTimeout(longPressTimer.current);

    if (!isDragging.current) return;
    isDragging.current = false;

    const dx = e.clientX - startX.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(dx) / elapsed;
    const cardWidth = ref.current?.offsetWidth || 300;
    const percent = Math.abs(dx) / cardWidth;

    if ((velocity > 0.11 || percent > threshold) && dx > 0) {
      onSwipeRight && onSwipeRight();
    } else if ((velocity > 0.11 || percent > threshold) && dx < 0) {
      onSwipeLeft && onSwipeLeft();
    }

    setReleasing(true);
    setOffset(0);
    setTimeout(() => setReleasing(false), 200);
  };

  return { ref, offset, releasing, handlePointerDown, handlePointerMove, handlePointerUp };
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
    const { useState, useEffect } = React;
    const today = new Date();

    // ==================== STATE ====================
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authPage, setAuthPage] = useState('signin'); // 'signin', 'signup', 'forgot'
    const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', confirmPassword: '' });
    const [authError, setAuthError] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetPassword, setResetPassword] = useState({ newPassword: '', confirmPassword: '' });
    const [forgotStep, setForgotStep] = useState('email'); // 'email', 'reset'
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
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [useFirebase, setUseFirebase] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showPassword, setShowPassword] = useState({
      password: false,
      confirmPassword: false,
      newPassword: false,
      confirmNewPassword: false
    });

    // Toast state (replaces successMessage)
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
    const [pendingComplete, setPendingComplete] = useState(null);

    // Theme state
    const [themePreference, setThemePreference] = useState(() => initTheme());
    const [showStats, setShowStats] = useState(false);

    // Help overlay state
    const [showHelp, setShowHelp] = useState(false);

    // Quick-add state
    const [quickAddTitle, setQuickAddTitle] = useState('');

    // Swipe hint state
    const [showSwipeHint, setShowSwipeHint] = useState(() => !localStorage.getItem(SWIPE_HINT_KEY));

    const dismissSwipeHint = () => {
      setShowSwipeHint(false);
      localStorage.setItem(SWIPE_HINT_KEY, 'true');
    };

    // Celebration state
    const [celebratingTask, setCelebratingTask] = useState(null);

    // Auth submitting state (double-submit protection)
    const [authSubmitting, setAuthSubmitting] = useState(false);

    // Toast functions
    const showToast = (message, type = 'success') => {
      setToast({ message, type, visible: true });
    };
    const dismissToast = () => {
      setToast(prev => ({ ...prev, visible: false }));
    };

    const undoComplete = () => {
      if (pendingComplete) {
        updateProgress(pendingComplete.id, pendingComplete.prevProgress);
        setPendingComplete(null);
        dismissToast();
      }
    };

    // Theme toggle handler
    const handleThemeToggle = () => {
      const next = cycleThemePreference(themePreference);
      setThemePreference(next);
      localStorage.setItem(THEME_KEY, next);
      document.body.classList.add('theme-transitioning');
      applyTheme(next);
      setTimeout(() => document.body.classList.remove('theme-transitioning'), 300);
    };

    // System theme change listener
    useEffect(() => {
      if (themePreference !== 'system') return;
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, [themePreference]);

    // Keyboard shortcuts (home page only, not when typing or modal open)
    useEffect(() => {
      const handleKeyDown = (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        if (!isAuthenticated || currentPage !== 'home') return;
        if (showAdd || editingTask || deleteConfirm || showHelp) return;

        switch (e.key) {
          case 'n':
            e.preventDefault();
            setShowAdd(true);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            changeMonth(-1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            changeMonth(1);
            break;
          case '1':
            setFilter('all');
            break;
          case '2':
            setFilter('pending');
            break;
          case '3':
            setFilter('inprogress');
            break;
          case '4':
            setFilter('completed');
            break;
          case '/':
            e.preventDefault();
            setSearchQuery(searchQuery ? '' : ' ');
            break;
          case '?':
            e.preventDefault();
            setShowHelp(true);
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAuthenticated, currentPage, showAdd, editingTask, deleteConfirm, showHelp, searchQuery]);

    // Auto-complete email with @gmail.com if no @ present
    const completeEmail = (email) => {
      const trimmed = email.trim();
      if (trimmed && !trimmed.includes('@')) {
        return trimmed + '@gmail.com';
      }
      return trimmed;
    };

    // Check if Firebase is available
    const isFirebaseAvailable = () => {
      try {
        const isAvailable = typeof firebase !== 'undefined' &&
                           firebase.apps &&
                           firebase.apps.length > 0 &&
                           typeof FIREBASE_CONFIG !== 'undefined' &&
                           FIREBASE_CONFIG &&
                           FIREBASE_CONFIG.apiKey &&
                           FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

        if (!isAvailable) {
          console.log('Firebase not available:', {
            firebaseDefined: typeof firebase !== 'undefined',
            appsLength: firebase?.apps?.length || 0,
            configDefined: typeof FIREBASE_CONFIG !== 'undefined',
            apiKey: FIREBASE_CONFIG?.apiKey ? 'present' : 'missing'
          });
        }

        return isAvailable;
      } catch (error) {
        console.error('Error checking Firebase availability:', error);
        return false;
      }
    };

    // ==================== AUTHENTICATION FUNCTIONS ====================
    const checkAuth = async () => {
      // Check Firebase first if available
      if (isFirebaseAvailable()) {
        // Handle Google redirect result (when signInWithRedirect was used)
        try {
          const redirectResult = await firebase.auth().getRedirectResult();
          if (redirectResult && redirectResult.user) {
            const rUser = redirectResult.user;
            // Create Firestore doc if needed
            try {
              await FirebaseService.ensureOnline();
              const userRef = firebase.firestore().collection('users').doc(rUser.uid);
              const userDoc = await userRef.get();
              if (!userDoc.exists) {
                await userRef.set({
                  name: rUser.displayName,
                  email: rUser.email,
                  picture: rUser.photoURL,
                  provider: 'google',
                  createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
              }
            } catch (e) {
              console.warn('Could not create user doc after redirect:', e.message);
            }
          }
        } catch (redirectErr) {
          console.warn('getRedirectResult error:', redirectErr.message);
        }

        const user = FirebaseService.getCurrentUser();
        if (user) {
          let userName = user.displayName || 'User';
          try {
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            if (userData?.name) userName = userData.name;
          } catch (err) {
            // Firestore offline or unavailable — fall back to displayName from Auth
            console.warn('Could not fetch user document, using auth profile:', err.message);
          }
          const userInfo = { uid: user.uid, email: user.email, name: userName };
          setCurrentUser(userInfo);
          setIsAuthenticated(true);
          setUseFirebase(true);
          return { authenticated: true, user: userInfo, isFirebase: true };
        }
      }

      // Fallback to localStorage
      const auth = localStorage.getItem(AUTH_KEY);
      if (auth) {
        setIsAuthenticated(true);
        setUseFirebase(false);
        return { authenticated: true, user: null, isFirebase: false };
      }
      return { authenticated: false, user: null, isFirebase: false };
    };

    const handleSignUp = async (e) => {
      e.preventDefault();
      if (authSubmitting) return;
      setAuthSubmitting(true);
      setAuthError('');
      const completedEmail = completeEmail(authForm.email);
      setAuthForm(prev => ({...prev, email: completedEmail}));

      if (!authForm.name || !completedEmail || !authForm.password) {
        setAuthError('All fields are required');
        setAuthSubmitting(false);
        return;
      }

      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('Passwords do not match');
        setAuthSubmitting(false);
        return;
      }

      if (authForm.password.length < 6) {
        setAuthError('Password must be at least 6 characters');
        setAuthSubmitting(false);
        return;
      }

      try {
        // Try Firebase first if available
        if (isFirebaseAvailable()) {
          const result = await FirebaseService.signUp(completedEmail, authForm.password, authForm.name);
          if (result.success) {
            setCurrentUser(result.user);
            setIsAuthenticated(true);
            setUseFirebase(true);
            setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });

            // Migrate localStorage tasks to Firebase if any exist
            const localTasks = localStorage.getItem(STORAGE_KEY);
            if (localTasks) {
              const tasks = JSON.parse(localTasks);
              await FirebaseService.saveTasks(result.user.uid, tasks);
            }
            return;
          } else {
            // Firebase sign-up failed - show the error from Firebase
            setAuthError(result.error || 'Sign up failed');
            return;
          }
        }

        // Fallback to localStorage (only if Firebase is not available)
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        if (users.find(u => u.email === completedEmail)) {
          setAuthError('Email already exists in local storage. Please use Firebase sign-up or use a different email.');
          return;
        }

        const hashedPw = await hashPassword(authForm.password);
        const newUser = {
          id: Date.now(),
          name: authForm.name,
          email: completedEmail,
          password: hashedPw,
          createdAt: Date.now()
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email: completedEmail, name: authForm.name }));
        setIsAuthenticated(true);
        setUseFirebase(false);
        setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
      } finally {
        setAuthSubmitting(false);
      }
    };

    const handleSignIn = async (e) => {
      e.preventDefault();
      if (authSubmitting) return;
      setAuthSubmitting(true);
      setAuthError('');
      const completedEmail = completeEmail(authForm.email);
      setAuthForm(prev => ({...prev, email: completedEmail}));

      if (!completedEmail || !authForm.password) {
        setAuthError('Email and password are required');
        setAuthSubmitting(false);
        return;
      }

      try {
        // Try Firebase first if available
        if (isFirebaseAvailable()) {
          const result = await FirebaseService.signIn(completedEmail, authForm.password);
          if (result.success) {
            setCurrentUser(result.user);
            setIsAuthenticated(true);
            setUseFirebase(true);
            setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
            return;
          } else {
            setAuthError(result.error || 'Invalid email or password');
            return;
          }
        }

        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const hashedPw = await hashPassword(authForm.password);
        const user = users.find(u => u.email === completedEmail && u.password === hashedPw);

        if (!user) {
          setAuthError('Invalid email or password');
          return;
        }

        localStorage.setItem(AUTH_KEY, JSON.stringify({ email: user.email, name: user.name }));
        setIsAuthenticated(true);
        setUseFirebase(false);
        setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
      } finally {
        setAuthSubmitting(false);
      }
    };

    const [resetEmailSent, setResetEmailSent] = useState(false);

    const handleForgotPassword = async (e) => {
      e.preventDefault();
      setAuthError('');
      const completedForgotEmail = completeEmail(forgotEmail);
      setForgotEmail(completedForgotEmail);

      if (!completedForgotEmail) {
        setAuthError('Please enter your email address');
        return;
      }

      // Try Firebase first if available
      if (isFirebaseAvailable()) {
        const result = await FirebaseService.resetPassword(completedForgotEmail);
        if (result.success) {
          setAuthError('');
          setResetEmailSent(true);
          return;
        } else {
          let errorMessage = result.error;
          if (result.error && result.error.includes('user-not-found')) {
            errorMessage = 'No account found with this email address.';
          }
          setAuthError(errorMessage || 'Failed to send reset email');
          return;
        }
      }

      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const user = users.find(u => u.email === completedForgotEmail);

      if (!user) {
        setAuthError('No account found with this email address');
        return;
      }

      // Move to reset password step (localStorage only)
      setForgotStep('reset');
      setAuthError('');
    };

    const handleResetPassword = async (e) => {
      e.preventDefault();
      setAuthError('');

      if (!resetPassword.newPassword || !resetPassword.confirmPassword) {
        setAuthError('Please fill in all fields');
        return;
      }

      if (resetPassword.newPassword.length < 6) {
        setAuthError('Password must be at least 6 characters');
        return;
      }

      if (resetPassword.newPassword !== resetPassword.confirmPassword) {
        setAuthError('Passwords do not match');
        return;
      }

      // localStorage password reset
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const userIndex = users.findIndex(u => u.email === forgotEmail);

      if (userIndex === -1) {
        setAuthError('User not found');
        return;
      }

      // Update password (hashed)
      users[userIndex].password = await hashPassword(resetPassword.newPassword);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Show success message and redirect to sign in
      setAuthError('');
      setAuthPage('signin');
      setForgotEmail('');
      setResetPassword({ newPassword: '', confirmPassword: '' });
      setForgotStep('email');

      showToast('Password reset successfully! You can now sign in with your new password.');
    };

    const handleGoogleSignIn = async () => {
      setAuthError('');
      if (!isFirebaseAvailable()) {
        setAuthError('Google Sign-In requires Firebase. Please use email instead.');
        return;
      }
      const result = await FirebaseService.signInWithGoogle();
      if (result.success && result.redirect) {
        // Page will reload after redirect — nothing more to do
        return;
      }
      if (result.success) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        setUseFirebase(true);
        setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        let errorMessage = result.error;
        if (result.error && result.error.includes('popup-closed-by-user')) {
          errorMessage = 'Sign-in cancelled. Please try again.';
        } else if (result.error && result.error.includes('popup-blocked')) {
          errorMessage = 'Pop-up blocked by browser. Please allow pop-ups and try again.';
        }
        setAuthError(errorMessage || 'Google Sign-In failed');
      }
    };

    const handleLogout = async () => {
      if (useFirebase && isFirebaseAvailable()) {
        await FirebaseService.signOut();
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
      setCurrentUser(null);
      setIsAuthenticated(false);
      setUseFirebase(false);
      setAuthPage('signin');
    };

    // ==================== EFFECTS ====================
    useEffect(() => {
      const loadData = async () => {
        try {
          const authResult = await checkAuth();
          if (authResult.authenticated) {
            if (authResult.isFirebase && authResult.user) {
              // Load from Firebase
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
                FirebaseService.subscribeToTasks(authResult.user.uid, (tasks) => {
                  let loadedTasks = tasks || [];
                  loadedTasks = migrateIncompleteTasks(loadedTasks, today);
                  setTasks(loadedTasks);
                });
              } catch (error) {
                console.error('Error loading from Firebase:', error);
                // Fallback to localStorage if Firebase fails
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                  let loadedTasks = JSON.parse(saved);
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
          }
        } catch (error) {
          console.error('Error in loadData:', error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [isAuthenticated]);

    // Listen for Firebase auth state changes (session expiry, sign-out from another tab)
    useEffect(() => {
      if (!isFirebaseAvailable()) return;

      const unsubscribe = FirebaseService.onAuthStateChanged(async (user) => {
        if (!user) {
          // User signed out (possibly from another tab or session expired)
          setCurrentUser(null);
          setIsAuthenticated(false);
          setUseFirebase(false);
          setAuthPage('signin');
        }
      });

      return () => unsubscribe();
    }, []);

    // ==================== STORAGE FUNCTIONS ====================
    const saveTasks = async (newTasks) => {
      setTasks(newTasks);
      if (useFirebase && currentUser && isFirebaseAvailable()) {
        setSyncing(true);
        const result = await FirebaseService.saveTasks(currentUser.uid, newTasks);
        setSyncing(false);
        if (!result.success) {
          showToast('Failed to sync — changes saved locally', 'error');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      }
    };

    const saveTrash = async (newTrash) => {
      setTrash(newTrash);
      if (useFirebase && currentUser && isFirebaseAvailable()) {
        const result = await FirebaseService.saveTrash(currentUser.uid, newTrash);
        if (!result.success) {
          showToast('Failed to sync trash — changes saved locally', 'error');
          localStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));
        }
      } else {
        localStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));
      }
    };

    // ==================== UI FUNCTIONS ====================
    const closeAll = () => {
      setExpandedTask(null);
      setExpandedSubtask(null);
      setAddingSubtaskTo(null);
      setShowFilterDropdown(false);
    };

    const changeMonth = (delta) => {
      let m = currentMonth + delta, y = currentYear;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      setCurrentMonth(m);
      setCurrentYear(y);
    };

    // ==================== TASK OPERATIONS ====================
    const quickAddTask = () => {
      if (!quickAddTitle.trim()) return;
      const task = {
        id: Date.now(),
        title: quickAddTitle.trim(),
        priority: 'medium',
        category: 'Personal',
        month: currentMonth,
        year: currentYear,
        progress: 0,
        subtasks: [],
        dueDate: null
      };
      saveTasks([...tasks, task]);
      setQuickAddTitle('');
      showToast('Task added');
    };

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
      const clamped = Math.min(100, Math.max(0, progress));
      const prevTask = tasks.find(t => t.id === id);
      const wasComplete = prevTask && getTaskProgress(prevTask) === 100;

      saveTasks(tasks.map(t => t.id === id ? { ...t, progress: clamped } : t));

      if (clamped === 100 && !wasComplete) {
        setCelebratingTask(id);
        setTimeout(() => setCelebratingTask(null), 600);
      }
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

    const filteredTasks = (searchQuery ? searchedTasks : monthTasks).filter(t => {
      const p = getTaskProgress(t);
      if (filter === 'pending') return p < 100;
      if (filter === 'completed') return p === 100;
      if (filter === 'inprogress') return p > 0 && p < 100;
      if (filter === 'overdue') return t.dueDate && isOverdue(t.dueDate) && p < 100;
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
    const taskToDelete = tasks.find(t => t.id === deleteConfirm);

    // ==================== LOADING ====================
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>Loading...</div>;
    }

    // ==================== AUTHENTICATION PAGES ====================
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
          <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Progressly</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Keep moving forward!</p>
            </div>

            {/* Auth Form Card */}
            <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
              {/* Tabs - Hide on forgot password page */}
              {authPage !== 'forgot' && (
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => { setAuthPage('signin'); setAuthError(''); }}
                    className="pressable flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                    style={authPage === 'signin' ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--divider)', color: 'var(--text-secondary)' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthPage('signup'); setAuthError(''); }}
                    className="pressable flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                    style={authPage === 'signup' ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--divider)', color: 'var(--text-secondary)' }}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Forgot Password Header */}
              {authPage === 'forgot' && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Reset Password</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enter your email to reset your password</p>
                </div>
              )}

              {/* Error Message */}
              {authError && (
                <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--priority-high)' }}>
                  {authError}
                </div>
              )}

              {/* Sign Up Form */}
              {authPage === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Name</label>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      className="w-full rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="email"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                        onBlur={() => setAuthForm({...authForm, email: completeEmail(authForm.email)})}
                        className="w-full rounded-xl px-4 py-3 pr-28 outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        placeholder="Enter your email or username"
                        required
                      />
                      {!authForm.email.includes('@') && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                          @gmail.com
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.password ? 'text' : 'password'}
                        value={authForm.password}
                        onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                        className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        placeholder="Create a password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({...showPassword, password: !showPassword.password})}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Icon name={showPassword.password ? 'Eye' : 'EyeOff'} size={20} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.confirmPassword ? 'text' : 'password'}
                        value={authForm.confirmPassword}
                        onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                        className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({...showPassword, confirmPassword: !showPassword.confirmPassword})}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Icon name={showPassword.confirmPassword ? 'Eye' : 'EyeOff'} size={20} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="pressable w-full text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60"
                    style={{ background: 'var(--accent)' }}
                  >
                    {authSubmitting ? 'Signing Up...' : 'Sign Up'}
                  </button>
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px" style={{ background: 'var(--divider)' }}></div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--divider)' }}></div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authSubmitting}
                    className="pressable w-full font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-60"
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
                </form>
              )}

              {/* Sign In Form */}
              {authPage === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="email"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                        onBlur={() => setAuthForm({...authForm, email: completeEmail(authForm.email)})}
                        className="w-full rounded-xl px-4 py-3 pr-28 outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        placeholder="Enter your email or username"
                        required
                      />
                      {!authForm.email.includes('@') && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                          @gmail.com
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.password ? 'text' : 'password'}
                        value={authForm.password}
                        onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                        className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({...showPassword, password: !showPassword.password})}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Icon name={showPassword.password ? 'Eye' : 'EyeOff'} size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthPage('forgot');
                        setAuthError('');
                        setForgotEmail('');
                        setForgotStep('email');
                        setResetPassword({ newPassword: '', confirmPassword: '' });
                        setResetEmailSent(false);
                      }}
                      className="pressable text-sm"
                      style={{ color: 'var(--accent)' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="pressable w-full text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60"
                    style={{ background: 'var(--accent)' }}
                  >
                    {authSubmitting ? 'Signing In...' : 'Sign In'}
                  </button>
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px" style={{ background: 'var(--divider)' }}></div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--divider)' }}></div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authSubmitting}
                    className="pressable w-full font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-60"
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
                </form>
              )}

              {/* Forgot Password Form */}
              {authPage === 'forgot' && (
                <>
                  {resetEmailSent ? (
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                        <Icon name="MailCheck" size={32} color="var(--priority-low)" />
                      </div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Check your inbox</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        We've sent a password reset link to <span className="font-medium" style={{ color: 'var(--accent)' }}>{forgotEmail}</span>. Follow the instructions in the email to reset your password.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setAuthPage('signin'); setAuthError(''); setForgotEmail(''); setResetEmailSent(false); }}
                        className="pressable w-full text-white font-bold py-3 rounded-xl transition-all"
                        style={{ background: 'var(--accent)' }}
                      >
                        Back to Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setResetEmailSent(false); }}
                        className="pressable w-full text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Didn't receive it? Try again
                      </button>
                    </div>
                  ) : forgotStep === 'email' ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="mb-4">
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Enter your email address and we'll help you reset your password.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            onBlur={() => setForgotEmail(completeEmail(forgotEmail))}
                            className="w-full rounded-xl px-4 py-3 pr-28 outline-none focus:ring-2 focus:ring-violet-500"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                            placeholder="Enter your email or username"
                            required
                            autoFocus
                          />
                          {!forgotEmail.includes('@') && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                              @gmail.com
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="pressable w-full text-white font-bold py-3 rounded-xl transition-all"
                        style={{ background: 'var(--accent)' }}
                      >
                        Continue
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthPage('signin'); setAuthError(''); setForgotEmail(''); setResetEmailSent(false); }}
                        className="pressable w-full text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Back to Sign In
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="mb-4">
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Reset password for: <span className="font-medium" style={{ color: 'var(--accent)' }}>{forgotEmail}</span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.newPassword ? 'text' : 'password'}
                            value={resetPassword.newPassword}
                            onChange={(e) => setResetPassword({...resetPassword, newPassword: e.target.value})}
                            className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                            placeholder="Enter new password"
                            required
                            minLength={6}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({...showPassword, newPassword: !showPassword.newPassword})}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Icon name={showPassword.newPassword ? 'Eye' : 'EyeOff'} size={20} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.confirmNewPassword ? 'text' : 'password'}
                            value={resetPassword.confirmPassword}
                            onChange={(e) => setResetPassword({...resetPassword, confirmPassword: e.target.value})}
                            className="w-full rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({...showPassword, confirmNewPassword: !showPassword.confirmNewPassword})}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Icon name={showPassword.confirmNewPassword ? 'Eye' : 'EyeOff'} size={20} />
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="pressable w-full text-white font-bold py-3 rounded-xl transition-all"
                        style={{ background: 'var(--accent)' }}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={() => { setForgotStep('email'); setResetPassword({ newPassword: '', confirmPassword: '' }); }}
                        className="pressable w-full text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Back
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* Footer Links */}
              {authPage !== 'forgot' && (
                <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {authPage === 'signup' ? (
                    <p>
                      Already have an account?{' '}
                      <button onClick={() => { setAuthPage('signin'); setAuthError(''); }} className="pressable" style={{ color: 'var(--accent)' }}>
                        Sign In
                      </button>
                    </p>
                  ) : (
                    <p>
                      Don't have an account?{' '}
                      <button onClick={() => { setAuthPage('signup'); setAuthError(''); }} className="pressable" style={{ color: 'var(--accent)' }}>
                        Sign Up
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ==================== TRASH PAGE ====================
    if (currentPage === 'trash') {
      return (
        <div key="trash" className="page-content min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
          <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />

          <div className="px-4 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Trash2" size={24} color="var(--priority-high)" />
                  <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Trash</h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{trash.length} deleted task{trash.length !== 1 ? 's' : ''}</p>
              </div>
              {trash.length > 0 && (
                <div className="relative">
                  <button
                    className="hold-delete-btn pressable relative overflow-hidden px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--divider)', color: 'var(--text-primary)' }}
                    onPointerUp={(e) => {
                      const start = parseInt(e.currentTarget.dataset.pressStart || '0');
                      if (Date.now() - start > 1900) emptyTrash();
                    }}
                    onPointerDown={(e) => {
                      e.currentTarget.dataset.pressStart = Date.now();
                    }}
                  >
                    <div className="hold-delete-overlay" />
                    <span className="relative z-10">Hold 2s to empty all</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-4">
            {trash.length === 0 ? (
              <div className="empty-state-enter text-center py-16">
                <Icon name="Trash2" size={64} className="mx-auto opacity-20" color="var(--text-muted)" />
                <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>Trash is empty</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Deleted tasks will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trash.map(task => (
                  <TrashItem key={task.id} task={task} onRestore={() => restoreFromTrash(task.id)} onDelete={() => permanentDelete(task.id)} />
                ))}
              </div>
            )}
          </div>

          <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trash.length} />
        </div>
      );
    }

    // ==================== HISTORY PAGE ====================
    if (currentPage === 'history') {
      return (
        <div key="history" className="page-content min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
          <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />

          <div className="px-4 pt-6 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="History" size={24} color="var(--accent)" />
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>History</h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>All your tasks across months</p>
          </div>

          <div className="px-4 space-y-6">
            {monthsWithTasks.length === 0 ? (
              <div className="empty-state-enter text-center py-16">
                <Icon name="History" size={64} className="mx-auto opacity-20" color="var(--text-muted)" />
                <p className="mt-4 text-lg font-medium" style={{ color: 'var(--text-muted)' }}>No history yet</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Completed months will appear here</p>
              </div>
            ) : (
              monthsWithTasks.map((monthData, gi) => {
                const stats = getMonthStats(monthData.tasks);
                return (
                  <div key={`${monthData.year}-${monthData.month}`} className="stagger-item" style={{ animationDelay: `${gi * 80}ms` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <ProgressCircle progress={stats.avgProgress} size={24} strokeWidth={3} />
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {MONTHS_FULL[monthData.month]} {monthData.year}
                      </h3>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {stats.completed}/{stats.total} done
                      </span>
                    </div>
                    <div className="space-y-2">
                      {monthData.tasks.map((task, ti) => (
                        <div key={task.id} className="stagger-item" style={{ animationDelay: `${gi * 80 + ti * 40}ms` }}>
                          <SwipeableTaskItem
                            task={task}
                            onComplete={(id) => updateProgress(id, 100)}
                            onSwipeDelete={(id) => setDeleteConfirm(id)}
                            onLongPressEdit={(id) => { const t = tasks.find(x => x.id === id); if (t) openEditModal(t); }}
                            celebrating={celebratingTask === task.id}
                            isExpanded={expandedTask === task.id}
                            expandedSubtask={expandedSubtask}
                            addingSubtaskTo={addingSubtaskTo}
                            newSubtask={newSubtask}
                            setNewSubtask={setNewSubtask}
                            onToggleExpand={() => { setExpandedTask(expandedTask === task.id ? null : task.id); setExpandedSubtask(null); }}
                            onToggleSubtask={(stId) => setExpandedSubtask(expandedSubtask === stId ? null : stId)}
                            onEdit={() => openEditModal(task)}
                            onDelete={() => setDeleteConfirm(task.id)}
                            onUpdateProgress={(p) => updateProgress(task.id, p)}
                            onAddSubtask={() => addSubtask(task.id)}
                            onDeleteSubtask={(stId) => deleteSubtask(task.id, stId)}
                            onUpdateSubtaskProgress={(stId, p) => updateSubtaskProgress(task.id, stId, p)}
                            onToggleAddSubtask={() => setAddingSubtaskTo(addingSubtaskTo === task.id ? null : task.id)}
                            searchQuery=""
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modals for history page editing */}
          {editingTask && <EditTaskModal editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={() => setEditingTask(null)} />}
          {deleteConfirm && <DeleteConfirmModal task={taskToDelete} onCancel={() => setDeleteConfirm(null)} onConfirm={() => moveToTrash(deleteConfirm)} />}

          <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trash.length} />
        </div>
      );
    }

    // ==================== HOME PAGE ====================
    return (
      <div key="home" className="page-content min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onDismiss={() => { dismissToast(); setPendingComplete(null); }}
          action={pendingComplete ? { label: 'Undo', onClick: undoComplete } : null}
        />

        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {getGreeting(currentUser?.name || 'User')}
            </h1>
            <div className="flex items-center gap-1">
              <ThemeToggle preference={themePreference} onToggle={handleThemeToggle} />
              {syncing && <Icon name="RefreshCw" size={16} color="var(--accent)" className="animate-spin" />}
              <button onClick={handleLogout} className="pressable p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
                <Icon name="LogOut" size={20} />
              </button>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{getFormattedDate()}</p>
        </div>

        {/* Month Navigation — with inline progress */}
        <div className="flex items-center justify-center gap-3 px-4 mb-3">
          <button onClick={() => changeMonth(-1)} className="pressable-sm p-2" style={{ color: 'var(--text-secondary)' }}>
            <Icon name="ChevronLeft" size={20} />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {MONTHS_FULL[currentMonth]} {currentYear}
            </h2>
            <span className="text-sm font-bold tabular-nums" style={{ color: getProgressColor(avgProgress) }}>
              {avgProgress}%
            </span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {completedCount}/{totalCount}
            </span>
          </div>
          <button onClick={() => changeMonth(1)} className="pressable-sm p-2" style={{ color: 'var(--text-secondary)' }}>
            <Icon name="ChevronRight" size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="px-4 mb-3">
          <StatsSummary
            totalCount={totalCount}
            completedCount={completedCount}
            streak={getCompletionStreak(tasks)}
            allTasks={monthTasks}
            expanded={showStats}
            onToggle={() => setShowStats(!showStats)}
          />
        </div>

        {/* Filter Bar */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Task filters">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'To Do' },
                { id: 'inprogress', label: 'In Progress' },
                { id: 'completed', label: 'Done' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  role="tab"
                  aria-selected={filter === f.id}
                  className="pressable filter-pill px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                  style={{
                    background: filter === f.id ? 'var(--accent)' : 'var(--bg-card)',
                    color: filter === f.id ? 'white' : 'var(--text-secondary)',
                    border: filter === f.id ? '1px solid transparent' : '1px solid var(--border-card)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Search toggle */}
            <button
              onClick={() => setSearchQuery(searchQuery ? '' : ' ')}
              className="pressable p-2 rounded-xl"
              style={{ color: searchQuery ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <Icon name="Search" size={18} />
            </button>
            {/* Sort */}
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="pressable p-2 rounded-xl"
              style={{ color: 'var(--text-muted)' }}
            >
              <Icon name="ArrowUpDown" size={18} />
            </button>
          </div>

          {/* Search input */}
          {searchQuery !== '' && (
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery.trim() ? searchQuery : ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-enter w-full mt-2 rounded-xl px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              autoFocus
            />
          )}

          {/* Sort dropdown */}
          {showFilterDropdown && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowFilterDropdown(false)} />
              <div className="relative">
                <div className="popover-enter absolute right-0 top-2 rounded-xl py-1 z-30"
                  role="menu" aria-label="Sort options"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)', minWidth: 160 }}>
                  {[
                    { id: 'priority', label: 'Priority' },
                    { id: 'dueDate', label: 'Due Date' },
                    { id: 'progress', label: 'Progress' },
                  ].map(s => (
                    <button key={s.id}
                      role="menuitem"
                      onClick={() => { setSortBy(s.id); setShowFilterDropdown(false); }}
                      className="pressable w-full text-left px-4 py-2 text-sm hover-bg"
                      style={{ color: sortBy === s.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Add */}
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
            <Icon name="Plus" size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Add a task..."
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') quickAddTask();
                if (e.key === 'Escape') { setQuickAddTitle(''); e.target.blur(); }
              }}
              className="flex-1 text-sm outline-none"
              style={{ background: 'transparent', color: 'var(--text-primary)' }}
            />
            {quickAddTitle.trim() && (
              <button
                onClick={quickAddTask}
                className="pressable px-3 py-1 rounded-lg text-xs font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="px-4 space-y-3" onClick={closeAll}>
          {sortedTasks.length === 0 ? (
            <div className="empty-state-enter text-center py-16">
              <Icon name={filter !== 'all' ? 'Filter' : 'Plus'} size={48} className="mx-auto opacity-20" color="var(--text-muted)" />
              <p className="mt-4 text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
                {filter !== 'all' ? 'No tasks match this filter' : isCurrentMonth ? 'No tasks yet' : 'No tasks this month'}
              </p>
              {filter !== 'all' ? (
                <button
                  onClick={() => setFilter('all')}
                  className="pressable mt-3 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  Show all tasks
                </button>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  className="pressable mt-3 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  Add your first task
                </button>
              )}
            </div>
          ) : (
            sortedTasks.map((task, i) => (
              <React.Fragment key={task.id}>
                <div className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                  <SwipeableTaskItem
                    task={task}
                    isExpanded={expandedTask === task.id}
                    expandedSubtask={expandedSubtask}
                    addingSubtaskTo={addingSubtaskTo}
                    newSubtask={newSubtask}
                    setNewSubtask={setNewSubtask}
                    onToggleExpand={() => { setExpandedTask(expandedTask === task.id ? null : task.id); setExpandedSubtask(null); }}
                    onToggleSubtask={(stId) => setExpandedSubtask(expandedSubtask === stId ? null : stId)}
                    onEdit={() => openEditModal(task)}
                    onDelete={() => setDeleteConfirm(task.id)}
                    onUpdateProgress={(p) => updateProgress(task.id, p)}
                    onAddSubtask={() => addSubtask(task.id)}
                    onDeleteSubtask={(stId) => deleteSubtask(task.id, stId)}
                    onUpdateSubtaskProgress={(stId, p) => updateSubtaskProgress(task.id, stId, p)}
                    onToggleAddSubtask={() => setAddingSubtaskTo(addingSubtaskTo === task.id ? null : task.id)}
                    searchQuery={searchQuery.trim() || ''}
                    celebrating={celebratingTask === task.id}
                    onComplete={(id) => {
                      const prevTask = tasks.find(t => t.id === id);
                      const prevProgress = prevTask ? prevTask.progress : 0;
                      updateProgress(id, 100);
                      setPendingComplete({ id, prevProgress });
                      setToast({ message: 'Task completed', type: 'success', visible: true });
                    }}
                    onSwipeDelete={(id) => setDeleteConfirm(id)}
                    onLongPressEdit={(id) => { const t = tasks.find(x => x.id === id); if (t) openEditModal(t); }}
                  />
                </div>
                {i === 0 && showSwipeHint && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs stagger-item"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', animationDelay: '200ms' }}>
                    <div className="flex items-center gap-4" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Icon name="ArrowRight" size={12} /> Complete
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="ArrowLeft" size={12} /> Delete
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Grip" size={12} /> Hold to edit
                      </span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); dismissSwipeHint(); }} className="pressable p-1" style={{ color: 'var(--text-muted)' }}>
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>

        {/* FAB */}
        <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add new task">
          <Icon name="Plus" size={24} color="white" />
        </button>

        {/* Modals */}
        {showAdd && <AddTaskModal newTask={newTask} setNewTask={setNewTask} onAdd={addTask} onCancel={() => setShowAdd(false)} />}
        {editingTask && <EditTaskModal editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={() => setEditingTask(null)} />}
        {deleteConfirm && <DeleteConfirmModal task={taskToDelete} onCancel={() => setDeleteConfirm(null)} onConfirm={() => moveToTrash(deleteConfirm)} />}

        {/* Keyboard Shortcut Help Overlay */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-enter"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowHelp(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setShowHelp(false); }}>
            <div className="modal-enter rounded-2xl p-5 w-full max-w-xs"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-elevated)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Shortcuts</h3>
                <button onClick={() => setShowHelp(false)} className="pressable p-1" style={{ color: 'var(--text-muted)' }}>
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  ['n', 'New task'],
                  ['/', 'Search'],
                  ['\u2190 \u2192', 'Change month'],
                  ['1-4', 'Filter tasks'],
                  ['?', 'This help'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</span>
                    <kbd className="text-xs px-2 py-0.5 rounded font-mono"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-card)' }}>
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} trashCount={trash.length} />
      </div>
    );
  }

  // ============================================
  // RENDER APP
  // ============================================
  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
