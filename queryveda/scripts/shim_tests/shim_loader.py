"""Loads the PySpark shim Python source out of the TypeScript module that
inlines it (lib/pyspark-shim-source.ts), so the tests exercise the exact
string the browser runtime runs."""
import os
import types

TS = os.path.join(
    os.path.dirname(__file__), "..", "..", "lib", "pyspark-shim-source.ts"
)


def shim_source() -> str:
    text = open(TS, encoding="utf-8").read()
    # The Python is the content of the single backtick-delimited template
    # literal; the shim contains no backticks of its own.
    parts = text.split("`")
    if len(parts) < 3:
        raise RuntimeError("Could not find the shim template literal in " + TS)
    return parts[1]


def load_module():
    m = types.ModuleType("pyspark_shim")
    exec(compile(shim_source(), "<shim>", "exec"), m.__dict__)
    return m
