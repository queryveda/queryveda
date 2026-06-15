# First-Time Experience Redesign

**Date:** 2026-06-15
**Status:** Approved

## Problem

QueryVeda's home page sends all users to `/problems` via a single "Start Practicing" CTA. There's no guidance for beginners, no way to try the platform before signing in, and returning users get no nudge toward the daily challenge. This redesign improves the first-time experience and re-engagement loop.

## Design

### 1. Hero Section Rewrite

**Current:** "Master SQL by Doing" + "75 PostgreSQL practice problems running entirely in your browser. No server, no setup, instant feedback." + "Start Practicing" button.

**New:**
- Headline: **"Go from SQL Zero to Interview Ready"**
- Subtitle: **"Structured lessons + 75 practice problems. No installations."**
- No CTA button in the hero — the two-path cards below serve as the primary action area.

### 2. Home Page Layout

Order from top to bottom:

1. **Hero** — headline + subtitle, gradient background (existing)
2. **Two-Path Cards** — side-by-side equal-weight cards:
   - **Learn SQL** card:
     - Book icon
     - Title: "Learn SQL"
     - Description: "Step-by-step skill tree with interactive micro-exercises"
     - Mini skill tree preview: 4 small circles (first completed, second in-progress, rest locked) showing the progression concept
     - CTA button: "Start Learning" → `/learn`
   - **Practice Problems** card:
     - Target icon
     - Title: "Practice Problems"
     - Description: "75 curated challenges across 5 topics"
     - Difficulty badges: Easy (green), Medium (amber), Hard (red)
     - CTA button: "Start Practicing" → `/problems`
   - Cards use the existing `border` + `bg-card` styling, with a subtle primary-tinted border on hover
   - On mobile: stack vertically, Learn on top
3. **Daily Challenge** card — the existing `DailyHeroCard` component, moved below the two-path cards
4. **Features line** — the existing subtle inline text: "75 curated problems · In-browser PostgreSQL · Progress tracking & streaks"
5. **Topics section removed** — the Practice card replaces the topic grid as the entry point to `/problems`

### 3. Anonymous Trial (Skill Tree)

Allow unauthenticated users to try micro-exercises from the skill tree without signing in.

**Rules:**
- Anonymous users can navigate to `/learn` and open any unlocked node
- They can attempt exercises — the SQL editor is functional, Run button works, PGlite executes the query, pass/fail feedback shows
- Progress is NOT saved to localStorage or Supabase for anonymous users
- After completing 1 exercise OR clicking Run on a 2nd exercise, show the `AuthModal` with the message: "Sign in to save your progress"
- If they dismiss the modal, they can keep trying exercises in the current session but progress won't persist
- The existing practice page auth gates remain unchanged (Easy = view only, Medium/Hard = fully locked)

**Implementation approach:**
- Modify `MicroExerciseEditor` to accept an optional `onAuthPrompt` callback
- In `NodeClient`, track anonymous attempt count in component state
- When threshold is reached, open `AuthModal`
- The `usePGlite` hook already works without auth — no changes needed there

### 4. Daily Challenge Toast (Returning Users)

A non-blocking toast notification for logged-in users who haven't attempted today's daily challenge.

**Trigger:** On home page mount, if:
- User is logged in
- Today's daily challenge exists
- User has NOT attempted today's challenge
- Toast has NOT been shown today (tracked via `sessionStorage` key `qv_daily_toast_shown`)

**Appearance:**
- Slides in from the bottom-right corner
- Contains: "Today's Daily Challenge is live!" + "Try Now" button
- "Try Now" navigates to `/daily`
- Auto-dismisses after 5 seconds
- Has an X button for manual dismiss
- Uses the existing card/border styling with a subtle primary accent

**Component:** `DailyToast` — a new component rendered in the home page, self-contained with its own visibility logic.

### 5. Navbar Daily Badge (Returning Users)

A persistent visual indicator on the "Daily" nav link when today's challenge is unattempted.

**Appearance:**
- A small pulsing dot (6px, primary color) positioned at the top-right of the "Daily" nav link text
- Only visible when: user is logged in AND today's challenge is unattempted
- Disappears once the user navigates to `/daily` and attempts the challenge

**Implementation:**
- Add a `useDailyStatus` hook that checks if today's challenge has been attempted (check `localStorage` for today's daily challenge state)
- The hook returns `{ hasUnattempted: boolean }`
- Navbar renders the dot conditionally based on hook value
- The dot uses a CSS `@keyframes pulse` animation

### 6. What This Does NOT Include

- No placement quiz or skill assessment
- No changes to the `/learn`, `/problems`, or `/daily` pages themselves
- No email/push notifications
- No changes to the auth providers or sign-up flow
- No changes to mobile drawer layout (beyond the daily badge)
