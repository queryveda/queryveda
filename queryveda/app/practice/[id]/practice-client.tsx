"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuestionById, getSortedQuestions } from "@/lib/questions";
import { runTests, executeQuery, explainQuery, type QueryResult, type PlanNode } from "@/lib/pglite";
import { usePGlite } from "@/hooks/use-pglite";
import { useStorage } from "@/hooks/use-storage";
import { useAuth } from "@/hooks/use-auth";
import type { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SplitPane } from "@/components/practice/split-pane";
import { ProblemPanel } from "@/components/practice/problem-panel";
import { SQLEditor } from "@/components/practice/sql-editor";
import { HintsPanel } from "@/components/practice/hints-panel";
import { SolutionPanel } from "@/components/practice/solution-panel";
import { ResultTable } from "@/components/practice/result-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlanViewer } from "@/components/practice/plan-viewer";
import { AuthModal } from "@/components/auth/auth-modal";
import { StruggleBanner } from "@/components/practice/struggle-banner";
import { getNextSuggestion } from "@/lib/next-question";
import { DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";
import { storage } from "@/lib/storage";

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
  const { user } = useAuth();
  const { db, ready, error: dbError } = usePGlite();
  const { getSavedSQL, saveSQL, markSolved, markAttempted } = useStorage();

  const [sqlValue, setSqlValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict>({
    type: "idle",
    message: "",
  });
  const [userResult, setUserResult] = useState<QueryResult | null>(null);
  const [planResult, setPlanResult] = useState<PlanNode | null>(null);
  const [outputTab, setOutputTab] = useState<"results" | "plan">("results");
  const [schemaTables, setSchemaTables] = useState<
    Record<string, QueryResult>
  >({});
  const [running, setRunning] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [failCount, setFailCount] = useState(0);

  // Ref to avoid stale closure in onRun callback
  const sqlRef = useRef(sqlValue);
  sqlRef.current = sqlValue;

  // Compute next question suggestion only when verdict changes to pass
  const suggestion = useMemo(
    () => verdict.type === "pass" && question ? getNextSuggestion(question, storage.isSolved) : null,
    [verdict.type, question]
  );

  // Access control
  const isEasy = question?.difficulty === "Easy";
  const isLocked = !user && question && !isEasy; // Medium/Hard locked without login
  const editorDisabled = !user; // Editor disabled for all difficulties without login

  // Load saved SQL and set up schema on question/db change
  useEffect(() => {
    if (!ready || !db || !question) return;

    const saved = getSavedSQL(questionId);
    setSqlValue(saved);
    setVerdict({ type: "idle", message: "" });
    setUserResult(null);
    setPlanResult(null);
    setOutputTab("results");

    async function setupSchema() {
      try {
        await db!.exec(question!.setup);
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
    if (!user) return; // guard
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

      // Run EXPLAIN in parallel (non-blocking — failure is silent)
      explainQuery(db, trimmed).then(setPlanResult);

      if (result.passed) {
        markSolved(questionId);
      } else {
        markAttempted(questionId);
        setFailCount((prev) => prev + 1);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setVerdict({ type: "fail", message: msg });
    } finally {
      setRunning(false);
    }
  }, [db, question, questionId, markSolved, markAttempted, user]);

  const handleChange = useCallback(
    (value: string) => {
      if (!user) return; // guard
      setSqlValue(value);
      saveSQL(questionId, value);
      if (value.trim()) {
        markAttempted(questionId);
      }
    },
    [questionId, saveSQL, markAttempted, user]
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

  // Medium/Hard without login — block the entire page
  if (isLocked) {
    return (
      <div>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary"
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
            className="rounded-full border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary"
            disabled={!nextQ}
            onClick={() => nextQ && navigateTo(nextQ)}
          >
            Next
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center gap-5 px-4 py-24 text-center">
          <div className="text-5xl">🔒</div>
          <h3 className="text-2xl font-bold">
            This is a {question.difficulty} problem
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Medium and Hard difficulty questions require a free account.
            Sign in to unlock all 75 problems, track your progress, and
            compete on the leaderboard.
          </p>
          <Button onClick={() => setAuthOpen(true)} size="lg" className="rounded-full px-8">
            Sign In to Unlock
          </Button>
        </div>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  const leftPanel = (
    <ProblemPanel question={question} schemaTables={schemaTables} />
  );

  const rightPanel = editorDisabled ? (
    // Easy question but not logged in — show disabled editor area
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div className="pointer-events-none opacity-40">
          <SQLEditor
            initialValue=""
            onChange={() => {}}
            onRun={() => {}}
            tables={tableHints}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={() => setAuthOpen(true)}
            className="rounded-full shadow-lg"
          >
            Sign In to Write SQL
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <>
      {!ready && (
            <p className="text-sm text-muted-foreground">
              Loading database...
            </p>
          )}

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
              {running ? "Running..." : "Run (⌘/Ctrl+Enter)"}
            </Button>
          </div>

          {/* Struggle banner */}
          {question && <StruggleBanner question={question} failCount={failCount} />}

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

          {/* Next question suggestion */}
          {verdict.type === "pass" && !suggestion && (
            <div className="rounded-xl bg-muted/30 border border-primary/20 p-3 text-sm text-muted-foreground">
              You&apos;ve solved all {sorted.length} questions! Congratulations!
            </div>
          )}
          {verdict.type === "pass" && suggestion && (
            <div className="rounded-xl bg-muted/30 border border-primary/20 p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Up Next</p>
              <p className="text-sm font-medium">
                {suggestion.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: DIFFICULTY_COLORS[suggestion.difficulty] + "1a",
                    color: DIFFICULTY_COLORS[suggestion.difficulty],
                  }}
                >
                  {suggestion.difficulty}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: TOPIC_COLORS[suggestion.topic] + "1a",
                    color: TOPIC_COLORS[suggestion.topic],
                  }}
                >
                  {suggestion.topic}
                </span>
                <Button
                  size="sm"
                  className="rounded-full ml-auto h-7 text-xs"
                  onClick={() => navigateTo(suggestion)}
                >
                  Go &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* Output tabs */}
          {userResult && (
            <Tabs value={outputTab} onValueChange={(v) => setOutputTab(v as "results" | "plan")}>
              <TabsList>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="plan">Plan</TabsTrigger>
              </TabsList>
              <TabsContent value="results">
                <ResultTable cols={userResult.cols} rows={userResult.rows} />
              </TabsContent>
              <TabsContent value="plan">
                <PlanViewer plan={planResult} />
              </TabsContent>
            </Tabs>
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
          className="rounded-full border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary"
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
          className="rounded-full border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary"
          disabled={!nextQ}
          onClick={() => nextQ && navigateTo(nextQ)}
          data-tour="next-question"
        >
          Next
        </Button>
      </div>

      <SplitPane left={leftPanel} right={rightPanel} />

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
