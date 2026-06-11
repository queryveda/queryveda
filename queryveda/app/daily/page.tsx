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
