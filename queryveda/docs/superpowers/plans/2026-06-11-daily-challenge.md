# Daily SQL Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a daily AI-generated SQL challenge to the home page with solve timer and countdown-to-refresh clock.

**Architecture:** A GitHub Action runs daily at 9 AM IST (3:30 UTC), calls Claude API to generate a medium-difficulty PostgreSQL question, and commits it to `public/daily-question.json`. The Next.js static app reads this JSON at build time. A new `/daily` page reuses the existing practice components (editor, problem panel, test runner) with added countdown timers.

**Tech Stack:** Next.js 14 (static export), TypeScript, Tailwind CSS, shadcn/ui, PGlite, GitHub Actions, Claude API

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `lib/daily.ts` | Daily question types, fetch helper, localStorage state, timer math |
| `components/daily/countdown-timer.tsx` | Reusable ticking countdown display (hh:mm:ss) |
| `components/daily/daily-hero-card.tsx` | Home page Daily Challenge card (client component) |
| `components/daily/time-up-banner.tsx` | Dismissible "Time's up!" banner |
| `app/daily/page.tsx` | Daily challenge page with editor and timers |
| `.github/workflows/daily-question.yml` | Cron workflow to generate daily question |
| `scripts/generate-daily-question.mjs` | Node script that calls Claude API and writes JSON |

### Modified Files
| File | Change |
|------|--------|
| `app/page.tsx` | Import and insert `DailyHeroCard` between Hero and Features |
| `components/layout/navbar.tsx` | Add `{ href: "/daily", label: "Daily" }` to `navLinks` |

---

## Task 1: Types and Daily Utility Functions (`lib/daily.ts`)

**Files:**
- Create: `queryveda/lib/daily.ts`

- [ ] **Step 1: Create `lib/daily.ts` with types, fetch, localStorage helpers, and timer math**

```ts
import type { Question } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DailyQuestion {
  date: string; // "YYYY-MM-DD"
  question: Omit<Question, "id">;
}

interface DailyChallengeState {
  date: string;
  startedAt: number | null; // timestamp ms
  duration: number | null; // minutes (15 | 30 | 45)
  solved: boolean;
  sql: string;
}

/* ------------------------------------------------------------------ */
/*  Fetch                                                              */
/* ------------------------------------------------------------------ */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export async function fetchDailyQuestion(): Promise<DailyQuestion | null> {
  try {
    const res = await fetch(`${BASE}/daily-question.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: DailyQuestion = await res.json();
    return data;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Today helper (IST = UTC+5:30)                                      */
/* ------------------------------------------------------------------ */

/** Returns today's date string in YYYY-MM-DD (IST). */
export function todayIST(): string {
  const now = new Date();
  // IST offset = +5:30 = +330 minutes
  const istMs = now.getTime() + (330 + now.getTimezoneOffset()) * 60_000;
  const ist = new Date(istMs);
  return ist.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  localStorage state                                                 */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "daily_challenge";

function getState(): DailyChallengeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as DailyChallengeState;
      if (s.date === todayIST()) return s;
    }
  } catch {
    // ignore
  }
  return { date: todayIST(), startedAt: null, duration: null, solved: false, sql: "" };
}

function setState(s: DailyChallengeState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function getDailyState() {
  return getState();
}

export function startChallenge(duration: number) {
  const s = getState();
  if (!s.startedAt) {
    s.startedAt = Date.now();
    s.duration = duration;
    setState(s);
  }
  return s;
}

export function saveDailySQL(sql: string) {
  const s = getState();
  s.sql = sql;
  setState(s);
}

export function markDailySolved() {
  const s = getState();
  s.solved = true;
  setState(s);
}

/* ------------------------------------------------------------------ */
/*  Timer math                                                         */
/* ------------------------------------------------------------------ */

/** Milliseconds until next 9:00 AM IST from now. */
export function msUntilNextRefresh(): number {
  const now = new Date();
  // Compute current IST time
  const istMs = now.getTime() + (330 + now.getTimezoneOffset()) * 60_000;
  const ist = new Date(istMs);

  // Next 9:00 AM IST today
  const target = new Date(ist);
  target.setHours(9, 0, 0, 0);

  // If we've already passed 9 AM IST today, go to tomorrow
  if (ist >= target) {
    target.setDate(target.getDate() + 1);
  }

  // Convert target IST back to UTC ms
  const targetUTC = target.getTime() - (330 + now.getTimezoneOffset()) * 60_000;
  return Math.max(0, targetUTC - now.getTime());
}

/** Milliseconds remaining on solve timer. Returns 0 if expired or not started. */
export function solveTimerRemaining(state: DailyChallengeState): number {
  if (!state.startedAt || !state.duration) return 0;
  const elapsed = Date.now() - state.startedAt;
  const total = state.duration * 60_000;
  return Math.max(0, total - elapsed);
}

/** Format milliseconds as HH:MM:SS */
export function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/lib/daily.ts
git commit -m "feat(daily): add types, fetch, localStorage helpers, and timer utilities"
```

---

## Task 2: Countdown Timer Component

**Files:**
- Create: `queryveda/components/daily/countdown-timer.tsx`

- [ ] **Step 1: Create `components/daily/countdown-timer.tsx`**

A reusable ticking countdown that accepts a `getRemaining` function (called every second) and a label.

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatMs } from "@/lib/daily";

interface CountdownTimerProps {
  label: string;
  getRemaining: () => number; // returns ms remaining
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ label, getRemaining, onExpire, className = "" }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0 && onExpire) {
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [getRemaining, onExpire]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-mono font-bold tabular-nums">{formatMs(remaining)}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/components/daily/countdown-timer.tsx
git commit -m "feat(daily): add reusable CountdownTimer component"
```

---

## Task 3: Time's Up Banner Component

**Files:**
- Create: `queryveda/components/daily/time-up-banner.tsx`

- [ ] **Step 1: Create `components/daily/time-up-banner.tsx`**

```tsx
"use client";

import { useState } from "react";

export function TimeUpBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400 animate-in fade-in slide-in-from-top-2 duration-300">
      <span>Time&apos;s up! You can still keep working on the challenge.</span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-md px-2 py-0.5 text-xs hover:bg-amber-500/20 transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/components/daily/time-up-banner.tsx
git commit -m "feat(daily): add dismissible TimeUpBanner component"
```

---

## Task 4: Daily Hero Card (Home Page Section)

**Files:**
- Create: `queryveda/components/daily/daily-hero-card.tsx`

- [ ] **Step 1: Create `components/daily/daily-hero-card.tsx`**

This is the card shown on the home page between Hero and Features.

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./countdown-timer";
import {
  fetchDailyQuestion,
  getDailyState,
  startChallenge,
  msUntilNextRefresh,
  solveTimerRemaining,
  todayIST,
  type DailyQuestion,
} from "@/lib/daily";

export function DailyHeroCard() {
  const [daily, setDaily] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [started, setStarted] = useState(false);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    fetchDailyQuestion().then((dq) => {
      setDaily(dq);
      setLoading(false);
    });
    const state = getDailyState();
    if (state.startedAt) {
      setStarted(true);
      setSelectedDuration(state.duration ?? 30);
    }
    if (state.solved) setSolved(true);
  }, []);

  const getRefreshRemaining = useCallback(() => msUntilNextRefresh(), []);
  const getSolveRemaining = useCallback(() => {
    const state = getDailyState();
    return solveTimerRemaining(state);
  }, []);

  const isStale = daily ? daily.date !== todayIST() : false;
  const showQuestion = daily && !isStale;

  const handleStart = () => {
    startChallenge(selectedDuration);
    setStarted(true);
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-8">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-[1px]">
        <Card className="rounded-2xl border-0">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>&#128293;</span>
                <CardTitle className="text-xl">Daily SQL Challenge</CardTitle>
                <Badge style={{ backgroundColor: "#f59e0b" }} className="text-white">
                  Medium
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {daily?.date ?? todayIST()}
              </span>
            </div>

            {/* Timers */}
            <div className="flex items-center gap-8 flex-wrap">
              <CountdownTimer label="Next Question In" getRemaining={getRefreshRemaining} />
              {started && !solved && (
                <CountdownTimer label="Solve Timer" getRemaining={getSolveRemaining} />
              )}
            </div>

            {loading && (
              <CardDescription>Loading today&apos;s challenge...</CardDescription>
            )}

            {!loading && !showQuestion && (
              <CardDescription>
                Today&apos;s challenge is being prepared. Check back after 9:00 AM IST!
              </CardDescription>
            )}

            {showQuestion && (
              <>
                <div>
                  <h3 className="font-semibold">{daily.question.title}</h3>
                  <CardDescription className="line-clamp-2 mt-1">
                    {daily.question.desc}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {!started && !solved && (
                    <>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                      </select>
                      <Button onClick={handleStart} className="rounded-full px-6">
                        Start Challenge
                      </Button>
                    </>
                  )}

                  {started && !solved && (
                    <Link href="/daily">
                      <Button className="rounded-full px-6">Continue Challenge</Button>
                    </Link>
                  )}

                  {solved && (
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        Solved!
                      </span>
                      <Link href="/daily">
                        <Button variant="outline" className="rounded-full px-6">
                          View Solution
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/components/daily/daily-hero-card.tsx
git commit -m "feat(daily): add DailyHeroCard home page section"
```

---

## Task 5: Insert Daily Hero Card into Home Page

**Files:**
- Modify: `queryveda/app/page.tsx`

- [ ] **Step 1: Convert home page to import and render DailyHeroCard**

The home page (`app/page.tsx`) is currently a server component. Since `DailyHeroCard` is a client component, we can import it directly — Next.js handles the boundary automatically.

Add the import at the top of `app/page.tsx` (after line 3):

```ts
import { DailyHeroCard } from "@/components/daily/daily-hero-card";
```

Then insert `<DailyHeroCard />` between the Hero closing `</section>` (line 22) and the Features opening `{/* Features */}` comment (line 24):

```tsx
      {/* Daily Challenge */}
      <DailyHeroCard />
```

The result for lines 22-26 should look like:

```tsx
      </section>

      {/* Daily Challenge */}
      <DailyHeroCard />

      {/* Features */}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/app/page.tsx
git commit -m "feat(daily): insert DailyHeroCard on home page"
```

---

## Task 6: Add "Daily" Link to Navbar

**Files:**
- Modify: `queryveda/components/layout/navbar.tsx:13-19`

- [ ] **Step 1: Add Daily nav link**

In `navbar.tsx`, the `navLinks` array is defined at lines 13-19. Add a "Daily" entry after "Home":

Change:

```ts
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/problems", label: "Problems" },
```

To:

```ts
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/daily", label: "Daily" },
  { href: "/problems", label: "Problems" },
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/components/layout/navbar.tsx
git commit -m "feat(daily): add Daily link to navbar"
```

---

## Task 7: Daily Challenge Page (`/daily`)

**Files:**
- Create: `queryveda/app/daily/page.tsx`

- [ ] **Step 1: Create `app/daily/page.tsx`**

This is the main daily challenge solve page. It reuses `ProblemPanel`, `SQLEditor`, `ResultTable`, `HintsPanel`, `SolutionPanel`, and `SplitPane` from the existing practice flow.

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runTests, executeQuery, type QueryResult } from "@/lib/pglite";
import { usePGlite } from "@/hooks/use-pglite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SplitPane } from "@/components/practice/split-pane";
import { ProblemPanel } from "@/components/practice/problem-panel";
import { SQLEditor } from "@/components/practice/sql-editor";
import { HintsPanel } from "@/components/practice/hints-panel";
import { SolutionPanel } from "@/components/practice/solution-panel";
import { ResultTable } from "@/components/practice/result-table";
import { CountdownTimer } from "@/components/daily/countdown-timer";
import { TimeUpBanner } from "@/components/daily/time-up-banner";
import type { Question } from "@/lib/types";
import {
  fetchDailyQuestion,
  getDailyState,
  startChallenge,
  saveDailySQL,
  markDailySolved,
  msUntilNextRefresh,
  solveTimerRemaining,
  todayIST,
  type DailyQuestion,
} from "@/lib/daily";

interface Verdict {
  type: "pass" | "fail" | "idle";
  message: string;
}

export default function DailyPage() {
  const { db, ready, error: dbError } = usePGlite();

  const [daily, setDaily] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [started, setStarted] = useState(false);
  const [solved, setSolved] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  const [sqlValue, setSqlValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict>({ type: "idle", message: "" });
  const [userResult, setUserResult] = useState<QueryResult | null>(null);
  const [schemaTables, setSchemaTables] = useState<Record<string, QueryResult>>({});
  const [running, setRunning] = useState(false);

  const sqlRef = useRef(sqlValue);
  sqlRef.current = sqlValue;

  // Fetch daily question
  useEffect(() => {
    fetchDailyQuestion().then((dq) => {
      setDaily(dq);
      setLoading(false);
    });
    const state = getDailyState();
    if (state.startedAt) {
      setStarted(true);
      setSelectedDuration(state.duration ?? 30);
      if (solveTimerRemaining(state) <= 0) setTimeUp(true);
    }
    if (state.solved) setSolved(true);
    if (state.sql) setSqlValue(state.sql);
  }, []);

  // Build a Question object for reuse with ProblemPanel and runTests
  const question: Question | null =
    daily && daily.date === todayIST()
      ? { id: -1, ...daily.question }
      : null;

  // Set up schema when DB + question are ready
  useEffect(() => {
    if (!ready || !db || !question) return;

    async function setupSchema() {
      try {
        await db!.exec(question!.setup);
        const tables: Record<string, QueryResult> = {};
        for (const tableName of question!.tables) {
          try {
            const result = await executeQuery(db!, `SELECT * FROM ${tableName}`);
            tables[tableName] = result;
          } catch {
            // table might not exist
          }
        }
        setSchemaTables(tables);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setVerdict({ type: "fail", message: `Setup error: ${msg}` });
      }
    }
    setupSchema();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, daily]);

  const handleRun = useCallback(async () => {
    if (!db || !question) return;
    const trimmed = sqlRef.current.trim();
    if (!trimmed) {
      setVerdict({ type: "fail", message: "Please write a SQL query first." });
      return;
    }
    setRunning(true);
    try {
      const result = await runTests(db, question, trimmed);
      setVerdict({ type: result.passed ? "pass" : "fail", message: result.message });
      setUserResult(result.userResult);
      if (result.passed) {
        markDailySolved();
        setSolved(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setVerdict({ type: "fail", message: msg });
    } finally {
      setRunning(false);
    }
  }, [db, question]);

  const handleChange = useCallback((value: string) => {
    setSqlValue(value);
    saveDailySQL(value);
  }, []);

  const handleStart = () => {
    startChallenge(selectedDuration);
    setStarted(true);
  };

  const getRefreshRemaining = useCallback(() => msUntilNextRefresh(), []);
  const getSolveRemaining = useCallback(() => {
    const state = getDailyState();
    return solveTimerRemaining(state);
  }, []);
  const handleTimerExpire = useCallback(() => setTimeUp(true), []);

  // --- Loading / error states ---

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading today&apos;s challenge...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <span className="text-4xl">&#128197;</span>
        <h2 className="text-2xl font-bold">Today&apos;s Challenge Is Being Prepared</h2>
        <p className="text-muted-foreground max-w-md">
          A new question is generated every day at 9:00 AM IST. Check back soon!
        </p>
        <CountdownTimer label="Next Question In" getRemaining={getRefreshRemaining} className="mt-4" />
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="p-8 text-center text-destructive">
        Database failed to load: {dbError}
      </div>
    );
  }

  // --- Pre-start state ---

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-12 text-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden>&#128293;</span>
          <h2 className="text-2xl font-bold">Daily SQL Challenge</h2>
          <Badge style={{ backgroundColor: "#f59e0b" }} className="text-white">Medium</Badge>
        </div>
        <h3 className="text-xl font-semibold">{question.title}</h3>
        <p className="text-muted-foreground max-w-lg">{question.desc}</p>
        <CountdownTimer label="Next Question In" getRemaining={getRefreshRemaining} />
        <div className="flex items-center gap-3">
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
          </select>
          <Button onClick={handleStart} size="lg" className="rounded-full px-8">
            Start Challenge
          </Button>
        </div>
      </div>
    );
  }

  // --- Active challenge ---

  const tableHints: Record<string, string[]> = {};
  for (const [name, result] of Object.entries(schemaTables)) {
    tableHints[name] = result.cols;
  }

  const leftPanel = <ProblemPanel question={question} schemaTables={schemaTables} />;

  const rightPanel = (
    <>
      {!ready && <p className="text-sm text-muted-foreground">Loading database...</p>}

      {timeUp && <TimeUpBanner />}

      <SQLEditor
        initialValue={sqlValue}
        onChange={handleChange}
        onRun={handleRun}
        tables={tableHints}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleRun}
          disabled={running || !ready}
          size="sm"
          className="rounded-full"
        >
          {running ? "Running..." : "Run (\u2318/Ctrl+Enter)"}
        </Button>
      </div>

      {/* Verdict */}
      {verdict.type !== "idle" && (
        <div
          className={`rounded-xl p-3 text-sm ${
            verdict.type === "pass"
              ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30"
          }`}
        >
          {verdict.message}
        </div>
      )}

      {/* User result */}
      {userResult && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Your Output</h4>
          <ResultTable cols={userResult.cols} rows={userResult.rows} />
        </div>
      )}

      {/* Hints */}
      {question.hints.length > 0 && <HintsPanel hints={question.hints} />}

      {/* Solution — only after solved or time up */}
      {(solved || timeUp) && (
        <SolutionPanel
          solution={question.solution}
          tips={question.tips}
          optSolution={question.optSolution}
        />
      )}
    </>
  );

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>&#128293;</span>
          <h2 className="text-sm font-semibold">Daily Challenge &mdash; {daily!.date}</h2>
          <Badge style={{ backgroundColor: "#f59e0b" }} className="text-white text-xs">Medium</Badge>
          {solved && (
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 text-xs">
              Solved
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-6">
          {!solved && (
            <CountdownTimer
              label="Solve Timer"
              getRemaining={getSolveRemaining}
              onExpire={handleTimerExpire}
            />
          )}
          <CountdownTimer label="Next Question" getRemaining={getRefreshRemaining} />
        </div>
      </div>

      <SplitPane left={leftPanel} right={rightPanel} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/app/daily/page.tsx
git commit -m "feat(daily): add /daily challenge page with timers and editor"
```

---

## Task 8: Daily Question Generator Script

**Files:**
- Create: `queryveda/scripts/generate-daily-question.mjs`

- [ ] **Step 1: Create `scripts/generate-daily-question.mjs`**

This Node.js script calls the Claude API to generate a daily question and writes `public/daily-question.json`. It's invoked by the GitHub Action.

```js
#!/usr/bin/env node

/**
 * Generates a daily SQL practice question using Claude API.
 * Writes to public/daily-question.json.
 *
 * Usage: ANTHROPIC_API_KEY=xxx node scripts/generate-daily-question.mjs
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, "../public/daily-question.json");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is required");
  process.exit(1);
}

const TOPICS = [
  "Aggregations & JOINs",
  "Window Functions",
  "Cumulative & Sliding Windows",
  "Consecutive Sequences",
  "Advanced Analytics",
];

// Pick a random topic seeded by date
const today = new Date().toISOString().slice(0, 10);
const dayIndex = Math.floor(Date.now() / 86400000);
const topic = TOPICS[dayIndex % TOPICS.length];

const PROMPT = `You are a PostgreSQL question generator for a SQL practice platform.

Generate ONE medium-difficulty PostgreSQL practice question on the topic "${topic}".

The question must:
1. Use realistic, small datasets (3-10 rows per table)
2. Require JOINs, window functions, CTEs, or analytical SQL (appropriate to the topic)
3. Have a clear, unambiguous expected output
4. Include progressive hints (3 hints, from vague to specific)
5. Include 2 additional hidden test cases with different data

Respond with ONLY valid JSON (no markdown, no code fences) in this exact structure:

{
  "title": "Short descriptive title",
  "difficulty": "Medium",
  "topic": "${topic}",
  "desc": "Full problem description explaining what the user needs to query",
  "setup": "Complete SQL: CREATE TABLE statements with INSERT INTO statements for sample data. Use DROP TABLE IF EXISTS before each CREATE.",
  "tables": ["table_name_1", "table_name_2"],
  "cols": ["expected_column_1", "expected_column_2"],
  "rows": [["row1_val1", "row1_val2"], ["row2_val1", "row2_val2"]],
  "solution": "The correct SQL query",
  "tips": "Brief optimization or alternative approach tip",
  "hints": ["Hint 1 (vague)", "Hint 2 (medium)", "Hint 3 (nearly gives it away)"],
  "tests": [
    {
      "setup": "Complete SQL: DROP + CREATE + INSERT for test case 2 with different data",
      "rows": [["expected_row_values"]]
    },
    {
      "setup": "Complete SQL: DROP + CREATE + INSERT for test case 3 with different data",
      "rows": [["expected_row_values"]]
    }
  ]
}

Important:
- All string values in rows must be actual strings. Numbers must be actual numbers. Nulls must be null.
- The "setup" field must contain complete DDL+DML that can run independently.
- Each test "setup" must also contain complete DDL+DML (DROP IF EXISTS + CREATE + INSERT).
- Ensure the "rows" match what the "solution" query would actually produce against the "setup" data.
- Column names in "cols" must match the query output exactly.`;

async function generate() {
  console.log(`Generating daily question for ${today}, topic: ${topic}`);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: PROMPT }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`API error ${res.status}: ${text}`);
    process.exit(1);
  }

  const data = await res.json();
  const content = data.content[0].text;

  // Parse and validate
  let question;
  try {
    question = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse JSON response:", content.slice(0, 500));
    process.exit(1);
  }

  const required = ["title", "difficulty", "desc", "setup", "tables", "cols", "rows", "solution", "tips", "hints", "tests"];
  for (const key of required) {
    if (!(key in question)) {
      console.error(`Missing required field: ${key}`);
      process.exit(1);
    }
  }

  if (question.difficulty !== "Medium") {
    question.difficulty = "Medium";
  }

  const output = {
    date: today,
    question,
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`Written to ${OUTPUT}`);
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/scripts/generate-daily-question.mjs
git commit -m "feat(daily): add Claude API script to generate daily question"
```

---

## Task 9: GitHub Action Workflow

**Files:**
- Create: `queryveda/.github/workflows/daily-question.yml`

Note: The existing deploy workflow (`.github/workflows/deploy.yml`) triggers on push to `main`. The daily question workflow commits to `main`, which will automatically trigger a redeploy.

- [ ] **Step 1: Create `.github/workflows/daily-question.yml`**

```yaml
name: Generate Daily Question

on:
  schedule:
    # 3:30 UTC = 9:00 AM IST
    - cron: "30 3 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: queryveda
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Generate daily question
        run: node scripts/generate-daily-question.mjs
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add public/daily-question.json
          git diff --cached --quiet && echo "No changes" && exit 0
          git commit -m "chore: update daily question for $(date -u +%Y-%m-%d)"
          git push
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/.github/workflows/daily-question.yml
git commit -m "feat(daily): add GitHub Action to generate daily question on cron"
```

---

## Task 10: Create Placeholder `daily-question.json` for Development

**Files:**
- Create: `queryveda/public/daily-question.json`

- [ ] **Step 1: Create a sample `public/daily-question.json` for local dev**

This file will be overwritten by the GitHub Action in production. Having it locally lets you test the full flow.

```json
{
  "date": "2026-06-11",
  "question": {
    "title": "Department Salary Rankings",
    "difficulty": "Medium",
    "topic": "Window Functions",
    "desc": "Given an employees table with department information, write a query that returns each employee's name, department, salary, and their salary rank within their department (highest salary = rank 1). Order results by department name, then by rank.",
    "setup": "DROP TABLE IF EXISTS employees;\nCREATE TABLE employees (\n  id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL,\n  department TEXT NOT NULL,\n  salary INTEGER NOT NULL\n);\nINSERT INTO employees (name, department, salary) VALUES\n  ('Alice', 'Engineering', 95000),\n  ('Bob', 'Engineering', 88000),\n  ('Carol', 'Engineering', 92000),\n  ('Dave', 'Marketing', 75000),\n  ('Eve', 'Marketing', 82000),\n  ('Frank', 'Sales', 70000),\n  ('Grace', 'Sales', 78000),\n  ('Hank', 'Sales', 72000);",
    "tables": ["employees"],
    "cols": ["name", "department", "salary", "rank"],
    "rows": [
      ["Alice", "Engineering", 95000, 1],
      ["Carol", "Engineering", 92000, 2],
      ["Bob", "Engineering", 88000, 3],
      ["Eve", "Marketing", 82000, 1],
      ["Dave", "Marketing", 75000, 2],
      ["Grace", "Sales", 78000, 1],
      ["Hank", "Sales", 72000, 2],
      ["Frank", "Sales", 70000, 3]
    ],
    "solution": "SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank FROM employees ORDER BY department, rank;",
    "tips": "RANK() leaves gaps after ties. Use DENSE_RANK() if you want consecutive numbers even with ties.",
    "hints": [
      "Think about how to partition the data by department",
      "You'll need a window function with PARTITION BY and ORDER BY clauses",
      "Use RANK() OVER (PARTITION BY department ORDER BY salary DESC)"
    ],
    "tests": [
      {
        "setup": "DROP TABLE IF EXISTS employees;\nCREATE TABLE employees (\n  id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL,\n  department TEXT NOT NULL,\n  salary INTEGER NOT NULL\n);\nINSERT INTO employees (name, department, salary) VALUES\n  ('Tom', 'HR', 60000),\n  ('Jane', 'HR', 65000);",
        "rows": [["Jane", "HR", 65000, 1], ["Tom", "HR", 60000, 2]]
      },
      {
        "setup": "DROP TABLE IF EXISTS employees;\nCREATE TABLE employees (\n  id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL,\n  department TEXT NOT NULL,\n  salary INTEGER NOT NULL\n);\nINSERT INTO employees (name, department, salary) VALUES\n  ('Ava', 'Tech', 90000),\n  ('Ben', 'Tech', 90000),\n  ('Cal', 'Tech', 80000);",
        "rows": [["Ava", "Tech", 90000, 1], ["Ben", "Tech", 90000, 1], ["Cal", "Tech", 80000, 3]]
      }
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add queryveda/public/daily-question.json
git commit -m "feat(daily): add placeholder daily-question.json for development"
```

---

## Task 11: Verify Build

- [ ] **Step 1: Run the Next.js build to verify everything compiles**

```bash
cd queryveda && npm run build
```

Expected: Build succeeds with no TypeScript errors. The `/daily` route is included in the static export.

- [ ] **Step 2: Fix any build errors if they occur**

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(daily): resolve build errors"
```

---

## Task 12: Manual Smoke Test

- [ ] **Step 1: Start the dev server and verify**

```bash
cd queryveda && npm run dev
```

Verify:
1. Home page shows Daily Challenge card between hero and features
2. "Next Question In" countdown ticks every second
3. Timer dropdown shows 15/30/45 options
4. Clicking "Start Challenge" navigates to `/daily`
5. `/daily` page shows the question with solve timer ticking
6. SQL editor works, running a query shows pass/fail
7. When solve timer expires, "Time's up!" banner appears
8. After solving, home page card shows "Solved!" state
9. "Daily" link appears in navbar

- [ ] **Step 2: Commit any final adjustments**
