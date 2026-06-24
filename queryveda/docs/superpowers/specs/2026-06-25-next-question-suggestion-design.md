# Next Question Suggestion — Design Spec

## Overview

After solving a SQL practice question, suggest the best next question to attempt via a mini card in the success area. Also improve visibility of the existing Prev/Next navigation buttons and add a tour step for the Next button.

## 1. Next Button Highlight

**File:** `app/practice/[id]/practice-client.tsx`

The Prev and Next buttons currently use `variant="outline"` which is barely visible. Change both to use a more prominent style:

- Add `border-primary/40` tint so they stand out against the dark top bar
- Keep `variant="outline"` and `size="sm"` with `rounded-full`
- Apply to both the main page buttons (line ~322-342) and the locked-page buttons (line ~180-200)
- Add `data-tour="next-question"` attribute to the Next button (main page instance only) for the tour step

## 2. Smart Suggestion Card

### 2.1 Recommendation Logic

**New file:** `lib/next-question.ts`

Export a function `getNextSuggestion(currentQuestion, isSolved)`:

```
function getNextSuggestion(
  currentQuestion: Question,
  isSolved: (id: number) => boolean
): Question | null
```

**Algorithm:**

1. Get all questions via `getSortedQuestions()`
2. Filter to only unsolved questions (`!isSolved(q.id)`)
3. **Same topic, escalate difficulty:**
   - From unsolved, find questions in the same topic as `currentQuestion`
   - Among those, pick the one with the lowest difficulty tier that is ≥ current difficulty
   - Difficulty order: Easy < Medium < Hard
   - If multiple candidates at the same difficulty, pick the first by sort order (lowest id)
4. **Fallback — weakest topic:**
   - If no unsolved questions remain in the current topic, compute completion % per topic
   - Pick the topic with the lowest completion %
   - Within that topic, pick the easiest unsolved question
5. **All solved:** Return `null`

### 2.2 Suggestion Card UI

**Location:** Rendered inside `practice-client.tsx`, directly below the green verdict box, only when `verdict.type === "pass"` and suggestion is non-null.

**Structure:**
```
┌─────────────────────────────────────────┐
│  Up Next                                │
│  Q15 · Running Average by Category      │
│  [Medium]  [Cumulative & Sliding Windows]│
│                                [Go →]   │
└─────────────────────────────────────────┘
```

- Header: "Up Next" in small muted text
- Question title: `Q{id} · {title}` in regular weight
- Badges: Difficulty badge (green/yellow/red) + Topic badge (purple) — use existing badge color conventions from the app
- "Go" button: Small primary button, navigates to the suggested question
- Container: `rounded-xl bg-muted/30 border border-primary/20 p-3` — subtle, not overpowering the success message
- If all questions solved: Show "You've solved all 75 questions! 🎉" congratulations message instead

### 2.3 Integration in practice-client.tsx

- Import `getNextSuggestion` from `lib/next-question.ts`
- After the verdict box (line ~278-288), conditionally render the suggestion card when `verdict.type === "pass"`
- Use `storage.isSolved` (from `useStorage`) as the `isSolved` callback
- The card is a simple inline JSX block — no separate component file needed given its simplicity

## 3. Tour Step

**File:** `components/layout/platform-tour.tsx`

Add a new step to the `tourSteps` array:

```typescript
{
  element: "[data-tour='next-question']",
  popover: {
    title: "Next Question",
    description: "Navigate between questions using these buttons.",
  },
}
```

Place it after the "Problems" step. Since the tour filters steps by which `data-tour` elements exist on the current page, this step will only appear when the tour is triggered from a practice page.

## Summary of Files Changed

| File | Change |
|------|--------|
| `lib/next-question.ts` | New — recommendation logic |
| `app/practice/[id]/practice-client.tsx` | Highlight buttons, add `data-tour`, render suggestion card |
| `components/layout/platform-tour.tsx` | Add Next Question tour step |
