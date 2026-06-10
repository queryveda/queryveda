# QueryVeda — Next.js Rebuild Design Spec

## Overview

Rebuild QueryVeda (SQL practice platform) from vanilla HTML/CSS/JS to a Next.js static site. The app runs 75 PostgreSQL practice problems in-browser via PGlite WASM, with Supabase auth and progress sync. Targeting GitHub Pages deployment (static export), with future move to custom domain.

## Goals

- LeetCode/StrataScratch-style polished UI
- Mobile-first responsive design
- Component-based architecture for maintainability
- Static export compatible with GitHub Pages
- Preserve all existing functionality
- Future-ready for About, Blog, and Projects sections

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | Static export, file-based routing, MDX support |
| Language | TypeScript | Type safety for question data, component props |
| Styling | Tailwind CSS v4 | Mobile-first utilities, dark mode, small bundle |
| Components | shadcn/ui | Polished, accessible, LeetCode-style aesthetic |
| Editor | CodeMirror 6 | Modular, better mobile support than CM5, SQL mode |
| Database | PGlite (WASM) | In-browser PostgreSQL, no server needed |
| Auth | Supabase | Google, LinkedIn, email/password login |
| Storage | localStorage + Supabase | Offline-first with cloud sync |
| Theme | next-themes | Dark/light toggle with system preference |
| Blog (future) | MDX via @next/mdx | Markdown with React components |

## Project Structure

```
queryveda/
├── app/
│   ├── layout.tsx              # Root layout: providers, navbar, footer
│   ├── page.tsx                # Landing page (hero, features, CTA)
│   ├── practice/
│   │   └── [id]/page.tsx       # Problem editor + runner
│   ├── problems/page.tsx       # Problem list with filters
│   ├── progress/page.tsx       # Dashboard, stats, achievements
│   ├── leaderboard/page.tsx     # Ranked leaderboard
│   ├── about/page.tsx          # Placeholder for future
│   ├── projects/page.tsx       # Placeholder for future
│   └── blog/                   # Future MDX blog
├── components/
│   ├── ui/                     # shadcn/ui primitives (button, card, badge, etc.)
│   ├── layout/
│   │   ├── navbar.tsx          # Responsive nav: horizontal on lg+, hamburger on mobile
│   │   ├── footer.tsx          # Site footer
│   │   ├── mobile-drawer.tsx   # Slide-out nav drawer
│   │   └── theme-toggle.tsx    # Dark/light switch
│   ├── practice/
│   │   ├── sql-editor.tsx      # CodeMirror 6 wrapper with SQL mode + autocomplete
│   │   ├── test-runner.tsx     # PGlite execution, result comparison, pass/fail display
│   │   ├── problem-panel.tsx   # Problem description, schema, examples
│   │   ├── result-table.tsx    # Query output table
│   │   ├── hints-panel.tsx     # Progressive hint reveal
│   │   ├── solution-panel.tsx  # Reference solution with tips
│   │   └── split-pane.tsx      # Resizable split (horizontal desktop, stacked mobile)
│   ├── problems/
│   │   ├── problem-card.tsx    # Card for mobile list view
│   │   ├── problem-table.tsx   # Table for desktop list view
│   │   ├── filter-bar.tsx      # Difficulty + topic filter buttons
│   │   └── search-input.tsx    # Problem search
│   ├── progress/
│   │   ├── stats-cards.tsx     # Solved count, streak, completion %
│   │   ├── progress-bars.tsx   # By difficulty and topic
│   │   ├── skill-radar.tsx     # SVG pentagon chart
│   │   └── achievements.tsx    # Badge grid with unlock states
│   └── auth/
│       ├── auth-modal.tsx      # Login/signup modal
│       ├── auth-provider.tsx   # Supabase session context
│       └── protected-route.tsx # Auth gate for progress page
├── lib/
│   ├── questions.ts            # Typed array of 75 problems
│   ├── types.ts                # Question, TestCase, UserProgress types
│   ├── supabase.ts             # Supabase client (browser-only)
│   ├── storage.ts              # localStorage + Supabase sync logic
│   ├── pglite.ts               # PGlite init, query execution, teardown
│   └── constants.ts            # Difficulty colors, topic names, achievements
├── hooks/
│   ├── use-pglite.ts           # PGlite instance lifecycle
│   ├── use-storage.ts          # Read/write progress with sync
│   ├── use-filters.ts          # Difficulty/topic filter state
│   ├── use-auth.ts             # Supabase auth state
│   └── use-protection.ts       # Anti-scraping & copy protection
├── public/
│   ├── pglite/                 # WASM + data files (copied from current project)
│   └── favicon.png
├── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── next.config.js              # output: 'export', images: { unoptimized: true }
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Pages

### Landing Page (`/`)

- Hero section: tagline, brief description, "Start Practicing" CTA
- Feature highlights: 75 problems, in-browser PostgreSQL, progress tracking
- Topic overview cards
- Clean, modern design with gradient accents

### Problems Page (`/problems`)

- **Desktop (md+):** Table layout with columns: #, Title, Difficulty, Topic, Status
- **Mobile:** Card layout with title, difficulty badge, topic tag, status icon
- Filter bar: All/Easy/Medium/Hard buttons + 5 topic buttons
- Search input for problem title
- Difficulty color coding: Easy=green, Medium=orange, Hard=red
- Status indicators: solved (green check), attempted (yellow dot), todo (gray)
- Click navigates to `/practice/[id]`

### Practice Page (`/practice/[id]`)

- **Desktop (md+):** Resizable horizontal split pane
  - Left: Problem description, schema table, example I/O
  - Right: CodeMirror editor (top), results panel (bottom)
- **Mobile:** Stacked vertical layout
  - Problem description (collapsible)
  - Editor (full width, minimum 200px height)
  - Results below editor
- Toolbar: Run (Cmd+Enter), Clear, Hints, Solution, Prev/Next
- Test results: pass/fail per test case with expected vs actual
- Editor features: SQL syntax highlighting, schema-aware autocomplete, auto-close brackets, Cmd+/ comment toggle
- Editor content auto-saved to localStorage on every change
- Restored from localStorage on page load

### Progress Page (`/progress`) — Auth-gated

- 3 stat cards: Total solved (out of 75), Completion %, Current streak
- Progress bars grouped by difficulty (Easy/Medium/Hard)
- Progress bars grouped by topic (5 topics)
- Skill radar: SVG pentagon chart showing % completion per topic
- Achievement badges: 14 badges with locked/unlocked states
- Login prompt if not authenticated

## Authentication

- Supabase Auth with 3 providers: Google OAuth, LinkedIn OAuth, Email/Password
- Modal-based UI (not a separate page)
- Session persisted in Supabase, checked on mount via `onAuthStateChange`
- Auth state available via React context (`AuthProvider`)
- Protected routes redirect to login modal
- Progress synced to Supabase on login, merged with localStorage

## Data Model

### Question Type

```typescript
interface Question {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: 'Aggregations & JOINs' | 'Window Functions' | 'Cumulative & Sliding Windows' | 'Consecutive Sequences' | 'Advanced Analytics';
  desc: string;          // Problem description (plain text with line breaks)
  setup: string;         // SQL to create tables and insert data
  tables: string[];      // Table names used
  cols: string[];        // Expected output column names
  rows: any[][];         // Expected output rows
  solution: string;      // Reference SQL solution
  tips: string;          // Performance/optimization tips
  hints: string[];       // Progressive hints (3 levels)
  tests: TestCase[];     // Additional hidden test cases
}

interface TestCase {
  setup: string;         // Override setup SQL for this test
  rows: any[][];         // Expected output for this test
}
```

### Storage Keys (backward compatible)

- `sql_solved_{id}` — boolean, problem solved
- `sql_attempted_{id}` — boolean, problem attempted
- `sql_q_{id}` — string, saved editor content
- `sql_solve_dates` — JSON array of date strings for streak calc
- `theme` — 'dark' | 'light'

## Mobile-First Responsive Design

### Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|---------------|
| Default | < 640px | Single column, cards, hamburger nav, stacked editor |
| `sm` | 640px | Minor spacing adjustments |
| `md` | 768px | Split pane editor, table view for problems |
| `lg` | 1024px | Horizontal navbar, wider content area |
| `xl` | 1280px | Max-width container, comfortable spacing |

### Key Mobile Considerations

- All tap targets minimum 44px
- Hamburger menu with slide-out drawer (animated)
- Problem description collapsible on practice page to maximize editor space
- Editor minimum height 200px on mobile
- Results table horizontally scrollable on narrow screens
- Filter bar: horizontal scroll on mobile, wrapped on desktop
- No hover-dependent interactions (all accessible via tap)
- Touch-friendly resizer handle on split pane (hidden on mobile, stacked layout instead)

## Dark/Light Theme

- Powered by `next-themes` with `class` strategy
- Tailwind `dark:` variant for all components
- System preference detection with manual override
- Theme persisted to localStorage (key: `theme`)
- shadcn/ui components respect theme automatically via CSS variables

## Static Export Configuration

```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === 'production' ? '/sql_compiler' : '',
  trailingSlash: true,
};
```

- `output: 'export'` generates static HTML/CSS/JS in `out/` directory
- `basePath` set for GitHub Pages repo URL (`username.github.io/sql_compiler`)
- `trailingSlash` for GitHub Pages compatibility
- `images.unoptimized` since no server-side image optimization
- PGlite WASM files served from `public/pglite/`

## GitHub Pages Deployment

- GitHub Actions workflow: build on push to main, deploy `out/` to gh-pages branch
- `.nojekyll` file in output to prevent Jekyll processing
- `404.html` copied from `index.html` for client-side routing fallback

## Migration Checklist

1. Port `js/questions.js` (75 problems) to typed `lib/questions.ts`
2. Copy `pglite/` directory to `public/pglite/`
3. Extract Supabase credentials to `.env.local`
4. Port PGlite initialization logic to `lib/pglite.ts`
5. Port storage/sync logic to `lib/storage.ts` (keep same localStorage keys)
6. Port auth logic to `lib/supabase.ts` + `hooks/use-auth.ts`
7. Rebuild all UI as React components with Tailwind
8. Verify all 75 problems work with PGlite in new setup
9. Test on mobile devices / responsive mode
10. Set up GitHub Actions for static deployment

## Anti-Scraping & Copy Protection

- Disable right-click context menu on all pages
- Disable text selection except inside CodeMirror editor
- Block common dev tools shortcuts (Ctrl+Shift+I, Ctrl+U, F12)
- Disable copy/paste outside of the editor
- Implemented as a `useProtection()` hook applied in root layout

## Leaderboards & Social Features

- **Leaderboard Page (`/leaderboard`):** Ranked table of users by problems solved, streak, and completion %
- Data stored in Supabase `profiles` table (public read, auth write)
- Columns: Rank, Avatar, Username, Problems Solved, Streak, Completion %
- Filterable by time period (All Time, This Month, This Week)
- Current user highlighted in the table
- **Social:** Share buttons on practice page (share problem link to Twitter/LinkedIn)
- Profile display: username + avatar from OAuth provider shown in navbar

## Out of Scope (for initial rebuild)

- Blog content (structure only, no posts)
- About page content (placeholder)
- Projects page content (placeholder)
- Service worker / offline mode
