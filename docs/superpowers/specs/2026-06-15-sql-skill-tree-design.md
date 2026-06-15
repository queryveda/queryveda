# SQL Skill Tree with Micro-Exercises

**Date:** 2026-06-15
**Status:** Approved

## Problem

QueryVeda has 75 curated SQL practice problems but no structured learning path. Users jump into problems without foundational understanding, and there's no way to learn concepts incrementally. This feature adds a skill tree that teaches SQL concepts through focused micro-exercises before users tackle full problems.

## Design

### Skill Tree Structure

A vertical scrollable path with a main trunk of fundamental SQL concepts and branches for specialized topics.

```
SELECT Basics
     ↓
WHERE & Filtering
     ↓
ORDER BY & LIMIT
     ↓
GROUP BY & HAVING
     ↓
Aggregate Functions
     ↓
  ┌──┼──────────────┐
JOINs  Subqueries  Set Operations
  ↓        ↓
Window   CTEs
Funcs
  ↓
Cumulative &        Consecutive
Sliding Windows     Sequences
  ↓
Advanced Analytics
```

~12-14 nodes total. Each node has 5 micro-exercises, totaling ~60-70 exercises.

### Micro-Exercise Types

Three exercise formats, mixed within each node:

**1. Fill-in-the-blank**
The query is shown with a gap. User types only the missing clause.
```sql
SELECT department, COUNT(*)
FROM employees
_______________
```
*(user types: `GROUP BY department`)*

**2. Build incrementally**
Each step adds one clause to the previous answer. The query grows step by step across 2-3 sub-steps within a single exercise.
- Step 1: "Write a SELECT to get department and count"
- Step 2: "Now add GROUP BY"
- Step 3: "Now add HAVING to filter groups with count > 5"

**3. Fix the query**
A broken query is shown. User fixes the problematic part.
```sql
-- This query has an error. Fix line 3:
SELECT department, COUNT(*)
FROM employees
GROUP BY name  -- wrong column
```

### Content Sourcing: Curated Templates with Light Variation

Each exercise is hand-authored with a core template. Small randomized variations (different table/column names, values) are drawn from a pool of alternatives per exercise. This gives quality control while keeping replay value.

Example variation pool for a GROUP BY exercise:
- Base: `employees` table, `department` column
- Alt 1: `orders` table, `category` column
- Alt 2: `students` table, `grade` column

### Mastery & Unlocking

- Each node: 0-5 exercises completed = mastery percentage
- **60% (3/5 exercises)** unlocks the next node(s) in the tree
- **100% (5/5 exercises)** awards a star displayed on the node
- Locked nodes are visible but greyed out on the tree map
- Progress stored in localStorage, synced to Supabase on login

### Bridge Between Skill Tree and Full Problems

**Forward (learn -> practice):**
Each skill tree node maps to related full problems via topic. Completing a node shows: "Ready for a challenge? Try these problems ->" linking to filtered practice problems.

**Backward (practice -> learn):**
If a user fails a full problem 3+ times, a banner appears: "Need to review? Try the [concept] exercises ->" linking to the relevant skill tree node.

### Data Model

#### TypeScript Types

```typescript
interface SkillNode {
  id: string;                    // e.g., "group-by"
  title: string;
  description: string;          // short concept explanation
  prerequisites: string[];       // node IDs that must be at 60%+
  relatedProblemIds: number[];   // links to existing 75 problems
  exercises: MicroExercise[];
}

interface MicroExercise {
  id: string;
  type: 'fill-blank' | 'build-incremental' | 'fix-query';
  prompt: string;               // instruction text
  setupSQL: string;             // table creation for PGlite
  template: string;             // query with {{BLANK}} placeholder(s)
  editableDefault?: string;     // pre-filled hint text in the gap
  steps?: BuildStep[];          // only for build-incremental type
  variations: Variation[];      // alternative table/column names
  expectedOutput: any[][];      // expected query result (for non-incremental)
  hints: string[];              // 1-2 hints per exercise
}

interface Variation {
  tableName: string;
  columns: Record<string, string>;  // original -> replacement
  setupSQL: string;                  // table creation for this variation
  template: string;                  // adjusted template
  expectedOutput: any[][];
}

// For build-incremental exercises
interface BuildStep {
  prompt: string;
  template: string;             // query so far with {{BLANK}}
  expectedOutput: any[][];
}
```

#### Supabase Schema

```sql
CREATE TABLE skill_tree_progress (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, node_id, exercise_id)
);

ALTER TABLE skill_tree_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill tree progress"
  ON skill_tree_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill tree progress"
  ON skill_tree_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill tree progress"
  ON skill_tree_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

### Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/learn` | `SkillTreeMap` | Vertical scrollable skill tree visualization |
| `/learn/[nodeId]` | `SkillNodeDetail` | Node detail with exercise list, mastery bar, related problems |
| `/learn/[nodeId]/[exerciseId]` | `MicroExerciseView` | Individual exercise with compact editor |

### UI Components

**1. SkillTreeMap** (`/learn`)
- Vertical scrollable path
- Nodes rendered as circles connected by lines/arrows
- Node states: locked (grey), unlocked (outline), in-progress (partial fill), mastered (full fill + star)
- Trunk nodes centered, branch nodes offset left/right
- Mobile-friendly: single column vertical scroll
- Click node to navigate to detail view

**2. SkillNodeDetail** (`/learn/[nodeId]`)
- Node title and short concept description (2-3 sentences, not a full tutorial)
- Mastery progress bar (e.g., "3/5 exercises completed - 60%")
- Exercise list with completion checkmarks
- "Related Problems" section at bottom linking to `/practice` filtered by relevant problems
- Back button to return to tree map

**3. MicroExerciseEditor**
- Compact editor (smaller than the full practice CodeMirror editor)
- Shows the query template with the editable region highlighted (different background color)
- Only the blank/editable portion is a CodeMirror instance; surrounding template is read-only styled text
- Run button executes assembled query against PGlite
- Pass/fail feedback displayed inline below the editor
- "Next Exercise" button on success
- For build-incremental: step indicator (Step 1/3, 2/3, 3/3) with previous steps shown as completed above

**4. StruggleBanner** (on `/practice/[id]`)
- Appears after 3+ failed attempts on a full problem
- Dismissible banner: "Struggling? Review [concept name] exercises ->"
- Links to the most relevant skill tree node based on problem topic
- Tracks failed attempt count in component state (resets on page leave)

### Execution Flow

1. User writes partial SQL in the editable region
2. App assembles the full query by inserting user input into the template
3. Full query runs against PGlite with the exercise's setupSQL
4. Output compared to expectedOutput (order-independent)
5. Pass: mark exercise complete, show success, enable "Next"
6. Fail: show diff between actual and expected, offer hints

### Navigation Integration

- Add "Learn" link to the main navigation bar (between "Home" and "Problems")
- On the landing page, add a CTA card for the skill tree
- Progress page (`/progress`) should show skill tree mastery stats alongside existing problem-solving stats

### Content Authoring Plan

Exercises will be authored in a static TypeScript file (`lib/skill-tree.ts`), following the same pattern as `lib/questions.ts`. The 12-14 nodes with 5 exercises each will be written upfront. Variation pools (2-3 alternatives per exercise) provide replay value.

Node list with exercise distribution:
1. **SELECT Basics** — 5 exercises (2 fill-blank, 2 build-incremental, 1 fix-query)
2. **WHERE & Filtering** — 5 exercises (2 fill-blank, 1 build-incremental, 2 fix-query)
3. **ORDER BY & LIMIT** — 5 exercises (2 fill-blank, 2 build-incremental, 1 fix-query)
4. **GROUP BY & HAVING** — 5 exercises (1 fill-blank, 2 build-incremental, 2 fix-query)
5. **Aggregate Functions** — 5 exercises (2 fill-blank, 1 build-incremental, 2 fix-query)
6. **JOINs** — 5 exercises (2 fill-blank, 2 build-incremental, 1 fix-query)
7. **Subqueries** — 5 exercises (1 fill-blank, 2 build-incremental, 2 fix-query)
8. **Set Operations** — 5 exercises (2 fill-blank, 1 build-incremental, 2 fix-query)
9. **Window Functions** — 5 exercises (2 fill-blank, 2 build-incremental, 1 fix-query)
10. **CTEs** — 5 exercises (1 fill-blank, 2 build-incremental, 2 fix-query)
11. **Cumulative & Sliding Windows** — 5 exercises (2 fill-blank, 1 build-incremental, 2 fix-query)
12. **Consecutive Sequences** — 5 exercises (1 fill-blank, 2 build-incremental, 2 fix-query)
13. **Advanced Analytics** — 5 exercises (1 fill-blank, 2 build-incremental, 2 fix-query)

Total: 65 micro-exercises + ~130-195 variations.

### What This Feature Does NOT Include

- No full tutorial/lesson text per node (just a short 2-3 sentence description)
- No AI-generated exercises at runtime
- No multiplayer or social features on the skill tree
- No separate leaderboard for skill tree progress
- No paid/premium gating on any nodes
