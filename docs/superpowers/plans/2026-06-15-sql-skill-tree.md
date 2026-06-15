# SQL Skill Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/learn` skill tree with micro-exercises that teaches SQL concepts incrementally and bridges to/from the existing 75 practice problems.

**Architecture:** New route group (`/learn`) with a vertical skill tree map, node detail pages, and a compact micro-exercise editor. Data is static TypeScript (like `questions.ts`). Progress stored in localStorage + Supabase sync (matching the existing `storage.ts` pattern). PGlite runs the assembled queries. A struggle banner on `/practice/[id]` links back to relevant skill tree nodes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, CodeMirror 6, PGlite, Supabase, shadcn/ui

---

## File Structure

| File | Responsibility |
|------|---------------|
| `queryveda/lib/skill-tree-types.ts` | TypeScript interfaces for SkillNode, MicroExercise, Variation, BuildStep |
| `queryveda/lib/skill-tree-data.ts` | Static skill tree nodes + exercises (like `questions.ts`) |
| `queryveda/lib/skill-tree-storage.ts` | localStorage + Supabase sync for skill tree progress |
| `queryveda/hooks/use-skill-tree.ts` | Hook exposing skill tree progress state and actions |
| `queryveda/app/learn/page.tsx` | `/learn` route — skill tree map page |
| `queryveda/app/learn/learn-client.tsx` | Client component for the skill tree map |
| `queryveda/components/learn/skill-tree-map.tsx` | Vertical skill tree visualization component |
| `queryveda/components/learn/skill-node-card.tsx` | Individual node circle/card in the tree |
| `queryveda/app/learn/[nodeId]/page.tsx` | `/learn/[nodeId]` route — node detail |
| `queryveda/app/learn/[nodeId]/node-client.tsx` | Client component for node detail |
| `queryveda/components/learn/exercise-list.tsx` | List of exercises within a node |
| `queryveda/components/learn/micro-exercise-editor.tsx` | Compact CodeMirror editor for partial SQL |
| `queryveda/components/learn/exercise-verdict.tsx` | Pass/fail feedback for exercises |
| `queryveda/components/learn/mastery-bar.tsx` | Progress bar showing mastery percentage |
| `queryveda/components/practice/struggle-banner.tsx` | Banner suggesting skill tree review after failures |
| Modify: `queryveda/components/layout/navbar.tsx` | Add "Learn" nav link |
| Modify: `queryveda/components/layout/mobile-drawer.tsx` | Add "Learn" to mobile nav |
| Modify: `queryveda/app/practice/[id]/practice-client.tsx` | Integrate struggle banner |
| Modify: `queryveda/lib/storage.ts` | Add skill tree progress functions |
| Modify: `supabase-setup.sql` | Add `skill_tree_progress` table |

---

### Task 1: Types and Data Model

**Files:**
- Create: `queryveda/lib/skill-tree-types.ts`

- [ ] **Step 1: Create skill tree type definitions**

```typescript
// queryveda/lib/skill-tree-types.ts

export interface BuildStep {
  prompt: string;
  template: string;          // full query with {{BLANK}} for editable region
  expectedOutput: (string | number | null)[][];
}

export interface Variation {
  setupSQL: string;
  template: string;
  expectedOutput: (string | number | null)[][];
}

export interface MicroExercise {
  id: string;                // e.g., "group-by-ex1"
  type: "fill-blank" | "build-incremental" | "fix-query";
  prompt: string;
  setupSQL: string;
  cols: string[];            // expected column names
  template: string;          // query with {{BLANK}} placeholder
  editableDefault?: string;  // pre-filled hint text
  steps?: BuildStep[];       // only for build-incremental
  variations: Variation[];
  expectedOutput: (string | number | null)[][];
  hints: string[];
}

export interface SkillNode {
  id: string;                // e.g., "group-by"
  title: string;
  description: string;       // 2-3 sentence concept explanation
  prerequisites: string[];   // node IDs that must be at 60%+
  relatedProblemIds: number[];
  exercises: MicroExercise[];
  // Position in the tree layout
  trunk: boolean;            // true = main trunk, false = branch
  column: number;            // 0 = center, -1 = left, 1 = right
  row: number;               // vertical position (0-based)
}

export interface SkillTreeProgress {
  [exerciseId: string]: {
    completed: boolean;
    completedAt?: string;
  };
}

export interface NodeMastery {
  nodeId: string;
  completed: number;
  total: number;
  percentage: number;
  unlocked: boolean;
  starred: boolean;          // 100% mastery
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to skill-tree-types.ts

- [ ] **Step 3: Commit**

```bash
git add queryveda/lib/skill-tree-types.ts
git commit -m "feat(learn): add skill tree type definitions"
```

---

### Task 2: First Skill Tree Nodes — SELECT Basics and WHERE

**Files:**
- Create: `queryveda/lib/skill-tree-data.ts`

This task creates the data file with the first 2 nodes (10 exercises). Subsequent nodes will be added in a later task once the UI is working.

- [ ] **Step 1: Create skill tree data with SELECT Basics node**

```typescript
// queryveda/lib/skill-tree-data.ts
import type { SkillNode } from "./skill-tree-types";

export const skillTreeNodes: SkillNode[] = [
  {
    id: "select-basics",
    title: "SELECT Basics",
    description: "The foundation of every SQL query. Learn to retrieve columns from a table, use aliases, and select all columns.",
    prerequisites: [],
    relatedProblemIds: [],
    trunk: true,
    column: 0,
    row: 0,
    exercises: [
      {
        id: "select-ex1",
        type: "fill-blank",
        prompt: "Select the name and age columns from the employees table.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT, department TEXT);
INSERT INTO employees VALUES (1,'Alice',30,'Engineering'),(2,'Bob',25,'Marketing'),(3,'Carol',35,'Engineering');`,
        cols: ["name", "age"],
        template: "{{BLANK}}\nFROM employees",
        editableDefault: "SELECT ",
        variations: [
          {
            setupSQL: `DROP TABLE IF EXISTS products; CREATE TABLE products(id INT, name TEXT, price INT, category TEXT);
INSERT INTO products VALUES (1,'Laptop',999,'Electronics'),(2,'Desk',250,'Furniture'),(3,'Mouse',25,'Electronics');`,
            template: "{{BLANK}}\nFROM products",
            expectedOutput: [["Laptop", 999], ["Desk", 250], ["Mouse", 25]],
          },
        ],
        expectedOutput: [["Alice", 30], ["Bob", 25], ["Carol", 35]],
        hints: ["Use SELECT followed by column names separated by commas."],
      },
      {
        id: "select-ex2",
        type: "fill-blank",
        prompt: "Select all columns from the employees table using the wildcard.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25);`,
        cols: ["id", "name", "age"],
        template: "SELECT {{BLANK}}\nFROM employees",
        editableDefault: "",
        variations: [],
        expectedOutput: [[1, "Alice", 30], [2, "Bob", 25]],
        hints: ["The wildcard character * selects all columns."],
      },
      {
        id: "select-ex3",
        type: "build-incremental",
        prompt: "Build a query step by step to get employee names with an alias.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25),(3,'Carol',35);`,
        cols: ["employee_name"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Write a SELECT to get the name column from employees.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice"], ["Bob"], ["Carol"]],
          },
          {
            prompt: "Now alias the name column as 'employee_name'.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice"], ["Bob"], ["Carol"]],
          },
        ],
        variations: [],
        expectedOutput: [["Alice"], ["Bob"], ["Carol"]],
        hints: ["Use AS to create a column alias: SELECT column AS alias_name FROM table."],
      },
      {
        id: "select-ex4",
        type: "fix-query",
        prompt: "This query has a typo in the column name. Fix it to select the employee's name.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25);`,
        cols: ["name"],
        template: "SELECT {{BLANK}}\nFROM employees",
        editableDefault: "nme",
        variations: [],
        expectedOutput: [["Alice"], ["Bob"]],
        hints: ["Check the column name carefully — compare with the table definition."],
      },
      {
        id: "select-ex5",
        type: "fix-query",
        prompt: "This query tries to select a column that doesn't exist. Fix it to get the employee's department.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing');`,
        cols: ["department"],
        template: "SELECT {{BLANK}}\nFROM employees",
        editableDefault: "dept",
        variations: [],
        expectedOutput: [["Engineering"], ["Marketing"]],
        hints: ["The column is called 'department', not 'dept'."],
      },
    ],
  },
  {
    id: "where-filtering",
    title: "WHERE & Filtering",
    description: "Filter rows based on conditions. Learn comparison operators, AND/OR logic, IN, BETWEEN, LIKE, and NULL checks.",
    prerequisites: ["select-basics"],
    relatedProblemIds: [],
    trunk: true,
    column: 0,
    row: 1,
    exercises: [
      {
        id: "where-ex1",
        type: "fill-blank",
        prompt: "Filter employees to only show those in the Engineering department.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Engineering');`,
        cols: ["name", "department"],
        template: "SELECT name, department\nFROM employees\n{{BLANK}}",
        editableDefault: "WHERE ",
        variations: [
          {
            setupSQL: `DROP TABLE IF EXISTS products; CREATE TABLE products(id INT, name TEXT, category TEXT);
INSERT INTO products VALUES (1,'Laptop','Electronics'),(2,'Desk','Furniture'),(3,'Mouse','Electronics');`,
            template: "SELECT name, category\nFROM products\n{{BLANK}}",
            expectedOutput: [["Laptop", "Electronics"], ["Mouse", "Electronics"]],
          },
        ],
        expectedOutput: [["Alice", "Engineering"], ["Carol", "Engineering"]],
        hints: ["Use WHERE column = 'value' to filter rows."],
      },
      {
        id: "where-ex2",
        type: "fill-blank",
        prompt: "Find employees older than 30.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25),(3,'Carol',35),(4,'Dave',40);`,
        cols: ["name", "age"],
        template: "SELECT name, age\nFROM employees\n{{BLANK}}",
        editableDefault: "WHERE ",
        variations: [],
        expectedOutput: [["Carol", 35], ["Dave", 40]],
        hints: ["Use the > operator: WHERE age > 30."],
      },
      {
        id: "where-ex3",
        type: "build-incremental",
        prompt: "Build a filtered query step by step.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT, status TEXT);
INSERT INTO orders VALUES (1,'Alice',500,'completed'),(2,'Bob',150,'pending'),(3,'Alice',300,'completed'),(4,'Carol',800,'completed');`,
        cols: ["customer", "amount"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Select customer and amount from orders.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", 500], ["Bob", 150], ["Alice", 300], ["Carol", 800]],
          },
          {
            prompt: "Now add a WHERE clause to only show completed orders with amount > 200.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", 500], ["Alice", 300], ["Carol", 800]],
          },
        ],
        variations: [],
        expectedOutput: [["Alice", 500], ["Alice", 300], ["Carol", 800]],
        hints: ["Combine conditions with AND: WHERE status = 'completed' AND amount > 200."],
      },
      {
        id: "where-ex4",
        type: "fix-query",
        prompt: "This query uses the wrong operator. We want employees who are NOT in Marketing. Fix the WHERE clause.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Sales');`,
        cols: ["name", "department"],
        template: "SELECT name, department\nFROM employees\nWHERE {{BLANK}}",
        editableDefault: "department = 'Marketing'",
        variations: [],
        expectedOutput: [["Alice", "Engineering"], ["Carol", "Sales"]],
        hints: ["Use != or <> instead of = to exclude a value."],
      },
      {
        id: "where-ex5",
        type: "fix-query",
        prompt: "This query tries to find NULL values with =. Fix it to use the correct NULL check.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, manager_id INT);
INSERT INTO employees VALUES (1,'Alice',NULL),(2,'Bob',1),(3,'Carol',NULL);`,
        cols: ["name"],
        template: "SELECT name\nFROM employees\nWHERE {{BLANK}}",
        editableDefault: "manager_id = NULL",
        variations: [],
        expectedOutput: [["Alice"], ["Carol"]],
        hints: ["In SQL, you cannot use = NULL. Use IS NULL instead."],
      },
    ],
  },
];

// Helper to get a node by ID
export function getSkillNode(id: string): SkillNode | undefined {
  return skillTreeNodes.find((n) => n.id === id);
}

// Helper to get all exercises for a node
export function getNodeExercise(nodeId: string, exerciseId: string) {
  const node = getSkillNode(nodeId);
  return node?.exercises.find((e) => e.id === exerciseId);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add queryveda/lib/skill-tree-data.ts
git commit -m "feat(learn): add first 2 skill tree nodes with 10 micro-exercises"
```

---

### Task 3: Skill Tree Progress Storage

**Files:**
- Create: `queryveda/lib/skill-tree-storage.ts`
- Modify: `supabase-setup.sql`

- [ ] **Step 1: Add Supabase schema for skill tree progress**

Append to `supabase-setup.sql`:

```sql
-- Skill tree micro-exercise progress
CREATE TABLE IF NOT EXISTS skill_tree_progress (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, node_id, exercise_id)
);

ALTER TABLE skill_tree_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill tree progress"
  ON skill_tree_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill tree progress"
  ON skill_tree_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill tree progress"
  ON skill_tree_progress FOR UPDATE USING (auth.uid() = user_id);
```

- [ ] **Step 2: Create skill tree storage module**

```typescript
// queryveda/lib/skill-tree-storage.ts
import { supabase } from "@/lib/supabase";
import { skillTreeNodes } from "./skill-tree-data";
import type { SkillTreeProgress, NodeMastery } from "./skill-tree-types";

const STORAGE_KEY = "qv_skill_tree";

// --- localStorage ---

function _load(): SkillTreeProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function _save(data: SkillTreeProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isExerciseCompleted(exerciseId: string): boolean {
  return _load()[exerciseId]?.completed === true;
}

function markExerciseCompleted(exerciseId: string, userId?: string): void {
  const data = _load();
  if (data[exerciseId]?.completed) return; // already done
  data[exerciseId] = { completed: true, completedAt: new Date().toISOString() };
  _save(data);
  if (userId) {
    // Find which node this exercise belongs to
    const node = skillTreeNodes.find((n) =>
      n.exercises.some((e) => e.id === exerciseId)
    );
    if (node) {
      _saveToCloud(userId, node.id, exerciseId);
    }
  }
}

function getNodeMastery(nodeId: string): { completed: number; total: number } {
  const node = skillTreeNodes.find((n) => n.id === nodeId);
  if (!node) return { completed: 0, total: 0 };
  const data = _load();
  const completed = node.exercises.filter(
    (e) => data[e.id]?.completed
  ).length;
  return { completed, total: node.exercises.length };
}

function getNodeMasteryPercentage(nodeId: string): number {
  const { completed, total } = getNodeMastery(nodeId);
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

function isNodeUnlocked(nodeId: string): boolean {
  const node = skillTreeNodes.find((n) => n.id === nodeId);
  if (!node) return false;
  if (node.prerequisites.length === 0) return true;
  return node.prerequisites.every(
    (prereqId) => getNodeMasteryPercentage(prereqId) >= 60
  );
}

function getAllNodeMasteries(): NodeMastery[] {
  return skillTreeNodes.map((node) => {
    const { completed, total } = getNodeMastery(node.id);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      nodeId: node.id,
      completed,
      total,
      percentage,
      unlocked: isNodeUnlocked(node.id),
      starred: percentage === 100,
    };
  });
}

// --- Supabase sync ---

async function _saveToCloud(
  userId: string,
  nodeId: string,
  exerciseId: string
): Promise<void> {
  try {
    await supabase.from("skill_tree_progress").upsert(
      {
        user_id: userId,
        node_id: nodeId,
        exercise_id: exerciseId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,node_id,exercise_id" }
    );
  } catch {
    // best-effort cloud save
  }
}

async function syncSkillTreeFromCloud(userId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from("skill_tree_progress")
      .select("exercise_id, completed, completed_at")
      .eq("user_id", userId)
      .eq("completed", true);
    if (!data) return;
    const local = _load();
    for (const row of data) {
      if (!local[row.exercise_id]?.completed) {
        local[row.exercise_id] = {
          completed: true,
          completedAt: row.completed_at,
        };
      }
    }
    _save(local);
  } catch {
    // best-effort sync
  }
}

async function syncSkillTreeToCloud(userId: string): Promise<void> {
  const data = _load();
  const entries = Object.entries(data).filter(([, v]) => v.completed);
  for (const [exerciseId] of entries) {
    const node = skillTreeNodes.find((n) =>
      n.exercises.some((e) => e.id === exerciseId)
    );
    if (node) {
      await _saveToCloud(userId, node.id, exerciseId);
    }
  }
}

export const skillTreeStorage = {
  isExerciseCompleted,
  markExerciseCompleted,
  getNodeMastery,
  getNodeMasteryPercentage,
  isNodeUnlocked,
  getAllNodeMasteries,
  syncSkillTreeFromCloud,
  syncSkillTreeToCloud,
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add queryveda/lib/skill-tree-storage.ts supabase-setup.sql
git commit -m "feat(learn): add skill tree progress storage with localStorage + Supabase sync"
```

---

### Task 4: Skill Tree Hook

**Files:**
- Create: `queryveda/hooks/use-skill-tree.ts`

- [ ] **Step 1: Create the hook**

```typescript
// queryveda/hooks/use-skill-tree.ts
"use client";

import { useCallback, useState, useEffect } from "react";
import { skillTreeStorage } from "@/lib/skill-tree-storage";
import { useAuth } from "./use-auth";
import type { NodeMastery } from "@/lib/skill-tree-types";

export function useSkillTree() {
  const { user } = useAuth();
  const [masteries, setMasteries] = useState<NodeMastery[]>([]);

  // Refresh masteries from localStorage
  const refresh = useCallback(() => {
    setMasteries(skillTreeStorage.getAllNodeMasteries());
  }, []);

  // Load on mount + sync from cloud if logged in
  useEffect(() => {
    if (user) {
      skillTreeStorage.syncSkillTreeFromCloud(user.id).then(refresh);
    } else {
      refresh();
    }
  }, [user, refresh]);

  const markCompleted = useCallback(
    (exerciseId: string) => {
      skillTreeStorage.markExerciseCompleted(exerciseId, user?.id);
      refresh();
    },
    [user, refresh]
  );

  const isExerciseCompleted = useCallback(
    (exerciseId: string) => skillTreeStorage.isExerciseCompleted(exerciseId),
    []
  );

  const getNodeMastery = useCallback(
    (nodeId: string) =>
      masteries.find((m) => m.nodeId === nodeId) ?? {
        nodeId,
        completed: 0,
        total: 0,
        percentage: 0,
        unlocked: false,
        starred: false,
      },
    [masteries]
  );

  return { masteries, markCompleted, isExerciseCompleted, getNodeMastery, refresh };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add queryveda/hooks/use-skill-tree.ts
git commit -m "feat(learn): add useSkillTree hook for progress tracking"
```

---

### Task 5: Mastery Bar Component

**Files:**
- Create: `queryveda/components/learn/mastery-bar.tsx`

- [ ] **Step 1: Create the mastery bar**

```tsx
// queryveda/components/learn/mastery-bar.tsx
"use client";

interface MasteryBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
}

export function MasteryBar({ completed, total, showLabel = true }: MasteryBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {completed}/{total}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/components/learn/mastery-bar.tsx
git commit -m "feat(learn): add MasteryBar progress component"
```

---

### Task 6: Skill Node Card Component

**Files:**
- Create: `queryveda/components/learn/skill-node-card.tsx`

- [ ] **Step 1: Create the node card**

```tsx
// queryveda/components/learn/skill-node-card.tsx
"use client";

import Link from "next/link";
import { Lock, Star, CheckCircle2 } from "lucide-react";
import { MasteryBar } from "./mastery-bar";
import type { NodeMastery } from "@/lib/skill-tree-types";
import type { SkillNode } from "@/lib/skill-tree-types";

interface SkillNodeCardProps {
  node: SkillNode;
  mastery: NodeMastery;
}

export function SkillNodeCard({ node, mastery }: SkillNodeCardProps) {
  const { unlocked, starred, completed, total, percentage } = mastery;

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center gap-2 opacity-50">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
          <Lock className="w-5 h-5 text-muted-foreground/50" />
        </div>
        <span className="text-sm text-muted-foreground text-center max-w-[140px]">
          {node.title}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/learn/${node.id}`}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-110 ${
          starred
            ? "border-yellow-500 bg-yellow-500/10"
            : percentage > 0
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/40 bg-background"
        }`}
      >
        {starred ? (
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        ) : percentage === 100 ? (
          <CheckCircle2 className="w-6 h-6 text-primary" />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {percentage > 0 ? `${percentage}%` : "Start"}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-center max-w-[140px] group-hover:text-primary transition-colors">
        {node.title}
      </span>
      {percentage > 0 && percentage < 100 && (
        <div className="w-24">
          <MasteryBar completed={completed} total={total} showLabel={false} />
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/components/learn/skill-node-card.tsx
git commit -m "feat(learn): add SkillNodeCard component with lock/progress/star states"
```

---

### Task 7: Skill Tree Map Component and /learn Page

**Files:**
- Create: `queryveda/components/learn/skill-tree-map.tsx`
- Create: `queryveda/app/learn/learn-client.tsx`
- Create: `queryveda/app/learn/page.tsx`

- [ ] **Step 1: Create the tree map component**

```tsx
// queryveda/components/learn/skill-tree-map.tsx
"use client";

import { skillTreeNodes } from "@/lib/skill-tree-data";
import { SkillNodeCard } from "./skill-node-card";
import type { NodeMastery } from "@/lib/skill-tree-types";

interface SkillTreeMapProps {
  masteries: NodeMastery[];
  getMastery: (nodeId: string) => NodeMastery;
}

export function SkillTreeMap({ masteries, getMastery }: SkillTreeMapProps) {
  // Group nodes by row
  const rows = new Map<number, typeof skillTreeNodes>();
  for (const node of skillTreeNodes) {
    const row = rows.get(node.row) ?? [];
    row.push(node);
    rows.set(node.row, row);
  }

  const sortedRows = Array.from(rows.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {sortedRows.map(([rowIdx, nodes]) => (
        <div key={rowIdx} className="flex flex-col items-center gap-2">
          {/* Connector line from previous row */}
          {rowIdx > 0 && (
            <div className="w-px h-8 bg-muted-foreground/20" />
          )}
          <div className="flex items-start gap-12 flex-wrap justify-center">
            {nodes
              .sort((a, b) => a.column - b.column)
              .map((node) => (
                <SkillNodeCard
                  key={node.id}
                  node={node}
                  mastery={getMastery(node.id)}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create the learn client component**

```tsx
// queryveda/app/learn/learn-client.tsx
"use client";

import { useSkillTree } from "@/hooks/use-skill-tree";
import { SkillTreeMap } from "@/components/learn/skill-tree-map";

export function LearnClient() {
  const { masteries, getNodeMastery } = useSkillTree();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Learn SQL
        </h1>
        <p className="text-muted-foreground">
          Master SQL concepts step by step. Complete exercises to unlock new topics.
        </p>
      </div>
      <SkillTreeMap masteries={masteries} getMastery={getNodeMastery} />
    </div>
  );
}
```

- [ ] **Step 3: Create the page route**

```tsx
// queryveda/app/learn/page.tsx
import { LearnClient } from "./learn-client";

export default function LearnPage() {
  return <LearnClient />;
}
```

- [ ] **Step 4: Verify it builds**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -30`
Expected: Build succeeds, `/learn` appears in the output

- [ ] **Step 5: Manual verification**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next dev`
Visit `http://localhost:3000/learn` — should see the skill tree with SELECT Basics unlocked and WHERE & Filtering locked.

- [ ] **Step 6: Commit**

```bash
git add queryveda/components/learn/skill-tree-map.tsx queryveda/app/learn/learn-client.tsx queryveda/app/learn/page.tsx
git commit -m "feat(learn): add /learn page with skill tree map visualization"
```

---

### Task 8: Exercise Verdict Component

**Files:**
- Create: `queryveda/components/learn/exercise-verdict.tsx`

- [ ] **Step 1: Create the verdict component**

```tsx
// queryveda/components/learn/exercise-verdict.tsx
"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface ExerciseVerdictProps {
  type: "idle" | "pass" | "fail";
  message: string;
}

export function ExerciseVerdict({ type, message }: ExerciseVerdictProps) {
  if (type === "idle") return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
        type === "pass"
          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
      }`}
    >
      {type === "pass" ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/components/learn/exercise-verdict.tsx
git commit -m "feat(learn): add ExerciseVerdict pass/fail feedback component"
```

---

### Task 9: Micro Exercise Editor Component

**Files:**
- Create: `queryveda/components/learn/micro-exercise-editor.tsx`

This is the core interactive component. It shows the SQL template with a CodeMirror editor for just the editable blank, assembles the full query, runs it against PGlite, and compares results.

- [ ] **Step 1: Create the micro exercise editor**

```tsx
// queryveda/components/learn/micro-exercise-editor.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { SQLEditor } from "@/components/practice/sql-editor";
import { ExerciseVerdict } from "./exercise-verdict";
import { executeQuery, compareResults, type QueryResult } from "@/lib/pglite";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Lightbulb } from "lucide-react";
import type { MicroExercise } from "@/lib/skill-tree-types";

interface MicroExerciseEditorProps {
  exercise: MicroExercise;
  db: {
    exec: (sql: string) => Promise<unknown>;
    query: (sql: string) => Promise<{ fields: { name: string }[]; rows: Record<string, unknown>[] }>;
  };
  onPass: () => void;
}

export function MicroExerciseEditor({ exercise, db, onPass }: MicroExerciseEditorProps) {
  const [sqlValue, setSqlValue] = useState(exercise.editableDefault ?? "");
  const [verdict, setVerdict] = useState<{ type: "idle" | "pass" | "fail"; message: string }>({ type: "idle", message: "" });
  const [running, setRunning] = useState(false);
  const [hintIdx, setHintIdx] = useState(-1);
  const sqlRef = useRef(sqlValue);
  sqlRef.current = sqlValue;

  // For build-incremental, track which step we're on
  const [stepIdx, setStepIdx] = useState(0);
  const isIncremental = exercise.type === "build-incremental" && exercise.steps;
  const currentStep = isIncremental ? exercise.steps![stepIdx] : null;
  const currentTemplate = currentStep?.template ?? exercise.template;
  const currentExpected = currentStep?.expectedOutput ?? exercise.expectedOutput;

  const assembleQuery = useCallback(
    (userInput: string): string => {
      return currentTemplate.replace("{{BLANK}}", userInput);
    },
    [currentTemplate]
  );

  const handleRun = useCallback(async () => {
    const trimmed = sqlRef.current.trim();
    if (!trimmed) {
      setVerdict({ type: "fail", message: "Write some SQL first." });
      return;
    }

    setRunning(true);
    setVerdict({ type: "idle", message: "" });

    try {
      // Set up the exercise schema
      await db.exec(exercise.setupSQL);

      // Assemble and run the full query
      const fullSQL = assembleQuery(trimmed);
      const result = await executeQuery(db, fullSQL);

      // Compare results
      const expected: QueryResult = { cols: exercise.cols, rows: currentExpected };
      const cmp = compareResults(expected, result);

      if (cmp.pass) {
        if (isIncremental && stepIdx < exercise.steps!.length - 1) {
          // Move to next step
          setVerdict({ type: "pass", message: `Step ${stepIdx + 1} passed! Moving to next step...` });
          setTimeout(() => {
            setStepIdx(stepIdx + 1);
            setSqlValue("");
            setVerdict({ type: "idle", message: "" });
          }, 1000);
        } else {
          setVerdict({ type: "pass", message: "Correct!" });
          onPass();
        }
      } else {
        setVerdict({ type: "fail", message: cmp.msg });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setVerdict({ type: "fail", message: `SQL error: ${msg}` });
    } finally {
      setRunning(false);
    }
  }, [db, exercise, assembleQuery, currentExpected, isIncremental, stepIdx, onPass]);

  const handleReset = useCallback(() => {
    setSqlValue(exercise.editableDefault ?? "");
    setVerdict({ type: "idle", message: "" });
    setStepIdx(0);
    setHintIdx(-1);
  }, [exercise.editableDefault]);

  const handleChange = useCallback((value: string) => {
    setSqlValue(value);
  }, []);

  const handleShowHint = useCallback(() => {
    setHintIdx((prev) => Math.min(prev + 1, exercise.hints.length - 1));
  }, [exercise.hints.length]);

  // Build the display: show template with editable blank highlighted
  const templateParts = currentTemplate.split("{{BLANK}}");
  const prompt = currentStep?.prompt ?? exercise.prompt;

  return (
    <div className="flex flex-col gap-4">
      {/* Prompt */}
      <p className="text-sm font-medium">{prompt}</p>

      {/* Step indicator for build-incremental */}
      {isIncremental && (
        <div className="flex items-center gap-2">
          {exercise.steps!.map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i < stepIdx
                  ? "bg-primary text-primary-foreground"
                  : i === stepIdx
                  ? "bg-primary/20 text-primary border border-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Template context + editor */}
      <div className="rounded-xl border bg-muted/30 p-4 font-mono text-sm">
        {templateParts[0] && (
          <pre className="text-muted-foreground whitespace-pre-wrap mb-1">
            {templateParts[0].trimEnd()}
          </pre>
        )}
        <div className="border-l-2 border-primary pl-2">
          <SQLEditor
            initialValue={sqlValue}
            onChange={handleChange}
            onRun={handleRun}
          />
        </div>
        {templateParts[1] && (
          <pre className="text-muted-foreground whitespace-pre-wrap mt-1">
            {templateParts[1].trimStart()}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={handleRun} disabled={running} size="sm">
          <Play className="w-3.5 h-3.5 mr-1.5" />
          {running ? "Running..." : "Run"}
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset
        </Button>
        {exercise.hints.length > 0 && hintIdx < exercise.hints.length - 1 && (
          <Button onClick={handleShowHint} variant="ghost" size="sm">
            <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
            Hint
          </Button>
        )}
      </div>

      {/* Hints */}
      {hintIdx >= 0 && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          {exercise.hints.slice(0, hintIdx + 1).map((hint, i) => (
            <p key={i} className={i > 0 ? "mt-1" : ""}>{hint}</p>
          ))}
        </div>
      )}

      {/* Verdict */}
      <ExerciseVerdict type={verdict.type} message={verdict.message} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add queryveda/components/learn/micro-exercise-editor.tsx
git commit -m "feat(learn): add MicroExerciseEditor with template display and PGlite execution"
```

---

### Task 10: Exercise List Component

**Files:**
- Create: `queryveda/components/learn/exercise-list.tsx`

- [ ] **Step 1: Create the exercise list**

```tsx
// queryveda/components/learn/exercise-list.tsx
"use client";

import { CheckCircle2, Circle, PenLine, Layers, Wrench } from "lucide-react";
import type { MicroExercise } from "@/lib/skill-tree-types";

interface ExerciseListProps {
  exercises: MicroExercise[];
  isCompleted: (exerciseId: string) => boolean;
  activeExerciseId: string | null;
  onSelect: (exerciseId: string) => void;
}

const TYPE_ICONS = {
  "fill-blank": PenLine,
  "build-incremental": Layers,
  "fix-query": Wrench,
};

const TYPE_LABELS = {
  "fill-blank": "Fill in the blank",
  "build-incremental": "Build step by step",
  "fix-query": "Fix the query",
};

export function ExerciseList({
  exercises,
  isCompleted,
  activeExerciseId,
  onSelect,
}: ExerciseListProps) {
  return (
    <div className="flex flex-col gap-1">
      {exercises.map((ex, i) => {
        const done = isCompleted(ex.id);
        const active = ex.id === activeExerciseId;
        const Icon = TYPE_ICONS[ex.type];

        return (
          <button
            key={ex.id}
            onClick={() => onSelect(ex.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-foreground"
            }`}
          >
            {done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="flex-1 truncate">
              Exercise {i + 1}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="w-3 h-3" />
              {TYPE_LABELS[ex.type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/components/learn/exercise-list.tsx
git commit -m "feat(learn): add ExerciseList component with type icons and completion status"
```

---

### Task 11: Node Detail Page (/learn/[nodeId])

**Files:**
- Create: `queryveda/app/learn/[nodeId]/page.tsx`
- Create: `queryveda/app/learn/[nodeId]/node-client.tsx`

- [ ] **Step 1: Create the node client component**

```tsx
// queryveda/app/learn/[nodeId]/node-client.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSkillNode } from "@/lib/skill-tree-data";
import { questions } from "@/lib/questions";
import { useSkillTree } from "@/hooks/use-skill-tree";
import { usePGlite } from "@/hooks/use-pglite";
import { MasteryBar } from "@/components/learn/mastery-bar";
import { ExerciseList } from "@/components/learn/exercise-list";
import { MicroExerciseEditor } from "@/components/learn/micro-exercise-editor";
import { Button } from "@/components/ui/button";

export function NodeClient({ nodeId }: { nodeId: string }) {
  const node = getSkillNode(nodeId);
  const { db, ready } = usePGlite();
  const { markCompleted, isExerciseCompleted, getNodeMastery } = useSkillTree();
  const mastery = getNodeMastery(nodeId);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(
    node?.exercises[0]?.id ?? null
  );

  const activeExercise = node?.exercises.find((e) => e.id === activeExerciseId);

  const handlePass = useCallback(() => {
    if (!activeExerciseId) return;
    markCompleted(activeExerciseId);
    // Auto-advance to next incomplete exercise after a delay
    if (node) {
      setTimeout(() => {
        const nextIncomplete = node.exercises.find(
          (e) => e.id !== activeExerciseId && !isExerciseCompleted(e.id)
        );
        if (nextIncomplete) {
          setActiveExerciseId(nextIncomplete.id);
        }
      }, 1500);
    }
  }, [activeExerciseId, markCompleted, node, isExerciseCompleted]);

  if (!node) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Node not found.</p>
        <Link href="/learn" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to skill tree
        </Link>
      </div>
    );
  }

  if (!mastery.unlocked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-medium mb-2">🔒 Locked</p>
        <p className="text-muted-foreground mb-4">
          Complete prerequisite topics to unlock {node.title}.
        </p>
        <Link href="/learn">
          <Button variant="outline">Back to skill tree</Button>
        </Link>
      </div>
    );
  }

  const relatedProblems = questions.filter((q) =>
    node.relatedProblemIds.includes(q.id)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Skill Tree
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mb-1">{node.title}</h1>
        <p className="text-muted-foreground text-sm mb-3">{node.description}</p>
        <div className="max-w-xs">
          <MasteryBar completed={mastery.completed} total={mastery.total} />
        </div>
      </div>

      {/* Two-column layout: exercise list + active exercise */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Left: exercise list */}
        <div className="rounded-xl border p-3">
          <ExerciseList
            exercises={node.exercises}
            isCompleted={isExerciseCompleted}
            activeExerciseId={activeExerciseId}
            onSelect={setActiveExerciseId}
          />
        </div>

        {/* Right: active exercise editor */}
        <div className="rounded-xl border p-4">
          {!ready || !db ? (
            <p className="text-sm text-muted-foreground">Loading SQL engine...</p>
          ) : activeExercise ? (
            <MicroExerciseEditor
              key={activeExerciseId}
              exercise={activeExercise}
              db={db}
              onPass={handlePass}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Select an exercise to begin.</p>
          )}
        </div>
      </div>

      {/* Related problems */}
      {relatedProblems.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3">Ready for a challenge?</h2>
          <div className="flex flex-wrap gap-2">
            {relatedProblems.map((q) => (
              <Link key={q.id} href={`/practice/${q.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  {q.title}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the page route**

```tsx
// queryveda/app/learn/[nodeId]/page.tsx
import { NodeClient } from "./node-client";

export default function NodePage({ params }: { params: { nodeId: string } }) {
  return <NodeClient nodeId={params.nodeId} />;
}
```

- [ ] **Step 3: Verify it builds**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -30`
Expected: Build succeeds

- [ ] **Step 4: Manual verification**

Run dev server, visit `http://localhost:3000/learn/select-basics`. Should see:
- Node title, description, mastery bar at 0/5
- Exercise list on the left with 5 exercises
- Active exercise editor on the right with template + editable blank
- Run button executes and compares results

- [ ] **Step 5: Commit**

```bash
git add queryveda/app/learn/[nodeId]/page.tsx queryveda/app/learn/[nodeId]/node-client.tsx
git commit -m "feat(learn): add /learn/[nodeId] node detail page with exercise editor"
```

---

### Task 12: Add "Learn" to Navigation

**Files:**
- Modify: `queryveda/components/layout/navbar.tsx`
- Modify: `queryveda/components/layout/mobile-drawer.tsx`

- [ ] **Step 1: Add Learn link to navbar**

In `queryveda/components/layout/navbar.tsx`, update the `navLinks` array:

```typescript
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/daily", label: "Daily" },
  { href: "/problems", label: "Problems" },
  { href: "/progress", label: "Progress" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
];
```

- [ ] **Step 2: Add Learn link to mobile drawer**

Find the nav links array in `queryveda/components/layout/mobile-drawer.tsx` and add the same `{ href: "/learn", label: "Learn" }` entry in the same position (after Home, before Daily).

- [ ] **Step 3: Manual verification**

Run dev server, check that "Learn" appears in both desktop and mobile nav, and links to `/learn`.

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/layout/navbar.tsx queryveda/components/layout/mobile-drawer.tsx
git commit -m "feat(learn): add Learn link to desktop and mobile navigation"
```

---

### Task 13: Struggle Banner on Practice Page

**Files:**
- Create: `queryveda/components/practice/struggle-banner.tsx`
- Modify: `queryveda/app/practice/[id]/practice-client.tsx`

- [ ] **Step 1: Create the struggle banner component**

```tsx
// queryveda/components/practice/struggle-banner.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { X, BookOpen } from "lucide-react";
import { skillTreeNodes } from "@/lib/skill-tree-data";
import type { Question } from "@/lib/types";

interface StruggleBannerProps {
  question: Question;
  failCount: number;
}

export function StruggleBanner({ question, failCount }: StruggleBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || failCount < 3) return null;

  // Find the most relevant skill tree node based on topic
  const topicToNodeMap: Record<string, string> = {
    "Window Functions": "window-functions",
    "Aggregations & JOINs": "joins",
    "Cumulative & Sliding Windows": "cumulative-sliding",
    "Consecutive Sequences": "consecutive-sequences",
    "Advanced Analytics": "advanced-analytics",
  };

  const nodeId = topicToNodeMap[question.topic];
  const node = nodeId
    ? skillTreeNodes.find((n) => n.id === nodeId)
    : null;

  // Fallback: suggest foundational nodes if topic-specific node doesn't exist yet
  const fallbackNode = skillTreeNodes.find(
    (n) => n.id === "select-basics" || n.id === "where-filtering"
  );
  const targetNode = node ?? fallbackNode;
  if (!targetNode) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm">
      <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
      <span className="flex-1 text-blue-700 dark:text-blue-400">
        Struggling? Review the{" "}
        <Link
          href={`/learn/${targetNode.id}`}
          className="font-medium underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-300"
        >
          {targetNode.title}
        </Link>
        {" "}exercises to strengthen your foundations.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="text-blue-500/60 hover:text-blue-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Integrate into practice-client.tsx**

In `queryveda/app/practice/[id]/practice-client.tsx`:

1. Add import at the top:
```typescript
import { StruggleBanner } from "@/components/practice/struggle-banner";
```

2. Add a `failCount` state:
```typescript
const [failCount, setFailCount] = useState(0);
```

3. In the `handleRun` callback, after the verdict is set, increment fail count on failure:
```typescript
if (result.passed) {
  // existing pass logic
} else {
  setFailCount((prev) => prev + 1);
  // existing fail logic
}
```

4. Render the banner above or below the verdict area:
```tsx
<StruggleBanner question={question} failCount={failCount} />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/practice/struggle-banner.tsx queryveda/app/practice/[id]/practice-client.tsx
git commit -m "feat(learn): add struggle banner suggesting skill tree after 3+ failures"
```

---

### Task 14: Add Remaining Skill Tree Nodes

**Files:**
- Modify: `queryveda/lib/skill-tree-data.ts`

Add the remaining 11 nodes to complete the skill tree. Each node has 5 micro-exercises with a mix of fill-blank, build-incremental, and fix-query types.

- [ ] **Step 1: Add ORDER BY & LIMIT node (row 2)**

Append to `skillTreeNodes` array in `queryveda/lib/skill-tree-data.ts`:

```typescript
{
  id: "order-by-limit",
  title: "ORDER BY & LIMIT",
  description: "Sort query results and restrict the number of rows returned. Essential for top-N queries and pagination.",
  prerequisites: ["where-filtering"],
  relatedProblemIds: [],
  trunk: true,
  column: 0,
  row: 2,
  exercises: [
    {
      id: "orderby-ex1",
      type: "fill-blank",
      prompt: "Sort employees by age from oldest to youngest.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25),(3,'Carol',35);`,
      cols: ["name", "age"],
      template: "SELECT name, age\nFROM employees\n{{BLANK}}",
      editableDefault: "ORDER BY ",
      variations: [],
      expectedOutput: [["Carol", 35], ["Alice", 30], ["Bob", 25]],
      hints: ["Use ORDER BY column DESC for descending order."],
    },
    {
      id: "orderby-ex2",
      type: "fill-blank",
      prompt: "Get the top 2 highest-paid employees.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',75000),(3,'Carol',120000),(4,'Dave',85000);`,
      cols: ["name", "salary"],
      template: "SELECT name, salary\nFROM employees\n{{BLANK}}",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Carol", 120000], ["Alice", 90000]],
      hints: ["Combine ORDER BY salary DESC with LIMIT 2."],
    },
    {
      id: "orderby-ex3",
      type: "build-incremental",
      prompt: "Build a query to find the 3 most recent orders.",
      setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, order_date DATE, amount INT);
INSERT INTO orders VALUES (1,'Alice','2025-01-01',500),(2,'Bob','2025-01-15',300),(3,'Carol','2025-01-10',700),(4,'Dave','2025-01-20',200),(5,'Eve','2025-01-05',400);`,
      cols: ["customer", "order_date", "amount"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Select customer, order_date, and amount from orders.",
          template: "{{BLANK}}",
          expectedOutput: [["Alice","2025-01-01",500],["Bob","2025-01-15",300],["Carol","2025-01-10",700],["Dave","2025-01-20",200],["Eve","2025-01-05",400]],
        },
        {
          prompt: "Add ORDER BY to sort by order_date descending, then LIMIT to 3.",
          template: "{{BLANK}}",
          expectedOutput: [["Dave","2025-01-20",200],["Bob","2025-01-15",300],["Carol","2025-01-10",700]],
        },
      ],
      variations: [],
      expectedOutput: [["Dave","2025-01-20",200],["Bob","2025-01-15",300],["Carol","2025-01-10",700]],
      hints: ["ORDER BY order_date DESC LIMIT 3"],
    },
    {
      id: "orderby-ex4",
      type: "fix-query",
      prompt: "This query tries to get the bottom 3 salaries but sorts in the wrong direction. Fix the ORDER BY.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',75000),(3,'Carol',120000),(4,'Dave',60000);`,
      cols: ["name", "salary"],
      template: "SELECT name, salary\nFROM employees\nORDER BY {{BLANK}}\nLIMIT 3",
      editableDefault: "salary DESC",
      variations: [],
      expectedOutput: [["Dave",60000],["Bob",75000],["Alice",90000]],
      hints: ["For the lowest salaries, sort ascending (ASC) not descending (DESC)."],
    },
    {
      id: "orderby-ex5",
      type: "fix-query",
      prompt: "This query should sort by department alphabetically, then by salary descending within each department. Fix the ORDER BY clause.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',90000),(2,'Bob','Engineering',75000),(3,'Carol','Marketing',80000),(4,'Dave','Marketing',95000);`,
      cols: ["name", "department", "salary"],
      template: "SELECT name, department, salary\nFROM employees\nORDER BY {{BLANK}}",
      editableDefault: "salary DESC",
      variations: [],
      expectedOutput: [["Alice","Engineering",90000],["Bob","Engineering",75000],["Dave","Marketing",95000],["Carol","Marketing",80000]],
      hints: ["Use multiple columns: ORDER BY department ASC, salary DESC."],
    },
  ],
},
```

- [ ] **Step 2: Add GROUP BY & HAVING node (row 3)**

```typescript
{
  id: "group-by-having",
  title: "GROUP BY & HAVING",
  description: "Aggregate rows into groups and filter those groups. The foundation for summary reports and analytics.",
  prerequisites: ["order-by-limit"],
  relatedProblemIds: [],
  trunk: true,
  column: 0,
  row: 3,
  exercises: [
    {
      id: "groupby-ex1",
      type: "fill-blank",
      prompt: "Count the number of employees in each department.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Engineering'),(4,'Dave','Marketing'),(5,'Eve','Engineering');`,
      cols: ["department", "count"],
      template: "SELECT department, COUNT(*) AS count\nFROM employees\n{{BLANK}}",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Engineering", 3], ["Marketing", 2]],
      hints: ["Use GROUP BY department."],
    },
    {
      id: "groupby-ex2",
      type: "build-incremental",
      prompt: "Build a query to find departments with more than 2 employees.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Engineering'),(4,'Dave','Sales'),(5,'Eve','Engineering');`,
      cols: ["department", "count"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Select department and COUNT(*) as count, grouped by department.",
          template: "{{BLANK}}",
          expectedOutput: [["Engineering", 3], ["Marketing", 1], ["Sales", 1]],
        },
        {
          prompt: "Now add HAVING to only show departments with count > 2.",
          template: "{{BLANK}}",
          expectedOutput: [["Engineering", 3]],
        },
      ],
      variations: [],
      expectedOutput: [["Engineering", 3]],
      hints: ["HAVING COUNT(*) > 2 filters groups after aggregation."],
    },
    {
      id: "groupby-ex3",
      type: "build-incremental",
      prompt: "Build a query to find the average salary per department, sorted highest first.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',90000),(2,'Bob','Marketing',70000),(3,'Carol','Engineering',110000),(4,'Dave','Marketing',80000);`,
      cols: ["department", "avg_salary"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Select department and AVG(salary) as avg_salary, grouped by department.",
          template: "{{BLANK}}",
          expectedOutput: [["Engineering", 100000], ["Marketing", 75000]],
        },
        {
          prompt: "Add ORDER BY to sort by avg_salary descending.",
          template: "{{BLANK}}",
          expectedOutput: [["Engineering", 100000], ["Marketing", 75000]],
        },
      ],
      variations: [],
      expectedOutput: [["Engineering", 100000], ["Marketing", 75000]],
      hints: ["Use AVG(salary) and GROUP BY department, then ORDER BY avg_salary DESC."],
    },
    {
      id: "groupby-ex4",
      type: "fix-query",
      prompt: "This query incorrectly uses WHERE instead of HAVING to filter groups. Fix it.",
      setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT);
INSERT INTO orders VALUES (1,'Alice',500),(2,'Alice',300),(3,'Bob',700),(4,'Bob',200),(5,'Bob',100);`,
      cols: ["customer", "total"],
      template: "SELECT customer, SUM(amount) AS total\nFROM orders\nGROUP BY customer\n{{BLANK}}",
      editableDefault: "WHERE total > 500",
      variations: [],
      expectedOutput: [["Bob", 1000]],
      hints: ["Use HAVING instead of WHERE to filter on aggregate results."],
    },
    {
      id: "groupby-ex5",
      type: "fix-query",
      prompt: "This query selects a non-aggregated column without grouping by it. Fix the GROUP BY.",
      setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, product TEXT, amount INT);
INSERT INTO orders VALUES (1,'Alice','Laptop',1000),(2,'Alice','Mouse',25),(3,'Bob','Laptop',1000);`,
      cols: ["customer", "product", "total"],
      template: "SELECT customer, product, SUM(amount) AS total\nFROM orders\n{{BLANK}}",
      editableDefault: "GROUP BY customer",
      variations: [],
      expectedOutput: [["Alice","Laptop",1000],["Alice","Mouse",25],["Bob","Laptop",1000]],
      hints: ["Every non-aggregated column in SELECT must appear in GROUP BY."],
    },
  ],
},
```

- [ ] **Step 3: Add Aggregate Functions node (row 4)**

```typescript
{
  id: "aggregate-functions",
  title: "Aggregate Functions",
  description: "Master COUNT, SUM, AVG, MIN, MAX and how they interact with GROUP BY and NULL values.",
  prerequisites: ["group-by-having"],
  relatedProblemIds: [],
  trunk: true,
  column: 0,
  row: 4,
  exercises: [
    {
      id: "agg-ex1",
      type: "fill-blank",
      prompt: "Find the total revenue and average order amount.",
      setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, amount INT);
INSERT INTO orders VALUES (1,500),(2,300),(3,700),(4,200);`,
      cols: ["total_revenue", "avg_amount"],
      template: "SELECT {{BLANK}}\nFROM orders",
      editableDefault: "",
      variations: [],
      expectedOutput: [[1700, 425]],
      hints: ["Use SUM(amount) AS total_revenue, AVG(amount) AS avg_amount."],
    },
    {
      id: "agg-ex2",
      type: "fill-blank",
      prompt: "Count how many employees have a non-NULL manager_id.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, manager_id INT);
INSERT INTO employees VALUES (1,'Alice',NULL),(2,'Bob',1),(3,'Carol',1),(4,'Dave',NULL);`,
      cols: ["managed_count"],
      template: "SELECT {{BLANK}} AS managed_count\nFROM employees",
      editableDefault: "",
      variations: [],
      expectedOutput: [[2]],
      hints: ["COUNT(column) ignores NULLs, while COUNT(*) counts all rows."],
    },
    {
      id: "agg-ex3",
      type: "build-incremental",
      prompt: "Build a query to find the highest and lowest salary per department.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',90000),(2,'Bob','Engineering',75000),(3,'Carol','Marketing',80000),(4,'Dave','Marketing',95000);`,
      cols: ["department", "max_salary", "min_salary"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Select department with MAX(salary) and MIN(salary), grouped by department.",
          template: "{{BLANK}}",
          expectedOutput: [["Engineering",90000,75000],["Marketing",95000,80000]],
        },
      ],
      variations: [],
      expectedOutput: [["Engineering",90000,75000],["Marketing",95000,80000]],
      hints: ["SELECT department, MAX(salary) AS max_salary, MIN(salary) AS min_salary FROM employees GROUP BY department"],
    },
    {
      id: "agg-ex4",
      type: "fix-query",
      prompt: "This query tries to count distinct departments but uses the wrong syntax. Fix it.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Engineering');`,
      cols: ["dept_count"],
      template: "SELECT {{BLANK}} AS dept_count\nFROM employees",
      editableDefault: "COUNT(department)",
      variations: [],
      expectedOutput: [[2]],
      hints: ["Use COUNT(DISTINCT department) to count unique values."],
    },
    {
      id: "agg-ex5",
      type: "fix-query",
      prompt: "This query should calculate average salary but gets an integer result. Fix it to get a decimal.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',75000),(2,'Bob',80000),(3,'Carol',90000);`,
      cols: ["avg_salary"],
      template: "SELECT {{BLANK}} AS avg_salary\nFROM employees",
      editableDefault: "SUM(salary) / COUNT(*)",
      variations: [],
      expectedOutput: [[81666.6667]],
      hints: ["Use AVG(salary) which returns a decimal, or cast: SUM(salary)::DECIMAL / COUNT(*)."],
    },
  ],
},
```

- [ ] **Step 4: Add branch nodes — JOINs, Subqueries, Set Operations (row 5)**

```typescript
{
  id: "joins",
  title: "JOINs",
  description: "Combine rows from multiple tables. Learn INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.",
  prerequisites: ["aggregate-functions"],
  relatedProblemIds: [2, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  trunk: false,
  column: -1,
  row: 5,
  exercises: [
    {
      id: "join-ex1",
      type: "fill-blank",
      prompt: "Join employees with departments to show each employee's department name.",
      setupSQL: `DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS departments;
CREATE TABLE departments(id INT, name TEXT);
CREATE TABLE employees(id INT, name TEXT, dept_id INT);
INSERT INTO departments VALUES (1,'Engineering'),(2,'Marketing');
INSERT INTO employees VALUES (1,'Alice',1),(2,'Bob',2),(3,'Carol',1);`,
      cols: ["employee", "department"],
      template: "SELECT e.name AS employee, d.name AS department\nFROM employees e\n{{BLANK}}",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Alice","Engineering"],["Bob","Marketing"],["Carol","Engineering"]],
      hints: ["Use JOIN departments d ON e.dept_id = d.id."],
    },
    {
      id: "join-ex2",
      type: "fill-blank",
      prompt: "Show ALL employees, including those without a department (dept_id is NULL).",
      setupSQL: `DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS departments;
CREATE TABLE departments(id INT, name TEXT);
CREATE TABLE employees(id INT, name TEXT, dept_id INT);
INSERT INTO departments VALUES (1,'Engineering'),(2,'Marketing');
INSERT INTO employees VALUES (1,'Alice',1),(2,'Bob',NULL),(3,'Carol',2);`,
      cols: ["employee", "department"],
      template: "SELECT e.name AS employee, d.name AS department\nFROM employees e\n{{BLANK}}",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Alice","Engineering"],["Bob",null],["Carol","Marketing"]],
      hints: ["Use LEFT JOIN to keep all rows from the left table (employees)."],
    },
    {
      id: "join-ex3",
      type: "build-incremental",
      prompt: "Build a query to find customers who have never placed an order.",
      setupSQL: `DROP TABLE IF EXISTS customers; DROP TABLE IF EXISTS orders;
CREATE TABLE customers(id INT, name TEXT);
CREATE TABLE orders(id INT, customer_id INT, amount INT);
INSERT INTO customers VALUES (1,'Alice'),(2,'Bob'),(3,'Carol');
INSERT INTO orders VALUES (1,1,500),(2,1,300);`,
      cols: ["name"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "LEFT JOIN customers with orders on customer_id, selecting customer name and order id.",
          template: "{{BLANK}}",
          expectedOutput: [["Alice",1],["Alice",2],["Bob",null],["Carol",null]],
        },
        {
          prompt: "Now filter to only customers where the order id IS NULL (no orders found).",
          template: "{{BLANK}}",
          expectedOutput: [["Bob"],["Carol"]],
        },
      ],
      variations: [],
      expectedOutput: [["Bob"],["Carol"]],
      hints: ["LEFT JOIN keeps all customers. WHERE o.id IS NULL finds those with no matching order."],
    },
    {
      id: "join-ex4",
      type: "fix-query",
      prompt: "This query creates duplicate rows because it's missing a join condition. Fix the FROM/JOIN clause.",
      setupSQL: `DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS departments;
CREATE TABLE departments(id INT, name TEXT);
CREATE TABLE employees(id INT, name TEXT, dept_id INT);
INSERT INTO departments VALUES (1,'Engineering'),(2,'Marketing');
INSERT INTO employees VALUES (1,'Alice',1),(2,'Bob',2);`,
      cols: ["employee", "department"],
      template: "SELECT e.name AS employee, d.name AS department\n{{BLANK}}",
      editableDefault: "FROM employees e, departments d",
      variations: [],
      expectedOutput: [["Alice","Engineering"],["Bob","Marketing"]],
      hints: ["A comma join without WHERE is a cross join. Use JOIN ... ON instead."],
    },
    {
      id: "join-ex5",
      type: "fix-query",
      prompt: "This query loses employees without orders. Change the join type to keep all employees.",
      setupSQL: `DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS orders;
CREATE TABLE employees(id INT, name TEXT);
CREATE TABLE orders(id INT, emp_id INT, amount INT);
INSERT INTO employees VALUES (1,'Alice'),(2,'Bob'),(3,'Carol');
INSERT INTO orders VALUES (1,1,500),(2,1,300);`,
      cols: ["name", "total_orders"],
      template: "SELECT e.name, COUNT(o.id) AS total_orders\nFROM employees e\n{{BLANK}}\nGROUP BY e.name",
      editableDefault: "JOIN orders o ON e.id = o.emp_id",
      variations: [],
      expectedOutput: [["Alice",2],["Bob",0],["Carol",0]],
      hints: ["Change JOIN to LEFT JOIN so employees without orders still appear with count 0."],
    },
  ],
},
{
  id: "subqueries",
  title: "Subqueries",
  description: "Nest queries inside other queries. Learn scalar subqueries, IN subqueries, and correlated subqueries.",
  prerequisites: ["aggregate-functions"],
  relatedProblemIds: [],
  trunk: false,
  column: 0,
  row: 5,
  exercises: [
    {
      id: "subq-ex1",
      type: "fill-blank",
      prompt: "Find employees who earn more than the average salary.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',60000),(3,'Carol',120000),(4,'Dave',75000);`,
      cols: ["name", "salary"],
      template: "SELECT name, salary\nFROM employees\nWHERE salary > {{BLANK}}",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Alice",90000],["Carol",120000]],
      hints: ["Use (SELECT AVG(salary) FROM employees) as the subquery."],
    },
    {
      id: "subq-ex2",
      type: "build-incremental",
      prompt: "Build a query to find customers who placed orders over $500.",
      setupSQL: `DROP TABLE IF EXISTS customers; DROP TABLE IF EXISTS orders;
CREATE TABLE customers(id INT, name TEXT);
CREATE TABLE orders(id INT, customer_id INT, amount INT);
INSERT INTO customers VALUES (1,'Alice'),(2,'Bob'),(3,'Carol');
INSERT INTO orders VALUES (1,1,600),(2,2,300),(3,1,200),(4,3,800);`,
      cols: ["name"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Write a subquery that returns customer_ids with orders > 500.",
          template: "SELECT customer_id FROM orders WHERE amount > 500",
          expectedOutput: [[1],[3]],
        },
        {
          prompt: "Now use that as an IN subquery to get customer names.",
          template: "{{BLANK}}",
          expectedOutput: [["Alice"],["Carol"]],
        },
      ],
      variations: [],
      expectedOutput: [["Alice"],["Carol"]],
      hints: ["Use WHERE id IN (SELECT customer_id FROM orders WHERE amount > 500)."],
    },
    {
      id: "subq-ex3",
      type: "fill-blank",
      prompt: "For each employee, show their salary and the department average salary.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',90000),(2,'Bob','Engineering',80000),(3,'Carol','Marketing',70000);`,
      cols: ["name", "salary", "dept_avg"],
      template: "SELECT name, salary,\n  {{BLANK}} AS dept_avg\nFROM employees e1",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Alice",90000,85000],["Bob",80000,85000],["Carol",70000,70000]],
      hints: ["Use a correlated subquery: (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e1.department)."],
    },
    {
      id: "subq-ex4",
      type: "fix-query",
      prompt: "This subquery returns multiple rows but is used where a single value is expected. Fix it.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',60000),(3,'Carol',120000);`,
      cols: ["name", "salary"],
      template: "SELECT name, salary\nFROM employees\nWHERE salary > {{BLANK}}",
      editableDefault: "(SELECT salary FROM employees)",
      variations: [],
      expectedOutput: [["Alice",90000],["Carol",120000]],
      hints: ["A scalar subquery must return one value. Use AVG(salary) instead of salary."],
    },
    {
      id: "subq-ex5",
      type: "fix-query",
      prompt: "This query uses a subquery but should use EXISTS for better performance. Rewrite the WHERE clause.",
      setupSQL: `DROP TABLE IF EXISTS customers; DROP TABLE IF EXISTS orders;
CREATE TABLE customers(id INT, name TEXT);
CREATE TABLE orders(id INT, customer_id INT);
INSERT INTO customers VALUES (1,'Alice'),(2,'Bob'),(3,'Carol');
INSERT INTO orders VALUES (1,1),(2,3);`,
      cols: ["name"],
      template: "SELECT name\nFROM customers c\nWHERE {{BLANK}}",
      editableDefault: "id IN (SELECT customer_id FROM orders)",
      variations: [],
      expectedOutput: [["Alice"],["Carol"]],
      hints: ["Use EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)."],
    },
  ],
},
{
  id: "set-operations",
  title: "Set Operations",
  description: "Combine result sets with UNION, INTERSECT, and EXCEPT. Understand the difference between UNION and UNION ALL.",
  prerequisites: ["aggregate-functions"],
  relatedProblemIds: [],
  trunk: false,
  column: 1,
  row: 5,
  exercises: [
    {
      id: "set-ex1",
      type: "fill-blank",
      prompt: "Combine the names from customers and suppliers into one list, removing duplicates.",
      setupSQL: `DROP TABLE IF EXISTS customers; DROP TABLE IF EXISTS suppliers;
CREATE TABLE customers(id INT, name TEXT);
CREATE TABLE suppliers(id INT, name TEXT);
INSERT INTO customers VALUES (1,'Alice'),(2,'Bob');
INSERT INTO suppliers VALUES (1,'Bob'),(2,'Carol');`,
      cols: ["name"],
      template: "SELECT name FROM customers\n{{BLANK}}\nSELECT name FROM suppliers",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Alice"],["Bob"],["Carol"]],
      hints: ["UNION combines results and removes duplicates."],
    },
    {
      id: "set-ex2",
      type: "fill-blank",
      prompt: "Find names that appear in both customers AND suppliers.",
      setupSQL: `DROP TABLE IF EXISTS customers; DROP TABLE IF EXISTS suppliers;
CREATE TABLE customers(id INT, name TEXT);
CREATE TABLE suppliers(id INT, name TEXT);
INSERT INTO customers VALUES (1,'Alice'),(2,'Bob');
INSERT INTO suppliers VALUES (1,'Bob'),(2,'Carol');`,
      cols: ["name"],
      template: "SELECT name FROM customers\n{{BLANK}}\nSELECT name FROM suppliers",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Bob"]],
      hints: ["INTERSECT returns only rows that appear in both queries."],
    },
    {
      id: "set-ex3",
      type: "build-incremental",
      prompt: "Build a query to find customers who are NOT suppliers.",
      setupSQL: `DROP TABLE IF EXISTS customers; DROP TABLE IF EXISTS suppliers;
CREATE TABLE customers(id INT, name TEXT);
CREATE TABLE suppliers(id INT, name TEXT);
INSERT INTO customers VALUES (1,'Alice'),(2,'Bob'),(3,'Dave');
INSERT INTO suppliers VALUES (1,'Bob'),(2,'Carol');`,
      cols: ["name"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Write a SELECT to get customer names.",
          template: "{{BLANK}}",
          expectedOutput: [["Alice"],["Bob"],["Dave"]],
        },
        {
          prompt: "Use EXCEPT to remove names that also appear in suppliers.",
          template: "{{BLANK}}",
          expectedOutput: [["Alice"],["Dave"]],
        },
      ],
      variations: [],
      expectedOutput: [["Alice"],["Dave"]],
      hints: ["EXCEPT removes rows from the first query that also appear in the second."],
    },
    {
      id: "set-ex4",
      type: "fix-query",
      prompt: "This query uses UNION but loses duplicate entries that should be kept. Fix it to keep all rows.",
      setupSQL: `DROP TABLE IF EXISTS jan_sales; DROP TABLE IF EXISTS feb_sales;
CREATE TABLE jan_sales(product TEXT, amount INT);
CREATE TABLE feb_sales(product TEXT, amount INT);
INSERT INTO jan_sales VALUES ('Laptop',1000),('Mouse',25);
INSERT INTO feb_sales VALUES ('Laptop',1000),('Keyboard',75);`,
      cols: ["product", "amount"],
      template: "SELECT product, amount FROM jan_sales\n{{BLANK}}\nSELECT product, amount FROM feb_sales",
      editableDefault: "UNION",
      variations: [],
      expectedOutput: [["Laptop",1000],["Mouse",25],["Laptop",1000],["Keyboard",75]],
      hints: ["UNION removes duplicates. Use UNION ALL to keep all rows."],
    },
    {
      id: "set-ex5",
      type: "fix-query",
      prompt: "This UNION fails because the columns don't match. Fix the second SELECT to match the first.",
      setupSQL: `DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS contractors;
CREATE TABLE employees(id INT, name TEXT, role TEXT);
CREATE TABLE contractors(id INT, full_name TEXT, position TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineer');
INSERT INTO contractors VALUES (1,'Bob','Designer');`,
      cols: ["name", "role"],
      template: "SELECT name, role FROM employees\nUNION\n{{BLANK}}",
      editableDefault: "SELECT * FROM contractors",
      variations: [],
      expectedOutput: [["Alice","Engineer"],["Bob","Designer"]],
      hints: ["UNION requires matching columns. Select full_name AS name, position AS role."],
    },
  ],
},
```

- [ ] **Step 5: Add Window Functions and CTEs nodes (row 6)**

```typescript
{
  id: "window-functions",
  title: "Window Functions",
  description: "Perform calculations across rows related to the current row. Learn ROW_NUMBER, RANK, DENSE_RANK, LAG, and LEAD.",
  prerequisites: ["joins"],
  relatedProblemIds: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  trunk: false,
  column: -1,
  row: 6,
  exercises: [
    {
      id: "winfn-ex1",
      type: "fill-blank",
      prompt: "Add a row number to each employee, ordered by salary descending.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',75000),(3,'Carol',120000);`,
      cols: ["name", "salary", "rn"],
      template: "SELECT name, salary,\n  {{BLANK}} AS rn\nFROM employees",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Carol",120000,1],["Alice",90000,2],["Bob",75000,3]],
      hints: ["Use ROW_NUMBER() OVER (ORDER BY salary DESC)."],
    },
    {
      id: "winfn-ex2",
      type: "fill-blank",
      prompt: "Rank employees by salary within each department (same salary = same rank, no gaps).",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Eng',90000),(2,'Bob','Eng',90000),(3,'Carol','Eng',80000),(4,'Dave','Mkt',70000);`,
      cols: ["name", "department", "salary", "rnk"],
      template: "SELECT name, department, salary,\n  {{BLANK}} AS rnk\nFROM employees",
      editableDefault: "",
      variations: [],
      expectedOutput: [["Alice","Eng",90000,1],["Bob","Eng",90000,1],["Carol","Eng",80000,2],["Dave","Mkt",70000,1]],
      hints: ["Use DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC)."],
    },
    {
      id: "winfn-ex3",
      type: "build-incremental",
      prompt: "Build a query to show each employee's salary and the previous employee's salary (by hire date).",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, hire_date DATE, salary INT);
INSERT INTO employees VALUES (1,'Alice','2024-01-01',80000),(2,'Bob','2024-06-01',90000),(3,'Carol','2025-01-01',85000);`,
      cols: ["name", "salary", "prev_salary"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Select name, salary, and use LAG(salary) OVER (ORDER BY hire_date) as prev_salary.",
          template: "{{BLANK}}",
          expectedOutput: [["Alice",80000,null],["Bob",90000,80000],["Carol",85000,90000]],
        },
      ],
      variations: [],
      expectedOutput: [["Alice",80000,null],["Bob",90000,80000],["Carol",85000,90000]],
      hints: ["LAG(salary) OVER (ORDER BY hire_date) looks at the previous row's salary."],
    },
    {
      id: "winfn-ex4",
      type: "fix-query",
      prompt: "This query uses RANK() but should use DENSE_RANK() to avoid gaps in ranking. Fix it.",
      setupSQL: `DROP TABLE IF EXISTS scores; CREATE TABLE scores(name TEXT, score INT);
INSERT INTO scores VALUES ('Alice',100),('Bob',100),('Carol',90),('Dave',80);`,
      cols: ["name", "score", "rnk"],
      template: "SELECT name, score,\n  {{BLANK}} AS rnk\nFROM scores",
      editableDefault: "RANK() OVER (ORDER BY score DESC)",
      variations: [],
      expectedOutput: [["Alice",100,1],["Bob",100,1],["Carol",90,2],["Dave",80,3]],
      hints: ["RANK() gives 1,1,3,4. DENSE_RANK() gives 1,1,2,3 — no gaps."],
    },
    {
      id: "winfn-ex5",
      type: "fix-query",
      prompt: "This window function is missing PARTITION BY, so it ranks globally instead of per department. Fix it.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Eng',90000),(2,'Bob','Mkt',70000),(3,'Carol','Eng',80000);`,
      cols: ["name", "department", "salary", "dept_rank"],
      template: "SELECT name, department, salary,\n  ROW_NUMBER() OVER ({{BLANK}}) AS dept_rank\nFROM employees",
      editableDefault: "ORDER BY salary DESC",
      variations: [],
      expectedOutput: [["Alice","Eng",90000,1],["Carol","Eng",80000,2],["Bob","Mkt",70000,1]],
      hints: ["Add PARTITION BY department before ORDER BY to rank within each department."],
    },
  ],
},
{
  id: "ctes",
  title: "CTEs",
  description: "Common Table Expressions (WITH clause) make complex queries readable by breaking them into named steps.",
  prerequisites: ["subqueries"],
  relatedProblemIds: [],
  trunk: false,
  column: 0,
  row: 6,
  exercises: [
    {
      id: "cte-ex1",
      type: "fill-blank",
      prompt: "Rewrite this subquery as a CTE: find employees earning above average.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',60000),(3,'Carol',120000),(4,'Dave',75000);`,
      cols: ["name", "salary"],
      template: "{{BLANK}}\nSELECT name, salary\nFROM employees, avg_sal\nWHERE salary > avg_sal.val",
      editableDefault: "WITH avg_sal AS (\n  \n)",
      variations: [],
      expectedOutput: [["Alice",90000],["Carol",120000]],
      hints: ["Fill in the CTE: WITH avg_sal AS (SELECT AVG(salary) AS val FROM employees)."],
    },
    {
      id: "cte-ex2",
      type: "build-incremental",
      prompt: "Build a CTE query to find departments with above-average headcount.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Eng'),(2,'Bob','Eng'),(3,'Carol','Eng'),(4,'Dave','Mkt'),(5,'Eve','Sales');`,
      cols: ["department", "headcount"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Write a CTE called dept_counts that counts employees per department.",
          template: "{{BLANK}}",
          expectedOutput: [["Eng",3],["Mkt",1],["Sales",1]],
        },
        {
          prompt: "Now use the CTE to select departments where headcount > (SELECT AVG(headcount) FROM dept_counts).",
          template: "{{BLANK}}",
          expectedOutput: [["Eng",3]],
        },
      ],
      variations: [],
      expectedOutput: [["Eng",3]],
      hints: ["WITH dept_counts AS (SELECT department, COUNT(*) AS headcount FROM employees GROUP BY department)"],
    },
    {
      id: "cte-ex3",
      type: "build-incremental",
      prompt: "Build a query with two CTEs chained together.",
      setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer_id INT, amount INT);
INSERT INTO orders VALUES (1,1,500),(2,1,300),(3,2,700),(4,2,200),(5,3,100);`,
      cols: ["customer_id", "total", "category"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Write a CTE called customer_totals that sums amount per customer_id.",
          template: "{{BLANK}}",
          expectedOutput: [[1,800],[2,900],[3,100]],
        },
        {
          prompt: "Add a second CTE called categorized that adds a 'category' column: 'high' if total >= 500, else 'low'. Then SELECT from it.",
          template: "{{BLANK}}",
          expectedOutput: [[1,800,"high"],[2,900,"high"],[3,100,"low"]],
        },
      ],
      variations: [],
      expectedOutput: [[1,800,"high"],[2,900,"high"],[3,100,"low"]],
      hints: ["Chain CTEs with commas: WITH cte1 AS (...), cte2 AS (SELECT ..., CASE WHEN ... FROM cte1)"],
    },
    {
      id: "cte-ex4",
      type: "fix-query",
      prompt: "This CTE has a syntax error — it's missing the AS keyword. Fix it.",
      setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',90000),(2,'Bob',60000);`,
      cols: ["name", "salary"],
      template: "{{BLANK}}\nSELECT * FROM high_earners",
      editableDefault: "WITH high_earners (\n  SELECT name, salary FROM employees WHERE salary > 70000\n)",
      variations: [],
      expectedOutput: [["Alice",90000]],
      hints: ["CTE syntax: WITH name AS (query), not WITH name (query)."],
    },
    {
      id: "cte-ex5",
      type: "fix-query",
      prompt: "This query references a CTE before it's defined. Fix the order.",
      setupSQL: `DROP TABLE IF EXISTS products; CREATE TABLE products(id INT, name TEXT, price INT, category TEXT);
INSERT INTO products VALUES (1,'Laptop',999,'Electronics'),(2,'Desk',250,'Furniture'),(3,'Mouse',25,'Electronics');`,
      cols: ["category", "avg_price"],
      template: "{{BLANK}}",
      editableDefault: "WITH result AS (\n  SELECT * FROM cat_avg WHERE avg_price > 100\n),\ncat_avg AS (\n  SELECT category, AVG(price) AS avg_price FROM products GROUP BY category\n)\nSELECT * FROM result",
      variations: [],
      expectedOutput: [["Electronics",512]],
      hints: ["CTEs are evaluated in order. cat_avg must be defined before result can reference it."],
    },
  ],
},
```

- [ ] **Step 6: Add Cumulative & Sliding Windows, Consecutive Sequences (row 7)**

```typescript
{
  id: "cumulative-sliding",
  title: "Cumulative & Sliding Windows",
  description: "Running totals, moving averages, and frame specifications (ROWS BETWEEN). Build on window function fundamentals.",
  prerequisites: ["window-functions"],
  relatedProblemIds: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
  trunk: false,
  column: -1,
  row: 7,
  exercises: [
    {
      id: "cum-ex1",
      type: "fill-blank",
      prompt: "Calculate a running total of daily revenue.",
      setupSQL: `DROP TABLE IF EXISTS daily_revenue; CREATE TABLE daily_revenue(day DATE, revenue INT);
INSERT INTO daily_revenue VALUES ('2025-01-01',100),('2025-01-02',200),('2025-01-03',150);`,
      cols: ["day", "revenue", "running_total"],
      template: "SELECT day, revenue,\n  {{BLANK}} AS running_total\nFROM daily_revenue",
      editableDefault: "",
      variations: [],
      expectedOutput: [["2025-01-01",100,100],["2025-01-02",200,300],["2025-01-03",150,450]],
      hints: ["Use SUM(revenue) OVER (ORDER BY day) for a cumulative sum."],
    },
    {
      id: "cum-ex2",
      type: "fill-blank",
      prompt: "Calculate a 2-day moving average of revenue (current day + previous day).",
      setupSQL: `DROP TABLE IF EXISTS daily_revenue; CREATE TABLE daily_revenue(day DATE, revenue INT);
INSERT INTO daily_revenue VALUES ('2025-01-01',100),('2025-01-02',200),('2025-01-03',300);`,
      cols: ["day", "revenue", "moving_avg"],
      template: "SELECT day, revenue,\n  AVG(revenue) OVER (\n    ORDER BY day\n    {{BLANK}}\n  ) AS moving_avg\nFROM daily_revenue",
      editableDefault: "",
      variations: [],
      expectedOutput: [["2025-01-01",100,100],["2025-01-02",200,150],["2025-01-03",300,250]],
      hints: ["Use ROWS BETWEEN 1 PRECEDING AND CURRENT ROW."],
    },
    {
      id: "cum-ex3",
      type: "build-incremental",
      prompt: "Build a query showing cumulative percentage of total revenue per day.",
      setupSQL: `DROP TABLE IF EXISTS daily_revenue; CREATE TABLE daily_revenue(day DATE, revenue INT);
INSERT INTO daily_revenue VALUES ('2025-01-01',100),('2025-01-02',300),('2025-01-03',100);`,
      cols: ["day", "revenue", "cum_pct"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Select day, revenue, and a running total using SUM() OVER (ORDER BY day).",
          template: "{{BLANK}}",
          expectedOutput: [["2025-01-01",100,100],["2025-01-02",300,400],["2025-01-03",100,500]],
        },
        {
          prompt: "Now wrap it in a CTE or subquery and divide running_total by total to get cum_pct (multiply by 100, round to nearest integer).",
          template: "{{BLANK}}",
          expectedOutput: [["2025-01-01",100,20],["2025-01-02",300,80],["2025-01-03",100,100]],
        },
      ],
      variations: [],
      expectedOutput: [["2025-01-01",100,20],["2025-01-02",300,80],["2025-01-03",100,100]],
      hints: ["ROUND(SUM(revenue) OVER (ORDER BY day) * 100.0 / SUM(revenue) OVER (), 0)"],
    },
    {
      id: "cum-ex4",
      type: "fix-query",
      prompt: "This running total resets for each partition but should be a global running total. Fix the OVER clause.",
      setupSQL: `DROP TABLE IF EXISTS sales; CREATE TABLE sales(day DATE, region TEXT, amount INT);
INSERT INTO sales VALUES ('2025-01-01','East',100),('2025-01-02','West',200),('2025-01-03','East',150);`,
      cols: ["day", "amount", "running_total"],
      template: "SELECT day, amount,\n  SUM(amount) OVER ({{BLANK}}) AS running_total\nFROM sales",
      editableDefault: "PARTITION BY region ORDER BY day",
      variations: [],
      expectedOutput: [["2025-01-01",100,100],["2025-01-02",200,300],["2025-01-03",150,450]],
      hints: ["Remove PARTITION BY to make the running total global across all rows."],
    },
    {
      id: "cum-ex5",
      type: "fix-query",
      prompt: "This moving average includes too many rows. Fix the frame to only include the current row and 1 preceding.",
      setupSQL: `DROP TABLE IF EXISTS daily_revenue; CREATE TABLE daily_revenue(day DATE, revenue INT);
INSERT INTO daily_revenue VALUES ('2025-01-01',100),('2025-01-02',200),('2025-01-03',300),('2025-01-04',400);`,
      cols: ["day", "moving_avg"],
      template: "SELECT day,\n  AVG(revenue) OVER (\n    ORDER BY day\n    {{BLANK}}\n  ) AS moving_avg\nFROM daily_revenue",
      editableDefault: "ROWS BETWEEN 2 PRECEDING AND CURRENT ROW",
      variations: [],
      expectedOutput: [["2025-01-01",100],["2025-01-02",150],["2025-01-03",250],["2025-01-04",350]],
      hints: ["Change to ROWS BETWEEN 1 PRECEDING AND CURRENT ROW for a 2-row window."],
    },
  ],
},
{
  id: "consecutive-sequences",
  title: "Consecutive Sequences",
  description: "Detect streaks, gaps, and consecutive patterns in data. A classic interview topic using window functions and self-joins.",
  prerequisites: ["window-functions"],
  relatedProblemIds: [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
  trunk: false,
  column: 1,
  row: 7,
  exercises: [
    {
      id: "consec-ex1",
      type: "fill-blank",
      prompt: "Assign a group number to consecutive sequences using ROW_NUMBER difference technique.",
      setupSQL: `DROP TABLE IF EXISTS logins; CREATE TABLE logins(user_id INT, login_date DATE);
INSERT INTO logins VALUES (1,'2025-01-01'),(1,'2025-01-02'),(1,'2025-01-03'),(1,'2025-01-05'),(1,'2025-01-06');`,
      cols: ["login_date", "grp"],
      template: "SELECT login_date,\n  login_date - {{BLANK}} AS grp\nFROM logins\nWHERE user_id = 1",
      editableDefault: "",
      variations: [],
      expectedOutput: [["2025-01-01","2024-12-31"],["2025-01-02","2024-12-31"],["2025-01-03","2024-12-31"],["2025-01-05","2025-01-01"],["2025-01-06","2025-01-01"]],
      hints: ["Subtract ROW_NUMBER() OVER (ORDER BY login_date) * INTERVAL '1 day' from login_date. Consecutive dates will produce the same group value."],
    },
    {
      id: "consec-ex2",
      type: "build-incremental",
      prompt: "Build a query to find the longest consecutive login streak.",
      setupSQL: `DROP TABLE IF EXISTS logins; CREATE TABLE logins(user_id INT, login_date DATE);
INSERT INTO logins VALUES (1,'2025-01-01'),(1,'2025-01-02'),(1,'2025-01-03'),(1,'2025-01-05'),(1,'2025-01-06');`,
      cols: ["streak_length"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Create a CTE that assigns a group using login_date - ROW_NUMBER() OVER (ORDER BY login_date) * INTERVAL '1 day'.",
          template: "{{BLANK}}",
          expectedOutput: [["2025-01-01","2024-12-31"],["2025-01-02","2024-12-31"],["2025-01-03","2024-12-31"],["2025-01-05","2025-01-01"],["2025-01-06","2025-01-01"]],
        },
        {
          prompt: "Now GROUP BY the group, count per group, and select the MAX streak.",
          template: "{{BLANK}}",
          expectedOutput: [[3]],
        },
      ],
      variations: [],
      expectedOutput: [[3]],
      hints: ["GROUP BY grp, then SELECT MAX(cnt) FROM (SELECT COUNT(*) AS cnt ... GROUP BY grp)."],
    },
    {
      id: "consec-ex3",
      type: "fill-blank",
      prompt: "Find gaps in a sequence of IDs — show missing IDs.",
      setupSQL: `DROP TABLE IF EXISTS items; CREATE TABLE items(id INT);
INSERT INTO items VALUES (1),(2),(4),(5),(8);`,
      cols: ["gap_start", "gap_end"],
      template: "SELECT id + 1 AS gap_start,\n  {{BLANK}} - 1 AS gap_end\nFROM (\n  SELECT id, LEAD(id) OVER (ORDER BY id) AS next_id\n  FROM items\n) t\nWHERE next_id - id > 1",
      editableDefault: "",
      variations: [],
      expectedOutput: [[3,3],[6,7]],
      hints: ["next_id is already computed by LEAD. Use next_id - 1 as gap_end."],
    },
    {
      id: "consec-ex4",
      type: "fix-query",
      prompt: "This streak query doesn't partition by user, so it mixes all users' streaks. Fix the window function.",
      setupSQL: `DROP TABLE IF EXISTS logins; CREATE TABLE logins(user_id INT, login_date DATE);
INSERT INTO logins VALUES (1,'2025-01-01'),(1,'2025-01-02'),(2,'2025-01-01'),(2,'2025-01-02'),(2,'2025-01-03');`,
      cols: ["user_id", "login_date", "grp"],
      template: "SELECT user_id, login_date,\n  login_date - ROW_NUMBER() OVER ({{BLANK}}) * INTERVAL '1 day' AS grp\nFROM logins",
      editableDefault: "ORDER BY login_date",
      variations: [],
      expectedOutput: [[1,"2025-01-01","2024-12-31"],[1,"2025-01-02","2024-12-31"],[2,"2025-01-01","2024-12-31"],[2,"2025-01-02","2024-12-31"],[2,"2025-01-03","2024-12-31"]],
      hints: ["Add PARTITION BY user_id before ORDER BY."],
    },
    {
      id: "consec-ex5",
      type: "fix-query",
      prompt: "This gap detection query uses LAG instead of LEAD, looking backward instead of forward. Fix it.",
      setupSQL: `DROP TABLE IF EXISTS items; CREATE TABLE items(id INT);
INSERT INTO items VALUES (1),(2),(5),(6);`,
      cols: ["gap_start", "gap_end"],
      template: "SELECT {{BLANK}} + 1 AS gap_start,\n  next_id - 1 AS gap_end\nFROM (\n  SELECT id, LEAD(id) OVER (ORDER BY id) AS next_id\n  FROM items\n) t\nWHERE next_id - id > 1",
      editableDefault: "next_id",
      variations: [],
      expectedOutput: [[3,4]],
      hints: ["gap_start should be id + 1 (current id plus 1), not next_id + 1."],
    },
  ],
},
```

- [ ] **Step 7: Add Advanced Analytics node (row 8)**

```typescript
{
  id: "advanced-analytics",
  title: "Advanced Analytics",
  description: "Combine everything: funnels, retention, cohort analysis, and sessionization patterns used in real analytics.",
  prerequisites: ["cumulative-sliding", "consecutive-sequences"],
  relatedProblemIds: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75],
  trunk: false,
  column: 0,
  row: 8,
  exercises: [
    {
      id: "adv-ex1",
      type: "fill-blank",
      prompt: "Calculate day-over-day revenue change as a percentage.",
      setupSQL: `DROP TABLE IF EXISTS daily_revenue; CREATE TABLE daily_revenue(day DATE, revenue INT);
INSERT INTO daily_revenue VALUES ('2025-01-01',100),('2025-01-02',120),('2025-01-03',90);`,
      cols: ["day", "revenue", "pct_change"],
      template: "SELECT day, revenue,\n  ROUND((revenue - {{BLANK}}) * 100.0 / {{BLANK}}, 1) AS pct_change\nFROM (\n  SELECT day, revenue, LAG(revenue) OVER (ORDER BY day) AS prev_rev\n  FROM daily_revenue\n) t",
      editableDefault: "",
      variations: [],
      expectedOutput: [["2025-01-01",100,null],["2025-01-02",120,20.0],["2025-01-03",90,-25.0]],
      hints: ["Replace {{BLANK}} with prev_rev. Formula: (revenue - prev_rev) * 100.0 / prev_rev."],
    },
    {
      id: "adv-ex2",
      type: "build-incremental",
      prompt: "Build a simple funnel analysis: what % of users who visited also signed up, and what % of signups purchased.",
      setupSQL: `DROP TABLE IF EXISTS events; CREATE TABLE events(user_id INT, event TEXT);
INSERT INTO events VALUES (1,'visit'),(2,'visit'),(3,'visit'),(4,'visit'),(5,'visit'),
(1,'signup'),(2,'signup'),(3,'signup'),
(1,'purchase'),(2,'purchase');`,
      cols: ["step", "users", "pct"],
      template: "{{BLANK}}",
      steps: [
        {
          prompt: "Count distinct users per event type.",
          template: "{{BLANK}}",
          expectedOutput: [["visit",5],["signup",3],["purchase",2]],
        },
        {
          prompt: "Now calculate the percentage of total visitors at each step (round to 0 decimals).",
          template: "{{BLANK}}",
          expectedOutput: [["visit",5,100],["signup",3,60],["purchase",2,40]],
        },
      ],
      variations: [],
      expectedOutput: [["visit",5,100],["signup",3,60],["purchase",2,40]],
      hints: ["Use a CTE with counts, then ROUND(users * 100.0 / FIRST_VALUE(users) OVER (ORDER BY ...), 0)."],
    },
    {
      id: "adv-ex3",
      type: "fill-blank",
      prompt: "Calculate a simple retention metric: for users who signed up in January, what % were active in February?",
      setupSQL: `DROP TABLE IF EXISTS signups; DROP TABLE IF EXISTS activity;
CREATE TABLE signups(user_id INT, signup_date DATE);
CREATE TABLE activity(user_id INT, activity_date DATE);
INSERT INTO signups VALUES (1,'2025-01-05'),(2,'2025-01-10'),(3,'2025-01-15'),(4,'2025-01-20');
INSERT INTO activity VALUES (1,'2025-02-01'),(2,'2025-02-15'),(4,'2025-03-01');`,
      cols: ["retention_pct"],
      template: "SELECT ROUND(\n  COUNT(DISTINCT a.user_id) * 100.0 / COUNT(DISTINCT s.user_id)\n) AS retention_pct\nFROM signups s\n{{BLANK}}",
      editableDefault: "",
      variations: [],
      expectedOutput: [[50]],
      hints: ["LEFT JOIN activity a ON s.user_id = a.user_id AND a.activity_date BETWEEN '2025-02-01' AND '2025-02-28'."],
    },
    {
      id: "adv-ex4",
      type: "fix-query",
      prompt: "This percentile query uses the wrong window frame. Fix it to calculate a proper percent rank.",
      setupSQL: `DROP TABLE IF EXISTS scores; CREATE TABLE scores(name TEXT, score INT);
INSERT INTO scores VALUES ('Alice',90),('Bob',80),('Carol',70),('Dave',60);`,
      cols: ["name", "score", "pct_rank"],
      template: "SELECT name, score,\n  ROUND({{BLANK}}::NUMERIC, 2) AS pct_rank\nFROM scores",
      editableDefault: "ROW_NUMBER() OVER (ORDER BY score) * 1.0 / COUNT(*) OVER ()",
      variations: [],
      expectedOutput: [["Dave",60,0.00],["Carol",70,0.33],["Bob",80,0.67],["Alice",90,1.00]],
      hints: ["Use the built-in PERCENT_RANK() OVER (ORDER BY score) function."],
    },
    {
      id: "adv-ex5",
      type: "fix-query",
      prompt: "This query tries to find the median but only gets the average. Fix it to use PERCENTILE_CONT.",
      setupSQL: `DROP TABLE IF EXISTS salaries; CREATE TABLE salaries(salary INT);
INSERT INTO salaries VALUES (50000),(60000),(70000),(80000),(90000);`,
      cols: ["median_salary"],
      template: "SELECT {{BLANK}} AS median_salary\nFROM salaries",
      editableDefault: "AVG(salary)",
      variations: [],
      expectedOutput: [[70000]],
      hints: ["Use PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)."],
    },
  ],
},
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 9: Manual verification**

Run dev server, visit `/learn`. Should see all 13 nodes in the skill tree layout with proper trunk/branch positioning. Only SELECT Basics should be unlocked initially.

- [ ] **Step 10: Commit**

```bash
git add queryveda/lib/skill-tree-data.ts
git commit -m "feat(learn): add all 13 skill tree nodes with 65 micro-exercises"
```

---

### Task 15: Integration with Progress Page

**Files:**
- Modify: `queryveda/app/progress/` (the progress page component)

- [ ] **Step 1: Find and read the progress page component**

Identify the client component file in `queryveda/app/progress/`.

- [ ] **Step 2: Add skill tree mastery summary section**

Add a new section to the progress page that shows:
- Total skill tree exercises completed out of total
- A compact list of nodes with their mastery percentage
- Link to `/learn` for details

Use the `useSkillTree` hook and `MasteryBar` component:

```tsx
import { useSkillTree } from "@/hooks/use-skill-tree";
import { skillTreeNodes } from "@/lib/skill-tree-data";
import { MasteryBar } from "@/components/learn/mastery-bar";
import Link from "next/link";
```

Add a "Learning Progress" card after the existing stats:

```tsx
<div className="rounded-xl border p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold">Learning Progress</h2>
    <Link href="/learn" className="text-sm text-primary hover:underline">
      View Skill Tree
    </Link>
  </div>
  <div className="space-y-3">
    {skillTreeNodes.map((node) => {
      const m = getNodeMastery(node.id);
      return (
        <div key={node.id} className="flex items-center gap-3">
          <span className="text-sm w-40 truncate">{node.title}</span>
          <div className="flex-1">
            <MasteryBar completed={m.completed} total={m.total} />
          </div>
        </div>
      );
    })}
  </div>
</div>
```

- [ ] **Step 3: Verify it builds and renders**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add queryveda/app/progress/
git commit -m "feat(learn): add learning progress section to progress dashboard"
```

---

### Task 16: End-to-End Manual Testing

- [ ] **Step 1: Test skill tree map page**

Visit `/learn`:
- SELECT Basics should be unlocked (green outline, "Start" text)
- WHERE & Filtering should be locked (grey, lock icon)
- All other nodes should be locked
- Clicking SELECT Basics navigates to `/learn/select-basics`

- [ ] **Step 2: Test exercise flow**

Visit `/learn/select-basics`:
- 5 exercises listed on the left
- First exercise active by default (fill-blank type)
- Template shows with editable blank
- Type correct SQL, click Run → should pass
- Exercise gets a checkmark, mastery bar updates
- After 3 completed → WHERE & Filtering unlocks on `/learn`

- [ ] **Step 3: Test build-incremental exercise**

Click exercise 3 (build-incremental) in SELECT Basics:
- Step indicator shows 1/2
- Complete step 1 → auto-advances to step 2
- Complete step 2 → exercise marked complete

- [ ] **Step 4: Test fix-query exercise**

Click exercise 4 (fix-query):
- Shows broken query with pre-filled wrong value
- Fix it and run → should pass

- [ ] **Step 5: Test mastery unlock**

Complete 3/5 exercises in SELECT Basics:
- Navigate to `/learn`
- WHERE & Filtering should now be unlocked (green outline, "Start")
- SELECT Basics should show partial progress bar

- [ ] **Step 6: Test struggle banner**

Visit `/practice/1`, fail the problem 3+ times:
- Blue banner should appear suggesting skill tree review
- Banner should link to relevant node
- Dismiss button should hide it

- [ ] **Step 7: Test navigation**

- "Learn" link appears in desktop nav (between Home and Daily)
- "Learn" link appears in mobile drawer
- Progress page shows "Learning Progress" section

- [ ] **Step 8: Commit any fixes discovered during testing**

```bash
git add -A
git commit -m "fix(learn): address issues found during end-to-end testing"
```
