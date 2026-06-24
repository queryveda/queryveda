# SQL EXPLAIN Query Plan Viewer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Plan" tab to the practice page that shows the PostgreSQL EXPLAIN output as an indented tree view, run automatically alongside every query execution.

**Architecture:** Add an `explainQuery()` helper to `lib/pglite.ts` that runs `EXPLAIN (FORMAT JSON)`. In `practice-client.tsx`, call it during `handleRun` and store the result in state. Add a tab switcher (Results/Plan) above the output area, and render the plan via a new `PlanViewer` component that recursively walks the JSON plan tree.

**Tech Stack:** PgLite (EXPLAIN JSON), React, Tailwind CSS

## Global Constraints

- No new dependencies — use only what's already installed
- Follow existing component patterns (functional components, Tailwind classes, `"use client"` directive)
- Plan tab only visible after a query has been run (no empty state needed beyond "Run a query to see its plan")

---

### Task 1: Add `explainQuery` helper to pglite.ts

**Files:**
- Modify: `lib/pglite.ts:76-86` (after `executeQuery`)

**Interfaces:**
- Consumes: `db.query()` from PgLite instance (same type as `executeQuery` uses)
- Produces: `explainQuery(db, sql): Promise<PlanNode>` where `PlanNode` is a new exported type

- [ ] **Step 1: Add the PlanNode type and explainQuery function**

Add this after the `executeQuery` function (after line 86) in `lib/pglite.ts`:

```typescript
// --- EXPLAIN query plan ---

export interface PlanNode {
  "Node Type": string;
  "Relation Name"?: string;
  "Alias"?: string;
  "Join Type"?: string;
  "Index Name"?: string;
  "Hash Cond"?: string;
  "Filter"?: string;
  "Sort Key"?: string[];
  "Startup Cost": number;
  "Total Cost": number;
  "Plan Rows": number;
  "Plan Width": number;
  Plans?: PlanNode[];
  [key: string]: unknown;
}

export async function explainQuery(
  db: { query: (sql: string) => Promise<{ fields: { name: string }[]; rows: Record<string, unknown>[] }> },
  sql: string
): Promise<PlanNode | null> {
  try {
    const res = await db.query(`EXPLAIN (FORMAT JSON) ${sql}`);
    const raw = res.rows[0]?.["QUERY PLAN"];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return (parsed as { Plan: PlanNode }[])[0]?.Plan ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds (no type errors)

- [ ] **Step 3: Commit**

```bash
git add lib/pglite.ts
git commit -m "feat: add explainQuery helper for EXPLAIN JSON output"
```

---

### Task 2: Create PlanViewer component

**Files:**
- Create: `components/practice/plan-viewer.tsx`

**Interfaces:**
- Consumes: `PlanNode` type from `lib/pglite.ts`
- Produces: `<PlanViewer plan={PlanNode | null} />` React component

- [ ] **Step 1: Create the PlanViewer component**

Create `components/practice/plan-viewer.tsx`:

```tsx
"use client";

import type { PlanNode } from "@/lib/pglite";

interface PlanViewerProps {
  plan: PlanNode | null;
}

function costColor(cost: number, maxCost: number): string {
  if (maxCost === 0) return "text-foreground";
  const ratio = cost / maxCost;
  if (ratio > 0.6) return "text-orange-500 dark:text-orange-400";
  if (ratio > 0.3) return "text-yellow-600 dark:text-yellow-400";
  return "text-foreground";
}

function findMaxCost(node: PlanNode): number {
  let max = node["Total Cost"];
  for (const child of node.Plans ?? []) {
    max = Math.max(max, findMaxCost(child));
  }
  return max;
}

function NodeRow({ node, maxCost, depth }: { node: PlanNode; maxCost: number; depth: number }) {
  const label = node["Node Type"] + (node["Join Type"] ? ` (${node["Join Type"]})` : "");
  const relation = node["Relation Name"];
  const cost = node["Total Cost"];
  const rows = node["Plan Rows"];
  const filter = node["Filter"];
  const sortKey = node["Sort Key"];
  const indexName = node["Index Name"];

  return (
    <div>
      <div className="flex items-baseline gap-2 py-1" style={{ paddingLeft: `${depth * 20}px` }}>
        <span className="text-muted-foreground select-none">→</span>
        <span className="font-medium">{label}</span>
        {relation && (
          <span className="text-muted-foreground text-xs">
            on <span className="font-mono">{relation}</span>
          </span>
        )}
        {indexName && (
          <span className="text-muted-foreground text-xs">
            using <span className="font-mono">{indexName}</span>
          </span>
        )}
        <span className={`ml-auto text-xs tabular-nums ${costColor(cost, maxCost)}`}>
          cost: {cost.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          rows: {rows}
        </span>
      </div>
      {filter && (
        <div className="text-xs text-muted-foreground font-mono" style={{ paddingLeft: `${depth * 20 + 28}px` }}>
          Filter: {filter}
        </div>
      )}
      {sortKey && (
        <div className="text-xs text-muted-foreground font-mono" style={{ paddingLeft: `${depth * 20 + 28}px` }}>
          Sort Key: {sortKey.join(", ")}
        </div>
      )}
      {(node.Plans ?? []).map((child, i) => (
        <NodeRow key={i} node={child} maxCost={maxCost} depth={depth + 1} />
      ))}
    </div>
  );
}

export function PlanViewer({ plan }: PlanViewerProps) {
  if (!plan) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Run a query to see its execution plan.
      </p>
    );
  }

  const maxCost = findMaxCost(plan);

  return (
    <div className="rounded-xl border p-3 text-sm font-mono overflow-x-auto">
      <NodeRow node={plan} maxCost={maxCost} depth={0} />
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add components/practice/plan-viewer.tsx
git commit -m "feat: add PlanViewer component for query plan tree display"
```

---

### Task 3: Wire EXPLAIN into practice page with tab switcher

**Files:**
- Modify: `app/practice/[id]/practice-client.tsx`

**Interfaces:**
- Consumes: `explainQuery` and `PlanNode` from `lib/pglite.ts`, `PlanViewer` from `components/practice/plan-viewer.tsx`
- Produces: Updated practice page with Results/Plan tabs

- [ ] **Step 1: Add imports**

Add to the imports at the top of `practice-client.tsx` (after line 6):

```typescript
import { runTests, executeQuery, explainQuery, type QueryResult, type PlanNode } from "@/lib/pglite";
```

This replaces the existing line 6:
```typescript
import { runTests, executeQuery, type QueryResult } from "@/lib/pglite";
```

Also add the PlanViewer import after line 17:

```typescript
import { PlanViewer } from "@/components/practice/plan-viewer";
```

- [ ] **Step 2: Add state for plan and active tab**

After line 42 (`const [userResult, setUserResult] = useState<QueryResult | null>(null);`), add:

```typescript
const [planResult, setPlanResult] = useState<PlanNode | null>(null);
const [outputTab, setOutputTab] = useState<"results" | "plan">("results");
```

- [ ] **Step 3: Clear plan state on question change**

In the `useEffect` that resets state on question change (around line 66), add `setPlanResult(null);` after `setUserResult(null);`:

```typescript
setPlanResult(null);
setOutputTab("results");
```

- [ ] **Step 4: Run EXPLAIN alongside tests in handleRun**

Inside `handleRun`, after the `runTests` call succeeds (after line 104), add the EXPLAIN call. Replace the try block contents (lines 103-115):

```typescript
    try {
      const result = await runTests(db, question, trimmed);
      setVerdict({
        type: result.passed ? "pass" : "fail",
        message: result.message,
      });
      setUserResult(result.userResult);

      // Run EXPLAIN in parallel (non-blocking — failure is silent)
      explainQuery(db, trimmed).then(setPlanResult);

      if (result.passed) {
        markSolved(questionId);
      } else {
        markAttempted(questionId);
        setFailCount((prev) => prev + 1);
      }
    }
```

- [ ] **Step 5: Add tab switcher and PlanViewer to the output area**

Replace the "Your Output" section (lines 281-285) with a tabbed output:

```tsx
          {/* Output tabs */}
          {userResult && (
            <div>
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setOutputTab("results")}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    outputTab === "results"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Results
                </button>
                <button
                  onClick={() => setOutputTab("plan")}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    outputTab === "plan"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Plan
                </button>
              </div>
              {outputTab === "results" ? (
                <ResultTable cols={userResult.cols} rows={userResult.rows} />
              ) : (
                <PlanViewer plan={planResult} />
              )}
            </div>
          )}
```

- [ ] **Step 6: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 7: Manual test**

1. Open `/practice/1/` in browser
2. Write a simple SELECT query and hit Run
3. Verify "Results" tab shows the query output as before
4. Click "Plan" tab — verify the EXPLAIN tree renders with node types, costs, and row counts
5. Run a JOIN query — verify nested plan nodes appear with indentation
6. Verify cost coloring: higher-cost nodes should appear orange/yellow

- [ ] **Step 8: Commit**

```bash
git add app/practice/[id]/practice-client.tsx
git commit -m "feat: wire EXPLAIN tab into practice page with Results/Plan switcher"
```
