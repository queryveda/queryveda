"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Lightbulb } from "lucide-react";
import { ExerciseVerdict } from "./exercise-verdict";
import { formulaHints, formulaHintMap } from "@/lib/excel-formula-hints";
import type { FormulaHint } from "@/lib/excel-formula-hints";
import type { ExcelExercise } from "@/lib/excel-skill-tree-types";

/* ── helpers ── */

function colLabel(c: number): string {
  return String.fromCharCode(65 + c);
}

function parseAddress(addr: string): { r: number; c: number } {
  const col = addr.charCodeAt(0) - 65;
  const row = parseInt(addr.slice(1), 10) - 1;
  return { r: row, c: col };
}

/** Build a 2D grid from the exercise data */
function buildGrid(exercise: ExcelExercise) {
  const { rows, cols, cells } = exercise.initialData;
  const grid: (string | number | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  for (const [addr, cell] of Object.entries(cells)) {
    const { r, c } = parseAddress(addr);
    if (r < rows && c < cols) {
      grid[r][c] = cell.v;
    }
  }

  return grid;
}

/** Evaluate a formula against cell data using the formula parser */
/** Resolve a cell ref or literal value */
function resolveValue(
  token: string,
  cells: Record<string, { v: string | number; f?: string }>
): string | number {
  const trimmed = token.trim();
  // Cell reference like A1, D2
  if (/^[A-Z]+\d+$/i.test(trimmed)) {
    const cell = cells[trimmed.toUpperCase()];
    return cell ? cell.v : 0;
  }
  // Quoted string
  if (/^".*"$/.test(trimmed)) return trimmed.slice(1, -1);
  // Number
  const n = Number(trimmed);
  if (!isNaN(n)) return n;
  // Boolean
  if (trimmed.toUpperCase() === "TRUE") return 1;
  if (trimmed.toUpperCase() === "FALSE") return 0;
  return trimmed;
}

/** Expand a range like A1:C3 into a 2D array of values */
function resolveRange(
  range: string,
  cells: Record<string, { v: string | number; f?: string }>
): (string | number)[][] {
  const m = range.trim().match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!m) return [];
  const c1 = m[1].toUpperCase().charCodeAt(0) - 65;
  const r1 = parseInt(m[2], 10);
  const c2 = m[3].toUpperCase().charCodeAt(0) - 65;
  const r2 = parseInt(m[4], 10);
  const result: (string | number)[][] = [];
  for (let r = r1; r <= r2; r++) {
    const row: (string | number)[] = [];
    for (let c = c1; c <= c2; c++) {
      const addr = colLabel(c) + r;
      const cell = cells[addr];
      row.push(cell ? cell.v : 0);
    }
    result.push(row);
  }
  return result;
}

/** Split top-level comma-separated arguments (respects nested parens) */
function splitArgs(s: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) args.push(current);
  return args;
}

/** Manual VLOOKUP implementation */
function manualVlookup(
  expr: string,
  cells: Record<string, { v: string | number; f?: string }>
): { result: number | string | null; error: string | null } | null {
  const m = expr.match(/^VLOOKUP\s*\((.+)\)$/i);
  if (!m) return null;
  const args = splitArgs(m[1]);
  if (args.length < 3) return { result: null, error: "Formula error: #VALUE!" };

  const lookupVal = resolveValue(args[0], cells);
  const table = resolveRange(args[1], cells);
  const colIdx = Number(resolveValue(args[2], cells));
  const exactMatch = args.length >= 4
    ? resolveValue(args[3], cells) === 0 || String(resolveValue(args[3], cells)).toUpperCase() === "FALSE"
    : false;

  if (table.length === 0 || colIdx < 1) return { result: null, error: "Formula error: #VALUE!" };

  for (const row of table) {
    const cellVal = row[0];
    const match = exactMatch
      ? String(cellVal).toLowerCase() === String(lookupVal).toLowerCase()
      : cellVal === lookupVal;
    if (match) {
      if (colIdx > row.length) return { result: null, error: "Formula error: #REF!" };
      return { result: row[colIdx - 1], error: null };
    }
  }
  return { result: null, error: "Formula error: #N/A" };
}

/** Manual XLOOKUP implementation */
function manualXlookup(
  expr: string,
  cells: Record<string, { v: string | number; f?: string }>
): { result: number | string | null; error: string | null } | null {
  const m = expr.match(/^XLOOKUP\s*\((.+)\)$/i);
  if (!m) return null;
  const args = splitArgs(m[1]);
  if (args.length < 3) return { result: null, error: "Formula error: #VALUE!" };

  const lookupVal = resolveValue(args[0], cells);
  const lookupArr = resolveRange(args[1], cells).flat();
  const returnArr = resolveRange(args[2], cells).flat();
  const notFound = args.length >= 4 ? resolveValue(args[3], cells) : null;

  const idx = lookupArr.findIndex(
    (v) => String(v).toLowerCase() === String(lookupVal).toLowerCase()
  );
  if (idx === -1) {
    if (notFound !== null) return { result: notFound, error: null };
    return { result: null, error: "Formula error: #N/A" };
  }
  return { result: idx < returnArr.length ? returnArr[idx] : 0, error: null };
}

async function evaluateFormula(
  formula: string,
  cells: Record<string, { v: string | number; f?: string }>
): Promise<{ result: number | string | null; error: string | null }> {
  try {
    const expr = formula.startsWith("=") ? formula.slice(1) : formula;

    // Manual implementations for functions the grammar parser doesn't handle
    const vlookupResult = manualVlookup(expr, cells);
    if (vlookupResult) return vlookupResult;
    const xlookupResult = manualXlookup(expr, cells);
    if (xlookupResult) return xlookupResult;

    const { Parser } = await import(
      /* webpackChunkName: "formula-parser" */
      "@fortune-sheet/formula-parser"
    );
    const parser = new Parser();

    parser.on(
      "callCellValue",
      (
        cellCoord: { label: string },
        _sheetName: unknown,
        done: (v: number | string) => void
      ) => {
        const cell = cells[cellCoord.label];
        done(cell ? cell.v : 0);
      }
    );

    parser.on(
      "callRangeValue",
      (
        startCoord: { row: { index: number }; column: { index: number } },
        endCoord: { row: { index: number }; column: { index: number } },
        _sheetName: unknown,
        done: (values: (number | string)[][]) => void
      ) => {
        const result: (number | string)[][] = [];
        for (let r = startCoord.row.index; r <= endCoord.row.index; r++) {
          const row: (number | string)[] = [];
          for (let c = startCoord.column.index; c <= endCoord.column.index; c++) {
            const addr = colLabel(c) + (r + 1);
            const cell = cells[addr];
            row.push(cell ? cell.v : 0);
          }
          result.push(row);
        }
        done(result);
      }
    );

    // Known error strings the parser returns as "success" results
    const ERROR_STRINGS = new Set([
      "DIV/0", "ERROR", "NAME?", "N/A", "NULL!", "NUM!", "REF!", "VALUE!",
    ]);

    const { result, error } = parser.parse(expr);

    if (error) {
      return { result: null, error: `Formula error: ${error}` };
    }

    // The parser's IFERROR doesn't catch errors returned as strings.
    // Detect IFERROR/IFNA wrapping and handle manually.
    if (typeof result === "string" && ERROR_STRINGS.has(result)) {
      const iferrorMatch = expr.match(/^IFERROR\s*\((.+),\s*(.+)\)$/i);
      if (iferrorMatch) {
        const fallbackExpr = iferrorMatch[2].trim();
        const fallback = parser.parse(fallbackExpr);
        if (!fallback.error) {
          return { result: fallback.result as number | string | null, error: null };
        }
      }
      // Not wrapped in IFERROR — return the error as-is
      return { result: null, error: `Formula error: #${result}` };
    }

    // Date functions return JS Date objects — convert to Excel serial numbers
    if ((result as unknown) instanceof Date && !isNaN((result as unknown as Date).getTime())) {
      const dateResult = result as unknown as Date;
      // Excel epoch: Jan 1, 1900 = serial 1, with the 1900 leap year bug (+1)
      const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));
      const serial = Math.round(
        (dateResult.getTime() - EXCEL_EPOCH.getTime()) / (24 * 60 * 60 * 1000)
      );
      return { result: serial, error: null };
    }

    return { result: result as number | string | null, error: null };
  } catch (err) {
    return { result: null, error: `Could not evaluate formula: ${err}` };
  }
}

/* ── component ── */

interface ExcelExerciseEditorProps {
  exercise: ExcelExercise;
  onPass: () => void;
}

export function ExcelExerciseEditor({
  exercise,
  onPass,
}: ExcelExerciseEditorProps) {
  const grid = useMemo(() => buildGrid(exercise), [exercise]);
  const targetAddresses = useMemo(
    () => new Set(exercise.targetCells.map((t) => t.cell)),
    [exercise]
  );

  // One input per target cell
  const [formulas, setFormulas] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const t of exercise.targetCells) {
      // Pre-fill for fix-formula exercises
      const existing = exercise.initialData.cells[t.cell];
      init[t.cell] = existing?.f ? `=${existing.f}` : "";
    }
    return init;
  });

  const [computedValues, setComputedValues] = useState<
    Record<string, string | number | null>
  >({});
  const [verdict, setVerdict] = useState<{
    type: "idle" | "pass" | "fail";
    message: string;
  }>({ type: "idle", message: "" });
  const [running, setRunning] = useState(false);
  const [hintIdx, setHintIdx] = useState(-1);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const activeInputRef = useRef<string | null>(null);
  const inputFocusedRef = useRef(false);
  // Cursor position saved on blur so we can insert at the right spot
  const cursorPosRef = useRef<number>(0);

  // Drag-to-select state
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<FormulaHint[]>([]);
  const [activeFunction, setActiveFunction] = useState<FormulaHint | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  /** Extract what the user is currently typing for autocomplete */
  const updateHints = useCallback((value: string, cursorPos: number) => {
    if (!value.startsWith("=")) {
      setSuggestions([]);
      setActiveFunction(null);
      return;
    }

    const textBeforeCursor = value.slice(1, cursorPos); // after "="

    // Check if we're inside a function call — find the innermost open function
    let depth = 0;
    let lastFnStart = -1;
    for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
      if (textBeforeCursor[i] === ")") depth++;
      if (textBeforeCursor[i] === "(") {
        if (depth > 0) { depth--; continue; }
        lastFnStart = i;
        break;
      }
    }

    if (lastFnStart >= 0) {
      // We're inside parentheses — extract the function name before "("
      const beforeParen = textBeforeCursor.slice(0, lastFnStart);
      const fnMatch = beforeParen.match(/([A-Z]+)$/i);
      if (fnMatch) {
        const fn = formulaHintMap.get(fnMatch[1].toUpperCase());
        setActiveFunction(fn ?? null);
      }
      setSuggestions([]);
      return;
    }

    // Not inside parens — check if user is typing a function name
    const partial = textBeforeCursor.match(/([A-Z]+)$/i);
    if (partial && partial[1].length >= 1) {
      const query = partial[1].toUpperCase();
      const matches = formulaHints
        .filter((h) => h.name.startsWith(query))
        .slice(0, 6);
      setSuggestions(matches);
      setSelectedSuggestion(0);
      setActiveFunction(null);
    } else {
      setSuggestions([]);
      setActiveFunction(null);
    }
  }, []);

  const handleFormulaChange = useCallback((cell: string, value: string) => {
    setFormulas((prev) => ({ ...prev, [cell]: value }));
    setVerdict({ type: "idle", message: "" });
    // Update hints based on current input
    const input = inputRefs.current[cell];
    const cursorPos = input?.selectionStart ?? value.length;
    updateHints(value, cursorPos);
  }, [updateHints]);

  /** Accept a suggestion from the autocomplete dropdown */
  const acceptSuggestion = useCallback((hint: FormulaHint) => {
    const targetCell = activeInputRef.current;
    if (!targetCell) return;
    const input = inputRefs.current[targetCell];
    if (!input) return;

    const value = input.value;
    const cursor = input.selectionStart ?? value.length;
    // Find the start of the partial function name
    const textBefore = value.slice(0, cursor);
    const partialMatch = textBefore.match(/([A-Z]+)$/i);
    const partialStart = partialMatch
      ? cursor - partialMatch[1].length
      : cursor;

    const inserted = hint.name + "(";
    const newValue = value.slice(0, partialStart) + inserted + value.slice(cursor);

    setFormulas((prev) => ({ ...prev, [targetCell]: newValue }));
    setSuggestions([]);
    setActiveFunction(hint);

    requestAnimationFrame(() => {
      input.focus();
      const newPos = partialStart + inserted.length;
      input.setSelectionRange(newPos, newPos);
      cursorPosRef.current = newPos;
    });
  }, []);

  /** Insert a cell/range reference into the active formula input */
  const insertReference = useCallback(
    (ref: string) => {
      if (!activeInputRef.current) return;

      const targetCell = activeInputRef.current;
      const input = inputRefs.current[targetCell];
      if (!input) return;

      // Read current value directly from the DOM to avoid stale closure
      const current = input.value;
      const pos = cursorPosRef.current;
      const newValue = current.slice(0, pos) + ref + current.slice(pos);

      setFormulas((prev) => ({ ...prev, [targetCell]: newValue }));
      setVerdict({ type: "idle", message: "" });

      // Refocus and place cursor after the inserted reference
      requestAnimationFrame(() => {
        input.focus();
        const newPos = pos + ref.length;
        input.setSelectionRange(newPos, newPos);
        cursorPosRef.current = newPos;
      });
    },
    []
  );

  /** Build the reference string from drag start/end */
  const buildRangeRef = (start: string, end: string): string => {
    if (start === end) return start;
    return `${start}:${end}`;
  };

  const handleCellMouseDown = useCallback(
    (addr: string) => {
      if (!inputFocusedRef.current || !activeInputRef.current) return;
      isDraggingRef.current = true;
      setDragStart(addr);
      setDragEnd(addr);
    },
    []
  );

  const handleCellMouseEnter = useCallback(
    (addr: string) => {
      if (!isDraggingRef.current) return;
      setDragEnd(addr);
    },
    []
  );

  const handleCellMouseUp = useCallback(() => {
    if (!isDraggingRef.current || !dragStart) return;
    isDraggingRef.current = false;
    const ref = buildRangeRef(dragStart, dragEnd ?? dragStart);
    insertReference(ref);
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, insertReference]);

  /** Compute which cells are in the current drag selection for highlighting */
  const dragSelection = useMemo(() => {
    if (!dragStart) return new Set<string>();
    const end = dragEnd ?? dragStart;
    const s = parseAddress(dragStart);
    const e = parseAddress(end);
    const minR = Math.min(s.r, e.r), maxR = Math.max(s.r, e.r);
    const minC = Math.min(s.c, e.c), maxC = Math.max(s.c, e.c);
    const cells = new Set<string>();
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        cells.add(colLabel(c) + (r + 1));
      }
    }
    return cells;
  }, [dragStart, dragEnd]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setVerdict({ type: "idle", message: "" });

    try {
      // Build cells map including user formulas
      const mergedCells = { ...exercise.initialData.cells };

      let allCorrect = true;
      const failures: string[] = [];
      const newComputed: Record<string, string | number | null> = {};

      for (const target of exercise.targetCells) {
        const userFormula = formulas[target.cell]?.trim() || "";

        if (!userFormula) {
          allCorrect = false;
          failures.push(`Cell ${target.cell}: no formula entered`);
          newComputed[target.cell] = null;
          continue;
        }

        if (!userFormula.startsWith("=")) {
          // Treat as literal value
          const literal =
            isNaN(Number(userFormula)) ? userFormula : Number(userFormula);
          newComputed[target.cell] = literal;

          let matches = false;
          if (typeof target.expected === "number" && typeof literal === "number") {
            matches = Math.abs(literal - target.expected) < 0.01;
          } else {
            matches =
              String(literal).trim().toLowerCase() ===
              String(target.expected).trim().toLowerCase();
          }

          if (!matches) {
            allCorrect = false;
            failures.push(
              `Cell ${target.cell}: expected ${target.expected}, got ${literal}`
            );
          }
          continue;
        }

        // Evaluate the formula
        const { result, error } = await evaluateFormula(
          userFormula,
          mergedCells
        );

        if (error) {
          allCorrect = false;
          failures.push(`Cell ${target.cell}: ${error}`);
          newComputed[target.cell] = null;
          continue;
        }

        newComputed[target.cell] = result;

        let matches = false;
        if (
          typeof target.expected === "number" &&
          typeof result === "number"
        ) {
          matches = Math.abs(result - target.expected) < 0.01;
        } else {
          matches =
            String(result ?? "")
              .trim()
              .toLowerCase() ===
            String(target.expected).trim().toLowerCase();
        }

        if (!matches) {
          allCorrect = false;
          failures.push(
            `Cell ${target.cell}: expected ${target.expected}, got ${result ?? "(empty)"}`
          );
        }
      }

      setComputedValues(newComputed);

      if (allCorrect) {
        setVerdict({ type: "pass", message: "Correct!" });
        onPass();
      } else {
        setVerdict({ type: "fail", message: failures.join(". ") });
      }
    } catch {
      setVerdict({
        type: "fail",
        message: "Error evaluating formula. Please try again.",
      });
    }

    setRunning(false);
  }, [exercise, formulas, onPass]);

  const handleReset = () => {
    const init: Record<string, string> = {};
    for (const t of exercise.targetCells) {
      const existing = exercise.initialData.cells[t.cell];
      init[t.cell] = existing?.f ? `=${existing.f}` : "";
    }
    setFormulas(init);
    setComputedValues({});
    setVerdict({ type: "idle", message: "" });
    setHintIdx(-1);
  };

  const { rows, cols } = exercise.initialData;

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <h4 className="font-semibold">{exercise.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {exercise.instruction}
        </p>
      </div>

      {/* Spreadsheet-style grid */}
      <div className="overflow-x-auto border-b">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-10 min-w-[2.5rem] bg-muted/50 border-b border-r p-1 text-center text-xs text-muted-foreground font-medium" />
              {Array.from({ length: cols }, (_, c) => (
                <th
                  key={c}
                  className="min-w-[5rem] bg-muted/50 border-b border-r p-1 text-center text-xs text-muted-foreground font-medium"
                >
                  {colLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) =>
              (
                <tr key={r}>
                  <td className="bg-muted/50 border-b border-r p-1 text-center text-xs text-muted-foreground font-medium">
                    {r + 1}
                  </td>
                  {Array.from({ length: cols }, (_, c) => {
                    const addr = colLabel(c) + (r + 1);
                    const isTarget = targetAddresses.has(addr);

                    if (isTarget) {
                      const computed = computedValues[addr];
                      return (
                        <td
                          key={c}
                          className="border-b border-r p-0 bg-primary/5 relative"
                        >
                          <input
                            ref={(el) => { inputRefs.current[addr] = el; }}
                            type="text"
                            value={formulas[addr] ?? ""}
                            onChange={(e) =>
                              handleFormulaChange(addr, e.target.value)
                            }
                            onFocus={() => {
                              activeInputRef.current = addr;
                              inputFocusedRef.current = true;
                            }}
                            onBlur={(e) => {
                              cursorPosRef.current = e.currentTarget.selectionStart ?? e.currentTarget.value.length;
                              // Delay clearing so mousedown on data cell fires first
                              setTimeout(() => {
                                inputFocusedRef.current = false;
                                setSuggestions([]);
                                setActiveFunction(null);
                              }, 300);
                            }}
                            onSelect={(e) => {
                              cursorPosRef.current = (e.target as HTMLInputElement).selectionStart ?? 0;
                            }}
                            onKeyDown={(e) => {
                              if (suggestions.length > 0) {
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setSelectedSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
                                  return;
                                }
                                if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setSelectedSuggestion((i) => Math.max(i - 1, 0));
                                  return;
                                }
                                if (e.key === "Tab" || e.key === "Enter") {
                                  e.preventDefault();
                                  acceptSuggestion(suggestions[selectedSuggestion]);
                                  return;
                                }
                                if (e.key === "Escape") {
                                  setSuggestions([]);
                                  return;
                                }
                              }
                              if (e.key === "Enter") handleRun();
                            }}
                            placeholder={`Enter formula in ${addr}`}
                            className="w-full h-full px-2 py-1.5 text-sm bg-transparent outline-none border-2 border-primary/30 focus:border-primary rounded-none font-mono"
                          />
                          {/* Formula autocomplete dropdown */}
                          {activeInputRef.current === addr && suggestions.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 mt-0 bg-card border rounded-lg shadow-lg overflow-hidden text-xs">
                              {suggestions.map((hint, i) => (
                                <button
                                  key={hint.name}
                                  className={`w-full text-left px-3 py-1.5 hover:bg-muted/50 flex items-center justify-between gap-2 ${
                                    i === selectedSuggestion ? "bg-muted/70" : ""
                                  }`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    acceptSuggestion(hint);
                                  }}
                                >
                                  <span className="font-mono font-medium">{hint.name}</span>
                                  <span className="text-muted-foreground truncate">{hint.description}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Active function parameter hint */}
                          {activeInputRef.current === addr && activeFunction && suggestions.length === 0 && (
                            <div className="absolute z-50 left-0 right-0 mt-0 bg-card border rounded-lg shadow-lg px-3 py-2 text-xs">
                              <div className="font-mono text-primary font-medium">{activeFunction.signature}</div>
                              <div className="text-muted-foreground mt-0.5">{activeFunction.description}</div>
                            </div>
                          )}
                          {computed != null && (
                            <div className="px-2 pb-1 text-xs text-muted-foreground">
                              = {String(computed)}
                            </div>
                          )}
                        </td>
                      );
                    }

                    const inDrag = dragSelection.has(addr);
                    return (
                      <td
                        key={c}
                        className={`border-b border-r px-2 py-1.5 tabular-nums select-none ${
                          inputFocusedRef.current
                            ? "cursor-cell hover:bg-primary/10"
                            : ""
                        } ${inDrag ? "bg-primary/20" : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCellMouseDown(addr);
                        }}
                        onMouseEnter={() => handleCellMouseEnter(addr)}
                        onMouseUp={handleCellMouseUp}
                      >
                        {grid[r]?.[c] ?? ""}
                      </td>
                    );
                  })}
                </tr>
              )
            )}
          </tbody>
        </table>
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
