# SQL Practice Website — Design Spec

**Date:** 2026-06-09
**Type:** Community educational resource (mini SQLZoo)
**Hosting:** GitHub Pages (static files, no build step)
**Stack:** Vanilla HTML/CSS/JS
**Theme:** Minimal, clean, dark/light toggle

---

## File Structure

```
sql-practice/
├── index.html              # Home — hero, stats, topic grid
├── problems.html           # Problem browser — filterable list
├── practice.html           # SQL editor (core app)
├── progress.html           # Progress dashboard + achievements
├── css/
│   └── style.css           # All shared styles, dark/light themes via CSS variables
├── js/
│   ├── questions.js        # const Q = [...] — all 75 questions with metadata
│   ├── nav.js              # Shared navbar + theme toggle + footer
│   └── storage.js          # localStorage helpers (solved/attempted state, achievements)
├── pglite/                 # Existing PGlite files (unchanged)
└── run.py                  # Local dev server (unchanged)
```

### Key Architectural Decisions

- **Questions extracted to `js/questions.js`** — shared across Problems, Practice, and Progress pages. Single source of truth.
- **`storage.js`** provides a clean API for reading/writing progress. All pages use the same localStorage keys. Backward-compatible with existing `sql_solved_*` and `sql_attempted_*` keys.
- **`nav.js`** injects the same navbar + theme toggle into every page via JS.
- **PGlite only loaded on `practice.html`** — no unnecessary loading on other pages.
- **No build step** — static files, GitHub Pages ready out of the box.

---

## Pages

### 1. Home (`index.html`)

**Layout:** Hero + Topic Grid (option A from brainstorm)

- **Navbar** — Logo ("🐘 SQL Practice"), links to Problems/Practice/Progress, dark/light toggle on the right.
- **Hero section** — "Master SQL by Doing" headline, subtitle ("75 hands-on PostgreSQL problems · Real PostgreSQL · Instant feedback"), prominent "Start Practicing →" CTA button.
- **Stats bar** — 3 colored counters: 25 Easy (green), 25 Medium (orange), 25 Hard (red). Counters update live from localStorage to show solved counts (e.g. "5/25 Easy").
- **Topic grid** — 5 cards in a responsive grid (3 cols desktop, 2 tablet, 1 mobile). Each card:
  - Topic name
  - Sub-topic tags (e.g. "GROUP BY · HAVING · JOINs · Subqueries")
  - Problem count (15 problems)
  - Progress bar showing completion
  - Colored left border using topic accent color
  - Click → navigates to `problems.html?topic=Window+Functions`
- **Footer** — minimal: "Built with PGlite · PostgreSQL in the browser"

### 2. Problems (`problems.html`)

**Layout:** Filterable problem list

- **Filter bar** — Difficulty pill buttons (All / Easy / Medium / Hard) + Topic pill buttons (All + 5 topics).
  - URL query params set active filters (links from Home work: `?topic=Window+Functions`).
  - Multiple filters combine (e.g. `?topic=Window+Functions&difficulty=Hard`).
- **Search bar** — Text input to filter by question title. Positioned above the list.
- **Counts** — "Showing 15 of 75 problems" updates dynamically with filters.
- **Problem list** — Each row shows:
  - Solved status icon (green check, pencil for attempted, empty for todo)
  - Difficulty dot (green/orange/red)
  - Question title
  - Topic tag (pill with topic accent color)
  - Click → navigates to `practice.html?id=3`
- Rows are grouped by topic (with topic header labels), sorted Easy → Medium → Hard within each topic.

### 3. Practice (`practice.html`)

**Layout:** Enhanced 2-panel split with draggable resizer (option A from brainstorm)

- **Top bar** — "← Back to Problems" link, question title, difficulty badge, topic badge, Prev/Next buttons.
- **Left panel** — Problem description, table schemas with sample data, expected output table.
- **Draggable resizer** — User can dynamically adjust the split between left and right panels. Existing behavior preserved.
- **Right panel** — CodeMirror SQL editor (Dracula theme), action bar (Run & Check ▶, Clear, Hint), verdict area, output table, solution reveal.
- **URL-driven** — `?id=3` loads question 3 directly. Prev/Next update the URL. Back button works naturally.
- **All existing features preserved:**
  - PGlite in-browser PostgreSQL
  - CodeMirror with SQL autocomplete, bracket closing, comment toggling
  - Progressive hints (up to 3 per question)
  - Solution reveal with optimization tips
  - Hidden test cases to prevent hardcoding
  - localStorage: saves editor content per question, tracks solved/attempted
  - Keyboard shortcuts: Ctrl/Cmd+Enter to run

### 4. Progress (`progress.html`)

**Layout:** Gamified dashboard

- **Overall stats** — Big numbers: total solved (e.g. "23/75"), solve rate %, current daily streak.
- **Difficulty breakdown** — 3 progress rings or bars for Easy/Medium/Hard with X/25 counts.
- **Topic progress** — 5 horizontal bars showing completion per topic (X/15 each), using each topic's accent color.
- **Skill radar chart** — CSS/SVG pentagon radar showing proficiency across 5 topics (percentage solved per topic mapped to each axis).
- **Achievements** — Badge grid. Unlocked badges show in full color; locked badges are grayed out with a lock icon and the unlock condition as tooltip.

**Achievement list:**

| Badge | Condition |
|-------|-----------|
| First Steps | Solve your first problem |
| Easy Street | Solve all 25 Easy problems |
| Medium Mastery | Solve all 25 Medium problems |
| Hard Hitter | Solve 10 Hard problems |
| Unstoppable | Solve all 25 Hard problems |
| Halfway There | Solve 50% of all problems (38+) |
| Perfectionist | Solve all 75 problems |
| JOIN Guru | Solve all 15 Aggregations & JOINs problems |
| Window Master | Solve all 15 Window Functions problems |
| Cumulative Pro | Solve all 15 Cumulative & Sliding Windows problems |
| Sequence Detective | Solve all 15 Consecutive Sequences problems |
| Analytics Ace | Solve all 15 Advanced Analytics problems |
| Streak 7 | Solve problems on 7 different days |

**Data source:** All progress data is derived from localStorage. No backend needed. The `storage.js` module provides helper functions for querying solved/attempted state and computing achievements.

---

## Theming

### Dark/Light Toggle

- **Default:** Dark mode (matches current app aesthetic).
- **Toggle:** Sun/moon icon button in the navbar.
- **Implementation:** `body` gets class `dark` or `light`. All colors defined as CSS custom properties on each class.
- **Persistence:** `localStorage("sql_theme")` — maps to existing `sql_dark` key for backward compat ("1" = dark, "0" = light).
- **Transition:** `transition: background-color 0.2s, color 0.2s` on body and key elements for smooth toggle.

### CSS Variables

```css
body.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #e2e8f0;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border: #334155;
  --accent: #2563eb;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
}

body.light {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #334155;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --accent: #2563eb;
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
}
```

### Topic Accent Colors

Consistent across all pages:

| Topic | Color | Hex |
|-------|-------|-----|
| Aggregations & JOINs | Blue | `#2563eb` |
| Window Functions | Purple | `#8b5cf6` |
| Cumulative & Sliding Windows | Cyan | `#06b6d4` |
| Consecutive Sequences | Amber | `#f59e0b` |
| Advanced Analytics | Pink | `#ec4899` |

---

## Shared Components

### Navbar (`nav.js`)

Injected into every page by `nav.js`:

- **Left:** `🐘 SQL Practice` logo (links to `index.html`)
- **Center:** `Problems` | `Practice` | `Progress` — active page highlighted with accent underline
- **Right:** Theme toggle button (sun icon in dark mode, moon icon in light mode)
- **Mobile (<768px):** Hamburger menu that expands/collapses the center links

### Footer

Minimal footer on all pages: "Built with PGlite · PostgreSQL in the browser"

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Full layout, 3-column topic grid, side-by-side panels |
| Tablet (768–1024px) | 2-column topic grid, narrower panels |
| Mobile (<768px) | Single column, hamburger nav, practice page stacks vertically (problem on top, editor below) |

---

## localStorage Schema

All keys prefixed with `sql_` for namespacing:

| Key | Value | Used By |
|-----|-------|---------|
| `sql_solved_{id}` | `"1"` | Practice, Problems, Progress |
| `sql_attempted_{id}` | `"1"` | Practice, Problems |
| `sql_q_{id}` | SQL string | Practice (editor content) |
| `sql_theme` | `"dark"` or `"light"` | All pages (nav.js) |
| `sql_solve_dates` | JSON array of date strings | Progress (streak tracking) |

**Backward compatibility:** Existing keys `sql_solved_*`, `sql_attempted_*`, `sql_q_*`, and `sql_dark` are preserved. `sql_dark` ("1"/"0") is migrated to `sql_theme` ("dark"/"light") on first load.

---

## GitHub Pages Deployment

- Repository root contains `index.html` — GitHub Pages serves it directly
- No build step, no CI/CD pipeline needed
- Enable GitHub Pages in repo settings → Source: main branch, root directory
- All paths are relative (no absolute URLs)
- `run.py` stays for local development but isn't needed for production
