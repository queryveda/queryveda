export interface BuildStep {
  prompt: string;
  template: string;          // full query with {{BLANK}} for editable region
  expectedOutput: (string | number | null)[][];
}

export interface Variation {
  setupSQL: string;
  template: string;
  expectedOutput: (string | number | null)[][];
}

export interface MicroExercise {
  id: string;                // e.g., "group-by-ex1"
  type: "fill-blank" | "build-incremental" | "fix-query";
  prompt: string;
  setupSQL: string;
  cols: string[];            // expected column names
  template: string;          // query with {{BLANK}} placeholder
  editableDefault?: string;  // pre-filled hint text
  steps?: BuildStep[];       // only for build-incremental
  variations: Variation[];
  expectedOutput: (string | number | null)[][];
  hints: string[];
}

export interface SkillNode {
  id: string;                // e.g., "group-by"
  title: string;
  description: string;       // 2-3 sentence concept explanation
  prerequisites: string[];   // node IDs that must be at 60%+
  relatedProblemIds: number[];
  exercises: MicroExercise[];
  // Position in the tree layout
  trunk: boolean;            // true = main trunk, false = branch
  column: number;            // 0 = center, -1 = left, 1 = right
  row: number;               // vertical position (0-based)
}

export interface SkillTreeProgress {
  [exerciseId: string]: {
    completed: boolean;
    completedAt?: string;
  };
}

export interface NodeMastery {
  nodeId: string;
  completed: number;
  total: number;
  percentage: number;
  unlocked: boolean;
  starred: boolean;          // 100% mastery
}
