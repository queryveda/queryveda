"use client";

import { displayValue } from "@/lib/pglite";

interface ResultTableProps {
  cols: string[];
  rows: unknown[][];
}

export function ResultTable({ cols, rows }: ResultTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground italic">(no rows)</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-primary/20 -mx-1 sm:mx-0">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b bg-muted/50">
            {cols.map((c) => (
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
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b last:border-0">
              {row.map((cell, ci) => {
                const display = displayValue(cell);
                return (
                  <td key={ci} className="px-3 py-2">
                    {display === null ? (
                      <span className="italic text-muted-foreground">NULL</span>
                    ) : (
                      display
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
