"""Tests the exact Python glue that pyodide-runtime.ts injects, against local
pandas. Covers CSV register, _serialize, the sqlite SQL path, and the AST-based
PySpark exec harness — the browser-independent (and highest-risk) logic."""
import importlib.util
import os
import json
import io
import sqlite3
import ast
import textwrap
import pandas as pd

SHIM = os.path.join(os.path.dirname(__file__), "..", "..", "public", "pyspark_shim.py")


def make_env():
    spec = importlib.util.spec_from_file_location("pyspark_shim", SHIM)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    ns = {
        "pd": pd, "io": io, "json": json,
        "SparkSession": m.SparkSession, "functions": m.functions,
        "DataFrame": m.DataFrame, "Column": m.Column,
    }
    # Mirror the exact glue defined in loadRuntime().
    glue = '''
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
    obj = df.astype(object).where(pd.notnull(df), None)
    return json.dumps({
        "cols": [str(c) for c in df.columns],
        "rows": obj.values.tolist(),
        "rowCount": int(df.shape[0]),
    }, default=str)
'''
    exec(compile(glue, "<glue>", "exec"), ns)
    return ns


CSV = "name,age,city\nann,30,nyc\nbob,25,sf\ncy,40,nyc\ndan,35,sf\n"


def test_register_returns_meta():
    ns = make_env()
    meta = json.loads(ns["_register"]("people", CSV))
    assert meta["name"] == "people"
    assert meta["rows"] == 4
    names = [c["name"] for c in meta["cols"]]
    assert names == ["name", "age", "city"]


def run_sql_sqlite(ns, query):
    # Mirror the sqlite branch of runSql().
    con = sqlite3.connect(":memory:")
    for n, df in ns["_tables"].items():
        df.to_sql(n, con, index=False, if_exists="replace")
    res = pd.read_sql_query(query, con)
    con.close()
    return json.loads(ns["_serialize"](res))


def test_sql_select_orderby():
    ns = make_env()
    ns["_register"]("people", CSV)
    out = run_sql_sqlite(ns, "SELECT name, age FROM people ORDER BY age DESC")
    assert out["cols"] == ["name", "age"]
    assert out["rowCount"] == 4
    assert out["rows"][0] == ["cy", 40]


def test_sql_join():
    ns = make_env()
    ns["_register"]("people", CSV)
    ns["_register"]("pets", "name,pet\nann,cat\nbob,dog\n")
    out = run_sql_sqlite(
        ns, "SELECT p.name, pet FROM people p JOIN pets USING(name) ORDER BY p.name")
    assert out["rowCount"] == 2
    assert out["rows"] == [["ann", "cat"], ["bob", "dog"]]


def run_pyspark(ns, code):
    # Mirror the AST harness of runPyspark().
    src = textwrap.dedent(code)
    userns = {"spark": ns["spark"], "F": ns["F"], "functions": ns["functions"],
              "DataFrame": ns["DataFrame"], "Column": ns["Column"], "pd": pd}
    mod = ast.parse(src, mode="exec")
    last_expr = None
    if mod.body and isinstance(mod.body[-1], ast.Expr):
        last_expr = ast.Expression(mod.body[-1].value)
        mod.body = mod.body[:-1]
    exec(compile(mod, "<user>", "exec"), userns)
    out = None
    if last_expr is not None:
        out = eval(compile(last_expr, "<user>", "eval"), userns)
    elif "result" in userns:
        out = userns["result"]
    if out is None:
        raise ValueError("No result.")
    if hasattr(out, "toPandas"):
        out = out.toPandas()
    return json.loads(ns["_serialize"](out))


def test_pyspark_trailing_expr():
    ns = make_env()
    ns["_register"]("people", CSV)
    out = run_pyspark(ns, '''
        df = spark.table("people")
        df.filter(F.col("age") > 28).select("name", "age").orderBy("age")
    ''')
    assert out["cols"] == ["name", "age"]
    # age > 28: ann(30), dan(35), cy(40), ordered ascending by age
    assert [r[0] for r in out["rows"]] == ["ann", "dan", "cy"]


def test_pyspark_result_variable():
    ns = make_env()
    ns["_register"]("people", CSV)
    out = run_pyspark(ns, '''
        result = spark.table("people").groupBy("city").count().orderBy("city")
    ''')
    assert out["cols"] == ["city", "count"]
    assert out["rows"] == [["nyc", 2], ["sf", 2]]


def test_pyspark_groupby_agg():
    ns = make_env()
    ns["_register"]("people", CSV)
    out = run_pyspark(ns, '''
        spark.table("people").groupBy("city").agg(F.avg(F.col("age")).alias("avg_age")).orderBy("city")
    ''')
    assert out["cols"] == ["city", "avg_age"]
    assert out["rows"][0][0] == "nyc"
    assert out["rows"][0][1] == 35.0


def test_serialize_handles_nulls():
    ns = make_env()
    ns["_register"]("t", "a,b\n1,\n2,x\n")
    out = run_sql_sqlite(ns, "SELECT * FROM t ORDER BY a")
    # missing b in first row must serialize to JSON null, not NaN
    assert out["rows"][0][1] is None
    assert out["rows"][1][1] == "x"
