import { Topic, Difficulty } from "./types";

export const TOPICS: Topic[] = [
  "Aggregations & JOINs",
  "Window Functions",
  "Cumulative & Sliding Windows",
  "Consecutive Sequences",
  "Advanced Analytics",
];

export const TOPIC_COLORS: Record<Topic, string> = {
  "Aggregations & JOINs": "#2563eb",
  "Window Functions": "#8b5cf6",
  "Cumulative & Sliding Windows": "#06b6d4",
  "Consecutive Sequences": "#f59e0b",
  "Advanced Analytics": "#ec4899",
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
