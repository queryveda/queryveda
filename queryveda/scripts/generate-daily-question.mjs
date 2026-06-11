#!/usr/bin/env node

/**
 * Generates a daily SQL practice question using Groq API (Llama 3.3 70B).
 * Writes to public/daily-question.json.
 *
 * Usage: GROK_API_KEY=xxx node scripts/generate-daily-question.mjs
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, "../public/daily-question.json");

const GROK_API_KEY = process.env.GROK_API_KEY;
if (!GROK_API_KEY) {
  console.error("GROK_API_KEY is required");
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
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "mixtral-8x7b-32768",
];

async function callGroq(model) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: PROMPT }],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${model} returned ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function generate() {
  console.log(`Generating daily question for ${today}, topic: ${topic}`);

  let content;
  for (const model of MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      content = await callGroq(model);
      console.log(`Success with ${model}`);
      break;
    } catch (e) {
      console.warn(e.message);
      if (e.message.includes("429")) {
        console.log(`Rate limited, waiting 20s and retrying ${model}...`);
        await new Promise((r) => setTimeout(r, 20000));
        try {
          content = await callGroq(model);
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
