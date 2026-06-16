"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Lightbulb } from "lucide-react";
import { ExerciseVerdict } from "./exercise-verdict";
import type { ExcelExercise } from "@/lib/excel-skill-tree-types";
import type { WorkbookInstance } from "@fortune-sheet/react";

const Workbook = dynamic(
  () => import("@fortune-sheet/react").then((mod) => mod.Workbook),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
  }
);

interface ExcelExerciseEditorProps {
  exercise: ExcelExercise;
  onPass: () => void;
}

function buildSheetData(exercise: ExcelExercise) {
  const celldata: {
    r: number;
    c: number;
    v: { v?: string | number; f?: string; m?: string };
  }[] = [];

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
  const [verdict, setVerdict] = useState<{
    type: "idle" | "pass" | "fail";
    message: string;
  }>({ type: "idle", message: "" });
  const [running, setRunning] = useState(false);
  const [hintIdx, setHintIdx] = useState(-1);
  const [key, setKey] = useState(0); // for reset

  const workbookRef = useRef<WorkbookInstance | null>(null);

  const sheetData = useMemo(() => buildSheetData(exercise), [exercise]);

  const handleRun = useCallback(() => {
    setRunning(true);
    setVerdict({ type: "idle", message: "" });

    try {
      const wb = workbookRef.current;

      if (!wb) {
        setVerdict({
          type: "fail",
          message: "Could not read spreadsheet data. Try again.",
        });
        setRunning(false);
        return;
      }

      let allCorrect = true;
      const failures: string[] = [];

      for (const target of exercise.targetCells) {
        const { r, c } = parseAddress(target.cell);
        // getCellValue returns the computed value for the cell
        const cellValue = wb.getCellValue(r, c, { type: "v" });

        let matches = false;
        if (
          typeof target.expected === "number" &&
          typeof cellValue === "number"
        ) {
          matches = Math.abs(cellValue - target.expected) < 0.01;
        } else {
          matches =
            String(cellValue ?? "")
              .trim()
              .toLowerCase() ===
            String(target.expected).trim().toLowerCase();
        }

        if (!matches) {
          allCorrect = false;
          failures.push(
            `Cell ${target.cell}: expected "${target.expected}", got "${cellValue ?? "(empty)"}`
          );
        }
      }

      if (allCorrect) {
        setVerdict({ type: "pass", message: "Correct!" });
        onPass();
      } else {
        setVerdict({ type: "fail", message: failures.join(". ") });
      }
    } catch {
      setVerdict({
        type: "fail",
        message: "Error reading spreadsheet. Please try again.",
      });
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
        <p className="text-sm text-muted-foreground mt-1">
          {exercise.instruction}
        </p>
      </div>

      {/* Spreadsheet */}
      <div className="h-72 border-b">
        <Workbook
          key={key}
          ref={workbookRef}
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
        <Button
          onClick={handleRun}
          disabled={running}
          size="sm"
          className="gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          Check Answer
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
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
            <p
              key={i}
              className="text-sm text-amber-600 dark:text-amber-400 mt-1"
            >
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
