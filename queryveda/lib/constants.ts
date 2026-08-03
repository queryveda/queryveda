import type { Topic, Difficulty } from "./types";

export const TOPICS: Topic[] = [
  "Aggregations & JOINs",
  "Window Functions",
  "Cumulative & Sliding Windows",
  "Consecutive Sequences",
  "Advanced Analytics",
  "Filtering & Conditionals",
  "String & Text",
  "Date & Time",
  "Ratios & Rates",
  "Self-Joins & Comparisons",
  "Set Operations",
  "Statistical Aggregates",
];

export const TOPIC_COLORS: Record<Topic, string> = {
  "Aggregations & JOINs": "#7C3AED",
  "Window Functions": "#8b5cf6",
  "Cumulative & Sliding Windows": "#06b6d4",
  "Consecutive Sequences": "#f59e0b",
  "Advanced Analytics": "#ec4899",
  "Filtering & Conditionals": "#0ea5e9",
  "String & Text": "#14b8a6",
  "Date & Time": "#a855f7",
  "Ratios & Rates": "#f43f5e",
  "Self-Joins & Comparisons": "#f97316",
  "Set Operations": "#84cc16",
  "Statistical Aggregates": "#10b981",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: "#22c55e",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};
