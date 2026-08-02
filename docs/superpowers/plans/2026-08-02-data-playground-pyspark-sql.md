# Data Playground (PySpark + SQL) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/playground` section to QueryVeda where users upload CSVs and query them with executing PySpark-style DataFrame code or SQL, entirely in-browser.

**Architecture:** A single lazily-loaded Pyodide (Python-in-WASM) runtime holds uploaded CSVs as pandas DataFrames. SQL runs via DuckDB's Python package (falling back to stdlib `sqlite3` if the DuckDB wheel won't load). PySpark runs via a curated, pandas-backed shim exposing a `pyspark.sql`-style API. Results serialize to `{cols, rows}` and render in a grid. Session persists in IndexedDB.

**Tech Stack:** Next.js 14 (static export), React 18, TypeScript, Tailwind, CodeMirror 6, Pyodide (self-hosted), pandas, DuckDB/sqlite3, IndexedDB.

## Global Constraints

- App is static export (`output: 'export'`) — no server code, no API routes. All runtime work is client-side (`"use client"`).
- Pyodide loads **lazily**, only on `/playground`, and must not affect any other route.
- Ship self-hosted Pyodide from `/public/pyodide/`; CDN allowed only during dev.
- New deps limited to: `@codemirror/lang-python`. Pyodide/pandas/duckdb are loaded via Pyodide, not npm.
- PySpark side is explicitly labeled in-UI as "pandas-backed emulation, not real Spark."
- Follow existing patterns: routes are folders under `app/`; components under `components/playground/`; reuse the `result-table.tsx` and `sql-editor.tsx` patterns.
- `npx tsc` is NOT available locally; verify types via `npm run build` (`next build`).

---

## Phase 1 — PySpark Shim (pure Python, TDD)

The shim is pure pandas, so it is fully testable locally with pytest against real pandas. This is the highest-risk logic and gets real tests.

### Task 1: PySpark shim core (DataFrame, select, filter, columns)

**Files:**
- Create: `queryveda/public/pyspark_shim.py` (the shim source; also loaded into Pyodide as a string)
- Create: `queryveda/scripts/shim_tests/test_shim.py` (pytest)
- Create: `queryveda/scripts/shim_tests/requirements.txt` (`pandas`, `pytest`)

**Interfaces:**
- Produces:
  - `class Column` — wraps a column expression; supports `==, !=, >, >=, <, <=, & , |, ~` returning boolean-mask Columns; `.alias(name)`.
  - `class DataFrame` — wraps a pandas `DataFrame`. Methods added across Tasks 1–3.
  - `class SparkSession` — `spark.table(name) -> DataFrame`, `spark.createDataFrame(pdf)`, `spark.sql(q)` (Task added later via runtime); registry `_tables: dict[str, pd.DataFrame]`.
  - `functions` module alias `F` — `F.col(name) -> Column`, `F.lit(v) -> Column`.
  - `DataFrame.select(*cols)`, `DataFrame.filter(condition)` / `.where(...)`, `DataFrame.columns -> list[str]`, `DataFrame.toPandas() -> pd.DataFrame`.

- [ ] **Step 1: Create the test venv and requirements**

Create `queryveda/scripts/shim_tests/requirements.txt`:
```
pandas
pytest
```

Run (sets up an isolated venv so local Python stays clean):
```bash
cd queryveda/scripts/shim_tests
python3 -m venv .venv && ./.venv/bin/pip install -q -r requirements.txt
```

- [ ] **Step 2: Write the failing test**

Create `queryveda/scripts/shim_tests/test_shim.py`. The shim file lives at `queryveda/public/pyspark_shim.py`; load it by path so tests exercise the exact shipped source:
```python
import importlib.util, os, pandas as pd, pytest

SHIM = os.path.join(os.path.dirname(__file__), "..", "..", "public", "pyspark_shim.py")

def load():
    spec = importlib.util.spec_from_file_location("pyspark_shim", SHIM)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m

@pytest.fixture
def spark():
    m = load()
    s = m.SparkSession()
    s.register("people", pd.DataFrame({"name": ["ann", "bob", "cy"], "age": [30, 25, 40]}))
    return m, s

def test_select_and_columns(spark):
    m, s = spark
    df = s.table("people").select("name", "age")
    assert df.columns == ["name", "age"]
    assert df.toPandas().shape == (3, 2)

def test_filter_gt(spark):
    m, s = spark
    F = m.functions
    df = s.table("people").filter(F.col("age") > 28)
    assert sorted(df.toPandas()["name"].tolist()) == ["ann", "cy"]

def test_filter_and_or(spark):
    m, s = spark
    F = m.functions
    df = s.table("people").where((F.col("age") > 28) & (F.col("name") != "cy"))
    assert df.toPandas()["name"].tolist() == ["ann"]
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd queryveda/scripts/shim_tests && ./.venv/bin/python -m pytest test_shim.py -q`
Expected: FAIL (module/attributes not defined).

- [ ] **Step 4: Write minimal implementation**

Create `queryveda/public/pyspark_shim.py`:
```python
"""Pandas-backed emulation of a subset of the PySpark DataFrame API.
NOT real Spark: no lazy eval, no partitioning. For syntax/transform practice.
"""
import pandas as pd


class Column:
    def __init__(self, name=None, series_fn=None, _name=None):
        # series_fn: DataFrame(pandas) -> pd.Series
        self._name = _name if _name is not None else name
        if series_fn is not None:
            self._fn = series_fn
        else:
            self._fn = lambda pdf: pdf[name]

    def _binop(self, other, op, label):
        other_fn = other._fn if isinstance(other, Column) else (lambda pdf: other)
        return Column(series_fn=lambda pdf: op(self._fn(pdf), other_fn(pdf)),
                      _name=self._name)

    def __eq__(self, o): return self._binop(o, lambda a, b: a == b, "eq")
    def __ne__(self, o): return self._binop(o, lambda a, b: a != b, "ne")
    def __gt__(self, o): return self._binop(o, lambda a, b: a > b, "gt")
    def __ge__(self, o): return self._binop(o, lambda a, b: a >= b, "ge")
    def __lt__(self, o): return self._binop(o, lambda a, b: a < b, "lt")
    def __le__(self, o): return self._binop(o, lambda a, b: a <= b, "le")
    def __and__(self, o): return self._binop(o, lambda a, b: a & b, "and")
    def __or__(self, o): return self._binop(o, lambda a, b: a | b, "or")
    def __invert__(self): return Column(series_fn=lambda pdf: ~self._fn(pdf), _name=self._name)
    def alias(self, name):
        c = Column(series_fn=self._fn, _name=name); return c
    __hash__ = None


class functions:
    @staticmethod
    def col(name): return Column(name)

    @staticmethod
    def lit(value): return Column(series_fn=lambda pdf: value, _name="lit")


class DataFrame:
    def __init__(self, pdf: pd.DataFrame):
        self._pdf = pdf.reset_index(drop=True)

    @property
    def columns(self): return list(self._pdf.columns)

    def toPandas(self): return self._pdf.copy()

    def select(self, *cols):
        out = {}
        for c in cols:
            if isinstance(c, str):
                out[c] = self._pdf[c]
            elif isinstance(c, Column):
                out[c._name] = c._fn(self._pdf)
            else:
                raise TypeError(f"select expects str or Column, got {type(c)}")
        return DataFrame(pd.DataFrame(out))

    def filter(self, condition):
        if not isinstance(condition, Column):
            raise TypeError("filter expects a Column condition, e.g. F.col('x') > 1")
        mask = condition._fn(self._pdf)
        return DataFrame(self._pdf[mask])

    where = filter


class SparkSession:
    def __init__(self):
        self._tables = {}

    def register(self, name, pdf): self._tables[name] = pd.DataFrame(pdf).reset_index(drop=True)

    def table(self, name):
        if name not in self._tables:
            raise KeyError(f"No table named '{name}'. Available: {list(self._tables)}")
        return DataFrame(self._tables[name])

    def createDataFrame(self, pdf): return DataFrame(pd.DataFrame(pdf))
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd queryveda/scripts/shim_tests && ./.venv/bin/python -m pytest test_shim.py -q`
Expected: PASS (3 passed).

- [ ] **Step 6: Commit**
```bash
git add queryveda/public/pyspark_shim.py queryveda/scripts/shim_tests/
git commit -m "feat(playground): pyspark shim core — DataFrame/Column/select/filter"
```

### Task 2: Shim — withColumn, orderBy, limit, drop, distinct, join

**Files:**
- Modify: `queryveda/public/pyspark_shim.py`
- Modify: `queryveda/scripts/shim_tests/test_shim.py`

**Interfaces:**
- Produces on `DataFrame`: `.withColumn(name, Column)`, `.withColumnRenamed(old, new)`, `.drop(*cols)`, `.orderBy(*cols, ascending=True)` (accepts str or Column; supports `ascending` bool or list), `.limit(n)`, `.distinct()`, `.join(other, on, how="inner")` (on: str or list[str]), `.union(other)`, `.count()`.

- [ ] **Step 1: Write the failing tests**

Append to `test_shim.py`:
```python
def test_with_column_and_limit(spark):
    m, s = spark; F = m.functions
    df = s.table("people").withColumn("older", F.col("age") + 1).orderBy("age").limit(2)
    pdf = df.toPandas()
    assert pdf["name"].tolist() == ["bob", "ann"]
    assert pdf["older"].tolist() == [26, 31]

def test_orderby_desc(spark):
    m, s = spark
    pdf = s.table("people").orderBy("age", ascending=False).toPandas()
    assert pdf["name"].tolist() == ["cy", "ann", "bob"]

def test_join(spark):
    m, s = spark
    s.register("pets", pd.DataFrame({"name": ["ann", "bob"], "pet": ["cat", "dog"]}))
    pdf = s.table("people").join(s.table("pets"), on="name", how="inner").toPandas()
    assert set(pdf.columns) >= {"name", "age", "pet"}
    assert sorted(pdf["name"].tolist()) == ["ann", "bob"]

def test_distinct_count(spark):
    m, s = spark
    s.register("dup", pd.DataFrame({"x": [1, 1, 2]}))
    assert s.table("dup").distinct().count() == 2
```

Add arithmetic ops to `Column` test:
```python
def test_column_arithmetic(spark):
    m, s = spark; F = m.functions
    pdf = s.table("people").select(F.col("age").alias("a"), (F.col("age") * 2).alias("d")).toPandas()
    assert pdf["d"].tolist() == [60, 50, 80]
```

- [ ] **Step 2: Run to verify failure**

Run: `cd queryveda/scripts/shim_tests && ./.venv/bin/python -m pytest test_shim.py -q`
Expected: FAIL (withColumn/orderBy/join/arithmetic undefined).

- [ ] **Step 3: Implement**

Add arithmetic to `Column` (place with the other dunders):
```python
    def __add__(self, o): return self._binop(o, lambda a, b: a + b, "add")
    def __sub__(self, o): return self._binop(o, lambda a, b: a - b, "sub")
    def __mul__(self, o): return self._binop(o, lambda a, b: a * b, "mul")
    def __truediv__(self, o): return self._binop(o, lambda a, b: a / b, "div")
```

Add to `DataFrame`:
```python
    def withColumn(self, name, col):
        pdf = self._pdf.copy()
        pdf[name] = col._fn(pdf) if isinstance(col, Column) else col
        return DataFrame(pdf)

    def withColumnRenamed(self, old, new):
        return DataFrame(self._pdf.rename(columns={old: new}))

    def drop(self, *cols):
        return DataFrame(self._pdf.drop(columns=list(cols), errors="ignore"))

    def orderBy(self, *cols, ascending=True):
        names = [c._name if isinstance(c, Column) else c for c in cols]
        asc = ascending if isinstance(ascending, list) else [ascending] * len(names)
        return DataFrame(self._pdf.sort_values(list(names), ascending=asc))

    sort = orderBy

    def limit(self, n): return DataFrame(self._pdf.head(n))

    def distinct(self): return DataFrame(self._pdf.drop_duplicates())

    def count(self): return len(self._pdf)

    def join(self, other, on, how="inner"):
        return DataFrame(self._pdf.merge(other._pdf, on=on, how=how))

    def union(self, other):
        return DataFrame(pd.concat([self._pdf, other._pdf], ignore_index=True))
```

- [ ] **Step 4: Run to verify pass**

Run: `cd queryveda/scripts/shim_tests && ./.venv/bin/python -m pytest test_shim.py -q`
Expected: PASS (all).

- [ ] **Step 5: Commit**
```bash
git add queryveda/public/pyspark_shim.py queryveda/scripts/shim_tests/test_shim.py
git commit -m "feat(playground): shim — withColumn/orderBy/join/distinct/union"
```

### Task 3: Shim — groupBy/agg and aggregate functions

**Files:**
- Modify: `queryveda/public/pyspark_shim.py`
- Modify: `queryveda/scripts/shim_tests/test_shim.py`

**Interfaces:**
- Produces: `DataFrame.groupBy(*cols) -> GroupedData`; `GroupedData.agg(*Column)` and `.count()`; aggregate functions on `functions`: `F.count`, `F.sum`, `F.avg`/`F.mean`, `F.min`, `F.max`. Aggregate `Column`s carry an `_agg` spec `(func_name, source_col, out_name)` and support `.alias`.

- [ ] **Step 1: Write failing tests**

Append:
```python
def test_groupby_agg(spark):
    m, s = spark; F = m.functions
    s.register("sales", pd.DataFrame({"region": ["e", "e", "w"], "amt": [10, 20, 5]}))
    pdf = (s.table("sales").groupBy("region")
             .agg(F.sum(F.col("amt")).alias("total"), F.count(F.lit(1)).alias("n"))
             .orderBy("region").toPandas())
    assert pdf["region"].tolist() == ["e", "w"]
    assert pdf["total"].tolist() == [30, 5]
    assert pdf["n"].tolist() == [2, 1]

def test_groupby_count(spark):
    m, s = spark
    s.register("sales2", pd.DataFrame({"region": ["e", "e", "w"], "amt": [1, 2, 3]}))
    pdf = s.table("sales2").groupBy("region").count().orderBy("region").toPandas()
    assert pdf["count"].tolist() == [2, 1]
```

- [ ] **Step 2: Run to verify failure**

Run: `cd queryveda/scripts/shim_tests && ./.venv/bin/python -m pytest test_shim.py -q`
Expected: FAIL (groupBy/agg undefined).

- [ ] **Step 3: Implement**

Extend `Column.__init__` to accept an optional `_agg=None` and store `self._agg = _agg`. Keep `.alias` carrying `_agg`:
```python
    def alias(self, name):
        return Column(series_fn=self._fn, _name=name, _agg=self._agg)
```
(Update `Column.__init__` signature to `def __init__(self, name=None, series_fn=None, _name=None, _agg=None):` and set `self._agg = _agg`.)

Add aggregate factories to `functions`:
```python
    @staticmethod
    def _agg(func, colobj, default_name):
        src = colobj._name if isinstance(colobj, Column) else colobj
        c = Column(series_fn=lambda pdf: pdf[src], _name=default_name,
                   _agg=(func, src, default_name))
        return c

    @staticmethod
    def sum(c):  return functions._agg("sum", c, "sum")
    @staticmethod
    def avg(c):  return functions._agg("mean", c, "avg")
    mean = avg
    @staticmethod
    def min(c):  return functions._agg("min", c, "min")
    @staticmethod
    def max(c):  return functions._agg("max", c, "max")
    @staticmethod
    def count(c): return functions._agg("count", c, "count")
```

Add `GroupedData` and `DataFrame.groupBy`:
```python
class GroupedData:
    def __init__(self, pdf, keys):
        self._pdf = pdf; self._keys = list(keys)

    def agg(self, *cols):
        g = self._pdf.groupby(self._keys, dropna=False)
        data = {}
        for c in cols:
            if c._agg is None:
                raise ValueError("agg expects aggregate columns like F.sum(F.col('x'))")
            func, src, _ = c._agg
            series = g[src].agg("size" if func == "count" else func)
            data[c._name] = series
        out = pd.DataFrame(data).reset_index()
        return DataFrame(out)

    def count(self):
        out = self._pdf.groupby(self._keys, dropna=False).size().reset_index(name="count")
        return DataFrame(out)
```
Add to `DataFrame`:
```python
    def groupBy(self, *cols):
        keys = [c._name if isinstance(c, Column) else c for c in cols]
        return GroupedData(self._pdf, keys)
    groupby = groupBy
```

- [ ] **Step 4: Run to verify pass**

Run: `cd queryveda/scripts/shim_tests && ./.venv/bin/python -m pytest test_shim.py -q`
Expected: PASS (all).

- [ ] **Step 5: Commit**
```bash
git add queryveda/public/pyspark_shim.py queryveda/scripts/shim_tests/test_shim.py
git commit -m "feat(playground): shim — groupBy/agg + aggregate functions"
```

---

## Phase 2 — Pyodide Runtime (browser glue)

### Task 4: `pyodide-runtime.ts` — load, register CSVs, run SQL + PySpark

**Files:**
- Create: `queryveda/lib/pyodide-runtime.ts`
- Modify: `queryveda/public/` — (shim already present from Phase 1)

**Interfaces:**
- Produces (all async, browser-only):
  - `type TableMeta = { name: string; rows: number; cols: { name: string; type: string }[] }`
  - `type RunResult = { cols: string[]; rows: unknown[][]; rowCount: number; ms: number }`
  - `loadRuntime(indexURL?: string): Promise<void>` — idempotent; injects a global `loadPyodide` script tag, calls it, `await pyodide.loadPackage(["pandas","micropip"])`, tries DuckDB via micropip (best-effort; on failure sets a `sqliteFallback=true` flag), then `runPython(shimSource)` to define the shim and a `spark` session.
  - `registerCsv(name: string, csvText: string): Promise<TableMeta>` — `pandas.read_csv(io.StringIO(text))`, store in a `_tables` dict and `spark.register(name, df)`.
  - `dropTable(name: string): Promise<void>`
  - `runSql(query: string): Promise<RunResult>` — DuckDB if available else sqlite3 over registered DataFrames.
  - `runPyspark(code: string): Promise<RunResult>` — exec user code with `spark`, `F`, `functions` in scope; the final expression or a `result` variable must be a shim `DataFrame`; serialize via `toPandas`.
  - `resetRuntime(): void` (clears tables; used by Clear session)

**Note:** The shim source is fetched at runtime from `/pyspark_shim.py` (it is in `public/`, so served at the site root). Store expected columns/types by reading `df.dtypes`.

- [ ] **Step 1: Implement the module**

Create `queryveda/lib/pyodide-runtime.ts`:
```ts
// Client-only Pyodide runtime for the data playground.
// Loads Pyodide, holds uploaded CSVs as pandas DataFrames, runs SQL + PySpark.

export type ColMeta = { name: string; type: string };
export type TableMeta = { name: string; rows: number; cols: ColMeta[] };
export type RunResult = { cols: string[]; rows: unknown[][]; rowCount: number; ms: number };

const PYODIDE_VERSION = "0.28.3";
const DEFAULT_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodide: any = null;
let loadingPromise: Promise<void> | null = null;
let sqlEngine: "duckdb" | "sqlite" = "sqlite";

declare global {
  interface Window { loadPyodide?: (opts: { indexURL: string }) => Promise<any>; }
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.head.appendChild(s);
  });
}

export function isReady() { return pyodide !== null; }
export function getSqlEngine() { return sqlEngine; }

export async function loadRuntime(indexURL: string = DEFAULT_INDEX): Promise<void> {
  if (pyodide) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    await injectScript(`${indexURL}pyodide.js`);
    pyodide = await window.loadPyodide!({ indexURL });
    await pyodide.loadPackage(["pandas", "micropip"]);
    // Best-effort DuckDB; fall back to sqlite3 (stdlib) if unavailable.
    try {
      await pyodide.runPythonAsync(`
import micropip
await micropip.install("duckdb")
import duckdb
`);
      sqlEngine = "duckdb";
    } catch { sqlEngine = "sqlite"; }
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
        "name": name, "rows": int(df.shape[0]),
        "cols": [{"name": str(c), "type": str(t)} for c, t in df.dtypes.items()],
    })
def _drop(name):
    _tables.pop(name, None); spark._tables.pop(name, None)
def _serialize(df):
    # df is a pandas.DataFrame
    df = df.where(pd.notnull(df), None)
    return json.dumps({
        "cols": [str(c) for c in df.columns],
        "rows": df.astype(object).where(pd.notnull(df), None).values.tolist(),
        "rowCount": int(df.shape[0]),
    }, default=str)
`);
  })();
  try { await loadingPromise; } finally { loadingPromise = null; }
}

export async function registerCsv(name: string, csvText: string): Promise<TableMeta> {
  pyodide.globals.set("__csv_name", name);
  pyodide.globals.set("__csv_text", csvText);
  const metaJson = pyodide.runPython(`_register(__csv_name, __csv_text)`);
  return JSON.parse(metaJson);
}

export async function dropTable(name: string): Promise<void> {
  pyodide.globals.set("__drop_name", name);
  pyodide.runPython(`_drop(__drop_name)`);
}

export async function runSql(query: string): Promise<RunResult> {
  const t0 = performance.now();
  pyodide.globals.set("__sql", query);
  const code = sqlEngine === "duckdb"
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
  const out = JSON.parse(pyodide.runPython(code));
  return { ...out, ms: Math.round(performance.now() - t0) };
}

export async function runPyspark(code: string): Promise<RunResult> {
  const t0 = performance.now();
  pyodide.globals.set("__user_code", code);
  // Exec user code; the result must be in `result` or be the last DataFrame.
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
  const out = JSON.parse(pyodide.runPython(wrapped));
  return { ...out, ms: Math.round(performance.now() - t0) };
}

export function resetRuntime(): void {
  if (!pyodide) return;
  pyodide.runPython(`_tables.clear(); spark._tables.clear()`);
}
```

- [ ] **Step 2: Type-check via build (runtime is browser-only, no unit test)**

This module only runs in the browser; verify it compiles as part of the app build in a later task. For now:
Run: `cd queryveda && npx eslint lib/pyodide-runtime.ts || true`
Expected: no TypeScript syntax errors reported (lint may warn on `any`; acceptable).

- [ ] **Step 3: Commit**
```bash
git add queryveda/lib/pyodide-runtime.ts
git commit -m "feat(playground): pyodide runtime — load, register CSVs, run SQL + PySpark"
```

---

## Phase 3 — UI Components

### Task 5: `code-editor.tsx` — CodeMirror editor with SQL/Python modes

**Files:**
- Create: `queryveda/components/playground/code-editor.tsx`
- Modify: `queryveda/package.json` (add `@codemirror/lang-python`)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `<CodeEditor language="sql"|"python" value onChange onRun placeholder tables? />`. `tables` (SQL autocomplete schema) is `Record<string,string[]>`. Mirrors the existing `sql-editor.tsx` structure (themes, Mod-Enter runs) but swaps the language extension by `language`.

- [ ] **Step 1: Install the Python language mode**

Run: `cd queryveda && npm install @codemirror/lang-python`
Expected: adds dependency; `package.json` updated.

- [ ] **Step 2: Implement the component**

Create `queryveda/components/playground/code-editor.tsx` — copy the theme/highlight setup from `components/practice/sql-editor.tsx` (lines 1–122 pattern), then:
```tsx
"use client";
import { useEffect, useRef } from "react";
import { EditorView, keymap, placeholder as placeholderExt, lineNumbers } from "@codemirror/view";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import { defaultKeymap, historyKeymap, indentWithTab, history } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap, autocompletion, acceptCompletion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  language: "sql" | "python";
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  tables?: Record<string, string[]>;
}

export function CodeEditor({ language, value, onChange, onRun, tables }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  const { resolvedTheme } = useTheme();
  const onRunRef = useRef(onRun); onRunRef.current = onRun;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const isDark = resolvedTheme === "dark";

  const langExt = (): Extension =>
    language === "python"
      ? python()
      : sql({ dialect: PostgreSQL, schema: tables, upperCaseKeywords: true });

  useEffect(() => {
    if (!containerRef.current) return;
    const extensions: Extension[] = [
      langCompartment.current.of(langExt()),
      autocompletion(), closeBrackets(), history(), lineNumbers(),
      placeholderExt(language === "python" ? "Write PySpark code… end with a DataFrame" : "Write SQL…"),
      keymap.of([
        { key: "Mod-Enter", run: () => { onRunRef.current(); return true; } },
        { key: "Tab", run: acceptCompletion },
        ...closeBracketsKeymap, ...historyKeymap, indentWithTab, ...defaultKeymap,
      ]),
      EditorView.updateListener.of((u) => { if (u.docChanged) onChangeRef.current(u.state.doc.toString()); }),
      EditorView.theme({ "&": { height: "260px", fontFamily: "var(--font-mono)" }, ".cm-scroller": { overflow: "auto" } }),
      isDark ? oneDark : syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    ];
    const view = new EditorView({ state: EditorState.create({ doc: value, extensions }), parent: containerRef.current });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, language]);

  // Reconfigure language / SQL schema without rebuilding the editor
  useEffect(() => {
    viewRef.current?.dispatch({ effects: langCompartment.current.reconfigure(langExt()) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables]);

  // Push external value changes (e.g. restore/session load) into the editor
  useEffect(() => {
    const view = viewRef.current; if (!view) return;
    const cur = view.state.doc.toString();
    if (cur !== value) view.dispatch({ changes: { from: 0, to: cur.length, insert: value } });
  }, [value]);

  return <div className="rounded-xl border border-primary/20 overflow-hidden" ref={containerRef} />;
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd queryveda && npm run build`
Expected: build succeeds (component is imported by a later task; at minimum it must type-check once used — if unused now, Next.js tree-shakes it; proceed).

- [ ] **Step 4: Commit**
```bash
git add queryveda/components/playground/code-editor.tsx queryveda/package.json queryveda/package-lock.json
git commit -m "feat(playground): dual-mode CodeMirror editor (SQL + Python)"
```

### Task 6: `data-uploader.tsx` — CSV upload + table list

**Files:**
- Create: `queryveda/components/playground/data-uploader.tsx`

**Interfaces:**
- Consumes: `TableMeta` from `lib/pyodide-runtime.ts`.
- Produces: `<DataUploader tables onAddFiles onRemove disabled />` where `tables: TableMeta[]`, `onAddFiles: (files: File[]) => void`, `onRemove: (name: string) => void`. Drag/drop + `<input type="file" accept=".csv" multiple>`; renders each table with row count and a column-schema chip list and a remove button.

- [ ] **Step 1: Implement**

Create `queryveda/components/playground/data-uploader.tsx`:
```tsx
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
    onAddFiles(Array.from(fl).filter((f) => f.name.toLowerCase().endsWith(".csv")));
  };
  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) pick(e.dataTransfer.files); }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm cursor-pointer transition-colors ${
          drag ? "border-primary bg-primary/5" : "border-border"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <span className="text-muted-foreground">Drop CSV files or click to upload</span>
        <input ref={inputRef} type="file" accept=".csv" multiple className="hidden"
               onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
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
                  <span className="text-xs text-muted-foreground">{t.rows} rows</span>
                  <button onClick={() => onRemove(t.name)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.cols.map((c) => (
                  <span key={c.name} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {c.name}<span className="opacity-60"> :{c.type}</span>
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
```

- [ ] **Step 2: Commit**
```bash
git add queryveda/components/playground/data-uploader.tsx
git commit -m "feat(playground): CSV data uploader + table list"
```

### Task 7: `results-view.tsx` — result grid + error/status

**Files:**
- Create: `queryveda/components/playground/results-view.tsx`

**Interfaces:**
- Consumes: `RunResult` from `lib/pyodide-runtime.ts`.
- Produces: `<ResultsView result error running />` where `result: RunResult | null`, `error: string | null`, `running: boolean`. Renders a scrollable table (reusing the `result-table.tsx` markup pattern), row count + ms footer, or an error box, or a spinner.

- [ ] **Step 1: Implement**

Create `queryveda/components/playground/results-view.tsx`:
```tsx
"use client";
import type { RunResult } from "@/lib/pyodide-runtime";

interface Props { result: RunResult | null; error: string | null; running: boolean; }

export function ResultsView({ result, error, running }: Props) {
  if (running) return <p className="text-sm text-muted-foreground italic">Running…</p>;
  if (error)
    return (
      <pre className="whitespace-pre-wrap rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive overflow-x-auto">
        {error}
      </pre>
    );
  if (!result) return <p className="text-sm text-muted-foreground italic">Run a query to see results.</p>;
  if (result.rowCount === 0) return <p className="text-sm text-muted-foreground italic">(no rows)</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl border border-primary/20">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b bg-muted/50">
              {result.cols.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-medium text-muted-foreground">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.slice(0, 500).map((row, ri) => (
              <tr key={ri} className="border-b last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2">
                    {cell === null ? <span className="italic text-muted-foreground">NULL</span> : String(cell)}
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
```

- [ ] **Step 2: Commit**
```bash
git add queryveda/components/playground/results-view.tsx
git commit -m "feat(playground): results grid + error/status view"
```

### Task 8: `session-store.ts` — IndexedDB persistence

**Files:**
- Create: `queryveda/lib/playground-session.ts`

**Interfaces:**
- Produces:
  - `type SavedTable = { name: string; csv: string }`
  - `type Session = { tables: SavedTable[]; sqlBuffer: string; pysparkBuffer: string; language: "sql"|"python" }`
  - `saveSession(s: Session): Promise<void>`, `loadSession(): Promise<Session | null>`, `clearSession(): Promise<void>`. Uses one IndexedDB store `qv-playground/session` keyed `"current"`.

- [ ] **Step 1: Implement**

Create `queryveda/lib/playground-session.ts`:
```ts
export type SavedTable = { name: string; csv: string };
export type Session = {
  tables: SavedTable[];
  sqlBuffer: string;
  pysparkBuffer: string;
  language: "sql" | "python";
};

const DB = "qv-playground";
const STORE = "session";
const KEY = "current";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSession(s: Session): Promise<void> {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(s, KEY);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
  db.close();
}

export async function loadSession(): Promise<Session | null> {
  const db = await open();
  const val = await new Promise<Session | null>((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).get(KEY);
    r.onsuccess = () => res(r.result ?? null); r.onerror = () => rej(r.error);
  });
  db.close();
  return val;
}

export async function clearSession(): Promise<void> {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
  db.close();
}
```

- [ ] **Step 2: Commit**
```bash
git add queryveda/lib/playground-session.ts
git commit -m "feat(playground): IndexedDB session persistence"
```

---

## Phase 4 — Orchestrator, Route, Nav

### Task 9: `playground-client.tsx` — orchestrator

**Files:**
- Create: `queryveda/components/playground/playground-client.tsx`

**Interfaces:**
- Consumes: `loadRuntime, registerCsv, dropTable, runSql, runPyspark, resetRuntime, getSqlEngine, type TableMeta, type RunResult` from `lib/pyodide-runtime`; `CodeEditor`, `DataUploader`, `ResultsView`; `saveSession, loadSession, clearSession, type Session` from `lib/playground-session`.
- Produces: `<PlaygroundClient />` (default export not required; named export). Owns all state, drives the runtime, autocompletes SQL from table schemas.

- [ ] **Step 1: Implement**

Create `queryveda/components/playground/playground-client.tsx`:
```tsx
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
  "# 'spark' and 'F' are ready. End with a DataFrame.\n" +
  'df = spark.table("my_table")\n' +
  "df.select(\"*\") if False else df";

export function PlaygroundClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [tables, setTables] = useState<rt.TableMeta[]>([]);
  const [language, setLanguage] = useState<"sql" | "python">("sql");
  const [sqlBuffer, setSqlBuffer] = useState(DEFAULT_SQL);
  const [pysparkBuffer, setPysparkBuffer] = useState(DEFAULT_PYSPARK);
  const [result, setResult] = useState<rt.RunResult | null>(null);
  const [runErr, setRunErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const restored = useRef(false);

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
          for (const t of saved.tables) metas.push(await rt.registerCsv(t.name, t.csv));
          if (!cancelled) setTables(metas);
        }
        if (!cancelled) { restored.current = true; setStatus("ready"); }
      } catch (e: any) {
        if (!cancelled) { setLoadErr(String(e?.message || e)); setStatus("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist session (raw CSVs kept in a ref-mirrored map).
  const csvMap = useRef<Record<string, string>>({});
  const persist = useCallback(() => {
    if (!restored.current) return;
    void saveSession({
      tables: tables.map((t) => ({ name: t.name, csv: csvMap.current[t.name] || "" })),
      sqlBuffer, pysparkBuffer, language,
    });
  }, [tables, sqlBuffer, pysparkBuffer, language]);
  useEffect(() => { persist(); }, [persist]);

  const sanitize = (fname: string) => {
    let base = fname.replace(/\.csv$/i, "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (/^[0-9]/.test(base)) base = "t_" + base;
    let name = base || "table", i = 1;
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
      } catch (e: any) { setRunErr(`Failed to load ${f.name}: ${e?.message || e}`); }
    }
  };

  const onRemove = async (name: string) => {
    await rt.dropTable(name); delete csvMap.current[name];
    setTables((prev) => prev.filter((t) => t.name !== name));
  };

  const run = async () => {
    setRunning(true); setRunErr(null); setResult(null);
    try {
      const code = language === "sql" ? sqlBuffer : pysparkBuffer;
      const res = language === "sql" ? await rt.runSql(code) : await rt.runPyspark(code);
      setResult(res);
    } catch (e: any) {
      setRunErr(String(e?.message || e).replace(/\n\s*at .*/g, ""));
    } finally { setRunning(false); }
  };

  const onClear = async () => {
    await clearSession(); rt.resetRuntime(); csvMap.current = {};
    setTables([]); setSqlBuffer(DEFAULT_SQL); setPysparkBuffer(DEFAULT_PYSPARK);
    setResult(null); setRunErr(null);
  };

  const schema: Record<string, string[]> = Object.fromEntries(
    tables.map((t) => [t.name, t.cols.map((c) => c.name)])
  );

  if (status === "error")
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-destructive">Failed to load the Python runtime.</p>
        <p className="mt-2 text-sm text-muted-foreground">{loadErr}</p>
        <button onClick={() => location.reload()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Retry</button>
      </div>
    );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Data Playground</h1>
        <p className="text-sm text-muted-foreground">
          Upload CSVs and explore them with PySpark or SQL — runs entirely in your browser.
        </p>
      </header>

      {status === "loading" && (
        <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Python runtime (one-time, ~15 MB)…
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="flex flex-col gap-3">
          <DataUploader tables={tables} onAddFiles={onAddFiles} onRemove={onRemove} disabled={status !== "ready"} />
          <button onClick={onClear} className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Clear session
          </button>
        </aside>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
              {(["sql", "python"] as const).map((l) => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`rounded-md px-3 py-1 ${language === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {l === "sql" ? "SQL" : "PySpark"}
                </button>
              ))}
            </div>
            <button onClick={run} disabled={status !== "ready" || running}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run
            </button>
          </div>

          {language === "python" && (
            <p className="rounded-md bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
              PySpark here is a pandas-backed emulation of the DataFrame API — great for syntax practice, not a real Spark cluster.
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
```

- [ ] **Step 2: Commit**
```bash
git add queryveda/components/playground/playground-client.tsx
git commit -m "feat(playground): orchestrator wiring runtime + editor + upload + results"
```

### Task 10: Route `app/playground/page.tsx` + nav entry

**Files:**
- Create: `queryveda/app/playground/page.tsx`
- Modify: `queryveda/components/layout/sidebar.tsx` (add nav item)

**Interfaces:**
- Consumes: `PlaygroundClient`.
- Produces: the `/playground` route; a sidebar link.

- [ ] **Step 1: Create the page (client component, no server APIs)**

Create `queryveda/app/playground/page.tsx`:
```tsx
"use client";
import { PlaygroundClient } from "@/components/playground/playground-client";

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
```

- [ ] **Step 2: Add the nav item**

In `queryveda/components/layout/sidebar.tsx`, import a `FlaskConical` icon from `lucide-react` (add to the existing import block) and add to `mainNav`:
```tsx
  { href: "/playground", label: "Playground", icon: FlaskConical, tour: "playground" },
```
(Insert after the `/problems` entry.)

- [ ] **Step 3: Verify the full build**

Run: `cd queryveda && npm run build`
Expected: build succeeds; `/playground` appears in the route list.

- [ ] **Step 4: Commit**
```bash
git add queryveda/app/playground/page.tsx queryveda/components/layout/sidebar.tsx
git commit -m "feat(playground): /playground route + sidebar nav entry"
```

### Task 11: Run the app and verify end-to-end

**Files:** none (manual verification via the `run`/`verify` skill).

- [ ] **Step 1: Start dev server**

Run: `cd queryveda && npm run dev` (background). Open `http://localhost:3000/playground`.

- [ ] **Step 2: Verify the happy path**
- Runtime banner appears then clears (status ready).
- Upload a small CSV (e.g. `name,age\nann,30\nbob,25`) → table appears with row count + column chips.
- SQL mode: `SELECT * FROM <table> ORDER BY age DESC` → grid shows rows, footer shows count + ms.
- PySpark mode: `spark.table("<table>").filter(F.col("age") > 26)` → grid shows matching rows.
- Reload page → tables + editor buffers restored from IndexedDB.
- "Clear session" → tables and results cleared.

- [ ] **Step 3: Note the SQL engine in use**

In devtools console the runtime logs nothing by default; confirm SQL results are correct (engine is DuckDB if its wheel loaded, else sqlite3 — both must return correct rows).

### Task 12: Self-host (vendor) Pyodide for production

**Files:**
- Create: `queryveda/public/pyodide/` (vendored Pyodide distribution)
- Modify: `queryveda/lib/pyodide-runtime.ts` (default `indexURL` → `/pyodide/`)
- Create: `queryveda/scripts/vendor-pyodide.md` (doc: how the folder was produced)

**Interfaces:** unchanged (only the default `indexURL`).

- [ ] **Step 1: Download the matching Pyodide distribution**

Run (from repo root):
```bash
cd queryveda/public
curl -L -o pyodide.tar.bz2 https://github.com/pyodide/pyodide/releases/download/0.28.3/pyodide-0.28.3.tar.bz2
tar xjf pyodide.tar.bz2 && rm pyodide.tar.bz2
```
This yields `queryveda/public/pyodide/` containing `pyodide.js`, `pyodide.asm.wasm`, and package wheels (pandas, micropip, etc.).

- [ ] **Step 2: Trim to needed packages (optional but recommended)**

Keep `pyodide.js`, `pyodide.asm.*`, `pyodide-lock.json`, `python_stdlib.zip`, and the `pandas`/`numpy`/`micropip`/`duckdb` (if present) wheels; the full folder also works if disk is not a concern. Document what was kept in `scripts/vendor-pyodide.md`.

- [ ] **Step 3: Point the runtime at the local copy**

In `queryveda/lib/pyodide-runtime.ts` change:
```ts
const DEFAULT_INDEX = "/pyodide/";
```
(Keep `PYODIDE_VERSION` for reference.)

- [ ] **Step 4: Verify production build serves it**

Run: `cd queryveda && npm run build && npx serve out -l 3005` (or open `out/playground/index.html` via a static server). Load `/playground`, confirm Pyodide loads from `/pyodide/` (Network tab shows same-origin requests) and a query runs.

- [ ] **Step 5: Commit**

Note: the Pyodide distribution is large. If the team prefers not to commit binaries, add a build step to fetch it instead; default here is to commit for a reproducible static deploy.
```bash
git add queryveda/public/pyodide queryveda/lib/pyodide-runtime.ts queryveda/scripts/vendor-pyodide.md
git commit -m "chore(playground): self-host Pyodide from /public/pyodide"
```

---

## Self-Review

**Spec coverage:**
- Route `/playground` → Task 10. ✅
- One Pyodide runtime, lazy load → Task 4, Task 9 (mount-time load). ✅
- Upload CSV → named pandas DataFrame → Task 4 (`registerCsv`), Task 6 (uploader), Task 9 (sanitize + wire). ✅
- Multiple tables / joins → registry keyed by name; SQL join + shim `.join` (Task 2/4). ✅
- SQL via DuckDB (fallback sqlite) → Task 4. ✅
- PySpark shim (curated subset) → Tasks 1–3. ✅
- Same-data consistency → both engines read the one `_tables` dict. ✅
- Results `{cols, rows}` grid + row count + run time → Task 4 (`_serialize`), Task 7. ✅
- Local persistence (IndexedDB): CSVs + per-language buffers + last language → Task 8, Task 9. ✅
- Honest "emulation not Spark" UI note → Task 9. ✅
- Error handling (load/parse/runtime/unsupported) → Task 4 (try/except paths), Task 9 (status error, per-file catch), shim raises named errors. ✅
- Nav entry → Task 10. ✅
- New dep `@codemirror/lang-python` → Task 5. ✅
- Self-host Pyodide → Task 12. ✅
- Non-goals (grading, samples, JSON/paste, auth) → not built. ✅

**Placeholder scan:** No TBD/TODO; every code step has full code. Task 12 notes a team decision about committing binaries (legitimate, not a placeholder).

**Type consistency:** `TableMeta`, `RunResult`, `ColMeta` defined in Task 4 and consumed unchanged in Tasks 6/7/9. Runtime fn names (`loadRuntime`, `registerCsv`, `dropTable`, `runSql`, `runPyspark`, `resetRuntime`, `getSqlEngine`) match between Task 4 and Task 9. Shim API names (`SparkSession.register/table`, `functions.col/lit/sum/...`, `DataFrame.select/filter/withColumn/groupBy/join`) consistent across Tasks 1–4 and the PySpark exec harness. `Session` shape matches between Task 8 and Task 9.
