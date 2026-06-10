import type { Question } from "@/lib/types";

// --- Display formatting ---

function fmtDate(v: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const Y = v.getFullYear(),
    M = p(v.getMonth() + 1),
    D = p(v.getDate());
  const h = v.getHours(),
    mi = v.getMinutes(),
    s = v.getSeconds();
  if (h || mi || s) return `${Y}-${M}-${D} ${p(h)}:${p(mi)}:${p(s)}`;
  return `${Y}-${M}-${D}`;
}

export function displayValue(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return fmtDate(v);
  return String(v);
}

// --- Normalization for comparison ---

export function normalize(v: unknown): string {
  if (v === null || v === undefined) return "\u2205";
  let s = v instanceof Date ? fmtDate(v) : String(v);
  s = s.trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return String(Math.round(parseFloat(s) * 10000) / 10000);
  return s.toLowerCase();
}

// --- Order-independent result comparison ---

export interface QueryResult {
  cols: string[];
  rows: (string | number | null | Date)[][];
}

export interface CompareResult {
  pass: boolean;
  msg: string;
}

export function compareResults(expected: QueryResult, actual: QueryResult): CompareResult {
  const ec = expected.cols.length;
  if (actual.rows.length > 0 && actual.rows[0].length !== ec) {
    return {
      pass: false,
      msg: `Column count mismatch: expected ${ec} column(s), got ${actual.rows[0].length}. Expected order: ${expected.cols.join(", ")}.`,
    };
  }
  if (actual.rows.length === 0 && expected.rows.length > 0) {
    return { pass: false, msg: "Your query returned 0 rows." };
  }
  if (actual.rows.length !== expected.rows.length) {
    return {
      pass: false,
      msg: `Row count mismatch: expected ${expected.rows.length}, got ${actual.rows.length}.`,
    };
  }
  const key = (r: unknown[]) => r.map(normalize).join("\u0001");
  const e = expected.rows.map(key).sort();
  const a = actual.rows.map(key).sort();
  for (let i = 0; i < e.length; i++) {
    if (e[i] !== a[i]) {
      return {
        pass: false,
        msg: "Values don't match the expected output (compared independent of row order).",
      };
    }
  }
  return { pass: true, msg: "All rows match. \u2714" };
}

// --- Execute a single SQL query ---

export async function executeQuery(
  db: { query: (sql: string) => Promise<{ fields: { name: string }[]; rows: Record<string, unknown>[] }> },
  sql: string
): Promise<QueryResult> {
  const res = await db.query(sql);
  const cols = res.fields.map((f) => f.name);
  const rows = res.rows.map((r) => cols.map((c) => r[c] as string | number | null | Date));
  return { cols, rows };
}

// --- Run visible + hidden tests ---

export interface TestRunResult {
  passed: boolean;
  message: string;
  userResult: QueryResult | null;
}

export async function runTests(
  db: {
    exec: (sql: string) => Promise<unknown>;
    query: (sql: string) => Promise<{ fields: { name: string }[]; rows: Record<string, unknown>[] }>;
  },
  question: Question,
  sql: string
): Promise<TestRunResult> {
  // Reset to visible test data
  try {
    await db.exec(question.setup);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { passed: false, message: `Setup error: ${msg}`, userResult: null };
  }

  // Run user query
  let userResult: QueryResult;
  try {
    userResult = await executeQuery(db, sql);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { passed: false, message: `SQL error: ${msg}`, userResult: null };
  }

  // Compare against visible expected output
  const visibleExpected: QueryResult = { cols: question.cols, rows: question.rows };
  const visibleCmp = compareResults(visibleExpected, userResult);
  if (!visibleCmp.pass) {
    return { passed: false, message: visibleCmp.msg, userResult };
  }

  // Run hidden test cases
  const hiddenTests = question.tests || [];
  for (let i = 0; i < hiddenTests.length; i++) {
    const tc = hiddenTests[i];
    try {
      await db.exec(tc.setup);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        passed: false,
        message: `Setup error in hidden test: ${msg}`,
        userResult,
      };
    }
    let tcResult: QueryResult;
    try {
      tcResult = await executeQuery(db, sql);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        passed: false,
        message: `SQL error on hidden test case ${i + 2}: ${msg}`,
        userResult,
      };
    }
    const tcExpected: QueryResult = { cols: question.cols, rows: tc.rows };
    const tcCmp = compareResults(tcExpected, tcResult);
    if (!tcCmp.pass) {
      return {
        passed: false,
        message: `Passed visible test but failed hidden test case ${i + 2}. ${tcCmp.msg} Your query may be hardcoded for the sample data.`,
        userResult,
      };
    }
  }

  // Restore visible test data after running hidden tests
  try {
    await db.exec(question.setup);
  } catch {
    // best-effort restore
  }

  const totalTests = 1 + hiddenTests.length;
  return {
    passed: true,
    message: `Correct! All ${totalTests} test case${totalTests > 1 ? "s" : ""} passed. ${visibleCmp.msg}`,
    userResult,
  };
}
