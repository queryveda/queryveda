# Spaced Repetition Review System & Question Flag Feature

**Date:** 2026-06-27
**Status:** Approved

---

## Overview

Two features:
1. **Spaced Repetition** — resurface solved problems at increasing intervals based on difficulty, integrated into the existing next-question suggestion and a homepage review card.
2. **Flag Feature** — let users report issues with questions/solutions via a 🤔 button on practice and daily pages.

---

## Feature 1: Spaced Repetition Review System

### Data Model

Review state per problem, stored in localStorage with fire-and-forget Supabase sync (same pattern as daily progress):

```ts
interface ReviewEntry {
  questionId: number;
  bucket: "easy" | "medium" | "hard";
  lastReviewedAt: string;   // ISO date
  nextReviewAt: string;     // ISO date
  reviewCount: number;      // times reviewed
}
```

**Supabase table: `review_schedule`**

| Column           | Type        | Notes                          |
|------------------|-------------|--------------------------------|
| id               | uuid        | Primary key                    |
| user_id          | uuid        | References auth.users          |
| question_id      | int         | Problem ID                     |
| bucket           | text        | "easy" / "medium" / "hard"     |
| last_reviewed_at | timestamptz |                                |
| next_review_at   | date        |                                |
| review_count     | int         | Default 0                      |
| created_at       | timestamptz | Default now()                  |

Unique constraint on `(user_id, question_id)`.

### Bucket Assignment Algorithm

At solve time, determine bucket based on attempt count and time taken:

- **Easy**: solved on first attempt AND under 3 minutes
  - Intervals: 7, 14, 30, 60 days
- **Medium**: solved in 2-3 attempts OR 3-10 minutes
  - Intervals: 3, 7, 14, 30 days
- **Hard**: 4+ attempts OR 10+ minutes
  - Intervals: 1, 3, 7, 14 days

### Review Logic

When a user re-solves a review problem:
- Got it right on first try: advance to next interval in the bucket's sequence
- Struggled again (2+ attempts): reset to interval[0] of current bucket

### Integration Points

#### 1. Next Question Suggestion (`lib/next-question.ts`)

Modify recommendation priority order:
1. **Due reviews** (overdue first, then hard > medium > easy)
2. Current topic unsolved problems (existing logic)
3. General unsolved problems (existing logic)

When recommending a review, the suggestion card shows:
- Text: "Time to review: [problem title]"
- Accent color: amber/orange (instead of default)

#### 2. Homepage Review Card

- Placement: below hero section, alongside two-path cards
- Only visible when user is logged in AND has reviews due
- Content:
  - Title: "Due for Review" with 🔄 icon
  - Count: "3 problems need review"
  - Up to 3 problem titles with bucket badge and topic
  - "Start Review" button → navigates to first due problem
- Hidden entirely when no reviews are due
- Sort order: overdue first, then by bucket (hard > medium > easy)

#### 3. Practice Page Solve Handler

On problem solve:
- If problem has existing review entry → it's a review → update intervals
- If it's a new solve → create review entry with bucket based on performance

No special "review mode" UI on the practice page — it behaves identically for reviews and new solves.

Daily challenge questions are excluded from the review system (they're ephemeral and can't be revisited). Only `/practice/[id]` problems get review entries.

Time measurement for bucket assignment: elapsed time from first query run to successful solve on that problem (derived from existing attempt data).

### Storage Pattern

- Primary: localStorage (key: `review_schedule`)
- Sync: fire-and-forget upsert to Supabase `review_schedule` table on changes
- Cloud sync on login: pull from Supabase, merge with localStorage (latest wins)

---

## Feature 2: Question Flag Feature

### Data Model

**Supabase table: `flagged_questions`**

| Column          | Type        | Notes                                    |
|-----------------|-------------|------------------------------------------|
| id              | uuid        | Primary key                              |
| user_id         | uuid        | References auth.users                    |
| question_id     | int         | Problem ID (-1 for daily)                |
| question_source | text        | "practice" or "daily"                    |
| category        | text        | See categories below                     |
| message         | text        | Nullable, user-provided description      |
| created_at      | timestamptz | Default now()                            |

Unique constraint on `(user_id, question_id, category)` for deduplication. Re-flagging same category updates the message.

### Categories

- `solution_error` — the expected solution is wrong or produces incorrect results
- `question_error` — the problem description is unclear or incorrect
- `data_error` — the setup data (INSERT values) has issues
- `table_error` — the CREATE TABLE schema is wrong (missing columns, wrong types)
- `other` — free text for anything else

### UI: Flag Button

- A 🤔 button in the toolbar area, next to the Run button
- Appears on both `/practice/[id]` and `/daily` pages
- Subtle styling, doesn't compete with primary actions
- Tooltip: "Report an issue"

### UI: Flag Modal

On click, a dialog opens with:
- Title: "What's wrong with this question?"
- 5 category chips (pill buttons): Solution Error, Question Error, Data Error, Table Error, Other
- User selects one (required)
- Optional textarea: "Describe the issue (optional)"
- Submit button → upserts to Supabase
- Success toast: "Thanks for the feedback!"
- Requires auth — if not logged in, prompt sign-in first

### Deduplication

One flag per user per question per category. If a user flags the same category on the same question again, the message is updated (upsert on the unique constraint).

---

## Files to Create/Modify

### New Files
- `lib/review.ts` — review state management, bucket logic, intervals, localStorage + Supabase sync
- `components/flag/flag-button.tsx` — the 🤔 button component
- `components/flag/flag-modal.tsx` — the flag dialog with category chips and text input
- `components/home/review-card.tsx` — homepage "Due for Review" card

### Modified Files
- `lib/next-question.ts` — prioritize due reviews in recommendation logic
- `app/practice/[id]/practice-client.tsx` — add flag button, update solve handler to create/update review entries
- `app/daily/page.tsx` — add flag button
- `components/home/home-client.tsx` — add review card
- `lib/storage.ts` — add review state helpers if needed

### Supabase
- Create `review_schedule` table
- Create `flagged_questions` table
