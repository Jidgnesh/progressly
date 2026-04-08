# Progressly UI Redesign — Design Spec

## Overview

Full visual, interaction, and information architecture overhaul of the Progressly PWA. Same color palette (slate dark theme, violet accents, red/amber/green priority colors). Target: both mobile and desktop equally. Expressive animations with personality for milestone moments, clean and simple card design with details on tap.

## Design Philosophy

Follows Emil Kowalski's design engineering principles:
- Unseen details compound into interfaces people love
- Custom easing curves over CSS defaults — every animation feels intentional
- Press feedback on every interactive element
- Never animate from `scale(0)` — always `scale(0.95)` + opacity
- Popovers scale from trigger; modals scale from center
- Respect `prefers-reduced-motion`
- Gate hover states behind `@media (hover: hover) and (pointer: fine)`

## Color Palette

Supports dark and light mode. Violet accent and priority colors stay the same across both themes.

### Shared Tokens (Both Themes)

| Token | Value | Usage |
| --- | --- | --- |
| Primary accent | `#7c3aed` (violet-600) | Buttons, active states |
| Primary glow | `rgba(124, 58, 237, 0.4)` | Active nav icon glow |
| Priority high | `#ef4444` | Red |
| Priority medium | `#f59e0b` | Amber |
| Priority low | `#22c55e` | Green |

### Dark Theme

| Token | Value | Usage |
| --- | --- | --- |
| Body background | `#0f172a` (slate-900) | Page background |
| Card surface | slate-800 | Cards, nav bar |
| Elevated surface | slate-800 + blur(12px) | Modals, popovers |
| Card border | `rgba(148, 163, 184, 0.08)` | Subtle card edges |
| Elevated border | `rgba(148, 163, 184, 0.12)` | Modal edges |
| Text primary | white | Titles |
| Text secondary | slate-400 | Metadata, labels |
| Text muted | slate-500 | Timestamps, hints |
| Input background | slate-700/50 | Form fields |

### Light Theme

| Token | Value | Usage |
| --- | --- | --- |
| Body background | `#f8fafc` (slate-50) | Page background |
| Card surface | white | Cards, nav bar |
| Elevated surface | white + blur(12px) | Modals, popovers |
| Card border | `rgba(15, 23, 42, 0.06)` | Subtle card edges |
| Elevated border | `rgba(15, 23, 42, 0.1)` | Modal edges |
| Text primary | `#0f172a` (slate-900) | Titles |
| Text secondary | slate-500 | Metadata, labels |
| Text muted | slate-400 | Timestamps, hints |
| Input background | slate-100 | Form fields |

### Theme Implementation

- **Default:** follows system preference via `prefers-color-scheme` media query.
- **Manual override:** a sun/moon toggle icon in the top-right of the header (next to the user avatar/settings area). Stores preference in `localStorage` under key `planner-theme-v1`. Values: `system` (default), `dark`, `light`.
- **Mechanism:** CSS custom properties defined on `:root` for dark, overridden inside `[data-theme="light"]` selector. On load, JS checks localStorage → if `system`, reads `window.matchMedia('(prefers-color-scheme: dark)')` → sets `data-theme` attribute on `<html>`. Listens for system changes via `matchMedia.addEventListener('change', ...)`.
- **Toggle animation:** the sun/moon icon rotates 180deg on switch with `var(--ease-out)` at 200ms. Theme colors transition globally with `transition: background-color 300ms var(--ease-out), color 300ms var(--ease-out), border-color 300ms var(--ease-out)` on `*` selector (only during theme switch — add a `.theme-transitioning` class to body for 300ms, then remove to avoid interfering with other transitions).
- **Toggle cycles:** tap cycles through: system → light → dark → system. Current mode shown by icon: sun (light), moon (dark), auto icon (system).

## CSS Foundation

### Custom Easing Curves

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}
```

All UI animations use these. No raw `ease` or `ease-in` on interactive elements.

### Global Press Feedback

Every interactive element (buttons, cards, pills, icon buttons):
```css
transition: transform 160ms var(--ease-out);
```
```css
:active {
  transform: scale(0.97);
}
```

### Hover Gate

```css
@media (hover: hover) and (pointer: fine) {
  /* hover styles only here */
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Keep opacity and color transitions */
  /* Remove all transform-based motion and staggers */
}
```

### Depth System

Three levels via border opacity and backdrop blur (no box-shadows on cards). Values reference CSS custom properties so they adapt to light/dark theme automatically:
1. **Base:** `var(--bg-base)` (body)
2. **Card:** `var(--bg-card)`, `border: 1px solid var(--border-card)`, `rounded-2xl`
3. **Elevated:** `var(--bg-card)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--border-elevated)`

### Typography Rhythm

| Element | Style |
| --- | --- |
| Page titles | `text-xl font-bold` |
| Section headers | `text-sm font-medium text-slate-400` uppercase tracking |
| Card titles | `text-base font-medium` |
| Metadata | `text-xs text-slate-500` |
| Card list spacing | `space-y-3` |
| Page section spacing | `space-y-6` |

### Scrollbar

Desktop: thin custom scrollbar in slate colors. Mobile: hidden (native momentum scroll).

---

## 1. Information Architecture & Navigation

### Page Structure

**Before:** 4 tabs — Home, History, Stats, Trash
**After:** 3 tabs — **Home**, **History**, **Trash**

Stats is folded into Home as a collapsible summary section. Stats data is most useful alongside the current month's tasks.

### Bottom Nav Bar

- Icons only, no text labels.
- Active icon: filled variant with violet glow (`box-shadow: 0 0 12px rgba(124, 58, 237, 0.4)`).
- Active indicator: a small violet pill (`bg-violet-600`, `rounded-full`, ~32px wide, 3px tall) positioned below the active icon.
- The pill slides between tabs on switch: absolute positioned, transitions `left` using `var(--ease-out)` at 200ms.
- Bar background: `rgba(15, 23, 42, 0.85)` with `backdrop-filter: blur(12px)`. Content scrolls beneath it.
- `border-top: 1px solid rgba(148, 163, 184, 0.08)`.

### Page Transitions

- **Tab switch:** content fades in with `translateY(8px)` + `opacity: 0` → settled. 200ms `var(--ease-out)`. Frequent action — kept fast and simple.
- **Modal open:** slide up from `translateY(100%)`, 300ms `var(--ease-drawer)`. Overlay fades in with `backdrop-filter: blur(4px)` at 200ms.
- **Modal close:** reverse at 200ms `var(--ease-out)` (exit faster than enter — asymmetric timing).

---

## 2. Home Screen — Dashboard Layout

### Greeting Header

- Time-aware greeting: "Good morning/afternoon/evening, {name}".
- Current date below in `text-sm text-slate-400`: "Tuesday, April 8, 2026".
- Fade in on load, 300ms.

### Month Navigation

- Centered: `< April 2026 >`.
- Arrow buttons get `scale(0.95)` on `:active`, 160ms `var(--ease-out)`.
- Month text crossfades on change with slight `translateX` in the direction of navigation (±8px), 200ms.

### Progress Ring

- Large animated ring, 80px diameter, centered below greeting.
- Shows overall month completion percentage.
- Ring fill animates on load via CSS transition on `stroke-dasharray`, 600ms `var(--ease-out)`.
- Percentage number counts up with a staggered delay (starts 200ms after ring begins).
- Ring color follows the existing `getProgressColor()` function.

### Stats Summary Row

- 3 mini cards in a row: **Tasks** (total), **Done** (completed), **Streak** (days).
- Card style: `bg-slate-800/60`, `backdrop-filter: blur(8px)`, `rounded-2xl`, `border: 1px solid rgba(148, 163, 184, 0.1)`.
- Each shows a number (large, `text-lg font-bold`) and a label below (`text-xs text-slate-500`).
- Section header: "Stats" with a chevron. Tapping expands to show category breakdown and weekly trends (current Stats page content). Height animation, 250ms `var(--ease-in-out)`.
- Stagger on initial load: each card fades in with `translateY(8px)`, 50ms delay between each.

### Filter Bar

- Horizontal scrollable pills: All, To Do, In Progress, Done.
- Active pill: `bg-violet-600 text-white`. Inactive: `bg-slate-800 text-slate-400`.
- Sliding indicator: an absolute-positioned `bg-violet-600` pill behind the active filter, transitions `left` and `width` on switch, 200ms `var(--ease-out)`.
- Search icon at the right end. Tap expands an input field inline (width from 0 → full), 200ms `var(--ease-out)`. Focus ring: `ring-2 ring-violet-500/50`.

### Sort Control

- Small icon button next to filter bar.
- Opens a popover: `transform-origin` set to trigger position. Entry: `scale(0.95)` + `opacity: 0` → settled, 150ms `var(--ease-out)`.
- 3 options: Priority, Due Date, Progress. Each highlights with `bg-slate-700` on hover/tap, 100ms.

### Task List

- Tasks grouped by priority: High → Medium → Low.
- Subtle text dividers between groups: "High Priority", "Medium Priority", "Low Priority" in `text-xs text-slate-500 uppercase tracking-wider`.
- New tasks enter with `translateY(8px)` + `opacity: 0` → settled, 200ms `var(--ease-out)`.

### FAB (Add Task)

- Floating action button: `bg-violet-600`, 56px circle, bottom-right above nav bar.
- Plus icon inside.
- `scale(0.95)` on press. Shadow: `0 4px 20px rgba(124, 58, 237, 0.4)`.
- Position: fixed, 16px from right edge, 16px above bottom nav bar.

---

## 3. Task Cards

### Visual Design

- `bg-slate-800`, `rounded-2xl`, `border: 1px solid rgba(148, 163, 184, 0.08)`.
- Left edge: 3px vertical accent bar in priority color via pseudo-element (`::before`, `position: absolute`, `left: 0`, `top: 12px`, `bottom: 12px`, `width: 3px`, `border-radius: 2px`).
- Content: task title (`text-base font-medium`), single metadata line below (`text-xs text-slate-500`) — category + due date if set.
- Due date color coding: `text-blue-400` (future), `text-orange-400` (today), `text-red-400` (overdue).
- Right side: circular progress ring, 36px. Ring fill only, no text inside.
- Completed tasks: `opacity: 0.6`, title gets `line-through text-slate-500`.
- Overdue tasks: `ring-2 ring-red-500/30` on the card.

### Interactions

**Tap to expand:**
- Card height grows to reveal subtasks + progress controls.
- Height transition: 250ms `var(--ease-in-out)`.
- Inner content fades in with 50ms stagger after height settles.

**Swipe right → complete:**
- Swipe detection threshold: horizontal movement > 10px before vertical movement begins. Below 10px registers as a tap. This prevents accidental swipes during normal taps.
- Green background (`bg-green-500/20`) reveals underneath with a checkmark icon.
- Uses `element.setPointerCapture()` for reliable drag tracking.
- Momentum-based dismissal: `velocity = Math.abs(distance) / elapsedTime`. If `velocity > 0.11`, complete regardless of distance. Also completes if `distance > 40% of card width`.
- Completion animation: card scales to `0.95`, fades to `opacity: 0`, then height collapses — three phases, ~300ms total.
- Multi-touch protection: ignore additional touch points after drag begins.

**Swipe left → delete:**
- Same mechanics as swipe right. Red background with trash icon.
- Sends task to trash (restorable).

**Long press → edit:**
- 500ms hold triggers edit mode.
- `navigator.vibrate(10)` feedback if available.
- Opens edit modal (drawer).

**Press feedback:**
- `scale(0.98)` on `:active`, 160ms `var(--ease-out)`.

### Expanded Content

**With subtasks:**
- Subtask list: simple checkmark circle + title per item.
- Tap subtask toggles a mini progress control: ±10% buttons and a number input.
- Toggle animation: `scale(0.95)` + `opacity: 0` → settled, 150ms `var(--ease-out)`.
- "Add subtask" button: `+ Add` text, `text-violet-400`. Reveals inline input on tap (same expand pattern).
- Footer note: "Progress auto-calculated from subtasks" in `text-xs text-slate-500`.

**Without subtasks:**
- Manual progress: quick-set buttons (0/25/50/75/100) + range slider.
- Active quick-set button gets the progress color background. Others: `bg-slate-700`.
- Slider thumb colored by progress value.

### Task Completion Celebration

When progress hits 100%:
1. Progress ring fill completes with a slightly slower animation (400ms).
2. Ring pulses: `scale(1.1)` → `scale(1)`, spring-like (~300ms).
3. Card gets a momentary green border glow (`box-shadow: 0 0 16px rgba(34, 197, 94, 0.3)`) that fades out over 600ms.
4. Card settles to completed state: `opacity: 0.6`, `line-through` on title.

---

## 4. Modals & Overlays

### Add/Edit Task Drawer

- Slides up from bottom: `translateY(100%)` → `translateY(0)`, 300ms `var(--ease-drawer)`.
- Overlay: `bg-black/50`, `backdrop-filter: blur(4px)`, fades in 200ms.
- Dismiss: exit at 200ms `var(--ease-out)` (faster exit).
- Drag handle: 40px x 4px pill, `bg-slate-600`, `rounded-full`, centered at top.
- Draggable to dismiss: drag down with damping at boundary (the further past natural position, the less it moves). Release with `velocity > 0.11` dismisses; otherwise snaps back with spring behavior.
- Max height: `85vh`, internal scroll, `rounded-t-3xl`.
- Form fields: `bg-slate-700/50`, `border: 1px solid rgba(148, 163, 184, 0.1)`, `rounded-xl`. Focus: `ring-2 ring-violet-500/50`, transition 150ms.
- Category pills: same as filter pills, `scale(0.97)` on press.
- Priority buttons: colored backgrounds at 20% opacity, `scale(0.97)` on press.
- Submit button: `bg-violet-600`, full width, `rounded-xl`. Disabled: `opacity: 0.4`. Press: `scale(0.97)` + blur transition on label text.

### Delete Confirmation Modal

- Centered on screen (not a drawer).
- Entry: `scale(0.95)` + `opacity: 0` → settled, 200ms `var(--ease-out)`. `transform-origin: center`.
- Trash icon pulses once on open: `scale(1.05)` → `scale(1)`, 300ms.
- Two buttons: Cancel (`bg-slate-700`) and Delete (`bg-red-600`). Both with press feedback.

### Sort Popover

- Scales from trigger position. Entry: `scale(0.95)` + `opacity: 0`, 150ms `var(--ease-out)`.
- Options highlight with `bg-slate-700` on hover/tap, 100ms.

### Toasts (Success/Error Messages)

- Positioned: fixed top center, max-width 360px, 16px from top.
- Enter from top: `translateY(-100%)` → `translateY(0)`, 300ms `var(--ease-out)`.
- Auto-dismiss after 3s. Exit: slide back up, 200ms `var(--ease-out)`.
- Same direction enter/exit for spatial consistency.
- Timer pauses when tab is hidden (`visibilitychange` event).
- Success: green left accent. Error: red left accent.

---

## 5. History Page

- Past months' completed tasks grouped by month.
- Month headers: month name + year, with a mini progress ring (24px) showing that month's completion rate.
- Task cards: read-only versions of home cards (same visual style, no swipe gestures).
- Tap to inline expand with task details (consistent with home card expand pattern, read-only).
- Stagger animation: each month group fades in with 80ms delay between groups. Tasks within each group stagger at 40ms.

---

## 6. Trash Page

- Header: "X items in trash" count.
- Cards: task title, priority accent bar, time since deletion ("2h ago").
- Two action buttons per card: "Restore" (`bg-violet-600`) and "Delete Forever" (`bg-slate-700`, hover/press → `bg-red-600`).
- "Empty Trash" button at top: **hold-to-delete pattern.** Red overlay clips from left using `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` over 2s linear on `:active`. Release snaps back at 200ms `var(--ease-out)`. Completes only if held full duration. Button also has `scale(0.97)` press feedback.

---

## 7. Auth Pages (Sign In / Sign Up / Forgot Password)

- Centered card layout, works on both mobile and desktop.
- Logo + "Progressly" title at top, fade-in on load (300ms).
- Toggle between Sign In / Sign Up: sliding pill indicator (same as filter tabs), form content crossfades with `translateY(4px)`, 200ms.
- Form fields: same as modal fields (`bg-slate-700/50`, `rounded-xl`, violet focus ring).
- Google sign-in button: white background, Google logo, `scale(0.97)` on press.
- Error messages: slide down from top of form with `translateY(-8px)` + `opacity: 0` entry, `bg-red-500/10` background.
- Password visibility toggle: eye icon morphs between open/closed states.
- Forgot password flow: same card, content transitions between email input and reset form.

---

## 8. Service Worker

No changes to caching strategy. Update `CACHE_NAME` version when deploying the redesign. Asset list in `sw.js` remains the same (same files, new content).

---

## Technical Constraints

- **No build step:** App runs via `<script type="text/babel">` with in-browser Babel. No bundler.
- **No new dependencies:** React 18 (UMD), ReactDOM, Babel standalone, Tailwind CDN, Lucide icons, Firebase compat. All via CDN.
- **File structure preserved:** `js/constants.js`, `js/firebase-config.js`, `js/firebase-service.js`, `js/utils.js`, `js/components.js`, `js/app.js`, `styles.css`, `sw.js`, `index.html`.
- **Script load order matters:** constants → firebase-config → firebase-service → utils → components → app (as defined in `index.html`).
- **All animations in CSS where possible.** JS only for gesture handling (swipe, drag-to-dismiss) and dynamic values. Use CSS transitions for interruptible UI, not keyframes (except stagger on initial load).
- **Tailwind via CDN:** utility classes for layout and spacing. Custom CSS in `styles.css` for animations, easing curves, and effects that Tailwind can't express.
