# Spaced Repetition & Question Flag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a spaced repetition review system that resurfaces solved problems at adaptive intervals, and a flag feature that lets users report issues with questions.

**Architecture:** Review state is stored in localStorage with fire-and-forget Supabase sync (same pattern as daily progress). The existing `getNextSuggestion` function is extended to prioritize due reviews. Flag reports go directly to a Supabase table. Both features integrate into the existing practice and daily page toolbars.

**Tech Stack:** Next.js (App Router), React 18, TypeScript, Supabase, localStorage, Tailwind CSS

## Global Constraints

- No new dependencies — use existing UI components (Button, Badge, Dialog from shadcn)
- Follow existing fire-and-forget Supabase sync pattern from `lib/daily.ts`
- No toast library — use custom notification components like `DailyToast`
- Base path: `/queryveda` (for build)
- Node 22, Next.js static export

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `lib/review.ts` | Review state CRUD, bucket logic, intervals, localStorage + Supabase sync |
| `components/flag/flag-button.tsx` | The flag button + modal (self-contained) |
| `components/home/review-card.tsx` | Homepage "Due for Review" card |

### Modified Files
| File | Change |
|------|--------|
| `lib/next-question.ts` | Add `getNextSuggestionWithReview()` that checks due reviews first |
| `app/practice/[id]/practice-client.tsx` | Add flag button to toolbar, call review on solve, use new suggestion fn |
| `app/daily/page.tsx` | Add flag button to toolbar |
| `app/page.tsx` | Add ReviewCard below DailyHeroCard |

---

### Task 1: Review State Library (`lib/review.ts`)

**Files:**
- Create: `queryveda/lib/review.ts`

**Interfaces:**
- Consumes: `supabase` from `@/lib/supabase`
- Produces: `ReviewEntry`, `getReviewEntries()`, `addReviewEntry(questionId, bucket)`, `updateReviewAfterSolve(questionId, firstTry)`, `getDueReviews()`, `determineBucket(attemptCount, elapsedMs)`, `syncReviewToCloud(entry)`, `syncReviewFromCloud()`

- [ ] **Step 1: Create `lib/review.ts` with types and constants**

```typescript
// queryveda/lib/review.ts
import { supabase } from "@/lib/supabase";

export interface ReviewEntry {
  questionId: number;
  bucket: "easy" | "medium" | "hard";
  lastReviewedAt: string; // ISO date
  nextReviewAt: string;   // ISO date
  reviewCount: number;
}

const INTERVALS: Record<ReviewEntry["bucket"], number[]> = {
  easy: [7, 14, 30, 60],
  medium: [3, 7, 14, 30],
  hard: [1, 3, 7, 14],
};

const STORAGE_KEY = "review_schedule";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 2: Add localStorage read/write helpers**

```typescript
function loadEntries(): ReviewEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: ReviewEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
```

- [ ] **Step 3: Add `determineBucket` function**

```typescript
export function determineBucket(
  attemptCount: number,
  elapsedMs: number
): ReviewEntry["bucket"] {
  const elapsedMin = elapsedMs / 60_000;
  if (attemptCount <= 1 && elapsedMin < 3) return "easy";
  if (attemptCount <= 3 || elapsedMin < 10) return "medium";
  return "hard";
}
```

- [ ] **Step 4: Add `getReviewEntries`, `getDueReviews`, `getReviewEntry`**

```typescript
export function getReviewEntries(): ReviewEntry[] {
  return loadEntries();
}

export function getReviewEntry(questionId: number): ReviewEntry | undefined {
  return loadEntries().find((e) => e.questionId === questionId);
}

export function getDueReviews(): ReviewEntry[] {
  const today = todayISO();
  return loadEntries()
    .filter((e) => e.nextReviewAt <= today)
    .sort((a, b) => {
      // Overdue first, then hard > medium > easy
      const bucketOrder = { hard: 0, medium: 1, easy: 2 };
      const dateComp = a.nextReviewAt.localeCompare(b.nextReviewAt);
      if (dateComp !== 0) return dateComp;
      return bucketOrder[a.bucket] - bucketOrder[b.bucket];
    });
}
```

- [ ] **Step 5: Add `addReviewEntry` for new solves**

```typescript
export function addReviewEntry(questionId: number, bucket: ReviewEntry["bucket"]) {
  const entries = loadEntries();
  const existing = entries.find((e) => e.questionId === questionId);
  if (existing) return; // already tracked

  const today = todayISO();
  const interval = INTERVALS[bucket][0];
  const entry: ReviewEntry = {
    questionId,
    bucket,
    lastReviewedAt: today,
    nextReviewAt: addDays(today, interval),
    reviewCount: 0,
  };
  entries.push(entry);
  saveEntries(entries);
  syncReviewToCloud(entry);
}
```

- [ ] **Step 6: Add `updateReviewAfterSolve` for review completions**

```typescript
export function updateReviewAfterSolve(questionId: number, firstTry: boolean) {
  const entries = loadEntries();
  const entry = entries.find((e) => e.questionId === questionId);
  if (!entry) return;

  const today = todayISO();
  entry.lastReviewedAt = today;

  if (firstTry) {
    // Advance to next interval
    entry.reviewCount++;
    const intervals = INTERVALS[entry.bucket];
    const idx = Math.min(entry.reviewCount, intervals.length - 1);
    entry.nextReviewAt = addDays(today, intervals[idx]);
  } else {
    // Reset to first interval
    entry.reviewCount = 0;
    entry.nextReviewAt = addDays(today, INTERVALS[entry.bucket][0]);
  }

  saveEntries(entries);
  syncReviewToCloud(entry);
}
```

- [ ] **Step 7: Add Supabase sync functions**

```typescript
async function syncReviewToCloud(entry: ReviewEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("review_schedule").upsert(
      {
        user_id: user.id,
        question_id: entry.questionId,
        bucket: entry.bucket,
        last_reviewed_at: entry.lastReviewedAt,
        next_review_at: entry.nextReviewAt,
        review_count: entry.reviewCount,
      },
      { onConflict: "user_id,question_id" }
    );
  } catch {
    // silent — localStorage is the fallback
  }
}

export async function syncReviewFromCloud() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("review_schedule")
      .select("*")
      .eq("user_id", user.id);
    if (!data || data.length === 0) return;

    const local = loadEntries();
    for (const row of data) {
      const idx = local.findIndex((e) => e.questionId === row.question_id);
      const cloudEntry: ReviewEntry = {
        questionId: row.question_id,
        bucket: row.bucket,
        lastReviewedAt: row.last_reviewed_at,
        nextReviewAt: row.next_review_at,
        reviewCount: row.review_count,
      };
      if (idx >= 0) {
        // Latest wins
        if (row.last_reviewed_at > local[idx].lastReviewedAt) {
          local[idx] = cloudEntry;
        }
      } else {
        local.push(cloudEntry);
      }
    }
    saveEntries(local);
  } catch {
    // silent
  }
}
```

- [ ] **Step 8: Export `ReviewEntry` type for consumers**

Verify that `ReviewEntry` is already exported (it is via `export interface` in Step 1). Also ensure `getDueReviews` and `syncReviewFromCloud` are exported (they are via `export function`).

- [ ] **Step 9: Verify build passes**

Run: `cd queryveda && npm run build`
Expected: Build succeeds (lib file has no component imports, just logic + supabase)

- [ ] **Step 10: Commit**

```bash
git add queryveda/lib/review.ts
git commit -m "feat: add spaced repetition review state library"
```

---

### Task 2: Extend Next Question Suggestion with Reviews (`lib/next-question.ts`)

**Files:**
- Modify: `queryveda/lib/next-question.ts`

**Interfaces:**
- Consumes: `getDueReviews()`, `ReviewEntry` from `@/lib/review`, `getQuestionById` from `@/lib/questions`
- Produces: `getNextSuggestionWithReview(currentQuestion, isSolved)` returning `{ question: Question; isReview: boolean } | null`

- [ ] **Step 1: Add `getNextSuggestionWithReview` function**

Add at the bottom of `queryveda/lib/next-question.ts`:

```typescript
import { getDueReviews } from "@/lib/review";
import { getQuestionById } from "@/lib/questions";

export interface SuggestionResult {
  question: Question;
  isReview: boolean;
}

export function getNextSuggestionWithReview(
  currentQuestion: Question,
  isSolved: (id: number) => boolean
): SuggestionResult | null {
  // Priority 1: Due reviews
  const dueReviews = getDueReviews();
  for (const review of dueReviews) {
    if (review.questionId === currentQuestion.id) continue;
    const q = getQuestionById(review.questionId);
    if (q) return { question: q, isReview: true };
  }

  // Priority 2-3: Existing logic (same topic → weakest topic → fallback)
  const next = getNextSuggestion(currentQuestion, isSolved);
  if (next) return { question: next, isReview: false };

  return null;
}
```

Note: the `import { getQuestionById } from "@/lib/questions"` line needs to be moved to the top of the file alongside the existing `import { getSortedQuestions } from "@/lib/questions"`. Merge them:

Replace line 1:
```typescript
import { getSortedQuestions } from "@/lib/questions";
```
With:
```typescript
import { getSortedQuestions, getQuestionById } from "@/lib/questions";
```

And add the review import at the top:
```typescript
import { getDueReviews } from "@/lib/review";
```

- [ ] **Step 2: Verify build passes**

Run: `cd queryveda && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add queryveda/lib/next-question.ts
git commit -m "feat: add review-aware next question suggestion"
```

---

### Task 3: Integrate Review into Practice Page

**Files:**
- Modify: `queryveda/app/practice/[id]/practice-client.tsx`

**Interfaces:**
- Consumes: `getNextSuggestionWithReview`, `SuggestionResult` from `@/lib/next-question`, `addReviewEntry`, `updateReviewAfterSolve`, `getReviewEntry`, `determineBucket`, `syncReviewFromCloud` from `@/lib/review`
- Produces: updated UI with review-aware suggestion card and review tracking on solve

- [ ] **Step 1: Update imports**

In `queryveda/app/practice/[id]/practice-client.tsx`, replace:

```typescript
import { getNextSuggestion } from "@/lib/next-question";
```

With:

```typescript
import { getNextSuggestionWithReview, type SuggestionResult } from "@/lib/next-question";
import { addReviewEntry, updateReviewAfterSolve, getReviewEntry, determineBucket, syncReviewFromCloud } from "@/lib/review";
```

- [ ] **Step 1b: Add cloud sync on mount**

In the component body, after the existing `useEffect` blocks (around line 90), add:

```typescript
  // Sync review schedule from cloud on mount
  useEffect(() => {
    syncReviewFromCloud();
  }, []);
```

- [ ] **Step 2: Add attempt tracking state**

After line 54 (`const [failCount, setFailCount] = useState(0);`), add:

```typescript
const [firstRunAt, setFirstRunAt] = useState<number | null>(null);
const [attemptCount, setAttemptCount] = useState(0);
```

- [ ] **Step 3: Update suggestion computation**

Replace lines 60-64:

```typescript
  // Compute next question suggestion only when verdict changes to pass
  const suggestion = useMemo(
    () => verdict.type === "pass" && question ? getNextSuggestion(question, storage.isSolved) : null,
    [verdict.type, question]
  );
```

With:

```typescript
  // Compute next question suggestion only when verdict changes to pass
  const suggestionResult: SuggestionResult | null = useMemo(
    () => verdict.type === "pass" && question ? getNextSuggestionWithReview(question, storage.isSolved) : null,
    [verdict.type, question]
  );
  const suggestion = suggestionResult?.question ?? null;
  const isReviewSuggestion = suggestionResult?.isReview ?? false;
```

- [ ] **Step 4: Update handleRun to track attempts and create review entries**

In the `handleRun` callback, right before `setRunning(true);` (line 117), add:

```typescript
      if (!firstRunAt) setFirstRunAt(Date.now());
      setAttemptCount((prev) => prev + 1);
```

In the `if (result.passed)` block (lines 129-130), replace:

```typescript
      if (result.passed) {
        markSolved(questionId);
      }
```

With:

```typescript
      if (result.passed) {
        markSolved(questionId);
        // Spaced repetition: create or update review entry
        const existingReview = getReviewEntry(questionId);
        if (existingReview) {
          updateReviewAfterSolve(questionId, attemptCount <= 1);
        } else {
          const elapsed = firstRunAt ? Date.now() - firstRunAt : 0;
          const bucket = determineBucket(attemptCount, elapsed);
          addReviewEntry(questionId, bucket);
        }
      }
```

- [ ] **Step 5: Update suggestion card JSX for review styling**

Replace lines 305-338 (the suggestion card block):

```typescript
          {verdict.type === "pass" && suggestion && (
            <div className={`rounded-xl border p-3 space-y-1.5 ${
              isReviewSuggestion
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-muted/30 border-primary/20"
            }`}>
              <p className="text-xs text-muted-foreground font-medium">
                {isReviewSuggestion ? "Time to Review" : "Up Next"}
              </p>
              <p className="text-sm font-medium">
                {suggestion.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: DIFFICULTY_COLORS[suggestion.difficulty] + "1a",
                    color: DIFFICULTY_COLORS[suggestion.difficulty],
                  }}
                >
                  {suggestion.difficulty}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: TOPIC_COLORS[suggestion.topic] + "1a",
                    color: TOPIC_COLORS[suggestion.topic],
                  }}
                >
                  {suggestion.topic}
                </span>
                <Button
                  size="sm"
                  className="rounded-full ml-auto h-7 text-xs"
                  onClick={() => navigateTo(suggestion)}
                >
                  Go &rarr;
                </Button>
              </div>
            </div>
          )}
```

- [ ] **Step 6: Verify build passes**

Run: `cd queryveda && npm run build`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add queryveda/app/practice/[id]/practice-client.tsx
git commit -m "feat: integrate spaced repetition into practice page"
```

---

### Task 4: Homepage Review Card

**Files:**
- Create: `queryveda/components/home/review-card.tsx`
- Modify: `queryveda/app/page.tsx`

**Interfaces:**
- Consumes: `getDueReviews()` from `@/lib/review`, `getQuestionById` from `@/lib/questions`
- Produces: `<ReviewCard />` component, rendered on homepage

- [ ] **Step 1: Create `components/home/review-card.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDueReviews, type ReviewEntry } from "@/lib/review";
import { getQuestionById } from "@/lib/questions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_COLORS } from "@/lib/constants";
import type { Question } from "@/lib/types";

const BUCKET_LABELS: Record<ReviewEntry["bucket"], string> = {
  hard: "Hard",
  medium: "Medium",
  easy: "Easy",
};

const BUCKET_COLORS: Record<ReviewEntry["bucket"], string> = {
  hard: "#ef4444",
  medium: "#f59e0b",
  easy: "#22c55e",
};

export function ReviewCard() {
  const { user } = useAuth();
  const [dueItems, setDueItems] = useState<Array<{ review: ReviewEntry; question: Question }>>([]);

  useEffect(() => {
    if (!user) return;
    const reviews = getDueReviews();
    const items: Array<{ review: ReviewEntry; question: Question }> = [];
    for (const review of reviews) {
      const q = getQuestionById(review.questionId);
      if (q) items.push({ review, question: q });
      if (items.length >= 3) break;
    }
    setDueItems(items);
  }, [user]);

  if (!user || dueItems.length === 0) return null;

  const totalDue = getDueReviews().length;

  return (
    <section className="mx-auto max-w-5xl px-6 py-6">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <h3 className="text-base font-semibold">Due for Review</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalDue} problem{totalDue !== 1 ? "s" : ""} need{totalDue === 1 ? "s" : ""} review
          </span>
        </div>

        <div className="space-y-2">
          {dueItems.map(({ review, question }) => (
            <div
              key={question.id}
              className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate">{question.title}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                  style={{
                    backgroundColor: BUCKET_COLORS[review.bucket] + "1a",
                    color: BUCKET_COLORS[review.bucket],
                  }}
                >
                  {BUCKET_LABELS[review.bucket]}
                </span>
              </div>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2"
                style={{
                  backgroundColor: DIFFICULTY_COLORS[question.difficulty] + "1a",
                  color: DIFFICULTY_COLORS[question.difficulty],
                }}
              >
                {question.topic}
              </span>
            </div>
          ))}
        </div>

        <Link href={`/practice/${dueItems[0].question.id}/`}>
          <Button size="sm" className="rounded-full">
            Start Review &rarr;
          </Button>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add ReviewCard to homepage**

In `queryveda/app/page.tsx`, add import at top:

```typescript
import { ReviewCard } from "@/components/home/review-card";
```

Add `<ReviewCard />` after the `<DailyHeroCard />` line (line 34):

```typescript
      {/* Daily Challenge */}
      <DailyHeroCard />

      {/* Review Queue */}
      <ReviewCard />
```

- [ ] **Step 3: Verify build passes**

Run: `cd queryveda && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/home/review-card.tsx queryveda/app/page.tsx
git commit -m "feat: add review queue card to homepage"
```

---

### Task 5: Flag Button & Modal Component

**Files:**
- Create: `queryveda/components/flag/flag-button.tsx`

**Interfaces:**
- Consumes: `supabase` from `@/lib/supabase`, `useAuth` from `@/hooks/use-auth`
- Produces: `<FlagButton questionId={number} questionSource="practice" | "daily" />` component

- [ ] **Step 1: Create `components/flag/flag-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { value: "solution_error", label: "Solution Error" },
  { value: "question_error", label: "Question Error" },
  { value: "data_error", label: "Data Error" },
  { value: "table_error", label: "Table Error" },
  { value: "other", label: "Other" },
] as const;

type FlagCategory = (typeof CATEGORIES)[number]["value"];

interface FlagButtonProps {
  questionId: number;
  questionSource: "practice" | "daily";
}

export function FlagButton({ questionId, questionSource }: FlagButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FlagCategory | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || !category) return;
    setSubmitting(true);
    try {
      await supabase.from("flagged_questions").upsert(
        {
          user_id: user.id,
          question_id: questionId,
          question_source: questionSource,
          category,
          message: message.trim() || null,
        },
        { onConflict: "user_id,question_id,category" }
      );
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setCategory(null);
        setMessage("");
      }, 1500);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-lg opacity-60 hover:opacity-100 transition-opacity"
        title="Report an issue"
        type="button"
      >
        🤔
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Popover */}
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border bg-background shadow-lg p-4 space-y-3">
            {submitted ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium text-center py-2">
                Thanks for the feedback!
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold">What&apos;s wrong with this question?</p>

                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        category === cat.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 hover:bg-muted border-transparent"
                      }`}
                      type="button"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue (optional)"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={!category || submitting}
                  size="sm"
                  className="w-full rounded-full"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd queryveda && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add queryveda/components/flag/flag-button.tsx
git commit -m "feat: add flag button and modal component"
```

---

### Task 6: Add Flag Button to Practice & Daily Pages

**Files:**
- Modify: `queryveda/app/practice/[id]/practice-client.tsx`
- Modify: `queryveda/app/daily/page.tsx`

**Interfaces:**
- Consumes: `<FlagButton />` from `@/components/flag/flag-button`

- [ ] **Step 1: Add FlagButton to practice page toolbar**

In `queryveda/app/practice/[id]/practice-client.tsx`, add import:

```typescript
import { FlagButton } from "@/components/flag/flag-button";
```

In the toolbar div (around line 272), add FlagButton after the Run button:

Replace:
```typescript
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleRun}
              disabled={running || !ready}
              size="sm"
              className="rounded-full"
            >
              {running ? "Running..." : "Run (⌘/Ctrl+Enter)"}
            </Button>
          </div>
```

With:
```typescript
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleRun}
              disabled={running || !ready}
              size="sm"
              className="rounded-full"
            >
              {running ? "Running..." : "Run (⌘/Ctrl+Enter)"}
            </Button>
            <div className="ml-auto">
              <FlagButton questionId={questionId} questionSource="practice" />
            </div>
          </div>
```

- [ ] **Step 2: Add FlagButton to daily page toolbar**

In `queryveda/app/daily/page.tsx`, add import:

```typescript
import { FlagButton } from "@/components/flag/flag-button";
```

In the toolbar div (around line 269), add FlagButton after the Run button:

Replace:
```typescript
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleRun}
          disabled={running || !ready}
          size="sm"
          className="rounded-full"
        >
          {running ? "Running..." : "Run (\u2318/Ctrl+Enter)"}
        </Button>
      </div>
```

With:
```typescript
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleRun}
          disabled={running || !ready}
          size="sm"
          className="rounded-full"
        >
          {running ? "Running..." : "Run (\u2318/Ctrl+Enter)"}
        </Button>
        <div className="ml-auto">
          <FlagButton questionId={-1} questionSource="daily" />
        </div>
      </div>
```

- [ ] **Step 3: Verify build passes**

Run: `cd queryveda && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add queryveda/app/practice/[id]/practice-client.tsx queryveda/app/daily/page.tsx
git commit -m "feat: add flag button to practice and daily pages"
```

---

### Task 7: Supabase Table Setup

**Files:**
- No code files — Supabase SQL migrations

**Interfaces:**
- Produces: `review_schedule` and `flagged_questions` tables in Supabase

- [ ] **Step 1: Create `review_schedule` table**

Run in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS review_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id int NOT NULL,
  bucket text NOT NULL CHECK (bucket IN ('easy', 'medium', 'hard')),
  last_reviewed_at text NOT NULL,
  next_review_at text NOT NULL,
  review_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reviews"
  ON review_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON review_schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON review_schedule FOR UPDATE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Create `flagged_questions` table**

Run in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS flagged_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id int NOT NULL,
  question_source text NOT NULL CHECK (question_source IN ('practice', 'daily')),
  category text NOT NULL CHECK (category IN ('solution_error', 'question_error', 'data_error', 'table_error', 'other')),
  message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id, category)
);

ALTER TABLE flagged_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own flags"
  ON flagged_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flags"
  ON flagged_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flags"
  ON flagged_questions FOR UPDATE
  USING (auth.uid() = user_id);
```

- [ ] **Step 3: Verify tables exist**

In Supabase dashboard, check that both tables appear under Table Editor with the correct columns and RLS policies.
