export type Difficulty = "Easy" | "Medium" | "Hard";

export type Topic =
  | "Aggregations & JOINs"
  | "Window Functions"
  | "Cumulative & Sliding Windows"
  | "Consecutive Sequences"
  | "Advanced Analytics";

export interface TestCase {
  setup: string;
  rows: (string | number | null)[][];
}

export interface Question {
  id: number;
  title: string;
  difficulty: Difficulty;
  topic: Topic;
  desc: string;
  setup: string;
  tables: string[];
  cols: string[];
  rows: (string | number | null)[][];
  solution: string;
  tips: string;
  hints: string[];
  tests: TestCase[];
  note?: string;
  optSolution?: string;
}

export interface UserProgress {
  question_id: number;
  status: "solved" | "attempted";
  solved_at?: string;
}

export type QuestionStatus = "solved" | "attempted" | "todo";

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}
