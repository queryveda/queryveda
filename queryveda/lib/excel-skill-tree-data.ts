import type { ExcelSkillNode } from "./excel-skill-tree-types";

export const excelSkillTreeNodes: ExcelSkillNode[] = [
  // ──────────────── NODE 1: Cell References & Navigation ────────────────
  {
    id: "cell-references",
    title: "Cell References & Navigation",
    description:
      "The foundation of every spreadsheet. Learn A1 notation, absolute vs relative references, and working with ranges.",
    prerequisites: [],
    trunk: true,
    column: 0,
    row: 0,
    conceptualQuestions: [
      {
        id: "cell-refs-concept-1",
        type: "multiple-choice",
        question: "What does the cell reference $A$1 mean?",
        options: [
          "Relative reference to column A, row 1",
          "Absolute reference — column and row stay fixed when copied",
          "A reference to a named range called A1",
          "A reference to the first cell in every sheet",
        ],
        correctAnswer: "Absolute reference — column and row stay fixed when copied",
        explanation:
          "The $ signs lock both the column (A) and row (1). When you copy the formula to another cell, $A$1 always points to the same cell.",
      },
      {
        id: "cell-refs-concept-2",
        type: "multiple-choice",
        question: "If you copy the formula =A1+B1 from row 1 to row 3, what does the formula become?",
        options: ["=A1+B1", "=A3+B3", "=$A$1+$B$1", "=A1+B3"],
        correctAnswer: "=A3+B3",
        explanation:
          "Without $ signs, both references are relative. They shift down by the same number of rows you copied (2 rows), so A1→A3 and B1→B3.",
      },
      {
        id: "cell-refs-concept-3",
        type: "fill-blank",
        question: "To lock only the row in a cell reference (so the column can change when copied), you write A___1. What goes in the blank?",
        correctAnswer: "$",
        explanation: "A$1 is a mixed reference — the column (A) is relative and will shift, but the row (1) is locked with $.",
      },
    ],
    exercises: [
      {
        id: "cell-refs-ex1",
        type: "write-formula",
        title: "Simple cell reference",
        instruction: "In cell C1, write a formula that adds the values in A1 and B1.",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 10 },
            B1: { v: 25 },
            A2: { v: 5 },
            B2: { v: 15 },
          },
        },
        targetCells: [{ cell: "C1", expected: 35, expectedFormula: "=A1+B1" }],
        hints: ["Start with = to begin a formula", "Use + to add two cell references"],
      },
      {
        id: "cell-refs-ex2",
        type: "write-formula",
        title: "Using a range reference",
        instruction: "In cell A4, write a formula using SUM to add A1 through A3.",
        initialData: {
          cols: 2,
          rows: 4,
          cells: {
            A1: { v: 10 },
            A2: { v: 20 },
            A3: { v: 30 },
          },
        },
        targetCells: [{ cell: "A4", expected: 60, expectedFormula: "=SUM(A1:A3)" }],
        hints: ["Use = to start", "SUM takes a range like A1:A3"],
      },
      {
        id: "cell-refs-ex3",
        type: "fix-formula",
        title: "Fix the absolute reference",
        instruction:
          "Cell B1 has a formula that should always reference the tax rate in A1 (10%), but it uses a relative reference. Fix it to use an absolute reference.",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 0.1 },
            B1: { v: 0, f: "=100*A1" },
          },
        },
        targetCells: [{ cell: "B1", expected: 10, expectedFormula: "=100*$A$1" }],
        hints: [
          "Use $ before the column letter and row number to lock both",
          "The correct syntax is $A$1",
        ],
      },
    ],
  },

  // ──────────────── NODE 2: Basic Formulas ────────────────
  {
    id: "basic-formulas",
    title: "Basic Formulas",
    description:
      "Learn the most-used spreadsheet functions: SUM, AVERAGE, COUNT, MIN, and MAX. These are the building blocks of data analysis.",
    prerequisites: ["cell-references"],
    trunk: true,
    column: 0,
    row: 1,
    conceptualQuestions: [
      {
        id: "basic-formulas-concept-1",
        type: "multiple-choice",
        question: "What is the difference between COUNT and COUNTA?",
        options: [
          "COUNT counts all cells; COUNTA counts only numbers",
          "COUNT counts numbers only; COUNTA counts all non-empty cells",
          "They are the same function",
          "COUNTA counts cells with formulas only",
        ],
        correctAnswer: "COUNT counts numbers only; COUNTA counts all non-empty cells",
        explanation:
          "COUNT only counts cells containing numeric values. COUNTA counts any non-empty cell — numbers, text, errors, etc.",
      },
      {
        id: "basic-formulas-concept-2",
        type: "fill-blank",
        question: "The function _______(A1:A10) returns the smallest value in the range A1 to A10.",
        correctAnswer: "MIN",
        explanation: "MIN returns the smallest (minimum) value in a range. MAX returns the largest.",
      },
    ],
    exercises: [
      {
        id: "basic-formulas-ex1",
        type: "write-formula",
        title: "Sum a sales column",
        instruction: "In cell B6, write a SUM formula to total the sales in B1:B5.",
        initialData: {
          cols: 2,
          rows: 6,
          cells: {
            A1: { v: "Jan" }, A2: { v: "Feb" }, A3: { v: "Mar" }, A4: { v: "Apr" }, A5: { v: "May" },
            B1: { v: 120 }, B2: { v: 95 }, B3: { v: 140 }, B4: { v: 110 }, B5: { v: 135 },
          },
        },
        targetCells: [{ cell: "B6", expected: 600, expectedFormula: "=SUM(B1:B5)" }],
        hints: ["SUM adds up all values in a range", "Syntax: =SUM(start:end)"],
      },
      {
        id: "basic-formulas-ex2",
        type: "write-formula",
        title: "Calculate an average",
        instruction: "In cell B7, write an AVERAGE formula for the scores in B1:B5.",
        initialData: {
          cols: 2,
          rows: 7,
          cells: {
            A1: { v: "Test 1" }, A2: { v: "Test 2" }, A3: { v: "Test 3" }, A4: { v: "Test 4" }, A5: { v: "Test 5" },
            B1: { v: 85 }, B2: { v: 92 }, B3: { v: 78 }, B4: { v: 95 }, B5: { v: 88 },
          },
        },
        targetCells: [{ cell: "B7", expected: 87.6, expectedFormula: "=AVERAGE(B1:B5)" }],
        hints: ["AVERAGE calculates the mean of a range", "Syntax: =AVERAGE(start:end)"],
      },
      {
        id: "basic-formulas-ex3",
        type: "write-formula",
        title: "Find the maximum",
        instruction: "In cell B6, use MAX to find the highest temperature in B1:B5.",
        initialData: {
          cols: 2,
          rows: 6,
          cells: {
            A1: { v: "Mon" }, A2: { v: "Tue" }, A3: { v: "Wed" }, A4: { v: "Thu" }, A5: { v: "Fri" },
            B1: { v: 72 }, B2: { v: 68 }, B3: { v: 75 }, B4: { v: 80 }, B5: { v: 71 },
          },
        },
        targetCells: [{ cell: "B6", expected: 80, expectedFormula: "=MAX(B1:B5)" }],
        hints: ["MAX returns the largest value in a range"],
      },
      {
        id: "basic-formulas-ex4",
        type: "fix-formula",
        title: "Fix the COUNT formula",
        instruction: "The formula in B7 tries to count how many scores exist, but it includes the header. Fix it.",
        initialData: {
          cols: 2,
          rows: 7,
          cells: {
            A1: { v: "Student" }, B1: { v: "Score" },
            A2: { v: "Alice" }, B2: { v: 88 },
            A3: { v: "Bob" }, B3: { v: 92 },
            A4: { v: "Carol" }, B4: { v: 75 },
            B7: { v: 0, f: "=COUNT(B1:B4)" },
          },
        },
        targetCells: [{ cell: "B7", expected: 3, expectedFormula: "=COUNT(B2:B4)" }],
        hints: [
          "The header 'Score' in B1 is text — COUNT ignores it, but the range should start at B2 for clarity",
          "Change the range to start at B2",
        ],
      },
    ],
  },

  // ──────────────── NODE 3: Text Functions ────────────────
  {
    id: "text-functions",
    title: "Text Functions",
    description:
      "Clean and transform text data with LEFT, RIGHT, MID, CONCATENATE, TRIM, and LEN. Essential for messy real-world data.",
    prerequisites: ["basic-formulas"],
    trunk: true,
    column: 0,
    row: 2,
    conceptualQuestions: [
      {
        id: "text-concept-1",
        type: "multiple-choice",
        question: "What does TRIM do?",
        options: [
          "Removes all spaces from a string",
          "Removes leading and trailing spaces, and reduces internal spaces to one",
          "Converts text to uppercase",
          "Extracts a substring from the middle of text",
        ],
        correctAnswer: "Removes leading and trailing spaces, and reduces internal spaces to one",
        explanation:
          "TRIM cleans up extra whitespace — it removes spaces at the start and end, and collapses multiple internal spaces to a single space.",
      },
      {
        id: "text-concept-2",
        type: "fill-blank",
        question: "The function _______(\"Hello World\", 5) returns \"Hello\".",
        correctAnswer: "LEFT",
        explanation: "LEFT(text, num_chars) extracts the specified number of characters from the beginning of a string.",
      },
    ],
    exercises: [
      {
        id: "text-ex1",
        type: "write-formula",
        title: "Extract first name",
        instruction: "In B1, use LEFT and FIND to extract the first name from the full name in A1. (Hint: find the space position first.)",
        initialData: {
          cols: 2,
          rows: 3,
          cells: {
            A1: { v: "Alice Johnson" },
            A2: { v: "Bob Smith" },
            A3: { v: "Carol Williams" },
          },
        },
        targetCells: [{ cell: "B1", expected: "Alice" }],
        hints: [
          "FIND(\" \", A1) gives you the position of the space",
          "LEFT(A1, FIND(\" \", A1) - 1) extracts everything before the space",
        ],
      },
      {
        id: "text-ex2",
        type: "write-formula",
        title: "Concatenate with separator",
        instruction: "In C1, combine the first name in A1 and last name in B1 with a space between them using CONCATENATE or &.",
        initialData: {
          cols: 3,
          rows: 2,
          cells: {
            A1: { v: "Alice" },
            B1: { v: "Johnson" },
          },
        },
        targetCells: [{ cell: "C1", expected: "Alice Johnson" }],
        hints: [
          "You can use =A1&\" \"&B1",
          "Or =CONCATENATE(A1, \" \", B1)",
        ],
      },
      {
        id: "text-ex3",
        type: "write-formula",
        title: "Clean messy data",
        instruction: "Cell A1 has extra spaces. In B1, use TRIM to clean it up.",
        initialData: {
          cols: 2,
          rows: 2,
          cells: {
            A1: { v: "  Hello   World  " },
          },
        },
        targetCells: [{ cell: "B1", expected: "Hello World", expectedFormula: "=TRIM(A1)" }],
        hints: ["TRIM removes extra spaces from text"],
      },
    ],
  },

  // ──────────────── NODE 4: Logical Functions ────────────────
  {
    id: "logical-functions",
    title: "Logical Functions",
    description:
      "Make decisions in your spreadsheet with IF, AND, OR, nested IFs, and IFERROR. These let you build smart, conditional calculations.",
    prerequisites: ["basic-formulas"],
    trunk: false,
    column: 1,
    row: 2,
    conceptualQuestions: [
      {
        id: "logical-concept-1",
        type: "multiple-choice",
        question: "What does =IF(A1>10, \"High\", \"Low\") return when A1 is 5?",
        options: ["High", "Low", "5", "FALSE"],
        correctAnswer: "Low",
        explanation: "IF checks the condition (A1>10). Since 5 is not greater than 10, it returns the false_value: \"Low\".",
      },
      {
        id: "logical-concept-2",
        type: "multiple-choice",
        question: "When would you use IFERROR?",
        options: [
          "To check if a cell contains an error before it happens",
          "To replace an error result (like #DIV/0! or #N/A) with a friendlier value",
          "To throw a custom error message",
          "To prevent users from entering invalid data",
        ],
        correctAnswer: "To replace an error result (like #DIV/0! or #N/A) with a friendlier value",
        explanation:
          "IFERROR wraps a formula and returns an alternative value if the formula produces an error. For example, =IFERROR(A1/B1, 0) returns 0 instead of #DIV/0!",
      },
      {
        id: "logical-concept-3",
        type: "fill-blank",
        question: "=AND(TRUE, FALSE) returns _______.",
        correctAnswer: "FALSE",
        explanation: "AND returns TRUE only when ALL arguments are TRUE. Since one argument is FALSE, the result is FALSE.",
      },
    ],
    exercises: [
      {
        id: "logical-ex1",
        type: "write-formula",
        title: "Pass or fail",
        instruction: "In B1, write an IF formula: if the score in A1 is 60 or above, show \"Pass\", otherwise \"Fail\".",
        initialData: {
          cols: 2,
          rows: 3,
          cells: {
            A1: { v: 75 },
            A2: { v: 42 },
            A3: { v: 60 },
          },
        },
        targetCells: [{ cell: "B1", expected: "Pass" }],
        hints: [
          "Syntax: =IF(condition, value_if_true, value_if_false)",
          "The condition is A1>=60",
        ],
      },
      {
        id: "logical-ex2",
        type: "write-formula",
        title: "Safe division with IFERROR",
        instruction: "In C1, divide A1 by B1. Use IFERROR to return 0 if B1 is zero.",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 100 },
            B1: { v: 0 },
            A2: { v: 200 },
            B2: { v: 4 },
          },
        },
        targetCells: [{ cell: "C1", expected: 0 }],
        hints: [
          "Wrap the division in IFERROR",
          "=IFERROR(A1/B1, 0)",
        ],
      },
      {
        id: "logical-ex3",
        type: "write-formula",
        title: "Nested IF for grading",
        instruction: "In B1, write a nested IF: if score >=90 show \"A\", >=80 show \"B\", >=70 show \"C\", otherwise \"F\".",
        initialData: {
          cols: 2,
          rows: 4,
          cells: {
            A1: { v: 85 },
            A2: { v: 92 },
            A3: { v: 65 },
            A4: { v: 73 },
          },
        },
        targetCells: [{ cell: "B1", expected: "B" }],
        hints: [
          "Start with the highest threshold: =IF(A1>=90, ...)",
          "Each else branch is another IF: =IF(A1>=90,\"A\",IF(A1>=80,\"B\",IF(A1>=70,\"C\",\"F\")))",
        ],
      },
      {
        id: "logical-ex4",
        type: "write-formula",
        title: "AND + IF combo",
        instruction: "In C1, write a formula: if score in A1 is >=70 AND attendance in B1 is >=80, show \"Eligible\", otherwise \"Not Eligible\".",
        initialData: {
          cols: 3,
          rows: 3,
          cells: {
            A1: { v: 75 },
            B1: { v: 85 },
            A2: { v: 80 },
            B2: { v: 60 },
          },
        },
        targetCells: [{ cell: "C1", expected: "Eligible" }],
        hints: [
          "Combine IF with AND: =IF(AND(condition1, condition2), true_val, false_val)",
          "=IF(AND(A1>=70, B1>=80), \"Eligible\", \"Not Eligible\")",
        ],
      },
    ],
  },
];
