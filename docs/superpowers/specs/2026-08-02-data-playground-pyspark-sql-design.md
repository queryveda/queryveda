# Data Playground (PySpark + SQL) — Design

**Date:** 2026-08-02
**Status:** Approved (design), pending implementation plan
**Route:** `/playground`

## 1. Overview

A free-form, in-browser **data playground** for QueryVeda. Users upload one or
more CSV files, each of which becomes a named table, then explore that data by
writing either **PySpark-style DataFrame code** or **SQL**. Results render in a
grid. No grading, no expected output — a pure scratchpad.

Everything runs client-side through a **single Pyodide (Python-in-WASM) runtime**,
consistent with QueryVeda's fully static (`output: 'export'`) deployment model.
There is no backend.

### Goals
- Upload multiple CSVs, each a named table, and query across them (joins).
- Write real, executing PySpark-flavored DataFrame code **or** SQL against the
  same data, with guaranteed-consistent results (one runtime, one data model).
- Persist the session (tables + code + language) locally so a reload restores it.

### Non-goals (YAGNI — explicitly deferred)
- Graded exercises / expected-output checking.
- Built-in sample datasets.
- JSON or paste-text input (CSV file upload only).
- Auth-gating the feature.
- Full Spark API coverage or true Spark semantics (lazy eval, partitioning).

## 2. Execution Architecture

All compute runs through **one lazily-loaded Pyodide instance**, initialized only
when the user opens `/playground` (Pyodide + packages are ~15–25 MB).

- **Upload:** each CSV is read into a **pandas DataFrame** via `pandas.read_csv`,
  registered in a single Python namespace under a sanitized table name derived
  from the filename (collisions get a numeric suffix).
- **SQL mode:** executed with **DuckDB's Python package** inside Pyodide
  (`duckdb.sql(...)`), querying the registered pandas DataFrames directly. Real
  execution, real joins.
- **PySpark mode:** a **thin, curated PySpark-shim** — a `pyspark.sql`-style
  DataFrame API (`.select()`, `.filter()`/`.where()`, `.groupBy().agg()`,
  `.join()`, `.withColumn()`, `.orderBy()`, `.limit()`, plus `F.col()` and common
  functions) implemented on top of pandas. Entry points: `spark.table("name")`
  and `spark.sql(...)`. Only a documented subset is supported; unsupported calls
  raise a friendly, explicit error.
- **Result** of either mode → a pandas DataFrame → serialized to `{cols, rows}`
  → rendered by the results view.

### Honest limitation (surfaced in the UI)
The PySpark side is **pandas-backed emulation of the DataFrame API, not a real
Spark cluster.** It is excellent for practicing DataFrame syntax and
transformations, but will not cover every Spark function nor replicate lazy
evaluation / partitioning semantics. A short inline note communicates this so
users are not misled.

### Self-hosting Pyodide
Pyodide and its wheels (pandas, duckdb) are **self-hosted from `/public/pyodide/`**,
loaded same-origin. During development we may load from the jsdelivr CDN for fast
iteration, but the shipped build vendors the files locally. Rationale: reliability
(the runtime is the feature and must not depend on a third-party CDN's uptime),
CSP/CORS cleanliness (same-origin avoids strict-CSP breakage), and exact version
pinning. Cost: ~15–25 MB added to the deploy, served free via Vercel's edge cache.

## 3. Components

New components under `components/playground/`:

- **`playground-client.tsx`** — top-level orchestrator. Owns state (tables,
  editor contents, selected language, run status), manages the Pyodide lifecycle
  (load, ready, error), and wires the pieces together.
- **`data-uploader.tsx`** — drag-and-drop + file-picker for CSVs. Lists loaded
  tables with row/column counts and a schema (column name + inferred type)
  preview. Per-table remove control.
- **`code-editor.tsx`** — a generalization of the existing
  `components/practice/sql-editor.tsx` that accepts a `language` prop
  (`"sql"` via `@codemirror/lang-sql`; `"python"` via a new
  `@codemirror/lang-python` dependency). A Python/SQL toggle switches the mode
  and language grammar. Reuses the existing site themes.
- **`results-view.tsx`** — reuses the `components/practice/result-table.tsx`
  display pattern. Shows the result grid, row count, run time, and any error
  message / traceback.

New library module under `lib/`:

- **`pyodide-runtime.ts`** — loads Pyodide, installs/loads pandas + duckdb,
  registers pandas DataFrames from CSV text, executes SQL (via duckdb) or PySpark
  (via the embedded shim), and returns `{cols, rows}` or a structured error. Holds
  the embedded PySpark-shim Python source (as a string injected into Pyodide).

## 4. Data Flow

```
Upload CSV
  → Pyodide: pandas.read_csv(text) → register DataFrame as <table_name>
User writes code + clicks Run
  → pyodide-runtime routes by language:
       SQL     → duckdb.sql(code) against registered DataFrames
       PySpark → shim executes DataFrame code on pandas
  → result pandas DataFrame → { cols, rows }
  → results-view renders grid + row count + run time
```

## 5. Persistence (local)

On change, the session is persisted to **IndexedDB** (chosen over localStorage
because CSV payloads can exceed localStorage limits):

- Raw CSV text + table names for each uploaded table.
- Editor contents: one buffer **per language** (a separate SQL buffer and
  PySpark buffer), so switching languages preserves each independently.
- Selected (last-active) language (SQL / PySpark).

On load, saved CSVs are re-ingested into Pyodide and the editor is restored. A
**"Clear session"** control wipes stored data and resets the playground.

## 6. Error Handling

- **Pyodide load failure** → clear, retryable message. The runtime is lazy-loaded
  and isolated to `/playground`, so the rest of the app is unaffected.
- **CSV parse error** → per-file inline error; other files still load.
- **SQL / Python runtime error** → caught and shown in `results-view` with the
  message/traceback; no app crash, editor state preserved.
- **Unsupported PySpark call** → the shim raises a friendly "not supported yet"
  error that names the offending method.

## 7. Navigation Integration

Add a **"Playground"** entry to `mainNav` in
`components/layout/sidebar.tsx` (with an appropriate `lucide-react` icon),
following the existing nav-item pattern. Also reachable directly at `/playground`.

## 8. New Dependencies

- `@codemirror/lang-python` — Python syntax mode for the editor.
- **Pyodide** distribution (self-hosted in `/public/pyodide/`) including the
  pandas and duckdb wheels. Loaded via `loadPyodide({ indexURL: "/pyodide/" })`.

No other runtime dependencies; DuckDB and pandas ship as Pyodide packages.
