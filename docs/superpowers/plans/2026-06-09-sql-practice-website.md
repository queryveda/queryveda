# SQL Practice Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform a single-file SQL practice app into a multi-page static website with Home, Problems, Practice, and Progress pages — deployable to GitHub Pages.

**Architecture:** Multi-page static site with shared CSS/JS modules. Questions extracted to a shared JS file. Each page is a standalone HTML file that loads shared modules via `<script>` tags. No build step — just static files.

**Tech Stack:** Vanilla HTML/CSS/JS, PGlite (in-browser PostgreSQL), CodeMirror 5, GitHub Pages

---

## File Map

```
sql-practice/
├── index.html              # NEW — Home page (hero + stats + topic grid)
├── problems.html           # NEW — Problem browser (filterable list)
├── practice.html           # REFACTORED — SQL editor (from sql_practice.html)
├── progress.html           # NEW — Progress dashboard + achievements
├── css/
│   └── style.css           # NEW — All shared styles + dark/light CSS variables
├── js/
│   ├── questions.js        # NEW — Extracted Q array from sql_practice.html
│   ├── nav.js              # NEW — Shared navbar + theme toggle + footer injection
│   └── storage.js          # NEW — localStorage API (solved/attempted/theme/streak)
├── pglite/                 # UNCHANGED — existing PGlite files
├── run.py                  # UNCHANGED — local dev server
└── sql_practice.html       # DELETE after practice.html is verified working
```

---

### Task 1: Extract questions to `js/questions.js`

**Files:**
- Create: `js/questions.js`
- Read: `sql_practice.html` (lines 166–1118 contain the Q array and TOPICS)

The current `sql_practice.html` has `const Q = [...]` (75 questions) and `const TOPICS = [...]` inline. Extract them into a standalone JS file.

- [ ] **Step 1: Create `js/` directory**

```bash
mkdir -p js
```

- [ ] **Step 2: Create `js/questions.js`**

Extract the entire `const TOPICS = [...]` and `const Q = [...]` from `sql_practice.html` lines 166–1118 into `js/questions.js`. The file should contain exactly:

```javascript
const TOPICS = [
  "Aggregations & JOINs",
  "Window Functions",
  "Cumulative & Sliding Windows",
  "Consecutive Sequences",
  "Advanced Analytics"
];

const TOPIC_COLORS = {
  "Aggregations & JOINs": "#2563eb",
  "Window Functions": "#8b5cf6",
  "Cumulative & Sliding Windows": "#06b6d4",
  "Consecutive Sequences": "#f59e0b",
  "Advanced Analytics": "#ec4899"
};

const Q = [
  // ... all 75 question objects, copied verbatim from sql_practice.html ...
];
```

Copy every question object exactly as-is — do not modify any question data. Add the `TOPIC_COLORS` mapping (new constant, used by all pages).

- [ ] **Step 3: Verify the extraction**

Open browser console on `sql_practice.html`, run `Q.length` — should be 75. After Task 3 (practice.html), we'll verify the extracted file loads correctly.

- [ ] **Step 4: Commit**

```bash
git add js/questions.js
git commit -m "extract: move questions and topics to js/questions.js"
```

---

### Task 2: Create `js/storage.js` — localStorage helpers

**Files:**
- Create: `js/storage.js`

Centralizes all localStorage reads/writes. Every page imports this instead of calling localStorage directly.

- [ ] **Step 1: Create `js/storage.js`**

```javascript
/* storage.js — localStorage API for SQL Practice */

const Storage = {
  // --- Theme ---
  getTheme() {
    // Migrate from old key if needed
    const oldKey = localStorage.getItem("sql_dark");
    if (oldKey !== null && !localStorage.getItem("sql_theme")) {
      localStorage.setItem("sql_theme", oldKey === "1" ? "dark" : "light");
    }
    return localStorage.getItem("sql_theme") || "dark";
  },
  setTheme(theme) {
    localStorage.setItem("sql_theme", theme);
    // Keep old key in sync for backward compat
    localStorage.setItem("sql_dark", theme === "dark" ? "1" : "0");
  },

  // --- Question progress ---
  isSolved(id) {
    return localStorage.getItem("sql_solved_" + id) === "1";
  },
  isAttempted(id) {
    return localStorage.getItem("sql_attempted_" + id) === "1";
  },
  getStatus(id) {
    if (this.isSolved(id)) return "solved";
    if (this.isAttempted(id)) return "attempted";
    return "todo";
  },
  markSolved(id) {
    localStorage.setItem("sql_solved_" + id, "1");
    localStorage.removeItem("sql_attempted_" + id);
    this._recordSolveDate();
  },
  markAttempted(id) {
    if (this.isSolved(id)) return;
    localStorage.setItem("sql_attempted_" + id, "1");
  },

  // --- Editor content ---
  getSavedSQL(id) {
    return localStorage.getItem("sql_q_" + id) || "";
  },
  saveSQL(id, sql) {
    localStorage.setItem("sql_q_" + id, sql);
  },

  // --- Solve dates (for streak tracking) ---
  _recordSolveDate() {
    const today = new Date().toISOString().slice(0, 10);
    const dates = this.getSolveDates();
    if (!dates.includes(today)) {
      dates.push(today);
      localStorage.setItem("sql_solve_dates", JSON.stringify(dates));
    }
  },
  getSolveDates() {
    try {
      return JSON.parse(localStorage.getItem("sql_solve_dates") || "[]");
    } catch { return []; }
  },

  // --- Aggregate stats ---
  countSolved(questions) {
    return questions.filter(q => this.isSolved(q.id)).length;
  },
  countByDifficulty(questions, difficulty) {
    const subset = questions.filter(q => q.difficulty === difficulty);
    return { total: subset.length, solved: this.countSolved(subset) };
  },
  countByTopic(questions, topic) {
    const subset = questions.filter(q => q.topic === topic);
    return { total: subset.length, solved: this.countSolved(subset) };
  },

  // --- Streak calculation ---
  getCurrentStreak() {
    const dates = this.getSolveDates().sort().reverse();
    if (!dates.length) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    // Streak must include today or yesterday to be "current"
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (prev - curr) / 86400000;
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  },

  // --- Achievements ---
  getAchievements(questions) {
    const totalSolved = this.countSolved(questions);
    const easySolved = this.countByDifficulty(questions, "Easy").solved;
    const medSolved = this.countByDifficulty(questions, "Medium").solved;
    const hardSolved = this.countByDifficulty(questions, "Hard").solved;
    const streak = this.getCurrentStreak();
    const solveDays = this.getSolveDates().length;

    const defs = [
      { id: "first-steps", name: "First Steps", desc: "Solve your first problem", icon: "🎯", unlocked: totalSolved >= 1 },
      { id: "easy-street", name: "Easy Street", desc: "Solve all 25 Easy problems", icon: "🟢", unlocked: easySolved >= 25 },
      { id: "medium-mastery", name: "Medium Mastery", desc: "Solve all 25 Medium problems", icon: "🟡", unlocked: medSolved >= 25 },
      { id: "hard-hitter", name: "Hard Hitter", desc: "Solve 10 Hard problems", icon: "💪", unlocked: hardSolved >= 10 },
      { id: "unstoppable", name: "Unstoppable", desc: "Solve all 25 Hard problems", icon: "🔴", unlocked: hardSolved >= 25 },
      { id: "halfway", name: "Halfway There", desc: "Solve 50% of all problems", icon: "⭐", unlocked: totalSolved >= 38 },
      { id: "perfectionist", name: "Perfectionist", desc: "Solve all 75 problems", icon: "👑", unlocked: totalSolved >= 75 },
      { id: "join-guru", name: "JOIN Guru", desc: "Complete all Aggregations & JOINs", icon: "🔗", unlocked: this.countByTopic(questions, "Aggregations & JOINs").solved >= 15 },
      { id: "window-master", name: "Window Master", desc: "Complete all Window Functions", icon: "🪟", unlocked: this.countByTopic(questions, "Window Functions").solved >= 15 },
      { id: "cumulative-pro", name: "Cumulative Pro", desc: "Complete all Cumulative & Sliding Windows", icon: "📈", unlocked: this.countByTopic(questions, "Cumulative & Sliding Windows").solved >= 15 },
      { id: "sequence-detective", name: "Sequence Detective", desc: "Complete all Consecutive Sequences", icon: "🔍", unlocked: this.countByTopic(questions, "Consecutive Sequences").solved >= 15 },
      { id: "analytics-ace", name: "Analytics Ace", desc: "Complete all Advanced Analytics", icon: "🧠", unlocked: this.countByTopic(questions, "Advanced Analytics").solved >= 15 },
      { id: "streak-7", name: "Week Warrior", desc: "Solve problems on 7 different days", icon: "🔥", unlocked: solveDays >= 7 },
    ];
    return defs;
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add js/storage.js
git commit -m "feat: add storage.js localStorage helpers with achievements and streaks"
```

---

### Task 3: Create `js/nav.js` — shared navbar + theme + footer

**Files:**
- Create: `js/nav.js`

Injects the same navbar into every page. Handles theme toggle. Detects current page for active link highlighting.

- [ ] **Step 1: Create `js/nav.js`**

```javascript
/* nav.js — Shared navbar, theme toggle, footer */

const Nav = {
  init() {
    this._injectNav();
    this._injectFooter();
    this._initTheme();
  },

  _injectNav() {
    const currentPage = location.pathname.split("/").pop() || "index.html";
    const nav = document.createElement("nav");
    nav.className = "site-nav";
    nav.innerHTML = `
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">🐘 SQL Practice</a>
        <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <div class="nav-links" id="navLinks">
          <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Home</a>
          <a href="problems.html" class="${currentPage === 'problems.html' ? 'active' : ''}">Problems</a>
          <a href="practice.html" class="${currentPage === 'practice.html' ? 'active' : ''}">Practice</a>
          <a href="progress.html" class="${currentPage === 'progress.html' ? 'active' : ''}">Progress</a>
        </div>
        <button class="nav-theme-toggle" id="themeToggle" aria-label="Toggle theme"></button>
      </div>
    `;
    document.body.prepend(nav);

    // Hamburger toggle
    const hamburger = document.getElementById("navHamburger");
    const links = document.getElementById("navLinks");
    hamburger.addEventListener("click", () => {
      links.classList.toggle("open");
      hamburger.classList.toggle("open");
    });
  },

  _injectFooter() {
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `<p>Built with <a href="https://electric-sql.com/product/pglite" target="_blank">PGlite</a> · PostgreSQL in the browser</p>`;
    document.body.appendChild(footer);
  },

  _initTheme() {
    const theme = Storage.getTheme();
    document.body.classList.add(theme);
    this._updateToggleIcon(theme);

    document.getElementById("themeToggle").addEventListener("click", () => {
      const current = document.body.classList.contains("dark") ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      document.body.classList.remove(current);
      document.body.classList.add(next);
      Storage.setTheme(next);
      this._updateToggleIcon(next);
    });
  },

  _updateToggleIcon(theme) {
    const btn = document.getElementById("themeToggle");
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
};
```

Every page will call `Nav.init()` on load. Requires `storage.js` loaded first (for `Storage.getTheme()`).

- [ ] **Step 2: Commit**

```bash
git add js/nav.js
git commit -m "feat: add nav.js shared navbar with theme toggle and mobile hamburger"
```

---

### Task 4: Create `css/style.css` — shared styles + theming

**Files:**
- Create: `css/style.css`

All shared styles in one file. Uses CSS custom properties for dark/light theming. Pages add page-specific styles in a `<style>` block if needed.

- [ ] **Step 1: Create `css/` directory**

```bash
mkdir -p css
```

- [ ] **Step 2: Create `css/style.css`**

This file must contain:

**A. Reset & base styles**
```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  transition: background-color 0.2s, color 0.2s;
}
a { color: inherit; text-decoration: none; }
```

**B. CSS Variables — dark theme (default)**
```css
body.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --bg-hover: #334155;
  --text-primary: #e2e8f0;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border: #334155;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --success: #22c55e;
  --success-bg: #14532d;
  --success-border: #166534;
  --warning: #f59e0b;
  --warning-bg: #451a03;
  --warning-border: #92400e;
  --danger: #ef4444;
  --danger-bg: #450a0a;
  --danger-border: #991b1b;
  --code-bg: #282a36;
}
```

**C. CSS Variables — light theme**
```css
body.light {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-hover: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #334155;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --success: #16a34a;
  --success-bg: #dcfce7;
  --success-border: #86efac;
  --warning: #d97706;
  --warning-bg: #fef3c7;
  --warning-border: #fcd34d;
  --danger: #dc2626;
  --danger-bg: #fee2e2;
  --danger-border: #fca5a5;
  --code-bg: #f1f5f9;
}
```

**D. Navbar styles**
```css
.site-nav {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 32px;
}
.nav-logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}
.nav-links {
  display: flex;
  gap: 8px;
}
.nav-links a {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: background 0.15s, color 0.15s;
}
.nav-links a:hover { background: var(--bg-hover); color: var(--text-primary); }
.nav-links a.active { background: var(--accent); color: #fff; }
.nav-theme-toggle {
  margin-left: auto;
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-primary);
  transition: background 0.15s;
}
.nav-theme-toggle:hover { background: var(--bg-hover); }
.nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px; flex-direction: column; gap: 5px; }
.nav-hamburger span { display: block; width: 22px; height: 2px; background: var(--text-primary); border-radius: 2px; transition: 0.2s; }

@media (max-width: 768px) {
  .nav-hamburger { display: flex; }
  .nav-links {
    display: none;
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    flex-direction: column;
    padding: 8px;
  }
  .nav-links.open { display: flex; }
  .nav-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
  .nav-hamburger.open span:nth-child(2) { opacity: 0; }
  .nav-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
}
```

**E. Footer styles**
```css
.site-footer {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: var(--text-muted);
  border-top: 1px solid var(--border);
  margin-top: 40px;
}
.site-footer a { color: var(--accent); }
.site-footer a:hover { text-decoration: underline; }
```

**F. Shared utility classes**
```css
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.pill {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}
.pill-easy { background: rgba(34,197,94,0.15); color: var(--success); }
.pill-medium { background: rgba(245,158,11,0.15); color: var(--warning); }
.pill-hard { background: rgba(239,68,68,0.15); color: var(--danger); }
.diff-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.diff-dot.easy { background: var(--success); }
.diff-dot.medium { background: var(--warning); }
.diff-dot.hard { background: var(--danger); }
.topic-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid;
}
.status-icon { display: inline-block; width: 20px; text-align: center; font-size: 14px; }
.progress-bar-track {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
```

**G. Body base**
```css
body {
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}
```

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: add shared stylesheet with CSS variables for dark/light theming"
```

---

### Task 5: Build `index.html` — Home page

**Files:**
- Create: `index.html` (replaces the current redirect or becomes the new root)

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SQL Practice — Master SQL by Doing</title>
  <link rel="stylesheet" href="css/style.css">
  <style>
    .hero {
      text-align: center;
      padding: 60px 24px 40px;
    }
    .hero h1 {
      font-size: 40px;
      font-weight: 800;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .hero p {
      font-size: 18px;
      color: var(--text-muted);
      margin-bottom: 28px;
    }
    .hero-cta {
      display: inline-block;
      background: var(--accent);
      color: #fff;
      padding: 14px 32px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 700;
      transition: background 0.15s;
    }
    .hero-cta:hover { background: var(--accent-hover); }

    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 40px;
      padding: 24px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .stat { text-align: center; }
    .stat-number { font-size: 28px; font-weight: 800; }
    .stat-label { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    .stat-easy .stat-number { color: var(--success); }
    .stat-medium .stat-number { color: var(--warning); }
    .stat-hard .stat-number { color: var(--danger); }

    .topics-section {
      padding: 40px 24px;
    }
    .topics-section h2 {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    .topic-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .topic-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: border-color 0.15s, transform 0.1s;
      border-left: 4px solid;
    }
    .topic-card:hover { border-color: var(--text-muted); transform: translateY(-2px); }
    .topic-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .topic-card .topic-tags { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
    .topic-card .topic-progress-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
  </style>
</head>
<body>
  <div id="app">
    <section class="hero">
      <h1>Master SQL by Doing</h1>
      <p>75 hands-on PostgreSQL problems · Real database in your browser · Instant feedback</p>
      <a href="practice.html" class="hero-cta">Start Practicing →</a>
    </section>

    <div class="stats-bar">
      <div class="stat stat-easy">
        <div class="stat-number" id="statEasy">0/25</div>
        <div class="stat-label">Easy</div>
      </div>
      <div class="stat stat-medium">
        <div class="stat-number" id="statMedium">0/25</div>
        <div class="stat-label">Medium</div>
      </div>
      <div class="stat stat-hard">
        <div class="stat-number" id="statHard">0/25</div>
        <div class="stat-label">Hard</div>
      </div>
    </div>

    <section class="topics-section">
      <h2>Browse by Topic</h2>
      <div class="topic-grid" id="topicGrid"></div>
    </section>
  </div>

  <script src="js/questions.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/nav.js"></script>
  <script>
    Nav.init();

    // Stats bar
    ["Easy", "Medium", "Hard"].forEach(d => {
      const s = Storage.countByDifficulty(Q, d);
      document.getElementById("stat" + d).textContent = s.solved + "/" + s.total;
    });

    // Topic grid
    const grid = document.getElementById("topicGrid");
    const topicTags = {
      "Aggregations & JOINs": "GROUP BY · HAVING · JOINs · Subqueries · EXISTS",
      "Window Functions": "ROW_NUMBER · RANK · DENSE_RANK · LAG · LEAD",
      "Cumulative & Sliding Windows": "Running totals · Moving averages · Frame specs",
      "Consecutive Sequences": "Islands & gaps · Streaks · Sessionization",
      "Advanced Analytics": "Sweep line · Retention · Funnels · Cohort analysis"
    };

    TOPICS.forEach(topic => {
      const stats = Storage.countByTopic(Q, topic);
      const color = TOPIC_COLORS[topic];
      const pct = stats.total ? Math.round(100 * stats.solved / stats.total) : 0;
      const card = document.createElement("a");
      card.href = "problems.html?topic=" + encodeURIComponent(topic);
      card.className = "topic-card";
      card.style.borderLeftColor = color;
      card.innerHTML = `
        <h3>${topic}</h3>
        <div class="topic-tags">${topicTags[topic] || ""}</div>
        <div class="topic-progress-text">${stats.solved}/${stats.total} solved</div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      `;
      grid.appendChild(card);
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

Run `python3 run.py` (or just navigate to `http://localhost:8000/index.html`).
Expected: Hero section renders, stats show 0/25 for each difficulty, 5 topic cards with progress bars, dark/light toggle works, navbar links work (Problems/Practice/Progress will 404 until built).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add home page with hero, stats bar, and topic grid"
```

---

### Task 6: Build `problems.html` — Problem browser

**Files:**
- Create: `problems.html`

- [ ] **Step 1: Create `problems.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Problems — SQL Practice</title>
  <link rel="stylesheet" href="css/style.css">
  <style>
    .problems-page { padding: 24px; max-width: 1000px; margin: 0 auto; }

    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
    }
    .filter-group {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .filter-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-right: 4px;
    }
    .filter-btn {
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s;
    }
    .filter-btn:hover { border-color: var(--text-muted); }
    .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

    .search-bar {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .search-bar::placeholder { color: var(--text-muted); }
    .search-bar:focus { outline: none; border-color: var(--accent); }

    .problem-count {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .topic-group-header {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 12px 0 6px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 4px;
    }

    .problem-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .problem-row:hover { background: var(--bg-hover); }
    .problem-title { flex: 1; font-size: 14px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="problems-page">
    <h1 style="font-size:24px;font-weight:700;margin-bottom:20px;">Problems</h1>

    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">Difficulty:</span>
        <button class="filter-btn active" data-diff="all">All</button>
        <button class="filter-btn" data-diff="Easy">Easy</button>
        <button class="filter-btn" data-diff="Medium">Medium</button>
        <button class="filter-btn" data-diff="Hard">Hard</button>
      </div>
    </div>
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">Topic:</span>
        <button class="filter-btn active" data-topic="all">All</button>
      </div>
    </div>

    <input type="text" class="search-bar" id="search" placeholder="Search problems...">
    <div class="problem-count" id="problemCount"></div>
    <div id="problemList"></div>
  </div>

  <script src="js/questions.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/nav.js"></script>
  <script>
    Nav.init();

    let currentDiff = "all";
    let currentTopic = "all";
    let searchText = "";

    // Add topic filter buttons dynamically
    const topicGroup = document.querySelectorAll(".filter-group")[1];
    TOPICS.forEach(t => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.topic = t;
      btn.textContent = t;
      topicGroup.appendChild(btn);
    });

    // Read URL params
    const params = new URLSearchParams(location.search);
    if (params.get("topic") && TOPICS.includes(params.get("topic"))) {
      currentTopic = params.get("topic");
    }
    if (params.get("difficulty") && ["Easy","Medium","Hard"].includes(params.get("difficulty"))) {
      currentDiff = params.get("difficulty");
    }

    function render() {
      const filtered = Q.filter(q => {
        if (currentDiff !== "all" && q.difficulty !== currentDiff) return false;
        if (currentTopic !== "all" && q.topic !== currentTopic) return false;
        if (searchText && !q.title.toLowerCase().includes(searchText.toLowerCase())) return false;
        return true;
      });

      document.getElementById("problemCount").textContent =
        `Showing ${filtered.length} of ${Q.length} problems`;

      const list = document.getElementById("problemList");
      list.innerHTML = "";

      const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };
      const grouped = {};
      TOPICS.forEach(t => { grouped[t] = []; });
      filtered.forEach(q => { if (grouped[q.topic]) grouped[q.topic].push(q); });

      for (const topic of TOPICS) {
        const qs = grouped[topic];
        if (!qs.length) continue;
        qs.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty] || a.id - b.id);

        const header = document.createElement("div");
        header.className = "topic-group-header";
        header.style.borderLeftColor = TOPIC_COLORS[topic];
        header.textContent = topic + ` (${qs.length})`;
        list.appendChild(header);

        qs.forEach(q => {
          const row = document.createElement("a");
          row.href = "practice.html?id=" + q.id;
          row.className = "problem-row";
          const status = Storage.getStatus(q.id);
          const statusStr = status === "solved" ? "✅" : status === "attempted" ? "✏️" : "○";
          const diffClass = q.difficulty.toLowerCase();
          row.innerHTML = `
            <span class="status-icon">${statusStr}</span>
            <span class="diff-dot ${diffClass}"></span>
            <span class="problem-title">${q.title}</span>
            <span class="pill pill-${diffClass}">${q.difficulty}</span>
          `;
          list.appendChild(row);
        });
      }

      // Update filter button active states
      document.querySelectorAll("[data-diff]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.diff === currentDiff);
      });
      document.querySelectorAll("[data-topic]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.topic === currentTopic);
      });
    }

    // Event listeners
    document.querySelectorAll("[data-diff]").forEach(btn => {
      btn.addEventListener("click", () => { currentDiff = btn.dataset.diff; render(); });
    });
    document.querySelectorAll("[data-topic]").forEach(btn => {
      btn.addEventListener("click", () => { currentTopic = btn.dataset.topic; render(); });
    });
    document.getElementById("search").addEventListener("input", e => {
      searchText = e.target.value;
      render();
    });

    render();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:8000/problems.html`. Expected:
- 75 problems shown, grouped by topic
- Clicking "Easy" filter shows 25 problems
- Clicking a topic name from URL (`?topic=Window+Functions`) pre-selects that filter
- Search "consecutive" filters to matching titles
- Clicking a problem row navigates to `practice.html?id=X`
- Dark/light toggle works

- [ ] **Step 3: Commit**

```bash
git add problems.html
git commit -m "feat: add problems page with difficulty/topic filters and search"
```

---

### Task 7: Build `practice.html` — SQL editor (refactored)

**Files:**
- Create: `practice.html`
- Reference: `sql_practice.html` (copy the engine code, adapt to use shared modules)

This is the core refactoring task. Takes the existing `sql_practice.html` and restructures it to:
1. Load questions from `js/questions.js` instead of inline
2. Use `js/storage.js` for localStorage
3. Use `js/nav.js` for navbar + theme
4. Support URL-driven question loading (`?id=3`)
5. Keep ALL existing functionality: PGlite, CodeMirror, hints, solutions, hidden tests, resizer, prev/next

- [ ] **Step 1: Create `practice.html`**

The HTML structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Practice — SQL Practice</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/codemirror.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/theme/dracula.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/addon/hint/show-hint.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/mode/sql/sql.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/addon/edit/closebrackets.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/addon/comment/comment.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/addon/hint/show-hint.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/addon/hint/sql-hint.min.js"></script>
  <!-- Page-specific styles below -->
</head>
```

The page-specific `<style>` block: copy ALL the practice-specific CSS from `sql_practice.html` lines 16–97 (the `.wrap`, `.left`, `.right`, `.resizer`, `.CodeMirror`, `.verdict`, `.pass`, `.fail`, `.err`, `.bar`, `.tblbox`, `.solution-box`, `.hint-item`, `.hints-bar`, `.filter-bar`, `.filter-btn`, etc. styles). Convert hardcoded colors to use CSS variables where applicable, but keep CodeMirror/Dracula theme colors as-is. Remove the `body` base styles and dark mode overrides (now handled by `style.css` variables). Remove the `.filter-bar`/`.filter-btn` styles from the practice page — they've been removed from the practice UI (filters live on problems.html now).

The `<body>`:
```html
<body>
  <!-- Top bar with back link, question info, nav -->
  <div class="practice-topbar">
    <a href="problems.html" class="back-link">← Problems</a>
    <div class="question-info">
      <span id="qTitle" class="q-title"></span>
      <span id="qBadges"></span>
    </div>
    <div class="topbar-nav">
      <span id="status" class="status-text">starting Postgres…</span>
      <button id="prev" class="sec">← Prev</button>
      <button id="next" class="sec">Next →</button>
    </div>
  </div>

  <div class="wrap">
    <div class="left">
      <div id="desc" class="desc"></div>
      <div id="noteBox"></div>
      <h2>Tables & data</h2>
      <div id="tables"></div>
      <h2>Expected output</h2>
      <div id="expected" class="tblbox"></div>
    </div>
    <div class="resizer" id="resizer"></div>
    <div class="right">
      <div class="bar">
        <button id="run" disabled>Run & Check ▶</button>
        <button id="clear" class="sec">Clear</button>
        <span style="font-size:12px;color:var(--text-muted)">Ctrl/Cmd + Enter to run · Hidden test cases verify your solution</span>
      </div>
      <div id="hintsArea"></div>
      <div id="sql"></div>
      <div id="verdict"></div>
      <div id="result"></div>
      <div id="solutionArea"></div>
    </div>
  </div>

  <script src="js/questions.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/nav.js"></script>
  <script>
    /* ... practice engine code ... */
  </script>
</body>
```

The `<script>` block contains the practice engine. Copy the following functions from `sql_practice.html` and adapt them to use `Storage`:

- `fmtDate`, `disp`, `norm`, `esc`, `tableHTML`, `compare` — copy verbatim from lines 2142–2188
- `showTables` — copy from lines 2190–2202
- `renderHints`, `revealNextHint` — copy from lines 2205–2232
- `loadQuestion` — adapt to use `Storage.getSavedSQL()` instead of direct localStorage, and update URL with `history.replaceState`
- `run` — adapt `markSolved`/`markAttempted` to call `Storage.markSolved(q.id)` / `Storage.markAttempted(q.id)`
- `showSolutionButton` — copy from lines 2365–2376
- `initResizer` — copy from lines 2378–2399
- `main` — adapt: use `Nav.init()`, read `?id=` from URL to select initial question, remove filter logic (no filters on practice page), keep PGlite init and CodeMirror init

Key changes from original:
1. **No filter bar** — filters are on problems.html. Practice just shows the current question.
2. **URL-driven** — `?id=3` loads question with that id. Prev/Next cycle through ALL questions (sorted by topic then difficulty), update URL via `history.replaceState`.
3. **Top bar** — shows question title, difficulty pill, topic pill, back link, prev/next.
4. **Storage API** — replace all direct `localStorage.getItem/setItem` calls with `Storage.*` methods.
5. **Theme** — handled by `nav.js` via `Nav.init()`.

For Prev/Next: build a sorted list of all question indices at startup (sorted by topic order, then difficulty, then id). Navigate through this list.

```javascript
// Question ordering for prev/next
const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };
const sortedQs = [...Q].sort((a, b) => {
  const ti = TOPICS.indexOf(a.topic) - TOPICS.indexOf(b.topic);
  if (ti !== 0) return ti;
  const di = diffOrder[a.difficulty] - diffOrder[b.difficulty];
  if (di !== 0) return di;
  return a.id - b.id;
});

function getQById(id) { return Q.find(q => q.id === id); }

function currentSortedIndex() {
  const id = currentQuestion.id;
  return sortedQs.findIndex(q => q.id === id);
}

function navigateTo(q) {
  currentQuestion = q;
  history.replaceState(null, "", "practice.html?id=" + q.id);
  loadQuestion(q);
}

// Prev/Next handlers
document.getElementById("prev").addEventListener("click", () => {
  const i = currentSortedIndex();
  if (i > 0) navigateTo(sortedQs[i - 1]);
});
document.getElementById("next").addEventListener("click", () => {
  const i = currentSortedIndex();
  if (i < sortedQs.length - 1) navigateTo(sortedQs[i + 1]);
});

// Initial load from URL
const params = new URLSearchParams(location.search);
const startId = parseInt(params.get("id")) || Q[0].id;
currentQuestion = getQById(startId) || Q[0];
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:8000/practice.html`. Expected:
- PGlite starts, "Postgres ready ✓"
- First question loads with table data and expected output
- SQL editor works (type, autocomplete, Ctrl+Enter)
- Run & Check works, hidden tests work
- Hints and solutions work
- Prev/Next cycle through questions, URL updates
- `?id=5` loads question 5 directly
- Draggable resizer works
- Dark/light toggle works
- "← Problems" link goes to problems.html
- Editor content persists in localStorage

- [ ] **Step 3: Commit**

```bash
git add practice.html
git commit -m "feat: add practice page with SQL editor, refactored from single-file app"
```

---

### Task 8: Build `progress.html` — Progress dashboard

**Files:**
- Create: `progress.html`

- [ ] **Step 1: Create `progress.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Progress — SQL Practice</title>
  <link rel="stylesheet" href="css/style.css">
  <style>
    .progress-page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .progress-page h1 { font-size: 24px; font-weight: 700; margin-bottom: 24px; }

    /* Overall stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-card .big-num { font-size: 32px; font-weight: 800; }
    .stat-card .stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

    /* Difficulty bars */
    .diff-section { margin-bottom: 32px; }
    .diff-section h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .diff-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .diff-label { width: 80px; font-size: 14px; font-weight: 600; }
    .diff-track { flex: 1; }
    .diff-count { width: 60px; font-size: 14px; text-align: right; color: var(--text-secondary); }

    /* Topic bars */
    .topic-section { margin-bottom: 32px; }
    .topic-section h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .topic-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .topic-label { width: 220px; font-size: 14px; font-weight: 500; }
    .topic-track { flex: 1; }
    .topic-count { width: 60px; font-size: 14px; text-align: right; color: var(--text-secondary); }

    /* Radar chart */
    .radar-section { margin-bottom: 32px; text-align: center; }
    .radar-section h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .radar-svg { max-width: 320px; margin: 0 auto; }

    /* Achievements */
    .achievements-section h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .badge-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    .badge-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: opacity 0.2s;
    }
    .badge-card.locked { opacity: 0.4; filter: grayscale(1); }
    .badge-icon { font-size: 28px; }
    .badge-info h3 { font-size: 14px; font-weight: 600; }
    .badge-info p { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .badge-card.locked .badge-icon::after { content: " 🔒"; font-size: 14px; }

    @media (max-width: 768px) {
      .topic-label { width: 140px; font-size: 12px; }
      .badge-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="progress-page">
    <h1>Your Progress</h1>

    <div class="stats-grid" id="statsGrid"></div>

    <div class="diff-section">
      <h2>By Difficulty</h2>
      <div id="diffBars"></div>
    </div>

    <div class="topic-section">
      <h2>By Topic</h2>
      <div id="topicBars"></div>
    </div>

    <div class="radar-section">
      <h2>Skill Radar</h2>
      <div id="radarChart"></div>
    </div>

    <div class="achievements-section">
      <h2>Achievements</h2>
      <div class="badge-grid" id="badgeGrid"></div>
    </div>
  </div>

  <script src="js/questions.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/nav.js"></script>
  <script>
    Nav.init();

    const totalSolved = Storage.countSolved(Q);
    const totalPct = Q.length ? Math.round(100 * totalSolved / Q.length) : 0;
    const streak = Storage.getCurrentStreak();

    // --- Stats grid ---
    document.getElementById("statsGrid").innerHTML = `
      <div class="stat-card">
        <div class="big-num" style="color:var(--accent)">${totalSolved}/${Q.length}</div>
        <div class="stat-label">Problems Solved</div>
      </div>
      <div class="stat-card">
        <div class="big-num" style="color:var(--accent)">${totalPct}%</div>
        <div class="stat-label">Completion Rate</div>
      </div>
      <div class="stat-card">
        <div class="big-num" style="color:var(--warning)">${streak}</div>
        <div class="stat-label">Day Streak</div>
      </div>
    `;

    // --- Difficulty bars ---
    const diffBars = document.getElementById("diffBars");
    [
      { name: "Easy", color: "var(--success)" },
      { name: "Medium", color: "var(--warning)" },
      { name: "Hard", color: "var(--danger)" }
    ].forEach(d => {
      const s = Storage.countByDifficulty(Q, d.name);
      const pct = s.total ? Math.round(100 * s.solved / s.total) : 0;
      diffBars.innerHTML += `
        <div class="diff-row">
          <span class="diff-label" style="color:${d.color}">${d.name}</span>
          <div class="diff-track progress-bar-track">
            <div class="progress-bar-fill" style="width:${pct}%;background:${d.color}"></div>
          </div>
          <span class="diff-count">${s.solved}/${s.total}</span>
        </div>
      `;
    });

    // --- Topic bars ---
    const topicBars = document.getElementById("topicBars");
    TOPICS.forEach(t => {
      const s = Storage.countByTopic(Q, t);
      const pct = s.total ? Math.round(100 * s.solved / s.total) : 0;
      const color = TOPIC_COLORS[t];
      topicBars.innerHTML += `
        <div class="topic-row">
          <span class="topic-label">${t}</span>
          <div class="topic-track progress-bar-track">
            <div class="progress-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="topic-count">${s.solved}/${s.total}</span>
        </div>
      `;
    });

    // --- Radar chart (SVG pentagon) ---
    (function renderRadar() {
      const cx = 160, cy = 160, r = 120;
      const n = TOPICS.length;
      const angles = TOPICS.map((_, i) => (Math.PI * 2 * i / n) - Math.PI / 2);

      function point(angle, radius) {
        return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
      }

      // Grid rings
      let gridLines = "";
      [0.25, 0.5, 0.75, 1.0].forEach(frac => {
        const pts = angles.map(a => point(a, r * frac).join(",")).join(" ");
        gridLines += `<polygon points="${pts}" fill="none" stroke="var(--border)" stroke-width="1"/>`;
      });

      // Axis lines
      let axisLines = "";
      angles.forEach(a => {
        const [x, y] = point(a, r);
        axisLines += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`;
      });

      // Data polygon
      const values = TOPICS.map(t => {
        const s = Storage.countByTopic(Q, t);
        return s.total ? s.solved / s.total : 0;
      });
      const dataPts = angles.map((a, i) => point(a, r * values[i]).join(",")).join(" ");

      // Labels
      let labels = "";
      TOPICS.forEach((t, i) => {
        const [x, y] = point(angles[i], r + 24);
        const anchor = x < cx - 10 ? "end" : x > cx + 10 ? "start" : "middle";
        const shortName = t.split(" ")[0]; // First word only for space
        labels += `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="11" fill="var(--text-muted)" font-weight="500">${shortName}</text>`;
      });

      document.getElementById("radarChart").innerHTML = `
        <svg viewBox="0 0 320 320" class="radar-svg">
          ${gridLines}
          ${axisLines}
          <polygon points="${dataPts}" fill="rgba(37,99,235,0.2)" stroke="var(--accent)" stroke-width="2"/>
          ${labels}
        </svg>
      `;
    })();

    // --- Achievements ---
    const badges = Storage.getAchievements(Q);
    const badgeGrid = document.getElementById("badgeGrid");
    badges.forEach(b => {
      badgeGrid.innerHTML += `
        <div class="badge-card ${b.unlocked ? "" : "locked"}">
          <span class="badge-icon">${b.icon}</span>
          <div class="badge-info">
            <h3>${b.name}</h3>
            <p>${b.desc}</p>
          </div>
        </div>
      `;
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:8000/progress.html`. Expected:
- Stats show 0/75, 0%, 0 streak (unless you've solved problems)
- Difficulty bars at 0%
- Topic bars at 0%
- Radar chart renders as empty pentagon outline
- All 13 achievements shown, all locked (grayed)
- Dark/light toggle works

- [ ] **Step 3: Commit**

```bash
git add progress.html
git commit -m "feat: add progress page with stats, radar chart, and achievements"
```

---

### Task 9: Clean up and final integration

**Files:**
- Delete: `sql_practice.html` (after verifying practice.html works)
- Modify: `run.py` (no changes needed — it serves index.html by default)

- [ ] **Step 1: Full integration test**

Open `http://localhost:8000/` in browser. Walk through:
1. **Home** — hero renders, stats show, topic cards link to problems
2. **Click a topic card** → problems.html with that topic pre-filtered
3. **Click a problem** → practice.html with that question loaded
4. **Solve a problem** → verdict shows correct, back to problems shows green check
5. **Check progress** → solved count updates, progress bars move
6. **Dark/light toggle** — works on all 4 pages, persists across navigation
7. **Mobile** — resize to <768px, hamburger works, practice stacks vertically
8. **Prev/Next** on practice page cycles through questions, URL updates
9. **Direct URL** — `practice.html?id=15` loads question 15
10. **Backward compat** — any existing localStorage progress (sql_solved_*, sql_q_*) still works

- [ ] **Step 2: Remove old file**

```bash
git rm sql_practice.html
```

- [ ] **Step 3: Add .gitignore**

```bash
echo ".superpowers/" > .gitignore
echo ".DS_Store" >> .gitignore
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: remove old single-file app, add .gitignore"
```

---

### Task 10: Deploy to GitHub Pages

**Files:**
- None (GitHub configuration)

- [ ] **Step 1: Rename branch to main**

```bash
git branch -m master main
```

- [ ] **Step 2: Create GitHub repository**

```bash
gh repo create sql-practice --public --source=. --push
```

(If `gh` is not available, create the repo manually on github.com, then `git remote add origin <url>` and `git push -u origin main`.)

- [ ] **Step 3: Enable GitHub Pages**

```bash
gh api repos/{owner}/sql-practice/pages -X POST -f source.branch=main -f source.path=/
```

Or manually: GitHub repo → Settings → Pages → Source: Deploy from branch → Branch: main, folder: / (root) → Save.

- [ ] **Step 4: Verify deployment**

Wait 1-2 minutes, then open `https://{username}.github.io/sql-practice/`. All 4 pages should work, PGlite should start, dark/light toggle should persist.

- [ ] **Step 5: Commit any deployment fixes**

If GitHub Pages needs a base path adjustment or any links need fixing, commit those changes and push.
