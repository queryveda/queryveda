# Excel Learning Track — Design Spec

**Date:** 2026-06-16  
**Status:** Approved  
**Track:** `excel` (part of multi-track platform expansion)

---

## Overview

Add Excel learning to QueryVeda as a separate track alongside SQL, transforming the platform from a SQL-only tool into a multi-track analytics learning platform. Users choose their track(s) during onboarding (SQL, Excel, or Both), and the platform adapts navigation, content, and progress tracking accordingly.

"Both" users see an integrated experience with cross-references between SQL and Excel concepts (e.g., "You learned GROUP BY — here's the equivalent aggregation in Excel").

## Architecture Approach

**Hybrid: FortuneSheet + Custom Exercise Shell (Approach C)**

- **FortuneSheet** (open-source, React-native spreadsheet library) provides the spreadsheet rendering and formula engine for hands-on exercises
- **ExcelExerciseEditor** wraps FortuneSheet, mirroring how MicroExerciseEditor wraps CodeMirror for SQL
- **ConceptualQuestion** component handles lightweight warmup questions (no spreadsheet needed)
- FortuneSheet is **lazy-loaded** via `next/dynamic` — only loaded on Excel exercise pages
- Designed for Phase 2 expansion: charts, conditional formatting, multi-sheet support

## Track System

### Track Type

```typescript
type Track = 'sql' | 'excel' | 'python'
```

Defined in `lib/types.ts`. Only `sql` and `excel` are active initially. `python` is reserved for future use. The enum prevents garbage values across the entire data layer.

### Onboarding Flow

- First-time users see a track selection screen: "What do you want to learn?" — SQL, Excel, or Both
- "Both" stores `['sql', 'excel']` in the tracks array — there is no separate "both" enum value
- Choice saved to `localStorage` (anonymous) and `user_tracks` table in Supabase (logged in)
- Users can change their track anytime from settings or nav
- "Both" users see cross-references between SQL and Excel concepts in skill tree nodes

### Navigation Changes

- **Track switcher** in top nav — only visible if user selected "Both"
- Single-track users see their track's nav without a switcher
- Mobile: track switcher in hamburger menu
- Home page shows paths based on selected track(s)

## Excel Skill Tree — 12 Nodes

### Basic (Nodes 1-4)

1. **Cell References & Navigation** — A1 notation, absolute (`$A$1`) vs relative references, ranges (A1:B5)
2. **Basic Formulas** — SUM, AVERAGE, COUNT, MIN, MAX
3. **Text Functions** — LEFT, RIGHT, MID, CONCATENATE, TRIM, LEN
4. **Logical Functions** — IF, AND, OR, nested IFs, IFERROR

### Intermediate (Nodes 5-8)

5. **Lookup Functions** — VLOOKUP, HLOOKUP, INDEX/MATCH, XLOOKUP
6. **Date & Time Functions** — DATE, DATEDIFF, EOMONTH, NETWORKDAYS, TEXT formatting
7. **Conditional Aggregation** — SUMIF, COUNTIF, AVERAGEIFS, SUMPRODUCT
8. **Data Cleaning** — SUBSTITUTE, TRIM, VALUE, TEXT, PROPER, removing duplicates

### Advanced Analytics (Nodes 9-12)

9. **Pivot Table Concepts** — Aggregation, grouping, filtering, calculated fields
10. **Array Formulas & Dynamic Arrays** — FILTER, SORT, UNIQUE, SEQUENCE, spill ranges
11. **Statistical Functions** — PERCENTILE, STDEV, CORREL, FORECAST, TREND
12. **Dashboard Formulas** — Dynamic ranges, conditional formatting logic, INDIRECT, data validation

### Exercise Format Per Node

- **1-3 conceptual warmup questions** (multiple choice / fill-in-the-blank) — must complete before unlocking hands-on
- **3-5 hands-on spreadsheet exercises** (type formulas, validate cell output)
- ~50-96 total exercises across 12 nodes

## Exercise Components

### ConceptualQuestion Component

- Renders multiple choice or fill-in-the-blank questions
- No spreadsheet loaded — lightweight, fast rendering
- Shows explanation on correct/incorrect answer
- All warmups in a node must be completed before hands-on exercises unlock

### ExcelExerciseEditor Component

Wraps FortuneSheet, mirroring MicroExerciseEditor's pattern for SQL.

**Exercise types:**
- **write-formula** — Given pre-filled data, write the correct formula in a target cell
- **fix-formula** — A broken formula is provided, user identifies and fixes the error
- **build-step-by-step** — Multi-step: build a small analysis incrementally across cells

**Validation:**
- "Run" button reads target cell values from FortuneSheet's API
- Compares against expected values and/or expected formula strings
- Shows verdict (pass/fail) with progressive hints on failure

### Exercise Data Format

```typescript
interface ExcelExercise {
  id: string                    // e.g., 'basic-formulas-sum-1'
  nodeId: string                // parent skill node
  type: 'write-formula' | 'fix-formula' | 'build-step-by-step'
  title: string
  instruction: string
  initialData: CellData[][]     // pre-filled cell values for FortuneSheet
  targetCells: {
    cell: string                // e.g., 'B6'
    expected: string | number   // expected computed value
    expectedFormula?: string    // optional: validate formula text too
  }[]
  hints: string[]
}

interface ConceptualQuestion {
  id: string
  nodeId: string
  type: 'multiple-choice' | 'fill-blank'
  question: string
  options?: string[]            // for multiple-choice
  correctAnswer: string | number
  explanation: string
}
```

## Routing

### New Routes

| Route | Purpose |
|-------|---------|
| `/onboarding` | Track selection (first visit only) |
| `/excel` | Excel skill tree visualization |
| `/excel/learn/[nodeId]` | Individual Excel skill node with exercises |
| `/excel/practice/[id]` | Excel practice problems (future) |

### Modified Routes

| Route | Change |
|-------|--------|
| `/` (home) | Shows paths based on selected track(s) |
| `/progress` | Adds Excel stats section, filtered by track |
| `/daily` | Future: Excel daily challenge alongside SQL |
| `/leaderboard` | Track filter dropdown |

### Static Generation

Excel skill nodes use `generateStaticParams()` following the same pattern as SQL nodes. All exercise data is statically defined in data files.

## Data Persistence

### Supabase Schema Changes

```sql
-- Postgres enum for track validation
CREATE TYPE track AS ENUM ('sql', 'excel', 'python');

-- New table: user track preferences
CREATE TABLE user_tracks (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  tracks track[] NOT NULL DEFAULT '{sql}'
);

-- Modified: skill_tree_progress gets track column
ALTER TABLE skill_tree_progress
  ADD COLUMN track track NOT NULL DEFAULT 'sql';

-- Modified: leaderboard gets track column
ALTER TABLE leaderboard
  ADD COLUMN track track NOT NULL DEFAULT 'sql';
```

### localStorage Keys

| Key | Purpose |
|-----|---------|
| `queryveda-track` | Selected track(s) |
| `queryveda-excel-progress` | Excel exercise completion state |
| `queryveda-excel-masteries` | Per-node mastery state |

Existing SQL localStorage keys remain unchanged (backwards compatible).

## Phase 2 (Future)

- Charts and data visualization in FortuneSheet
- Conditional formatting exercises
- Multiple sheets/tabs per exercise
- Named ranges and data validation
- Excel daily challenges
- Excel practice problem bank (beyond skill tree)
- Python track implementation

## Dependencies

- **FortuneSheet** — React spreadsheet library (npm: `@fortune-sheet/react`)
- All other dependencies already in the project (Next.js, Supabase, Tailwind, shadcn/ui)
