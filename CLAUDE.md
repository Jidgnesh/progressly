# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Progressly is a monthly task planner PWA with progress tracking, subtasks, and cross-device sync via Firebase. Deployed to GitHub Pages at `jidgnesh.github.io/progressly/`.

## Development

**No build step.** The app uses React 18 + Babel (in-browser JSX transpilation) loaded from CDNs. No npm, no bundler, no package.json.

**To run locally:**
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

**CI:** GitHub Actions validates file structure, HTML, JS (non-empty, no merge conflicts), and manifest JSON on PRs to main. No unit tests.

**To validate manifest:**
```bash
python3 -m json.tool manifest.json
```

## Architecture

**Single-page React app** with all state lifted into one `App` component (~1500 lines in `app.js`). No Redux or Context — just `useState` hooks.

### Script Loading Order (critical)

Scripts in `index.html` load in dependency order. All app scripts use `type="text/babel"` for in-browser JSX transpilation:

1. CDN libs (React, ReactDOM, Babel, Tailwind, Lucide, Firebase)
2. `constants.js` — storage keys, priorities, categories
3. `firebase-config.js` — initializes Firebase app, sets auth persistence
4. `firebase-service.js` — auth + Firestore CRUD (the service layer)
5. `utils.js` — pure helpers (date formatting, progress colors, filtering)
6. `components.js` — React components (Icon, Toast, TaskItem, modals, BottomNav)
7. `app.js` — main App component, all state, auth handlers, renders everything

**Adding a new file** requires updating both `index.html` (script tag in correct order) and `sw.js` (ASSETS cache list).

### Data Flow

- **Firebase path:** Auth → `checkAuth()` returns user info → `loadData()` fetches from `users/{uid}/tasks` and `users/{uid}/trash` → real-time listener via `subscribeToTasks()`
- **localStorage fallback:** If Firebase unavailable, uses keys `planner-tasks-v5`, `planner-trash-v1`, `planner-auth-v1`, `planner-users-v1`
- **Dual persistence:** `saveTasks()` and `saveTrash()` check `useFirebase && currentUser` to decide storage backend

### Firebase (Compat Mode v10.7.1)

- Project: `progrey-515c9`
- Firestore structure: `users/{uid}/tasks/{taskId}`, `users/{uid}/trash/{trashId}`
- `FirebaseService.ensureOnline()` is called before every Firestore operation to force network connection
- All Firestore reads wrapped in try/catch with graceful fallback to Auth profile or localStorage
- Google Sign-In uses popup with automatic redirect fallback

### Key Patterns

- **Lucide icons use PascalCase names:** `Eye`, `EyeOff`, `Trash2`, `ChevronUp` (not kebab-case)
- **Email auto-complete:** `completeEmail()` appends `@gmail.com` if no `@` present; called in `onBlur` handlers AND form submit handlers
- **Auth race condition fix:** `checkAuth()` returns `{ authenticated, user, isFirebase }` directly — `loadData()` uses these returned values, not React state (which would be stale in the closure)
- **Task migration:** Incomplete tasks from past months auto-migrate to the current month on load

### Service Worker (`sw.js`)

- Cache version must be bumped on deploy (e.g., `progressly-v5` → `progressly-v6`)
- **Network-first** for same-origin files (picks up deploys immediately)
- **Cache-first** for CDN dependencies (faster loads)
- All app JS files must be listed in the ASSETS array

## Styling

Tailwind CSS (CDN) for layout + custom CSS variables in `styles.css` for theming. Dark theme default, light theme via `[data-theme="light"]`. Custom easing curves defined as CSS variables (`--ease-out`, `--ease-in-out`, `--ease-drawer`).

## Conventions

- **Files:** lowercase kebab-case (`firebase-service.js`)
- **Components:** PascalCase functions (`TaskItem`, `AddTaskModal`)
- **Handlers:** `handle` prefix (`handleSignUp`, `handleLogout`)
- **State booleans:** `is`/`show`/`use` prefix (`isAuthenticated`, `showAdd`, `useFirebase`)
- **Constants:** SCREAMING_SNAKE_CASE (`STORAGE_KEY`, `AUTH_KEY`)
- **No Co-Authored-By lines in commits**
