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
  // ── Node 3: ORDER BY & LIMIT ─────────────────────────────────────────────
  {
    id: "order-by-limit",
    title: "ORDER BY & LIMIT",
    description: "Sort query results with ORDER BY and restrict how many rows are returned with LIMIT. Combine them to retrieve top-N records efficiently.",
    prerequisites: ["where-filtering"],
    relatedProblemIds: [],
    trunk: true,
    column: 0,
    row: 2,
    exercises: [
      {
        id: "orderby-ex1",
        type: "fill-blank",
        prompt: "Sort employees by age in ascending order.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25),(3,'Carol',35);`,
        cols: ["name", "age"],
        template: "SELECT name, age\nFROM employees\n{{BLANK}}",
        editableDefault: "ORDER BY ",
        variations: [],
        expectedOutput: [["Bob", 25], ["Alice", 30], ["Carol", 35]],
        hints: ["Use ORDER BY column_name to sort. Default is ascending (ASC)."],
      },
      {
        id: "orderby-ex2",
        type: "fill-blank",
        prompt: "Return the top 2 most expensive products.",
        setupSQL: `DROP TABLE IF EXISTS products; CREATE TABLE products(id INT, name TEXT, price INT);
INSERT INTO products VALUES (1,'Laptop',999),(2,'Desk',250),(3,'Mouse',25),(4,'Monitor',450);`,
        cols: ["name", "price"],
        template: "SELECT name, price\nFROM products\nORDER BY price DESC\n{{BLANK}}",
        editableDefault: "LIMIT ",
        variations: [],
        expectedOutput: [["Laptop", 999], ["Monitor", 450]],
        hints: ["LIMIT N restricts the result to N rows."],
      },
      {
        id: "orderby-ex3",
        type: "build-incremental",
        prompt: "Build a query to get the 3 youngest employees by name.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, age INT);
INSERT INTO employees VALUES (1,'Alice',30),(2,'Bob',25),(3,'Carol',35),(4,'Dave',22),(5,'Eve',28);`,
        cols: ["name", "age"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Select name and age from employees.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", 30], ["Bob", 25], ["Carol", 35], ["Dave", 22], ["Eve", 28]],
          },
          {
            prompt: "Sort by age ascending.",
            template: "{{BLANK}}",
            expectedOutput: [["Dave", 22], ["Bob", 25], ["Eve", 28], ["Alice", 30], ["Carol", 35]],
          },
          {
            prompt: "Limit to the 3 youngest.",
            template: "{{BLANK}}",
            expectedOutput: [["Dave", 22], ["Bob", 25], ["Eve", 28]],
          },
        ],
        variations: [],
        expectedOutput: [["Dave", 22], ["Bob", 25], ["Eve", 28]],
        hints: ["Combine ORDER BY age ASC with LIMIT 3."],
      },
      {
        id: "orderby-ex4",
        type: "build-incremental",
        prompt: "Sort orders by amount descending, then by customer name ascending for ties.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT);
INSERT INTO orders VALUES (1,'Bob',500),(2,'Alice',500),(3,'Carol',300),(4,'Dave',700);`,
        cols: ["customer", "amount"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Select customer and amount from orders.",
            template: "{{BLANK}}",
            expectedOutput: [["Bob", 500], ["Alice", 500], ["Carol", 300], ["Dave", 700]],
          },
          {
            prompt: "Sort by amount DESC, then by customer ASC for ties.",
            template: "{{BLANK}}",
            expectedOutput: [["Dave", 700], ["Alice", 500], ["Bob", 500], ["Carol", 300]],
          },
        ],
        variations: [],
        expectedOutput: [["Dave", 700], ["Alice", 500], ["Bob", 500], ["Carol", 300]],
        hints: ["List multiple sort keys: ORDER BY amount DESC, customer ASC."],
      },
      {
        id: "orderby-ex5",
        type: "fix-query",
        prompt: "This query tries to get the 3 cheapest products but sorts in the wrong direction. Fix it.",
        setupSQL: `DROP TABLE IF EXISTS products; CREATE TABLE products(id INT, name TEXT, price INT);
INSERT INTO products VALUES (1,'Laptop',999),(2,'Desk',250),(3,'Mouse',25),(4,'Monitor',450);`,
        cols: ["name", "price"],
        template: "SELECT name, price\nFROM products\nORDER BY {{BLANK}}\nLIMIT 3",
        editableDefault: "price DESC",
        variations: [],
        expectedOutput: [["Mouse", 25], ["Desk", 250], ["Monitor", 450]],
        hints: ["To get cheapest first, sort ASC (lowest price first)."],
      },
    ],
  },

  // ── Node 4: GROUP BY & HAVING ────────────────────────────────────────────
  {
    id: "group-by-having",
    title: "GROUP BY & HAVING",
    description: "Group rows that share a common value and compute aggregate statistics per group. Use HAVING to filter those groups, just like WHERE filters rows.",
    prerequisites: ["order-by-limit"],
    relatedProblemIds: [],
    trunk: true,
    column: 0,
    row: 3,
    exercises: [
      {
        id: "groupby-ex1",
        type: "fill-blank",
        prompt: "Count how many employees are in each department.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Engineering'),(4,'Dave','Marketing'),(5,'Eve','Engineering');`,
        cols: ["department", "count"],
        template: "SELECT department, COUNT(*) AS count\nFROM employees\n{{BLANK}}",
        editableDefault: "GROUP BY ",
        variations: [],
        expectedOutput: [["Engineering", 3], ["Marketing", 2]],
        hints: ["GROUP BY column_name groups all rows with the same value together."],
      },
      {
        id: "groupby-ex2",
        type: "fill-blank",
        prompt: "Show only departments with more than 2 employees.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT);
INSERT INTO employees VALUES (1,'Alice','Engineering'),(2,'Bob','Marketing'),(3,'Carol','Engineering'),(4,'Dave','Marketing'),(5,'Eve','Engineering');`,
        cols: ["department", "count"],
        template: "SELECT department, COUNT(*) AS count\nFROM employees\nGROUP BY department\n{{BLANK}}",
        editableDefault: "HAVING ",
        variations: [],
        expectedOutput: [["Engineering", 3]],
        hints: ["HAVING filters after grouping. Use HAVING COUNT(*) > 2."],
      },
      {
        id: "groupby-ex3",
        type: "build-incremental",
        prompt: "Build a query to find the total sales per product category, only showing categories with total sales above 500.",
        setupSQL: `DROP TABLE IF EXISTS sales; CREATE TABLE sales(id INT, category TEXT, amount INT);
INSERT INTO sales VALUES (1,'Electronics',300),(2,'Furniture',200),(3,'Electronics',400),(4,'Clothing',100),(5,'Furniture',350);`,
        cols: ["category", "total"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Select category and sum of amount as total from sales.",
            template: "{{BLANK}}",
            expectedOutput: [["Electronics", 700], ["Furniture", 550], ["Clothing", 100]],
          },
          {
            prompt: "Group by category.",
            template: "{{BLANK}}",
            expectedOutput: [["Electronics", 700], ["Furniture", 550], ["Clothing", 100]],
          },
          {
            prompt: "Filter to only categories with total > 500.",
            template: "{{BLANK}}",
            expectedOutput: [["Electronics", 700], ["Furniture", 550]],
          },
        ],
        variations: [],
        expectedOutput: [["Electronics", 700], ["Furniture", 550]],
        hints: ["Use SUM(amount) AS total, GROUP BY category, then HAVING SUM(amount) > 500."],
      },
      {
        id: "groupby-ex4",
        type: "fix-query",
        prompt: "This query tries to filter groups but mistakenly uses WHERE instead of HAVING. Fix it.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT);
INSERT INTO orders VALUES (1,'Alice',100),(2,'Bob',200),(3,'Alice',300),(4,'Bob',50),(5,'Carol',400);`,
        cols: ["customer", "total"],
        template: "SELECT customer, SUM(amount) AS total\nFROM orders\nGROUP BY customer\n{{BLANK}}",
        editableDefault: "WHERE SUM(amount) > 200",
        variations: [],
        expectedOutput: [["Alice", 400], ["Bob", 250], ["Carol", 400]],
        hints: ["WHERE runs before grouping; HAVING runs after. Use HAVING SUM(amount) > 200."],
      },
      {
        id: "groupby-ex5",
        type: "fix-query",
        prompt: "This query selects a non-aggregated column that is not in GROUP BY. Fix the GROUP BY clause.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',80000),(2,'Bob','Marketing',60000),(3,'Carol','Engineering',90000);`,
        cols: ["department", "avg_salary"],
        template: "SELECT department, AVG(salary) AS avg_salary\nFROM employees\n{{BLANK}}",
        editableDefault: "GROUP BY name",
        variations: [],
        expectedOutput: [["Engineering", 85000], ["Marketing", 60000]],
        hints: ["You must GROUP BY the same non-aggregated columns you SELECT: GROUP BY department."],
      },
    ],
  },

  // ── Node 5: AGGREGATE FUNCTIONS ──────────────────────────────────────────
  {
    id: "aggregate-functions",
    title: "Aggregate Functions",
    description: "Aggregate functions collapse many rows into a single value. Master COUNT, SUM, AVG, MIN, and MAX to summarize your data.",
    prerequisites: ["group-by-having"],
    relatedProblemIds: [],
    trunk: true,
    column: 0,
    row: 4,
    exercises: [
      {
        id: "agg-ex1",
        type: "fill-blank",
        prompt: "Find the minimum and maximum salary across all employees.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',80000),(2,'Bob',55000),(3,'Carol',95000),(4,'Dave',70000);`,
        cols: ["min_salary", "max_salary"],
        template: "SELECT {{BLANK}}\nFROM employees",
        editableDefault: "",
        variations: [],
        expectedOutput: [[55000, 95000]],
        hints: ["Use MIN(salary) AS min_salary, MAX(salary) AS max_salary."],
      },
      {
        id: "agg-ex2",
        type: "fill-blank",
        prompt: "Calculate the average order amount and total number of orders.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT);
INSERT INTO orders VALUES (1,'Alice',100),(2,'Bob',200),(3,'Carol',300),(4,'Alice',150);`,
        cols: ["avg_amount", "order_count"],
        template: "SELECT {{BLANK}}\nFROM orders",
        editableDefault: "",
        variations: [],
        expectedOutput: [[187, 4]],
        hints: ["Use AVG(amount) AS avg_amount and COUNT(*) AS order_count. AVG(187.5) truncates to 187 as integer."],
      },
      {
        id: "agg-ex3",
        type: "build-incremental",
        prompt: "Find the total revenue and average order value per customer.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT);
INSERT INTO orders VALUES (1,'Alice',100),(2,'Bob',200),(3,'Alice',300),(4,'Bob',400),(5,'Carol',500);`,
        cols: ["customer", "total_revenue", "avg_order"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Select customer, SUM(amount) as total_revenue, AVG(amount) as avg_order from orders.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", 400, 200], ["Bob", 600, 300], ["Carol", 500, 500]],
          },
          {
            prompt: "Group by customer and order by total_revenue descending.",
            template: "{{BLANK}}",
            expectedOutput: [["Bob", 600, 300], ["Carol", 500, 500], ["Alice", 400, 200]],
          },
        ],
        variations: [],
        expectedOutput: [["Bob", 600, 300], ["Carol", 500, 500], ["Alice", 400, 200]],
        hints: ["Use SUM(amount), AVG(amount), GROUP BY customer, ORDER BY SUM(amount) DESC."],
      },
      {
        id: "agg-ex4",
        type: "fix-query",
        prompt: "COUNT(column) skips NULLs but COUNT(*) counts all rows. Fix this query to count only non-null phone numbers.",
        setupSQL: `DROP TABLE IF EXISTS contacts; CREATE TABLE contacts(id INT, name TEXT, phone TEXT);
INSERT INTO contacts VALUES (1,'Alice','555-1234'),(2,'Bob',NULL),(3,'Carol','555-5678'),(4,'Dave',NULL);`,
        cols: ["with_phone"],
        template: "SELECT {{BLANK}} AS with_phone\nFROM contacts",
        editableDefault: "COUNT(*)",
        variations: [],
        expectedOutput: [[2]],
        hints: ["COUNT(*) counts all rows including NULLs. Use COUNT(phone) to skip NULLs."],
      },
      {
        id: "agg-ex5",
        type: "fix-query",
        prompt: "This query tries to compute the sum of salaries but uses the wrong function name. Fix it.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',80000),(2,'Bob',55000),(3,'Carol',95000);`,
        cols: ["total_payroll"],
        template: "SELECT {{BLANK}} AS total_payroll\nFROM employees",
        editableDefault: "TOTAL(salary)",
        variations: [],
        expectedOutput: [[230000]],
        hints: ["There is no TOTAL() function in SQL. Use SUM(salary) instead."],
      },
    ],
  },

  // ── Node 6a: JOINS (left branch) ─────────────────────────────────────────
  {
    id: "joins",
    title: "JOINs",
    description: "Combine rows from two or more tables based on a related column. INNER JOIN returns matching rows; LEFT JOIN keeps all rows from the left table even without a match.",
    prerequisites: ["aggregate-functions"],
    relatedProblemIds: [2, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    trunk: false,
    column: -1,
    row: 5,
    exercises: [
      {
        id: "joins-ex1",
        type: "fill-blank",
        prompt: "Join employees with their departments to show the department name for each employee.",
        setupSQL: `DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS departments;
CREATE TABLE departments(id INT, name TEXT);
INSERT INTO departments VALUES (1,'Engineering'),(2,'Marketing');
CREATE TABLE employees(id INT, name TEXT, dept_id INT);
INSERT INTO employees VALUES (1,'Alice',1),(2,'Bob',2),(3,'Carol',1);`,
        cols: ["employee", "department"],
        template: "SELECT e.name AS employee, d.name AS department\nFROM employees e\n{{BLANK}} departments d ON e.dept_id = d.id",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Alice", "Engineering"], ["Bob", "Marketing"], ["Carol", "Engineering"]],
        hints: ["Use INNER JOIN (or just JOIN) to combine the two tables on matching keys."],
      },
      {
        id: "joins-ex2",
        type: "fill-blank",
        prompt: "Show all customers including those who have never placed an order. Use a LEFT JOIN.",
        setupSQL: `DROP TABLE IF EXISTS customers; DROP TABLE IF EXISTS orders;
CREATE TABLE customers(id INT, name TEXT);
INSERT INTO customers VALUES (1,'Alice'),(2,'Bob'),(3,'Carol');
CREATE TABLE orders(id INT, customer_id INT, amount INT);
INSERT INTO orders VALUES (1,1,100),(2,1,200),(3,2,150);`,
        cols: ["customer", "amount"],
        template: "SELECT c.name AS customer, o.amount\nFROM customers c\n{{BLANK}} orders o ON c.id = o.customer_id",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Alice", 100], ["Alice", 200], ["Bob", 150], ["Carol", null]],
        hints: ["LEFT JOIN keeps all rows from the left table and fills NULLs where there is no match."],
      },
      {
        id: "joins-ex3",
        type: "build-incremental",
        prompt: "Find employees who have no manager assigned (not in the managers table).",
        setupSQL: `DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS managers;
CREATE TABLE employees(id INT, name TEXT);
INSERT INTO employees VALUES (1,'Alice'),(2,'Bob'),(3,'Carol');
CREATE TABLE managers(employee_id INT);
INSERT INTO managers VALUES (1),(2);`,
        cols: ["name"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "LEFT JOIN employees with managers on employee id.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", 1], ["Bob", 2], ["Carol", null]],
          },
          {
            prompt: "Filter to only rows where manager employee_id IS NULL.",
            template: "{{BLANK}}",
            expectedOutput: [["Carol"]],
          },
        ],
        variations: [],
        expectedOutput: [["Carol"]],
        hints: ["LEFT JOIN then WHERE managers.employee_id IS NULL finds unmatched rows."],
      },
      {
        id: "joins-ex4",
        type: "build-incremental",
        prompt: "Join orders with products to get the total revenue per product name.",
        setupSQL: `DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS products;
CREATE TABLE products(id INT, name TEXT, price INT);
INSERT INTO products VALUES (1,'Laptop',1000),(2,'Mouse',50),(3,'Keyboard',80);
CREATE TABLE orders(id INT, product_id INT, qty INT);
INSERT INTO orders VALUES (1,1,2),(2,2,5),(3,1,1),(4,3,3);`,
        cols: ["product", "revenue"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Join orders with products on product_id = products.id.",
            template: "{{BLANK}}",
            expectedOutput: [["Laptop", 1000, 2], ["Mouse", 50, 5], ["Laptop", 1000, 1], ["Keyboard", 80, 3]],
          },
          {
            prompt: "Select product name and calculate revenue as SUM(price * qty), grouped by product name.",
            template: "{{BLANK}}",
            expectedOutput: [["Keyboard", 240], ["Laptop", 3000], ["Mouse", 250]],
          },
        ],
        variations: [],
        expectedOutput: [["Keyboard", 240], ["Laptop", 3000], ["Mouse", 250]],
        hints: ["JOIN on product_id, then SUM(p.price * o.qty) AS revenue, GROUP BY p.name."],
      },
      {
        id: "joins-ex5",
        type: "fix-query",
        prompt: "This JOIN uses the wrong key. Fix the ON clause to correctly join employees to their department.",
        setupSQL: `DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS departments;
CREATE TABLE departments(id INT, name TEXT);
INSERT INTO departments VALUES (1,'Engineering'),(2,'Marketing');
CREATE TABLE employees(id INT, name TEXT, dept_id INT);
INSERT INTO employees VALUES (1,'Alice',1),(2,'Bob',2);`,
        cols: ["name", "department"],
        template: "SELECT e.name, d.name AS department\nFROM employees e\nJOIN departments d ON {{BLANK}}",
        editableDefault: "e.id = d.id",
        variations: [],
        expectedOutput: [["Alice", "Engineering"], ["Bob", "Marketing"]],
        hints: ["Employees join to departments via e.dept_id, not e.id. Use e.dept_id = d.id."],
      },
    ],
  },

  // ── Node 6b: SUBQUERIES (trunk) ───────────────────────────────────────────
  {
    id: "subqueries",
    title: "Subqueries",
    description: "A subquery is a query nested inside another query. Use them in WHERE, FROM, or SELECT clauses to break complex problems into smaller steps.",
    prerequisites: ["aggregate-functions"],
    relatedProblemIds: [],
    trunk: false,
    column: 0,
    row: 5,
    exercises: [
      {
        id: "subq-ex1",
        type: "fill-blank",
        prompt: "Find employees who earn more than the average salary. Use a subquery in the WHERE clause.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',80000),(2,'Bob',55000),(3,'Carol',95000),(4,'Dave',70000);`,
        cols: ["name", "salary"],
        template: "SELECT name, salary\nFROM employees\nWHERE salary > {{BLANK}}",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Alice", 80000], ["Carol", 95000]],
        hints: ["The subquery (SELECT AVG(salary) FROM employees) returns the average salary."],
      },
      {
        id: "subq-ex2",
        type: "fill-blank",
        prompt: "Return the name of the employee with the highest salary using a subquery.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',80000),(2,'Bob',55000),(3,'Carol',95000);`,
        cols: ["name"],
        template: "SELECT name\nFROM employees\nWHERE salary = {{BLANK}}",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Carol"]],
        hints: ["Use (SELECT MAX(salary) FROM employees) as the subquery."],
      },
      {
        id: "subq-ex3",
        type: "build-incremental",
        prompt: "Find departments that have at least one employee with salary above 70000.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',80000),(2,'Bob','Marketing',55000),(3,'Carol','Engineering',95000),(4,'Dave','Marketing',72000);`,
        cols: ["department"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Write a subquery to get departments with any salary > 70000.",
            template: "{{BLANK}}",
            expectedOutput: [["Engineering"], ["Marketing"]],
          },
          {
            prompt: "Use SELECT DISTINCT with an IN subquery to return the department names.",
            template: "{{BLANK}}",
            expectedOutput: [["Engineering"], ["Marketing"]],
          },
        ],
        variations: [],
        expectedOutput: [["Engineering"], ["Marketing"]],
        hints: ["SELECT DISTINCT department FROM employees WHERE department IN (SELECT department FROM employees WHERE salary > 70000)."],
      },
      {
        id: "subq-ex4",
        type: "fix-query",
        prompt: "This subquery accidentally returns multiple rows, causing an error. Fix it to return a scalar value.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',80000),(2,'Bob',55000),(3,'Carol',95000);`,
        cols: ["name", "salary"],
        template: "SELECT name, salary\nFROM employees\nWHERE salary > {{BLANK}}",
        editableDefault: "(SELECT salary FROM employees WHERE salary > 50000)",
        variations: [],
        expectedOutput: [["Alice", 80000], ["Carol", 95000]],
        hints: ["Use AVG() or MIN() to produce a single value: (SELECT AVG(salary) FROM employees)."],
      },
      {
        id: "subq-ex5",
        type: "fix-query",
        prompt: "This derived-table subquery is missing an alias. Fix it so the outer query can reference it.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT);
INSERT INTO orders VALUES (1,'Alice',100),(2,'Bob',200),(3,'Alice',300);`,
        cols: ["customer", "total"],
        template: "SELECT customer, total\nFROM (SELECT customer, SUM(amount) AS total FROM orders GROUP BY customer) {{BLANK}}",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Alice", 400], ["Bob", 200]],
        hints: ["Every subquery in FROM must have an alias: add AS t (or any name) after the closing parenthesis."],
      },
    ],
  },

  // ── Node 6c: SET OPERATIONS (right branch) ───────────────────────────────
  {
    id: "set-operations",
    title: "Set Operations",
    description: "Combine results from multiple SELECT statements with UNION, INTERSECT, and EXCEPT. Both queries must return the same number of columns with compatible types.",
    prerequisites: ["aggregate-functions"],
    relatedProblemIds: [],
    trunk: false,
    column: 1,
    row: 5,
    exercises: [
      {
        id: "setops-ex1",
        type: "fill-blank",
        prompt: "Combine the list of customer names from two tables into one list with no duplicates.",
        setupSQL: `DROP TABLE IF EXISTS customers_us; DROP TABLE IF EXISTS customers_eu;
CREATE TABLE customers_us(name TEXT);
INSERT INTO customers_us VALUES ('Alice'),('Bob'),('Carol');
CREATE TABLE customers_eu(name TEXT);
INSERT INTO customers_eu VALUES ('Bob'),('Dave'),('Eve');`,
        cols: ["name"],
        template: "SELECT name FROM customers_us\n{{BLANK}}\nSELECT name FROM customers_eu",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Alice"], ["Bob"], ["Carol"], ["Dave"], ["Eve"]],
        hints: ["UNION combines results and removes duplicates. UNION ALL keeps duplicates."],
      },
      {
        id: "setops-ex2",
        type: "fill-blank",
        prompt: "Find customer names that appear in BOTH the US and EU customer tables.",
        setupSQL: `DROP TABLE IF EXISTS customers_us; DROP TABLE IF EXISTS customers_eu;
CREATE TABLE customers_us(name TEXT);
INSERT INTO customers_us VALUES ('Alice'),('Bob'),('Carol');
CREATE TABLE customers_eu(name TEXT);
INSERT INTO customers_eu VALUES ('Bob'),('Dave'),('Eve');`,
        cols: ["name"],
        template: "SELECT name FROM customers_us\n{{BLANK}}\nSELECT name FROM customers_eu",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Bob"]],
        hints: ["INTERSECT returns only rows that appear in both result sets."],
      },
      {
        id: "setops-ex3",
        type: "build-incremental",
        prompt: "Find US customers who are NOT in the EU customer list.",
        setupSQL: `DROP TABLE IF EXISTS customers_us; DROP TABLE IF EXISTS customers_eu;
CREATE TABLE customers_us(name TEXT);
INSERT INTO customers_us VALUES ('Alice'),('Bob'),('Carol');
CREATE TABLE customers_eu(name TEXT);
INSERT INTO customers_eu VALUES ('Bob'),('Dave'),('Eve');`,
        cols: ["name"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Select all names from customers_us.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice"], ["Bob"], ["Carol"]],
          },
          {
            prompt: "Use EXCEPT to subtract names that also appear in customers_eu.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice"], ["Carol"]],
          },
        ],
        variations: [],
        expectedOutput: [["Alice"], ["Carol"]],
        hints: ["EXCEPT returns rows from the first query that do not appear in the second."],
      },
      {
        id: "setops-ex4",
        type: "fix-query",
        prompt: "This UNION fails because the two SELECT statements return a different number of columns. Fix the second SELECT.",
        setupSQL: `DROP TABLE IF EXISTS active_users; DROP TABLE IF EXISTS inactive_users;
CREATE TABLE active_users(id INT, name TEXT);
INSERT INTO active_users VALUES (1,'Alice'),(2,'Bob');
CREATE TABLE inactive_users(id INT, name TEXT, last_login TEXT);
INSERT INTO inactive_users VALUES (3,'Carol','2025-01-01'),(4,'Dave','2024-06-15');`,
        cols: ["id", "name"],
        template: "SELECT id, name FROM active_users\nUNION\n{{BLANK}}",
        editableDefault: "SELECT id, name, last_login FROM inactive_users",
        variations: [],
        expectedOutput: [[1, "Alice"], [2, "Bob"], [3, "Carol"], [4, "Dave"]],
        hints: ["Both SELECT statements must have the same number of columns. Remove last_login from the second SELECT."],
      },
      {
        id: "setops-ex5",
        type: "fix-query",
        prompt: "This query uses UNION but should keep duplicates. Change it to include all rows including duplicates.",
        setupSQL: `DROP TABLE IF EXISTS q1_sales; DROP TABLE IF EXISTS q2_sales;
CREATE TABLE q1_sales(product TEXT, amount INT);
INSERT INTO q1_sales VALUES ('Laptop',1000),('Mouse',50);
CREATE TABLE q2_sales(product TEXT, amount INT);
INSERT INTO q2_sales VALUES ('Laptop',1000),('Keyboard',80);`,
        cols: ["product", "amount"],
        template: "SELECT product, amount FROM q1_sales\n{{BLANK}}\nSELECT product, amount FROM q2_sales",
        editableDefault: "UNION",
        variations: [],
        expectedOutput: [["Laptop", 1000], ["Mouse", 50], ["Laptop", 1000], ["Keyboard", 80]],
        hints: ["UNION removes duplicates. UNION ALL keeps all rows including duplicates."],
      },
    ],
  },

  // ── Node 7a: WINDOW FUNCTIONS (left branch) ──────────────────────────────
  {
    id: "window-functions",
    title: "Window Functions",
    description: "Window functions perform calculations across a set of rows related to the current row, without collapsing them into groups. Use OVER(PARTITION BY ... ORDER BY ...) to define the window.",
    prerequisites: ["joins"],
    relatedProblemIds: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    trunk: false,
    column: -1,
    row: 6,
    exercises: [
      {
        id: "winfunc-ex1",
        type: "fill-blank",
        prompt: "Rank employees by salary within each department using RANK().",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',90000),(2,'Bob','Engineering',80000),(3,'Carol','Marketing',70000),(4,'Dave','Marketing',75000);`,
        cols: ["name", "department", "salary", "rank"],
        template: "SELECT name, department, salary,\n  RANK() OVER ({{BLANK}}) AS rank\nFROM employees",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Bob", "Engineering", 80000, 2], ["Alice", "Engineering", 90000, 1], ["Carol", "Marketing", 70000, 2], ["Dave", "Marketing", 75000, 1]],
        hints: ["Use PARTITION BY department ORDER BY salary DESC to rank within each department."],
      },
      {
        id: "winfunc-ex2",
        type: "fill-blank",
        prompt: "Calculate a running total of order amounts ordered by id.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT);
INSERT INTO orders VALUES (1,'Alice',100),(2,'Bob',200),(3,'Carol',150),(4,'Dave',300);`,
        cols: ["id", "amount", "running_total"],
        template: "SELECT id, amount,\n  SUM(amount) OVER ({{BLANK}}) AS running_total\nFROM orders",
        editableDefault: "",
        variations: [],
        expectedOutput: [[1, 100, 100], [2, 200, 300], [3, 150, 450], [4, 300, 750]],
        hints: ["Use ORDER BY id inside OVER() to create a cumulative sum: OVER (ORDER BY id)."],
      },
      {
        id: "winfunc-ex3",
        type: "build-incremental",
        prompt: "Find the top-earning employee in each department using ROW_NUMBER().",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',90000),(2,'Bob','Engineering',80000),(3,'Carol','Marketing',75000),(4,'Dave','Marketing',70000);`,
        cols: ["name", "department", "salary"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Add ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn to the employee select.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", "Engineering", 90000, 1], ["Bob", "Engineering", 80000, 2], ["Carol", "Marketing", 75000, 1], ["Dave", "Marketing", 70000, 2]],
          },
          {
            prompt: "Wrap it in a subquery and filter WHERE rn = 1.",
            template: "{{BLANK}}",
            expectedOutput: [["Alice", "Engineering", 90000], ["Carol", "Marketing", 75000]],
          },
        ],
        variations: [],
        expectedOutput: [["Alice", "Engineering", 90000], ["Carol", "Marketing", 75000]],
        hints: ["SELECT name, department, salary FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn FROM employees) t WHERE rn = 1."],
      },
      {
        id: "winfunc-ex4",
        type: "fix-query",
        prompt: "This window function uses PARTITION BY but forgets ORDER BY, making the running total wrong. Fix the OVER clause.",
        setupSQL: `DROP TABLE IF EXISTS sales; CREATE TABLE sales(id INT, region TEXT, amount INT);
INSERT INTO sales VALUES (1,'North',100),(2,'North',200),(3,'North',150),(4,'South',300);`,
        cols: ["id", "region", "amount", "running_total"],
        template: "SELECT id, region, amount,\n  SUM(amount) OVER ({{BLANK}}) AS running_total\nFROM sales",
        editableDefault: "PARTITION BY region",
        variations: [],
        expectedOutput: [[1, "North", 100, 100], [2, "North", 200, 300], [3, "North", 150, 450], [4, "South", 300, 300]],
        hints: ["Add ORDER BY id after PARTITION BY region to make it cumulative: PARTITION BY region ORDER BY id."],
      },
      {
        id: "winfunc-ex5",
        type: "fix-query",
        prompt: "This query tries to filter on a window function result in WHERE, which is not allowed. Fix it by wrapping in a subquery.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',90000),(2,'Bob','Engineering',80000),(3,'Carol','Marketing',75000),(4,'Dave','Marketing',70000);`,
        cols: ["name", "department", "salary"],
        template: "{{BLANK}}",
        editableDefault: "SELECT name, department, salary\nFROM employees\nWHERE RANK() OVER (PARTITION BY department ORDER BY salary DESC) = 1",
        variations: [],
        expectedOutput: [["Alice", "Engineering", 90000], ["Carol", "Marketing", 75000]],
        hints: ["Window functions cannot be used in WHERE. Wrap in a subquery: SELECT name, department, salary FROM (SELECT *, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk FROM employees) t WHERE rnk = 1."],
      },
    ],
  },

  // ── Node 7b: CTEs ─────────────────────────────────────────────────────────
  {
    id: "ctes",
    title: "CTEs",
    description: "Common Table Expressions (WITH clauses) let you name a subquery and reference it multiple times. They make complex queries readable and composable.",
    prerequisites: ["subqueries"],
    relatedProblemIds: [],
    trunk: false,
    column: 0,
    row: 6,
    exercises: [
      {
        id: "ctes-ex1",
        type: "fill-blank",
        prompt: "Use a CTE to compute average salary, then select employees earning above that average.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',80000),(2,'Bob',55000),(3,'Carol',95000),(4,'Dave',70000);`,
        cols: ["name", "salary"],
        template: "WITH avg_sal AS (\n  SELECT AVG(salary) AS avg_salary FROM employees\n)\n{{BLANK}}",
        editableDefault: "SELECT ",
        variations: [],
        expectedOutput: [["Alice", 80000], ["Carol", 95000]],
        hints: ["After the CTE, write: SELECT name, salary FROM employees, avg_sal WHERE salary > avg_salary."],
      },
      {
        id: "ctes-ex2",
        type: "fill-blank",
        prompt: "Complete the CTE definition that counts orders per customer.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT);
INSERT INTO orders VALUES (1,'Alice',100),(2,'Bob',200),(3,'Alice',300),(4,'Carol',150);`,
        cols: ["customer", "order_count"],
        template: "WITH order_counts AS (\n  {{BLANK}}\n)\nSELECT customer, order_count\nFROM order_counts\nORDER BY order_count DESC",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Alice", 2], ["Bob", 1], ["Carol", 1]],
        hints: ["Inside the CTE: SELECT customer, COUNT(*) AS order_count FROM orders GROUP BY customer."],
      },
      {
        id: "ctes-ex3",
        type: "build-incremental",
        prompt: "Use two CTEs: one for total sales per region and one for average sales, then show regions above average.",
        setupSQL: `DROP TABLE IF EXISTS sales; CREATE TABLE sales(id INT, region TEXT, amount INT);
INSERT INTO sales VALUES (1,'North',500),(2,'South',300),(3,'North',200),(4,'East',700),(5,'South',100);`,
        cols: ["region", "total"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Write a CTE 'region_totals' that sums amount per region.",
            template: "{{BLANK}}",
            expectedOutput: [["East", 700], ["North", 700], ["South", 400]],
          },
          {
            prompt: "Add a second CTE 'avg_total' that computes the average of those totals, then select regions where total > avg_total.",
            template: "{{BLANK}}",
            expectedOutput: [["East", 700], ["North", 700]],
          },
        ],
        variations: [],
        expectedOutput: [["East", 700], ["North", 700]],
        hints: ["WITH region_totals AS (...), avg_total AS (SELECT AVG(total) AS avg FROM region_totals) SELECT region, total FROM region_totals, avg_total WHERE total > avg."],
      },
      {
        id: "ctes-ex4",
        type: "fix-query",
        prompt: "This CTE is missing the WITH keyword. Fix the query.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice','Engineering',90000),(2,'Bob','Marketing',60000),(3,'Carol','Engineering',80000);`,
        cols: ["department", "avg_salary"],
        template: "{{BLANK}} dept_avg AS (\n  SELECT department, AVG(salary) AS avg_salary\n  FROM employees\n  GROUP BY department\n)\nSELECT department, avg_salary FROM dept_avg",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Engineering", 85000], ["Marketing", 60000]],
        hints: ["CTEs must start with the WITH keyword before the CTE name."],
      },
      {
        id: "ctes-ex5",
        type: "fix-query",
        prompt: "This CTE tries to reference a column that was not included in the CTE's SELECT. Fix the CTE to include the missing column.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, customer TEXT, amount INT, status TEXT);
INSERT INTO orders VALUES (1,'Alice',100,'completed'),(2,'Bob',200,'pending'),(3,'Alice',300,'completed');`,
        cols: ["customer", "total"],
        template: "WITH completed_orders AS (\n  SELECT customer, {{BLANK}} FROM orders WHERE status = 'completed'\n)\nSELECT customer, SUM(amount) AS total\nFROM completed_orders\nGROUP BY customer",
        editableDefault: "status",
        variations: [],
        expectedOutput: [["Alice", 400]],
        hints: ["The outer query uses amount, so the CTE must SELECT amount too, not just status."],
      },
    ],
  },

  // ── Node 8a: CUMULATIVE & SLIDING WINDOWS ─────────────────────────────────
  {
    id: "cumulative-sliding",
    title: "Cumulative & Sliding Windows",
    description: "Use frame clauses (ROWS BETWEEN) to define exactly which rows are included in a window calculation. Build running totals, moving averages, and other rolling statistics.",
    prerequisites: ["window-functions"],
    relatedProblemIds: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
    trunk: false,
    column: -1,
    row: 7,
    exercises: [
      {
        id: "cumslide-ex1",
        type: "fill-blank",
        prompt: "Compute a 3-day moving average of daily sales amounts.",
        setupSQL: `DROP TABLE IF EXISTS daily_sales; CREATE TABLE daily_sales(day INT, amount INT);
INSERT INTO daily_sales VALUES (1,100),(2,200),(3,150),(4,300),(5,250);`,
        cols: ["day", "amount", "moving_avg"],
        template: "SELECT day, amount,\n  AVG(amount) OVER (\n    ORDER BY day\n    {{BLANK}}\n  ) AS moving_avg\nFROM daily_sales",
        editableDefault: "",
        variations: [],
        expectedOutput: [[1, 100, 100], [2, 200, 150], [3, 150, 150], [4, 300, 216], [5, 250, 233]],
        hints: ["Use ROWS BETWEEN 2 PRECEDING AND CURRENT ROW to include the current row and 2 prior rows."],
      },
      {
        id: "cumslide-ex2",
        type: "fill-blank",
        prompt: "Calculate a cumulative sum from the start of the partition to the current row.",
        setupSQL: `DROP TABLE IF EXISTS orders; CREATE TABLE orders(id INT, region TEXT, amount INT);
INSERT INTO orders VALUES (1,'North',100),(2,'North',200),(3,'North',150),(4,'South',300),(5,'South',50);`,
        cols: ["id", "region", "amount", "cum_sum"],
        template: "SELECT id, region, amount,\n  SUM(amount) OVER (\n    PARTITION BY region ORDER BY id\n    {{BLANK}}\n  ) AS cum_sum\nFROM orders",
        editableDefault: "",
        variations: [],
        expectedOutput: [[1, "North", 100, 100], [2, "North", 200, 300], [3, "North", 150, 450], [4, "South", 300, 300], [5, "South", 50, 350]],
        hints: ["ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW accumulates from the start of the partition."],
      },
      {
        id: "cumslide-ex3",
        type: "build-incremental",
        prompt: "Compute both a running total and a 2-row sliding sum for daily revenue.",
        setupSQL: `DROP TABLE IF EXISTS revenue; CREATE TABLE revenue(day INT, amount INT);
INSERT INTO revenue VALUES (1,100),(2,300),(3,200),(4,400),(5,150);`,
        cols: ["day", "amount", "running_total", "sliding_2"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Select day, amount and compute running_total using SUM with UNBOUNDED PRECEDING.",
            template: "{{BLANK}}",
            expectedOutput: [[1, 100, 100], [2, 300, 400], [3, 200, 600], [4, 400, 1000], [5, 150, 1150]],
          },
          {
            prompt: "Add a second window column sliding_2 using SUM with 1 PRECEDING AND CURRENT ROW.",
            template: "{{BLANK}}",
            expectedOutput: [[1, 100, 100, 100], [2, 300, 400, 400], [3, 200, 600, 500], [4, 400, 1000, 600], [5, 150, 1150, 550]],
          },
        ],
        variations: [],
        expectedOutput: [[1, 100, 100, 100], [2, 300, 400, 400], [3, 200, 600, 500], [4, 400, 1000, 600], [5, 150, 1150, 550]],
        hints: ["SUM(amount) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) and SUM(amount) OVER (ORDER BY day ROWS BETWEEN 1 PRECEDING AND CURRENT ROW)."],
      },
      {
        id: "cumslide-ex4",
        type: "fix-query",
        prompt: "This query tries a 3-row moving average but uses RANGE instead of ROWS, giving wrong results for ties. Fix the frame clause.",
        setupSQL: `DROP TABLE IF EXISTS daily_sales; CREATE TABLE daily_sales(day INT, amount INT);
INSERT INTO daily_sales VALUES (1,100),(2,200),(3,300),(4,100),(5,200);`,
        cols: ["day", "amount", "moving_avg"],
        template: "SELECT day, amount,\n  AVG(amount) OVER (\n    ORDER BY day\n    {{BLANK}}\n  ) AS moving_avg\nFROM daily_sales",
        editableDefault: "RANGE BETWEEN 2 PRECEDING AND CURRENT ROW",
        variations: [],
        expectedOutput: [[1, 100, 100], [2, 200, 150], [3, 300, 200], [4, 100, 200], [5, 200, 200]],
        hints: ["Use ROWS BETWEEN 2 PRECEDING AND CURRENT ROW for a strict row-count window."],
      },
      {
        id: "cumslide-ex5",
        type: "fix-query",
        prompt: "This cumulative sum window is ordered incorrectly, making totals non-cumulative. Fix the ORDER BY inside OVER.",
        setupSQL: `DROP TABLE IF EXISTS sales; CREATE TABLE sales(id INT, amount INT);
INSERT INTO sales VALUES (1,100),(2,200),(3,150),(4,300);`,
        cols: ["id", "amount", "cum_total"],
        template: "SELECT id, amount,\n  SUM(amount) OVER (\n    ORDER BY {{BLANK}}\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n  ) AS cum_total\nFROM sales",
        editableDefault: "amount DESC",
        variations: [],
        expectedOutput: [[1, 100, 100], [2, 200, 300], [3, 150, 450], [4, 300, 750]],
        hints: ["For a cumulative sum by row order, use ORDER BY id (not amount DESC)."],
      },
    ],
  },

  // ── Node 8b: CONSECUTIVE SEQUENCES ──────────────────────────────────────
  {
    id: "consecutive-sequences",
    title: "Consecutive Sequences",
    description: "Identify runs of consecutive values or dates using the gaps-and-islands technique: subtract a row number from the value to create a group key that stays constant within a run.",
    prerequisites: ["window-functions"],
    relatedProblemIds: [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
    trunk: false,
    column: 1,
    row: 7,
    exercises: [
      {
        id: "consec-ex1",
        type: "fill-blank",
        prompt: "Use the gaps-and-islands trick: subtract ROW_NUMBER() from value to get a group key for consecutive integers.",
        setupSQL: `DROP TABLE IF EXISTS numbers; CREATE TABLE numbers(val INT);
INSERT INTO numbers VALUES (1),(2),(3),(5),(6),(9);`,
        cols: ["val", "grp"],
        template: "SELECT val,\n  val - {{BLANK}} AS grp\nFROM numbers\nORDER BY val",
        editableDefault: "",
        variations: [],
        expectedOutput: [[1, 0], [2, 0], [3, 0], [5, 2], [6, 2], [9, 6]],
        hints: ["ROW_NUMBER() OVER (ORDER BY val) creates sequential row numbers; subtracting it from val gives the same constant for consecutive values."],
      },
      {
        id: "consec-ex2",
        type: "fill-blank",
        prompt: "Find the length of each consecutive run of integers.",
        setupSQL: `DROP TABLE IF EXISTS numbers; CREATE TABLE numbers(val INT);
INSERT INTO numbers VALUES (1),(2),(3),(5),(6),(9);`,
        cols: ["grp_start", "grp_end", "run_length"],
        template: "WITH grouped AS (\n  SELECT val, val - ROW_NUMBER() OVER (ORDER BY val) AS grp\n  FROM numbers\n)\n{{BLANK}}",
        editableDefault: "SELECT ",
        variations: [],
        expectedOutput: [[1, 3, 3], [5, 6, 2], [9, 9, 1]],
        hints: ["GROUP BY grp and use MIN(val), MAX(val), COUNT(*) to get start, end, and length of each run."],
      },
      {
        id: "consec-ex3",
        type: "build-incremental",
        prompt: "Find consecutive date streaks for a user's login activity.",
        setupSQL: `DROP TABLE IF EXISTS logins; CREATE TABLE logins(user_id INT, login_date DATE);
INSERT INTO logins VALUES (1,'2025-01-01'),(1,'2025-01-02'),(1,'2025-01-03'),(1,'2025-01-05'),(1,'2025-01-06');`,
        cols: ["streak_start", "streak_end", "days"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Assign a group key: login_date - ROW_NUMBER() OVER (ORDER BY login_date) as an interval. Use login_date - CAST(ROW_NUMBER() OVER (ORDER BY login_date) AS INT) AS grp.",
            template: "{{BLANK}}",
            expectedOutput: [["2025-01-01", "2024-12-31"], ["2025-01-02", "2024-12-31"], ["2025-01-03", "2024-12-31"], ["2025-01-05", "2025-01-01"], ["2025-01-06", "2025-01-01"]],
          },
          {
            prompt: "Group by grp and compute MIN(login_date) AS streak_start, MAX(login_date) AS streak_end, COUNT(*) AS days.",
            template: "{{BLANK}}",
            expectedOutput: [["2025-01-01", "2025-01-03", 3], ["2025-01-05", "2025-01-06", 2]],
          },
        ],
        variations: [],
        expectedOutput: [["2025-01-01", "2025-01-03", 3], ["2025-01-05", "2025-01-06", 2]],
        hints: ["WITH g AS (SELECT login_date, login_date - CAST(ROW_NUMBER() OVER (ORDER BY login_date) AS INT) AS grp FROM logins) SELECT MIN(login_date), MAX(login_date), COUNT(*) FROM g GROUP BY grp ORDER BY 1."],
      },
      {
        id: "consec-ex4",
        type: "fix-query",
        prompt: "This gaps-and-islands query uses RANK() instead of ROW_NUMBER(), which breaks for ties. Fix the window function.",
        setupSQL: `DROP TABLE IF EXISTS numbers; CREATE TABLE numbers(val INT);
INSERT INTO numbers VALUES (1),(2),(3),(5),(6);`,
        cols: ["val", "grp"],
        template: "SELECT val,\n  val - {{BLANK}} OVER (ORDER BY val) AS grp\nFROM numbers\nORDER BY val",
        editableDefault: "RANK()",
        variations: [],
        expectedOutput: [[1, 0], [2, 0], [3, 0], [5, 2], [6, 2]],
        hints: ["Use ROW_NUMBER() instead of RANK(). RANK() can skip numbers for ties, breaking the consecutive-group logic."],
      },
      {
        id: "consec-ex5",
        type: "fix-query",
        prompt: "This query finds consecutive sequences but misses the PARTITION BY when there are multiple users. Fix it to partition by user_id.",
        setupSQL: `DROP TABLE IF EXISTS logins; CREATE TABLE logins(user_id INT, val INT);
INSERT INTO logins VALUES (1,1),(1,2),(1,3),(2,1),(2,2),(2,5);`,
        cols: ["user_id", "val", "grp"],
        template: "SELECT user_id, val,\n  val - ROW_NUMBER() OVER ({{BLANK}} ORDER BY val) AS grp\nFROM logins\nORDER BY user_id, val",
        editableDefault: "",
        variations: [],
        expectedOutput: [[1, 1, 0], [1, 2, 0], [1, 3, 0], [2, 1, 0], [2, 2, 0], [2, 5, 3]],
        hints: ["Add PARTITION BY user_id so each user's row numbers restart from 1."],
      },
    ],
  },

  // ── Node 9: ADVANCED ANALYTICS ────────────────────────────────────────────
  {
    id: "advanced-analytics",
    title: "Advanced Analytics",
    description: "Combine window functions, CTEs, and complex joins to solve real-world analytics problems: median calculations, percentile ranks, period-over-period comparisons, and funnel analysis.",
    prerequisites: ["cumulative-sliding", "consecutive-sequences"],
    relatedProblemIds: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75],
    trunk: false,
    column: 0,
    row: 8,
    exercises: [
      {
        id: "advan-ex1",
        type: "fill-blank",
        prompt: "Use NTILE(4) to assign each employee to a salary quartile.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',40000),(2,'Bob',60000),(3,'Carol',80000),(4,'Dave',100000),(5,'Eve',50000),(6,'Frank',70000),(7,'Grace',90000),(8,'Hank',30000);`,
        cols: ["name", "salary", "quartile"],
        template: "SELECT name, salary,\n  {{BLANK}} AS quartile\nFROM employees\nORDER BY salary",
        editableDefault: "",
        variations: [],
        expectedOutput: [["Hank", 30000, 1], ["Alice", 40000, 1], ["Eve", 50000, 2], ["Bob", 60000, 2], ["Frank", 70000, 3], ["Carol", 80000, 3], ["Grace", 90000, 4], ["Dave", 100000, 4]],
        hints: ["NTILE(4) OVER (ORDER BY salary) divides rows into 4 equal buckets."],
      },
      {
        id: "advan-ex2",
        type: "fill-blank",
        prompt: "Compute the month-over-month revenue growth using LAG().",
        setupSQL: `DROP TABLE IF EXISTS monthly_revenue; CREATE TABLE monthly_revenue(month INT, revenue INT);
INSERT INTO monthly_revenue VALUES (1,1000),(2,1200),(3,1100),(4,1500),(5,1800);`,
        cols: ["month", "revenue", "prev_revenue", "growth"],
        template: "SELECT month, revenue,\n  LAG(revenue) OVER (ORDER BY month) AS prev_revenue,\n  revenue - {{BLANK}} AS growth\nFROM monthly_revenue",
        editableDefault: "",
        variations: [],
        expectedOutput: [[1, 1000, null, null], [2, 1200, 1000, 200], [3, 1100, 1200, -100], [4, 1500, 1100, 400], [5, 1800, 1500, 300]],
        hints: ["LAG(revenue) OVER (ORDER BY month) returns the previous row's revenue. Subtract it from current revenue for growth."],
      },
      {
        id: "advan-ex3",
        type: "build-incremental",
        prompt: "Find the median salary using PERCENTILE_CONT.",
        setupSQL: `DROP TABLE IF EXISTS employees; CREATE TABLE employees(id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1,'Alice',40000),(2,'Bob',60000),(3,'Carol',80000),(4,'Dave',100000),(5,'Eve',50000);`,
        cols: ["median_salary"],
        template: "{{BLANK}}",
        steps: [
          {
            prompt: "Use PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary FROM employees.",
            template: "{{BLANK}}",
            expectedOutput: [[60000]],
          },
          {
            prompt: "Wrap in SELECT to return just the median_salary.",
            template: "{{BLANK}}",
            expectedOutput: [[60000]],
          },
        ],
        variations: [],
        expectedOutput: [[60000]],
        hints: ["SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary FROM employees."],
      },
      {
        id: "advan-ex4",
        type: "fix-query",
        prompt: "This LEAD/LAG query computes next month's revenue incorrectly — it's using LAG when it should use LEAD. Fix it.",
        setupSQL: `DROP TABLE IF EXISTS monthly_revenue; CREATE TABLE monthly_revenue(month INT, revenue INT);
INSERT INTO monthly_revenue VALUES (1,1000),(2,1200),(3,1100),(4,1500);`,
        cols: ["month", "revenue", "next_revenue"],
        template: "SELECT month, revenue,\n  {{BLANK}}(revenue) OVER (ORDER BY month) AS next_revenue\nFROM monthly_revenue",
        editableDefault: "LAG",
        variations: [],
        expectedOutput: [[1, 1000, 1200], [2, 1200, 1100], [3, 1100, 1500], [4, 1500, null]],
        hints: ["LAG looks backward (previous row); LEAD looks forward (next row). Use LEAD to get the next month's revenue."],
      },
      {
        id: "advan-ex5",
        type: "fix-query",
        prompt: "This funnel query tries to compute conversion rate but divides integers giving 0. Fix the division to return a decimal percentage.",
        setupSQL: `DROP TABLE IF EXISTS funnel; CREATE TABLE funnel(stage TEXT, users INT);
INSERT INTO funnel VALUES ('visited',1000),('signed_up',400),('purchased',100);`,
        cols: ["stage", "users", "conversion_pct"],
        template: "WITH total AS (SELECT MAX(users) AS total_users FROM funnel)\nSELECT f.stage, f.users,\n  {{BLANK}} AS conversion_pct\nFROM funnel f, total\nORDER BY f.users DESC",
        editableDefault: "f.users / total.total_users * 100",
        variations: [],
        expectedOutput: [["visited", 1000, 100.0], ["signed_up", 400, 40.0], ["purchased", 100, 10.0]],
        hints: ["Cast to numeric before division: CAST(f.users AS NUMERIC) / total.total_users * 100."],
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
