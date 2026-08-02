# SQL Problems Expansion — Design Spec

**Date:** 2026-08-02
**Status:** Approved design → implementation planning
**Owner:** saibalp

## Goal

Enrich QueryVeda's SQL problem catalog by adding ~30 new, high-quality problems
adapted closely from StrataScratch. The existing 77 problems (`lib/questions.ts`)
are already tested and validated and will **not** be modified. Every new problem
is validated for correctness against PGlite (the same Postgres-WASM engine the app
runs) before it is merged.

## Context (current state)

- Catalog lives in `queryveda/lib/questions.ts` as a `Question[]` (77 entries, ids 1–77).
- `questions.ts` is the single source consumed by `/problems`, `/practice`, `/progress`,
  `/profile`, the home dashboard, and next-question suggestions. Appending entries
  surfaces them everywhere automatically.
- The skill-tree (`lib/skill-tree-data.ts`) has its own separate micro-exercises and is
  out of scope.
- `Question` schema (`lib/types.ts`):
  ```ts
  interface Question {
    id: number; title: string; difficulty: Difficulty; topic: Topic;
    desc: string; setup: string; tables: string[]; cols: string[];
    rows: (string|number|null)[][]; solution: string; tips: string;
    hints: string[]; tests: TestCase[]; note?: string; optSolution?: string;
  }
  interface TestCase { setup: string; rows: (string|number|null)[][]; }
  ```
- `Difficulty = "Easy" | "Medium" | "Hard"`.
- `Topic` is a **closed union** in `lib/types.ts`; `TOPICS` and `TOPIC_COLORS` in
  `lib/constants.ts` must stay in sync with it. Current 5 topics: Aggregations & JOINs,
  Window Functions, Cumulative & Sliding Windows, Consecutive Sequences, Advanced Analytics.
- Engine: `@electric-sql/pglite` (already a dependency). PostgreSQL dialect.
- Existing catalog is window/analytics-heavy; core-SQL fundamentals are absent.

## Decisions (from brainstorming)

1. **Scope:** add new problems only; do not audit/modify the existing 77.
2. **Source:** adapt **closely** from StrataScratch — same core logical pattern, but
   original scenario, schema, column names, data, text, solution, hints, and tests.
   Not verbatim copies (avoids IP issues; SS author solutions are Premium-gated anyway).
3. **Data acquisition:** use the connected **StrataScratch MCP** (`list_questions`,
   `get_question`, `get_dataset_schema`, optionally `run_code`) — not browser scraping.
   The freemium pool exposed via MCP is ~67 questions (~29 Easy / 33 Medium / 5 Hard).
4. **Categories:** introduce **new `Topic` categories** to enrich coverage (the freemium
   pool is fundamentals-heavy), plus add some problems into the existing 5.
5. **Correctness:** every new problem + every hidden test is validated via PGlite before merge.

## Scope of new content

- **~30 new problems**, ids 78+, appended to `lib/questions.ts`.
- **Difficulty spread ≈ 10 Easy / 14 Medium / 6 Hard.** SS's freemium Hard pool is thin,
  so some Hard problems are Medium structures elevated with an added twist (extra join,
  tie-breaking, multi-step aggregation, edge-case handling).
- **New `Topic` categories** (final list finalized during implementation as problems are
  selected; candidates): `String & Text`, `Date & Time`, `Ratios & Rates`,
  `Self-Joins & Comparisons`, `Filtering & Conditionals`, `Set Operations`. Existing 5
  topics also receive new problems where SS offers analytics/ranking material.

## Adaptation workflow (per problem)

1. Select an SS source question id from the freemium pool.
2. `get_question` + `get_dataset_schema` to learn the prompt and table/column structure.
3. **Reframe:** new domain/company, renamed columns, self-contained `CREATE TABLE` +
   `INSERT` (~5–12 rows) designed to exercise the target pattern **and** its edge cases
   (NULLs, ties, empty groups, boundary dates).
4. Write the reference `solution` (Postgres dialect), `tips`, exactly **3 progressive
   hints**, and **1–2 hidden `tests`** (each with its own `setup` + expected `rows`).
5. Assign `difficulty` and `topic`; write a clear `desc` that states the schema line,
   the exact return columns, and any edge-case rules (ordering, ties, NULL handling).
6. Validate (see below). Iterate until green.

**"Adapt closely" guardrail:** preserve the SS problem's core logical structure/pattern;
change all surface details (scenario, columns, data, wording). Recognizably similar,
never identical. Do not copy SS problem text or datasets.

## Validation harness (quality backbone)

- New script: `queryveda/scripts/validate-questions.mjs`, run with Node + `@electric-sql/pglite`.
- For each targeted question:
  - Run `setup`, then `solution`. Assert the result's column set matches `cols` and its
    rows match `rows`.
  - For each `TestCase`: run `test.setup`, then `solution`. Assert rows match `test.rows`.
- **Row comparison rules:**
  - Normalize values before compare: PGlite `DATE` → `YYYY-MM-DD` string; numeric types →
    number; `null` preserved; trim/normalize types so `100` (int) and `"100"` match intent.
  - Order-sensitive comparison when the problem/`desc` implies an ORDER BY; otherwise
    order-insensitive (multiset) comparison. Each problem declares which (default: the
    solution's own ORDER BY determines order-sensitivity; problems without ORDER BY are
    compared as multisets).
- Output: per-problem, per-test PASS/FAIL with diffs. **New problems must be 100% green**
  before they are added/committed. The harness can also run over the existing 77 as a
  sanity check (expected: all pass) but must never modify them.
- The harness is a dev/CI tool (script only); it is not shipped in the app bundle.

## Category / UI integration

- If new categories are introduced:
  - Add each to the `Topic` union in `lib/types.ts`.
  - Add matching entries to `TOPICS` and `TOPIC_COLORS` in `lib/constants.ts`.
  - Verify topic-driven UI (skill-radar, bento dashboard, problem-card, filters) renders
    dynamically from `TOPICS`/`TOPIC_COLORS` rather than hardcoding the current 5; fix any
    hardcoded references found.
- Verify `/practice/[id]` `generateStaticParams` picks up new ids so static pages build.
- Run typecheck + `next build` (static export) to confirm no breakage.

## Phasing

- **Phase 0 — Harness:** build `validate-questions.mjs`; prove all existing 77 pass.
- **Phase 1 — Pilot:** author ~8 problems across 2–3 new categories, fully validated and
  appended; review the quality bar together before scaling.
- **Phase 2 — Remainder:** author the remaining ~22 problems (all validated).
- **Phase 3 — Wiring & ship:** category/UI wiring, typecheck, build, commit.

## Non-goals

- Modifying, reframing, or re-validating the existing 77 problems.
- Changing the skill-tree micro-exercises.
- Copying StrataScratch problems, text, or datasets verbatim.
- Building runtime UI for categories beyond what `TOPICS`/`TOPIC_COLORS` already drive.

## Success criteria

- ~30 new validated problems appended to `lib/questions.ts` (ids 78+), existing 77 untouched.
- New categories wired through `types.ts`/`constants.ts` and rendering correctly.
- `validate-questions.mjs` reports 100% pass for all new problems and their hidden tests.
- Typecheck and static build pass; new problems appear and are solvable in `/problems`
  and `/practice`.
