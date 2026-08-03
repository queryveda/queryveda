#!/usr/bin/env node
// Validate QueryVeda SQL problems against PGlite using the app's real grader.
//
// Usage:
//   node scripts/validate-questions.mjs              # validate all questions
//   node scripts/validate-questions.mjs --min-id=78  # validate only ids >= 78 (new)
//   node scripts/validate-questions.mjs --id=78,79   # validate specific ids
//
// A problem is valid iff runTests(db, q, q.solution).passed === true, i.e. the reference
// solution reproduces the visible expected rows AND every hidden test, using the exact
// order-independent normalization/comparison the app uses in the browser.
//
// Requires Node >= 22 with native TS type-stripping (lib/pglite.ts + lib/questions.ts are
// imported directly; lib/questions.ts line 1 must be `import type { Question }`).

import { PGlite } from "@electric-sql/pglite";
import { runTests } from "../lib/pglite.ts";
import { questions } from "../lib/questions.ts";

// PGlite's default DATE parser returns a UTC-midnight Date object, which renders with a
// spurious time-of-day when formatted in a non-UTC timezone. Register a DATE (OID 1082)
// parser that instead builds a LOCAL-midnight Date, so fmtDate renders YYYY-MM-DD
// identically in every timezone, matching the app. Without this, date problems false-fail.
const dateParser = (v) => {
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
};
const parsers = { 1082: dateParser };

function parseArgs(argv) {
  let minId = null;
  let ids = null;
  for (const a of argv.slice(2)) {
    if (a.startsWith("--min-id=")) minId = Number(a.slice("--min-id=".length));
    else if (a.startsWith("--id=")) ids = a.slice("--id=".length).split(",").map(Number);
  }
  return { minId, ids };
}

async function main() {
  const { minId, ids } = parseArgs(process.argv);
  let targets = questions;
  if (ids) targets = targets.filter((q) => ids.includes(q.id));
  else if (minId != null) targets = targets.filter((q) => q.id >= minId);

  let pass = 0;
  const fails = [];
  for (const q of targets) {
    const db = new PGlite({ parsers });
    try {
      const r = await runTests(db, q, q.solution);
      if (r.passed) pass++;
      else fails.push({ id: q.id, title: q.title, msg: r.message });
    } catch (e) {
      fails.push({ id: q.id, title: q.title, msg: `THREW ${e.message}` });
    } finally {
      await db.close();
    }
  }

  console.log(`\nValidated ${targets.length} problem(s): PASS ${pass} / FAIL ${fails.length}`);
  for (const f of fails) console.log(`  ✗ #${f.id} ${f.title}: ${f.msg}`);
  process.exit(fails.length > 0 ? 1 : 0);
}

main();
