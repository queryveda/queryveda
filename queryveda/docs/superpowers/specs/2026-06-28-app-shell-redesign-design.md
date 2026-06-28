# QueryVeda App Shell Redesign — Design Spec

**Date:** 2026-06-28
**Goal:** Replace the standard navbar+content+footer layout with a distinctive app-shell architecture that breaks the "every AI-built website looks the same" pattern. Target audience: Gen Z edtech users.

---

## Scope

### In scope (key brand surfaces)
- App shell: sidebar (desktop) + floating dock (mobile) replacing navbar + footer
- Home page: bento dashboard replacing marketing landing page
- Skill tree page: two-panel layout (desktop), bottom-sheet detail (mobile)

### Out of scope (unchanged)
- Practice IDE page (functional tool, not a brand surface — only change: sidebar stays collapsed, dock hidden)
- Problems list, Leaderboard, Progress, About, Onboarding pages (just re-wrapped in new shell)
- Color palette (purple/violet theme stays, all CSS custom properties unchanged)
- Auth flow (same modal-based approach)
- All functionality (daily challenge, review queue, next-question, spaced repetition — zero feature changes)

---

## 1. App Shell — Layout Architecture

### The structural change

Replace `Navbar (top) → Content → Footer (bottom)` with a persistent app shell.

**Current layout.tsx pattern:**
```
ThemeProvider > AuthProvider > ProtectionWrapper + Navbar + <main>{children}</main> + Footer
```

**New layout.tsx pattern:**
```
ThemeProvider > AuthProvider > ProtectionWrapper + AppShell(Sidebar + <main>{children}</main>) + MobileDock
```

Footer is removed entirely (was just one line: "QueryVeda - Built with PGlite - PostgreSQL in the browser").

### Desktop (lg+ breakpoint)

```
+--------+-------------------------------+
|        |                               |
| Side   |        Content Area           |
| bar    |      (full viewport height,   |
|        |       scrollable)             |
| 64px   |                               |
| wide   |                               |
|        |                               |
| (icon  |                               |
| rail,  |                               |
| expand |                               |
| on     |                               |
| hover) |                               |
|        |                               |
+--------+-------------------------------+
```

- Content area: `ml-16` (64px left margin for collapsed sidebar), `min-h-screen`, scrolls independently
- No top navbar, no footer

### Mobile (<lg breakpoint)

```
+-------------------------------+
|                               |
|        Content Area           |
|      (full height,            |
|       scrollable)             |
|                               |
|                               |
+-------------------------------+
|   H   L   D   P   Me         |
|      Floating Dock            |
+-------------------------------+
```

- Content area: `pb-20` (space for dock)
- No sidebar visible

---

## 2. Sidebar (Desktop) — Detail Design

### Collapsed state (default, 64px wide)

```
+--------+
|   QV   |   <- Logo mark ("QV" monogram or small icon)
|        |
|   H    |   Home
|   S    |   Learn SQL
|   E    |   Learn Excel
|   D    |   Daily
|   P    |   Problems
|   Pr   |   Progress
|   L    |   Leaderboard
|        |
|        |   <- flexible spacer (flex-1)
|        |
|   U    |   Profile (avatar)
|   ?    |   Help/Tour
|   T    |   Theme toggle
+--------+
```

- Icons centered in the rail, each in a 40x40px hit area
- Active page: pill-shaped highlight `bg-primary/15` behind icon + 3px-wide vertical bar on left edge (like Discord's active server indicator)
- Inactive: `text-muted-foreground`, hover → `text-foreground`
- Tooltip on hover showing the label (for discoverability)

### Expanded state (on hover, 220px wide)

```
+----------------------+
|  QueryVeda           |   <- Full logo text slides in
|                      |
|  [H]  Home           |
|  [S]  Learn SQL      |
|  [E]  Learn Excel    |
|  [D]  Daily      *   |   <- dot indicator if unattempted
|  [P]  Problems       |
|  [Pr] Progress       |
|  [L]  Leaderboard    |
|                      |
|                      |
|  [av] Saibal         |   <- avatar + name
|  [?]  Help           |
|  [T]  Dark mode  [=] |   <- toggle switch inline
+----------------------+
```

### Animation

- Width transition: 200ms ease-out
- Labels: fade-in with 50ms delay after width starts expanding (avoids text clipping during transition)
- Expanded sidebar **overlays** content (doesn't push it) — avoids layout shift. Uses `position: fixed` with appropriate z-index.

### Behavior rules

- Expands on `mouseenter`, collapses on `mouseleave`
- On practice IDE page: stays collapsed permanently (no hover expand) — just icons with tooltips, maximizes editor space
- `backdrop-blur-sm` and slight transparency on expanded state
- Keyboard shortcut: `Cmd+B` / `Ctrl+B` toggles between pinned-open and hover-mode

### Styling

- Background: `bg-card/95 backdrop-blur-sm`
- Right border: `border-r border-border`
- `z-50` to sit above content

---

## 3. Floating Dock (Mobile) — Detail Design

### Appearance

```
            +-------------------------------+
            |   H    L    D    Pr    Me     |
            +-------------------------------+
                  ^ floats 12px above bottom
```

- **Pill-shaped**: `rounded-full`
- **Floating**: 16px horizontal margin, 12px bottom margin (not flush with screen edge)
- **Glass effect**: `bg-background/70 backdrop-blur-xl border border-border/50`
- **Shadow**: subtle `shadow-lg` for depth
- **5 items only**: Home, Learn, Daily, Progress, Profile

### Active state

- Active icon: `text-primary` with a 4px glowing dot beneath (using `bg-primary shadow-[0_0_6px] shadow-primary/50`)
- Inactive: `text-muted-foreground`

### Items NOT in the dock

- Problems, Leaderboard, Help, Theme toggle — accessible from Profile page
- This keeps the dock clean with large tap targets

### "Learn" item behavior

- Tap: opens user's selected track (SQL or Excel)
- The track switcher lives on the skill tree page itself, not in the dock

### Interaction rules

- **Auto-hide on scroll down**, reappear on scroll up (saves mobile screen real estate)
- **Hidden entirely** on practice IDE page (IDE has its own navigation)
- **Safe area padding**: `pb-[env(safe-area-inset-bottom)]` for notched phones

---

## 4. Home Page — Bento Dashboard

### Logged-in layout (desktop)

```
+---------------------------------------------+
|  Good evening, Saibal              June 28   |
|  3-day streak - 42 problems solved           |
+----------------------+----------------------+
|                      |                      |
|   Daily Challenge    |   Your Progress      |
|                      |                      |
|   Today's question   |   ####-- 42/120      |
|   "Find the second   |   SQL: 38  Excel: 4  |
|    highest salary"   |                      |
|                      |   Streak: 3 days     |
|   [Solve Now]        |                      |
|                      |                      |
+----------------------+----------+-----------+
|                      |          |           |
|   Review Queue       |  Rank    |  Next     |
|                      |          |  Question |
|   3 items due        |  #12 of  |           |
|   2 hard, 1 medium   |  89      |  JOINs:   |
|                      |          |  Q14      |
|   [Review Now]       |          |  [Go]     |
|                      |          |           |
+----------------------+----------+-----------+
|                                             |
|   Skill Trees                               |
|   +---------+ +---------+                   |
|   |  SQL    | |  Excel  |                   |
|   | ####--  | | ##----  |                   |
|   |  63%    | |  22%    |                   |
|   +---------+ +---------+                   |
|                                             |
+---------------------------------------------+
```

### Grid system

Using CSS Grid with named areas:

```css
grid-template-columns: 1fr 1fr;
grid-template-rows: auto auto auto auto;
```

Row 1: Greeting header — spans full width
Row 2: Daily Challenge (1fr) + Progress (1fr) — **large cards**, primary engagement drivers
Row 3: Review Queue (1fr) + Rank (0.5fr) + Next Question (0.5fr) — **medium + small cards**
Row 4: Skill Trees — spans full width, contains two side-by-side cards

### Card styling

- Subtle gradient border using existing `--qv-gradient-card` approach
- Soft shadow: `shadow-sm` default, `shadow-md` on hover with slight `translate-y-[-1px]` lift
- Background: `bg-card`
- Border radius: `rounded-2xl` (keep existing)
- Subtle background noise/grain texture via a CSS pseudo-element with a noise SVG — very faint, just enough to break the flat look

### Conditional cards

- **Review Queue**: only shown if user has items due for review (existing logic)
- **Next Question**: only shown if recommendation exists
- When these are hidden, the grid reflows — Rank card expands or the row collapses

### Logged-out layout

Same bento structure but with modified content:
- **Daily Challenge**: shows question text but blurs the solve area, CTA: "Sign in to solve"
- **Progress**: replaced with "Start your journey" teaser card showing sample progress
- **Review Queue + Rank + Next**: replaced with a single "Why QueryVeda" card spanning the full row, showing 3 bullet features
- **Skill Trees**: still visible and browsable — users can explore before signing in

### Mobile layout (single column stack)

1. Greeting + streak (compact, not a full hero section)
2. Daily Challenge (full width, prominent)
3. Progress + Rank (side by side, each 50% width)
4. Review Queue (full width)
5. Next Question (full width, compact)
6. Skill Trees (horizontal scroll, two cards)

Order prioritizes daily engagement drivers at the top.

---

## 5. Skill Tree Page — Two-Panel Redesign

### Desktop layout

```
+--------+--------------------------+--------------+
|        |                          |              |
| Side   |     Skill Tree Map       | Node Detail  |
| bar    |                          | Panel        |
|        |   o---o---*              |              |
|        |        \                 | "JOINs"      |
|        |         o---o            | 4/6 solved   |
|        |              \           |              |
|        |               o          | [Continue]   |
|        |                          |              |
|        +--------------------------+              |
|        |  You are here: JOINs     |              |
|        |  Next: Subqueries        |              |
+--------+--------------------------+--------------+
```

- **Left panel** (~65% width): skill tree visualization, scrollable/pannable
- **Right panel** (~35% width): node detail, slides content in when a node is clicked
- **Bottom bar** on tree panel: shows current position and next suggestion (ties into existing `getNextQuestion` logic)

### Skill tree visual style

- **Completed nodes**: solid `bg-primary` fill
- **In-progress nodes**: ring with progress arc (partial fill)
- **Locked/future nodes**: `bg-muted` with dashed connecting lines
- **User's path**: faint purple trail connecting completed nodes (subtle glow using `shadow-primary/20`)

### Node detail panel content

- Topic name (heading)
- Progress bar (X/Y solved)
- Difficulty badge
- List of questions in the node (with solved/unsolved indicators)
- Prominent [Continue] CTA button

### Track switcher

- Small pill toggle at top of tree view: `[SQL | Excel]`
- Crossfade animation when switching
- Remembers selection via existing `track-storage.ts`

### Mobile layout

- Full-screen skill tree (scrollable, pannable)
- Tapping a node opens detail as a **bottom sheet**:
  - Slides up from bottom
  - Default: half-screen height
  - Draggable to full screen
  - Has a drag handle bar at top
  - Familiar pattern from Maps, Instagram, etc.
- Track switcher pill sits at the top of the screen

---

## 6. Implementation Components

### New components to create

| Component | Path | Purpose |
|---|---|---|
| `AppShell` | `components/layout/app-shell.tsx` | Wraps sidebar + content area, replaces navbar+footer in layout.tsx |
| `Sidebar` | `components/layout/sidebar.tsx` | Desktop sidebar with collapse/expand behavior |
| `MobileDock` | `components/layout/mobile-dock.tsx` | Floating bottom dock for mobile |
| `BentoDashboard` | `components/home/bento-dashboard.tsx` | Home page bento grid for logged-in users |
| `BentoCard` | `components/home/bento-card.tsx` | Reusable card component with gradient border and hover lift |
| `DashboardGreeting` | `components/home/dashboard-greeting.tsx` | Greeting header with streak/stats |
| `SkillTreePanel` | `components/learn/skill-tree-panel.tsx` | Right-side detail panel for skill tree |
| `NodeBottomSheet` | `components/learn/node-bottom-sheet.tsx` | Mobile bottom sheet for node detail |

### Components to modify

| Component | Change |
|---|---|
| `app/layout.tsx` | Replace navbar+footer with AppShell |
| `app/page.tsx` | Replace hero+sections with BentoDashboard |
| `components/layout/navbar.tsx` | Remove (replaced by Sidebar). Migrate auth state display (avatar, sign-in/out), shared profile detection (`useSearchParams` for `?token=`), and daily challenge unattempted indicator to the new Sidebar component. |
| `components/layout/footer.tsx` | Remove (not needed) |
| `app/learn/page.tsx` | Add two-panel layout |
| `app/globals.css` | Add noise texture utility, dock glass styles |

### Components to keep unchanged

All practice, problems, progress, leaderboard, profile, about, onboarding, and auth components remain as-is. They just render inside the new AppShell instead of below the navbar.

---

## 7. Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `< lg` (mobile/tablet) | No sidebar. Floating dock visible. Single-column bento. Skill tree bottom sheet. |
| `>= lg` (desktop) | Sidebar visible (64px collapsed). No dock. Two-column bento. Skill tree two-panel. |

Single breakpoint keeps things simple. The `lg` breakpoint (1024px) is the same one currently used for the navbar's mobile/desktop switch.

---

## 8. Animations & Transitions

| Element | Animation | Duration |
|---|---|---|
| Sidebar expand/collapse | Width transition | 200ms ease-out |
| Sidebar labels | Fade in/out | 150ms, 50ms delay on expand |
| Dock auto-hide/show | Translate Y | 300ms ease-out |
| Bento card hover | Shadow + translateY(-1px) | 150ms ease |
| Node detail panel (desktop) | Content slide from right | 200ms ease-out |
| Bottom sheet (mobile) | Slide up from bottom | 250ms ease-out |
| Track switcher | Crossfade | 200ms |

All animations respect `prefers-reduced-motion` — disabled when the user has motion reduction enabled.
