# First-Time Experience Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the home page with two-path cards (Learn + Practice), add anonymous trial for skill tree exercises, add a daily challenge toast for returning users, and add a navbar badge for unattempted daily challenges.

**Architecture:** The home page (`page.tsx`) is restructured to replace the single CTA and topic grid with two-path cards and repositioned daily challenge. A new `useDailyStatus` hook powers both the toast and navbar badge. The anonymous trial modifies `MicroExerciseEditor` and `NodeClient` to allow unauthenticated exercise attempts with an auth prompt after a threshold.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, shadcn/ui (Card, Button, Badge, Dialog), lucide-react icons, existing `useAuth` hook, existing `AuthModal` component, existing `lib/daily.ts` utilities.

---

### Task 1: Home Page Hero Rewrite

**Files:**
- Modify: `queryveda/app/page.tsx:9-22`

- [ ] **Step 1: Update hero headline and subtitle, remove CTA button**

Replace the hero section in `queryveda/app/page.tsx`. Change headline from "Master SQL by Doing" to "Go from SQL Zero to Interview Ready", update subtitle, and remove the "Start Practicing" button entirely (the two-path cards in Task 2 replace it).

```tsx
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center" style={{ background: "var(--qv-gradient-hero)" }}>
        <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Go from SQL Zero to Interview Ready
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Structured lessons + 75 practice problems. No installations.
        </p>
      </section>
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run dev` and visit `http://localhost:3000`
Expected: Hero shows new headline and subtitle, no CTA button.

- [ ] **Step 3: Commit**

```bash
git add queryveda/app/page.tsx
git commit -m "feat: update hero copy — new headline and subtitle, remove CTA button"
```

---

### Task 2: Two-Path Cards Component

**Files:**
- Create: `queryveda/components/home/two-path-cards.tsx`
- Modify: `queryveda/app/page.tsx`

- [ ] **Step 1: Create the TwoPathCards component**

Create `queryveda/components/home/two-path-cards.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Target } from "lucide-react";

export function TwoPathCards() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Learn SQL Card */}
        <Link href="/learn" className="group">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Learn SQL</CardTitle>
              </div>
              <CardDescription>
                Step-by-step skill tree with interactive micro-exercises
              </CardDescription>
              {/* Mini skill tree preview */}
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  &#x2713;
                </span>
                <span className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-xs font-bold text-primary">
                  2
                </span>
                <span className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                  &#x1F512;
                </span>
                <span className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                  &#x1F512;
                </span>
              </div>
              <Button className="w-full">Start Learning</Button>
            </CardHeader>
          </Card>
        </Link>

        {/* Practice Problems Card */}
        <Link href="/problems" className="group">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Practice Problems</CardTitle>
              </div>
              <CardDescription>
                75 curated challenges across 5 topics
              </CardDescription>
              {/* Difficulty badges */}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-500/15 text-green-600 dark:text-green-400 px-2.5 py-0.5 text-xs font-medium">
                  Easy
                </span>
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs font-medium">
                  Medium
                </span>
                <span className="rounded-full bg-red-500/15 text-red-600 dark:text-red-400 px-2.5 py-0.5 text-xs font-medium">
                  Hard
                </span>
              </div>
              <Button className="w-full">Start Practicing</Button>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Integrate TwoPathCards into the home page and remove Topics section**

Replace the entire body of `queryveda/app/page.tsx` with the new layout order: Hero > TwoPathCards > DailyHeroCard > Features line. Remove the Topics section and `TOPICS`/`TOPIC_COLORS` imports.

```tsx
import Link from "next/link";
import { DailyHeroCard } from "@/components/daily/daily-hero-card";
import { TwoPathCards } from "@/components/home/two-path-cards";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center" style={{ background: "var(--qv-gradient-hero)" }}>
        <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Go from SQL Zero to Interview Ready
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Structured lessons + 75 practice problems. No installations.
        </p>
      </section>

      {/* Two-Path Cards */}
      <TwoPathCards />

      {/* Daily Challenge */}
      <DailyHeroCard />

      {/* Features — subtle inline list */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>75 curated problems</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span>In-browser PostgreSQL</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span>Progress tracking & streaks</span>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify the page renders**

Run: `npm run dev` and visit `http://localhost:3000`
Expected: Hero > two side-by-side cards (Learn + Practice) > Daily Challenge > Features line. No Topics section. Cards stack vertically on mobile. Hover shows primary-tinted border.

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/home/two-path-cards.tsx queryveda/app/page.tsx
git commit -m "feat: add two-path cards (Learn + Practice) to home page, remove Topics section"
```

---

### Task 3: Anonymous Trial — MicroExerciseEditor Auth Callback

**Files:**
- Modify: `queryveda/components/learn/micro-exercise-editor.tsx:10-19`

- [ ] **Step 1: Add optional `onAuthPrompt` callback to MicroExerciseEditor**

Add `onAuthPrompt?: () => void` to the `MicroExerciseEditorProps` interface and call it inside `handleRun` before executing the query.

In `queryveda/components/learn/micro-exercise-editor.tsx`, update the interface:

```typescript
interface MicroExerciseEditorProps {
  exercise: MicroExercise;
  db: {
    exec: (sql: string) => Promise<unknown>;
    query: (sql: string) => Promise<{ fields: { name: string }[]; rows: Record<string, unknown>[] }>;
  };
  onPass: () => void;
  onAuthPrompt?: () => void;
}
```

Update the component destructuring:

```typescript
export function MicroExerciseEditor({ exercise, db, onPass, onAuthPrompt }: MicroExerciseEditorProps) {
```

In `handleRun`, add a call to `onAuthPrompt` at the very start of the function body, before the trimmed check:

```typescript
  const handleRun = useCallback(async () => {
    if (onAuthPrompt) onAuthPrompt();
    const trimmed = sqlRef.current.trim();
    // ... rest unchanged
```

Update the `handleRun` dependency array to include `onAuthPrompt`:

```typescript
  }, [db, exercise, assembleQuery, currentExpected, isIncremental, stepIdx, onPass, onAuthPrompt]);
```

- [ ] **Step 2: Verify existing behavior is unchanged**

Run: `npm run dev`, navigate to `/learn/select-basics`, try an exercise.
Expected: Behavior is identical — `onAuthPrompt` is undefined so the call is a no-op.

- [ ] **Step 3: Commit**

```bash
git add queryveda/components/learn/micro-exercise-editor.tsx
git commit -m "feat: add onAuthPrompt callback to MicroExerciseEditor for anonymous trial"
```

---

### Task 4: Anonymous Trial — NodeClient Auth Gate Logic

**Files:**
- Modify: `queryveda/app/learn/[nodeId]/node-client.tsx`

- [ ] **Step 1: Add anonymous attempt tracking and auth modal to NodeClient**

In `queryveda/app/learn/[nodeId]/node-client.tsx`:

1. Import `useAuth` and `AuthModal`:
```typescript
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/auth-modal";
```

2. Add state for anonymous tracking inside the `NodeClient` component, after the existing state declarations:
```typescript
  const { user } = useAuth();
  const [anonRunCount, setAnonRunCount] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
```

3. Create the auth prompt handler:
```typescript
  const handleAuthPrompt = useCallback(() => {
    if (user) return; // logged in, no prompt needed
    const newCount = anonRunCount + 1;
    setAnonRunCount(newCount);
    // Show auth modal after completing 1 exercise OR clicking Run on a 2nd exercise
    if (newCount >= 2) {
      setAuthOpen(true);
    }
  }, [user, anonRunCount]);
```

4. Update `handlePass` — for anonymous users, don't save progress:
```typescript
  const handlePass = useCallback(() => {
    if (!activeExerciseId) return;
    if (user) {
      markCompleted(activeExerciseId);
    }
    // Show auth modal on first completion for anonymous users
    if (!user) {
      setAuthOpen(true);
    }
    // Auto-advance to next incomplete exercise after a delay
    if (node) {
      setTimeout(() => {
        const nextIncomplete = node.exercises.find(
          (e) => e.id !== activeExerciseId && (user ? !isExerciseCompleted(e.id) : true)
        );
        if (nextIncomplete) {
          setActiveExerciseId(nextIncomplete.id);
        }
      }, 1500);
    }
  }, [activeExerciseId, markCompleted, node, isExerciseCompleted, user]);
```

5. Pass `onAuthPrompt` to `MicroExerciseEditor`:
```tsx
            <MicroExerciseEditor
              key={activeExerciseId}
              exercise={activeExercise}
              db={db}
              onPass={handlePass}
              onAuthPrompt={handleAuthPrompt}
            />
```

6. Remove the locked gate for anonymous users. Replace the `if (!mastery.unlocked)` block — anonymous users should still be able to access unlocked nodes. The current logic uses `skillTreeStorage.isNodeUnlocked` which checks localStorage progress. For anonymous users with no progress, only the first node (no prerequisites) will be unlocked, which is correct. No change needed to the locked gate.

7. Add the AuthModal at the bottom of the return JSX, just before the closing `</div>` of the root:
```tsx
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
      />
```

- [ ] **Step 2: Verify anonymous trial flow**

Run: `npm run dev`, open an incognito/private window, navigate to `/learn/select-basics`.
Expected:
- Exercises load and SQL editor is functional
- First Run click works normally
- Second Run click shows AuthModal with "Welcome Back" / "Create Account"
- Dismissing the modal allows continued practice
- Completing an exercise also triggers the auth modal
- Progress is NOT saved (refreshing the page resets everything)

- [ ] **Step 3: Commit**

```bash
git add "queryveda/app/learn/[nodeId]/node-client.tsx"
git commit -m "feat: add anonymous trial with auth prompt after exercise threshold"
```

---

### Task 5: useDailyStatus Hook

**Files:**
- Create: `queryveda/hooks/use-daily-status.ts`

- [ ] **Step 1: Create the useDailyStatus hook**

Create `queryveda/hooks/use-daily-status.ts`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { getDailyState, fetchDailyQuestion, todayIST } from "@/lib/daily";

export function useDailyStatus() {
  const { user } = useAuth();
  const [hasUnattempted, setHasUnattempted] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasUnattempted(false);
      return;
    }

    // Check if today's daily challenge exists and hasn't been attempted
    fetchDailyQuestion().then((dq) => {
      if (!dq || dq.date !== todayIST()) {
        setHasUnattempted(false);
        return;
      }
      const state = getDailyState();
      // Unattempted = not started and not solved
      setHasUnattempted(!state.startedAt && !state.solved);
    });
  }, [user]);

  return { hasUnattempted };
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/hooks/use-daily-status.ts
git commit -m "feat: add useDailyStatus hook for daily challenge badge and toast"
```

---

### Task 6: Daily Challenge Toast Component

**Files:**
- Create: `queryveda/components/daily/daily-toast.tsx`
- Modify: `queryveda/app/page.tsx`

- [ ] **Step 1: Create the DailyToast component**

Create `queryveda/components/daily/daily-toast.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDailyStatus } from "@/hooks/use-daily-status";

export function DailyToast() {
  const { hasUnattempted } = useDailyStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasUnattempted) return;

    // Don't show if already shown this session
    const shown = sessionStorage.getItem("qv_daily_toast_shown");
    if (shown) return;

    // Show toast
    setVisible(true);
    sessionStorage.setItem("qv_daily_toast_shown", "1");

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [hasUnattempted]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border bg-card p-4 shadow-lg flex items-center gap-3 max-w-sm">
        <div className="flex-1">
          <p className="text-sm font-medium">Today&apos;s Daily Challenge is live!</p>
        </div>
        <Link href="/daily">
          <Button size="sm" className="shrink-0">Try Now</Button>
        </Link>
        <button
          onClick={() => setVisible(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add DailyToast to the home page**

In `queryveda/app/page.tsx`, add the import and render the component. Add the import at the top:

```typescript
import { DailyToast } from "@/components/daily/daily-toast";
```

Add `<DailyToast />` at the bottom of the `<div>`, just before the closing `</div>`:

```tsx
      {/* Daily Toast for returning users */}
      <DailyToast />
    </div>
```

- [ ] **Step 3: Verify the toast**

Run: `npm run dev`, sign in, ensure you haven't attempted today's daily.
Expected: Toast slides in from bottom-right with "Today's Daily Challenge is live!" + "Try Now" button. Auto-dismisses after 5 seconds. X button dismisses immediately. Refreshing the page doesn't show toast again (sessionStorage).

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/daily/daily-toast.tsx queryveda/app/page.tsx
git commit -m "feat: add daily challenge toast notification for returning users"
```

---

### Task 7: Navbar Daily Badge

**Files:**
- Modify: `queryveda/components/layout/navbar.tsx`

- [ ] **Step 1: Add pulsing dot to the Daily nav link**

In `queryveda/components/layout/navbar.tsx`:

1. Import the hook:
```typescript
import { useDailyStatus } from "@/hooks/use-daily-status";
```

2. Inside the `Navbar` component, add the hook call after the existing hooks:
```typescript
  const { hasUnattempted } = useDailyStatus();
```

3. Update the nav link rendering to add a pulsing dot for the "Daily" link. Replace the `{navLinks.map(...)}` block with:

```tsx
                {navLinks.map(({ href, label }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {label}
                      {label === "Daily" && hasUnattempted && !isActive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                      )}
                    </Link>
                  );
                })}
```

Note: The `relative` class was added to the Link's className. The dot only shows when `hasUnattempted` is true and the Daily link is NOT active (no dot when you're already on the Daily page).

- [ ] **Step 2: Verify the badge**

Run: `npm run dev`, sign in, ensure you haven't attempted today's daily.
Expected: The "Daily" nav link shows a small pulsing primary-colored dot at the top-right corner. The dot disappears when navigating to `/daily` (since `isActive` becomes true). After attempting the challenge, `hasUnattempted` becomes false and the dot disappears globally.

- [ ] **Step 3: Commit**

```bash
git add queryveda/components/layout/navbar.tsx
git commit -m "feat: add pulsing badge to Daily nav link for unattempted challenges"
```

---

### Task 8: Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run the production build**

Run: `npm run build`
Expected: Build succeeds with no errors. Check for:
- No unused import warnings that fail the build
- Static export generates all pages correctly
- No missing `generateStaticParams` errors

- [ ] **Step 2: Fix any build errors**

If there are build errors, fix them. Common issues:
- Unused imports (remove them)
- `"use client"` missing on components that use hooks
- Import paths that don't resolve

- [ ] **Step 3: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve build errors from first-time experience redesign"
```
