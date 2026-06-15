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
