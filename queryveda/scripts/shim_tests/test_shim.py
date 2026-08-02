import pandas as pd
import pytest

from shim_loader import load_module as load


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


def test_with_column_and_limit(spark):
    m, s = spark
    F = m.functions
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


def test_column_arithmetic(spark):
    m, s = spark
    F = m.functions
    pdf = s.table("people").select(F.col("age").alias("a"), (F.col("age") * 2).alias("d")).toPandas()
    assert pdf["d"].tolist() == [60, 50, 80]


def test_groupby_agg(spark):
    m, s = spark
    F = m.functions
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
