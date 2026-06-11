#!/usr/bin/env node

/**
 * Generates a daily SQL practice question using Google Gemini API.
 * Writes to public/daily-question.json.
 *
 * Usage: GEMINI_API_KEY=xxx node scripts/generate-daily-question.mjs
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, "../public/daily-question.json");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is required");
  process.exit(1);
}

const TOPICS = [
  "Aggregations & JOINs",
  "Window Functions",
  "Cumulative & Sliding Windows",
  "Consecutive Sequences",
  "Advanced Analytics",
];

// Pick a random topic seeded by date
const today = new Date().toISOString().slice(0, 10);
const dayIndex = Math.floor(Date.now() / 86400000);
const topic = TOPICS[dayIndex % TOPICS.length];

const PROMPT = `You are a PostgreSQL question generator for a SQL practice platform.

Generate ONE medium-difficulty PostgreSQL practice question on the topic "${topic}".

The question must:
1. Use realistic, small datasets (3-10 rows per table)
2. Require JOINs, window functions, CTEs, or analytical SQL (appropriate to the topic)
3. Have a clear, unambiguous expected output
4. Include progressive hints (3 hints, from vague to specific)
5. Include 2 additional hidden test cases with different data

Respond with ONLY valid JSON (no markdown, no code fences) in this exact structure:

{
  "title": "Short descriptive title",
  "difficulty": "Medium",
  "topic": "${topic}",
  "desc": "Full problem description explaining what the user needs to query",
  "setup": "Complete SQL: CREATE TABLE statements with INSERT INTO statements for sample data. Use DROP TABLE IF EXISTS before each CREATE.",
  "tables": ["table_name_1", "table_name_2"],
  "cols": ["expected_column_1", "expected_column_2"],
  "rows": [["row1_val1", "row1_val2"], ["row2_val1", "row2_val2"]],
  "solution": "The correct SQL query",
  "tips": "Brief optimization or alternative approach tip",
  "hints": ["Hint 1 (vague)", "Hint 2 (medium)", "Hint 3 (nearly gives it away)"],
  "tests": [
    {
      "setup": "Complete SQL: DROP + CREATE + INSERT for test case 2 with different data",
      "rows": [["expected_row_values"]]
    },
    {
      "setup": "Complete SQL: DROP + CREATE + INSERT for test case 3 with different data",
      "rows": [["expected_row_values"]]
    }
  ]
}

Important:
- All string values in rows must be actual strings. Numbers must be actual numbers. Nulls must be null.
- The "setup" field must contain complete DDL+DML that can run independently.
- Each test "setup" must also contain complete DDL+DML (DROP IF EXISTS + CREATE + INSERT).
- Ensure the "rows" match what the "solution" query would actually produce against the "setup" data.
- Column names in "cols" must match the query output exactly.`;

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

async function callGemini(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${model} returned ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function generate() {
  console.log(`Generating daily question for ${today}, topic: ${topic}`);

  let content;
  for (const model of MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      content = await callGemini(model);
      console.log(`Success with ${model}`);
      break;
    } catch (e) {
      console.warn(`${e.message}`);
      // If rate-limited, wait and retry once with same model
      if (e.message.includes("429")) {
        console.log(`Rate limited, waiting 20s and retrying ${model}...`);
        await new Promise((r) => setTimeout(r, 20000));
        try {
          content = await callGemini(model);
          console.log(`Success with ${model} after retry`);
          break;
        } catch (e2) {
          console.warn(`Retry failed: ${e2.message}`);
        }
      }
    }
  }

  if (!content) {
    console.error("All models failed");
    process.exit(1);
  }

  // Parse and validate
  let question;
  try {
    question = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse JSON response:", content.slice(0, 500));
    process.exit(1);
  }

  const required = ["title", "difficulty", "desc", "setup", "tables", "cols", "rows", "solution", "tips", "hints", "tests"];
  for (const key of required) {
    if (!(key in question)) {
      console.error(`Missing required field: ${key}`);
      process.exit(1);
    }
  }

  if (question.difficulty !== "Medium") {
    question.difficulty = "Medium";
  }

  const output = {
    date: today,
    question,
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`Written to ${OUTPUT}`);
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
