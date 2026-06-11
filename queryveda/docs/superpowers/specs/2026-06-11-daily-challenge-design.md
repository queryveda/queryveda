# Daily SQL Challenge — Design Spec

**Date:** 2026-06-11
**Status:** Approved

## Overview

Add a "Daily SQL Challenge" feature to QueryVeda. Every day at 9:00 AM IST, a new medium-difficulty PostgreSQL question is AI-generated via a GitHub Action, committed as a static JSON file, and deployed. Users see the challenge on the home page with a countdown to the next refresh and can solve it with a user-selected timer.

## Architecture: Fully Static with GitHub Action

### Why This Approach

- Fits the existing static export (`output: 'export'`) architecture
- No runtime API calls or serverless functions needed
- All users see the same question
- API key stays in GitHub Secrets (no client exposure)
- Leverages existing GitHub Actions deploy pipeline

## 1. GitHub Action — Daily Question Generator

**File:** `.github/workflows/daily-question.yml`

- **Schedule:** `cron: '30 3 * * *'` (3:30 UTC = 9:00 IST)
- **Also:** `workflow_dispatch` for manual triggers
- **Steps:**
  1. Checkout repo
  2. Call Claude API with a structured prompt requesting a medium-difficulty PostgreSQL question
  3. The prompt instructs Claude to generate a question matching the `Question` interface shape (title, difficulty, topic, desc, setup SQL, tables, cols, rows, solution, tips, hints, tests)
  4. Parse and validate the JSON response — ensure all required fields are present
  5. Write to `public/daily-question.json` with wrapper: `{ "date": "YYYY-MM-DD", "question": { ... } }`
  6. Commit and push — triggers existing deploy workflow
- **Secrets required:** `ANTHROPIC_API_KEY`

### JSON Structure

```json
{
  "date": "2026-06-11",
  "question": {
    "title": "string",
    "difficulty": "Medium",
    "topic": "string (one of 5 topics)",
    "desc": "string (problem description)",
    "setup": "string (CREATE TABLE + INSERT SQL)",
    "tables": ["string"],
    "cols": ["string"],
    "rows": [["values"]],
    "solution": "string (SQL solution)",
    "tips": "string (optimization tips)",
    "hints": ["string (progressive hints)"],
    "tests": [{ "setup": "string", "cols": ["string"], "rows": [["values"]] }]
  }
}
```

## 2. Home Page — Daily Challenge Section

**Position:** Between Hero and Features sections in `app/page.tsx`.

### Layout

Gradient-bordered card (consistent with existing feature cards):

- **Header:** "Daily SQL Challenge" + calendar/flame icon + today's date
- **Two timers side by side:**
  - Left: "Next Question In" — live countdown (hh:mm:ss) to 9:00 AM IST
  - Right: "Solve Timer" — shows selected duration or active countdown
- **Question preview:** Title + truncated description (~2 lines)
- **Difficulty badge:** Always "Medium" (orange)
- **Timer selector:** Dropdown with 15 / 30 / 45 minute options
- **CTA button:** "Start Challenge" → navigates to `/daily` and starts solve timer

### States

1. **Default:** Question preview visible, timer selector shown, "Start Challenge" button
2. **Challenge started (same day):** Button changes to "Continue Challenge", solve timer resumes
3. **Challenge solved (same day):** Success indicator shown, "View Solution" link
4. **Question loading/stale:** "Today's challenge is being prepared" with countdown only

## 3. Daily Challenge Page (`/daily`)

**File:** `app/daily/page.tsx`

### Layout

Same split-pane layout as `/practice/[id]`:

- **Left panel:** Problem description, schema tables, expected output (reuses `ProblemPanel`)
- **Right panel:** SQL editor (reuses `SQLEditor`), run button, result table, hints, solution

### Top Bar

- Title: "Daily Challenge — [formatted date]"
- Solve timer (prominent, countdown, top-right)
- "Next question in" countdown (smaller, beside solve timer)

### Timer Behavior

- Solve timer starts when user clicks "Start Challenge" (on home page or daily page)
- Timer persists across page reloads via localStorage
- **On expiry:** Yellow/orange "Time's up!" banner animates in at top of page. Dismissible. Editor and run button remain fully functional.
- Timer shows 00:00 after expiry (does not go negative)

### Test Runner

- Reuses `runTests` from `lib/pglite.ts`
- Same pass/fail display as practice questions
- On solve: saves `daily_solved_<YYYY-MM-DD>` to localStorage

### Edge Cases

- No prev/next navigation (single question per day)
- If `daily-question.json` is missing or date doesn't match today: show "Today's challenge is being prepared" with countdown timer to next refresh
- No auth required — open to all users (matches Easy question access pattern)

## 4. Components & Files

### New Files

| File | Purpose |
|------|---------|
| `.github/workflows/daily-question.yml` | Cron workflow to generate daily question |
| `public/daily-question.json` | Generated question file (created by CI) |
| `app/daily/page.tsx` | Daily challenge page |
| `components/daily/daily-hero-card.tsx` | Home page Daily Challenge card |
| `components/daily/countdown-timer.tsx` | Reusable countdown timer component |
| `components/daily/time-up-banner.tsx` | Dismissible "Time's up!" banner |
| `lib/daily.ts` | Fetch question, localStorage helpers, time calculations |

### Modified Files

| File | Change |
|------|--------|
| `app/page.tsx` | Insert `DailyHeroCard` between Hero and Features |
| `lib/types.ts` | Add `DailyQuestion` type |
| `components/layout/navbar.tsx` | Add "Daily" nav link |

## 5. localStorage Schema

| Key | Value | Purpose |
|-----|-------|---------|
| `daily_challenge_date` | `"YYYY-MM-DD"` | Track which day's challenge is active |
| `daily_challenge_started` | ISO timestamp | When user clicked Start |
| `daily_challenge_duration` | `15 \| 30 \| 45` | Selected timer duration in minutes |
| `daily_challenge_solved` | `"true"` | Whether today's challenge was solved |
| `daily_challenge_sql` | SQL string | Saved editor content for today |

All keys reset when `daily_challenge_date` doesn't match today.

## 6. Countdown Timer Logic

### Next Question Countdown

- Target: Next 9:00 AM IST (UTC+5:30)
- If current time is before 9:00 AM IST → countdown to today's 9:00 AM IST
- If current time is after 9:00 AM IST → countdown to tomorrow's 9:00 AM IST
- Updates every second via `setInterval`

### Solve Timer

- Starts from user-selected duration (15/30/45 min)
- Calculates remaining time from: `duration - (now - started_at)`
- If remaining <= 0: shows "00:00:00" and triggers "Time's up!" banner
- Updates every second via `setInterval`
- Persists via localStorage timestamps (survives page reload)

## 7. No Auth Requirement

The daily challenge is fully accessible without login, matching the Easy question access pattern. Progress is localStorage-only (no Supabase sync for daily challenges).
