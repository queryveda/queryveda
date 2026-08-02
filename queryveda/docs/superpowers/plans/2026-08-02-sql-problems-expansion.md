# SQL Problems Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~30 new, PGlite-validated SQL practice problems to QueryVeda (ids 78+), adapted closely from StrataScratch, enriching the catalog with new topic categories — without modifying the existing 77.

**Architecture:** New problems are `Question` objects appended to `lib/questions.ts`, surfaced automatically by every consumer (`/problems`, `/practice`, `/progress`, home). A Node validation harness (`scripts/validate-questions.mjs`) reuses the app's real grader (`runTests` from `lib/pglite.ts`) against `@electric-sql/pglite`, so a problem is "valid" iff its reference solution reproduces the visible + hidden expected rows exactly as the browser would. New topic categories are added to the `Topic` union and its dependent maps.

**Tech Stack:** Next.js (static export), TypeScript, `@electric-sql/pglite` 0.5.x (PostgreSQL WASM), Node ≥22 native TS type-stripping, StrataScratch MCP (`list_questions`/`get_question`/`get_dataset_schema`).

## Global Constraints

- Do NOT modify, reframe, or fix the existing 77 problems (ids 1–77). Append only.
- Do NOT copy StrataScratch problem text, schemas, or datasets verbatim — adapt closely: same core pattern, original scenario/columns/data/text/solution/hints/tests.
- Every new problem MUST pass the harness (`node scripts/validate-questions.mjs --min-id=78`, PASS = FAIL 0) before its task is committed.
- PostgreSQL dialect only (must run on PGlite 0.5.x). No features unsupported there (e.g. no nested window functions).
- `Question` shape (`lib/types.ts`): `{ id, title, difficulty, topic, desc, setup, tables, cols, rows, solution, tips, hints (exactly 3), tests (1–2 TestCase), note?, optSolution? }`.
- Ids are sequential starting at 78. `title` follows existing convention `"Q<id> · <Name>"`.
- Keep `Topic` union (`lib/types.ts`), `TOPICS` + `TOPIC_COLORS` (`lib/constants.ts`), and the short-label maps in `components/progress/skill-radar.tsx` and `components/profile/share-card.tsx` in sync.

---

## File Structure

- `scripts/validate-questions.mjs` — CREATE. Node validation harness (dev tool, not shipped).
- `lib/questions.ts` — MODIFY. Line 1 → `import type`; append new `Question` objects (ids 78+).
- `lib/types.ts` — MODIFY. Add new members to the `Topic` union.
- `lib/constants.ts` — MODIFY. Add new entries to `TOPICS` and `TOPIC_COLORS`.
- `components/progress/skill-radar.tsx` — MODIFY. Add new topics to `shortLabels`.
- `components/profile/share-card.tsx` — MODIFY. Add new topics to its short-label map.

---

### Task 1: Validation harness + native-TS import fix

> **STATUS: already implemented and verified during planning** (baseline: 65/75 existing pass; the 10 failures are pre-existing content bugs, out of scope — see spec). Steps below document it for a fresh executor and to commit it.

**Files:**
- Create: `scripts/validate-questions.mjs`
- Modify: `lib/questions.ts:1`

**Interfaces:**
- Consumes: `runTests` and `questions` from `lib/pglite.ts` / `lib/questions.ts` (native TS import).
- Produces: CLI `node scripts/validate-questions.mjs [--min-id=N] [--id=a,b]`; exit 0 iff all targeted problems pass.

- [ ] **Step 1: Fix the type-only import** in `lib/questions.ts` line 1:

```ts
import type { Question } from "./types";
```

- [ ] **Step 2: Create `scripts/validate-questions.mjs`** with exactly this content:

```js
#!/usr/bin/env node
import { PGlite } from "@electric-sql/pglite";
import { runTests } from "../lib/pglite.ts";
import { questions } from "../lib/questions.ts";

// Browser PGlite returns DATE as local-midnight Date; Node returns ISO strings.
// Reproduce the browser so fmtDate renders YYYY-MM-DD identically. Without this,
// date problems false-fail (39/75 vs 65/75).
const dateParser = (v) => {
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
};
const parsers = { 1082: dateParser };

function parseArgs(argv) {
  let minId = null, ids = null;
  for (const a of argv.slice(2)) {
    if (a.startsWith("--min-id=")) minId = Number(a.slice(9));
    else if (a.startsWith("--id=")) ids = a.slice(5).split(",").map(Number);
  }
  return { minId, ids };
}

async function main() {
  const { minId, ids } = parseArgs(process.argv);
  let targets = questions;
  if (ids) targets = targets.filter((q) => ids.includes(q.id));
  else if (minId != null) targets = targets.filter((q) => q.id >= minId);

  let pass = 0; const fails = [];
  for (const q of targets) {
    const db = new PGlite({ parsers });
    try {
      const r = await runTests(db, q, q.solution);
      if (r.passed) pass++; else fails.push({ id: q.id, title: q.title, msg: r.message });
    } catch (e) { fails.push({ id: q.id, title: q.title, msg: `THREW ${e.message}` }); }
    finally { await db.close(); }
  }
  console.log(`\nValidated ${targets.length} problem(s): PASS ${pass} / FAIL ${fails.length}`);
  for (const f of fails) console.log(`  ✗ #${f.id} ${f.title}: ${f.msg}`);
  process.exit(fails.length > 0 ? 1 : 0);
}
main();
```

- [ ] **Step 3: Run the harness over the full catalog**

Run: `node scripts/validate-questions.mjs`
Expected: `Validated 75 problem(s): PASS 65 / FAIL 10` (the 10 are the known pre-existing bugs: Q15,16,27,30,32,42,50,61,63,68). This confirms the harness is wired and faithful.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-questions.mjs lib/questions.ts
git commit -m "feat(playground): add PGlite validation harness for SQL problems"
```

---

### Task 2: Add new topic categories

**Files:**
- Modify: `lib/types.ts` (the `Topic` union)
- Modify: `lib/constants.ts` (`TOPICS`, `TOPIC_COLORS`)
- Modify: `components/progress/skill-radar.tsx` (`shortLabels`)
- Modify: `components/profile/share-card.tsx` (short-label map)

**Interfaces:**
- Produces: 6 new valid `Topic` values usable by problems in later tasks: `"Filtering & Conditionals"`, `"String & Text"`, `"Date & Time"`, `"Ratios & Rates"`, `"Self-Joins & Comparisons"`, `"Set Operations"`.

- [ ] **Step 1: Extend the `Topic` union** in `lib/types.ts`:

```ts
export type Topic =
  | "Aggregations & JOINs"
  | "Window Functions"
  | "Cumulative & Sliding Windows"
  | "Consecutive Sequences"
  | "Advanced Analytics"
  | "Filtering & Conditionals"
  | "String & Text"
  | "Date & Time"
  | "Ratios & Rates"
  | "Self-Joins & Comparisons"
  | "Set Operations";
```

- [ ] **Step 2: Extend `TOPICS` and `TOPIC_COLORS`** in `lib/constants.ts` (append after the existing 5):

```ts
// in TOPICS array, append:
  "Filtering & Conditionals",
  "String & Text",
  "Date & Time",
  "Ratios & Rates",
  "Self-Joins & Comparisons",
  "Set Operations",
```
```ts
// in TOPIC_COLORS record, append:
  "Filtering & Conditionals": "#0ea5e9",
  "String & Text": "#14b8a6",
  "Date & Time": "#a855f7",
  "Ratios & Rates": "#f43f5e",
  "Self-Joins & Comparisons": "#f97316",
  "Set Operations": "#84cc16",
```

- [ ] **Step 3: Add short labels in `components/progress/skill-radar.tsx`** (inside the `shortLabels` object, ~line 114):

```ts
  "Filtering & Conditionals": "Filter",
  "String & Text": "Strings",
  "Date & Time": "Dates",
  "Ratios & Rates": "Ratios",
  "Self-Joins & Comparisons": "Self-Join",
  "Set Operations": "Set Ops",
```

- [ ] **Step 4: Add the same short labels in `components/profile/share-card.tsx`** (inside its short-label map, ~line 173) — identical six lines as Step 3.

- [ ] **Step 5: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: no errors (in particular no "missing property" errors on the `Record<Topic, …>` maps).

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/constants.ts components/progress/skill-radar.tsx components/profile/share-card.tsx
git commit -m "feat(playground): add six new SQL problem categories"
```

---

## Authoring procedure (used by Tasks 3–7)

For each problem, a fresh executor MUST follow this loop. **Worked reference:** problem #78 below (validated: visible + hidden tests pass).

1. **Fetch the source** via StrataScratch MCP: `get_question(id)` and `get_dataset_schema(id, code_type=1)`. Read the prompt and table/column structure.
2. **Reframe** (adapt closely, not verbatim): pick a fresh domain/company, rename columns, keep the SAME core logical pattern.
3. **Author a self-contained `setup`**: `DROP TABLE IF EXISTS …; CREATE TABLE …; INSERT …` with ~5–12 rows that exercise the pattern AND its edge cases (NULLs, ties, boundaries, empty groups).
4. Write `desc` (schema line + exact return columns + edge-case rules), `solution` (Postgres/PGlite-safe), `tips`, exactly **3** progressive `hints`, and **1–2** hidden `tests` (each a `{setup, rows}` with DIFFERENT data proving the solution isn't hardcoded).
5. Compute `cols` and `rows` from the solution's actual output (run it — see validation), never by hand-guessing.
6. Assign `id` (next sequential), `difficulty`, `topic` (one of the 11).
7. **Validate before committing:** `node scripts/validate-questions.mjs --id=<id>` must report PASS. Fix until green. Then validate the whole new range `--min-id=78`.

**Worked reference — problem #78** (append verbatim as the first new entry; already validated):

```ts
{id:78,title:"Q78 · Returning Customers Within a Week",difficulty:"Medium",topic:"Date & Time",
 desc:"Orders(order_id INT, customer_id INT, ordered_at DATE, dish TEXT, amount INT)\n\nA returning customer placed another order 1 to 7 days after their FIRST order (same-day orders don't count).\nReturn: customer_id",
 setup:`DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders(order_id INT, customer_id INT, ordered_at DATE, dish TEXT, amount INT);
INSERT INTO Orders VALUES
 (1,1,'2025-01-01','Ramen',400),(2,1,'2025-01-05','Sushi',600),
 (3,2,'2025-02-01','Tacos',300),(4,2,'2025-02-01','Burrito',350),(5,2,'2025-02-15','Nachos',250),
 (6,3,'2025-03-01','Pizza',500),(7,3,'2025-03-08','Pasta',450),
 (8,4,'2025-04-01','Curry',550),(9,4,'2025-04-09','Naan',150),
 (10,5,'2025-05-01','Salad',200);`,
 tables:["orders"],
 cols:["customer_id"],
 rows:[[1],[3]],
 solution:`SELECT DISTINCT f.customer_id
FROM (SELECT customer_id, MIN(ordered_at) AS first_dt FROM Orders GROUP BY customer_id) f
JOIN Orders o ON o.customer_id = f.customer_id
 AND o.ordered_at > f.first_dt
 AND o.ordered_at <= f.first_dt + 7`,
 tips:"Find each customer's first order date with MIN(...) GROUP BY, then join back to look for any order in the (first, first+7] window. DISTINCT collapses multiple qualifying orders.",
 hints:["Get each customer's first order date using MIN(ordered_at) with GROUP BY customer_id.","Join that back to Orders to find any order strictly after the first date.","Keep only orders where ordered_at <= first_date + 7 days; wrap in DISTINCT for the id list."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders(order_id INT, customer_id INT, ordered_at DATE, dish TEXT, amount INT);
INSERT INTO Orders VALUES
 (1,10,'2025-06-01','A',100),(2,10,'2025-06-02','B',100),
 (3,20,'2025-06-01','C',100),(4,20,'2025-06-08','D',100),
 (5,30,'2025-06-01','E',100),(6,30,'2025-06-10','F',100);`,
   rows:[[10],[20]]}
 ]},
```

---

### Task 3: Pilot batch — 8 problems (QUALITY CHECKPOINT)

Author 8 problems across the new categories to establish the quality bar. **After validating and committing, STOP and get the owner's review before scaling.**

**Files:** Modify `lib/questions.ts` (append ids 78–85).

**Work queue (SS source id → topic / difficulty):**
- 78 ← SS 10322 "Finding User Purchases" → Date & Time / Medium *(already authored above — append it)*
- 79 ← SS 2024 "Unique Users Per Client Per Month" → Date & Time / Easy
- 80 ← SS 10005 "Hour Of Highest Gas Expense" → Date & Time / Easy
- 81 ← SS 9805 "Drafts containing a word" → String & Text / Easy
- 82 ← SS 9842 "First Names 6 letters ending in a letter" → String & Text / Medium
- 83 ← SS 9781 "Processed Ticket Rate By Type" → Ratios & Rates / Medium
- 84 ← SS 10090 "Percentage of Shipable Orders" → Ratios & Rates / Medium
- 85 ← SS 2168 "Users Missing Phone Numbers" → Filtering & Conditionals / Easy

- [ ] **Step 1:** For ids 79–85, follow the Authoring procedure (fetch via MCP, reframe, author full `Question`). Append #78 (from the worked reference) plus 79–85 to `lib/questions.ts`.
- [ ] **Step 2: Validate the new range**

Run: `node scripts/validate-questions.mjs --min-id=78`
Expected: `PASS 8 / FAIL 0`. Fix any failures and re-run until green.

- [ ] **Step 3: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/questions.ts
git commit -m "feat(playground): add pilot batch of 8 SQL problems (ids 78-85)"
```

- [ ] **Step 5: CHECKPOINT** — present the 8 problems to the owner; incorporate feedback on scenario style, difficulty calibration, hint quality, and data realism before proceeding to Task 4.

---

### Task 4: String & Text + Date & Time batch — 6 problems

**Files:** Modify `lib/questions.ts` (append ids 86–91).

**Work queue:**
- 86 ← SS 9817 "Count occurrences of words in drafts" → String & Text / Medium
- 87 ← SS 10024 "Wine varieties tasted by a taster" → String & Text / Easy
- 88 ← SS 9814 "Counting Instances in Text" → String & Text / Hard
- 89 ← SS 2056 "Number of Shipments Per Month" → Date & Time / Easy
- 90 ← SS 10004 "Rides on rainy days before noon" → Date & Time / Medium
- 91 ← SS 10285 "Acceptance Rate By Date" → Date & Time / Medium

- [ ] **Step 1:** Author ids 86–91 per the Authoring procedure; append to `lib/questions.ts`.
- [ ] **Step 2:** Run `node scripts/validate-questions.mjs --min-id=78` → expect `PASS 14 / FAIL 0`.
- [ ] **Step 3:** Run `node_modules/.bin/tsc --noEmit` → no errors.
- [ ] **Step 4:** Commit: `git commit -am "feat(playground): add String & Text / Date & Time problems (ids 86-91)"`

---

### Task 5: Ratios & Rates + Filtering & Conditionals batch — 6 problems

**Files:** Modify `lib/questions.ts` (append ids 92–97).

**Work queue:**
- 92 ← SS 2005 "Share of Active Users" → Ratios & Rates / Medium
- 93 ← SS 2102 "Flags per Video" → Ratios & Rates / Medium
- 94 ← SS 10319 "Monthly Percentage Difference" → Ratios & Rates / Hard
- 95 ← SS 2167 "High Earners in Support Departments" → Filtering & Conditionals / Easy
- 96 ← SS 9937 "Athletes over 40 with Bronze/Silver" → Filtering & Conditionals / Easy
- 97 ← SS 9881 "Survivors by Passenger Class (CASE)" → Filtering & Conditionals / Medium

- [ ] **Step 1:** Author ids 92–97; append.
- [ ] **Step 2:** `node scripts/validate-questions.mjs --min-id=78` → expect `PASS 20 / FAIL 0`.
- [ ] **Step 3:** `node_modules/.bin/tsc --noEmit` → no errors.
- [ ] **Step 4:** Commit: `git commit -am "feat(playground): add Ratios & Rates / Filtering problems (ids 92-97)"`

---

### Task 6: Self-Joins & Comparisons + Set Operations batch — 6 problems

**Files:** Modify `lib/questions.ts` (append ids 98–103).

**Work queue:**
- 98 ← SS 9894 "Employee and Manager Salaries" → Self-Joins & Comparisons / Medium
- 99 ← SS 9905 "Highest Target Under Manager" → Self-Joins & Comparisons / Medium
- 100 ← SS 10085 "Matching User Pairs (same attributes)" → Self-Joins & Comparisons / Hard
- 101 ← SS 10025 "Varieties in either dataset (UNION)" → Set Operations / Easy
- 102 ← SS 10299 "Finding Updated Records (anti-join/EXCEPT)" → Set Operations / Medium
- 103 ← SS 9813 "Symmetric friends network (UNION)" → Set Operations / Medium

- [ ] **Step 1:** Author ids 98–103; append.
- [ ] **Step 2:** `node scripts/validate-questions.mjs --min-id=78` → expect `PASS 26 / FAIL 0`.
- [ ] **Step 3:** `node_modules/.bin/tsc --noEmit` → no errors.
- [ ] **Step 4:** Commit: `git commit -am "feat(playground): add Self-Join / Set Operations problems (ids 98-103)"`

---

### Task 7: Deepen existing strengths — 4 problems

Add advanced problems into the EXISTING analytics/window/aggregation topics.

**Files:** Modify `lib/questions.ts` (append ids 104–107).

**Work queue:**
- 104 ← SS 2007 "Rank Variance Per Country" → Advanced Analytics / Hard
- 105 ← SS 2054 "Consecutive Days" → Consecutive Sequences / Hard
- 106 ← SS 10172 "Best Selling Item" → Window Functions / Hard
- 107 ← SS 9892 "Second Highest Salary" → Aggregations & JOINs / Medium

- [ ] **Step 1:** Author ids 104–107; append. (Reminder: no nested/illegal window syntax — PGlite 0.5.x.)
- [ ] **Step 2:** `node scripts/validate-questions.mjs --min-id=78` → expect `PASS 30 / FAIL 0`.
- [ ] **Step 3:** `node_modules/.bin/tsc --noEmit` → no errors.
- [ ] **Step 4:** Commit: `git commit -am "feat(playground): add advanced analytics/window problems (ids 104-107)"`

---

### Task 8: Integration verification & final build

**Files:** none created; verification + possibly `app/practice/[id]/page.tsx` if `generateStaticParams` doesn't already derive ids from `questions`.

- [ ] **Step 1: Confirm static pages cover new ids.** Inspect `app/practice/[id]/page.tsx`:

Run: `grep -n "generateStaticParams\|questions" app/practice/[id]/page.tsx`
Expected: `generateStaticParams` maps over `questions` (so ids 78–107 are included automatically). If it hardcodes a range/count, update it to derive from `questions`.

- [ ] **Step 2: Full harness run** (entire catalog):

Run: `node scripts/validate-questions.mjs`
Expected: `PASS 95 / FAIL 10` (65 existing + 30 new pass; the 10 pre-existing failures unchanged and untouched).

- [ ] **Step 3: Typecheck the whole project**

Run: `node_modules/.bin/tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Production build (static export)**

Run: `npm run build`
Expected: build succeeds; `/practice/78` … `/practice/107` are emitted.

- [ ] **Step 5: Commit any build/config fixes** (if Step 1 required a change):

```bash
git add app/practice/[id]/page.tsx
git commit -m "fix(playground): include new problem ids in static params"
```

---

## Self-Review notes

- **Spec coverage:** harness (Task 1), new categories + UI sync (Task 2), ~30 adapted+validated problems (Tasks 3–7 = 8+6+6+6+4 = 30), difficulty spread ≈10E/14M/6H (per work-queue labels), build/static wiring (Task 8). ✓
- **Known pre-existing failures** (Q15,16,27,30,32,42,50,61,63,68) are explicitly out of scope and left unchanged; Task 8 asserts they remain the only failures. ✓
- **No new dependencies:** harness runs on Node native TS + existing `@electric-sql/pglite`. ✓
- **Adapt-closely / IP:** enforced in Global Constraints and the Authoring procedure. ✓
