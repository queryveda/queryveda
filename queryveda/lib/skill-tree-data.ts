import type { SkillNode } from "./skill-tree-types";

export const skillTreeNodes: SkillNode[] = [
  {
    id: "select-basics",
    title: "SELECT Basics",
    description: "The foundation of every SQL query. Learn to retrieve columns from a table, use aliases, and select all columns.",
    prerequisites: [],
    relatedProblemIds: [],
    trunk: true,
    column: 0,
    row: 0,
    exercises: [
      {
        id: "select-ex1",
        type: "fill-blank",
        prompt: "Select the name and age columns from the employees table.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT, department TEXT);
INSERT INTO employees VALUES (1,'Alice',30,'Engineering'),(2,'Bob',25,'Marketing'),(3,'Carol',35,'Engineering');`,
        cols: ["name", "age"],
        template: "{{BLANK}}\nFROM employees",
        editableDefault: "SELECT ",
        variations: [
          {
            setupSQL: `DROP TABLE IF EXISTS products; CREATE TABLE products(id INT, name TEXT, price INT, category TEXT);
INSERT INTO products VALUES (1,'Laptop',999,'Electronics'),(2,'Desk',250,'Furniture'),(3,'Mouse',25,'Electronics');`,
            template: "{{BLANK}}\nFROM products",
            expectedOutput: [["Laptop", 999], ["Desk", 250], ["Mouse", 25]],
          },
        ],
        expectedOutput: [["Alice", 30], ["Bob", 25], ["Carol", 35]],
        hints: ["Use SELECT followed by column names separated by commas."],
      },
      {
        id: "select-ex2",
        type: "fill-blank",
        prompt: "Select all columns from the employees table using the wildcard.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25);`,
        cols: ["id", "name", "age"],
        template: "SELECT {{BLANK}}\nFROM employees",
        editableDefault: "",
        variations: [],
        expectedOutput: [[1, "Alice", 30], [2, "Bob", 25]],
        hints: ["The wildcard character * selects all columns."],
      },
      {
        id: "select-ex3",
        type: "build-incremental",
        prompt: "Build a query step by step to get employee names with an alias.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25),(3,'Carol',35);`,
        cols: ["employee_name"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Write a SELECT to get the name column from employees.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice"], ["Bob"], ["Carol"]],
          },
          {
            prompt: "Now alias the name column as 'employee_name'.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice"], ["Bob"], ["Carol"]],
          },
        ],
        variations: [],
        expectedOutput: [["Alice"], ["Bob"], ["Carol"]],
        hints: ["Use AS to create a column alias: SELECT column AS alias_name FROM table."],
      },
      {
        id: "select-ex4",
        type: "fix-query",
        prompt: "This query has a typo in the column name. Fix it to select the employee's name.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25);`,
        cols: ["name"],
        template: "SELECT {{BLANK}}\nFROM employees",
        editableDefault: "nme",
        variations: [],
        expectedOutput: [["Alice"], ["Bob"]],
        hints: ["Check the column name carefully — compare with the table definition."],
      },
      {
        id: "select-ex5",
        type: "fix-query",
        prompt: "This query tries to select a column that doesn't exist. Fix it to get the employee's department.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing');`,
        cols: ["department"],
        template: "SELECT {{BLANK}}\nFROM employees",
        editableDefault: "dept",
        variations: [],
        expectedOutput: [["Engineering"], ["Marketing"]],
        hints: ["The column is called 'department', not 'dept'."],
      },
    ],
  },
  {
    id: "where-filtering",
    title: "WHERE & Filtering",
    description: "Filter rows based on conditions. Learn comparison operators, AND/OR logic, IN, BETWEEN, LIKE, and NULL checks.",
    prerequisites: ["select-basics"],
    relatedProblemIds: [],
    trunk: true,
    column: 0,
    row: 1,
    exercises: [
      {
        id: "where-ex1",
        type: "fill-blank",
        prompt: "Filter employees to only show those in the Engineering department.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Engineering');`,
        cols: ["name", "department"],
        template: "SELECT name, department\nFROM employees\n{{BLANK}}",
        editableDefault: "WHERE ",
        variations: [
          {
            setupSQL: `DROP TABLE IF EXISTS products; CREATE TABLE products(id INT, name TEXT, category TEXT);
INSERT INTO products VALUES (1,'Laptop','Electronics'),(2,'Desk','Furniture'),(3,'Mouse','Electronics');`,
            template: "SELECT name, category\nFROM products\n{{BLANK}}",
            expectedOutput: [["Laptop", "Electronics"], ["Mouse", "Electronics"]],
          },
        ],
        expectedOutput: [["Alice", "Engineering"], ["Carol", "Engineering"]],
        hints: ["Use WHERE column = 'value' to filter rows."],
      },
      {
        id: "where-ex2",
        type: "fill-blank",
        prompt: "Find employees older than 30.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25),(3,'Carol',35),(4,'Dave',40);`,
        cols: ["name", "age"],
        template: "SELECT name, age\nFROM employees\n{{BLANK}}",
        editableDefault: "WHERE ",
        variations: [],
        expectedOutput: [["Carol", 35], ["Dave", 40]],
        hints: ["Use the > operator: WHERE age > 30."],
      },
      {
        id: "where-ex3",
        type: "build-incremental",
        prompt: "Build a filtered query step by step.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT, status TEXT);
INSERT INTO orders VALUES (1,'Alice',500,'completed'),(2,'Bob',150,'pending'),(3,'Alice',300,'completed'),(4,'Carol',800,'completed');`,
        cols: ["customer", "amount"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Select customer and amount from orders.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", 500], ["Bob", 150], ["Alice", 300], ["Carol", 800]],
          },
          {
            prompt: "Now add a WHERE clause to only show completed orders with amount > 200.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", 500], ["Alice", 300], ["Carol", 800]],
          },
        ],
        variations: [],
        expectedOutput: [["Alice", 500], ["Alice", 300], ["Carol", 800]],
        hints: ["Combine conditions with AND: WHERE status = 'completed' AND amount > 200."],
      },
      {
        id: "where-ex4",
        type: "fix-query",
        prompt: "This query uses the wrong operator. We want employees who are NOT in Marketing. Fix the WHERE clause.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Sales');`,
        cols: ["name", "department"],
        template: "SELECT name, department\nFROM employees\nWHERE {{BLANK}}",
        editableDefault: "department = 'Marketing'",
        variations: [],
        expectedOutput: [["Alice", "Engineering"], ["Carol", "Sales"]],
        hints: ["Use != or <> instead of = to exclude a value."],
      },
      {
        id: "where-ex5",
        type: "fix-query",
        prompt: "This query tries to find NULL values with =. Fix it to use the correct NULL check.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, manager_id INT);
INSERT INTO employees VALUES (1,'Alice',NULL),(2,'Bob',1),(3,'Carol',NULL);`,
        cols: ["name"],
        template: "SELECT name\nFROM employees\nWHERE {{BLANK}}",
        editableDefault: "manager_id = NULL",
        variations: [],
        expectedOutput: [["Alice"], ["Carol"]],
        hints: ["In SQL, you cannot use = NULL. Use IS NULL instead."],
      },
    ],
  },
];

// Helper to get a node by ID
export function getSkillNode(id: string): SkillNode | undefined {
  return skillTreeNodes.find((n) => n.id === id);
}

// Helper to get all exercises for a node
export function getNodeExercise(nodeId: string, exerciseId: string) {
  const node = getSkillNode(nodeId);
  return node?.exercises.find((e) => e.id === exerciseId);
}
