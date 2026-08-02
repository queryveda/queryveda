"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Trash2, Loader2 } from "lucide-react";
import { CodeEditor } from "./code-editor";
import { DataUploader } from "./data-uploader";
import { ResultsView } from "./results-view";
import * as rt from "@/lib/pyodide-runtime";
import { saveSession, loadSession, clearSession } from "@/lib/playground-session";

const DEFAULT_SQL = "SELECT *\nFROM my_table\nLIMIT 10;";
const DEFAULT_PYSPARK =
  '# "spark" and "F" are ready. End with a DataFrame.\n' +
  'df = spark.table("my_table")\n' +
  "df";

export function PlaygroundClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [tables, setTables] = useState<rt.TableMeta[]>([]);
  const [language, setLanguage] = useState<"sql" | "python">("sql");
  const [sqlBuffer, setSqlBuffer] = useState(DEFAULT_SQL);
  const [pysparkBuffer, setPysparkBuffer] = useState(DEFAULT_PYSPARK);
  const [result, setResult] = useState<rt.RunResult | null>(null);
  const [runErr, setRunErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const restored = useRef(false);
  const csvMap = useRef<Record<string, string>>({});

  // Load Pyodide + restore session on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        await rt.loadRuntime();
        const saved = await loadSession();
        if (!cancelled && saved) {
          setSqlBuffer(saved.sqlBuffer || DEFAULT_SQL);
          setPysparkBuffer(saved.pysparkBuffer || DEFAULT_PYSPARK);
          setLanguage(saved.language || "sql");
          const metas: rt.TableMeta[] = [];
          for (const t of saved.tables) {
            csvMap.current[t.name] = t.csv;
            metas.push(await rt.registerCsv(t.name, t.csv));
          }
          if (!cancelled) setTables(metas);
        }
        if (!cancelled) {
          restored.current = true;
          setStatus("ready");
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadErr(errText(e));
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist session whenever tables or buffers change (after restore).
  const persist = useCallback(() => {
    if (!restored.current) return;
    void saveSession({
      tables: tables.map((t) => ({ name: t.name, csv: csvMap.current[t.name] || "" })),
      sqlBuffer,
      pysparkBuffer,
      language,
    });
  }, [tables, sqlBuffer, pysparkBuffer, language]);
  useEffect(() => {
    persist();
  }, [persist]);

  const sanitize = (fname: string) => {
    let base = fname
      .replace(/\.csv$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    if (/^[0-9]/.test(base)) base = "t_" + base;
    let name = base || "table";
    let i = 1;
    while (tables.some((t) => t.name === name)) name = `${base}_${i++}`;
    return name;
  };

  const onAddFiles = async (files: File[]) => {
    for (const f of files) {
      try {
        const text = await f.text();
        const name = sanitize(f.name);
        csvMap.current[name] = text;
        const meta = await rt.registerCsv(name, text);
        setTables((prev) => [...prev, meta]);
      } catch (e: unknown) {
        setRunErr(`Failed to load ${f.name}: ${errText(e)}`);
      }
    }
  };

  const onRemove = async (name: string) => {
    await rt.dropTable(name);
    delete csvMap.current[name];
    setTables((prev) => prev.filter((t) => t.name !== name));
  };

  const run = async () => {
    setRunning(true);
    setRunErr(null);
    setResult(null);
    try {
      const code = language === "sql" ? sqlBuffer : pysparkBuffer;
      const res =
        language === "sql" ? await rt.runSql(code) : await rt.runPyspark(code);
      setResult(res);
    } catch (e: unknown) {
      setRunErr(errText(e).replace(/\n\s*at .*/g, ""));
    } finally {
      setRunning(false);
    }
  };

  const onClear = async () => {
    await clearSession();
    rt.resetRuntime();
    csvMap.current = {};
    setTables([]);
    setSqlBuffer(DEFAULT_SQL);
    setPysparkBuffer(DEFAULT_PYSPARK);
    setResult(null);
    setRunErr(null);
  };

  const schema: Record<string, string[]> = Object.fromEntries(
    tables.map((t) => [t.name, t.cols.map((c) => c.name)])
  );

  if (status === "error")
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-destructive">Failed to load the Python runtime.</p>
        <p className="mt-2 text-sm text-muted-foreground">{loadErr}</p>
        <button
          onClick={() => location.reload()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Data Playground</h1>
        <p className="text-sm text-muted-foreground">
          Upload CSVs and explore them with PySpark or SQL — runs entirely in
          your browser.
        </p>
      </header>

      {status === "loading" && (
        <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Python runtime
          (one-time, ~15 MB)…
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3">
          <DataUploader
            tables={tables}
            onAddFiles={onAddFiles}
            onRemove={onRemove}
            disabled={status !== "ready"}
          />
          <button
            onClick={onClear}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear session
          </button>
        </aside>

        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
              {(["sql", "python"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`rounded-md px-3 py-1 ${
                    language === l
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {l === "sql" ? "SQL" : "PySpark"}
                </button>
              ))}
            </div>
            <button
              onClick={run}
              disabled={status !== "ready" || running}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}{" "}
              Run
            </button>
          </div>

          {language === "python" && (
            <p className="rounded-md bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
              PySpark here is a pandas-backed emulation of the DataFrame API —
              great for syntax practice, not a real Spark cluster.
            </p>
          )}

          <CodeEditor
            language={language}
            value={language === "sql" ? sqlBuffer : pysparkBuffer}
            onChange={language === "sql" ? setSqlBuffer : setPysparkBuffer}
            onRun={run}
            tables={schema}
          />
          <ResultsView result={result} error={runErr} running={running} />
        </section>
      </div>
    </div>
  );
}

function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
