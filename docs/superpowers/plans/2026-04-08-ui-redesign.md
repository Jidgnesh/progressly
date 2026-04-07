# Progressly UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full visual, interaction, and information architecture overhaul of the Progressly PWA with light/dark theme support, expressive animations, swipe gestures, and a dashboard-first home screen.

**Architecture:** CSS custom properties drive theming (dark/light). CSS handles all animations via custom easing curves. JS handles gesture detection (swipe, drag-to-dismiss, long press). Stats page removed; stats folded into home. Bottom nav reduced from 4 to 3 tabs.

**Tech Stack:** React 18 (UMD via CDN), Tailwind CSS (CDN), Lucide icons, Firebase compat, in-browser Babel. No build step, no new dependencies.

---

## File Map

| File | Responsibility | Action |
| --- | --- | --- |
| `styles.css` | CSS custom properties (theme tokens, easing curves), animations, keyframes, gesture styles, scrollbar, reduced motion, hover gates | **Rewrite** |
| `js/constants.js` | Add `THEME_KEY` constant | **Modify** |
| `js/utils.js` | Add theme helper functions, greeting helper | **Modify** |
| `js/components.js` | Rewrite all UI components: BottomNav, TaskItem, TrashItem, modals, new Toast, new ThemeToggle, new FAB, new StatsSummary | **Rewrite** |
| `js/app.js` | Rewrite App component: new dashboard layout, 3-tab navigation, swipe gesture hooks, theme state, toast system | **Rewrite** |
| `sw.js` | Bump `CACHE_NAME` version | **Modify** |
| `index.html` | No structural changes (same script tags, same CDN deps) | **No change** |
| `js/firebase-config.js` | No changes | **No change** |
| `js/firebase-service.js` | No changes | **No change** |

---

### Task 1: CSS Foundation — Theme Tokens, Easing Curves, and Global Styles

**Files:**
- Rewrite: `styles.css`
- Modify: `js/constants.js` (add `THEME_KEY`)

- [ ] **Step 1: Add THEME_KEY to constants.js**

Add after the existing storage key constants in `js/constants.js`:

```js
const THEME_KEY = 'planner-theme-v1';
```

- [ ] **Step 2: Rewrite styles.css with theme custom properties and easing curves**

Replace the entire `styles.css` with the new foundation. This includes:
- `:root` CSS custom properties for dark theme (default)
- `[data-theme="light"]` overrides for light theme
- `@media (prefers-color-scheme: light)` for system-preference fallback when no `data-theme` is set
- Custom easing curve variables
- Global press feedback (`:active` scale)
- Hover gate media query
- `prefers-reduced-motion` overrides
- Scrollbar styling
- Theme transition class
- Animation keyframes for stagger, fade-in, ring pulse, celebration glow
- Swipe gesture utility styles
- Toast animation styles
- Hold-to-delete clip-path styles
- Drawer/modal animation styles
- Range input and number input overrides

```css
/* ============================================
   THEME CUSTOM PROPERTIES
   ============================================ */
:root {
  /* Easing curves */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  /* Dark theme (default) */
  --bg-base: #0f172a;
  --bg-card: #1e293b;
  --bg-card-60: rgba(30, 41, 59, 0.6);
  --bg-input: rgba(51, 65, 85, 0.5);
  --bg-nav: rgba(15, 23, 42, 0.85);
  --border-card: rgba(148, 163, 184, 0.08);
  --border-elevated: rgba(148, 163, 184, 0.12);
  --border-input: rgba(148, 163, 184, 0.1);
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --divider: #334155;

  /* Shared tokens */
  --accent: #7c3aed;
  --accent-glow: rgba(124, 58, 237, 0.4);
  --priority-high: #ef4444;
  --priority-medium: #f59e0b;
  --priority-low: #22c55e;
}

[data-theme="light"] {
  --bg-base: #f8fafc;
  --bg-card: #ffffff;
  --bg-card-60: rgba(255, 255, 255, 0.6);
  --bg-input: #f1f5f9;
  --bg-nav: rgba(248, 250, 252, 0.85);
  --border-card: rgba(15, 23, 42, 0.06);
  --border-elevated: rgba(15, 23, 42, 0.1);
  --border-input: rgba(15, 23, 42, 0.08);
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --divider: #e2e8f0;
}

/* System preference fallback (when no data-theme attribute) */
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    --bg-base: #f8fafc;
    --bg-card: #ffffff;
    --bg-card-60: rgba(255, 255, 255, 0.6);
    --bg-input: #f1f5f9;
    --bg-nav: rgba(248, 250, 252, 0.85);
    --border-card: rgba(15, 23, 42, 0.06);
    --border-elevated: rgba(15, 23, 42, 0.1);
    --border-input: rgba(15, 23, 42, 0.08);
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --text-muted: #94a3b8;
    --divider: #e2e8f0;
  }
}

/* ============================================
   BASE RESET
   ============================================ */
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
}

/* ============================================
   THEME TRANSITION
   ============================================ */
.theme-transitioning * {
  transition: background-color 300ms var(--ease-out),
              color 300ms var(--ease-out),
              border-color 300ms var(--ease-out) !important;
}

/* ============================================
   GLOBAL PRESS FEEDBACK
   ============================================ */
.pressable {
  transition: transform 160ms var(--ease-out);
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
}

.pressable:active {
  transform: scale(0.97);
}

.pressable-sm:active {
  transform: scale(0.95);
}

.pressable-card {
  transition: transform 160ms var(--ease-out);
}

.pressable-card:active {
  transform: scale(0.98);
}

/* ============================================
   HOVER GATE
   ============================================ */
@media (hover: hover) and (pointer: fine) {
  .hoverable:hover {
    opacity: 0.8;
  }
  .hover-bg:hover {
    background-color: var(--bg-input);
  }
}

/* ============================================
   REDUCED MOTION
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
  .stagger-item {
    opacity: 1 !important;
    transform: none !important;
  }
}

/* ============================================
   SCROLLBAR
   ============================================ */
@media (hover: hover) and (pointer: fine) {
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
}

/* ============================================
   ANIMATIONS — STAGGER & FADE
   ============================================ */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-item {
  opacity: 0;
  animation: fadeInUp 200ms var(--ease-out) forwards;
}

.page-enter {
  animation: fadeInUp 200ms var(--ease-out) forwards;
}

/* ============================================
   ANIMATIONS — PROGRESS RING
   ============================================ */
.progress-ring-circle {
  transition: stroke-dasharray 600ms var(--ease-out);
}

@keyframes ringPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.ring-pulse {
  animation: ringPulse 300ms var(--ease-out);
}

/* ============================================
   ANIMATIONS — CELEBRATION
   ============================================ */
@keyframes celebrationGlow {
  0% { box-shadow: 0 0 16px rgba(34, 197, 94, 0.3); }
  100% { box-shadow: 0 0 0px rgba(34, 197, 94, 0); }
}

.celebration-glow {
  animation: celebrationGlow 600ms var(--ease-out) forwards;
}

/* ============================================
   ANIMATIONS — TOAST
   ============================================ */
@keyframes toastEnter {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes toastExit {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

.toast-enter {
  animation: toastEnter 300ms var(--ease-out) forwards;
}

.toast-exit {
  animation: toastExit 200ms var(--ease-out) forwards;
}

/* ============================================
   ANIMATIONS — MODAL & DRAWER
   ============================================ */
.overlay-enter {
  animation: fadeIn 200ms var(--ease-out) forwards;
}

.drawer-enter {
  animation: drawerSlideUp 300ms var(--ease-drawer) forwards;
}

.drawer-exit {
  animation: drawerSlideDown 200ms var(--ease-out) forwards;
}

@keyframes drawerSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes drawerSlideDown {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}

.modal-enter {
  animation: modalScaleIn 200ms var(--ease-out) forwards;
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ============================================
   ANIMATIONS — POPOVER
   ============================================ */
.popover-enter {
  animation: popoverIn 150ms var(--ease-out) forwards;
}

@keyframes popoverIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ============================================
   ANIMATIONS — NAV PILL
   ============================================ */
.nav-pill {
  transition: left 200ms var(--ease-out), width 200ms var(--ease-out);
}

/* ============================================
   ANIMATIONS — FILTER PILL INDICATOR
   ============================================ */
.filter-indicator {
  transition: left 200ms var(--ease-out), width 200ms var(--ease-out);
}

/* ============================================
   ANIMATIONS — EXPAND/COLLAPSE
   ============================================ */
.expand-content {
  overflow: hidden;
  transition: max-height 250ms var(--ease-in-out), opacity 250ms var(--ease-in-out);
}

/* ============================================
   SWIPE GESTURE
   ============================================ */
.swipe-card {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
}

.swipe-card-content {
  position: relative;
  z-index: 1;
  background: var(--bg-card);
  transition: transform 0ms;
}

.swipe-card-content.releasing {
  transition: transform 200ms var(--ease-out);
}

.swipe-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.swipe-bg-right {
  left: 0;
  right: 0;
  justify-content: flex-start;
  background: rgba(34, 197, 94, 0.15);
}

.swipe-bg-left {
  left: 0;
  right: 0;
  justify-content: flex-end;
  background: rgba(239, 68, 68, 0.15);
}

/* ============================================
   HOLD TO DELETE
   ============================================ */
.hold-delete-overlay {
  position: absolute;
  inset: 0;
  background: var(--priority-high);
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out);
  pointer-events: none;
  border-radius: inherit;
}

.hold-delete-btn:active .hold-delete-overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;
}

/* ============================================
   THEME TOGGLE ICON
   ============================================ */
.theme-icon {
  transition: transform 200ms var(--ease-out);
}

.theme-icon-rotate {
  transform: rotate(180deg);
}

/* ============================================
   PRIORITY ACCENT BAR
   ============================================ */
.task-card {
  position: relative;
  overflow: hidden;
}

.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 2px;
  background: var(--priority-color, var(--text-muted));
}

/* ============================================
   FAB
   ============================================ */
.fab {
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 4px 20px var(--accent-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  border: none;
  color: white;
  cursor: pointer;
  transition: transform 160ms var(--ease-out);
}

.fab:active {
  transform: scale(0.95);
}

/* ============================================
   INPUT OVERRIDES
   ============================================ */
input[type="range"] {
  -webkit-appearance: none;
  background: var(--divider);
  border-radius: 8px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Date input color fix for dark mode */
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.7);
}

[data-theme="light"] input[type="date"]::-webkit-calendar-picker-indicator {
  filter: none;
}
```

- [ ] **Step 3: Verify styles.css loads correctly**

Open the app in the browser (`python -m http.server 8000` or `npx serve .`) and confirm:
- No CSS errors in console
- Body background uses `--bg-base` (dark: `#0f172a`)
- Custom properties are defined in DevTools computed styles

- [ ] **Step 4: Commit**

```bash
git add styles.css js/constants.js
git commit -m "feat: add CSS foundation with theme tokens, easing curves, and animation keyframes"
```

---

### Task 2: Theme System — JS Logic and Toggle Component

**Files:**
- Modify: `js/utils.js` (add theme helpers and greeting helper)
- Modify: `js/components.js` (add ThemeToggle component)

- [ ] **Step 1: Add theme helpers and greeting helper to utils.js**

Append the following to the end of `js/utils.js`:

```js
// ============================================
// THEME FUNCTIONS
// ============================================

const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredThemePreference = () => {
  return localStorage.getItem(THEME_KEY) || 'system';
};

const getEffectiveTheme = (preference) => {
  if (preference === 'system') return getSystemTheme();
  return preference;
};

const applyTheme = (preference) => {
  const effective = getEffectiveTheme(preference);
  if (effective === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

const cycleThemePreference = (current) => {
  if (current === 'system') return 'light';
  if (current === 'light') return 'dark';
  return 'system';
};

const initTheme = () => {
  const pref = getStoredThemePreference();
  applyTheme(pref);
  return pref;
};

// ============================================
// GREETING FUNCTION
// ============================================

const getGreeting = (name) => {
  const hour = new Date().getHours();
  let timeGreeting;
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';
  return name ? `${timeGreeting}, ${name}` : timeGreeting;
};

const getFormattedDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};
```

- [ ] **Step 2: Add ThemeToggle component to the top of components.js**

Add this right after the existing `Icon` component in `js/components.js`:

```jsx
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

  const iconName = preference === 'light' ? 'Sun' : preference === 'dark' ? 'Moon' : 'Monitor';

  return (
    <button
      onClick={handleClick}
      className="pressable p-2 rounded-xl"
      style={{ color: 'var(--text-secondary)' }}
      aria-label={`Theme: ${preference}. Click to cycle.`}
    >
      <span className={`theme-icon inline-flex ${rotating ? 'theme-icon-rotate' : ''}`}>
        <Icon name={iconName} size={20} />
      </span>
    </button>
  );
};
```

- [ ] **Step 3: Test theme toggle in isolation**

Temporarily add a ThemeToggle to the app's return JSX to verify:
- Clicking cycles system → light → dark → system
- `data-theme` attribute on `<html>` changes correctly
- CSS custom properties update (background color changes)
- Icon rotates on click
- `.theme-transitioning` class is applied and removed

(Remove the temporary test mount after verifying.)

- [ ] **Step 4: Commit**

```bash
git add js/utils.js js/components.js
git commit -m "feat: add theme system with toggle component, greeting helpers"
```

---

### Task 3: Toast Component

**Files:**
- Modify: `js/components.js` (add Toast component)

- [ ] **Step 1: Add Toast component to components.js**

Add after the ThemeToggle component:

```jsx
// ============================================
// TOAST COMPONENT
// ============================================
const Toast = ({ message, type = 'success', visible, onDismiss }) => {
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
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[360px] px-4`}
    >
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
        <button
          onClick={() => { setExiting(true); setTimeout(onDismiss, 200); }}
          className="pressable p-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Icon name="X" size={16} />
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add js/components.js
git commit -m "feat: add Toast component with auto-dismiss, tab-pause, and exit animation"
```

---

### Task 4: Bottom Navigation — 3 Tabs with Sliding Pill

**Files:**
- Modify: `js/components.js` (rewrite BottomNav)

- [ ] **Step 1: Rewrite BottomNav component**

Replace the existing `BottomNav` component in `js/components.js`:

```jsx
// ============================================
// BOTTOM NAVIGATION
// ============================================
const BottomNav = ({ currentPage, setCurrentPage, trashCount }) => {
  const tabs = [
    { id: 'home', icon: 'Home' },
    { id: 'history', icon: 'History' },
    { id: 'trash', icon: 'Trash2' },
  ];

  const activeIndex = tabs.findIndex(t => t.id === currentPage);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
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
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                ...(isActive ? { filter: 'drop-shadow(0 0 8px var(--accent-glow))' } : {}),
              }}
            >
              <Icon name={tab.icon} size={24} />
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
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add js/components.js
git commit -m "feat: redesign BottomNav with 3 tabs, sliding pill indicator, and blur backdrop"
```

---

### Task 5: ProgressCircle Redesign and StatsSummary Component

**Files:**
- Modify: `js/components.js` (update ProgressCircle, add StatsSummary)

- [ ] **Step 1: Update ProgressCircle component**

Replace the existing `ProgressCircle` in `js/components.js`:

```jsx
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
```

- [ ] **Step 2: Add StatsSummary component**

Add after ProgressCircle:

```jsx
// ============================================
// STATS SUMMARY COMPONENT
// ============================================
const StatsSummary = ({ totalCount, completedCount, streak, allTasks, expanded, onToggle }) => {
  const miniCards = [
    { label: 'Tasks', value: totalCount },
    { label: 'Done', value: completedCount },
    { label: 'Streak', value: `${streak}d` },
  ];

  return (
    <div>
      {/* Mini stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {miniCards.map((card, i) => (
          <div
            key={card.label}
            className="stagger-item rounded-2xl p-3 text-center"
            style={{
              animationDelay: `${i * 50}ms`,
              background: 'var(--bg-card-60)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid var(--border-input)',
            }}
          >
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {card.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Expandable detailed stats */}
      <button
        onClick={onToggle}
        className="pressable flex items-center gap-2 mt-3 mx-auto text-xs font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="uppercase tracking-wider">Stats</span>
        <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
      </button>

      <div
        className="expand-content"
        style={{
          maxHeight: expanded ? '500px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="pt-4 space-y-4">
          {/* Category breakdown */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              By Category
            </h4>
            <div className="space-y-2">
              {Object.entries(getCategoryStats(allTasks)).map(([cat, stats]) => (
                stats.total > 0 && (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${stats.avgProgress}%`,
                            background: getProgressColor(stats.avgProgress),
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right" style={{ color: 'var(--text-muted)' }}>
                        {stats.avgProgress}%
                      </span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Monthly trends */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Monthly Trends
            </h4>
            <div className="flex items-end gap-1 h-16">
              {getMonthlyTrends(allTasks).map((trend) => (
                <div key={`${trend.month}-${trend.year}`} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max(4, (trend.avgProgress / 100) * 48)}px`,
                      background: trend.avgProgress > 0 ? 'var(--accent)' : 'var(--divider)',
                      opacity: trend.avgProgress > 0 ? 0.7 : 0.3,
                    }}
                  />
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
```

- [ ] **Step 3: Commit**

```bash
git add js/components.js
git commit -m "feat: add StatsSummary with expandable category/trends, update ProgressCircle"
```

---

### Task 6: Task Card Redesign — Visual Design and Expanded Content

**Files:**
- Modify: `js/components.js` (rewrite TaskItem)

- [ ] **Step 1: Rewrite TaskItem component**

Replace the entire existing `TaskItem` component in `js/components.js` with the new clean card design. This is a large component — the full code follows:

```jsx
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
  const overdue = task.dueDate && isOverdue(task.dueDate) && taskProgress < 100;

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? React.createElement('mark', {
            key: i,
            style: { background: 'rgba(250, 204, 21, 0.3)', color: '#fde047', borderRadius: 2, padding: '0 2px' }
          }, part)
        : part
    );
  };

  const priorityColor = PRIORITIES[task.priority] || 'var(--text-muted)';

  return (
    <div
      className={`task-card rounded-2xl ${taskProgress === 100 ? 'opacity-60' : ''} ${overdue ? 'celebration-glow' : ''}`}
      style={{
        '--priority-color': priorityColor,
        background: 'var(--bg-card)',
        border: `1px solid var(--border-card)`,
        ...(overdue ? { boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)' } : {}),
      }}
    >
      {/* Card header — tappable */}
      <div
        className="pressable-card p-4 flex items-center gap-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <ProgressCircle progress={taskProgress} size={36} strokeWidth={3} />

        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-base ${taskProgress === 100 ? 'line-through' : ''}`}
            style={{ color: taskProgress === 100 ? 'var(--text-muted)' : 'var(--text-primary)' }}
          >
            {searchQuery ? highlightText(task.title, searchQuery) : task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.category}</span>
            {task.dueDate && (
              <span
                className="text-xs flex items-center gap-1"
                style={{
                  color: overdue
                    ? 'var(--priority-high)'
                    : isDueToday(task.dueDate)
                    ? '#f97316'
                    : '#60a5fa'
                }}
              >
                <Icon name={overdue ? "AlertCircle" : "Calendar"} size={10} />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        <Icon
          name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          size={18}
          color="var(--text-muted)"
        />
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${taskProgress}%`,
              background: getProgressColor(taskProgress),
              transition: 'width 300ms var(--ease-out)',
            }}
          />
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 pt-2"
          style={{ borderTop: '1px solid var(--border-card)' }}
        >
          {/* Subtasks section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subtasks</span>
              <button
                onClick={onToggleAddSubtask}
                className="pressable text-xs px-3 py-1 rounded-lg flex items-center gap-1"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                <Icon name="Plus" size={14} /> Add
              </button>
            </div>

            {/* Add subtask input */}
            {addingSubtaskTo === task.id && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Subtask name..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onAddSubtask()}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                  }}
                  autoFocus
                />
                <button
                  onClick={onAddSubtask}
                  className="pressable px-4 rounded-lg text-sm text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  Add
                </button>
              </div>
            )}

            {/* Subtask list */}
            {hasSubtasks ? (
              <div className="space-y-2">
                {task.subtasks.map(st => (
                  <div
                    key={st.id}
                    className="rounded-lg px-3 py-2"
                    style={{ background: 'var(--bg-input)' }}
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => onToggleSubtask(st.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm truncate ${st.progress === 100 ? 'line-through' : ''}`}
                            style={{ color: st.progress === 100 ? 'var(--text-muted)' : 'var(--text-primary)' }}
                          >
                            {st.title}
                          </span>
                          <span
                            className="text-xs font-bold ml-2"
                            style={{ color: getProgressColor(st.progress) }}
                          >
                            {st.progress}
                          </span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${st.progress}%`,
                              background: getProgressColor(st.progress),
                              transition: 'width 200ms var(--ease-out)',
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSubtask(st.id); }}
                        className="pressable w-6 h-6 flex items-center justify-center"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Icon name="Trash2" size={12} />
                      </button>
                    </div>
                    {expandedSubtask === st.id && (
                      <div
                        className="flex items-center justify-center gap-3 mt-2 pt-2"
                        style={{ borderTop: '1px solid var(--border-card)' }}
                      >
                        <button
                          onClick={() => onUpdateSubtaskProgress(st.id, Math.max(0, st.progress - 10))}
                          className="pressable w-7 h-7 rounded flex items-center justify-center"
                          style={{ background: 'var(--divider)' }}
                        >
                          <Icon name="Minus" size={14} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={st.progress}
                          onChange={(e) => onUpdateSubtaskProgress(st.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-14 h-7 rounded text-center text-sm font-bold outline-none"
                          style={{
                            background: 'var(--divider)',
                            color: getProgressColor(st.progress),
                          }}
                        />
                        <button
                          onClick={() => onUpdateSubtaskProgress(st.id, Math.min(100, st.progress + 10))}
                          className="pressable w-7 h-7 rounded flex items-center justify-center"
                          style={{ background: 'var(--divider)' }}
                        >
                          <Icon name="Plus" size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>
                No subtasks yet
              </p>
            )}
          </div>

          {/* Manual progress (only if no subtasks) */}
          {!hasSubtasks && (
            <div>
              <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Manual Progress</div>
              <div className="flex gap-2 mb-3">
                {[0, 25, 50, 75, 100].map(v => (
                  <button
                    key={v}
                    onClick={() => onUpdateProgress(v)}
                    className="pressable flex-1 py-2 rounded-lg text-sm font-medium"
                    style={{
                      background: task.progress === v ? getProgressColor(v) : 'var(--divider)',
                      color: task.progress === v ? 'white' : 'var(--text-secondary)',
                      ...(task.progress === v ? { boxShadow: '0 0 0 2px var(--accent)' } : {}),
                    }}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onUpdateProgress(task.progress - 5)}
                  className="pressable w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--divider)' }}
                >
                  <Icon name="Minus" size={18} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={task.progress}
                  onChange={(e) => onUpdateProgress(parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                />
                <button
                  onClick={() => onUpdateProgress(task.progress + 5)}
                  className="pressable w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--divider)' }}
                >
                  <Icon name="Plus" size={18} />
                </button>
              </div>
            </div>
          )}

          {hasSubtasks && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
              Progress auto-calculated from subtasks
            </p>
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add js/components.js
git commit -m "feat: redesign TaskItem with priority accent bar, themed colors, clean layout"
```

---

### Task 7: Modal Redesign — Add/Edit Task Drawer and Delete Confirmation

**Files:**
- Modify: `js/components.js` (rewrite AddTaskModal, EditTaskModal, DeleteConfirmModal)

- [ ] **Step 1: Rewrite DeleteConfirmModal**

Replace the existing `DeleteConfirmModal` in `js/components.js`:

```jsx
// ============================================
// DELETE CONFIRMATION MODAL
// ============================================
const DeleteConfirmModal = ({ task, onCancel, onConfirm }) => {
  if (!task) return null;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-enter"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="modal-enter rounded-2xl p-6 max-w-sm w-full"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-elevated)',
          transformOrigin: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
          style={{ background: 'rgba(239, 68, 68, 0.15)' }}
        >
          <Icon name="Trash2" size={32} color="var(--priority-high)" />
        </div>
        <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
          Delete Task?
        </h3>
        <p className="text-center mb-2" style={{ color: 'var(--text-secondary)' }}>
          "{task.title}"
        </p>
        {hasSubtasks && (
          <p className="text-sm text-center mb-4" style={{ color: '#f59e0b' }}>
            <Icon name="AlertTriangle" size={14} className="inline mr-1" />
            This will also delete {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
          </p>
        )}
        <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
          You can restore this task from the trash later.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="pressable flex-1 py-3 rounded-xl font-medium"
            style={{ background: 'var(--divider)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="pressable flex-1 py-3 rounded-xl font-medium text-white"
            style={{ background: 'var(--priority-high)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Rewrite EditTaskModal with drawer pattern**

Replace the existing `EditTaskModal`:

```jsx
// ============================================
// EDIT TASK MODAL (DRAWER)
// ============================================
const EditTaskModal = ({ editForm, setEditForm, onSave, onCancel }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end overlay-enter"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="drawer-enter w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-elevated)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--text-muted)' }} />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Task</h2>
          <button onClick={onCancel} className="pressable text-2xl" style={{ color: 'var(--text-muted)' }}>
            &times;
          </button>
        </div>

        <input
          type="text"
          placeholder="Task name"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="w-full rounded-xl px-4 py-4 mb-4 outline-none text-lg"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            color: 'var(--text-primary)',
          }}
          autoFocus
        />

        <div className="mb-4">
          <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setEditForm({ ...editForm, category: c })}
                className="pressable px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: editForm.category === c ? 'var(--accent)' : 'var(--divider)',
                  color: editForm.category === c ? 'white' : 'var(--text-secondary)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Priority</label>
          <div className="flex gap-2">
            {Object.entries(PRIORITIES).map(([k, c]) => (
              <button
                key={k}
                onClick={() => setEditForm({ ...editForm, priority: k })}
                className="pressable flex-1 py-3 rounded-xl capitalize font-medium"
                style={{
                  backgroundColor: c + '33',
                  color: c,
                  ...(editForm.priority === k ? { boxShadow: `0 0 0 2px ${c}` } : { opacity: 0.5 }),
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Due Date (Optional)</label>
          <input
            type="date"
            value={getDateInputValue(editForm.dueDate)}
            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value || '' })}
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              color: 'var(--text-primary)',
            }}
            min={new Date().toISOString().split('T')[0]}
          />
          {editForm.dueDate && (
            <button
              onClick={() => setEditForm({ ...editForm, dueDate: '' })}
              className="pressable mt-2 text-xs"
              style={{ color: 'var(--priority-high)' }}
            >
              Clear due date
            </button>
          )}
        </div>

        <button
          onClick={onSave}
          disabled={!editForm.title.trim()}
          className="pressable w-full py-4 rounded-xl font-bold text-lg text-white disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Rewrite AddTaskModal with same drawer pattern**

Replace the existing `AddTaskModal`:

```jsx
// ============================================
// ADD TASK MODAL (DRAWER)
// ============================================
const AddTaskModal = ({ newTask, setNewTask, onAdd, onCancel }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end overlay-enter"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="drawer-enter w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-elevated)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--text-muted)' }} />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Task</h2>
          <button onClick={onCancel} className="pressable text-2xl" style={{ color: 'var(--text-muted)' }}>
            &times;
          </button>
        </div>

        <input
          type="text"
          placeholder="What's your task?"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="w-full rounded-xl px-4 py-4 mb-4 outline-none text-lg"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            color: 'var(--text-primary)',
          }}
          autoFocus
        />

        <div className="mb-4">
          <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setNewTask({ ...newTask, category: c })}
                className="pressable px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: newTask.category === c ? 'var(--accent)' : 'var(--divider)',
                  color: newTask.category === c ? 'white' : 'var(--text-secondary)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Priority</label>
          <div className="flex gap-2">
            {Object.entries(PRIORITIES).map(([k, c]) => (
              <button
                key={k}
                onClick={() => setNewTask({ ...newTask, priority: k })}
                className="pressable flex-1 py-3 rounded-xl capitalize font-medium"
                style={{
                  backgroundColor: c + '33',
                  color: c,
                  ...(newTask.priority === k ? { boxShadow: `0 0 0 2px ${c}` } : { opacity: 0.5 }),
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Due Date (Optional)</label>
          <input
            type="date"
            value={getDateInputValue(newTask.dueDate)}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value || '' })}
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              color: 'var(--text-primary)',
            }}
            min={new Date().toISOString().split('T')[0]}
          />
          {newTask.dueDate && (
            <button
              onClick={() => setNewTask({ ...newTask, dueDate: '' })}
              className="pressable mt-2 text-xs"
              style={{ color: 'var(--priority-high)' }}
            >
              Clear due date
            </button>
          )}
        </div>

        <button
          onClick={onAdd}
          disabled={!newTask.title.trim()}
          className="pressable w-full py-4 rounded-xl font-bold text-lg text-white disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          Add Task
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Commit**

```bash
git add js/components.js
git commit -m "feat: redesign modals with drawer pattern, themed colors, drag handles"
```

---

### Task 8: Trash Page Redesign — TrashItem and Hold-to-Delete

**Files:**
- Modify: `js/components.js` (rewrite TrashItem)

- [ ] **Step 1: Rewrite TrashItem component**

Replace the existing `TrashItem` in `js/components.js`:

```jsx
// ============================================
// TRASH ITEM COMPONENT
// ============================================
const TrashItem = ({ task, onRestore, onDelete }) => {
  const taskProgress = getTaskProgress(task);
  const priorityColor = PRIORITIES[task.priority] || 'var(--text-muted)';

  return (
    <div
      className="task-card rounded-2xl p-4"
      style={{
        '--priority-color': priorityColor,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="opacity-50">
          <ProgressCircle progress={taskProgress} size={36} strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.category}</span>
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Icon name="Clock" size={12} />
            Deleted {formatDeletedTime(task.deletedAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-card)' }}>
        <button
          onClick={onRestore}
          className="pressable flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white"
          style={{ background: 'var(--accent)' }}
        >
          <Icon name="RotateCcw" size={16} /> Restore
        </button>
        <button
          onClick={onDelete}
          className="pressable flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          style={{ background: 'var(--divider)', color: 'var(--text-primary)' }}
        >
          <Icon name="X" size={16} /> Delete Forever
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add js/components.js
git commit -m "feat: redesign TrashItem with themed colors and priority accent bar"
```

---

### Task 9: App Component Rewrite — Dashboard Home, Auth Pages, and All Pages

**Files:**
- Rewrite: `js/app.js`

This is the largest task. The App component needs to be rewritten to include:
1. Theme state and initialization
2. Toast system (replacing `successMessage`)
3. Dashboard-first home screen with greeting, progress ring, stats summary, filter bar
4. 3-tab navigation (removing stats page)
5. Redesigned auth pages
6. Redesigned trash page
7. Redesigned history page
8. FAB for adding tasks

- [ ] **Step 1: Rewrite the entire app.js**

The full rewrite preserves all existing business logic (auth, Firebase sync, task CRUD, storage) but restructures the render output. The key changes are:

**State additions:**
- `themePreference` — initialized via `initTheme()`
- `toast` — `{ message, type, visible }` replacing `successMessage`
- `showStats` — boolean for collapsible stats
- Remove `currentPage === 'statistics'` handling

**Theme toggle handler:**
```js
const handleThemeToggle = () => {
  const next = cycleThemePreference(themePreference);
  setThemePreference(next);
  localStorage.setItem(THEME_KEY, next);
  document.body.classList.add('theme-transitioning');
  applyTheme(next);
  setTimeout(() => document.body.classList.remove('theme-transitioning'), 300);
};
```

**Toast handler (replaces successMessage):**
```js
const showToast = (message, type = 'success') => {
  setToast({ message, type, visible: true });
};
const dismissToast = () => {
  setToast(prev => ({ ...prev, visible: false }));
};
```

Replace all `setSuccessMessage(...)` calls with `showToast(...)`.

**Home page render** — restructure to:
1. Header with greeting + theme toggle + logout
2. Month navigation
3. Large progress ring (80px)
4. StatsSummary component
5. Filter bar with search
6. Sorted task list grouped by priority
7. FAB
8. Bottom nav (3 tabs)

**Auth pages render** — update all hardcoded `bg-slate-*` and `text-*` classes to use CSS variable `style` props for theme support.

**Trash page render** — update to use themed colors, add hold-to-delete for "Empty All" button.

**History page render** — update to use themed colors.

Due to the size of `app.js` (~1000+ lines), this step involves rewriting the entire file. The implementation agent should:
1. Keep all state declarations and business logic functions intact (lines 1-577 of the current file)
2. Replace state: swap `successMessage`/`setSuccessMessage` → `toast`/`showToast`/`dismissToast`, add `themePreference`/`setThemePreference`, add `showStats`/`setShowStats`
3. Add theme initialization in the first `useEffect`
4. Add system theme change listener `useEffect`
5. Rewrite all render sections (loading, auth, trash, history, home) using CSS variables instead of hardcoded Tailwind dark colors
6. Remove the `statistics` page case entirely (stats are now in home)
7. Add FAB component
8. Update BottomNav to 3 tabs

- [ ] **Step 2: Test the full app**

Verify in browser:
- Auth pages render with correct theme
- Theme toggle cycles correctly (system → light → dark → system)
- Home page shows greeting, progress ring, stats summary
- Filter bar works
- Task cards render with new design
- Add/edit/delete modals work
- Trash page works
- History page works
- Toast appears and auto-dismisses
- Bottom nav has 3 tabs with sliding pill

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: rewrite App with dashboard home, theme support, toast system, 3-tab nav"
```

---

### Task 10: Service Worker Cache Bump

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Update CACHE_NAME**

In `sw.js`, change:

```js
const CACHE_NAME = 'progressly-v4';
```

to:

```js
const CACHE_NAME = 'progressly-v5';
```

- [ ] **Step 2: Commit**

```bash
git add sw.js
git commit -m "chore: bump service worker cache version for redesign"
```

---

### Task 11: Swipe Gesture Support on Task Cards

**Files:**
- Modify: `js/app.js` (add swipe gesture hook/logic)
- Modify: `js/components.js` (wrap TaskItem with swipe container)

- [ ] **Step 1: Add useSwipe custom hook to app.js**

Add before the App function or inside it as a helper:

```js
const useSwipe = (onSwipeRight, onSwipeLeft, threshold = 0.4) => {
  const ref = React.useRef(null);
  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const startTime = React.useRef(0);
  const isDragging = React.useRef(false);
  const direction = React.useRef(null);
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
  };

  const handlePointerMove = (e) => {
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!direction.current) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      direction.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      if (direction.current === 'horizontal') {
        e.target.setPointerCapture(e.pointerId);
        isDragging.current = true;
      }
    }

    if (direction.current !== 'horizontal') return;
    e.preventDefault();
    setOffset(dx);
  };

  const handlePointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const dx = e.clientX - startX.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(dx) / elapsed;
    const cardWidth = ref.current?.offsetWidth || 300;
    const percent = Math.abs(dx) / cardWidth;

    if ((velocity > 0.11 || percent > threshold) && dx > 0) {
      onSwipeRight();
    } else if ((velocity > 0.11 || percent > threshold) && dx < 0) {
      onSwipeLeft();
    }

    setReleasing(true);
    setOffset(0);
    setTimeout(() => setReleasing(false), 200);
  };

  return { ref, offset, releasing, handlePointerDown, handlePointerMove, handlePointerUp };
};
```

- [ ] **Step 2: Add long press detection to useSwipe**

Extend the hook to detect long press (500ms hold without movement). Add to the hook:

```js
const longPressTimer = React.useRef(null);
const [longPressed, setLongPressed] = React.useState(false);

// In handlePointerDown, add:
longPressTimer.current = setTimeout(() => {
  if (!isDragging.current) {
    setLongPressed(true);
    if (navigator.vibrate) navigator.vibrate(10);
    onLongPress && onLongPress();
  }
}, 500);

// In handlePointerMove, if direction detected, clear timer:
clearTimeout(longPressTimer.current);

// In handlePointerUp, clear timer:
clearTimeout(longPressTimer.current);
setLongPressed(false);
```

Update the hook signature to accept `onLongPress` as a fourth parameter.

- [ ] **Step 3: Create SwipeableTaskItem wrapper in components.js**

Add after the TaskItem component:

```jsx
// ============================================
// SWIPEABLE TASK ITEM WRAPPER
// ============================================
const SwipeableTaskItem = ({ task, onComplete, onSwipeDelete, ...taskProps }) => {
  const swipe = useSwipe(
    () => onComplete(task.id),
    () => onSwipeDelete(task.id)
  );

  return (
    <div ref={swipe.ref} className="swipe-card rounded-2xl">
      {/* Background layers */}
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

      {/* Card content */}
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
```

- [ ] **Step 4: Use SwipeableTaskItem in app.js task list**

In the home page render section, replace `<TaskItem .../>` with `<SwipeableTaskItem .../>`, passing the additional `onComplete` and `onSwipeDelete` props:

```jsx
<SwipeableTaskItem
  key={task.id}
  task={task}
  onComplete={(id) => updateProgress(id, 100)}
  onSwipeDelete={(id) => setDeleteConfirm(id)}
  // ... all other existing TaskItem props
/>
```

- [ ] **Step 5: Test swipe and long press gestures**

In browser on mobile (or touch simulation in DevTools):
- Swipe right on a task → completes to 100%
- Swipe left on a task → triggers delete confirmation
- Small taps (<10px movement) → normal tap/expand behavior
- Quick flick (high velocity, small distance) → still triggers action

- [ ] **Step 6: Commit**

```bash
git add js/app.js js/components.js
git commit -m "feat: add swipe gestures and long press on task cards"
```

---

### Task 12: Final Polish — Hold-to-Delete, Celebration Animation, and Cleanup

**Files:**
- Modify: `js/app.js` (celebration effect, hold-to-delete in trash)
- Modify: `js/components.js` (if needed)

- [ ] **Step 1: Add task completion celebration**

In `app.js`, modify the `updateProgress` function to trigger a celebration state when a task hits 100%:

```js
const [celebratingTask, setCelebratingTask] = useState(null);

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
```

Pass `celebratingTask` to TaskItem/SwipeableTaskItem and add the `celebration-glow` class when `task.id === celebratingTask`.

- [ ] **Step 2: Add hold-to-delete for Empty Trash button**

In the trash page render, replace the simple "Empty All" button with:

```jsx
{trash.length > 0 && (
  <div className="relative">
    <button
      className="hold-delete-btn pressable relative overflow-hidden px-4 py-2 rounded-xl text-sm font-medium"
      style={{
        background: 'var(--divider)',
        color: 'var(--text-primary)',
      }}
      onPointerUp={(e) => {
        const held = Date.now() - e.target.dataset.pressStart > 1900;
        if (held) emptyTrash();
      }}
      onPointerDown={(e) => {
        e.target.dataset.pressStart = Date.now();
      }}
    >
      <div className="hold-delete-overlay" />
      <span className="relative z-10">Hold to Empty All</span>
    </button>
  </div>
)}
```

- [ ] **Step 3: Final visual pass**

Open the app and check:
- Light theme: all surfaces, text, borders use correct light palette
- Dark theme: everything matches original dark palette
- System preference: toggle system dark mode in OS settings, app follows
- All modals, toasts, popovers look correct in both themes
- Reduced motion: enable in OS accessibility, verify no transform animations
- Mobile: bottom nav blur works, FAB positioned correctly
- Desktop: scrollbar styled, hover states work

- [ ] **Step 4: Commit**

```bash
git add js/app.js js/components.js
git commit -m "feat: add task completion celebration, hold-to-delete for empty trash, final polish"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Full functional test**

Test the complete flow:
1. Sign up / sign in (both Firebase and localStorage fallback)
2. Add a task → verify toast, card appears with stagger animation
3. Expand a task → add subtask → update progress
4. Complete a task → verify celebration glow
5. Swipe right to complete → verify swipe + completion
6. Swipe left to delete → verify delete confirmation
7. Check trash → restore a task → verify it returns
8. Hold "Empty All" → verify hold-to-delete works
9. Toggle theme 3 times → verify all 3 states
10. Check history page → verify past tasks show
11. Toggle stats expand on home → verify category + trends render

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found in final verification"
```
