"use client";

import type { RunResult } from "@/lib/pyodide-runtime";

interface Props {
  result: RunResult | null;
  error: string | null;
  running: boolean;
}

export function ResultsView({ result, error, running }: Props) {
  if (running)
    return (
      <p className="text-sm text-muted-foreground italic">Running…</p>
    );
  if (error)
    return (
      <pre className="whitespace-pre-wrap rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive overflow-x-auto">
        {error}
      </pre>
    );
  if (!result)
    return (
      <p className="text-sm text-muted-foreground italic">
        Run a query to see results.
      </p>
    );
  if (result.rowCount === 0)
    return <p className="text-sm text-muted-foreground italic">(no rows)</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl border border-primary/20">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b bg-muted/50">
              {result.cols.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2 text-left font-medium text-muted-foreground"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.slice(0, 500).map((row, ri) => (
              <tr key={ri} className="border-b last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2">
                    {cell === null ? (
                      <span className="italic text-muted-foreground">NULL</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        {result.rowCount} row{result.rowCount === 1 ? "" : "s"} · {result.ms} ms
        {result.rowCount > 500 ? " · showing first 500" : ""}
      </p>
    </div>
  );
}
