// Client-only Pyodide runtime for the data playground.
// Loads Pyodide, holds uploaded CSVs as pandas DataFrames, runs SQL + PySpark.

export type ColMeta = { name: string; type: string };
export type TableMeta = { name: string; rows: number; cols: ColMeta[] };
export type RunResult = { cols: string[]; rows: unknown[][]; rowCount: number; ms: number };

const PYODIDE_VERSION = "0.28.3";
const DEFAULT_INDEX = "/pyodide/";
const CDN_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface PyodideInterface {
  runPython(code: string): string;
  runPythonAsync(code: string): Promise<unknown>;
  loadPackage(names: string[]): Promise<void>;
  globals: { set(name: string, value: unknown): void };
}

let pyodide: PyodideInterface | null = null;
let loadingPromise: Promise<void> | null = null;
let sqlEngine: "duckdb" | "sqlite" = "sqlite";

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.head.appendChild(s);
  });
}

export function isReady() {
  return pyodide !== null;
}

export function getSqlEngine() {
  return sqlEngine;
}

function ensure(): PyodideInterface {
  if (!pyodide) throw new Error("Python runtime is not loaded yet.");
  return pyodide;
}

export async function loadRuntime(indexURL?: string): Promise<void> {
  if (pyodide) return;
  if (loadingPromise) return loadingPromise;
  // Prefer the self-hosted copy; if it 404s during dev, fall back to the CDN.
  const primary = indexURL ?? DEFAULT_INDEX;
  loadingPromise = (async () => {
    let usedIndex = primary;
    try {
      await injectScript(`${primary}pyodide.js`);
    } catch {
      usedIndex = CDN_INDEX;
      await injectScript(`${CDN_INDEX}pyodide.js`);
    }
    pyodide = await window.loadPyodide!({ indexURL: usedIndex });
    await pyodide.loadPackage(["pandas", "micropip"]);
    // Best-effort DuckDB; fall back to sqlite3 (stdlib) if unavailable.
    try {
      await pyodide.runPythonAsync(`
import micropip
await micropip.install("duckdb")
import duckdb
`);
      sqlEngine = "duckdb";
    } catch {
      sqlEngine = "sqlite";
    }
    const shimSrc = await (await fetch("/pyspark_shim.py")).text();
    pyodide.runPython(shimSrc);
    pyodide.runPython(`
import pandas as pd, io, json
_tables = {}
spark = SparkSession()
F = functions

def _register(name, text):
    df = pd.read_csv(io.StringIO(text))
    _tables[name] = df
    spark.register(name, df)
    return json.dumps({
        "name": name,
        "rows": int(df.shape[0]),
        "cols": [{"name": str(c), "type": str(t)} for c, t in df.dtypes.items()],
    })

def _drop(name):
    _tables.pop(name, None)
    spark._tables.pop(name, None)

def _serialize(df):
    # df is a pandas.DataFrame
    obj = df.astype(object).where(pd.notnull(df), None)
    return json.dumps({
        "cols": [str(c) for c in df.columns],
        "rows": obj.values.tolist(),
        "rowCount": int(df.shape[0]),
    }, default=str)
`);
  })();
  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function registerCsv(name: string, csvText: string): Promise<TableMeta> {
  const p = ensure();
  p.globals.set("__csv_name", name);
  p.globals.set("__csv_text", csvText);
  const metaJson = p.runPython(`_register(__csv_name, __csv_text)`);
  return JSON.parse(metaJson);
}

export async function dropTable(name: string): Promise<void> {
  const p = ensure();
  p.globals.set("__drop_name", name);
  p.runPython(`_drop(__drop_name)`);
}

export async function runSql(query: string): Promise<RunResult> {
  const p = ensure();
  const t0 = performance.now();
  p.globals.set("__sql", query);
  const code =
    sqlEngine === "duckdb"
      ? `
_con = duckdb.connect()
for _n, _df in _tables.items():
    _con.register(_n, _df)
_res = _con.execute(__sql).df()
_serialize(_res)`
      : `
import sqlite3
_con = sqlite3.connect(":memory:")
for _n, _df in _tables.items():
    _df.to_sql(_n, _con, index=False, if_exists="replace")
_res = pd.read_sql_query(__sql, _con)
_con.close()
_serialize(_res)`;
  const out = JSON.parse(p.runPython(code));
  return { ...out, ms: Math.round(performance.now() - t0) };
}

export async function runPyspark(code: string): Promise<RunResult> {
  const p = ensure();
  const t0 = performance.now();
  p.globals.set("__user_code", code);
  const wrapped = `
import ast, textwrap
__src = textwrap.dedent(__user_code)
__ns = {"spark": spark, "F": F, "functions": functions, "DataFrame": DataFrame,
        "Column": Column, "pd": pd}
__mod = ast.parse(__src, mode="exec")
__last_expr = None
if __mod.body and isinstance(__mod.body[-1], ast.Expr):
    __last_expr = ast.Expression(__mod.body[-1].value)
    __mod.body = __mod.body[:-1]
exec(compile(__mod, "<user>", "exec"), __ns)
__out = None
if __last_expr is not None:
    __out = eval(compile(__last_expr, "<user>", "eval"), __ns)
elif "result" in __ns:
    __out = __ns["result"]
if __out is None:
    raise ValueError("No result. End with a DataFrame expression or assign it to 'result'.")
if hasattr(__out, "toPandas"):
    __out = __out.toPandas()
_serialize(__out)`;
  const out = JSON.parse(p.runPython(wrapped));
  return { ...out, ms: Math.round(performance.now() - t0) };
}

export function resetRuntime(): void {
  if (!pyodide) return;
  pyodide.runPython(`_tables.clear(); spark._tables.clear()`);
}
