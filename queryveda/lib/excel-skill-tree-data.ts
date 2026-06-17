import type { ExcelSkillNode } from "./excel-skill-tree-types";

export const excelSkillTreeNodes: ExcelSkillNode[] = [
  // ──────────────── NODE 1: Cell References & Navigation ────────────────
  {
    id: "cell-references",
    title: "Cell References & Navigation",
    description:
      "The foundation of every spreadsheet. Learn A1 notation, absolute vs relative references, and working with ranges.",
    intro: {
      summary:
        "Every formula in Excel refers to cells by their address. A1 means column A, row 1. Understanding how references behave when you copy formulas is the single most important Excel skill.",
      keyPoints: [
        "A1 is a relative reference — it shifts when you copy the formula to another cell",
        "$A$1 is an absolute reference — it stays fixed no matter where you copy",
        "A$1 or $A1 are mixed references — one part is locked, the other shifts",
        "A range like A1:A10 refers to all cells from A1 through A10",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/overview-of-formulas-in-excel-ecfdc708-9162-49e8-b993-c311f47ca173",
      externalLabel: "Microsoft: Overview of formulas",
    },
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
    intro: {
      summary:
        "Formulas always start with = and can use built-in functions to calculate results. These five functions handle 80% of everyday spreadsheet tasks.",
      keyPoints: [
        "SUM(range) — adds all numbers in a range",
        "AVERAGE(range) — returns the arithmetic mean",
        "COUNT(range) — counts cells that contain numbers",
        "MIN(range) and MAX(range) — find the smallest and largest values",
        "You can nest functions: =ROUND(AVERAGE(A1:A10), 2)",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/sum-function-043e1c7d-7726-4e80-8f32-07b23e057f89",
      externalLabel: "Microsoft: SUM function",
    },
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
    intro: {
      summary:
        "Text functions let you extract, combine, and clean up text in your spreadsheet. Real-world data is often messy -- names in the wrong case, extra spaces, codes that need splitting -- and these functions handle all of it.",
      keyPoints: [
        "LEFT(text, n), RIGHT(text, n), and MID(text, start, n) extract parts of a string",
        "LEN(text) returns the number of characters, useful for validation",
        "TRIM removes extra spaces; CLEAN removes non-printable characters",
        "CONCATENATE or the & operator joins strings together",
        "UPPER, LOWER, and PROPER change text case; SUBSTITUTE replaces specific text",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/text-functions-reference-cccd86ad-547d-4ea9-a065-7bb697c2a56e",
      externalLabel: "Microsoft: Text functions reference",
    },
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
    intro: {
      summary:
        "Logical functions add decision-making to your formulas. The IF function checks a condition and returns different values depending on whether it is true or false. Combined with AND, OR, and IFERROR, you can handle complex business rules entirely in a spreadsheet.",
      keyPoints: [
        "IF(condition, value_if_true, value_if_false) is the core decision function",
        "AND(cond1, cond2, ...) returns TRUE only when all conditions are true",
        "OR(cond1, cond2, ...) returns TRUE when at least one condition is true",
        "IFERROR(formula, fallback) catches errors like #DIV/0! or #N/A and returns a clean fallback value",
        "Nested IFs handle multiple outcomes, but IFS(cond1, val1, cond2, val2, ...) is often cleaner",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/if-function-69aed7c9-4e8a-4755-a9bc-aa8bbff73be2",
      externalLabel: "Microsoft: IF function",
    },
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

  // ──────────────── NODE 5: Lookup Functions ────────────────
  {
    id: "lookup-functions",
    title: "Lookup Functions",
    description:
      "Find and retrieve data from other parts of your spreadsheet with VLOOKUP, HLOOKUP, INDEX/MATCH, and XLOOKUP.",
    intro: {
      summary:
        "Lookup functions search for a value in one place and return related information from another. They are the spreadsheet equivalent of joining tables in a database -- essential whenever you need to pull data from a reference table.",
      keyPoints: [
        "VLOOKUP(lookup_value, table, col_index, FALSE) searches the first column of a table and returns a value from another column",
        "The last argument should almost always be FALSE for an exact match",
        "INDEX(range, row_num) returns a value at a specific position; MATCH(value, range, 0) finds that position",
        "INDEX+MATCH together are more flexible than VLOOKUP because the lookup column does not need to be first",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1",
      externalLabel: "Microsoft: VLOOKUP function",
    },
    prerequisites: ["logical-functions"],
    trunk: true,
    column: 0,
    row: 3,
    conceptualQuestions: [
      {
        id: "lookup-concept-1",
        type: "multiple-choice",
        question: "Why is INDEX/MATCH often preferred over VLOOKUP?",
        options: [
          "INDEX/MATCH is faster to type",
          "VLOOKUP can only look right — INDEX/MATCH can look in any direction",
          "VLOOKUP doesn't work with numbers",
          "INDEX/MATCH automatically sorts the data",
        ],
        correctAnswer: "VLOOKUP can only look right — INDEX/MATCH can look in any direction",
        explanation:
          "VLOOKUP searches the leftmost column and returns a value to the right. INDEX/MATCH has no such limitation — the lookup column and return column can be anywhere.",
      },
      {
        id: "lookup-concept-2",
        type: "fill-blank",
        question: "The last argument of VLOOKUP is range_lookup. To find an exact match, set it to _______.",
        correctAnswer: "FALSE",
        explanation: "FALSE (or 0) forces an exact match. TRUE (or 1, or omitted) allows approximate match, which requires sorted data.",
      },
    ],
    exercises: [
      {
        id: "lookup-ex1",
        type: "write-formula",
        title: "Basic VLOOKUP",
        instruction: "In E2, use VLOOKUP to find the price of the product named in D2 from the table A1:B5.",
        initialData: {
          cols: 5,
          rows: 5,
          cells: {
            A1: { v: "Product" }, B1: { v: "Price" },
            A2: { v: "Laptop" }, B2: { v: 999 },
            A3: { v: "Mouse" }, B3: { v: 25 },
            A4: { v: "Keyboard" }, B4: { v: 75 },
            A5: { v: "Monitor" }, B5: { v: 300 },
            D1: { v: "Lookup" }, E1: { v: "Result" },
            D2: { v: "Mouse" },
          },
        },
        targetCells: [{ cell: "E2", expected: 25 }],
        hints: [
          "Syntax: =VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])",
          "=VLOOKUP(D2, A1:B5, 2, FALSE)",
        ],
      },
      {
        id: "lookup-ex2",
        type: "write-formula",
        title: "INDEX/MATCH lookup",
        instruction: "In E2, use INDEX and MATCH to find the department for employee ID in D2.",
        initialData: {
          cols: 5,
          rows: 5,
          cells: {
            A1: { v: "ID" }, B1: { v: "Name" }, C1: { v: "Dept" },
            A2: { v: 101 }, B2: { v: "Alice" }, C2: { v: "Engineering" },
            A3: { v: 102 }, B3: { v: "Bob" }, C3: { v: "Marketing" },
            A4: { v: 103 }, B4: { v: "Carol" }, C4: { v: "Sales" },
            D1: { v: "Find ID" }, E1: { v: "Dept" },
            D2: { v: 102 },
          },
        },
        targetCells: [{ cell: "E2", expected: "Marketing" }],
        hints: [
          "MATCH finds the position: =MATCH(D2, A2:A4, 0)",
          "INDEX returns the value: =INDEX(C2:C4, MATCH(D2, A2:A4, 0))",
        ],
      },
      {
        id: "lookup-ex3",
        type: "fix-formula",
        title: "Fix the VLOOKUP range",
        instruction: "The VLOOKUP in E2 returns #N/A because the table range and column index are wrong. Fix both.",
        initialData: {
          cols: 5,
          rows: 4,
          cells: {
            A1: { v: "Code" }, B1: { v: "Item" }, C1: { v: "Price" },
            A2: { v: "A1" }, B2: { v: "Widget" }, C2: { v: 10 },
            A3: { v: "B2" }, B3: { v: "Gadget" }, C3: { v: 20 },
            D1: { v: "Find" }, E1: { v: "Price" },
            D2: { v: "B2" },
            E2: { v: 0, f: "=VLOOKUP(D2,B1:C3,2,FALSE)" },
          },
        },
        targetCells: [{ cell: "E2", expected: 20 }],
        hints: [
          "VLOOKUP searches the first column of the table range — codes are in column A",
          "Change range to A1:C3 and column index to 3 (Price is the 3rd column): =VLOOKUP(D2,A1:C3,3,FALSE)",
        ],
      },
      {
        id: "lookup-ex4",
        type: "write-formula",
        title: "VLOOKUP with multiple columns",
        instruction: "Use VLOOKUP in E2 to find the salary for the employee in D2. The data table is A1:C5.",
        initialData: {
          cols: 5,
          rows: 5,
          cells: {
            A1: { v: "Name" }, B1: { v: "Dept" }, C1: { v: "Salary" },
            A2: { v: "Alice" }, B2: { v: "Engineering" }, C2: { v: 95000 },
            A3: { v: "Bob" }, B3: { v: "Marketing" }, C3: { v: 72000 },
            A4: { v: "Carol" }, B4: { v: "Sales" }, C4: { v: 68000 },
            A5: { v: "Dave" }, B5: { v: "Engineering" }, C5: { v: 88000 },
            D1: { v: "Find" }, E1: { v: "Salary" },
            D2: { v: "Carol" },
          },
        },
        targetCells: [{ cell: "E2", expected: 68000 }],
        hints: [
          "Salary is in the 3rd column of the table",
          "=VLOOKUP(D2,A1:C5,3,FALSE)",
        ],
      },
      {
        id: "lookup-ex5",
        type: "write-formula",
        title: "INDEX/MATCH — reverse lookup",
        instruction: "The name is in column B but you need the ID from column A. Use INDEX/MATCH in E2 to find the ID for the name in D2.",
        initialData: {
          cols: 5,
          rows: 5,
          cells: {
            A1: { v: "ID" }, B1: { v: "Name" }, C1: { v: "Score" },
            A2: { v: 201 }, B2: { v: "Eve" }, C2: { v: 89 },
            A3: { v: 202 }, B3: { v: "Frank" }, C3: { v: 94 },
            A4: { v: 203 }, B4: { v: "Grace" }, C4: { v: 76 },
            D1: { v: "Name" }, E1: { v: "ID" },
            D2: { v: "Frank" },
          },
        },
        targetCells: [{ cell: "E2", expected: 202 }],
        hints: [
          "VLOOKUP can't look left — use INDEX/MATCH instead",
          "=INDEX(A2:A4,MATCH(D2,B2:B4,0))",
        ],
      },
      {
        id: "lookup-ex6",
        type: "write-formula",
        title: "XLOOKUP basics",
        instruction: "Use XLOOKUP in E2 to find the city for the country in D2. Search A2:A4 and return from B2:B4.",
        initialData: {
          cols: 5,
          rows: 4,
          cells: {
            A1: { v: "Country" }, B1: { v: "Capital" },
            A2: { v: "Japan" }, B2: { v: "Tokyo" },
            A3: { v: "France" }, B3: { v: "Paris" },
            A4: { v: "Brazil" }, B4: { v: "Brasilia" },
            D1: { v: "Find" }, E1: { v: "Capital" },
            D2: { v: "France" },
          },
        },
        targetCells: [{ cell: "E2", expected: "Paris" }],
        hints: [
          "XLOOKUP(lookup_value, lookup_array, return_array)",
          "=XLOOKUP(D2,A2:A4,B2:B4)",
        ],
      },
      {
        id: "lookup-ex7",
        type: "write-formula",
        title: "XLOOKUP with default value",
        instruction: "Use XLOOKUP in E2 to look up the item in D2. If not found, return \"N/A\". Search A2:A4, return B2:B4.",
        initialData: {
          cols: 5,
          rows: 4,
          cells: {
            A1: { v: "Code" }, B1: { v: "Item" },
            A2: { v: "X1" }, B2: { v: "Bolt" },
            A3: { v: "X2" }, B3: { v: "Nut" },
            A4: { v: "X3" }, B4: { v: "Washer" },
            D1: { v: "Find" }, E1: { v: "Item" },
            D2: { v: "X5" },
          },
        },
        targetCells: [{ cell: "E2", expected: "N/A" }],
        hints: [
          "XLOOKUP has a 4th argument for the value to return if not found",
          "=XLOOKUP(D2,A2:A4,B2:B4,\"N/A\")",
        ],
      },
    ],
  },

  // ──────────────── NODE 6: Date & Time Functions ────────────────
  {
    id: "date-time-functions",
    title: "Date & Time Functions",
    description:
      "Work with dates and times using DATE, DATEDIF, EOMONTH, NETWORKDAYS, and date formatting with TEXT.",
    intro: {
      summary:
        "Excel stores every date as a serial number (the number of days since January 1, 1900). This means you can add, subtract, and compare dates with simple arithmetic. Date functions help you extract components, calculate durations, and handle business-day logic.",
      keyPoints: [
        "Dates are serial numbers: January 1, 1900 = 1, so today's date is a number in the 40,000-50,000 range",
        "DATE(year, month, day) builds a date from its parts; YEAR(), MONTH(), DAY() extract them",
        "DATEDIF(start, end, unit) calculates differences in years (\"Y\"), months (\"M\"), or days (\"D\")",
        "EOMONTH(date, months) returns the last day of a month offset from the given date",
        "NETWORKDAYS(start, end) counts only business days (Monday through Friday)",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/date-function-e36c0c8c-4104-49da-ab83-82328b832349",
      externalLabel: "Microsoft: DATE function",
    },
    prerequisites: ["basic-formulas"],
    trunk: false,
    column: -1,
    row: 3,
    conceptualQuestions: [
      {
        id: "date-concept-1",
        type: "multiple-choice",
        question: "How does Excel store dates internally?",
        options: [
          "As text strings like '2024-01-15'",
          "As serial numbers (days since a starting date)",
          "As Unix timestamps (seconds since 1970)",
          "As separate year, month, day values",
        ],
        correctAnswer: "As serial numbers (days since a starting date)",
        explanation: "Excel stores dates as numbers — 1 = Jan 1, 1900. This is why you can add/subtract dates to get differences in days.",
      },
    ],
    exercises: [
      {
        id: "date-ex1",
        type: "write-formula",
        title: "Days between dates",
        instruction: "In C1, calculate the number of days between the start date in A1 and end date in B1.",
        initialData: {
          cols: 3, rows: 2,
          cells: { A1: { v: 45292 }, B1: { v: 45322 } },
        },
        targetCells: [{ cell: "C1", expected: 30 }],
        hints: ["Simply subtract: =B1-A1"],
      },
      {
        id: "date-ex2",
        type: "write-formula",
        title: "End of month",
        instruction: "In B1, use EOMONTH to find the last day of the month that is 2 months after the date in A1.",
        initialData: { cols: 2, rows: 2, cells: { A1: { v: 45292 } } },
        targetCells: [{ cell: "B1", expected: 45382 }],
        hints: ["=EOMONTH(A1, 2)"],
      },
      {
        id: "date-ex3",
        type: "write-formula",
        title: "Working days between dates",
        instruction: "In C1, use NETWORKDAYS to count business days (Mon-Fri) between the dates in A1 and B1.",
        initialData: { cols: 3, rows: 2, cells: { A1: { v: 45292 }, B1: { v: 45296 } } },
        targetCells: [{ cell: "C1", expected: 5 }],
        hints: ["=NETWORKDAYS(A1, B1)"],
      },
    ],
  },

  // ──────────────── NODE 7: Conditional Aggregation ────────────────
  {
    id: "conditional-aggregation",
    title: "Conditional Aggregation",
    description:
      "Aggregate data with conditions using SUMIF, COUNTIF, AVERAGEIFS, and SUMPRODUCT. The Excel equivalent of SQL's WHERE + GROUP BY.",
    intro: {
      summary:
        "Conditional aggregation functions combine filtering and calculation in a single formula. Instead of summing an entire column, you can sum only the rows that meet specific criteria -- like totaling sales for one region or counting orders above a threshold.",
      keyPoints: [
        "SUMIF(range, criteria, sum_range) adds values where a single condition is met",
        "SUMIFS(sum_range, criteria_range1, criteria1, ...) supports multiple conditions",
        "COUNTIF and COUNTIFS count cells that match one or more criteria",
        "AVERAGEIF and AVERAGEIFS calculate conditional averages",
        "Criteria can use operators as text: \">50\", \"<>0\", \"North\"",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/sumif-function-169b8c99-c05c-4483-a712-1697a653039b",
      externalLabel: "Microsoft: SUMIF function",
    },
    prerequisites: ["lookup-functions"],
    trunk: true,
    column: 0,
    row: 4,
    conceptualQuestions: [
      {
        id: "cond-agg-concept-1",
        type: "multiple-choice",
        question: "What is the difference between SUMIF and SUMIFS?",
        options: [
          "SUMIF is faster than SUMIFS",
          "SUMIF takes one condition; SUMIFS takes multiple conditions",
          "SUMIFS only works with text criteria",
          "They are identical functions",
        ],
        correctAnswer: "SUMIF takes one condition; SUMIFS takes multiple conditions",
        explanation: "SUMIF handles a single criterion. SUMIFS can apply multiple criteria across different ranges.",
      },
      {
        id: "cond-agg-concept-2",
        type: "fill-blank",
        question: "=COUNTIF(A1:A10, \">50\") counts how many cells in A1:A10 contain values _______ than 50.",
        correctAnswer: "greater",
        explanation: "The criteria \">50\" means greater than 50.",
      },
    ],
    exercises: [
      {
        id: "cond-agg-ex1",
        type: "write-formula",
        title: "SUMIF by category",
        instruction: "In E1, use SUMIF to sum all sales (column B) where the region (column A) is \"North\".",
        initialData: {
          cols: 5, rows: 6,
          cells: {
            A1: { v: "North" }, B1: { v: 100 },
            A2: { v: "South" }, B2: { v: 150 },
            A3: { v: "North" }, B3: { v: 200 },
            A4: { v: "East" }, B4: { v: 120 },
            A5: { v: "North" }, B5: { v: 80 },
            D1: { v: "North Total" },
          },
        },
        targetCells: [{ cell: "E1", expected: 380 }],
        hints: ["=SUMIF(A1:A5, \"North\", B1:B5)"],
      },
      {
        id: "cond-agg-ex2",
        type: "write-formula",
        title: "COUNTIF with condition",
        instruction: "In D1, count how many scores in B1:B5 are 80 or above.",
        initialData: {
          cols: 4, rows: 5,
          cells: {
            A1: { v: "Alice" }, B1: { v: 85 },
            A2: { v: "Bob" }, B2: { v: 72 },
            A3: { v: "Carol" }, B3: { v: 91 },
            A4: { v: "Dave" }, B4: { v: 68 },
            A5: { v: "Eve" }, B5: { v: 88 },
          },
        },
        targetCells: [{ cell: "D1", expected: 3 }],
        hints: ["=COUNTIF(B1:B5, \">=80\")"],
      },
      {
        id: "cond-agg-ex3",
        type: "write-formula",
        title: "AVERAGEIFS with multiple criteria",
        instruction: "In F1, use AVERAGEIFS to average the sales (C column) where region is \"North\" AND product is \"Widget\".",
        initialData: {
          cols: 6, rows: 6,
          cells: {
            A1: { v: "North" }, B1: { v: "Widget" }, C1: { v: 100 },
            A2: { v: "South" }, B2: { v: "Widget" }, C2: { v: 150 },
            A3: { v: "North" }, B3: { v: "Gadget" }, C3: { v: 200 },
            A4: { v: "North" }, B4: { v: "Widget" }, C4: { v: 140 },
            A5: { v: "East" }, B5: { v: "Widget" }, C5: { v: 90 },
          },
        },
        targetCells: [{ cell: "F1", expected: 120 }],
        hints: ["=AVERAGEIFS(C1:C5, A1:A5, \"North\", B1:B5, \"Widget\")"],
      },
    ],
  },

  // ──────────────── NODE 8: Data Cleaning ────────────────
  {
    id: "data-cleaning",
    title: "Data Cleaning",
    description:
      "Clean messy real-world data with SUBSTITUTE, TRIM, VALUE, TEXT, PROPER, and techniques for removing duplicates.",
    intro: {
      summary:
        "Data rarely arrives in perfect shape. Data cleaning functions help you fix inconsistent casing, strip unwanted characters, convert text-that-looks-like-numbers into actual numbers, and standardize formats before analysis.",
      keyPoints: [
        "TRIM removes leading, trailing, and extra internal spaces; CLEAN strips non-printable characters",
        "SUBSTITUTE(text, old, new) replaces specific characters or substrings (e.g., removing dashes from phone numbers)",
        "VALUE(text) converts a text string that looks like a number into an actual number",
        "TEXT(value, format) formats a number or date as text (e.g., TEXT(0.15, \"0%\") returns \"15%\")",
        "PROPER(text) capitalizes the first letter of each word for consistent name formatting",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/clean-function-26f3d7c5-475f-4a9c-90e5-4b8ba987ba41",
      externalLabel: "Microsoft: CLEAN function",
    },
    prerequisites: ["text-functions"],
    trunk: false,
    column: -1,
    row: 4,
    conceptualQuestions: [
      {
        id: "cleaning-concept-1",
        type: "multiple-choice",
        question: "A column has numbers stored as text (e.g., \"1,234\"). Which function converts them to actual numbers?",
        options: ["INT", "VALUE", "NUMBER", "CONVERT"],
        correctAnswer: "VALUE",
        explanation: "VALUE converts a text string that looks like a number into an actual numeric value.",
      },
    ],
    exercises: [
      {
        id: "cleaning-ex1",
        type: "write-formula",
        title: "PROPER case",
        instruction: "In B1, use PROPER to capitalize the first letter of each word in A1.",
        initialData: { cols: 2, rows: 3, cells: { A1: { v: "john doe" }, A2: { v: "ALICE SMITH" }, A3: { v: "bOB jONES" } } },
        targetCells: [{ cell: "B1", expected: "John Doe", expectedFormula: "=PROPER(A1)" }],
        hints: ["PROPER capitalizes the first letter of each word"],
      },
      {
        id: "cleaning-ex2",
        type: "write-formula",
        title: "Remove characters with SUBSTITUTE",
        instruction: "Cell A1 has a phone number with dashes. In B1, remove all dashes using SUBSTITUTE.",
        initialData: { cols: 2, rows: 2, cells: { A1: { v: "555-123-4567" } } },
        targetCells: [{ cell: "B1", expected: "5551234567" }],
        hints: ["=SUBSTITUTE(A1, \"-\", \"\")"],
      },
      {
        id: "cleaning-ex3",
        type: "write-formula",
        title: "Text to number conversion",
        instruction: "Cell A1 has \"1,234\" as text. In B1, convert it to a number by removing the comma and using VALUE.",
        initialData: { cols: 2, rows: 2, cells: { A1: { v: "1,234" } } },
        targetCells: [{ cell: "B1", expected: 1234 }],
        hints: ["=VALUE(SUBSTITUTE(A1, \",\", \"\"))"],
      },
    ],
  },

  // ──────────────── NODE 9: Pivot Table Concepts ────────────────
  {
    id: "pivot-concepts",
    title: "Pivot Table Concepts",
    description:
      "Understand pivot table thinking — grouping, aggregating, and filtering data. The Excel equivalent of SQL GROUP BY.",
    intro: {
      summary:
        "Pivot tables summarize large datasets by grouping rows and calculating totals, averages, or counts for each group. They are the spreadsheet equivalent of SQL's GROUP BY clause and are one of Excel's most powerful analysis tools.",
      keyPoints: [
        "A pivot table has four areas: Rows (what to group by), Columns (cross-tabulation), Values (what to aggregate), and Filters",
        "Dragging a field to the Values area lets you choose SUM, COUNT, AVERAGE, or other aggregations",
        "You can replicate pivot table logic with formulas like SUMIF, COUNTIF, and SUMPRODUCT",
        "SUMPRODUCT(condition_array * value_array) is a versatile formula alternative to pivot tables",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576",
      externalLabel: "Microsoft: Create a PivotTable",
    },
    prerequisites: ["conditional-aggregation"],
    trunk: true,
    column: 0,
    row: 5,
    conceptualQuestions: [
      {
        id: "pivot-concept-1",
        type: "multiple-choice",
        question: "In pivot table terminology, what are 'rows', 'columns', and 'values'?",
        options: [
          "Rows = data source rows, Columns = data source columns, Values = cell contents",
          "Rows = group-by fields, Columns = cross-tab fields, Values = aggregated metrics",
          "Rows = filters, Columns = sorts, Values = formulas",
          "They are the same as regular spreadsheet rows, columns, and values",
        ],
        correctAnswer: "Rows = group-by fields, Columns = cross-tab fields, Values = aggregated metrics",
        explanation: "Pivot tables reorganize data: Row fields define groups (like SQL GROUP BY), Column fields create cross-tabulations, and Value fields are the metrics being aggregated.",
      },
      {
        id: "pivot-concept-2",
        type: "multiple-choice",
        question: "Which is the SQL equivalent of a pivot table that shows total sales by region?",
        options: [
          "SELECT * FROM sales WHERE region IS NOT NULL",
          "SELECT region, SUM(amount) FROM sales GROUP BY region",
          "SELECT DISTINCT region FROM sales",
          "SELECT region, amount FROM sales ORDER BY region",
        ],
        correctAnswer: "SELECT region, SUM(amount) FROM sales GROUP BY region",
        explanation: "A pivot table with 'region' as a row field and SUM of 'amount' as the value is equivalent to GROUP BY region with SUM aggregation.",
      },
    ],
    exercises: [
      {
        id: "pivot-ex1",
        type: "write-formula",
        title: "Manual pivot: sum by category",
        instruction: "Simulate a pivot table: in E2, use SUMIF to total sales for 'Electronics'.",
        initialData: {
          cols: 5, rows: 6,
          cells: {
            A1: { v: "Category" }, B1: { v: "Sales" },
            A2: { v: "Electronics" }, B2: { v: 500 },
            A3: { v: "Clothing" }, B3: { v: 300 },
            A4: { v: "Electronics" }, B4: { v: 700 },
            A5: { v: "Food" }, B5: { v: 200 },
            A6: { v: "Electronics" }, B6: { v: 400 },
            D1: { v: "Category" }, E1: { v: "Total" },
            D2: { v: "Electronics" },
          },
        },
        targetCells: [{ cell: "E2", expected: 1600 }],
        hints: ["=SUMIF(A2:A6, D2, B2:B6)"],
      },
      {
        id: "pivot-ex2",
        type: "write-formula",
        title: "Count by group",
        instruction: "In E2, count how many transactions are in the 'Clothing' category.",
        initialData: {
          cols: 5, rows: 7,
          cells: {
            A1: { v: "Category" }, B1: { v: "Amount" },
            A2: { v: "Electronics" }, B2: { v: 50 },
            A3: { v: "Clothing" }, B3: { v: 30 },
            A4: { v: "Clothing" }, B4: { v: 45 },
            A5: { v: "Electronics" }, B5: { v: 60 },
            A6: { v: "Clothing" }, B6: { v: 25 },
            D1: { v: "Category" }, E1: { v: "Count" },
            D2: { v: "Clothing" },
          },
        },
        targetCells: [{ cell: "E2", expected: 3 }],
        hints: ["=COUNTIF(A2:A6, D2)"],
      },
      {
        id: "pivot-ex3",
        type: "write-formula",
        title: "Average by group",
        instruction: "In E2, calculate the average order value for 'Electronics'.",
        initialData: {
          cols: 5, rows: 6,
          cells: {
            A1: { v: "Category" }, B1: { v: "Order Value" },
            A2: { v: "Electronics" }, B2: { v: 120 },
            A3: { v: "Books" }, B3: { v: 25 },
            A4: { v: "Electronics" }, B4: { v: 80 },
            A5: { v: "Electronics" }, B5: { v: 200 },
            D1: { v: "Category" }, E1: { v: "Avg" },
            D2: { v: "Electronics" },
          },
        },
        targetCells: [{ cell: "E2", expected: 133.33 }],
        hints: ["=AVERAGEIF(A2:A5, D2, B2:B5)"],
      },
    ],
  },

  // ──────────────── NODE 10: Array Formulas & Dynamic Arrays ────────────────
  {
    id: "array-formulas",
    title: "Array Formulas & Dynamic Arrays",
    description:
      "Harness the power of array formulas with FILTER, SORT, UNIQUE, and SEQUENCE. Modern Excel's most powerful feature set.",
    intro: {
      summary:
        "Array formulas operate on multiple values at once instead of a single cell. Modern Excel's dynamic array engine lets one formula return results that spill across many cells, enabling powerful operations like filtering, sorting, and generating sequences with a single formula.",
      keyPoints: [
        "Dynamic arrays automatically spill results into neighboring cells -- no Ctrl+Shift+Enter needed in modern Excel",
        "SUMPRODUCT(array1, array2) multiplies arrays element-by-element and sums the result, useful for weighted calculations",
        "TRANSPOSE(range) flips rows to columns and vice versa",
        "FILTER, SORT, UNIQUE, and SEQUENCE are dynamic array functions that return variable-sized results",
        "The # spill operator (e.g., A1#) references the entire spill range from a dynamic array formula",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/dynamic-array-formulas-and-spilled-array-behavior-205c6b06-03ba-4151-89a1-87a7eb36e531",
      externalLabel: "Microsoft: Dynamic array formulas",
    },
    prerequisites: ["pivot-concepts"],
    trunk: true,
    column: 0,
    row: 6,
    conceptualQuestions: [
      {
        id: "array-concept-1",
        type: "multiple-choice",
        question: "What is a 'spill range' in modern Excel?",
        options: [
          "A range that contains errors",
          "The area where a dynamic array formula automatically outputs multiple results",
          "A named range that expands automatically",
          "A range protected from edits",
        ],
        correctAnswer: "The area where a dynamic array formula automatically outputs multiple results",
        explanation: "Dynamic array formulas can return multiple values that 'spill' into adjacent cells automatically.",
      },
    ],
    exercises: [
      {
        id: "array-ex1",
        type: "write-formula",
        title: "UNIQUE values",
        instruction: "In C1, use UNIQUE to extract the distinct categories from A1:A6.",
        initialData: {
          cols: 3, rows: 6,
          cells: { A1: { v: "Electronics" }, A2: { v: "Clothing" }, A3: { v: "Electronics" }, A4: { v: "Food" }, A5: { v: "Clothing" }, A6: { v: "Electronics" } },
        },
        targetCells: [{ cell: "C1", expected: "Electronics" }],
        hints: ["=UNIQUE(A1:A6)"],
      },
      {
        id: "array-ex2",
        type: "write-formula",
        title: "SORT data",
        instruction: "In C1, use SORT to sort the values in A1:A5 in ascending order.",
        initialData: { cols: 3, rows: 5, cells: { A1: { v: 50 }, A2: { v: 20 }, A3: { v: 80 }, A4: { v: 10 }, A5: { v: 40 } } },
        targetCells: [{ cell: "C1", expected: 10 }],
        hints: ["=SORT(A1:A5)"],
      },
      {
        id: "array-ex3",
        type: "write-formula",
        title: "FILTER with condition",
        instruction: "In D1, use FILTER to return only the names from A1:A5 where the score in B1:B5 is 80 or above.",
        initialData: {
          cols: 4, rows: 5,
          cells: { A1: { v: "Alice" }, B1: { v: 85 }, A2: { v: "Bob" }, B2: { v: 72 }, A3: { v: "Carol" }, B3: { v: 91 }, A4: { v: "Dave" }, B4: { v: 65 }, A5: { v: "Eve" }, B5: { v: 88 } },
        },
        targetCells: [{ cell: "D1", expected: "Alice" }],
        hints: ["=FILTER(A1:A5, B1:B5>=80)"],
      },
      {
        id: "array-ex4",
        type: "write-formula",
        title: "SEQUENCE generator",
        instruction: "In A1, use SEQUENCE to generate numbers 1 through 10 in a column.",
        initialData: { cols: 2, rows: 10, cells: {} },
        targetCells: [{ cell: "A1", expected: 1 }],
        hints: ["=SEQUENCE(10)"],
      },
    ],
  },

  // ──────────────── NODE 11: Statistical Functions ────────────────
  {
    id: "statistical-functions",
    title: "Statistical Functions",
    description:
      "Analyze distributions and trends with PERCENTILE, STDEV, CORREL, FORECAST, and TREND. Essential for data analytics.",
    intro: {
      summary:
        "Statistical functions go beyond simple averages to reveal how data is distributed, how variables relate to each other, and where trends are headed. These are essential for data analysis and reporting.",
      keyPoints: [
        "MEDIAN(range) returns the middle value, which is more robust to outliers than AVERAGE",
        "PERCENTILE(range, k) finds the value below which k percent of the data falls (e.g., 90th percentile)",
        "STDEV(range) measures how spread out values are from their mean -- higher means more variability",
        "CORREL(range1, range2) returns a value from -1 to 1 showing how strongly two variables are related",
        "FORECAST(x, known_ys, known_xs) predicts a y-value for a given x based on a linear trend",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/stdev-function-51fecaaa-231e-4bbb-9230-33571a968f36",
      externalLabel: "Microsoft: STDEV function",
    },
    prerequisites: ["array-formulas"],
    trunk: false,
    column: 1,
    row: 6,
    conceptualQuestions: [
      {
        id: "stats-concept-1",
        type: "multiple-choice",
        question: "What does a CORREL value of -0.95 indicate?",
        options: [
          "No relationship between the variables",
          "A strong positive relationship",
          "A strong negative relationship — as one increases, the other decreases",
          "The data contains errors",
        ],
        correctAnswer: "A strong negative relationship — as one increases, the other decreases",
        explanation: "CORREL returns values between -1 and 1. Values near -1 indicate strong negative correlation.",
      },
      {
        id: "stats-concept-2",
        type: "fill-blank",
        question: "STDEV measures how spread out values are from the _______.",
        correctAnswer: "mean",
        explanation: "Standard deviation measures the average distance of each data point from the mean.",
      },
    ],
    exercises: [
      {
        id: "stats-ex1",
        type: "write-formula",
        title: "Calculate standard deviation",
        instruction: "In B1, calculate the standard deviation of the scores in A1:A6.",
        initialData: { cols: 2, rows: 6, cells: { A1: { v: 78 }, A2: { v: 85 }, A3: { v: 92 }, A4: { v: 71 }, A5: { v: 88 }, A6: { v: 95 } } },
        targetCells: [{ cell: "B1", expected: 9.07 }],
        hints: ["=STDEV(A1:A6)"],
      },
      {
        id: "stats-ex2",
        type: "write-formula",
        title: "Find the 90th percentile",
        instruction: "In B1, find the 90th percentile of the values in A1:A8.",
        initialData: { cols: 2, rows: 8, cells: { A1: { v: 10 }, A2: { v: 20 }, A3: { v: 30 }, A4: { v: 40 }, A5: { v: 50 }, A6: { v: 60 }, A7: { v: 70 }, A8: { v: 80 } } },
        targetCells: [{ cell: "B1", expected: 73 }],
        hints: ["=PERCENTILE(A1:A8, 0.9)"],
      },
      {
        id: "stats-ex3",
        type: "write-formula",
        title: "FORECAST a value",
        instruction: "In C1, use FORECAST to predict the y-value when x=6, given data in A1:A5 (x) and B1:B5 (y).",
        initialData: {
          cols: 3, rows: 5,
          cells: { A1: { v: 1 }, B1: { v: 2 }, A2: { v: 2 }, B2: { v: 4 }, A3: { v: 3 }, B3: { v: 6 }, A4: { v: 4 }, B4: { v: 8 }, A5: { v: 5 }, B5: { v: 10 } },
        },
        targetCells: [{ cell: "C1", expected: 12 }],
        hints: ["=FORECAST(6, B1:B5, A1:A5)"],
      },
    ],
  },

  // ──────────────── NODE 12: Dashboard Formulas ────────────────
  {
    id: "dashboard-formulas",
    title: "Dashboard Formulas",
    description:
      "Build dynamic dashboards with INDIRECT, dynamic ranges, conditional formatting logic, and data validation techniques.",
    intro: {
      summary:
        "Dashboard formulas make your spreadsheets interactive. By using functions like INDIRECT and CHOOSE, you can build reports that update dynamically based on user selections -- such as a dropdown that changes which data a chart displays.",
      keyPoints: [
        "INDIRECT(text_ref) converts a text string like \"A1\" into an actual cell reference, enabling dynamic lookups",
        "CHOOSE(index, val1, val2, ...) returns one of several values based on a numeric index, useful for dropdown-driven dashboards",
        "Combining INDIRECT with CONCATENATE or & lets you build references dynamically (e.g., referencing different sheet names)",
        "These techniques pair with Data Validation dropdowns to create interactive, user-friendly reports",
      ],
      externalUrl: "https://support.microsoft.com/en-us/office/indirect-function-474b3a3a-8a26-4f44-b491-92b6306fa261",
      externalLabel: "Microsoft: INDIRECT function",
    },
    prerequisites: ["pivot-concepts", "conditional-aggregation"],
    trunk: true,
    column: 0,
    row: 7,
    conceptualQuestions: [
      {
        id: "dashboard-concept-1",
        type: "multiple-choice",
        question: "What does INDIRECT do?",
        options: [
          "Creates a hyperlink to another cell",
          "Converts a text string into an actual cell reference",
          "Indirectly copies a cell's format",
          "Creates a dropdown list",
        ],
        correctAnswer: "Converts a text string into an actual cell reference",
        explanation: "INDIRECT takes a text string like \"A1\" and treats it as an actual cell reference.",
      },
      {
        id: "dashboard-concept-2",
        type: "fill-blank",
        question: "To conditionally format cells based on a formula, the formula must return _______ or FALSE.",
        correctAnswer: "TRUE",
        explanation: "Conditional formatting rules apply the format when the formula evaluates to TRUE.",
      },
    ],
    exercises: [
      {
        id: "dashboard-ex1",
        type: "write-formula",
        title: "Dynamic reference with INDIRECT",
        instruction: "Cell A1 has the text \"B3\". In C1, use INDIRECT to return the value of the cell that A1 refers to.",
        initialData: { cols: 3, rows: 3, cells: { A1: { v: "B3" }, B1: { v: 10 }, B2: { v: 20 }, B3: { v: 30 } } },
        targetCells: [{ cell: "C1", expected: 30, expectedFormula: "=INDIRECT(A1)" }],
        hints: ["=INDIRECT(A1) converts the text in A1 into a cell reference"],
      },
      {
        id: "dashboard-ex2",
        type: "write-formula",
        title: "Conditional indicator",
        instruction: "In C1, write a formula: if B1 >= target in A1, show \"On Track\", otherwise show \"Behind\".",
        initialData: { cols: 3, rows: 3, cells: { A1: { v: 100 }, B1: { v: 120 }, A2: { v: 200 }, B2: { v: 150 } } },
        targetCells: [{ cell: "C1", expected: "On Track" }],
        hints: ["=IF(B1>=A1, \"On Track\", \"Behind\")"],
      },
      {
        id: "dashboard-ex3",
        type: "write-formula",
        title: "Dynamic SUM with INDIRECT",
        instruction: "Cell D1 has a number (3). In E1, use INDIRECT to SUM from A1 to A[D1] dynamically (i.e., SUM A1:A3).",
        initialData: {
          cols: 5, rows: 5,
          cells: { A1: { v: 10 }, A2: { v: 20 }, A3: { v: 30 }, A4: { v: 40 }, A5: { v: 50 }, D1: { v: 3 } },
        },
        targetCells: [{ cell: "E1", expected: 60 }],
        hints: ["=SUM(INDIRECT(\"A1:A\"&D1))"],
      },
    ],
  },
];
