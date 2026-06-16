# Excel Learning Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Excel learning to QueryVeda as a multi-track analytics platform with interactive spreadsheet exercises and conceptual warmups.

**Architecture:** FortuneSheet (React spreadsheet library) provides the in-browser spreadsheet engine, wrapped in an ExcelExerciseEditor component that mirrors the existing MicroExerciseEditor pattern. A new Track system (`'sql' | 'excel' | 'python'`) gates content, navigation, and progress. Conceptual warmup questions use a lightweight ConceptualQuestion component.

**Tech Stack:** Next.js 14 (App Router), FortuneSheet (`@fortune-sheet/react`), Supabase (Postgres), Tailwind CSS, shadcn/ui, TypeScript

**Spec:** `docs/superpowers/specs/2026-06-16-excel-learning-track-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `queryveda/lib/track-types.ts` | Track type enum and related interfaces |
| `queryveda/lib/track-storage.ts` | Track preference persistence (localStorage + Supabase) |
| `queryveda/hooks/use-track.ts` | React hook for track state |
| `queryveda/lib/excel-skill-tree-types.ts` | Excel exercise and conceptual question interfaces |
| `queryveda/lib/excel-skill-tree-data.ts` | All 12 Excel skill nodes with exercises |
| `queryveda/lib/excel-skill-tree-storage.ts` | Excel progress persistence (localStorage + Supabase) |
| `queryveda/hooks/use-excel-skill-tree.ts` | React hook for Excel skill tree state |
| `queryveda/components/learn/conceptual-question.tsx` | Multiple-choice / fill-blank warmup component |
| `queryveda/components/learn/excel-exercise-editor.tsx` | FortuneSheet wrapper for hands-on exercises |
| `queryveda/components/learn/excel-exercise-list.tsx` | Exercise list for Excel nodes (warmups + hands-on) |
| `queryveda/app/excel/page.tsx` | Excel skill tree page |
| `queryveda/app/excel/excel-learn-client.tsx` | Client component for Excel skill tree |
| `queryveda/app/excel/learn/[nodeId]/page.tsx` | Excel node page (static params) |
| `queryveda/app/excel/learn/[nodeId]/excel-node-client.tsx` | Client component for Excel node exercises |
| `queryveda/app/onboarding/page.tsx` | Track selection screen |
| `queryveda/app/onboarding/onboarding-client.tsx` | Client component for onboarding |
| `queryveda/components/layout/track-switcher.tsx` | Track switcher for navbar |

### Modified Files
| File | Change |
|------|--------|
| `queryveda/lib/types.ts` | Add Track type export |
| `supabase-setup.sql` | Add track enum, user_tracks table, track column on skill_tree_progress |
| `queryveda/components/layout/Navbar.tsx` | Add track switcher, conditional nav links |
| `queryveda/components/layout/mobile-drawer.tsx` | Add track switcher + Excel nav links |
| `queryveda/app/page.tsx` | Adapt hero + TwoPathCards based on selected tracks |
| `queryveda/components/home/two-path-cards.tsx` | Add Excel card, show/hide based on track |
| `queryveda/app/progress/page.tsx` or progress components | Add Excel progress section |
| `queryveda/app/layout.tsx` | Wrap with TrackProvider if needed |
| `package.json` | Add `@fortune-sheet/react` dependency |

---

## Task 1: Track Type System

**Files:**
- Create: `queryveda/lib/track-types.ts`
- Modify: `queryveda/lib/types.ts`

- [ ] **Step 1: Create track types file**

Create `queryveda/lib/track-types.ts`:

```typescript
export type Track = 'sql' | 'excel' | 'python';

export const ACTIVE_TRACKS: Track[] = ['sql', 'excel'];

export const TRACK_LABELS: Record<Track, string> = {
  sql: 'SQL',
  excel: 'Excel',
  python: 'Python',
};

export const TRACK_DESCRIPTIONS: Record<Track, string> = {
  sql: 'Write queries against a real PostgreSQL database in your browser',
  excel: 'Master formulas and analytics in an interactive spreadsheet',
  python: 'Coming soon',
};
```

- [ ] **Step 2: Re-export from types.ts**

Add to the bottom of `queryveda/lib/types.ts`:

```typescript
export type { Track } from "./track-types";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd queryveda && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add queryveda/lib/track-types.ts queryveda/lib/types.ts
git commit -m "feat: add Track type system for multi-track platform"
```

---

## Task 2: Track Storage & Hook

**Files:**
- Create: `queryveda/lib/track-storage.ts`
- Create: `queryveda/hooks/use-track.ts`

- [ ] **Step 1: Create track storage**

Create `queryveda/lib/track-storage.ts`:

```typescript
import type { Track } from "./track-types";
import { ACTIVE_TRACKS } from "./track-types";
import { supabase } from "./supabase";

const STORAGE_KEY = "queryveda-tracks";

export const trackStorage = {
  getTracks(): Track[] {
    if (typeof window === "undefined") return ["sql"];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Track[];
      return parsed.filter((t) => ACTIVE_TRACKS.includes(t));
    } catch {
      return [];
    }
  },

  setTracks(tracks: Track[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  },

  hasSelectedTracks(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  },

  async syncTracksToCloud(userId: string, tracks: Track[]) {
    await supabase.from("user_tracks").upsert(
      { user_id: userId, tracks },
      { onConflict: "user_id" }
    );
  },

  async syncTracksFromCloud(userId: string): Promise<Track[] | null> {
    const { data } = await supabase
      .from("user_tracks")
      .select("tracks")
      .eq("user_id", userId)
      .single();
    if (data?.tracks) {
      const tracks = data.tracks as Track[];
      trackStorage.setTracks(tracks);
      return tracks;
    }
    return null;
  },
};
```

- [ ] **Step 2: Create use-track hook**

Create `queryveda/hooks/use-track.ts`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { trackStorage } from "@/lib/track-storage";
import { useAuth } from "./use-auth";
import type { Track } from "@/lib/track-types";

export function useTrack() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>(() => trackStorage.getTracks());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      trackStorage
        .syncTracksFromCloud(user.id)
        .then((cloudTracks) => {
          if (cloudTracks) setTracks(cloudTracks);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setTracks(trackStorage.getTracks());
      setLoading(false);
    }
  }, [user]);

  const selectTracks = useCallback(
    (newTracks: Track[]) => {
      trackStorage.setTracks(newTracks);
      setTracks(newTracks);
      if (user) {
        trackStorage.syncTracksToCloud(user.id, newTracks);
      }
    },
    [user]
  );

  const hasTrack = useCallback(
    (track: Track) => tracks.includes(track),
    [tracks]
  );

  const needsOnboarding = !loading && tracks.length === 0;

  return { tracks, selectTracks, hasTrack, needsOnboarding, loading };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd queryveda && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add queryveda/lib/track-storage.ts queryveda/hooks/use-track.ts
git commit -m "feat: add track storage and useTrack hook"
```

---

## Task 3: Onboarding Page

**Files:**
- Create: `queryveda/app/onboarding/page.tsx`
- Create: `queryveda/app/onboarding/onboarding-client.tsx`

- [ ] **Step 1: Create onboarding client component**

Create `queryveda/app/onboarding/onboarding-client.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrack } from "@/hooks/use-track";
import { Button } from "@/components/ui/button";
import { BookOpen, Table2, Check } from "lucide-react";
import type { Track } from "@/lib/track-types";

const trackOptions: { id: Track; label: string; description: string; icon: typeof BookOpen }[] = [
  {
    id: "sql",
    label: "SQL",
    description: "Write queries against a real PostgreSQL database in your browser",
    icon: BookOpen,
  },
  {
    id: "excel",
    label: "Excel",
    description: "Master formulas and analytics in an interactive spreadsheet",
    icon: Table2,
  },
];

export function OnboardingClient() {
  const router = useRouter();
  const { selectTracks } = useTrack();
  const [selected, setSelected] = useState<Set<Track>>(new Set());

  const toggle = (track: Track) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(track)) next.delete(track);
      else next.add(track);
      return next;
    });
  };

  const handleContinue = () => {
    const tracks = Array.from(selected);
    if (tracks.length === 0) return;
    selectTracks(tracks);
    router.push("/");
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        What do you want to learn?
      </h1>
      <p className="mt-3 text-muted-foreground text-lg">
        Select one or both. You can change this anytime.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-2xl w-full">
        {trackOptions.map(({ id, label, description, icon: Icon }) => {
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`relative rounded-2xl p-6 text-left transition-all border-2 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border hover:border-primary/40 hover:bg-accent/50"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <Icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold">{label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </button>
          );
        })}
      </div>

      <Button
        size="lg"
        className="mt-8"
        disabled={selected.size === 0}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create onboarding page**

Create `queryveda/app/onboarding/page.tsx`:

```typescript
import { OnboardingClient } from "./onboarding-client";

export default function OnboardingPage() {
  return <OnboardingClient />;
}
```

- [ ] **Step 3: Verify build**

Run: `cd queryveda && npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add queryveda/app/onboarding/
git commit -m "feat: add track onboarding page"
```

---

## Task 4: Onboarding Redirect from Home

**Files:**
- Modify: `queryveda/app/page.tsx`
- Create: `queryveda/components/home/home-client.tsx`

The home page is currently a server component. We need a client wrapper to check onboarding status and redirect.

- [ ] **Step 1: Create HomeClient wrapper**

Create `queryveda/components/home/home-client.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTrack } from "@/hooks/use-track";

export function HomeRedirectGuard({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, loading } = useTrack();
  const router = useRouter();

  useEffect(() => {
    if (!loading && needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [needsOnboarding, loading, router]);

  if (loading || needsOnboarding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Wrap home page with redirect guard**

Modify `queryveda/app/page.tsx` — wrap the entire return in `HomeRedirectGuard`. The file should become:

```typescript
import { DailyHeroCard } from "@/components/daily/daily-hero-card";
import { DailyToast } from "@/components/daily/daily-toast";
import { TwoPathCards } from "@/components/home/two-path-cards";
import { HomeRedirectGuard } from "@/components/home/home-client";

export default function Home() {
  return (
    <HomeRedirectGuard>
      <div>
        {/* Hero */}
        <section
          className="relative overflow-hidden px-6 py-28 text-center"
          style={{ background: "var(--qv-gradient-hero)" }}
        >
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

          <h1 className="relative mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Go from{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--qv-gradient-accent)" }}>
              SQL Zero
            </span>{" "}
            to Interview Ready
          </h1>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Structured lessons + 75 practice problems. No installations.
          </p>
        </section>

        <TwoPathCards />
        <DailyHeroCard />

        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>75 curated problems</span>
            <span className="hidden sm:inline" aria-hidden>·</span>
            <span>In-browser PostgreSQL</span>
            <span className="hidden sm:inline" aria-hidden>·</span>
            <span>Progress tracking & streaks</span>
          </div>
        </section>

        <DailyToast />
      </div>
    </HomeRedirectGuard>
  );
}
```

**Important:** This changes `page.tsx` from a pure server component to one that imports a client component. The server component itself stays a server component — `HomeRedirectGuard` is the client boundary.

- [ ] **Step 3: Verify build**

Run: `cd queryveda && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/home/home-client.tsx queryveda/app/page.tsx
git commit -m "feat: redirect first-time users to track onboarding"
```

---

## Task 5: Supabase Schema Migration

**Files:**
- Modify: `supabase-setup.sql`

- [ ] **Step 1: Add track enum and user_tracks table to supabase-setup.sql**

Append the following to the end of `supabase-setup.sql`:

```sql
-- ============================================================
-- Multi-track support (SQL, Excel, Python)
-- ============================================================

-- Track enum (prevents garbage values)
DO $$ BEGIN
  CREATE TYPE track AS ENUM ('sql', 'excel', 'python');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User track preferences
CREATE TABLE IF NOT EXISTS user_tracks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tracks track[] NOT NULL DEFAULT '{sql}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tracks"
  ON user_tracks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracks"
  ON user_tracks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracks"
  ON user_tracks FOR UPDATE USING (auth.uid() = user_id);

-- Add track column to skill_tree_progress
-- (existing rows default to 'sql')
ALTER TABLE skill_tree_progress
  ADD COLUMN IF NOT EXISTS track track NOT NULL DEFAULT 'sql';
```

- [ ] **Step 2: Commit**

```bash
git add supabase-setup.sql
git commit -m "feat: add track enum and user_tracks table to Supabase schema"
```

---

## Task 6: Excel Skill Tree Types

**Files:**
- Create: `queryveda/lib/excel-skill-tree-types.ts`

- [ ] **Step 1: Create Excel exercise types**

Create `queryveda/lib/excel-skill-tree-types.ts`:

```typescript
export interface ConceptualQuestion {
  id: string;                          // e.g., "cell-refs-concept-1"
  type: "multiple-choice" | "fill-blank";
  question: string;
  options?: string[];                  // for multiple-choice
  correctAnswer: string;              // the correct option text or fill-blank answer
  explanation: string;                // shown after answering
}

export interface ExcelTargetCell {
  cell: string;                       // e.g., "B6"
  expected: string | number;          // expected computed value
  expectedFormula?: string;           // optional: validate formula text too
}

export interface ExcelExercise {
  id: string;                          // e.g., "basic-formulas-sum-1"
  type: "write-formula" | "fix-formula" | "build-step-by-step";
  title: string;
  instruction: string;
  initialData: {
    cols: number;                      // number of columns
    rows: number;                      // number of rows
    cells: Record<string, { v: string | number; f?: string }>;  // cell address -> value/formula
  };
  targetCells: ExcelTargetCell[];
  hints: string[];
  steps?: {                            // only for build-step-by-step
    instruction: string;
    targetCells: ExcelTargetCell[];
  }[];
}

export interface ExcelSkillNode {
  id: string;                          // e.g., "cell-references"
  title: string;
  description: string;
  prerequisites: string[];             // node IDs that must be at 60%+
  conceptualQuestions: ConceptualQuestion[];
  exercises: ExcelExercise[];
  trunk: boolean;
  column: number;                      // 0 = center, -1 = left, 1 = right
  row: number;
}

export interface ExcelNodeMastery {
  nodeId: string;
  conceptualCompleted: number;
  conceptualTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  percentage: number;
  unlocked: boolean;
  starred: boolean;                    // 100% mastery
  conceptualDone: boolean;             // all warmups passed — hands-on unlocked
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd queryveda && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add queryveda/lib/excel-skill-tree-types.ts
git commit -m "feat: add Excel skill tree type definitions"
```

---

## Task 7: Excel Skill Tree Data (First 4 Basic Nodes)

**Files:**
- Create: `queryveda/lib/excel-skill-tree-data.ts`

This task creates the first 4 basic nodes. Remaining 8 nodes are added in Task 14.

- [ ] **Step 1: Create skill tree data with 4 basic nodes**

Create `queryveda/lib/excel-skill-tree-data.ts`:

```typescript
import type { ExcelSkillNode } from "./excel-skill-tree-types";

export const excelSkillTreeNodes: ExcelSkillNode[] = [
  // ──────────────── NODE 1: Cell References & Navigation ────────────────
  {
    id: "cell-references",
    title: "Cell References & Navigation",
    description:
      "The foundation of every spreadsheet. Learn A1 notation, absolute vs relative references, and working with ranges.",
    prerequisites: [],
    trunk: true,
    column: 0,
    row: 0,
    conceptualQuestions: [
      {
        id: "cell-refs-concept-1",
        type: "multiple-choice",
        question: "What does the cell reference $A$1 mean?",
        options: [
          "Relative reference to column A, row 1",
          "Absolute reference — column and row stay fixed when copied",
          "A reference to a named range called A1",
          "A reference to the first cell in every sheet",
        ],
        correctAnswer: "Absolute reference — column and row stay fixed when copied",
        explanation:
          "The $ signs lock both the column (A) and row (1). When you copy the formula to another cell, $A$1 always points to the same cell.",
      },
      {
        id: "cell-refs-concept-2",
        type: "multiple-choice",
        question: "If you copy the formula =A1+B1 from row 1 to row 3, what does the formula become?",
        options: ["=A1+B1", "=A3+B3", "=$A$1+$B$1", "=A1+B3"],
        correctAnswer: "=A3+B3",
        explanation:
          "Without $ signs, both references are relative. They shift down by the same number of rows you copied (2 rows), so A1→A3 and B1→B3.",
      },
      {
        id: "cell-refs-concept-3",
        type: "fill-blank",
        question: "To lock only the row in a cell reference (so the column can change when copied), you write A___1. What goes in the blank?",
        correctAnswer: "$",
        explanation: "A$1 is a mixed reference — the column (A) is relative and will shift, but the row (1) is locked with $.",
      },
    ],
    exercises: [
      {
        id: "cell-refs-ex1",
        type: "write-formula",
        title: "Simple cell reference",
        instruction: "In cell C1, write a formula that adds the values in A1 and B1.",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 10 },
            B1: { v: 25 },
            A2: { v: 5 },
            B2: { v: 15 },
          },
        },
        targetCells: [{ cell: "C1", expected: 35, expectedFormula: "=A1+B1" }],
        hints: ["Start with = to begin a formula", "Use + to add two cell references"],
      },
      {
        id: "cell-refs-ex2",
        type: "write-formula",
        title: "Using a range reference",
        instruction: "In cell A4, write a formula using SUM to add A1 through A3.",
        initialData: {
          cols: 2,
          rows: 4,
          cells: {
            A1: { v: 10 },
            A2: { v: 20 },
            A3: { v: 30 },
          },
        },
        targetCells: [{ cell: "A4", expected: 60, expectedFormula: "=SUM(A1:A3)" }],
        hints: ["Use = to start", "SUM takes a range like A1:A3"],
      },
      {
        id: "cell-refs-ex3",
        type: "fix-formula",
        title: "Fix the absolute reference",
        instruction:
          "Cell B1 has a formula that should always reference the tax rate in A1 (10%), but it uses a relative reference. Fix it to use an absolute reference.",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 0.1 },
            B1: { v: 0, f: "=100*A1" },
          },
        },
        targetCells: [{ cell: "B1", expected: 10, expectedFormula: "=100*$A$1" }],
        hints: [
          "Use $ before the column letter and row number to lock both",
          "The correct syntax is $A$1",
        ],
      },
    ],
  },

  // ──────────────── NODE 2: Basic Formulas ────────────────
  {
    id: "basic-formulas",
    title: "Basic Formulas",
    description:
      "Learn the most-used spreadsheet functions: SUM, AVERAGE, COUNT, MIN, and MAX. These are the building blocks of data analysis.",
    prerequisites: ["cell-references"],
    trunk: true,
    column: 0,
    row: 1,
    conceptualQuestions: [
      {
        id: "basic-formulas-concept-1",
        type: "multiple-choice",
        question: "What is the difference between COUNT and COUNTA?",
        options: [
          "COUNT counts all cells; COUNTA counts only numbers",
          "COUNT counts numbers only; COUNTA counts all non-empty cells",
          "They are the same function",
          "COUNTA counts cells with formulas only",
        ],
        correctAnswer: "COUNT counts numbers only; COUNTA counts all non-empty cells",
        explanation:
          "COUNT only counts cells containing numeric values. COUNTA counts any non-empty cell — numbers, text, errors, etc.",
      },
      {
        id: "basic-formulas-concept-2",
        type: "fill-blank",
        question: "The function _______(A1:A10) returns the smallest value in the range A1 to A10.",
        correctAnswer: "MIN",
        explanation: "MIN returns the smallest (minimum) value in a range. MAX returns the largest.",
      },
    ],
    exercises: [
      {
        id: "basic-formulas-ex1",
        type: "write-formula",
        title: "Sum a sales column",
        instruction: "In cell B6, write a SUM formula to total the sales in B1:B5.",
        initialData: {
          cols: 2,
          rows: 6,
          cells: {
            A1: { v: "Jan" }, A2: { v: "Feb" }, A3: { v: "Mar" }, A4: { v: "Apr" }, A5: { v: "May" },
            B1: { v: 120 }, B2: { v: 95 }, B3: { v: 140 }, B4: { v: 110 }, B5: { v: 135 },
          },
        },
        targetCells: [{ cell: "B6", expected: 600, expectedFormula: "=SUM(B1:B5)" }],
        hints: ["SUM adds up all values in a range", "Syntax: =SUM(start:end)"],
      },
      {
        id: "basic-formulas-ex2",
        type: "write-formula",
        title: "Calculate an average",
        instruction: "In cell B7, write an AVERAGE formula for the scores in B1:B5.",
        initialData: {
          cols: 2,
          rows: 7,
          cells: {
            A1: { v: "Test 1" }, A2: { v: "Test 2" }, A3: { v: "Test 3" }, A4: { v: "Test 4" }, A5: { v: "Test 5" },
            B1: { v: 85 }, B2: { v: 92 }, B3: { v: 78 }, B4: { v: 95 }, B5: { v: 88 },
          },
        },
        targetCells: [{ cell: "B7", expected: 87.6, expectedFormula: "=AVERAGE(B1:B5)" }],
        hints: ["AVERAGE calculates the mean of a range", "Syntax: =AVERAGE(start:end)"],
      },
      {
        id: "basic-formulas-ex3",
        type: "write-formula",
        title: "Find the maximum",
        instruction: "In cell B6, use MAX to find the highest temperature in B1:B5.",
        initialData: {
          cols: 2,
          rows: 6,
          cells: {
            A1: { v: "Mon" }, A2: { v: "Tue" }, A3: { v: "Wed" }, A4: { v: "Thu" }, A5: { v: "Fri" },
            B1: { v: 72 }, B2: { v: 68 }, B3: { v: 75 }, B4: { v: 80 }, B5: { v: 71 },
          },
        },
        targetCells: [{ cell: "B6", expected: 80, expectedFormula: "=MAX(B1:B5)" }],
        hints: ["MAX returns the largest value in a range"],
      },
      {
        id: "basic-formulas-ex4",
        type: "fix-formula",
        title: "Fix the COUNT formula",
        instruction: "The formula in B7 tries to count how many scores exist, but it includes the header. Fix it.",
        initialData: {
          cols: 2,
          rows: 7,
          cells: {
            A1: { v: "Student" }, B1: { v: "Score" },
            A2: { v: "Alice" }, B2: { v: 88 },
            A3: { v: "Bob" }, B3: { v: 92 },
            A4: { v: "Carol" }, B4: { v: 75 },
            B7: { v: 0, f: "=COUNT(B1:B4)" },
          },
        },
        targetCells: [{ cell: "B7", expected: 3, expectedFormula: "=COUNT(B2:B4)" }],
        hints: [
          "The header 'Score' in B1 is text — COUNT ignores it, but the range should start at B2 for clarity",
          "Change the range to start at B2",
        ],
      },
    ],
  },

  // ──────────────── NODE 3: Text Functions ────────────────
  {
    id: "text-functions",
    title: "Text Functions",
    description:
      "Clean and transform text data with LEFT, RIGHT, MID, CONCATENATE, TRIM, and LEN. Essential for messy real-world data.",
    prerequisites: ["basic-formulas"],
    trunk: true,
    column: 0,
    row: 2,
    conceptualQuestions: [
      {
        id: "text-concept-1",
        type: "multiple-choice",
        question: "What does TRIM do?",
        options: [
          "Removes all spaces from a string",
          "Removes leading and trailing spaces, and reduces internal spaces to one",
          "Converts text to uppercase",
          "Extracts a substring from the middle of text",
        ],
        correctAnswer: "Removes leading and trailing spaces, and reduces internal spaces to one",
        explanation:
          "TRIM cleans up extra whitespace — it removes spaces at the start and end, and collapses multiple internal spaces to a single space.",
      },
      {
        id: "text-concept-2",
        type: "fill-blank",
        question: "The function _______(\"Hello World\", 5) returns \"Hello\".",
        correctAnswer: "LEFT",
        explanation: "LEFT(text, num_chars) extracts the specified number of characters from the beginning of a string.",
      },
    ],
    exercises: [
      {
        id: "text-ex1",
        type: "write-formula",
        title: "Extract first name",
        instruction: "In B1, use LEFT and FIND to extract the first name from the full name in A1. (Hint: find the space position first.)",
        initialData: {
          cols: 2,
          rows: 3,
          cells: {
            A1: { v: "Alice Johnson" },
            A2: { v: "Bob Smith" },
            A3: { v: "Carol Williams" },
          },
        },
        targetCells: [{ cell: "B1", expected: "Alice" }],
        hints: [
          "FIND(\" \", A1) gives you the position of the space",
          "LEFT(A1, FIND(\" \", A1) - 1) extracts everything before the space",
        ],
      },
      {
        id: "text-ex2",
        type: "write-formula",
        title: "Concatenate with separator",
        instruction: "In C1, combine the first name in A1 and last name in B1 with a space between them using CONCATENATE or &.",
        initialData: {
          cols: 3,
          rows: 2,
          cells: {
            A1: { v: "Alice" },
            B1: { v: "Johnson" },
          },
        },
        targetCells: [{ cell: "C1", expected: "Alice Johnson" }],
        hints: [
          "You can use =A1&\" \"&B1",
          "Or =CONCATENATE(A1, \" \", B1)",
        ],
      },
      {
        id: "text-ex3",
        type: "write-formula",
        title: "Clean messy data",
        instruction: "Cell A1 has extra spaces. In B1, use TRIM to clean it up.",
        initialData: {
          cols: 2,
          rows: 2,
          cells: {
            A1: { v: "  Hello   World  " },
          },
        },
        targetCells: [{ cell: "B1", expected: "Hello World", expectedFormula: "=TRIM(A1)" }],
        hints: ["TRIM removes extra spaces from text"],
      },
    ],
  },

  // ──────────────── NODE 4: Logical Functions ────────────────
  {
    id: "logical-functions",
    title: "Logical Functions",
    description:
      "Make decisions in your spreadsheet with IF, AND, OR, nested IFs, and IFERROR. These let you build smart, conditional calculations.",
    prerequisites: ["basic-formulas"],
    trunk: false,
    column: 1,
    row: 2,
    conceptualQuestions: [
      {
        id: "logical-concept-1",
        type: "multiple-choice",
        question: "What does =IF(A1>10, \"High\", \"Low\") return when A1 is 5?",
        options: ["High", "Low", "5", "FALSE"],
        correctAnswer: "Low",
        explanation: "IF checks the condition (A1>10). Since 5 is not greater than 10, it returns the false_value: \"Low\".",
      },
      {
        id: "logical-concept-2",
        type: "multiple-choice",
        question: "When would you use IFERROR?",
        options: [
          "To check if a cell contains an error before it happens",
          "To replace an error result (like #DIV/0! or #N/A) with a friendlier value",
          "To throw a custom error message",
          "To prevent users from entering invalid data",
        ],
        correctAnswer: "To replace an error result (like #DIV/0! or #N/A) with a friendlier value",
        explanation:
          "IFERROR wraps a formula and returns an alternative value if the formula produces an error. For example, =IFERROR(A1/B1, 0) returns 0 instead of #DIV/0!",
      },
      {
        id: "logical-concept-3",
        type: "fill-blank",
        question: "=AND(TRUE, FALSE) returns _______.",
        correctAnswer: "FALSE",
        explanation: "AND returns TRUE only when ALL arguments are TRUE. Since one argument is FALSE, the result is FALSE.",
      },
    ],
    exercises: [
      {
        id: "logical-ex1",
        type: "write-formula",
        title: "Pass or fail",
        instruction: "In B1, write an IF formula: if the score in A1 is 60 or above, show \"Pass\", otherwise \"Fail\".",
        initialData: {
          cols: 2,
          rows: 3,
          cells: {
            A1: { v: 75 },
            A2: { v: 42 },
            A3: { v: 60 },
          },
        },
        targetCells: [{ cell: "B1", expected: "Pass" }],
        hints: [
          "Syntax: =IF(condition, value_if_true, value_if_false)",
          "The condition is A1>=60",
        ],
      },
      {
        id: "logical-ex2",
        type: "write-formula",
        title: "Safe division with IFERROR",
        instruction: "In C1, divide A1 by B1. Use IFERROR to return 0 if B1 is zero.",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 100 },
            B1: { v: 0 },
            A2: { v: 200 },
            B2: { v: 4 },
          },
        },
        targetCells: [{ cell: "C1", expected: 0 }],
        hints: [
          "Wrap the division in IFERROR",
          "=IFERROR(A1/B1, 0)",
        ],
      },
      {
        id: "logical-ex3",
        type: "write-formula",
        title: "Nested IF for grading",
        instruction: "In B1, write a nested IF: if score >=90 show \"A\", >=80 show \"B\", >=70 show \"C\", otherwise \"F\".",
        initialData: {
          cols: 2,
          rows: 4,
          cells: {
            A1: { v: 85 },
            A2: { v: 92 },
            A3: { v: 65 },
            A4: { v: 73 },
          },
        },
        targetCells: [{ cell: "B1", expected: "B" }],
        hints: [
          "Start with the highest threshold: =IF(A1>=90, ...)",
          "Each else branch is another IF: =IF(A1>=90,\"A\",IF(A1>=80,\"B\",IF(A1>=70,\"C\",\"F\")))",
        ],
      },
      {
        id: "logical-ex4",
        type: "write-formula",
        title: "AND + IF combo",
        instruction: "In C1, write a formula: if score in A1 is >=70 AND attendance in B1 is >=80, show \"Eligible\", otherwise \"Not Eligible\".",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 75 },
            B1: { v: 85 },
            A2: { v: 80 },
            B2: { v: 60 },
          },
        },
        targetCells: [{ cell: "C1", expected: "Eligible" }],
        hints: [
          "Combine IF with AND: =IF(AND(condition1, condition2), true_val, false_val)",
          "=IF(AND(A1>=70, B1>=80), \"Eligible\", \"Not Eligible\")",
        ],
      },
    ],
  },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd queryveda && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add queryveda/lib/excel-skill-tree-data.ts
git commit -m "feat: add Excel skill tree data — 4 basic nodes with exercises"
```

---

## Task 8: Install FortuneSheet

**Files:**
- Modify: `queryveda/package.json`

- [ ] **Step 1: Install FortuneSheet**

Run:
```bash
cd queryveda && npm install @fortune-sheet/react @fortune-sheet/core
```
Expected: Packages install successfully

- [ ] **Step 2: Verify build still works**

Run: `cd queryveda && npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add queryveda/package.json queryveda/package-lock.json
git commit -m "chore: install FortuneSheet spreadsheet library"
```

---

## Task 9: ConceptualQuestion Component

**Files:**
- Create: `queryveda/components/learn/conceptual-question.tsx`

- [ ] **Step 1: Create the component**

Create `queryveda/components/learn/conceptual-question.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { ConceptualQuestion as ConceptualQuestionType } from "@/lib/excel-skill-tree-types";

interface ConceptualQuestionProps {
  question: ConceptualQuestionType;
  onCorrect: () => void;
  alreadyCompleted?: boolean;
}

export function ConceptualQuestion({ question, onCorrect, alreadyCompleted }: ConceptualQuestionProps) {
  const [selected, setSelected] = useState<string>("");
  const [submitted, setSubmitted] = useState(alreadyCompleted ?? false);
  const [correct, setCorrect] = useState(alreadyCompleted ?? false);

  const handleSubmit = () => {
    const trimmed = selected.trim();
    if (!trimmed) return;
    const isCorrect = trimmed.toLowerCase() === question.correctAnswer.toLowerCase();
    setCorrect(isCorrect);
    setSubmitted(true);
    if (isCorrect) onCorrect();
  };

  if (question.type === "multiple-choice") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <p className="font-medium">{question.question}</p>
        <div className="space-y-2">
          {question.options!.map((opt) => {
            const isSelected = selected === opt;
            const showResult = submitted;
            const isCorrectOption = opt === question.correctAnswer;

            let borderClass = "border-border hover:border-primary/40";
            if (showResult && isCorrectOption) borderClass = "border-emerald-500 bg-emerald-500/5";
            else if (showResult && isSelected && !isCorrectOption) borderClass = "border-red-500 bg-red-500/5";
            else if (isSelected) borderClass = "border-primary bg-primary/5";

            return (
              <button
                key={opt}
                disabled={submitted}
                onClick={() => setSelected(opt)}
                className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${borderClass}`}
              >
                <div className="flex items-center gap-2">
                  {showResult && isCorrectOption && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {showResult && isSelected && !isCorrectOption && <X className="w-4 h-4 text-red-500 shrink-0" />}
                  <span>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        {!submitted && (
          <Button onClick={handleSubmit} disabled={!selected} size="sm">
            Check Answer
          </Button>
        )}
        {submitted && (
          <div className={`rounded-lg p-3 text-sm ${correct ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}>
            {correct ? "Correct! " : "Not quite. "}
            {question.explanation}
          </div>
        )}
      </div>
    );
  }

  // fill-blank type
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <p className="font-medium">{question.question}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={submitted}
          placeholder="Type your answer..."
          className="rounded-lg border bg-background px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/50"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {!submitted && (
          <Button onClick={handleSubmit} disabled={!selected.trim()} size="sm">
            Check
          </Button>
        )}
      </div>
      {submitted && (
        <div className={`rounded-lg p-3 text-sm ${correct ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}>
          {correct ? "Correct! " : `The answer is "${question.correctAnswer}". `}
          {question.explanation}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd queryveda && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add queryveda/components/learn/conceptual-question.tsx
git commit -m "feat: add ConceptualQuestion component for Excel warmups"
```

---

## Task 10: ExcelExerciseEditor Component

**Files:**
- Create: `queryveda/components/learn/excel-exercise-editor.tsx`

- [ ] **Step 1: Create the FortuneSheet wrapper component**

Create `queryveda/components/learn/excel-exercise-editor.tsx`:

```typescript
"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Lightbulb } from "lucide-react";
import { ExerciseVerdict } from "./exercise-verdict";
import type { ExcelExercise } from "@/lib/excel-skill-tree-types";

const Workbook = dynamic(
  () => import("@fortune-sheet/react").then((mod) => mod.Workbook),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" /> }
);

interface ExcelExerciseEditorProps {
  exercise: ExcelExercise;
  onPass: () => void;
}

function buildSheetData(exercise: ExcelExercise) {
  const celldata: { r: number; c: number; v: { v?: string | number; f?: string; m?: string } }[] = [];

  for (const [addr, cell] of Object.entries(exercise.initialData.cells)) {
    const col = addr.charCodeAt(0) - 65; // A=0, B=1, etc.
    const row = parseInt(addr.slice(1), 10) - 1; // 1-based to 0-based
    celldata.push({
      r: row,
      c: col,
      v: {
        v: cell.v,
        m: String(cell.v),
        ...(cell.f ? { f: cell.f } : {}),
      },
    });
  }

  return [
    {
      name: "Sheet1",
      celldata,
      row: exercise.initialData.rows,
      column: exercise.initialData.cols,
      config: {},
    },
  ];
}

function parseAddress(addr: string): { r: number; c: number } {
  const col = addr.charCodeAt(0) - 65;
  const row = parseInt(addr.slice(1), 10) - 1;
  return { r: row, c: col };
}

export function ExcelExerciseEditor({ exercise, onPass }: ExcelExerciseEditorProps) {
  const [verdict, setVerdict] = useState<{ type: "idle" | "pass" | "fail"; message: string }>({
    type: "idle",
    message: "",
  });
  const [running, setRunning] = useState(false);
  const [hintIdx, setHintIdx] = useState(-1);
  const workbookRef = useRef<{ getSheet: () => unknown } | null>(null);
  const [key, setKey] = useState(0); // for reset

  const sheetData = useMemo(() => buildSheetData(exercise), [exercise]);

  const handleRun = useCallback(() => {
    setRunning(true);
    setVerdict({ type: "idle", message: "" });

    try {
      // Access FortuneSheet's internal data to read cell values
      // FortuneSheet stores data in luckysheet global or via API
      const allSheets = (window as Record<string, unknown>).luckysheet?.getluckysheetfile?.() ??
                        (window as Record<string, unknown>).luckysheetfile;

      if (!allSheets) {
        setVerdict({ type: "fail", message: "Could not read spreadsheet data. Try again." });
        setRunning(false);
        return;
      }

      const sheet = Array.isArray(allSheets) ? allSheets[0] : Object.values(allSheets)[0];
      const data = (sheet as Record<string, unknown>)?.data as (Record<string, unknown> | null)[][] | undefined;

      if (!data) {
        setVerdict({ type: "fail", message: "Spreadsheet data not available. Try again." });
        setRunning(false);
        return;
      }

      let allCorrect = true;
      const failures: string[] = [];

      for (const target of exercise.targetCells) {
        const { r, c } = parseAddress(target.cell);
        const cellObj = data[r]?.[c];
        const cellValue = cellObj ? (cellObj as Record<string, unknown>).v : undefined;

        // Compare values (handle numeric precision)
        let matches = false;
        if (typeof target.expected === "number" && typeof cellValue === "number") {
          matches = Math.abs(cellValue - target.expected) < 0.01;
        } else {
          matches = String(cellValue).trim().toLowerCase() === String(target.expected).trim().toLowerCase();
        }

        if (!matches) {
          allCorrect = false;
          failures.push(
            `Cell ${target.cell}: expected "${target.expected}", got "${cellValue ?? "(empty)}"`
          );
        }
      }

      if (allCorrect) {
        setVerdict({ type: "pass", message: "Correct!" });
        onPass();
      } else {
        setVerdict({ type: "fail", message: failures.join(". ") });
      }
    } catch (err) {
      setVerdict({ type: "fail", message: "Error reading spreadsheet. Please try again." });
    }

    setRunning(false);
  }, [exercise, onPass]);

  const handleReset = () => {
    setKey((k) => k + 1);
    setVerdict({ type: "idle", message: "" });
    setHintIdx(-1);
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <h4 className="font-semibold">{exercise.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{exercise.instruction}</p>
      </div>

      {/* Spreadsheet */}
      <div className="h-72 border-b">
        <Workbook
          key={key}
          data={sheetData}
          onChange={() => {}}
          showToolbar={false}
          showFormulaBar={true}
          showSheetTabs={false}
          row={exercise.initialData.rows}
          column={exercise.initialData.cols}
        />
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center gap-2 flex-wrap">
        <Button onClick={handleRun} disabled={running} size="sm" className="gap-1.5">
          <Play className="w-3.5 h-3.5" />
          Check Answer
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
        {exercise.hints.length > 0 && hintIdx < exercise.hints.length - 1 && (
          <Button
            onClick={() => setHintIdx((i) => i + 1)}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Hint
          </Button>
        )}
      </div>

      {/* Hints */}
      {hintIdx >= 0 && (
        <div className="px-4 pb-3">
          {exercise.hints.slice(0, hintIdx + 1).map((hint, i) => (
            <p key={i} className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              💡 {hint}
            </p>
          ))}
        </div>
      )}

      {/* Verdict */}
      {verdict.type !== "idle" && (
        <div className="px-4 pb-4">
          <ExerciseVerdict type={verdict.type} message={verdict.message} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd queryveda && npx tsc --noEmit`
Expected: No errors (may need to add FortuneSheet type declarations if types aren't included — see step 3)

- [ ] **Step 3: Add FortuneSheet type shim if needed**

If TypeScript errors on the FortuneSheet import, create `queryveda/types/fortune-sheet.d.ts`:

```typescript
declare module "@fortune-sheet/react" {
  import { ComponentType } from "react";
  export const Workbook: ComponentType<{
    data: unknown[];
    onChange?: (data: unknown) => void;
    showToolbar?: boolean;
    showFormulaBar?: boolean;
    showSheetTabs?: boolean;
    row?: number;
    column?: number;
    [key: string]: unknown;
  }>;
}

declare module "@fortune-sheet/core" {
  export const api: Record<string, unknown>;
}
```

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/learn/excel-exercise-editor.tsx queryveda/types/
git commit -m "feat: add ExcelExerciseEditor wrapping FortuneSheet"
```

---

## Task 11: Excel Skill Tree Storage & Hook

**Files:**
- Create: `queryveda/lib/excel-skill-tree-storage.ts`
- Create: `queryveda/hooks/use-excel-skill-tree.ts`

- [ ] **Step 1: Create Excel skill tree storage**

Create `queryveda/lib/excel-skill-tree-storage.ts`. Follow the same pattern as `queryveda/lib/skill-tree-storage.ts` but with the Excel data.

```typescript
import { supabase } from "./supabase";
import { excelSkillTreeNodes } from "./excel-skill-tree-data";
import type { ExcelNodeMastery } from "./excel-skill-tree-types";

const PROGRESS_KEY = "queryveda-excel-progress";
const CONCEPTUAL_KEY = "queryveda-excel-conceptual";

interface ProgressMap {
  [exerciseId: string]: { completed: boolean; completedAt?: string };
}

function getProgressMap(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getConceptualMap(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CONCEPTUAL_KEY) || "{}");
  } catch {
    return {};
  }
}

export const excelSkillTreeStorage = {
  markExerciseCompleted(exerciseId: string, userId?: string) {
    const map = getProgressMap();
    map[exerciseId] = { completed: true, completedAt: new Date().toISOString() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));

    if (userId) {
      const node = excelSkillTreeNodes.find((n) =>
        n.exercises.some((e) => e.id === exerciseId)
      );
      if (node) {
        supabase.from("skill_tree_progress").upsert(
          {
            user_id: userId,
            node_id: node.id,
            exercise_id: exerciseId,
            completed: true,
            completed_at: new Date().toISOString(),
            track: "excel",
          },
          { onConflict: "user_id,node_id,exercise_id" }
        );
      }
    }
  },

  markConceptualCompleted(questionId: string, userId?: string) {
    const map = getConceptualMap();
    map[questionId] = { completed: true, completedAt: new Date().toISOString() };
    localStorage.setItem(CONCEPTUAL_KEY, JSON.stringify(map));

    if (userId) {
      const node = excelSkillTreeNodes.find((n) =>
        n.conceptualQuestions.some((q) => q.id === questionId)
      );
      if (node) {
        supabase.from("skill_tree_progress").upsert(
          {
            user_id: userId,
            node_id: node.id,
            exercise_id: questionId,
            completed: true,
            completed_at: new Date().toISOString(),
            track: "excel",
          },
          { onConflict: "user_id,node_id,exercise_id" }
        );
      }
    }
  },

  isExerciseCompleted(exerciseId: string): boolean {
    return getProgressMap()[exerciseId]?.completed ?? false;
  },

  isConceptualCompleted(questionId: string): boolean {
    return getConceptualMap()[questionId]?.completed ?? false;
  },

  getAllNodeMasteries(): ExcelNodeMastery[] {
    const progress = getProgressMap();
    const conceptual = getConceptualMap();

    return excelSkillTreeNodes.map((node) => {
      const conceptualCompleted = node.conceptualQuestions.filter(
        (q) => conceptual[q.id]?.completed
      ).length;
      const conceptualTotal = node.conceptualQuestions.length;
      const exercisesCompleted = node.exercises.filter(
        (e) => progress[e.id]?.completed
      ).length;
      const exercisesTotal = node.exercises.length;
      const total = conceptualTotal + exercisesTotal;
      const completed = conceptualCompleted + exercisesCompleted;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const conceptualDone = conceptualCompleted >= conceptualTotal;

      // Check prerequisites (60%+ mastery)
      const unlocked =
        node.prerequisites.length === 0 ||
        node.prerequisites.every((preId) => {
          const preNode = excelSkillTreeNodes.find((n) => n.id === preId);
          if (!preNode) return false;
          const preTotal = preNode.conceptualQuestions.length + preNode.exercises.length;
          const preCompleted =
            preNode.conceptualQuestions.filter((q) => conceptual[q.id]?.completed).length +
            preNode.exercises.filter((e) => progress[e.id]?.completed).length;
          return preTotal > 0 && (preCompleted / preTotal) * 100 >= 60;
        });

      return {
        nodeId: node.id,
        conceptualCompleted,
        conceptualTotal,
        exercisesCompleted,
        exercisesTotal,
        percentage,
        unlocked,
        starred: percentage === 100,
        conceptualDone,
      };
    });
  },

  async syncSkillTreeFromCloud(userId: string) {
    const { data } = await supabase
      .from("skill_tree_progress")
      .select("node_id, exercise_id, completed, completed_at")
      .eq("user_id", userId)
      .eq("track", "excel");

    if (!data) return;

    const progress = getProgressMap();
    const conceptual = getConceptualMap();

    for (const row of data) {
      if (!row.completed) continue;
      // Determine if this is a conceptual question or exercise
      const isConceptual = excelSkillTreeNodes.some((n) =>
        n.conceptualQuestions.some((q) => q.id === row.exercise_id)
      );
      const map = isConceptual ? conceptual : progress;
      if (!map[row.exercise_id]?.completed) {
        map[row.exercise_id] = {
          completed: true,
          completedAt: row.completed_at ?? undefined,
        };
      }
    }

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    localStorage.setItem(CONCEPTUAL_KEY, JSON.stringify(conceptual));
  },

  async syncSkillTreeToCloud(userId: string) {
    const progress = getProgressMap();
    const conceptual = getConceptualMap();
    const allMaps = { ...progress, ...conceptual };
    const upserts: {
      user_id: string;
      node_id: string;
      exercise_id: string;
      completed: boolean;
      completed_at: string | null;
      track: string;
    }[] = [];

    for (const [exId, val] of Object.entries(allMaps)) {
      if (!val.completed) continue;
      const node = excelSkillTreeNodes.find(
        (n) =>
          n.exercises.some((e) => e.id === exId) ||
          n.conceptualQuestions.some((q) => q.id === exId)
      );
      if (!node) continue;
      upserts.push({
        user_id: userId,
        node_id: node.id,
        exercise_id: exId,
        completed: true,
        completed_at: val.completedAt ?? null,
        track: "excel",
      });
    }

    if (upserts.length > 0) {
      await supabase
        .from("skill_tree_progress")
        .upsert(upserts, { onConflict: "user_id,node_id,exercise_id" });
    }
  },
};
```

- [ ] **Step 2: Create use-excel-skill-tree hook**

Create `queryveda/hooks/use-excel-skill-tree.ts`:

```typescript
"use client";

import { useCallback, useState, useEffect } from "react";
import { excelSkillTreeStorage } from "@/lib/excel-skill-tree-storage";
import { useAuth } from "./use-auth";
import type { ExcelNodeMastery } from "@/lib/excel-skill-tree-types";

export function useExcelSkillTree() {
  const { user } = useAuth();
  const [masteries, setMasteries] = useState<ExcelNodeMastery[]>(
    () => (user ? excelSkillTreeStorage.getAllNodeMasteries() : [])
  );

  const refresh = useCallback(() => {
    setMasteries(user ? excelSkillTreeStorage.getAllNodeMasteries() : []);
  }, [user]);

  useEffect(() => {
    if (user) {
      excelSkillTreeStorage
        .syncSkillTreeFromCloud(user.id)
        .then(() => excelSkillTreeStorage.syncSkillTreeToCloud(user.id))
        .then(refresh);
    } else {
      setMasteries([]);
    }
  }, [user, refresh]);

  const markExerciseCompleted = useCallback(
    (exerciseId: string) => {
      excelSkillTreeStorage.markExerciseCompleted(exerciseId, user?.id);
      refresh();
    },
    [user, refresh]
  );

  const markConceptualCompleted = useCallback(
    (questionId: string) => {
      excelSkillTreeStorage.markConceptualCompleted(questionId, user?.id);
      refresh();
    },
    [user, refresh]
  );

  const isExerciseCompleted = useCallback(
    (exerciseId: string) => excelSkillTreeStorage.isExerciseCompleted(exerciseId),
    []
  );

  const isConceptualCompleted = useCallback(
    (questionId: string) => excelSkillTreeStorage.isConceptualCompleted(questionId),
    []
  );

  const getNodeMastery = useCallback(
    (nodeId: string) =>
      masteries.find((m) => m.nodeId === nodeId) ?? {
        nodeId,
        conceptualCompleted: 0,
        conceptualTotal: 0,
        exercisesCompleted: 0,
        exercisesTotal: 0,
        percentage: 0,
        unlocked: false,
        starred: false,
        conceptualDone: false,
      },
    [masteries]
  );

  return {
    masteries,
    markExerciseCompleted,
    markConceptualCompleted,
    isExerciseCompleted,
    isConceptualCompleted,
    getNodeMastery,
    refresh,
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd queryveda && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add queryveda/lib/excel-skill-tree-storage.ts queryveda/hooks/use-excel-skill-tree.ts
git commit -m "feat: add Excel skill tree storage and hook"
```

---

## Task 12: Excel Skill Tree Page & Node Page

**Files:**
- Create: `queryveda/app/excel/page.tsx`
- Create: `queryveda/app/excel/excel-learn-client.tsx`
- Create: `queryveda/app/excel/learn/[nodeId]/page.tsx`
- Create: `queryveda/app/excel/learn/[nodeId]/excel-node-client.tsx`
- Create: `queryveda/components/learn/excel-exercise-list.tsx`

- [ ] **Step 1: Create Excel exercise list component**

Create `queryveda/components/learn/excel-exercise-list.tsx`:

```typescript
"use client";

import { useState } from "react";
import { ConceptualQuestion } from "./conceptual-question";
import { ExcelExerciseEditor } from "./excel-exercise-editor";
import { MasteryBar } from "./mastery-bar";
import { Lock } from "lucide-react";
import type { ExcelSkillNode, ExcelNodeMastery } from "@/lib/excel-skill-tree-types";

interface ExcelExerciseListProps {
  node: ExcelSkillNode;
  mastery: ExcelNodeMastery;
  onConceptualComplete: (questionId: string) => void;
  onExerciseComplete: (exerciseId: string) => void;
  isConceptualCompleted: (questionId: string) => boolean;
  isExerciseCompleted: (exerciseId: string) => boolean;
}

export function ExcelExerciseList({
  node,
  mastery,
  onConceptualComplete,
  onExerciseComplete,
  isConceptualCompleted,
  isExerciseCompleted,
}: ExcelExerciseListProps) {
  const [conceptualDone, setConceptualDone] = useState(mastery.conceptualDone);

  const handleConceptualCorrect = (questionId: string) => {
    onConceptualComplete(questionId);
    // Check if all conceptual questions are now done
    const allDone = node.conceptualQuestions.every(
      (q) => q.id === questionId || isConceptualCompleted(q.id)
    );
    if (allDone) setConceptualDone(true);
  };

  return (
    <div className="space-y-8">
      {/* Mastery progress */}
      <MasteryBar completed={mastery.conceptualCompleted + mastery.exercisesCompleted} total={mastery.conceptualTotal + mastery.exercisesTotal} />

      {/* Conceptual warmups */}
      {node.conceptualQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Warm-up Questions</h3>
          <p className="text-sm text-muted-foreground">
            Answer these concept questions to unlock hands-on exercises.
          </p>
          {node.conceptualQuestions.map((q) => (
            <ConceptualQuestion
              key={q.id}
              question={q}
              onCorrect={() => handleConceptualCorrect(q.id)}
              alreadyCompleted={isConceptualCompleted(q.id)}
            />
          ))}
        </div>
      )}

      {/* Hands-on exercises */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Hands-on Exercises</h3>
        {!conceptualDone ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Complete all warm-up questions to unlock exercises.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {node.exercises.map((ex) => (
              <ExcelExerciseEditor
                key={ex.id}
                exercise={ex}
                onPass={() => onExerciseComplete(ex.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Excel node client**

Create `queryveda/app/excel/learn/[nodeId]/excel-node-client.tsx`:

```typescript
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { useExcelSkillTree } from "@/hooks/use-excel-skill-tree";
import { ExcelExerciseList } from "@/components/learn/excel-exercise-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";

export function ExcelNodeClient({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const {
    markExerciseCompleted,
    markConceptualCompleted,
    isExerciseCompleted,
    isConceptualCompleted,
    getNodeMastery,
  } = useExcelSkillTree();

  const node = useMemo(
    () => excelSkillTreeNodes.find((n) => n.id === nodeId),
    [nodeId]
  );

  const mastery = getNodeMastery(nodeId);

  if (!node) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Node not found</h1>
        <Button className="mt-4" onClick={() => router.push("/excel")}>
          Back to Excel Skill Tree
        </Button>
      </div>
    );
  }

  if (!mastery.unlocked) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">{node.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Complete prerequisite nodes with at least 60% mastery to unlock.
        </p>
        <Button className="mt-4" onClick={() => router.push("/excel")}>
          Back to Excel Skill Tree
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1.5"
        onClick={() => router.push("/excel")}
      >
        <ArrowLeft className="w-4 h-4" />
        Skill Tree
      </Button>

      <h1 className="text-2xl font-bold">{node.title}</h1>
      <p className="mt-2 text-muted-foreground">{node.description}</p>

      <div className="mt-8">
        <ExcelExerciseList
          node={node}
          mastery={mastery}
          onConceptualComplete={markConceptualCompleted}
          onExerciseComplete={markExerciseCompleted}
          isConceptualCompleted={isConceptualCompleted}
          isExerciseCompleted={isExerciseCompleted}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Excel node page**

Create `queryveda/app/excel/learn/[nodeId]/page.tsx`:

```typescript
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { ExcelNodeClient } from "./excel-node-client";

export function generateStaticParams() {
  return excelSkillTreeNodes.map((n) => ({ nodeId: n.id }));
}

export default async function ExcelNodePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  return <ExcelNodeClient nodeId={nodeId} />;
}
```

- [ ] **Step 4: Create Excel skill tree client**

Create `queryveda/app/excel/excel-learn-client.tsx`:

```typescript
"use client";

import { useExcelSkillTree } from "@/hooks/use-excel-skill-tree";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { SkillNodeCard } from "@/components/learn/skill-node-card";

export function ExcelLearnClient() {
  const { getNodeMastery } = useExcelSkillTree();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Excel Skill Tree</h1>
        <p className="mt-2 text-muted-foreground">
          Master Excel formulas from the ground up — cell references to advanced analytics.
        </p>
      </div>

      <div className="relative">
        {/* Trunk line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden sm:block" />

        <div className="space-y-6">
          {excelSkillTreeNodes.map((node) => {
            const mastery = getNodeMastery(node.id);
            return (
              <div
                key={node.id}
                className={`relative ${
                  node.column === 0
                    ? "sm:mx-auto sm:max-w-sm"
                    : node.column < 0
                    ? "sm:mr-auto sm:ml-8 sm:max-w-sm"
                    : "sm:ml-auto sm:mr-8 sm:max-w-sm"
                }`}
              >
                <SkillNodeCard
                  node={{
                    id: node.id,
                    title: node.title,
                    description: node.description,
                    exercises: [
                      ...node.conceptualQuestions.map((q) => ({ id: q.id })),
                      ...node.exercises.map((e) => ({ id: e.id })),
                    ] as never[],
                    prerequisites: node.prerequisites,
                    relatedProblemIds: [],
                    trunk: node.trunk,
                    column: node.column,
                    row: node.row,
                  }}
                  mastery={{
                    nodeId: mastery.nodeId,
                    completed: mastery.conceptualCompleted + mastery.exercisesCompleted,
                    total: mastery.conceptualTotal + mastery.exercisesTotal,
                    percentage: mastery.percentage,
                    unlocked: mastery.unlocked,
                    starred: mastery.starred,
                  }}
                  href={`/excel/learn/${node.id}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Excel skill tree page**

Create `queryveda/app/excel/page.tsx`:

```typescript
import { ExcelLearnClient } from "./excel-learn-client";

export default function ExcelPage() {
  return <ExcelLearnClient />;
}
```

- [ ] **Step 6: Verify build**

Run: `cd queryveda && npx next build`
Expected: Build succeeds. Check for any type mismatches between SkillNodeCard props and what we're passing — may need to adjust the adapter in `excel-learn-client.tsx`.

- [ ] **Step 7: Commit**

```bash
git add queryveda/app/excel/ queryveda/components/learn/excel-exercise-list.tsx
git commit -m "feat: add Excel skill tree page and node exercise pages"
```

---

## Task 13: Navbar Track Switcher & Navigation

**Files:**
- Create: `queryveda/components/layout/track-switcher.tsx`
- Modify: `queryveda/components/layout/Navbar.tsx`

- [ ] **Step 1: Create track switcher component**

Create `queryveda/components/layout/track-switcher.tsx`:

```typescript
"use client";

import { useTrack } from "@/hooks/use-track";
import { TRACK_LABELS } from "@/lib/track-types";
import type { Track } from "@/lib/track-types";

export function TrackSwitcher() {
  const { tracks, hasTrack } = useTrack();

  // Only show if user has both tracks
  if (tracks.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 text-sm">
      {tracks.map((track) => (
        <a
          key={track}
          href={track === "sql" ? "/learn" : `/${track}`}
          className="rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-background hover:text-foreground text-muted-foreground"
        >
          {TRACK_LABELS[track]}
        </a>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Update Navbar to include track-aware links and switcher**

Modify `queryveda/components/layout/Navbar.tsx`:

Add import at the top:
```typescript
import { TrackSwitcher } from "./track-switcher";
```

Replace the `navLinks` constant with a function that adapts based on tracks. Add the `TrackSwitcher` component after the desktop nav links in the left section.

The `navLinks` array should be updated to:
```typescript
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn SQL" },
  { href: "/excel", label: "Learn Excel" },
  { href: "/daily", label: "Daily" },
  { href: "/problems", label: "Problems" },
  { href: "/progress", label: "Progress" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
];
```

**Note:** The nav links should be filtered based on user's selected tracks (hide "Learn Excel" if user only selected SQL, etc.). This requires making Navbar track-aware. Since Navbar is already a client component, add `useTrack`:

After the existing hook calls inside the `Navbar` function, add:
```typescript
import { useTrack } from "@/hooks/use-track";
// ...inside Navbar:
const { hasTrack } = useTrack();
```

Then filter navLinks in the render:
```typescript
const filteredLinks = navLinks.filter(({ href }) => {
  if (href === "/excel") return hasTrack("excel");
  if (href === "/learn") return hasTrack("sql");
  return true;
});
```

Use `filteredLinks` instead of `navLinks` in the mapping.

- [ ] **Step 3: Verify build**

Run: `cd queryveda && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/layout/track-switcher.tsx queryveda/components/layout/Navbar.tsx
git commit -m "feat: add track-aware navigation and track switcher"
```

---

## Task 14: Home Page & TwoPathCards Track Adaptation

**Files:**
- Modify: `queryveda/components/home/two-path-cards.tsx`
- Modify: `queryveda/app/page.tsx`

- [ ] **Step 1: Update TwoPathCards to show Excel card**

Modify `queryveda/components/home/two-path-cards.tsx`:

Add `useTrack` import and hook call. Add an Excel learning card alongside the SQL one. The component should:
- Show "Learn SQL" card if `hasTrack("sql")`
- Show "Learn Excel" card if `hasTrack("excel")`  
- Show "Practice Problems" card always (for SQL users) or conditionally

Add the Excel card after the Learn SQL card:

```typescript
{hasTrack("excel") && (
  <Link href="/excel" className="group">
    <div className="rounded-2xl p-[1px] transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10"
      style={{ background: "var(--qv-gradient-card)" }}
    >
      <div className="rounded-2xl bg-card p-6 h-full flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Table2 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Learn Excel</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Interactive spreadsheet exercises from basic formulas to advanced analytics.
        </p>
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-medium border border-emerald-500/15">
            Basic
          </span>
          <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-medium border border-amber-500/15">
            Intermediate
          </span>
          <span className="rounded-full bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 text-xs font-medium border border-red-500/15">
            Advanced
          </span>
        </div>
        <Button className="w-full mt-auto">Start Learning</Button>
      </div>
    </div>
  </Link>
)}
```

Add `Table2` to the lucide-react imports. Add `useTrack` import and `const { hasTrack } = useTrack();` inside the component.

- [ ] **Step 2: Update home page hero text to be track-aware**

Modify `queryveda/app/page.tsx`:

The hero currently says "Go from SQL Zero to Interview Ready". For users with both tracks, update the tagline. This can be done by making the hero text component-ized. For now, a simple approach: update the subtitle to mention both tracks:

Change the subtitle `<p>` tag to:
```typescript
<p className="relative mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
  Structured lessons + practice problems. No installations.
</p>
```

(Remove the SQL-specific "75 practice problems" count since Excel is now also a track.)

- [ ] **Step 3: Verify build**

Run: `cd queryveda && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/home/two-path-cards.tsx queryveda/app/page.tsx
git commit -m "feat: adapt home page and path cards for multi-track"
```

---

## Task 15: Excel Skill Tree Data — Remaining 8 Nodes (Intermediate + Advanced)

**Files:**
- Modify: `queryveda/lib/excel-skill-tree-data.ts`

- [ ] **Step 1: Add intermediate nodes 5-8**

Append to the `excelSkillTreeNodes` array in `queryveda/lib/excel-skill-tree-data.ts`, after the closing `}` of the `logical-functions` node:

```typescript
  // ──────────────── NODE 5: Lookup Functions ────────────────
  {
    id: "lookup-functions",
    title: "Lookup Functions",
    description:
      "Find and retrieve data from other parts of your spreadsheet with VLOOKUP, HLOOKUP, INDEX/MATCH, and XLOOKUP.",
    prerequisites: ["logical-functions"],
    trunk: true,
    column: 0,
    row: 3,
    conceptualQuestions: [
      {
        id: "lookup-concept-1",
        type: "multiple-choice",
        question: "Why is INDEX/MATCH often preferred over VLOOKUP?",
        options: [
          "INDEX/MATCH is faster to type",
          "VLOOKUP can only look right — INDEX/MATCH can look in any direction",
          "VLOOKUP doesn't work with numbers",
          "INDEX/MATCH automatically sorts the data",
        ],
        correctAnswer: "VLOOKUP can only look right — INDEX/MATCH can look in any direction",
        explanation:
          "VLOOKUP searches the leftmost column and returns a value to the right. INDEX/MATCH has no such limitation — the lookup column and return column can be anywhere.",
      },
      {
        id: "lookup-concept-2",
        type: "fill-blank",
        question: "The last argument of VLOOKUP is range_lookup. To find an exact match, set it to _______.",
        correctAnswer: "FALSE",
        explanation: "FALSE (or 0) forces an exact match. TRUE (or 1, or omitted) allows approximate match, which requires sorted data.",
      },
    ],
    exercises: [
      {
        id: "lookup-ex1",
        type: "write-formula",
        title: "Basic VLOOKUP",
        instruction: "In E2, use VLOOKUP to find the price of the product named in D2 from the table A1:B5.",
        initialData: {
          cols: 5,
          rows: 5,
          cells: {
            A1: { v: "Product" }, B1: { v: "Price" },
            A2: { v: "Laptop" }, B2: { v: 999 },
            A3: { v: "Mouse" }, B3: { v: 25 },
            A4: { v: "Keyboard" }, B4: { v: 75 },
            A5: { v: "Monitor" }, B5: { v: 300 },
            D1: { v: "Lookup" }, E1: { v: "Result" },
            D2: { v: "Mouse" },
          },
        },
        targetCells: [{ cell: "E2", expected: 25 }],
        hints: [
          "Syntax: =VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])",
          "=VLOOKUP(D2, A1:B5, 2, FALSE)",
        ],
      },
      {
        id: "lookup-ex2",
        type: "write-formula",
        title: "INDEX/MATCH lookup",
        instruction: "In E2, use INDEX and MATCH to find the department for employee ID in D2.",
        initialData: {
          cols: 5,
          rows: 5,
          cells: {
            A1: { v: "ID" }, B1: { v: "Name" }, C1: { v: "Dept" },
            A2: { v: 101 }, B2: { v: "Alice" }, C2: { v: "Engineering" },
            A3: { v: 102 }, B3: { v: "Bob" }, C3: { v: "Marketing" },
            A4: { v: 103 }, B4: { v: "Carol" }, C4: { v: "Sales" },
            D1: { v: "Find ID" }, E1: { v: "Dept" },
            D2: { v: 102 },
          },
        },
        targetCells: [{ cell: "E2", expected: "Marketing" }],
        hints: [
          "MATCH finds the position: =MATCH(D2, A2:A4, 0)",
          "INDEX returns the value: =INDEX(C2:C4, MATCH(D2, A2:A4, 0))",
        ],
      },
      {
        id: "lookup-ex3",
        type: "fix-formula",
        title: "Fix the VLOOKUP range",
        instruction: "The VLOOKUP in E2 returns #N/A because the table range is wrong. Fix it.",
        initialData: {
          cols: 5,
          rows: 4,
          cells: {
            A1: { v: "Code" }, B1: { v: "Item" }, C1: { v: "Price" },
            A2: { v: "A1" }, B2: { v: "Widget" }, C2: { v: 10 },
            A3: { v: "B2" }, B3: { v: "Gadget" }, C3: { v: 20 },
            D1: { v: "Find" }, E1: { v: "Price" },
            D2: { v: "B2" },
            E2: { v: 0, f: "=VLOOKUP(D2,B1:C3,2,FALSE)" },
          },
        },
        targetCells: [{ cell: "E2", expected: 20 }],
        hints: [
          "VLOOKUP searches the first column of the table range",
          "The lookup value 'B2' is in column A, but the range starts at B — change to A1:C3",
        ],
      },
    ],
  },

  // ──────────────── NODE 6: Date & Time Functions ────────────────
  {
    id: "date-time-functions",
    title: "Date & Time Functions",
    description:
      "Work with dates and times using DATE, DATEDIF, EOMONTH, NETWORKDAYS, and date formatting with TEXT.",
    prerequisites: ["basic-formulas"],
    trunk: false,
    column: -1,
    row: 3,
    conceptualQuestions: [
      {
        id: "date-concept-1",
        type: "multiple-choice",
        question: "How does Excel store dates internally?",
        options: [
          "As text strings like '2024-01-15'",
          "As serial numbers (days since a starting date)",
          "As Unix timestamps (seconds since 1970)",
          "As separate year, month, day values",
        ],
        correctAnswer: "As serial numbers (days since a starting date)",
        explanation: "Excel stores dates as numbers — 1 = Jan 1, 1900. This is why you can add/subtract dates to get differences in days.",
      },
    ],
    exercises: [
      {
        id: "date-ex1",
        type: "write-formula",
        title: "Days between dates",
        instruction: "In C1, calculate the number of days between the start date in A1 and end date in B1.",
        initialData: {
          cols: 3,
          rows: 2,
          cells: {
            A1: { v: 45292 },  // 2024-01-01 as serial
            B1: { v: 45322 },  // 2024-01-31 as serial
          },
        },
        targetCells: [{ cell: "C1", expected: 30 }],
        hints: ["Simply subtract: =B1-A1", "Since dates are numbers, subtraction gives days between them."],
      },
      {
        id: "date-ex2",
        type: "write-formula",
        title: "End of month",
        instruction: "In B1, use EOMONTH to find the last day of the month that is 2 months after the date in A1.",
        initialData: {
          cols: 2,
          rows: 2,
          cells: {
            A1: { v: 45292 },  // 2024-01-01
          },
        },
        targetCells: [{ cell: "B1", expected: 45382 }],  // 2024-03-31
        hints: [
          "EOMONTH(start_date, months) returns the last day of the month N months away",
          "=EOMONTH(A1, 2)",
        ],
      },
      {
        id: "date-ex3",
        type: "write-formula",
        title: "Working days between dates",
        instruction: "In C1, use NETWORKDAYS to count business days (Mon-Fri) between the dates in A1 and B1.",
        initialData: {
          cols: 3,
          rows: 2,
          cells: {
            A1: { v: 45292 },  // 2024-01-01 (Monday)
            B1: { v: 45296 },  // 2024-01-05 (Friday)
          },
        },
        targetCells: [{ cell: "C1", expected: 5 }],
        hints: ["NETWORKDAYS(start_date, end_date) counts weekdays", "=NETWORKDAYS(A1, B1)"],
      },
    ],
  },

  // ──────────────── NODE 7: Conditional Aggregation ────────────────
  {
    id: "conditional-aggregation",
    title: "Conditional Aggregation",
    description:
      "Aggregate data with conditions using SUMIF, COUNTIF, AVERAGEIFS, and SUMPRODUCT. The Excel equivalent of SQL's WHERE + GROUP BY.",
    prerequisites: ["lookup-functions"],
    trunk: true,
    column: 0,
    row: 4,
    conceptualQuestions: [
      {
        id: "cond-agg-concept-1",
        type: "multiple-choice",
        question: "What is the difference between SUMIF and SUMIFS?",
        options: [
          "SUMIF is faster than SUMIFS",
          "SUMIF takes one condition; SUMIFS takes multiple conditions",
          "SUMIFS only works with text criteria",
          "They are identical functions",
        ],
        correctAnswer: "SUMIF takes one condition; SUMIFS takes multiple conditions",
        explanation: "SUMIF handles a single criterion. SUMIFS can apply multiple criteria across different ranges. Note: SUMIFS also has a different argument order.",
      },
      {
        id: "cond-agg-concept-2",
        type: "fill-blank",
        question: "=COUNTIF(A1:A10, \">50\") counts how many cells in A1:A10 contain values _______ than 50.",
        correctAnswer: "greater",
        explanation: "The criteria \">50\" means greater than 50. COUNTIF counts cells that match the criteria.",
      },
    ],
    exercises: [
      {
        id: "cond-agg-ex1",
        type: "write-formula",
        title: "SUMIF by category",
        instruction: "In E1, use SUMIF to sum all sales (column B) where the region (column A) is \"North\".",
        initialData: {
          cols: 5,
          rows: 6,
          cells: {
            A1: { v: "North" }, B1: { v: 100 },
            A2: { v: "South" }, B2: { v: 150 },
            A3: { v: "North" }, B3: { v: 200 },
            A4: { v: "East" }, B4: { v: 120 },
            A5: { v: "North" }, B5: { v: 80 },
            D1: { v: "North Total" },
          },
        },
        targetCells: [{ cell: "E1", expected: 380 }],
        hints: [
          "Syntax: =SUMIF(range, criteria, sum_range)",
          "=SUMIF(A1:A5, \"North\", B1:B5)",
        ],
      },
      {
        id: "cond-agg-ex2",
        type: "write-formula",
        title: "COUNTIF with condition",
        instruction: "In D1, count how many scores in B1:B5 are 80 or above.",
        initialData: {
          cols: 4,
          rows: 5,
          cells: {
            A1: { v: "Alice" }, B1: { v: 85 },
            A2: { v: "Bob" }, B2: { v: 72 },
            A3: { v: "Carol" }, B3: { v: 91 },
            A4: { v: "Dave" }, B4: { v: 68 },
            A5: { v: "Eve" }, B5: { v: 88 },
          },
        },
        targetCells: [{ cell: "D1", expected: 3 }],
        hints: ["=COUNTIF(B1:B5, \">=80\")"],
      },
      {
        id: "cond-agg-ex3",
        type: "write-formula",
        title: "AVERAGEIFS with multiple criteria",
        instruction: "In F1, use AVERAGEIFS to average the sales (C column) where region is \"North\" AND product is \"Widget\".",
        initialData: {
          cols: 6,
          rows: 6,
          cells: {
            A1: { v: "North" }, B1: { v: "Widget" }, C1: { v: 100 },
            A2: { v: "South" }, B2: { v: "Widget" }, C2: { v: 150 },
            A3: { v: "North" }, B3: { v: "Gadget" }, C3: { v: 200 },
            A4: { v: "North" }, B4: { v: "Widget" }, C4: { v: 140 },
            A5: { v: "East" }, B5: { v: "Widget" }, C5: { v: 90 },
          },
        },
        targetCells: [{ cell: "F1", expected: 120 }],
        hints: [
          "Syntax: =AVERAGEIFS(average_range, criteria_range1, criteria1, criteria_range2, criteria2)",
          "=AVERAGEIFS(C1:C5, A1:A5, \"North\", B1:B5, \"Widget\")",
        ],
      },
    ],
  },

  // ──────────────── NODE 8: Data Cleaning ────────────────
  {
    id: "data-cleaning",
    title: "Data Cleaning",
    description:
      "Clean messy real-world data with SUBSTITUTE, TRIM, VALUE, TEXT, PROPER, and techniques for removing duplicates.",
    prerequisites: ["text-functions"],
    trunk: false,
    column: -1,
    row: 4,
    conceptualQuestions: [
      {
        id: "cleaning-concept-1",
        type: "multiple-choice",
        question: "A column has numbers stored as text (e.g., \"1,234\"). Which function converts them to actual numbers?",
        options: ["INT", "VALUE", "NUMBER", "CONVERT"],
        correctAnswer: "VALUE",
        explanation: "VALUE converts a text string that looks like a number into an actual numeric value. You may need to remove commas first with SUBSTITUTE.",
      },
    ],
    exercises: [
      {
        id: "cleaning-ex1",
        type: "write-formula",
        title: "PROPER case",
        instruction: "In B1, use PROPER to capitalize the first letter of each word in A1.",
        initialData: {
          cols: 2,
          rows: 3,
          cells: {
            A1: { v: "john doe" },
            A2: { v: "ALICE SMITH" },
            A3: { v: "bOB jONES" },
          },
        },
        targetCells: [{ cell: "B1", expected: "John Doe", expectedFormula: "=PROPER(A1)" }],
        hints: ["PROPER capitalizes the first letter of each word"],
      },
      {
        id: "cleaning-ex2",
        type: "write-formula",
        title: "Remove characters with SUBSTITUTE",
        instruction: "Cell A1 has a phone number with dashes. In B1, remove all dashes using SUBSTITUTE.",
        initialData: {
          cols: 2,
          rows: 2,
          cells: {
            A1: { v: "555-123-4567" },
          },
        },
        targetCells: [{ cell: "B1", expected: "5551234567" }],
        hints: [
          "SUBSTITUTE(text, old_text, new_text) replaces text",
          "=SUBSTITUTE(A1, \"-\", \"\")",
        ],
      },
      {
        id: "cleaning-ex3",
        type: "write-formula",
        title: "Text to number conversion",
        instruction: "Cell A1 has \"1,234\" as text. In B1, convert it to a number by removing the comma and using VALUE.",
        initialData: {
          cols: 2,
          rows: 2,
          cells: {
            A1: { v: "1,234" },
          },
        },
        targetCells: [{ cell: "B1", expected: 1234 }],
        hints: [
          "First remove the comma: SUBSTITUTE(A1, \",\", \"\")",
          "Then convert: =VALUE(SUBSTITUTE(A1, \",\", \"\"))",
        ],
      },
    ],
  },
```

- [ ] **Step 2: Add advanced nodes 9-12**

Continue appending to the array:

```typescript
  // ──────────────── NODE 9: Pivot Table Concepts ────────────────
  {
    id: "pivot-concepts",
    title: "Pivot Table Concepts",
    description:
      "Understand pivot table thinking — grouping, aggregating, and filtering data. The Excel equivalent of SQL GROUP BY.",
    prerequisites: ["conditional-aggregation"],
    trunk: true,
    column: 0,
    row: 5,
    conceptualQuestions: [
      {
        id: "pivot-concept-1",
        type: "multiple-choice",
        question: "In pivot table terminology, what are 'rows', 'columns', and 'values'?",
        options: [
          "Rows = data source rows, Columns = data source columns, Values = cell contents",
          "Rows = group-by fields, Columns = cross-tab fields, Values = aggregated metrics",
          "Rows = filters, Columns = sorts, Values = formulas",
          "They are the same as regular spreadsheet rows, columns, and values",
        ],
        correctAnswer: "Rows = group-by fields, Columns = cross-tab fields, Values = aggregated metrics",
        explanation:
          "Pivot tables reorganize data: Row fields define groups (like SQL GROUP BY), Column fields create cross-tabulations, and Value fields are the metrics being aggregated (SUM, COUNT, etc.).",
      },
      {
        id: "pivot-concept-2",
        type: "multiple-choice",
        question: "Which is the SQL equivalent of a pivot table that shows total sales by region?",
        options: [
          "SELECT * FROM sales WHERE region IS NOT NULL",
          "SELECT region, SUM(amount) FROM sales GROUP BY region",
          "SELECT DISTINCT region FROM sales",
          "SELECT region, amount FROM sales ORDER BY region",
        ],
        correctAnswer: "SELECT region, SUM(amount) FROM sales GROUP BY region",
        explanation: "A pivot table with 'region' as a row field and SUM of 'amount' as the value is equivalent to GROUP BY region with SUM aggregation.",
      },
    ],
    exercises: [
      {
        id: "pivot-ex1",
        type: "write-formula",
        title: "Manual pivot: sum by category",
        instruction: "Simulate a pivot table: in E2, use SUMIF to total sales for 'Electronics' from the data in A:B.",
        initialData: {
          cols: 5,
          rows: 6,
          cells: {
            A1: { v: "Category" }, B1: { v: "Sales" },
            A2: { v: "Electronics" }, B2: { v: 500 },
            A3: { v: "Clothing" }, B3: { v: 300 },
            A4: { v: "Electronics" }, B4: { v: 700 },
            A5: { v: "Food" }, B5: { v: 200 },
            A6: { v: "Electronics" }, B6: { v: 400 },
            D1: { v: "Category" }, E1: { v: "Total" },
            D2: { v: "Electronics" },
          },
        },
        targetCells: [{ cell: "E2", expected: 1600 }],
        hints: ["=SUMIF(A2:A6, D2, B2:B6)"],
      },
      {
        id: "pivot-ex2",
        type: "write-formula",
        title: "Count by group",
        instruction: "In E2, count how many transactions are in the 'Clothing' category.",
        initialData: {
          cols: 5,
          rows: 7,
          cells: {
            A1: { v: "Category" }, B1: { v: "Amount" },
            A2: { v: "Electronics" }, B2: { v: 50 },
            A3: { v: "Clothing" }, B3: { v: 30 },
            A4: { v: "Clothing" }, B4: { v: 45 },
            A5: { v: "Electronics" }, B5: { v: 60 },
            A6: { v: "Clothing" }, B6: { v: 25 },
            D1: { v: "Category" }, E1: { v: "Count" },
            D2: { v: "Clothing" },
          },
        },
        targetCells: [{ cell: "E2", expected: 3 }],
        hints: ["=COUNTIF(A2:A6, D2)"],
      },
      {
        id: "pivot-ex3",
        type: "write-formula",
        title: "Average by group",
        instruction: "In E2, calculate the average order value for 'Electronics'.",
        initialData: {
          cols: 5,
          rows: 6,
          cells: {
            A1: { v: "Category" }, B1: { v: "Order Value" },
            A2: { v: "Electronics" }, B2: { v: 120 },
            A3: { v: "Books" }, B3: { v: 25 },
            A4: { v: "Electronics" }, B4: { v: 80 },
            A5: { v: "Electronics" }, B5: { v: 200 },
            D1: { v: "Category" }, E1: { v: "Avg" },
            D2: { v: "Electronics" },
          },
        },
        targetCells: [{ cell: "E2", expected: 133.33 }],
        hints: ["=AVERAGEIF(A2:A5, D2, B2:B5)"],
      },
    ],
  },

  // ──────────────── NODE 10: Array Formulas & Dynamic Arrays ────────────────
  {
    id: "array-formulas",
    title: "Array Formulas & Dynamic Arrays",
    description:
      "Harness the power of array formulas with FILTER, SORT, UNIQUE, and SEQUENCE. Modern Excel's most powerful feature set.",
    prerequisites: ["pivot-concepts"],
    trunk: true,
    column: 0,
    row: 6,
    conceptualQuestions: [
      {
        id: "array-concept-1",
        type: "multiple-choice",
        question: "What is a 'spill range' in modern Excel?",
        options: [
          "A range that contains errors",
          "The area where a dynamic array formula automatically outputs multiple results",
          "A named range that expands automatically",
          "A range protected from edits",
        ],
        correctAnswer: "The area where a dynamic array formula automatically outputs multiple results",
        explanation: "Dynamic array formulas (FILTER, SORT, UNIQUE, etc.) can return multiple values that 'spill' into adjacent cells automatically.",
      },
    ],
    exercises: [
      {
        id: "array-ex1",
        type: "write-formula",
        title: "UNIQUE values",
        instruction: "In C1, use UNIQUE to extract the distinct categories from A1:A6.",
        initialData: {
          cols: 3,
          rows: 6,
          cells: {
            A1: { v: "Electronics" },
            A2: { v: "Clothing" },
            A3: { v: "Electronics" },
            A4: { v: "Food" },
            A5: { v: "Clothing" },
            A6: { v: "Electronics" },
          },
        },
        targetCells: [{ cell: "C1", expected: "Electronics" }],
        hints: ["=UNIQUE(A1:A6)", "The result spills down — C1 shows the first unique value"],
      },
      {
        id: "array-ex2",
        type: "write-formula",
        title: "SORT data",
        instruction: "In C1, use SORT to sort the values in A1:A5 in ascending order.",
        initialData: {
          cols: 3,
          rows: 5,
          cells: {
            A1: { v: 50 },
            A2: { v: 20 },
            A3: { v: 80 },
            A4: { v: 10 },
            A5: { v: 40 },
          },
        },
        targetCells: [{ cell: "C1", expected: 10 }],
        hints: ["=SORT(A1:A5)", "Default sort is ascending — smallest value appears first in C1"],
      },
      {
        id: "array-ex3",
        type: "write-formula",
        title: "FILTER with condition",
        instruction: "In D1, use FILTER to return only the names from A1:A5 where the score in B1:B5 is 80 or above.",
        initialData: {
          cols: 4,
          rows: 5,
          cells: {
            A1: { v: "Alice" }, B1: { v: 85 },
            A2: { v: "Bob" }, B2: { v: 72 },
            A3: { v: "Carol" }, B3: { v: 91 },
            A4: { v: "Dave" }, B4: { v: 65 },
            A5: { v: "Eve" }, B5: { v: 88 },
          },
        },
        targetCells: [{ cell: "D1", expected: "Alice" }],
        hints: [
          "Syntax: =FILTER(array, include, [if_empty])",
          "=FILTER(A1:A5, B1:B5>=80)",
        ],
      },
      {
        id: "array-ex4",
        type: "write-formula",
        title: "SEQUENCE generator",
        instruction: "In A1, use SEQUENCE to generate numbers 1 through 10 in a column.",
        initialData: {
          cols: 2,
          rows: 10,
          cells: {},
        },
        targetCells: [{ cell: "A1", expected: 1 }],
        hints: ["=SEQUENCE(10) generates 10 numbers starting from 1"],
      },
    ],
  },

  // ──────────────── NODE 11: Statistical Functions ────────────────
  {
    id: "statistical-functions",
    title: "Statistical Functions",
    description:
      "Analyze distributions and trends with PERCENTILE, STDEV, CORREL, FORECAST, and TREND. Essential for data analytics.",
    prerequisites: ["array-formulas"],
    trunk: false,
    column: 1,
    row: 6,
    conceptualQuestions: [
      {
        id: "stats-concept-1",
        type: "multiple-choice",
        question: "What does a CORREL value of -0.95 indicate?",
        options: [
          "No relationship between the variables",
          "A strong positive relationship",
          "A strong negative relationship — as one increases, the other decreases",
          "The data contains errors",
        ],
        correctAnswer: "A strong negative relationship — as one increases, the other decreases",
        explanation: "CORREL returns values between -1 and 1. Values near -1 indicate a strong negative correlation, near 1 is strong positive, and near 0 means little linear relationship.",
      },
      {
        id: "stats-concept-2",
        type: "fill-blank",
        question: "STDEV measures how spread out values are from the _______.",
        correctAnswer: "mean",
        explanation: "Standard deviation (STDEV) measures the average distance of each data point from the mean (average). Higher STDEV = more spread out data.",
      },
    ],
    exercises: [
      {
        id: "stats-ex1",
        type: "write-formula",
        title: "Calculate standard deviation",
        instruction: "In B1, calculate the standard deviation of the scores in A1:A6.",
        initialData: {
          cols: 2,
          rows: 6,
          cells: {
            A1: { v: 78 }, A2: { v: 85 }, A3: { v: 92 },
            A4: { v: 71 }, A5: { v: 88 }, A6: { v: 95 },
          },
        },
        targetCells: [{ cell: "B1", expected: 9.07 }],
        hints: ["=STDEV(A1:A6)", "STDEV calculates sample standard deviation"],
      },
      {
        id: "stats-ex2",
        type: "write-formula",
        title: "Find the 90th percentile",
        instruction: "In B1, find the 90th percentile of the values in A1:A8.",
        initialData: {
          cols: 2,
          rows: 8,
          cells: {
            A1: { v: 10 }, A2: { v: 20 }, A3: { v: 30 }, A4: { v: 40 },
            A5: { v: 50 }, A6: { v: 60 }, A7: { v: 70 }, A8: { v: 80 },
          },
        },
        targetCells: [{ cell: "B1", expected: 73 }],
        hints: ["=PERCENTILE(A1:A8, 0.9)", "The second argument is the percentile as a decimal (0.9 = 90th)"],
      },
      {
        id: "stats-ex3",
        type: "write-formula",
        title: "FORECAST a value",
        instruction: "In C1, use FORECAST to predict the y-value when x=6, given the data in A1:A5 (x) and B1:B5 (y).",
        initialData: {
          cols: 3,
          rows: 5,
          cells: {
            A1: { v: 1 }, B1: { v: 2 },
            A2: { v: 2 }, B2: { v: 4 },
            A3: { v: 3 }, B3: { v: 6 },
            A4: { v: 4 }, B4: { v: 8 },
            A5: { v: 5 }, B5: { v: 10 },
          },
        },
        targetCells: [{ cell: "C1", expected: 12 }],
        hints: [
          "Syntax: =FORECAST(x, known_y's, known_x's)",
          "=FORECAST(6, B1:B5, A1:A5)",
        ],
      },
    ],
  },

  // ──────────────── NODE 12: Dashboard Formulas ────────────────
  {
    id: "dashboard-formulas",
    title: "Dashboard Formulas",
    description:
      "Build dynamic dashboards with INDIRECT, dynamic ranges, conditional formatting logic, and data validation techniques.",
    prerequisites: ["pivot-concepts", "conditional-aggregation"],
    trunk: true,
    column: 0,
    row: 7,
    conceptualQuestions: [
      {
        id: "dashboard-concept-1",
        type: "multiple-choice",
        question: "What does INDIRECT do?",
        options: [
          "Creates a hyperlink to another cell",
          "Converts a text string into an actual cell reference",
          "Indirectly copies a cell's format",
          "Creates a dropdown list",
        ],
        correctAnswer: "Converts a text string into an actual cell reference",
        explanation: "INDIRECT takes a text string like \"A1\" and treats it as an actual cell reference. This lets you build dynamic references from text — e.g., =INDIRECT(\"Sheet\"&B1&\"!A1\").",
      },
      {
        id: "dashboard-concept-2",
        type: "fill-blank",
        question: "To conditionally format cells based on a formula, the formula must return _______ or FALSE.",
        correctAnswer: "TRUE",
        explanation: "Conditional formatting rules that use formulas apply the format when the formula evaluates to TRUE, and skip it when FALSE.",
      },
    ],
    exercises: [
      {
        id: "dashboard-ex1",
        type: "write-formula",
        title: "Dynamic reference with INDIRECT",
        instruction: "Cell A1 has the text \"B3\". In C1, use INDIRECT to return the value of the cell that A1 refers to.",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: "B3" },
            B1: { v: 10 },
            B2: { v: 20 },
            B3: { v: 30 },
          },
        },
        targetCells: [{ cell: "C1", expected: 30, expectedFormula: "=INDIRECT(A1)" }],
        hints: ["=INDIRECT(A1) converts the text in A1 into a cell reference"],
      },
      {
        id: "dashboard-ex2",
        type: "write-formula",
        title: "Conditional indicator",
        instruction: "In C1, write a formula: if B1 >= target in A1, show \"On Track\", otherwise show \"Behind\".",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 100 },
            B1: { v: 120 },
            A2: { v: 200 },
            B2: { v: 150 },
          },
        },
        targetCells: [{ cell: "C1", expected: "On Track" }],
        hints: ["=IF(B1>=A1, \"On Track\", \"Behind\")"],
      },
      {
        id: "dashboard-ex3",
        type: "write-formula",
        title: "Dynamic SUM with INDIRECT",
        instruction: "Cell D1 has a number (3). In E1, use INDIRECT to SUM from A1 to A[D1] dynamically (i.e., SUM A1:A3).",
        initialData: {
          cols: 5,
          rows: 5,
          cells: {
            A1: { v: 10 },
            A2: { v: 20 },
            A3: { v: 30 },
            A4: { v: 40 },
            A5: { v: 50 },
            D1: { v: 3 },
          },
        },
        targetCells: [{ cell: "E1", expected: 60 }],
        hints: [
          "Build the range as text: \"A1:A\"&D1 gives \"A1:A3\"",
          "=SUM(INDIRECT(\"A1:A\"&D1))",
        ],
      },
    ],
  },
];
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd queryveda && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Verify build**

Run: `cd queryveda && npx next build`
Expected: Build succeeds (generateStaticParams will now produce all 12 node IDs)

- [ ] **Step 5: Commit**

```bash
git add queryveda/lib/excel-skill-tree-data.ts
git commit -m "feat: add remaining 8 Excel skill tree nodes (intermediate + advanced)"
```

---

## Task 16: Update Mobile Drawer

**Files:**
- Modify: `queryveda/components/layout/mobile-drawer.tsx`

- [ ] **Step 1: Read the current mobile-drawer.tsx**

Read `queryveda/components/layout/mobile-drawer.tsx` to understand the current structure.

- [ ] **Step 2: Add Excel link and track-awareness**

Add the same track-aware filtering used in the Navbar. Import `useTrack` and filter links to show/hide based on user's selected tracks. Add "Learn Excel" link pointing to `/excel`.

- [ ] **Step 3: Verify build**

Run: `cd queryveda && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add queryveda/components/layout/mobile-drawer.tsx
git commit -m "feat: add Excel link to mobile drawer navigation"
```

---

## Task 17: Progress Page — Excel Section

**Files:**
- Read and modify progress-related components

- [ ] **Step 1: Read the current progress page structure**

Read `queryveda/app/progress/page.tsx` and the components under `queryveda/components/progress/` to understand the current layout.

- [ ] **Step 2: Add Excel progress section**

Add an Excel mastery section to the progress page that shows:
- Number of Excel exercises completed / total
- Per-node mastery bars for Excel skill tree nodes
- Only show if user has the Excel track selected

Use `useTrack` to check if user has the `excel` track, and `useExcelSkillTree` to get mastery data.

- [ ] **Step 3: Verify build**

Run: `cd queryveda && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add queryveda/app/progress/ queryveda/components/progress/
git commit -m "feat: add Excel progress tracking to progress page"
```

---

## Task 18: End-to-End Verification

- [ ] **Step 1: Full build check**

Run: `cd queryveda && npx next build`
Expected: Build succeeds with all Excel routes generated

- [ ] **Step 2: Manual smoke test**

Start the dev server: `cd queryveda && npm run dev`

Test the following flows:
1. Visit `/` — should redirect to `/onboarding` on first visit (clear localStorage first)
2. Select "Excel" on onboarding — should redirect to `/`
3. Home page should show "Learn Excel" card
4. Click "Learn Excel" — should show skill tree at `/excel`
5. Click "Cell References & Navigation" node — should show warmup questions
6. Answer warmup questions — should unlock hands-on exercises
7. Complete a spreadsheet exercise — should show pass verdict
8. Check `/progress` — should show Excel mastery

- [ ] **Step 3: Verify existing SQL flow still works**

1. Add "SQL" to tracks (localStorage or onboarding)
2. `/learn` should still show SQL skill tree
3. SQL exercises should still work with PGlite
4. Progress should show SQL stats

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during Excel track smoke test"
```
