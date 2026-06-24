# Excel Progress on Profile Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Excel skill tree progress and achievements to the profile page (both owner and shared views), computed from Supabase's `skill_tree_progress` table.

**Architecture:** Add `computeExcelStats()` to `lib/profile.ts` that queries Supabase for Excel track data and computes per-node mastery + 6 achievements. Extend `ProfileStats` with an `excelStats` field. Add Excel sections to `profile-client.tsx` and a summary line to the share card canvas.

**Tech Stack:** Supabase (existing `skill_tree_progress` table), React, Tailwind CSS

## Global Constraints

- No new dependencies
- No new Supabase tables or columns
- Follow existing component patterns (`"use client"`, Tailwind, functional components)
- Excel stats layout on profile should match the Excel section in `app/progress/page.tsx`

---

### Task 1: Add Excel stats computation to lib/profile.ts

**Files:**
- Modify: `lib/profile.ts`

**Interfaces:**
- Consumes: `skill_tree_progress` table via Supabase (columns: `user_id`, `exercise_id`, `node_id`, `completed`, `track`)
- Consumes: `excelSkillTreeNodes` from `lib/excel-skill-tree-data.ts` (node definitions with exercises and conceptual questions)
- Produces: `ExcelProfileStats` type and `excelStats` field on `ProfileStats`

- [ ] **Step 1: Add ExcelProfileStats type and extend ProfileStats**

Add after the `ProfileStats` interface (after line 29) in `lib/profile.ts`:

```typescript
export interface ExcelNodeProgress {
  nodeId: string;
  title: string;
  completed: number;
  total: number;
}

export interface ExcelProfileStats {
  totalCompleted: number;
  totalItems: number;
  starredCount: number;
  nodeMasteries: ExcelNodeProgress[];
  achievements: Achievement[];
}
```

Add to the `ProfileStats` interface, after `memberSince`:

```typescript
  excelStats: ExcelProfileStats;
```

- [ ] **Step 2: Add the import for excelSkillTreeNodes**

Add to the imports at the top of `lib/profile.ts`:

```typescript
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
```

- [ ] **Step 3: Add computeExcelStats function**

Add before `computeProfileStats` (before line 120):

```typescript
async function computeExcelStats(userId: string): Promise<ExcelProfileStats> {
  const { data } = await supabase
    .from("skill_tree_progress")
    .select("exercise_id, completed")
    .eq("user_id", userId)
    .eq("track", "excel");

  const completedIds = new Set(
    (data || []).filter((r) => r.completed).map((r) => r.exercise_id as string)
  );

  const nodeMasteries: ExcelNodeProgress[] = excelSkillTreeNodes.map((node) => {
    const conceptualCompleted = node.conceptualQuestions.filter((q) => completedIds.has(q.id)).length;
    const exercisesCompleted = node.exercises.filter((e) => completedIds.has(e.id)).length;
    const completed = conceptualCompleted + exercisesCompleted;
    const total = node.conceptualQuestions.length + node.exercises.length;
    return { nodeId: node.id, title: node.title, completed, total };
  });

  const totalCompleted = nodeMasteries.reduce((s, m) => s + m.completed, 0);
  const totalItems = nodeMasteries.reduce((s, m) => s + m.total, 0);
  const starredCount = nodeMasteries.filter((m) => m.total > 0 && m.completed === m.total).length;

  const conceptualCompleted = excelSkillTreeNodes.reduce(
    (s, node) => s + node.conceptualQuestions.filter((q) => completedIds.has(q.id)).length,
    0
  );

  const achievements: Achievement[] = [
    { id: "excel-first-formula", name: "First Formula", desc: "Complete your first Excel exercise", icon: "📊", unlocked: totalCompleted >= 1 },
    { id: "excel-warmup-king", name: "Warmup King", desc: "Answer 10 conceptual questions", icon: "🧩", unlocked: conceptualCompleted >= 10 },
    { id: "excel-cell-master", name: "Cell Master", desc: "Star the Cell References node", icon: "📍", unlocked: nodeMasteries.find((m) => m.nodeId === "cell-references")?.completed === nodeMasteries.find((m) => m.nodeId === "cell-references")?.total && (nodeMasteries.find((m) => m.nodeId === "cell-references")?.total ?? 0) > 0 },
    { id: "excel-halfway", name: "Spreadsheet Student", desc: "Complete 50% of all Excel content", icon: "📈", unlocked: totalItems > 0 && totalCompleted >= totalItems / 2 },
    { id: "excel-3-stars", name: "Triple Star", desc: "Star 3 Excel skill nodes", icon: "⭐", unlocked: starredCount >= 3 },
    { id: "excel-all-stars", name: "Excel Grandmaster", desc: "Star all Excel skill nodes", icon: "👑", unlocked: starredCount >= excelSkillTreeNodes.length },
  ];

  return { totalCompleted, totalItems, starredCount, nodeMasteries, achievements };
}
```

- [ ] **Step 4: Call computeExcelStats inside computeProfileStats**

At the end of `computeProfileStats`, before the `return` statement, add:

```typescript
  const excelStats = await computeExcelStats(userId);
```

And add `excelStats` to the return object:

```typescript
    excelStats,
```

- [ ] **Step 5: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add lib/profile.ts
git commit -m "feat: add Excel stats computation to profile helpers"
```

---

### Task 2: Add Excel sections to profile page

**Files:**
- Modify: `app/profile/profile-client.tsx`

**Interfaces:**
- Consumes: `ExcelProfileStats` and `ExcelNodeProgress` from `lib/profile.ts` (via `ProfileStats.excelStats`)
- Consumes: `MasteryBar` from `components/learn/mastery-bar`
- Consumes: `Achievements` from `components/progress/achievements`
- Produces: Updated profile page with Excel Learning Progress and Excel Achievements sections

- [ ] **Step 1: Add MasteryBar import**

Add to the imports in `profile-client.tsx`:

```typescript
import { MasteryBar } from "@/components/learn/mastery-bar";
```

- [ ] **Step 2: Add Excel Learning Progress section**

After the `<Achievements achievements={stats.achievements} />` line (around line 187), add:

```tsx
        {/* Excel Progress */}
        <div className="rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Excel Learning Progress</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.excelStats.totalCompleted} / {stats.excelStats.totalItems} exercises &amp; concepts completed
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {stats.excelStats.nodeMasteries.map((m) => (
              <div key={m.nodeId} className="flex items-center gap-3">
                <span className="text-sm w-48 truncate">{m.title}</span>
                <div className="flex-1">
                  <MasteryBar completed={m.completed} total={m.total} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Achievements title="Excel Achievements" achievements={stats.excelStats.achievements} />
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/profile/profile-client.tsx
git commit -m "feat: add Excel progress and achievements to profile page"
```

---

### Task 3: Add Excel stats to share card

**Files:**
- Modify: `components/profile/share-card.tsx`

**Interfaces:**
- Consumes: `ProfileStats.excelStats` (totalCompleted, totalItems)
- Produces: Updated canvas card with Excel summary line

- [ ] **Step 1: Add Excel stats line to the canvas**

In `drawCard()`, after the topic mastery bars section (after line 135, before the achievements section), add an Excel summary line:

```typescript
  // Excel stats summary
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Excel", 620, ty + 10);
  ctx.font = "14px system-ui, sans-serif";
  const excelPct = stats.excelStats.totalItems > 0
    ? Math.round((stats.excelStats.totalCompleted / stats.excelStats.totalItems) * 100)
    : 0;
  ctx.fillText(
    `${stats.excelStats.totalCompleted}/${stats.excelStats.totalItems} completed (${excelPct}%)`,
    700,
    ty + 10
  );
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add components/profile/share-card.tsx
git commit -m "feat: add Excel stats to downloadable share card"
```
