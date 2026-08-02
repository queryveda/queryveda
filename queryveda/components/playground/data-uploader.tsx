"use client";

import { useRef, useState } from "react";
import { Upload, X, Table2 } from "lucide-react";
import type { TableMeta } from "@/lib/pyodide-runtime";

interface Props {
  tables: TableMeta[];
  onAddFiles: (files: File[]) => void;
  onRemove: (name: string) => void;
  disabled?: boolean;
}

export function DataUploader({ tables, onAddFiles, onRemove, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const pick = (fl: FileList | null) => {
    if (!fl) return;
    onAddFiles(
      Array.from(fl).filter((f) => f.name.toLowerCase().endsWith(".csv"))
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!disabled) pick(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm cursor-pointer transition-colors ${
          drag ? "border-primary bg-primary/5" : "border-border"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <span className="text-muted-foreground">
          Drop CSV files or click to upload
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {tables.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tables.map((t) => (
            <li key={t.name} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-sm font-medium">
                  <Table2 className="h-4 w-4 text-primary" /> {t.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t.rows} rows
                  </span>
                  <button
                    onClick={() => onRemove(t.name)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${t.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.cols.map((c) => (
                  <span
                    key={c.name}
                    className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {c.name}
                    <span className="opacity-60"> :{c.type}</span>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
