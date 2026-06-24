# Next Question Suggestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After solving a question, suggest the best next question via a mini card, improve Prev/Next button visibility, and add a tour step for the Next button.

**Architecture:** New `lib/next-question.ts` module handles recommendation logic (same-topic escalation → weakest-area fallback). The suggestion card renders inline in `practice-client.tsx` below the verdict box. Tour step added to existing `platform-tour.tsx`.

**Tech Stack:** Next.js, React, TypeScript, driver.js (tour), Tailwind CSS

## Global Constraints

- Use existing `DIFFICULTY_COLORS`, `TOPIC_COLORS`, `DIFFICULTY_ORDER` from `lib/constants.ts`
- Use existing `getSortedQuestions` from `lib/questions.ts`
- Use `storage.isSolved` from `lib/storage.ts` (exposed via `useStorage` hook as `getStatus`)
- Difficulty order: Easy (0) < Medium (1) < Hard (2) per `DIFFICULTY_ORDER`

---

### Task 1: Recommendation Logic

**Files:**
- Create: `lib/next-question.ts`

**Interfaces:**
- Consumes: `Question` and `Difficulty` from `lib/types.ts`, `getSortedQuestions` from `lib/questions.ts`, `DIFFICULTY_ORDER` from `lib/constants.ts`
- Produces: `getNextSuggestion(currentQuestion: Question, isSolved: (id: number) => boolean): Question | null`

- [ ] **Step 1: Create `lib/next-question.ts` with the recommendation function**

```typescript
import type { Question, Topic } from "@/lib/types";
import { getSortedQuestions } from "@/lib/questions";
import { DIFFICULTY_ORDER } from "@/lib/constants";

export function getNextSuggestion(
  currentQuestion: Question,
  isSolved: (id: number) => boolean
): Question | null {
  const all = getSortedQuestions();
  const unsolved = all.filter((q) => q.id !== currentQuestion.id && !isSolved(q.id));

  if (unsolved.length === 0) return null;

  // Strategy 1: Same topic, same or higher difficulty
  const sameTopic = unsolved.filter((q) => q.topic === currentQuestion.topic);
  if (sameTopic.length > 0) {
    const currentDiff = DIFFICULTY_ORDER[currentQuestion.difficulty];
    // Find easiest unsolved at or above current difficulty
    const escalated = sameTopic.filter(
      (q) => DIFFICULTY_ORDER[q.difficulty] >= currentDiff
    );
    if (escalated.length > 0) {
      // Sort by difficulty asc, then id asc
      escalated.sort(
        (a, b) =>
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] ||
          a.id - b.id
      );
      return escalated[0];
    }
    // All remaining in topic are easier — just pick first
    return sameTopic[0];
  }

  // Strategy 2: Weakest topic (lowest completion %)
  const topicCompletion = new Map<Topic, { solved: number; total: number }>();
  for (const q of all) {
    const entry = topicCompletion.get(q.topic) || { solved: 0, total: 0 };
    entry.total++;
    if (isSolved(q.id)) entry.solved++;
    topicCompletion.set(q.topic, entry);
  }

  let weakestTopic: Topic | null = null;
  let lowestPct = Infinity;
  for (const [topic, { solved, total }] of topicCompletion) {
    const pct = solved / total;
    // Only consider topics that have unsolved questions
    if (unsolved.some((q) => q.topic === topic) && pct < lowestPct) {
      lowestPct = pct;
      weakestTopic = topic;
    }
  }

  if (weakestTopic) {
    const weakestUnsolved = unsolved
      .filter((q) => q.topic === weakestTopic)
      .sort(
        (a, b) =>
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] ||
          a.id - b.id
      );
    return weakestUnsolved[0];
  }

  // Absolute fallback
  return unsolved[0];
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npx next build` (or `npm run build`)
Expected: Build succeeds with no type errors

- [ ] **Step 3: Commit**

```bash
git add lib/next-question.ts
git commit -m "feat: add next question recommendation logic"
```

---

### Task 2: Highlight Prev/Next Buttons, Suggestion Card, and Tour Step

**Files:**
- Modify: `app/practice/[id]/practice-client.tsx` (button styles, `data-tour` attribute, suggestion card)
- Modify: `components/layout/platform-tour.tsx` (new tour step)

**Interfaces:**
- Consumes: `getNextSuggestion` from `lib/next-question.ts`, `DIFFICULTY_COLORS` and `TOPIC_COLORS` from `lib/constants.ts`, `getStatus` from `useStorage` hook

- [ ] **Step 1: Update Prev/Next button styles in `practice-client.tsx`**

In the main page top bar (~line 322-342), change both buttons to add a primary-tinted border. Add `data-tour="next-question"` to the Next button.

Find the main page top bar (around line 321-343):
```tsx
{/* Top bar */}
<div className="flex items-center justify-between px-5 py-3 border-b">
  <Button
    variant="outline"
    size="sm"
    className="rounded-full"
    disabled={!prevQ}
    onClick={() => prevQ && navigateTo(prevQ)}
  >
    Prev
  </Button>
  <h2 className="text-sm font-semibold truncate px-2">
    {question.title}
  </h2>
  <Button
    variant="outline"
    size="sm"
    className="rounded-full"
    disabled={!nextQ}
    onClick={() => nextQ && navigateTo(nextQ)}
  >
    Next
  </Button>
</div>
```

Replace with:
```tsx
{/* Top bar */}
<div className="flex items-center justify-between px-5 py-3 border-b">
  <Button
    variant="outline"
    size="sm"
    className="rounded-full border-primary/40"
    disabled={!prevQ}
    onClick={() => prevQ && navigateTo(prevQ)}
  >
    Prev
  </Button>
  <h2 className="text-sm font-semibold truncate px-2">
    {question.title}
  </h2>
  <Button
    variant="outline"
    size="sm"
    className="rounded-full border-primary/40"
    disabled={!nextQ}
    onClick={() => nextQ && navigateTo(nextQ)}
    data-tour="next-question"
  >
    Next
  </Button>
</div>
```

Also update the locked-page buttons (~line 180-200) with the same `border-primary/40` class (but no `data-tour` attribute on the locked version).

- [ ] **Step 2: Add the suggestion card to `practice-client.tsx`**

Add imports at the top of the file:
```tsx
import { getNextSuggestion } from "@/lib/next-question";
import { DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";
import { storage } from "@/lib/storage";
```

After the verdict box (line ~278-288), add the suggestion card. Find:
```tsx
{/* Verdict */}
{verdict.type !== "idle" && (
  <div
    className={`rounded-xl p-3 text-sm ${
      verdict.type === "pass"
        ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30"
        : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30"
    }`}
  >
    {verdict.message}
  </div>
)}
```

Add immediately after the closing `)}` of that block:
```tsx
{/* Next question suggestion */}
{verdict.type === "pass" && (() => {
  const suggestion = getNextSuggestion(question, storage.isSolved);
  if (!suggestion) {
    return (
      <div className="rounded-xl bg-muted/30 border border-primary/20 p-3 text-sm text-muted-foreground">
        You&apos;ve solved all 75 questions! Congratulations!
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-muted/30 border border-primary/20 p-3 space-y-1.5">
      <p className="text-xs text-muted-foreground font-medium">Up Next</p>
      <p className="text-sm font-medium">
        Q{suggestion.id} &middot; {suggestion.title}
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
          onClick={() => router.push(`/practice/${suggestion.id}/`)}
        >
          Go &rarr;
        </Button>
      </div>
    </div>
  );
})()}
```

- [ ] **Step 3: Add the tour step in `components/layout/platform-tour.tsx`**

Find the "Problems" step in the `tourSteps` array:
```typescript
{
  element: "[data-tour='problems']",
  popover: {
    title: "Problems",
    description: "75+ practice problems sorted by difficulty.",
  },
},
```

Add this new step immediately after it:
```typescript
{
  element: "[data-tour='next-question']",
  popover: {
    title: "Next Question",
    description: "Navigate between questions using these buttons.",
  },
},
```

- [ ] **Step 4: Verify the build passes**

Run: `npx next build` (or `npm run build`)
Expected: Build succeeds with no type errors

- [ ] **Step 5: Manual verification**

1. Open a practice page — confirm Prev/Next buttons have visible primary-tinted borders
2. Solve a question — confirm the "Up Next" card appears below the green verdict with correct question title, difficulty badge, topic badge, and "Go" button
3. Click "Go" — confirm it navigates to the suggested question
4. Trigger tour on a practice page — confirm "Next Question" step appears

- [ ] **Step 6: Commit**

```bash
git add app/practice/[id]/practice-client.tsx components/layout/platform-tour.tsx
git commit -m "feat: add next question suggestion card, highlight nav buttons, add tour step"
```
