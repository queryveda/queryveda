"""Pandas-backed emulation of a subset of the PySpark DataFrame API.

NOT real Spark: no lazy evaluation, no partitioning. Intended for practicing
DataFrame syntax and transformations in the browser (via Pyodide).
"""
import pandas as pd


class Column:
    def __init__(self, name=None, series_fn=None, _name=None, _agg=None):
        # series_fn: (pandas.DataFrame) -> pandas.Series
        self._name = _name if _name is not None else name
        self._agg = _agg
        if series_fn is not None:
            self._fn = series_fn
        else:
            self._fn = lambda pdf: pdf[name]

    def _binop(self, other, op):
        other_fn = other._fn if isinstance(other, Column) else (lambda pdf: other)
        return Column(series_fn=lambda pdf: op(self._fn(pdf), other_fn(pdf)),
                      _name=self._name)

    def __eq__(self, o): return self._binop(o, lambda a, b: a == b)
    def __ne__(self, o): return self._binop(o, lambda a, b: a != b)
    def __gt__(self, o): return self._binop(o, lambda a, b: a > b)
    def __ge__(self, o): return self._binop(o, lambda a, b: a >= b)
    def __lt__(self, o): return self._binop(o, lambda a, b: a < b)
    def __le__(self, o): return self._binop(o, lambda a, b: a <= b)
    def __and__(self, o): return self._binop(o, lambda a, b: a & b)
    def __or__(self, o): return self._binop(o, lambda a, b: a | b)
    def __invert__(self):
        return Column(series_fn=lambda pdf: ~self._fn(pdf), _name=self._name)

    def __add__(self, o): return self._binop(o, lambda a, b: a + b)
    def __sub__(self, o): return self._binop(o, lambda a, b: a - b)
    def __mul__(self, o): return self._binop(o, lambda a, b: a * b)
    def __truediv__(self, o): return self._binop(o, lambda a, b: a / b)

    def alias(self, name):
        return Column(series_fn=self._fn, _name=name, _agg=self._agg)

    __hash__ = None


class functions:
    @staticmethod
    def col(name):
        return Column(name)

    @staticmethod
    def lit(value):
        return Column(series_fn=lambda pdf: value, _name="lit")

    @staticmethod
    def _agg(func, colobj, default_name):
        src = colobj._name if isinstance(colobj, Column) else colobj
        return Column(series_fn=lambda pdf: pdf[src], _name=default_name,
                      _agg=(func, src, default_name))

    @staticmethod
    def sum(c):
        return functions._agg("sum", c, "sum")

    @staticmethod
    def avg(c):
        return functions._agg("mean", c, "avg")

    mean = avg

    @staticmethod
    def min(c):
        return functions._agg("min", c, "min")

    @staticmethod
    def max(c):
        return functions._agg("max", c, "max")

    @staticmethod
    def count(c):
        return functions._agg("count", c, "count")


class GroupedData:
    def __init__(self, pdf, keys):
        self._pdf = pdf
        self._keys = list(keys)

    def agg(self, *cols):
        g = self._pdf.groupby(self._keys, dropna=False)
        data = {}
        for c in cols:
            if not isinstance(c, Column) or c._agg is None:
                raise ValueError(
                    "agg expects aggregate columns like F.sum(F.col('x'))")
            func, src, _ = c._agg
            # count is row-count per group, independent of the source column
            # (supports F.count(F.lit(1)) where 'src' is not a real column).
            data[c._name] = g.size() if func == "count" else g[src].agg(func)
        return DataFrame(pd.DataFrame(data).reset_index())

    def count(self):
        out = self._pdf.groupby(self._keys, dropna=False).size().reset_index(name="count")
        return DataFrame(out)


class DataFrame:
    def __init__(self, pdf: pd.DataFrame):
        self._pdf = pdf.reset_index(drop=True)

    @property
    def columns(self):
        return list(self._pdf.columns)

    def toPandas(self):
        return self._pdf.copy()

    def select(self, *cols):
        out = {}
        for c in cols:
            if isinstance(c, str):
                if c == "*":
                    for col in self._pdf.columns:
                        out[col] = self._pdf[col]
                else:
                    out[c] = self._pdf[c]
            elif isinstance(c, Column):
                out[c._name] = c._fn(self._pdf)
            else:
                raise TypeError(f"select expects str or Column, got {type(c)}")
        return DataFrame(pd.DataFrame(out))

    def filter(self, condition):
        if not isinstance(condition, Column):
            raise TypeError("filter expects a Column condition, e.g. F.col('x') > 1")
        return DataFrame(self._pdf[condition._fn(self._pdf)])

    where = filter

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

    def limit(self, n):
        return DataFrame(self._pdf.head(n))

    def distinct(self):
        return DataFrame(self._pdf.drop_duplicates())

    def count(self):
        return len(self._pdf)

    def join(self, other, on, how="inner"):
        return DataFrame(self._pdf.merge(other._pdf, on=on, how=how))

    def union(self, other):
        return DataFrame(pd.concat([self._pdf, other._pdf], ignore_index=True))

    def groupBy(self, *cols):
        keys = [c._name if isinstance(c, Column) else c for c in cols]
        return GroupedData(self._pdf, keys)

    groupby = groupBy


class SparkSession:
    def __init__(self):
        self._tables = {}

    def register(self, name, pdf):
        self._tables[name] = pd.DataFrame(pdf).reset_index(drop=True)

    def table(self, name):
        if name not in self._tables:
            raise KeyError(
                f"No table named '{name}'. Available: {list(self._tables)}")
        return DataFrame(self._tables[name])

    def createDataFrame(self, pdf):
        return DataFrame(pd.DataFrame(pdf))
