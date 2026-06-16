export interface ConceptualQuestion {
  id: string;                          // e.g., "cell-refs-concept-1"
  type: "multiple-choice" | "fill-blank";
  question: string;
  options?: string[];                  // for multiple-choice
  correctAnswer: string;              // the correct option text or fill-blank answer
  explanation: string;                // shown after answering
}

export interface ExcelTargetCell {
  cell: string;                       // e.g., "B6"
  expected: string | number;          // expected computed value
  expectedFormula?: string;           // optional: validate formula text too
}

export interface ExcelExercise {
  id: string;                          // e.g., "basic-formulas-sum-1"
  type: "write-formula" | "fix-formula" | "build-step-by-step";
  title: string;
  instruction: string;
  initialData: {
    cols: number;                      // number of columns
    rows: number;                      // number of rows
    cells: Record<string, { v: string | number; f?: string }>;  // cell address -> value/formula
  };
  targetCells: ExcelTargetCell[];
  hints: string[];
  steps?: {                            // only for build-step-by-step
    instruction: string;
    targetCells: ExcelTargetCell[];
  }[];
}

export interface ExcelSkillNode {
  id: string;                          // e.g., "cell-references"
  title: string;
  description: string;
  prerequisites: string[];             // node IDs that must be at 60%+
  conceptualQuestions: ConceptualQuestion[];
  exercises: ExcelExercise[];
  trunk: boolean;
  column: number;                      // 0 = center, -1 = left, 1 = right
  row: number;
}

export interface ExcelNodeMastery {
  nodeId: string;
  conceptualCompleted: number;
  conceptualTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  percentage: number;
  unlocked: boolean;
  starred: boolean;                    // 100% mastery
  conceptualDone: boolean;             // all warmups passed — hands-on unlocked
}
