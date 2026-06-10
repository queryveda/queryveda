"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuestionById, getSortedQuestions } from "@/lib/questions";
import { runTests, executeQuery, type QueryResult } from "@/lib/pglite";
import { usePGlite } from "@/hooks/use-pglite";
import { useStorage } from "@/hooks/use-storage";
import type { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SplitPane } from "@/components/practice/split-pane";
import { ProblemPanel } from "@/components/practice/problem-panel";
import { SQLEditor } from "@/components/practice/sql-editor";
import { HintsPanel } from "@/components/practice/hints-panel";
import { SolutionPanel } from "@/components/practice/solution-panel";
import { ResultTable } from "@/components/practice/result-table";

interface Verdict {
  type: "pass" | "fail" | "idle";
  message: string;
}

export function PracticeClient({ id }: { id: string }) {
  const questionId = Number(id);
  const question = getQuestionById(questionId);
  const sorted = getSortedQuestions();
  const currentIdx = sorted.findIndex((q) => q.id === questionId);

  const router = useRouter();
  const { db, ready, error: dbError } = usePGlite();
  const { getSavedSQL, saveSQL, markSolved, markAttempted } = useStorage();

  const [sqlValue, setSqlValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict>({
    type: "idle",
    message: "",
  });
  const [userResult, setUserResult] = useState<QueryResult | null>(null);
  const [schemaTables, setSchemaTables] = useState<
    Record<string, QueryResult>
  >({});
  const [running, setRunning] = useState(false);

  // Ref to avoid stale closure in onRun callback
  const sqlRef = useRef(sqlValue);
  sqlRef.current = sqlValue;

  // Load saved SQL and set up schema on question/db change
  useEffect(() => {
    if (!ready || !db || !question) return;

    const saved = getSavedSQL(questionId);
    setSqlValue(saved);
    setVerdict({ type: "idle", message: "" });
    setUserResult(null);

    async function setupSchema() {
      try {
        await db!.exec(question!.setup);
        // Load schema tables for display
        const tables: Record<string, QueryResult> = {};
        for (const tableName of question!.tables) {
          try {
            const result = await executeQuery(
              db!,
              `SELECT * FROM ${tableName}`
            );
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
  }, [questionId, ready]);

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
      setVerdict({
        type: result.passed ? "pass" : "fail",
        message: result.message,
      });
      setUserResult(result.userResult);
      if (result.passed) {
        markSolved(questionId);
      } else {
        markAttempted(questionId);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setVerdict({ type: "fail", message: msg });
    } finally {
      setRunning(false);
    }
  }, [db, question, questionId, markSolved, markAttempted]);

  const handleChange = useCallback(
    (value: string) => {
      setSqlValue(value);
      saveSQL(questionId, value);
      if (value.trim()) {
        markAttempted(questionId);
      }
    },
    [questionId, saveSQL, markAttempted]
  );

  const navigateTo = (q: Question) => {
    router.push(`/practice/${q.id}/`);
  };

  if (!question) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Question not found.
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

  const prevQ = currentIdx > 0 ? sorted[currentIdx - 1] : null;
  const nextQ = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  // Build table hints for autocomplete
  const tableHints: Record<string, string[]> = {};
  for (const [name, result] of Object.entries(schemaTables)) {
    tableHints[name] = result.cols;
  }

  const leftPanel = (
    <ProblemPanel question={question} schemaTables={schemaTables} />
  );

  const rightPanel = (
    <>
      {!ready && (
        <p className="text-sm text-muted-foreground">Loading database...</p>
      )}

      <SQLEditor
        initialValue={sqlValue}
        onChange={handleChange}
        onRun={handleRun}
        tables={tableHints}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={handleRun} disabled={running || !ready} size="sm" className="rounded-full">
          {running ? "Running..." : "Run (⌘/Ctrl+Enter)"}
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

      {/* Solution */}
      <SolutionPanel
        solution={question.solution}
        tips={question.tips}
        optSolution={question.optSolution}
      />
    </>
  );

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={!prevQ}
          onClick={() => prevQ && navigateTo(prevQ)}
        >
          Prev
        </Button>
        <h2 className="text-sm font-semibold truncate px-2">
          {question.title}
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={!nextQ}
          onClick={() => nextQ && navigateTo(nextQ)}
        >
          Next
        </Button>
      </div>

      <SplitPane left={leftPanel} right={rightPanel} />
    </div>
  );
}
