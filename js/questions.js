/* questions.js — All 75 questions + topic metadata */

const TOPICS = [
  "Aggregations & JOINs",
  "Window Functions",
  "Cumulative & Sliding Windows",
  "Consecutive Sequences",
  "Advanced Analytics"
];

const TOPIC_COLORS = {
  "Aggregations & JOINs": "#2563eb",
  "Window Functions": "#8b5cf6",
  "Cumulative & Sliding Windows": "#06b6d4",
  "Consecutive Sequences": "#f59e0b",
  "Advanced Analytics": "#ec4899"
};

const Q = [
{id:1,title:"Q1 · Consecutive Price Increase",difficulty:"Medium",topic:"Window Functions",
 desc:"ProductPrices(product_id INT, price_date DATE, price INT)\n\nFind all records where a product's price increased vs its immediately previous recorded price.\nReturn: product_id, price_date, previous_price, current_price",
 setup:`DROP TABLE IF EXISTS ProductPrices;
 CREATE TABLE ProductPrices(product_id INT, price_date DATE, price INT);
 INSERT INTO ProductPrices VALUES
 (101,'2025-01-01',100),(101,'2025-01-02',120),(101,'2025-01-03',110),
 (102,'2025-01-01',200),(102,'2025-01-02',220);`,
 tables:["productprices"],
 cols:["product_id","price_date","previous_price","current_price"],
 rows:[[101,'2025-01-02',100,120],[102,'2025-01-02',200,220]],
 solution:`SELECT product_id, price_date, prev AS previous_price, price AS current_price
FROM (
  SELECT *, LAG(price) OVER (PARTITION BY product_id ORDER BY price_date) AS prev
  FROM ProductPrices
) t WHERE price > prev`,
 tips:"LAG() is the optimal single-pass approach here. Avoid self-joins which would be O(n^2). The window function scans the table once, partitioned by product_id.",
 hints:["Think about how to access the previous row's price for each product.","Use LAG() window function partitioned by product_id, ordered by price_date.","Wrap the LAG query in a subquery and filter WHERE current price > previous price."],
 tests:[
  {setup:`DROP TABLE IF EXISTS ProductPrices; CREATE TABLE ProductPrices(product_id INT, price_date DATE, price INT);
   INSERT INTO ProductPrices VALUES (201,'2025-03-01',50),(201,'2025-03-02',50),(201,'2025-03-03',60),(201,'2025-03-04',55),(201,'2025-03-05',70);`,
   rows:[[201,'2025-03-03',50,60],[201,'2025-03-05',55,70]]},
  {setup:`DROP TABLE IF EXISTS ProductPrices; CREATE TABLE ProductPrices(product_id INT, price_date DATE, price INT);
   INSERT INTO ProductPrices VALUES (301,'2025-04-01',100),(301,'2025-04-02',90),(301,'2025-04-03',80);`,
   rows:[]}
 ]},

{id:2,title:"Q2 · First Purchase After Signup",difficulty:"Medium",topic:"Aggregations & JOINs",
 desc:"Customers(customer_id INT, signup_date DATE)\nPurchases(customer_id INT, purchase_date DATE)\n\nFind the first purchase made on/after the customer signed up.\nReturn: customer_id, first_purchase_date",
 setup:`DROP TABLE IF EXISTS Customers; DROP TABLE IF EXISTS Purchases;
 CREATE TABLE Customers(customer_id INT, signup_date DATE);
 CREATE TABLE Purchases(customer_id INT, purchase_date DATE);
 INSERT INTO Customers VALUES (1,'2025-01-01'),(2,'2025-01-05');
 INSERT INTO Purchases VALUES (1,'2025-01-03'),(1,'2025-01-10'),(2,'2025-01-06');`,
 tables:["customers","purchases"],
 cols:["customer_id","first_purchase_date"],
 rows:[[1,'2025-01-03'],[2,'2025-01-06']],
 solution:`SELECT c.customer_id, MIN(p.purchase_date) AS first_purchase_date
FROM Customers c
JOIN Purchases p ON c.customer_id = p.customer_id
  AND p.purchase_date >= c.signup_date
GROUP BY c.customer_id`,
 tips:"MIN() with a filtered JOIN is optimal. Avoid correlated subqueries or LATERAL joins for this pattern — a simple GROUP BY with the date filter in the JOIN condition is cleaner and faster.",
 hints:["You need to JOIN Customers and Purchases on customer_id.","Filter purchases to only those on or after the signup_date.","Use MIN(purchase_date) with GROUP BY customer_id to get the first qualifying purchase."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Customers; DROP TABLE IF EXISTS Purchases;
   CREATE TABLE Customers(customer_id INT, signup_date DATE);
   CREATE TABLE Purchases(customer_id INT, purchase_date DATE);
   INSERT INTO Customers VALUES (10,'2025-02-01'),(20,'2025-02-10'),(30,'2025-02-15');
   INSERT INTO Purchases VALUES (10,'2025-01-25'),(10,'2025-02-05'),(20,'2025-02-10'),(30,'2025-02-20');`,
   rows:[[10,'2025-02-05'],[20,'2025-02-10'],[30,'2025-02-20']]}
 ]},

{id:3,title:"Q3 · Days Since Previous Login",difficulty:"Easy",topic:"Window Functions",
 desc:"UserLogins(user_id INT, login_date DATE)\n\nFor each login, days since the user's previous login (NULL for first).\nReturn: user_id, login_date, days_since_previous",
 setup:`DROP TABLE IF EXISTS UserLogins;
 CREATE TABLE UserLogins(user_id INT, login_date DATE);
 INSERT INTO UserLogins VALUES (1,'2025-01-01'),(1,'2025-01-05'),(1,'2025-01-08'),(2,'2025-01-02');`,
 tables:["userlogins"],
 cols:["user_id","login_date","days_since_previous"],
 rows:[[1,'2025-01-01',null],[1,'2025-01-05',4],[1,'2025-01-08',3],[2,'2025-01-02',null]],
 solution:`SELECT user_id, login_date,
  login_date - LAG(login_date) OVER (PARTITION BY user_id ORDER BY login_date) AS days_since_previous
FROM UserLogins`,
 tips:"LAG() with date subtraction is the cleanest approach. PostgreSQL natively subtracts dates to get an integer (days). No need for DATE_DIFF or EXTRACT.",
 hints:["You need the previous login_date for the same user.","Use LAG() partitioned by user_id and ordered by login_date.","In PostgreSQL, subtracting two dates gives the number of days directly."],
 tests:[
  {setup:`DROP TABLE IF EXISTS UserLogins; CREATE TABLE UserLogins(user_id INT, login_date DATE);
   INSERT INTO UserLogins VALUES (5,'2025-03-01'),(5,'2025-03-01'),(5,'2025-03-10'),(6,'2025-03-05'),(6,'2025-03-08');`,
   rows:[[5,'2025-03-01',null],[5,'2025-03-01',0],[5,'2025-03-10',9],[6,'2025-03-05',null],[6,'2025-03-08',3]]}
 ]},

{id:4,title:"Q4 · Salary Change Detection",difficulty:"Medium",topic:"Window Functions",
 desc:"EmployeeSalary(emp_id INT, effective_date DATE, salary INT)\n\nFind records where salary increased vs the previous record.\nReturn: emp_id, effective_date, previous_salary, current_salary",
 setup:`DROP TABLE IF EXISTS EmployeeSalary;
 CREATE TABLE EmployeeSalary(emp_id INT, effective_date DATE, salary INT);
 INSERT INTO EmployeeSalary VALUES (101,'2024-01-01',50000),(101,'2025-01-01',55000),(101,'2026-01-01',53000);`,
 tables:["employeesalary"],
 cols:["emp_id","effective_date","previous_salary","current_salary"],
 rows:[[101,'2025-01-01',50000,55000]],
 solution:`SELECT emp_id, effective_date, prev AS previous_salary, salary AS current_salary
FROM (
  SELECT *, LAG(salary) OVER (PARTITION BY emp_id ORDER BY effective_date) AS prev
  FROM EmployeeSalary
) t WHERE salary > prev`,
 tips:"Same LAG() pattern as Q1. Wrap in a subquery to filter on the computed column. This is a single-pass scan — much better than a self-join.",
 hints:["This is similar to Q1 — you need the previous salary per employee.","Use LAG(salary) OVER (PARTITION BY emp_id ORDER BY effective_date).","Filter in an outer query WHERE current salary > previous salary."],
 tests:[
  {setup:`DROP TABLE IF EXISTS EmployeeSalary; CREATE TABLE EmployeeSalary(emp_id INT, effective_date DATE, salary INT);
   INSERT INTO EmployeeSalary VALUES (201,'2024-01-01',60000),(201,'2024-06-01',65000),(201,'2025-01-01',70000),(202,'2024-01-01',80000),(202,'2025-01-01',75000);`,
   rows:[[201,'2024-06-01',60000,65000],[201,'2025-01-01',65000,70000]]}
 ]},

{id:5,title:"Q5 · Top 3 Customers Per Region",difficulty:"Medium",topic:"Window Functions",
 desc:"Sales(region VARCHAR, customer_id INT, sales INT)\n\nTop 3 customers by sales within each region.\nReturn: region, customer_id, sales  (row order doesn't matter)",
 setup:`DROP TABLE IF EXISTS Sales;
 CREATE TABLE Sales(region VARCHAR, customer_id INT, sales INT);
 INSERT INTO Sales VALUES ('East',1,1000),('East',2,900),('East',3,850),('East',4,700),('West',5,1200);`,
 tables:["sales"],
 cols:["region","customer_id","sales"],
 rows:[['East',1,1000],['East',2,900],['East',3,850],['West',5,1200]],
 solution:`SELECT region, customer_id, sales
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY region ORDER BY sales DESC) AS rn
  FROM Sales
) t WHERE rn <= 3`,
 tips:"ROW_NUMBER() is preferred over RANK()/DENSE_RANK() here since we want exactly top 3. Use RANK() only if you need ties included. Avoid LIMIT — it doesn't work per-group.",
 hints:["LIMIT won't work here because you need top 3 per group, not overall.","Use a ranking window function partitioned by region, ordered by sales DESC.","ROW_NUMBER() in a subquery, then filter WHERE rn <= 3."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Sales; CREATE TABLE Sales(region VARCHAR, customer_id INT, sales INT);
   INSERT INTO Sales VALUES ('North',10,500),('North',11,400),('North',12,300),('North',13,200),('South',14,600),('South',15,550);`,
   rows:[['North',10,500],['North',11,400],['North',12,300],['South',14,600],['South',15,550]]}
 ]},

{id:6,title:"Q6 · Second Highest Salary Per Dept",difficulty:"Medium",topic:"Window Functions",
 desc:"Employees(dept_id INT, emp_id INT, salary INT)\n\nEmployees earning the 2nd highest salary in each department.\nReturn: dept_id, emp_id, salary",
 setup:`DROP TABLE IF EXISTS Employees;
 CREATE TABLE Employees(dept_id INT, emp_id INT, salary INT);
 INSERT INTO Employees VALUES (1,101,100000),(1,102,90000),(1,103,80000),(2,201,120000),(2,202,110000);`,
 tables:["employees"],
 cols:["dept_id","emp_id","salary"],
 rows:[[1,102,90000],[2,202,110000]],
 solution:`SELECT dept_id, emp_id, salary
FROM (
  SELECT *, DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dr
  FROM Employees
) t WHERE dr = 2`,
 tips:"DENSE_RANK() handles ties correctly — if two employees share the top salary, the next distinct salary is still rank 2. ROW_NUMBER() could skip the true 2nd highest if there are ties at rank 1.",
 hints:["Think about what happens if two employees share the highest salary.","DENSE_RANK() treats tied values as the same rank — unlike ROW_NUMBER().","Use DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) and filter WHERE rank = 2."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Employees; CREATE TABLE Employees(dept_id INT, emp_id INT, salary INT);
   INSERT INTO Employees VALUES (3,301,70000),(3,302,70000),(3,303,60000),(4,401,95000),(4,402,90000),(4,403,85000);`,
   rows:[[3,303,60000],[4,402,90000]]}
 ]},

{id:7,title:"Q7 · Top Selling Product Per Category",difficulty:"Easy",topic:"Window Functions",
 desc:"ProductSales(category VARCHAR, product_id INT, sales INT)\n\nHighest-selling product within each category.\nReturn: category, product_id, sales",
 setup:`DROP TABLE IF EXISTS ProductSales;
 CREATE TABLE ProductSales(category VARCHAR, product_id INT, sales INT);
 INSERT INTO ProductSales VALUES ('Electronics',1,500),('Electronics',2,700),('Books',3,200),('Books',4,150);`,
 tables:["productsales"],
 cols:["category","product_id","sales"],
 rows:[['Electronics',2,700],['Books',3,200]],
 solution:`SELECT category, product_id, sales
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) AS rn
  FROM ProductSales
) t WHERE rn = 1`,
 tips:"ROW_NUMBER() with rn=1 is the standard top-per-group pattern. DISTINCT ON (PostgreSQL-specific) is also valid: SELECT DISTINCT ON (category) * FROM ProductSales ORDER BY category, sales DESC.",
 hints:["You need the top 1 per category — this is a top-per-group problem.","Use ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC).","Filter WHERE rn = 1 in an outer query. Or try PostgreSQL's DISTINCT ON."],
 tests:[
  {setup:`DROP TABLE IF EXISTS ProductSales; CREATE TABLE ProductSales(category VARCHAR, product_id INT, sales INT);
   INSERT INTO ProductSales VALUES ('Toys',10,300),('Toys',11,450),('Toys',12,200),('Food',13,100);`,
   rows:[['Toys',11,450],['Food',13,100]]}
 ]},

{id:8,title:"Q8 · Latest Order Per Customer",difficulty:"Easy",topic:"Aggregations & JOINs",
 desc:"Orders(customer_id INT, order_date DATE)\n\nMost recent order for every customer.\nReturn: customer_id, latest_order_date",
 setup:`DROP TABLE IF EXISTS Orders;
 CREATE TABLE Orders(customer_id INT, order_date DATE);
 INSERT INTO Orders VALUES (1,'2025-01-01'),(1,'2025-01-10'),(2,'2025-01-03');`,
 tables:["orders"],
 cols:["customer_id","latest_order_date"],
 rows:[[1,'2025-01-10'],[2,'2025-01-03']],
 solution:`SELECT customer_id, MAX(order_date) AS latest_order_date
FROM Orders
GROUP BY customer_id`,
 tips:"Simple MAX() aggregation is optimal. No window functions needed. If you used ROW_NUMBER(), it works but is overkill for this pattern.",
 hints:["What aggregate function gives you the most recent date?","GROUP BY customer_id and use MAX(order_date).","No window functions needed — a simple GROUP BY is enough."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Orders; CREATE TABLE Orders(customer_id INT, order_date DATE);
   INSERT INTO Orders VALUES (5,'2025-02-01'),(5,'2025-02-15'),(5,'2025-03-01'),(6,'2025-01-20'),(7,'2025-04-01');`,
   rows:[[5,'2025-03-01'],[6,'2025-01-20'],[7,'2025-04-01']]}
 ]},

{id:9,title:"Q9 · Running Account Balance",difficulty:"Easy",topic:"Cumulative & Sliding Windows",
 desc:"Transactions(user_id INT, txn_date DATE, amount INT)\n\nRunning balance per user ordered by txn_date.\nReturn: user_id, txn_date, amount, running_balance",
 setup:`DROP TABLE IF EXISTS Transactions;
 CREATE TABLE Transactions(user_id INT, txn_date DATE, amount INT);
 INSERT INTO Transactions VALUES (1,'2025-01-01',100),(1,'2025-01-03',-20),(1,'2025-01-05',50),(2,'2025-01-01',200);`,
 tables:["transactions"],
 cols:["user_id","txn_date","amount","running_balance"],
 rows:[[1,'2025-01-01',100,100],[1,'2025-01-03',-20,80],[1,'2025-01-05',50,130],[2,'2025-01-01',200,200]],
 solution:`SELECT user_id, txn_date, amount,
  SUM(amount) OVER (PARTITION BY user_id ORDER BY txn_date) AS running_balance
FROM Transactions`,
 tips:"SUM() OVER with ORDER BY gives a running total by default (ROWS UNBOUNDED PRECEDING to CURRENT ROW). This is the standard cumulative sum pattern — single pass, no self-joins.",
 hints:["A running balance means a cumulative sum of all amounts up to the current row.","Use SUM() as a window function with PARTITION BY user_id.","ORDER BY txn_date inside the OVER clause gives you the running total automatically."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Transactions; CREATE TABLE Transactions(user_id INT, txn_date DATE, amount INT);
   INSERT INTO Transactions VALUES (3,'2025-02-01',500),(3,'2025-02-03',-100),(3,'2025-02-05',-50),(3,'2025-02-10',200);`,
   rows:[[3,'2025-02-01',500,500],[3,'2025-02-03',-100,400],[3,'2025-02-05',-50,350],[3,'2025-02-10',200,550]]}
 ]},

{id:10,title:"Q10 · Cumulative Sales by Region",difficulty:"Easy",topic:"Cumulative & Sliding Windows",
 desc:"RegionalSales(region VARCHAR, sales_date DATE, sales INT)\n\nCumulative sales per region ordered by date.\nReturn: region, sales_date, cumulative_sales",
 setup:`DROP TABLE IF EXISTS RegionalSales;
 CREATE TABLE RegionalSales(region VARCHAR, sales_date DATE, sales INT);
 INSERT INTO RegionalSales VALUES ('East','2025-01-01',100),('East','2025-01-02',200),('East','2025-01-03',150),('West','2025-01-01',300);`,
 tables:["regionalsales"],
 cols:["region","sales_date","cumulative_sales"],
 rows:[['East','2025-01-01',100],['East','2025-01-02',300],['East','2025-01-03',450],['West','2025-01-01',300]],
 solution:`SELECT region, sales_date,
  SUM(sales) OVER (PARTITION BY region ORDER BY sales_date) AS cumulative_sales
FROM RegionalSales`,
 tips:"Same cumulative SUM() pattern as Q9 but partitioned by region. The default window frame (UNBOUNDED PRECEDING to CURRENT ROW) is exactly what we need.",
 hints:["Same idea as Q9 — cumulative sum, but grouped differently.","PARTITION BY region, ORDER BY sales_date.","SUM(sales) OVER (...) gives the running total per region."],
 tests:[
  {setup:`DROP TABLE IF EXISTS RegionalSales; CREATE TABLE RegionalSales(region VARCHAR, sales_date DATE, sales INT);
   INSERT INTO RegionalSales VALUES ('North','2025-02-01',50),('North','2025-02-02',75),('South','2025-02-01',200),('South','2025-02-02',100);`,
   rows:[['North','2025-02-01',50],['North','2025-02-02',125],['South','2025-02-01',200],['South','2025-02-02',300]]}
 ]},
{id:11,title:"Q11 · First Date Reached Gold Tier",difficulty:"Medium",topic:"Cumulative & Sliding Windows",
 desc:"Transactions(customer_id INT, txn_date DATE, amount INT)\n\nGold = cumulative spend exceeds 1000. First date each customer reached Gold.\nReturn: customer_id, gold_date",
 setup:`DROP TABLE IF EXISTS Transactions;
 CREATE TABLE Transactions(customer_id INT, txn_date DATE, amount INT);
 INSERT INTO Transactions VALUES (1,'2025-01-01',300),(1,'2025-01-05',400),(1,'2025-01-10',500),(2,'2025-01-01',600);`,
 tables:["transactions"],
 cols:["customer_id","gold_date"],
 rows:[[1,'2025-01-10']],
 solution:`SELECT customer_id, MIN(txn_date) AS gold_date
FROM (
  SELECT *, SUM(amount) OVER (PARTITION BY customer_id ORDER BY txn_date) AS cum
  FROM Transactions
) t WHERE cum > 1000
GROUP BY customer_id`,
 tips:"Compute cumulative sum first, then filter rows exceeding 1000 and take MIN date. The two-step approach (window + filter) avoids correlated subqueries.",
 hints:["First, compute the running total of spend per customer.","Filter for rows where the cumulative spend exceeds 1000.","Use MIN(txn_date) grouped by customer_id to get the first date they crossed the threshold."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Transactions; CREATE TABLE Transactions(customer_id INT, txn_date DATE, amount INT);
   INSERT INTO Transactions VALUES (5,'2025-02-01',600),(5,'2025-02-05',500),(6,'2025-02-01',400),(6,'2025-02-10',400),(6,'2025-02-15',300);`,
   rows:[[5,'2025-02-05'],[6,'2025-02-15']]}
 ]},

{id:12,title:"Q12 · Inventory Tracking",difficulty:"Easy",topic:"Cumulative & Sliding Windows",
 desc:"InventoryMovements(product_id VARCHAR, movement_date DATE, quantity INT)\n\nInventory balance after each movement (running sum).\nReturn: product_id, movement_date, inventory_balance",
 setup:`DROP TABLE IF EXISTS InventoryMovements;
 CREATE TABLE InventoryMovements(product_id VARCHAR, movement_date DATE, quantity INT);
 INSERT INTO InventoryMovements VALUES ('A','2025-01-01',100),('A','2025-01-03',-20),('A','2025-01-05',-10),('A','2025-01-07',50);`,
 tables:["inventorymovements"],
 cols:["product_id","movement_date","inventory_balance"],
 rows:[['A','2025-01-01',100],['A','2025-01-03',80],['A','2025-01-05',70],['A','2025-01-07',120]],
 solution:`SELECT product_id, movement_date,
  SUM(quantity) OVER (PARTITION BY product_id ORDER BY movement_date) AS inventory_balance
FROM InventoryMovements`,
 tips:"Running SUM() handles both positive (inflow) and negative (outflow) quantities naturally. No CASE expression needed.",
 hints:["Inventory balance = running sum of all movements up to the current row.","Use SUM(quantity) as a window function.","PARTITION BY product_id, ORDER BY movement_date — same running total pattern."],
 tests:[
  {setup:`DROP TABLE IF EXISTS InventoryMovements; CREATE TABLE InventoryMovements(product_id VARCHAR, movement_date DATE, quantity INT);
   INSERT INTO InventoryMovements VALUES ('B','2025-02-01',200),('B','2025-02-03',-50),('C','2025-02-01',300),('C','2025-02-02',-100),('C','2025-02-03',50);`,
   rows:[['B','2025-02-01',200],['B','2025-02-03',150],['C','2025-02-01',300],['C','2025-02-02',200],['C','2025-02-03',250]]}
 ]},

{id:13,title:"Q13 · 3-Day Moving Average",difficulty:"Medium",topic:"Cumulative & Sliding Windows",
 desc:"DailySales(sales_date DATE, sales INT)\n\n3-day trailing moving average (current + up to 2 prior days).\nReturn: sales_date, moving_avg",
 setup:`DROP TABLE IF EXISTS DailySales;
 CREATE TABLE DailySales(sales_date DATE, sales INT);
 INSERT INTO DailySales VALUES ('2025-01-01',100),('2025-01-02',200),('2025-01-03',300),('2025-01-04',400);`,
 tables:["dailysales"],
 cols:["sales_date","moving_avg"],
 rows:[['2025-01-01',100],['2025-01-02',150],['2025-01-03',200],['2025-01-04',300]],
 note:"Decimals are compared with tolerance, so AVG(...) or ROUND(...,2) both pass.",
 solution:`SELECT sales_date,
  AVG(sales) OVER (ORDER BY sales_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg
FROM DailySales`,
 tips:"ROWS BETWEEN 2 PRECEDING AND CURRENT ROW gives a true trailing 3-day window. Using RANGE instead would group same-date rows differently. AVG automatically handles windows with fewer than 3 rows at the start.",
 hints:["A 3-day moving average means the average of the current row and up to 2 prior rows.","Use AVG() as a window function with a specific frame.","ROWS BETWEEN 2 PRECEDING AND CURRENT ROW defines exactly that window."],
 tests:[
  {setup:`DROP TABLE IF EXISTS DailySales; CREATE TABLE DailySales(sales_date DATE, sales INT);
   INSERT INTO DailySales VALUES ('2025-03-01',60),('2025-03-02',90),('2025-03-03',120),('2025-03-04',30),('2025-03-05',60);`,
   rows:[['2025-03-01',60],['2025-03-02',75],['2025-03-03',90],['2025-03-04',80],['2025-03-05',70]]}
 ]},

{id:14,title:"Q14 · Active Users in Previous 7 Days",difficulty:"Hard",topic:"Aggregations & JOINs",
 desc:"Logins(user_id INT, login_date DATE)\n\nFor each date that appears in the data, count DISTINCT users active in the trailing 7-day window (the date itself and the 6 days before).\nReturn: login_date, active_users",
 setup:`DROP TABLE IF EXISTS Logins;
 CREATE TABLE Logins(user_id INT, login_date DATE);
 INSERT INTO Logins VALUES (1,'2025-01-01'),(2,'2025-01-02'),(1,'2025-01-05'),(3,'2025-01-07');`,
 tables:["logins"],
 cols:["login_date","active_users"],
 rows:[['2025-01-01',1],['2025-01-02',2],['2025-01-05',2],['2025-01-07',3]],
 solution:`SELECT d.login_date, COUNT(DISTINCT l.user_id) AS active_users
FROM (SELECT DISTINCT login_date FROM Logins) d
JOIN Logins l ON l.login_date BETWEEN d.login_date - 6 AND d.login_date
GROUP BY d.login_date
ORDER BY d.login_date`,
 tips:"Self-join on a date range is the standard approach for range-based windows over sparse dates. A window frame with RANGE BETWEEN won't work here since we need DISTINCT users across rows.",
 hints:["For each date, count distinct users who logged in within the past 7 days.","Window functions can't do COUNT(DISTINCT) — consider a self-join approach.","Join distinct dates with all logins where login_date falls in the 7-day range."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Logins; CREATE TABLE Logins(user_id INT, login_date DATE);
   INSERT INTO Logins VALUES (1,'2025-02-01'),(2,'2025-02-03'),(3,'2025-02-08'),(1,'2025-02-09');`,
   rows:[['2025-02-01',1],['2025-02-03',2],['2025-02-08',2],['2025-02-09',3]]}
 ]},

{id:15,title:"Q15 · Best 7-Day Revenue Window",difficulty:"Hard",topic:"Cumulative & Sliding Windows",
 desc:"StoreSales(store_id INT, sales_date DATE, revenue INT)\n\nFor each store find the 7-day window (window_end and the 6 days before it) with the highest total revenue.\nReturn: store_id, window_end_date, seven_day_revenue",
 setup:`DROP TABLE IF EXISTS StoreSales;
 CREATE TABLE StoreSales(store_id INT, sales_date DATE, revenue INT);
 INSERT INTO StoreSales VALUES
 (1,'2025-01-01',100),(1,'2025-01-02',200),(1,'2025-01-03',300),(1,'2025-01-04',400),
 (1,'2025-01-05',500),(1,'2025-01-06',600),(1,'2025-01-07',700),(1,'2025-01-08',50),
 (1,'2025-01-09',50),(1,'2025-01-10',50);`,
 tables:["storesales"],
 cols:["store_id","window_end_date","seven_day_revenue"],
 rows:[[1,'2025-01-07',2800]],
 solution:`SELECT store_id, window_end_date, seven_day_revenue
FROM (
  SELECT store_id, sales_date AS window_end_date,
    SUM(revenue) OVER (PARTITION BY store_id ORDER BY sales_date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS seven_day_revenue,
    ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY
      SUM(revenue) OVER (PARTITION BY store_id ORDER BY sales_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) DESC) AS rn
  FROM StoreSales
) t WHERE rn = 1`,
 tips:"Combine a sliding SUM() window with ROW_NUMBER() to pick the best window per store. Alternatively, use a CTE to compute the rolling sum first, then filter with ROW_NUMBER() in a second step for readability.",
 hints:["First compute a 7-day rolling revenue sum for each row per store.","Use SUM() OVER with ROWS BETWEEN 6 PRECEDING AND CURRENT ROW.","Then pick the row with the highest rolling sum per store using ROW_NUMBER() or a subquery."],
 tests:[
  {setup:`DROP TABLE IF EXISTS StoreSales; CREATE TABLE StoreSales(store_id INT, sales_date DATE, revenue INT);
   INSERT INTO StoreSales VALUES (2,'2025-02-01',50),(2,'2025-02-02',50),(2,'2025-02-03',50),(2,'2025-02-04',200),(2,'2025-02-05',200),(2,'2025-02-06',200),(2,'2025-02-07',200);`,
   rows:[[2,'2025-02-07',950]]}
 ]},

{id:16,title:"Q16 · Rolling 30-Day Order Count",difficulty:"Hard",topic:"Aggregations & JOINs",
 desc:"Orders(order_date DATE)\n\nFor each order date, total orders in the trailing 30 days (incl. current day).\nReturn: order_date, orders_last_30_days",
 setup:`DROP TABLE IF EXISTS Orders;
 CREATE TABLE Orders(order_date DATE);
 INSERT INTO Orders VALUES ('2025-01-01'),('2025-01-05'),('2025-01-10'),('2025-01-20');`,
 tables:["orders"],
 cols:["order_date","orders_last_30_days"],
 rows:[['2025-01-01',1],['2025-01-05',2],['2025-01-10',3],['2025-01-20',4]],
 solution:`SELECT o1.order_date,
  COUNT(*) AS orders_last_30_days
FROM Orders o1
JOIN Orders o2 ON o2.order_date BETWEEN o1.order_date - 29 AND o1.order_date
GROUP BY o1.order_date
ORDER BY o1.order_date`,
 tips:"Self-join on a date range is clean for sparse dates. RANGE BETWEEN '29 days' PRECEDING also works in PostgreSQL: COUNT(*) OVER (ORDER BY order_date RANGE BETWEEN INTERVAL '29 days' PRECEDING AND CURRENT ROW).",
 hints:["For each order date, count orders within the past 30 days (including that day).","A self-join on a date range works well with sparse dates.","Alternatively, try RANGE BETWEEN INTERVAL '29 days' PRECEDING AND CURRENT ROW in PostgreSQL."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Orders; CREATE TABLE Orders(order_date DATE);
   INSERT INTO Orders VALUES ('2025-02-01'),('2025-02-15'),('2025-03-05'),('2025-03-10');`,
   rows:[['2025-02-01',1],['2025-02-15',2],['2025-03-05',3],['2025-03-10',3]]}
 ]},

{id:17,title:"Q17 · Five Consecutive Winning Matches",difficulty:"Hard",topic:"Consecutive Sequences",
 desc:"MatchResults(player_id INT, match_date DATE, result VARCHAR)\n\nPlayers who won (result='W') at least 5 matches in a row (consecutive by date).\nReturn: player_id",
 setup:`DROP TABLE IF EXISTS MatchResults;
 CREATE TABLE MatchResults(player_id INT, match_date DATE, result VARCHAR);
 INSERT INTO MatchResults VALUES
 (1,'2025-01-01','W'),(1,'2025-01-02','W'),(1,'2025-01-03','W'),(1,'2025-01-04','W'),(1,'2025-01-05','W'),(1,'2025-01-06','L'),
 (2,'2025-01-01','W'),(2,'2025-01-02','W'),(2,'2025-01-03','W'),(2,'2025-01-04','W');`,
 tables:["matchresults"],
 cols:["player_id"],
 rows:[[1]],
 solution:`WITH streaks AS (
  SELECT player_id, result,
    match_date - ROW_NUMBER() OVER (PARTITION BY player_id, result ORDER BY match_date)::int AS grp
  FROM MatchResults
)
SELECT DISTINCT player_id
FROM streaks
WHERE result = 'W'
GROUP BY player_id, grp
HAVING COUNT(*) >= 5`,
 tips:"The 'date minus row_number' trick groups consecutive same-value rows. Rows with the same result on consecutive dates produce the same grp value. Then just filter for groups with COUNT >= 5.",
 hints:["You need to group consecutive wins together — this is an 'islands' problem.","Try ROW_NUMBER() overall minus ROW_NUMBER() within wins — consecutive wins get the same group ID.","Group by that ID, count per group, and filter HAVING COUNT(*) >= 5."],
 tests:[
  {setup:`DROP TABLE IF EXISTS MatchResults; CREATE TABLE MatchResults(player_id INT, match_date DATE, result VARCHAR);
   INSERT INTO MatchResults VALUES
   (3,'2025-02-01','W'),(3,'2025-02-02','W'),(3,'2025-02-03','W'),(3,'2025-02-04','W'),(3,'2025-02-05','L'),(3,'2025-02-06','W'),
   (4,'2025-02-01','W'),(4,'2025-02-02','W'),(4,'2025-02-03','W'),(4,'2025-02-04','W'),(4,'2025-02-05','W');`,
   rows:[[4]]}
 ]},

{id:18,title:"Q18 · Three Consecutive Failed Payments",difficulty:"Hard",topic:"Consecutive Sequences",
 desc:"Payments(user_id INT, txn_time TIME, status VARCHAR)\n\nUsers with 3 consecutive FAIL payments (consecutive by time).\nReturn: user_id",
 setup:`DROP TABLE IF EXISTS Payments;
 CREATE TABLE Payments(user_id INT, txn_time TIME, status VARCHAR);
 INSERT INTO Payments VALUES
 (1,'09:00','FAIL'),(1,'09:05','FAIL'),(1,'09:10','FAIL'),(1,'09:15','SUCCESS'),
 (2,'09:00','FAIL'),(2,'09:05','SUCCESS'),(2,'09:10','FAIL'),(2,'09:15','FAIL');`,
 tables:["payments"],
 cols:["user_id"],
 rows:[[1]],
 solution:`WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY txn_time) AS rn,
    ROW_NUMBER() OVER (PARTITION BY user_id, status ORDER BY txn_time) AS srn
  FROM Payments
)
SELECT DISTINCT user_id
FROM ranked
WHERE status = 'FAIL'
GROUP BY user_id, rn - srn
HAVING COUNT(*) >= 3`,
 tips:"Same consecutive-grouping technique: ROW_NUMBER() overall minus ROW_NUMBER() within the same status creates a group ID. Filter for FAIL groups with 3+ rows.",
 hints:["Same islands pattern as Q17 but with status instead of result.","Use ROW_NUMBER() overall minus ROW_NUMBER() within the same status to group consecutive FAILs.","Filter for FAIL groups with HAVING COUNT(*) >= 3."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Payments; CREATE TABLE Payments(user_id INT, txn_time TIME, status VARCHAR);
   INSERT INTO Payments VALUES
   (3,'10:00','FAIL'),(3,'10:05','SUCCESS'),(3,'10:10','FAIL'),(3,'10:15','FAIL'),(3,'10:20','FAIL'),
   (4,'10:00','SUCCESS'),(4,'10:05','FAIL'),(4,'10:10','FAIL');`,
   rows:[[3]]}
 ]},

{id:19,title:"Q19 · Four Consecutive Revenue Declines",difficulty:"Hard",topic:"Consecutive Sequences",
 desc:"Revenue(company_id VARCHAR, quarter VARCHAR, revenue INT)\n\nCompanies whose revenue declined for 4 consecutive quarter-over-quarter steps.\nReturn: company_id",
 setup:`DROP TABLE IF EXISTS Revenue;
 CREATE TABLE Revenue(company_id VARCHAR, quarter VARCHAR, revenue INT);
 INSERT INTO Revenue VALUES
 ('A','Q1',500),('A','Q2',450),('A','Q3',400),('A','Q4',350),('A','Q5',300),
 ('B','Q1',100),('B','Q2',90),('B','Q3',110),('B','Q4',80),('B','Q5',70);`,
 tables:["revenue"],
 cols:["company_id"],
 rows:[['A']],
 solution:`WITH ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY quarter) AS rn,
    LAG(revenue) OVER (PARTITION BY company_id ORDER BY quarter) AS prev_rev
  FROM Revenue
),
declines AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY quarter) AS drn
  FROM ranked WHERE revenue < prev_rev
)
SELECT DISTINCT company_id
FROM declines
GROUP BY company_id, rn - drn
HAVING COUNT(*) >= 4`,
 tips:"First identify decline rows with LAG(), then apply the consecutive-grouping trick (rn - drn) on just the decline rows. HAVING COUNT >= 4 finds streaks of 4+ consecutive declines.",
 hints:["First use LAG() to identify which quarters had a revenue decline.","Then apply the consecutive-grouping trick on just the decline rows.","Group and filter with HAVING COUNT(*) >= 4."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Revenue; CREATE TABLE Revenue(company_id VARCHAR, quarter VARCHAR, revenue INT);
   INSERT INTO Revenue VALUES ('C','Q1',200),('C','Q2',180),('C','Q3',160),('C','Q4',140),('C','Q5',120),
   ('D','Q1',100),('D','Q2',90),('D','Q3',95),('D','Q4',80),('D','Q5',70);`,
   rows:[['C']]}
 ]},

{id:20,title:"Q20 · Five Consecutive Growth Years",difficulty:"Hard",topic:"Consecutive Sequences",
 desc:"RegionalSales(region VARCHAR, year INT, sales INT)\n\nRegions whose sales increased for 5 consecutive year-over-year steps. Return the streak's starting year.\nReturn: region, starting_year",
 setup:`DROP TABLE IF EXISTS RegionalSales;
 CREATE TABLE RegionalSales(region VARCHAR, year INT, sales INT);
 INSERT INTO RegionalSales VALUES
 ('East',2018,100),('East',2019,120),('East',2020,140),('East',2021,160),('East',2022,180),('East',2023,200);`,
 tables:["regionalsales"],
 cols:["region","starting_year"],
 rows:[['East',2018]],
 solution:`WITH ranked AS (
  SELECT *, LAG(sales) OVER (PARTITION BY region ORDER BY year) AS prev_sales,
    ROW_NUMBER() OVER (PARTITION BY region ORDER BY year) AS rn
  FROM RegionalSales
),
growth AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY region ORDER BY year) AS grn
  FROM ranked WHERE sales > prev_sales
)
SELECT region, MIN(year) - 1 AS starting_year
FROM growth
GROUP BY region, rn - grn
HAVING COUNT(*) >= 5`,
 tips:"Find growth rows, group consecutive ones, and check for 5+ in a row. MIN(year)-1 gives the starting year (the year before the first growth). This is the standard consecutive-events pattern.",
 hints:["Use LAG() to find which years had growth over the previous year.","Apply the row_number gap trick to group consecutive growth years.","The starting_year is MIN(year) - 1 in the group (the base year before growth began)."],
 tests:[
  {setup:`DROP TABLE IF EXISTS RegionalSales; CREATE TABLE RegionalSales(region VARCHAR, year INT, sales INT);
   INSERT INTO RegionalSales VALUES
   ('West',2015,100),('West',2016,110),('West',2017,120),('West',2018,130),('West',2019,140),('West',2020,150),
   ('South',2015,200),('South',2016,210),('South',2017,220),('South',2018,200),('South',2019,230),('South',2020,240);`,
   rows:[['West',2015]]}
 ]},
{id:21,title:"Q21 · Meeting Rooms Required",difficulty:"Medium",topic:"Advanced Analytics",
 desc:"Meetings(meeting_id INT, start_time TIME, end_time TIME)\n\nMinimum rooms to hold all meetings.\nReturn: rooms_required",
 setup:`DROP TABLE IF EXISTS Meetings;
 CREATE TABLE Meetings(meeting_id INT, start_time TIME, end_time TIME);
 INSERT INTO Meetings VALUES (1,'09:00','10:00'),(2,'09:30','11:00'),(3,'10:00','10:30');`,
 tables:["meetings"],
 cols:["rooms_required"],
 rows:[[3]],
 note:"Convention: endpoints are INCLUSIVE — a meeting ending at 10:00 conflicts with one starting at 10:00 (matches the expected answer of 3).",
 solution:`SELECT MAX(concurrent) AS rooms_required FROM (
  SELECT SUM(delta) OVER (ORDER BY t, delta DESC) AS concurrent
  FROM (
    SELECT start_time AS t, 1 AS delta FROM Meetings
    UNION ALL
    SELECT end_time, -1 FROM Meetings
  ) events
) s`,
 tips:"The sweep-line / timeline approach: create +1 events at start and -1 at end, then compute a running sum. The max running sum = peak concurrency = rooms needed. O(n log n) vs O(n^2) for counting overlaps per meeting.",
 hints:["Think of each meeting as two events: +1 at start_time, -1 at end_time.","UNION ALL these events, then compute a running SUM to track active meetings at each point.","The MAX of the running sum is the peak concurrency = rooms needed."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Meetings; CREATE TABLE Meetings(meeting_id INT, start_time TIME, end_time TIME);
   INSERT INTO Meetings VALUES (1,'09:00','09:30'),(2,'09:30','10:00'),(3,'10:00','10:30'),(4,'10:30','11:00');`,
   rows:[[2]]}
 ]},

{id:22,title:"Q22 · Concurrent Website Users",difficulty:"Medium",topic:"Advanced Analytics",
 desc:"Sessions(user_id INT, login_time TIME, logout_time TIME)\n\nMaximum number of users logged in simultaneously.\nReturn: max_concurrent_users",
 setup:`DROP TABLE IF EXISTS Sessions;
 CREATE TABLE Sessions(user_id INT, login_time TIME, logout_time TIME);
 INSERT INTO Sessions VALUES (1,'09:00','10:00'),(2,'09:30','11:00'),(3,'09:45','10:15');`,
 tables:["sessions"],
 cols:["max_concurrent_users"],
 rows:[[3]],
 solution:`SELECT MAX(concurrent) AS max_concurrent_users FROM (
  SELECT SUM(delta) OVER (ORDER BY t, delta DESC) AS concurrent
  FROM (
    SELECT login_time AS t, 1 AS delta FROM Sessions
    UNION ALL
    SELECT logout_time, -1 FROM Sessions
  ) events
) s`,
 tips:"Same sweep-line technique as Q21. UNION ALL +1/-1 events, running SUM, take MAX. This scales linearly and is the go-to pattern for all concurrency problems.",
 hints:["Same sweep-line approach as Q21.","Create +1 events at login_time, -1 events at logout_time.","Running SUM then MAX gives you the peak concurrent users."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Sessions; CREATE TABLE Sessions(user_id INT, login_time TIME, logout_time TIME);
   INSERT INTO Sessions VALUES (1,'08:00','09:00'),(2,'08:30','09:30'),(3,'09:00','10:00'),(4,'09:30','10:30');`,
   rows:[[3]]}
 ]},

{id:23,title:"Q23 · Peak Traffic Timestamp",difficulty:"Hard",topic:"Advanced Analytics",
 desc:"Sessions(user_id INT, login_time TIME, logout_time TIME)\n\nThe (earliest) login_time at which the maximum concurrency is reached.\nReturn: peak_timestamp, concurrent_users",
 setup:`DROP TABLE IF EXISTS Sessions;
 CREATE TABLE Sessions(user_id INT, login_time TIME, logout_time TIME);
 INSERT INTO Sessions VALUES (1,'09:00','10:00'),(2,'09:30','11:00'),(3,'09:45','10:15');`,
 tables:["sessions"],
 cols:["peak_timestamp","concurrent_users"],
 rows:[['09:45:00',3]],
 note:"Use login_time values as the sweep points; return the first time the peak is hit.",
 solution:`WITH counts AS (
  SELECT login_time AS peak_timestamp,
    (SELECT COUNT(*) FROM Sessions s2
     WHERE s2.login_time <= s1.login_time AND s2.logout_time >= s1.login_time) AS concurrent_users
  FROM Sessions s1
)
SELECT peak_timestamp, concurrent_users
FROM counts
ORDER BY concurrent_users DESC, peak_timestamp
LIMIT 1`,
 tips:"For each login_time, count how many sessions are active at that moment (started <= t and not yet ended). Then pick the max. For large data, the sweep-line approach with a running sum would be more efficient.",
 hints:["You only need to check concurrency at login_time timestamps (sweep points).","For each login_time, count sessions where login_time <= that time AND logout_time >= that time.","Pick the timestamp with the highest count, breaking ties by earliest time."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Sessions; CREATE TABLE Sessions(user_id INT, login_time TIME, logout_time TIME);
   INSERT INTO Sessions VALUES (1,'10:00','11:00'),(2,'10:00','10:30'),(3,'10:15','10:45'),(4,'11:00','12:00');`,
   rows:[['10:15:00',3]]}
 ]},

{id:24,title:"Q24 · Train Platforms Required",difficulty:"Medium",topic:"Advanced Analytics",
 desc:"TrainSchedule(train_id INT, arrival_time TIME, departure_time TIME)\n\nA platform holds a train from arrival through departure (inclusive). Min platforms required.\nReturn: platforms_required",
 setup:`DROP TABLE IF EXISTS TrainSchedule;
 CREATE TABLE TrainSchedule(train_id INT, arrival_time TIME, departure_time TIME);
 INSERT INTO TrainSchedule VALUES
 (1,'08:00','08:15'),(2,'08:05','08:10'),(3,'08:05','08:20'),(4,'08:10','08:25'),(5,'08:10','08:20');`,
 tables:["trainschedule"],
 cols:["platforms_required"],
 rows:[[5]],
 note:"Endpoints INCLUSIVE: a train present through its departure minute conflicts with one arriving that minute.",
 solution:`SELECT MAX(concurrent) AS platforms_required FROM (
  SELECT SUM(delta) OVER (ORDER BY t, delta DESC) AS concurrent
  FROM (
    SELECT arrival_time AS t, 1 AS delta FROM TrainSchedule
    UNION ALL
    SELECT departure_time, -1 FROM TrainSchedule
  ) events
) s`,
 tips:"Sweep-line again. ORDER BY t, delta DESC ensures arrivals (+1) are counted before departures (-1) at the same timestamp, giving inclusive endpoint behavior.",
 hints:["Same sweep-line pattern as Q21, but with arrival/departure instead of start/end.","Be careful with ordering: arrivals (+1) should be counted BEFORE departures (-1) at the same time for inclusive endpoints.","ORDER BY t, delta DESC handles this correctly."],
 tests:[
  {setup:`DROP TABLE IF EXISTS TrainSchedule; CREATE TABLE TrainSchedule(train_id INT, arrival_time TIME, departure_time TIME);
   INSERT INTO TrainSchedule VALUES (1,'09:00','09:30'),(2,'09:15','09:45'),(3,'09:30','10:00');`,
   rows:[[3]]}
 ]},

{id:25,title:"Q25 · Longest Login Streak",difficulty:"Medium",topic:"Consecutive Sequences",
 desc:"UserLogins(user_id INT, login_date DATE)\n\nLongest run of consecutive calendar days per user. On ties, return the earliest streak.\nReturn: user_id, streak_start_date, streak_end_date, streak_length",
 setup:`DROP TABLE IF EXISTS UserLogins;
 CREATE TABLE UserLogins(user_id INT, login_date DATE);
 INSERT INTO UserLogins VALUES
 (1,'2025-01-01'),(1,'2025-01-02'),(1,'2025-01-03'),(1,'2025-01-05'),(1,'2025-01-06'),
 (2,'2025-01-01'),(2,'2025-01-03');`,
 tables:["userlogins"],
 cols:["user_id","streak_start_date","streak_end_date","streak_length"],
 rows:[[1,'2025-01-01','2025-01-03',3],[2,'2025-01-01','2025-01-01',1]],
 solution:`WITH groups AS (
  SELECT user_id, login_date,
    login_date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)::int AS grp
  FROM UserLogins
),
streaks AS (
  SELECT user_id, MIN(login_date) AS streak_start_date,
    MAX(login_date) AS streak_end_date,
    COUNT(*) AS streak_length
  FROM groups GROUP BY user_id, grp
)
SELECT DISTINCT ON (user_id) user_id, streak_start_date, streak_end_date, streak_length
FROM streaks ORDER BY user_id, streak_length DESC, streak_start_date`,
 tips:"date - ROW_NUMBER() produces the same value for consecutive dates. Group by that value to find streaks. DISTINCT ON picks the longest (ties broken by earliest start).",
 hints:["Consecutive dates have a special property: date minus row_number is constant.","Use login_date - ROW_NUMBER()::int to create a group identifier for each streak.","Group by that ID, aggregate MIN/MAX/COUNT, then pick the longest per user."],
 tests:[
  {setup:`DROP TABLE IF EXISTS UserLogins; CREATE TABLE UserLogins(user_id INT, login_date DATE);
   INSERT INTO UserLogins VALUES (3,'2025-03-01'),(3,'2025-03-02'),(3,'2025-03-03'),(3,'2025-03-04'),(3,'2025-03-06'),(3,'2025-03-07');`,
   rows:[[3,'2025-03-01','2025-03-04',4]]}
 ]},

{id:26,title:"Q26 · Product Availability Periods",difficulty:"Medium",topic:"Consecutive Sequences",
 desc:"ProductAvailability(product_id VARCHAR, available_date DATE)\n\nAll continuous availability periods per product.\nReturn: product_id, start_date, end_date, days_available  (row order doesn't matter)",
 setup:`DROP TABLE IF EXISTS ProductAvailability;
 CREATE TABLE ProductAvailability(product_id VARCHAR, available_date DATE);
 INSERT INTO ProductAvailability VALUES
 ('A','2025-01-01'),('A','2025-01-02'),('A','2025-01-03'),('A','2025-01-06'),('A','2025-01-07');`,
 tables:["productavailability"],
 cols:["product_id","start_date","end_date","days_available"],
 rows:[['A','2025-01-01','2025-01-03',3],['A','2025-01-06','2025-01-07',2]],
 solution:`WITH groups AS (
  SELECT product_id, available_date,
    available_date - ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY available_date)::int AS grp
  FROM ProductAvailability
)
SELECT product_id, MIN(available_date) AS start_date,
  MAX(available_date) AS end_date, COUNT(*) AS days_available
FROM groups GROUP BY product_id, grp
ORDER BY start_date`,
 tips:"Classic islands-and-gaps: date minus row_number groups consecutive dates together. Then aggregate each group to get the period boundaries and length.",
 hints:["This is the classic 'islands and gaps' problem.","date - ROW_NUMBER()::int groups consecutive dates into the same bucket.","Aggregate each group: MIN for start, MAX for end, COUNT for length."],
 tests:[
  {setup:`DROP TABLE IF EXISTS ProductAvailability; CREATE TABLE ProductAvailability(product_id VARCHAR, available_date DATE);
   INSERT INTO ProductAvailability VALUES ('B','2025-02-01'),('B','2025-02-02'),('B','2025-02-05'),('B','2025-02-06'),('B','2025-02-07');`,
   rows:[['B','2025-02-01','2025-02-02',2],['B','2025-02-05','2025-02-07',3]]}
 ]},

{id:27,title:"Q27 · Machine Downtime Analysis",difficulty:"Hard",topic:"Window Functions",
 desc:"MachineEvents(machine_id VARCHAR, event_time TIME, event_type VARCHAR)\n\nA downtime period starts at DOWN and ends at the next UP.\nReturn: machine_id, downtime_start, downtime_end, downtime_minutes",
 setup:`DROP TABLE IF EXISTS MachineEvents;
 CREATE TABLE MachineEvents(machine_id VARCHAR, event_time TIME, event_type VARCHAR);
 INSERT INTO MachineEvents VALUES
 ('M1','09:00','DOWN'),('M1','09:30','UP'),('M1','11:00','DOWN'),('M1','12:00','UP');`,
 tables:["machineevents"],
 cols:["machine_id","downtime_start","downtime_end","downtime_minutes"],
 rows:[['M1','09:00:00','09:30:00',30],['M1','11:00:00','12:00:00',60]],
 solution:`SELECT machine_id, event_time AS downtime_start,
  LEAD(event_time) OVER (PARTITION BY machine_id ORDER BY event_time) AS downtime_end,
  EXTRACT(EPOCH FROM LEAD(event_time) OVER (PARTITION BY machine_id ORDER BY event_time) - event_time) / 60 AS downtime_minutes
FROM MachineEvents
WHERE event_type = 'DOWN'`,
 tips:"Filter DOWN events, use LEAD() to grab the next event time (which is the UP). EXTRACT(EPOCH FROM interval)/60 converts to minutes. Clean single-pass solution.",
 hints:["Each DOWN event pairs with the next UP event for the same machine.","Filter only DOWN rows and use LEAD() to get the next event_time.","EXTRACT(EPOCH FROM interval)/60 converts a time difference to minutes."],
 tests:[
  {setup:`DROP TABLE IF EXISTS MachineEvents; CREATE TABLE MachineEvents(machine_id VARCHAR, event_time TIME, event_type VARCHAR);
   INSERT INTO MachineEvents VALUES ('M2','08:00','DOWN'),('M2','08:45','UP'),('M2','10:00','DOWN'),('M2','10:15','UP'),('M2','14:00','DOWN'),('M2','15:00','UP');`,
   rows:[['M2','08:00:00','08:45:00',45],['M2','10:00:00','10:15:00',15],['M2','14:00:00','15:00:00',60]]}
 ]},

{id:28,title:"Q28 · Longest Customer Purchase Streak",difficulty:"Easy",topic:"Consecutive Sequences",
 desc:"Purchases(customer_id INT, purchase_date DATE)\n\nLongest run of consecutive purchase days per customer.\nReturn: customer_id, streak_length",
 setup:`DROP TABLE IF EXISTS Purchases;
 CREATE TABLE Purchases(customer_id INT, purchase_date DATE);
 INSERT INTO Purchases VALUES
 (1,'2025-01-01'),(1,'2025-01-02'),(1,'2025-01-03'),(1,'2025-01-07'),(1,'2025-01-08');`,
 tables:["purchases"],
 cols:["customer_id","streak_length"],
 rows:[[1,3]],
 solution:`WITH groups AS (
  SELECT customer_id, purchase_date,
    purchase_date - ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY purchase_date)::int AS grp
  FROM Purchases
)
SELECT customer_id, MAX(cnt) AS streak_length
FROM (
  SELECT customer_id, grp, COUNT(*) AS cnt
  FROM groups GROUP BY customer_id, grp
) t GROUP BY customer_id`,
 tips:"Same islands-and-gaps pattern. Group consecutive purchase dates, count each group, take the MAX count per customer.",
 hints:["Same islands-and-gaps pattern as Q25/Q26.","Group consecutive purchase dates, count each group.","Take the MAX count per customer for the longest streak."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Purchases; CREATE TABLE Purchases(customer_id INT, purchase_date DATE);
   INSERT INTO Purchases VALUES (2,'2025-02-01'),(2,'2025-02-02'),(2,'2025-02-03'),(2,'2025-02-04'),(2,'2025-02-10'),(2,'2025-02-11');`,
   rows:[[2,4]]}
 ]},

{id:29,title:"Q29 · User Sessionization",difficulty:"Medium",topic:"Consecutive Sequences",
 desc:"UserEvents(user_id INT, event_time TIME)\n\nA new session starts when the gap between consecutive events exceeds 30 minutes. Number sessions from 1 per user.\nReturn: user_id, event_time, session_id",
 setup:`DROP TABLE IF EXISTS UserEvents;
 CREATE TABLE UserEvents(user_id INT, event_time TIME);
 INSERT INTO UserEvents VALUES (1,'09:00'),(1,'09:10'),(1,'09:20'),(1,'10:15'),(1,'10:25');`,
 tables:["userevents"],
 cols:["user_id","event_time","session_id"],
 rows:[[1,'09:00:00',1],[1,'09:10:00',1],[1,'09:20:00',1],[1,'10:15:00',2],[1,'10:25:00',2]],
 solution:`WITH gaps AS (
  SELECT *, CASE WHEN event_time - LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) > INTERVAL '30 minutes'
    OR LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) IS NULL THEN 1 ELSE 0 END AS new_session
  FROM UserEvents
)
SELECT user_id, event_time,
  SUM(new_session) OVER (PARTITION BY user_id ORDER BY event_time) AS session_id
FROM gaps`,
 tips:"Flag rows where the gap > 30 min (or first event) as new_session=1, then running SUM of the flag gives session IDs. This is the standard sessionization pattern — two window passes, no self-joins.",
 hints:["Use LAG() to get the previous event_time per user.","Flag a row as a new session if the gap > 30 minutes or it's the first event (LAG is NULL).","A running SUM of those flags gives incrementing session IDs."],
 tests:[
  {setup:`DROP TABLE IF EXISTS UserEvents; CREATE TABLE UserEvents(user_id INT, event_time TIME);
   INSERT INTO UserEvents VALUES (2,'08:00'),(2,'08:20'),(2,'08:40'),(2,'09:30'),(2,'09:40'),(2,'10:30');`,
   rows:[[2,'08:00:00',1],[2,'08:20:00',1],[2,'08:40:00',1],[2,'09:30:00',2],[2,'09:40:00',2],[2,'10:30:00',3]]}
 ]},

{id:30,title:"Q30 · Same-Session Funnel Completion",difficulty:"Hard",topic:"Advanced Analytics",
 desc:"UserEvents(user_id INT, event_time TIME, event VARCHAR)\n\nFind users who did visit → product_view → add_to_cart → purchase in order, all within one session (session breaks after 30 min of inactivity).\nReturn: user_id",
 setup:`DROP TABLE IF EXISTS UserEvents;
 CREATE TABLE UserEvents(user_id INT, event_time TIME, event VARCHAR);
 INSERT INTO UserEvents VALUES
 (1,'09:00','visit'),(1,'09:05','product_view'),(1,'09:10','add_to_cart'),(1,'09:20','purchase'),
 (2,'09:00','visit'),(2,'10:00','purchase');`,
 tables:["userevents"],
 cols:["user_id"],
 rows:[[1]],
 solution:`WITH sessioned AS (
  SELECT *, SUM(CASE WHEN event_time - LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) > INTERVAL '30 minutes'
    OR LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) IS NULL THEN 1 ELSE 0 END)
    OVER (PARTITION BY user_id ORDER BY event_time) AS sid
  FROM UserEvents
)
SELECT DISTINCT user_id FROM sessioned s1
WHERE event = 'purchase'
  AND EXISTS (SELECT 1 FROM sessioned s2 WHERE s2.user_id = s1.user_id AND s2.sid = s1.sid AND s2.event = 'add_to_cart' AND s2.event_time < s1.event_time)
  AND EXISTS (SELECT 1 FROM sessioned s3 WHERE s3.user_id = s1.user_id AND s3.sid = s1.sid AND s3.event = 'product_view' AND s3.event_time < (SELECT MIN(event_time) FROM sessioned s4 WHERE s4.user_id=s1.user_id AND s4.sid=s1.sid AND s4.event='add_to_cart'))
  AND EXISTS (SELECT 1 FROM sessioned s5 WHERE s5.user_id = s1.user_id AND s5.sid = s1.sid AND s5.event = 'visit' AND s5.event_time < (SELECT MIN(event_time) FROM sessioned s6 WHERE s6.user_id=s1.user_id AND s6.sid=s1.sid AND s6.event='product_view'))`,
 tips:"First sessionize (Q29 pattern), then verify the funnel order within each session using EXISTS with time ordering. For simpler code, you can also self-join the CTE 4 times on sid with chained time comparisons.",
 hints:["First, sessionize the events using the Q29 pattern (30-min gap).","Then check that within the same session, all 4 funnel events occur in order.","Use EXISTS or self-joins to verify visit < product_view < add_to_cart < purchase within the same session."],
 tests:[
  {setup:`DROP TABLE IF EXISTS UserEvents; CREATE TABLE UserEvents(user_id INT, event_time TIME, event VARCHAR);
   INSERT INTO UserEvents VALUES
   (3,'08:00','visit'),(3,'08:05','product_view'),(3,'08:10','add_to_cart'),(3,'08:15','purchase'),
   (4,'08:00','visit'),(4,'08:05','add_to_cart'),(4,'08:10','product_view'),(4,'08:15','purchase');`,
   rows:[[3]]}
 ]},
{id:31,title:"Q31 · Month-1 Retention Analysis",difficulty:"Hard",topic:"Advanced Analytics",
 desc:"Signups(user_id INT, signup_date DATE)\nActivity(user_id INT, activity_date DATE)\n\nPer signup month: total signed up, users active in the NEXT calendar month, and retention %.\nReturn: signup_month (YYYY-MM), users_signed_up, retained_users, retention_pct",
 setup:`DROP TABLE IF EXISTS Signups; DROP TABLE IF EXISTS Activity;
 CREATE TABLE Signups(user_id INT, signup_date DATE);
 CREATE TABLE Activity(user_id INT, activity_date DATE);
 INSERT INTO Signups VALUES (1,'2025-01-10'),(2,'2025-01-15'),(3,'2025-02-01');
 INSERT INTO Activity VALUES (1,'2025-02-05'),(2,'2025-03-01'),(3,'2025-03-10');`,
 tables:["signups","activity"],
 cols:["signup_month","users_signed_up","retained_users","retention_pct"],
 rows:[['2025-01',2,1,50.00],['2025-02',1,1,100.00]],
 solution:`SELECT TO_CHAR(s.signup_date, 'YYYY-MM') AS signup_month,
  COUNT(DISTINCT s.user_id) AS users_signed_up,
  COUNT(DISTINCT a.user_id) AS retained_users,
  ROUND(100.0 * COUNT(DISTINCT a.user_id) / COUNT(DISTINCT s.user_id), 2) AS retention_pct
FROM Signups s
LEFT JOIN Activity a ON s.user_id = a.user_id
  AND TO_CHAR(a.activity_date, 'YYYY-MM') = TO_CHAR(s.signup_date + INTERVAL '1 month', 'YYYY-MM')
GROUP BY TO_CHAR(s.signup_date, 'YYYY-MM')`,
 tips:"LEFT JOIN preserves users with 0 retention. The key is matching activity to the NEXT calendar month after signup. COUNT(DISTINCT) handles multiple activities per user. Use 100.0 (not 100) to force decimal division.",
 hints:["Group signups by month, then check who was active in the NEXT calendar month.","LEFT JOIN Activity where activity_date falls in the month after signup_date.","Use COUNT(DISTINCT) for both total and retained users, then compute the percentage."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Signups; DROP TABLE IF EXISTS Activity;
   CREATE TABLE Signups(user_id INT, signup_date DATE);
   CREATE TABLE Activity(user_id INT, activity_date DATE);
   INSERT INTO Signups VALUES (10,'2025-03-01'),(11,'2025-03-15'),(12,'2025-03-20');
   INSERT INTO Activity VALUES (10,'2025-04-05'),(11,'2025-04-10'),(12,'2025-05-01');`,
   rows:[['2025-03',3,2,66.67]]}
 ]},

{id:32,title:"Q32 · Longest Revenue Growth Streak",difficulty:"Medium",topic:"Consecutive Sequences",
 desc:"CompanyRevenue(company_id VARCHAR, revenue_month DATE, revenue INT)\n\nLongest run of consecutive months where revenue > previous month, per company. Output months as YYYY-MM.\nReturn: company_id, streak_start_month, streak_end_month, streak_length",
 setup:`DROP TABLE IF EXISTS CompanyRevenue;
 CREATE TABLE CompanyRevenue(company_id VARCHAR, revenue_month DATE, revenue INT);
 INSERT INTO CompanyRevenue VALUES
 ('A','2025-01-01',100),('A','2025-02-01',120),('A','2025-03-01',140),
 ('A','2025-04-01',130),('A','2025-05-01',150),('A','2025-06-01',170);`,
 tables:["companyrevenue"],
 cols:["company_id","streak_start_month","streak_end_month","streak_length"],
 rows:[['A','2025-01','2025-03',3]],
 solution:`WITH growth AS (
  SELECT *, LAG(revenue) OVER (PARTITION BY company_id ORDER BY revenue_month) AS prev_rev,
    ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY revenue_month) AS rn
  FROM CompanyRevenue
),
growing AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY revenue_month) AS grn
  FROM growth WHERE revenue > prev_rev
),
streaks AS (
  SELECT company_id, rn - grn AS grp,
    MIN(revenue_month) AS streak_start, MAX(revenue_month) AS streak_end,
    COUNT(*) AS streak_length
  FROM growing GROUP BY company_id, rn - grn
)
SELECT DISTINCT ON (company_id) company_id,
  TO_CHAR(streak_start, 'YYYY-MM') AS streak_start_month,
  TO_CHAR(streak_end, 'YYYY-MM') AS streak_end_month,
  streak_length
FROM streaks ORDER BY company_id, streak_length DESC`,
 tips:"Consecutive-growth pattern: LAG to find growth rows, row_number gap trick to group consecutive ones, then aggregate. DISTINCT ON picks the longest streak per company.",
 hints:["Use LAG() to compare each month's revenue to the previous month.","Filter for growth rows, then apply the consecutive-grouping trick.","Aggregate each streak group and pick the longest per company."],
 tests:[
  {setup:`DROP TABLE IF EXISTS CompanyRevenue; CREATE TABLE CompanyRevenue(company_id VARCHAR, revenue_month DATE, revenue INT);
   INSERT INTO CompanyRevenue VALUES
   ('B','2025-01-01',50),('B','2025-02-01',60),('B','2025-03-01',55),('B','2025-04-01',70),('B','2025-05-01',80);`,
   rows:[['B','2025-04','2025-05',2]]}
 ]},

{id:33,title:"Q33 · Credit Health Funnel Conversion",difficulty:"Medium",topic:"Advanced Analytics",
 desc:"Events(user_id INT, event_name VARCHAR, event_time TIMESTAMP)\n\nevent_name is one of: signup, credit_check, report_view, loan_apply.\n\nCalculate the number of unique users who reached each funnel stage and the conversion rate relative to signup users.\nReturn: stage, users, conversion_rate",
 setup:`DROP TABLE IF EXISTS Events;
 CREATE TABLE Events(user_id INT, event_name VARCHAR, event_time TIMESTAMP);
 INSERT INTO Events VALUES
 (1,'signup','2026-05-01 10:00'),(1,'credit_check','2026-05-01 10:05'),(1,'report_view','2026-05-01 10:10'),(1,'loan_apply','2026-05-01 10:20'),
 (2,'signup','2026-05-01 11:00'),(2,'credit_check','2026-05-01 11:05'),(2,'report_view','2026-05-01 11:10'),
 (3,'signup','2026-05-01 12:00'),(3,'credit_check','2026-05-01 12:05');`,
 tables:["events"],
 cols:["stage","users","conversion_rate"],
 rows:[['signup',3,100.00],['credit_check',3,100.00],['report_view',2,66.67],['loan_apply',1,33.33]],
 solution:`WITH signups AS (
  SELECT COUNT(DISTINCT user_id) AS total FROM Events WHERE event_name = 'signup'
),
stages AS (
  SELECT unnest(ARRAY['signup','credit_check','report_view','loan_apply']) AS stage
),
counts AS (
  SELECT e.event_name AS stage, COUNT(DISTINCT e.user_id) AS users
  FROM Events e
  GROUP BY e.event_name
)
SELECT s.stage, c.users,
  ROUND(100.0 * c.users / t.total, 2) AS conversion_rate
FROM stages s
JOIN counts c ON s.stage = c.stage
CROSS JOIN signups t
ORDER BY CASE s.stage WHEN 'signup' THEN 1 WHEN 'credit_check' THEN 2 WHEN 'report_view' THEN 3 WHEN 'loan_apply' THEN 4 END`,
 tips:"Use COUNT(DISTINCT user_id) per event type, then divide by the signup count. The CASE in ORDER BY enforces funnel order. Avoid hardcoding counts — always derive from data.",
 hints:["Count distinct users per event_name to get users at each funnel stage.","The denominator for conversion_rate is always the signup count.","Use a CASE expression in ORDER BY to enforce funnel ordering (signup first, loan_apply last)."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Events; CREATE TABLE Events(user_id INT, event_name VARCHAR, event_time TIMESTAMP);
   INSERT INTO Events VALUES
   (10,'signup','2026-06-01 09:00'),(10,'credit_check','2026-06-01 09:05'),(10,'report_view','2026-06-01 09:10'),(10,'loan_apply','2026-06-01 09:15'),
   (11,'signup','2026-06-01 10:00'),(11,'credit_check','2026-06-01 10:05'),(11,'report_view','2026-06-01 10:10'),(11,'loan_apply','2026-06-01 10:15'),
   (12,'signup','2026-06-01 11:00'),(12,'credit_check','2026-06-01 11:05'),
   (13,'signup','2026-06-01 12:00');`,
   rows:[['signup',4,100.00],['credit_check',3,75.00],['report_view',2,50.00],['loan_apply',2,50.00]]}
 ]},

{id:34,title:"Q34 · Day-7 Retention",difficulty:"Easy",topic:"Advanced Analytics",
 desc:"Users(user_id INT, signup_date DATE)\nSessions(user_id INT, session_date DATE)\n\nA user is retained on Day 7 if they open the app exactly 7 days after signup.\n\nCalculate the Day-7 retention rate for each signup cohort.\nReturn: signup_date, retained_users, total_users, retention_rate",
 setup:`DROP TABLE IF EXISTS Users; DROP TABLE IF EXISTS Sessions;
 CREATE TABLE Users(user_id INT, signup_date DATE);
 CREATE TABLE Sessions(user_id INT, session_date DATE);
 INSERT INTO Users VALUES (1,'2026-05-01'),(2,'2026-05-01'),(3,'2026-05-01');
 INSERT INTO Sessions VALUES (1,'2026-05-08'),(2,'2026-05-08'),(1,'2026-05-09');`,
 tables:["users","sessions"],
 cols:["signup_date","retained_users","total_users","retention_rate"],
 rows:[['2026-05-01',2,3,66.67]],
 solution:`SELECT u.signup_date,
  COUNT(DISTINCT s.user_id) AS retained_users,
  COUNT(DISTINCT u.user_id) AS total_users,
  ROUND(100.0 * COUNT(DISTINCT s.user_id) / COUNT(DISTINCT u.user_id), 2) AS retention_rate
FROM Users u
LEFT JOIN Sessions s ON u.user_id = s.user_id AND s.session_date = u.signup_date + 7
GROUP BY u.signup_date`,
 tips:"LEFT JOIN Sessions on exact day-7 match (signup_date + 7). COUNT(DISTINCT s.user_id) counts only retained users (NULLs from LEFT JOIN are excluded by COUNT). Group by signup_date for cohort analysis.",
 hints:["Day-7 means session_date = signup_date + 7 exactly.","Use LEFT JOIN to preserve users who didn't return — they still count in total.","COUNT(DISTINCT s.user_id) ignores NULLs, giving you only retained users."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Users; DROP TABLE IF EXISTS Sessions;
   CREATE TABLE Users(user_id INT, signup_date DATE);
   CREATE TABLE Sessions(user_id INT, session_date DATE);
   INSERT INTO Users VALUES (10,'2026-06-01'),(11,'2026-06-01'),(12,'2026-06-02'),(13,'2026-06-02');
   INSERT INTO Sessions VALUES (10,'2026-06-08'),(12,'2026-06-09'),(13,'2026-06-09');`,
   rows:[['2026-06-01',1,2,50.00],['2026-06-02',2,2,100.00]]}
 ]},

{id:35,title:"Q35 · Credit Score Improvement Detection",difficulty:"Easy",topic:"Window Functions",
 desc:"CreditHistory(user_id INT, score_date DATE, credit_score INT)\n\nFind users whose credit score improved by at least 50 points compared to their immediately previous score.\nReturn: user_id, previous_score, current_score, improvement",
 setup:`DROP TABLE IF EXISTS CreditHistory;
 CREATE TABLE CreditHistory(user_id INT, score_date DATE, credit_score INT);
 INSERT INTO CreditHistory VALUES
 (1,'2026-01-01',650),(1,'2026-02-01',680),(1,'2026-03-01',730),
 (2,'2026-01-01',700),(2,'2026-02-01',710);`,
 tables:["credithistory"],
 cols:["user_id","previous_score","current_score","improvement"],
 rows:[[1,680,730,50]],
 solution:`SELECT user_id, prev AS previous_score, credit_score AS current_score,
  credit_score - prev AS improvement
FROM (
  SELECT *, LAG(credit_score) OVER (PARTITION BY user_id ORDER BY score_date) AS prev
  FROM CreditHistory
) t WHERE credit_score - prev >= 50`,
 tips:"LAG() gives the previous score in one pass. Filter in the outer query where the difference >= 50. Avoid self-joins — window functions are cleaner and faster here.",
 hints:["You need the immediately previous credit score for each user.","Use LAG(credit_score) OVER (PARTITION BY user_id ORDER BY score_date).","Filter in an outer query WHERE current_score - previous_score >= 50."],
 tests:[
  {setup:`DROP TABLE IF EXISTS CreditHistory; CREATE TABLE CreditHistory(user_id INT, score_date DATE, credit_score INT);
   INSERT INTO CreditHistory VALUES
   (5,'2026-01-01',600),(5,'2026-02-01',620),(5,'2026-03-01',680),
   (6,'2026-01-01',500),(6,'2026-02-01',560),(6,'2026-03-01',550);`,
   rows:[[5,620,680,60],[6,500,560,60]]}
 ]},

{id:36,title:"Q36 · Best Acquisition Channel",difficulty:"Medium",topic:"Aggregations & JOINs",
 desc:"Users(user_id INT, acquisition_channel VARCHAR)\nRevenue(user_id INT, revenue INT)\n\nCalculate revenue per acquired user for every acquisition channel.\nReturn: acquisition_channel, users, total_revenue, revenue_per_user (ordered by revenue_per_user DESC)",
 setup:`DROP TABLE IF EXISTS Users; DROP TABLE IF EXISTS Revenue;
 CREATE TABLE Users(user_id INT, acquisition_channel VARCHAR);
 CREATE TABLE Revenue(user_id INT, revenue INT);
 INSERT INTO Users VALUES (1,'Google'),(2,'Google'),(3,'Facebook');
 INSERT INTO Revenue VALUES (1,500),(2,700),(3,400);`,
 tables:["users","revenue"],
 cols:["acquisition_channel","users","total_revenue","revenue_per_user"],
 rows:[['Google',2,1200,600],['Facebook',1,400,400]],
 solution:`SELECT u.acquisition_channel,
  COUNT(DISTINCT u.user_id) AS users,
  SUM(r.revenue) AS total_revenue,
  ROUND(SUM(r.revenue)::numeric / COUNT(DISTINCT u.user_id), 2) AS revenue_per_user
FROM Users u
JOIN Revenue r ON u.user_id = r.user_id
GROUP BY u.acquisition_channel
ORDER BY revenue_per_user DESC`,
 tips:"JOIN Users with Revenue, GROUP BY channel. Use COUNT(DISTINCT user_id) in case a user has multiple revenue rows. SUM/COUNT gives per-user revenue. ORDER BY DESC to rank channels.",
 hints:["JOIN Users and Revenue on user_id, then GROUP BY acquisition_channel.","COUNT(DISTINCT user_id) for users, SUM(revenue) for total.","Divide total_revenue by users for revenue_per_user, ORDER BY DESC."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Users; DROP TABLE IF EXISTS Revenue;
   CREATE TABLE Users(user_id INT, acquisition_channel VARCHAR);
   CREATE TABLE Revenue(user_id INT, revenue INT);
   INSERT INTO Users VALUES (10,'Email'),(11,'Email'),(12,'Email'),(13,'SEO'),(14,'SEO');
   INSERT INTO Revenue VALUES (10,100),(11,200),(12,300),(13,800),(14,200);`,
   rows:[['SEO',2,1000,500],['Email',3,600,200]]}
 ]},

{id:37,title:"Q37 · Longest Login Streak (v2)",difficulty:"Easy",topic:"Consecutive Sequences",
 desc:"Logins(user_id INT, login_date DATE)\n\nA login streak is consecutive calendar days a user logged in.\n\nFind the longest login streak for each user.\nReturn: user_id, longest_streak",
 setup:`DROP TABLE IF EXISTS Logins;
 CREATE TABLE Logins(user_id INT, login_date DATE);
 INSERT INTO Logins VALUES
 (1,'2026-01-01'),(1,'2026-01-02'),(1,'2026-01-03'),(1,'2026-01-05'),(1,'2026-01-06'),
 (2,'2026-01-01'),(2,'2026-01-03');`,
 tables:["logins"],
 cols:["user_id","longest_streak"],
 rows:[[1,3],[2,1]],
 solution:`WITH groups AS (
  SELECT user_id, login_date,
    login_date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)::int AS grp
  FROM Logins
)
SELECT user_id, MAX(cnt) AS longest_streak
FROM (
  SELECT user_id, grp, COUNT(*) AS cnt
  FROM groups GROUP BY user_id, grp
) t GROUP BY user_id`,
 tips:"Classic islands-and-gaps: date minus row_number groups consecutive dates. Count each group, take MAX per user. Single-pass with window functions — no self-joins needed.",
 hints:["Consecutive dates have a key property: date minus row_number is constant within a streak.","Use login_date - ROW_NUMBER()::int to assign a group ID to each streak.","Count each group, then take MAX(count) per user for the longest streak."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Logins; CREATE TABLE Logins(user_id INT, login_date DATE);
   INSERT INTO Logins VALUES
   (5,'2026-02-01'),(5,'2026-02-02'),(5,'2026-02-03'),(5,'2026-02-04'),(5,'2026-02-05'),
   (5,'2026-02-10'),(5,'2026-02-11'),
   (6,'2026-02-01'),(6,'2026-02-03'),(6,'2026-02-05');`,
   rows:[[5,5],[6,1]]}
 ]},
/* ===== NEW QUESTIONS Q38-Q47 ===== */
{id:38,title:"Q38 · Employee Count Per Department",difficulty:"Easy",topic:"Aggregations & JOINs",
 desc:"Employees(emp_id INT, name VARCHAR, dept_id INT)\nDepartments(dept_id INT, dept_name VARCHAR)\n\nCount employees in each department.\nReturn: dept_name, employee_count",
 setup:`DROP TABLE IF EXISTS Departments; DROP TABLE IF EXISTS Employees;
 CREATE TABLE Departments(dept_id INT, dept_name VARCHAR);
 CREATE TABLE Employees(emp_id INT, name VARCHAR, dept_id INT);
 INSERT INTO Departments VALUES (1,'Engineering'),(2,'Marketing'),(3,'Sales');
 INSERT INTO Employees VALUES (1,'Alice',1),(2,'Bob',1),(3,'Carol',1),(4,'Dave',2),(5,'Eve',3),(6,'Frank',3);`,
 tables:["departments","employees"],
 cols:["dept_name","employee_count"],
 rows:[['Engineering',3],['Marketing',1],['Sales',2]],
 solution:`SELECT d.dept_name, COUNT(e.emp_id) AS employee_count
FROM Departments d
JOIN Employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name
ORDER BY d.dept_name`,
 tips:"Simple GROUP BY with COUNT. JOIN ensures you get department names. ORDER BY for consistent output. Use COUNT(e.emp_id) rather than COUNT(*) to be explicit about what you're counting.",
 hints:["JOIN Departments and Employees on dept_id.","GROUP BY dept_name and COUNT employees.","ORDER BY dept_name for consistent output."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Departments; DROP TABLE IF EXISTS Employees;
   CREATE TABLE Departments(dept_id INT, dept_name VARCHAR);
   CREATE TABLE Employees(emp_id INT, name VARCHAR, dept_id INT);
   INSERT INTO Departments VALUES (1,'Finance'),(2,'HR'),(3,'IT');
   INSERT INTO Employees VALUES (1,'A',1),(2,'B',1),(3,'C',2),(4,'D',3),(5,'E',3),(6,'F',3);`,
   rows:[['Finance',2],['HR',1],['IT',3]]}
 ]},

{id:39,title:"Q39 · Average Salary Per Department",difficulty:"Easy",topic:"Aggregations & JOINs",
 desc:"Employees(emp_id INT, name VARCHAR, dept_id INT, salary INT)\nDepartments(dept_id INT, dept_name VARCHAR)\n\nAverage salary per department, rounded to 2 decimal places.\nReturn: dept_name, avg_salary",
 setup:`DROP TABLE IF EXISTS Departments; DROP TABLE IF EXISTS Employees;
 CREATE TABLE Departments(dept_id INT, dept_name VARCHAR);
 CREATE TABLE Employees(emp_id INT, name VARCHAR, dept_id INT, salary INT);
 INSERT INTO Departments VALUES (1,'Engineering'),(2,'Marketing');
 INSERT INTO Employees VALUES (1,'Alice',1,90000),(2,'Bob',1,80000),(3,'Carol',1,100000),(4,'Dave',2,60000),(5,'Eve',2,70000);`,
 tables:["departments","employees"],
 cols:["dept_name","avg_salary"],
 rows:[['Engineering',90000.00],['Marketing',65000.00]],
 solution:`SELECT d.dept_name, ROUND(AVG(e.salary), 2) AS avg_salary
FROM Departments d
JOIN Employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name
ORDER BY d.dept_name`,
 tips:"AVG() with ROUND() is the standard pattern. Join to get the department name. GROUP BY dept_name aggregates all employees in the department.",
 hints:["JOIN Departments and Employees on dept_id.","Use AVG(salary) and ROUND(..., 2).","GROUP BY dept_name."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Departments; DROP TABLE IF EXISTS Employees;
   CREATE TABLE Departments(dept_id INT, dept_name VARCHAR);
   CREATE TABLE Employees(emp_id INT, name VARCHAR, dept_id INT, salary INT);
   INSERT INTO Departments VALUES (1,'Finance'),(2,'Sales');
   INSERT INTO Employees VALUES (1,'A',1,50000),(2,'B',1,70000),(3,'C',2,40000),(4,'D',2,60000),(5,'E',2,50000);`,
   rows:[['Finance',60000.00],['Sales',50000.00]]}
 ]},

{id:40,title:"Q40 · Customers With More Than 2 Orders",difficulty:"Easy",topic:"Aggregations & JOINs",
 desc:"Orders(order_id INT, customer_id INT, order_date DATE)\n\nFind customers who placed more than 2 orders.\nReturn: customer_id, order_count",
 setup:`DROP TABLE IF EXISTS Orders;
 CREATE TABLE Orders(order_id INT, customer_id INT, order_date DATE);
 INSERT INTO Orders VALUES
 (1,1,'2025-01-01'),(2,1,'2025-01-05'),(3,1,'2025-01-10'),
 (4,2,'2025-01-02'),(5,2,'2025-01-08'),
 (6,3,'2025-01-03');`,
 tables:["orders"],
 cols:["customer_id","order_count"],
 rows:[[1,3]],
 solution:`SELECT customer_id, COUNT(*) AS order_count
FROM Orders
GROUP BY customer_id
HAVING COUNT(*) > 2`,
 tips:"GROUP BY + HAVING is the right tool here. HAVING filters on aggregate results, while WHERE filters before aggregation. Always prefer HAVING COUNT(*) > N over a subquery for simple threshold filters.",
 hints:["GROUP BY customer_id and COUNT orders per customer.","Use HAVING to filter groups — HAVING COUNT(*) > 2.","HAVING filters after aggregation, unlike WHERE which filters before."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Orders; CREATE TABLE Orders(order_id INT, customer_id INT, order_date DATE);
   INSERT INTO Orders VALUES (1,10,'2025-02-01'),(2,10,'2025-02-05'),(3,10,'2025-02-10'),(4,10,'2025-02-15'),(5,20,'2025-02-01'),(6,20,'2025-02-02'),(7,30,'2025-02-01');`,
   rows:[[10,4]]}
 ]},

{id:41,title:"Q41 · Employees With No Orders",difficulty:"Easy",topic:"Aggregations & JOINs",
 desc:"Employees(emp_id INT, name VARCHAR)\nOrders(order_id INT, emp_id INT, order_date DATE)\n\nFind employees who have not placed any orders.\nReturn: emp_id, name",
 setup:`DROP TABLE IF EXISTS Employees; DROP TABLE IF EXISTS Orders;
 CREATE TABLE Employees(emp_id INT, name VARCHAR);
 CREATE TABLE Orders(order_id INT, emp_id INT, order_date DATE);
 INSERT INTO Employees VALUES (1,'Alice'),(2,'Bob'),(3,'Carol'),(4,'Dave');
 INSERT INTO Orders VALUES (1,1,'2025-01-01'),(2,1,'2025-01-05'),(3,3,'2025-01-10');`,
 tables:["employees","orders"],
 cols:["emp_id","name"],
 rows:[[2,'Bob'],[4,'Dave']],
 solution:`SELECT e.emp_id, e.name
FROM Employees e
LEFT JOIN Orders o ON e.emp_id = o.emp_id
WHERE o.order_id IS NULL
ORDER BY e.emp_id`,
 tips:"LEFT JOIN + IS NULL is the classic anti-join pattern. It's typically faster than NOT IN (which fails on NULLs) and equivalent to NOT EXISTS. The IS NULL check on a non-nullable column from the right table identifies unmatched rows.",
 hints:["You need employees with NO matching rows in Orders.","LEFT JOIN Orders, then filter WHERE the joined column IS NULL.","This is the anti-join pattern: LEFT JOIN + WHERE right_table.key IS NULL."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Employees; DROP TABLE IF EXISTS Orders;
   CREATE TABLE Employees(emp_id INT, name VARCHAR);
   CREATE TABLE Orders(order_id INT, emp_id INT, order_date DATE);
   INSERT INTO Employees VALUES (1,'X'),(2,'Y'),(3,'Z'),(4,'W'),(5,'V');
   INSERT INTO Orders VALUES (1,1,'2025-01-01'),(2,2,'2025-01-02'),(3,2,'2025-01-03');`,
   rows:[[3,'Z'],[4,'W'],[5,'V']]}
 ]},

{id:42,title:"Q42 · Departments Above Company Avg Salary",difficulty:"Medium",topic:"Aggregations & JOINs",
 desc:"Employees(emp_id INT, dept_id INT, salary INT)\n\nFind departments whose average salary exceeds the company-wide average salary.\nReturn: dept_id, dept_avg_salary",
 setup:`DROP TABLE IF EXISTS Employees;
 CREATE TABLE Employees(emp_id INT, dept_id INT, salary INT);
 INSERT INTO Employees VALUES (1,1,90000),(2,1,80000),(3,2,50000),(4,2,60000),(5,3,120000),(6,3,110000);`,
 tables:["employees"],
 cols:["dept_id","dept_avg_salary"],
 rows:[[1,85000.00],[3,115000.00]],
 solution:`SELECT dept_id, ROUND(AVG(salary), 2) AS dept_avg_salary
FROM Employees
GROUP BY dept_id
HAVING AVG(salary) > (SELECT AVG(salary) FROM Employees)
ORDER BY dept_id`,
 tips:"A scalar subquery in HAVING is clean for this pattern. Alternatively, use a CTE or window function AVG() OVER () to compute the company average once. The scalar subquery is evaluated once and reused.",
 hints:["GROUP BY dept_id and compute AVG(salary) per department.","Use HAVING to compare the department average to the overall average.","The overall average can be computed as a scalar subquery: (SELECT AVG(salary) FROM Employees)."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Employees; CREATE TABLE Employees(emp_id INT, dept_id INT, salary INT);
   INSERT INTO Employees VALUES (1,1,30000),(2,1,40000),(3,2,80000),(4,2,90000),(5,3,50000),(6,3,60000);`,
   rows:[[2,85000.00]]}
 ]},

{id:43,title:"Q43 · Products Never Ordered",difficulty:"Medium",topic:"Aggregations & JOINs",
 desc:"Products(product_id INT, product_name VARCHAR)\nOrderItems(order_id INT, product_id INT)\n\nFind products that have never been ordered.\nReturn: product_id, product_name",
 setup:`DROP TABLE IF EXISTS Products; DROP TABLE IF EXISTS OrderItems;
 CREATE TABLE Products(product_id INT, product_name VARCHAR);
 CREATE TABLE OrderItems(order_id INT, product_id INT);
 INSERT INTO Products VALUES (1,'Widget'),(2,'Gadget'),(3,'Doohickey'),(4,'Thingamajig');
 INSERT INTO OrderItems VALUES (1,1),(2,1),(3,2),(4,3);`,
 tables:["products","orderitems"],
 cols:["product_id","product_name"],
 rows:[[4,'Thingamajig']],
 solution:`SELECT p.product_id, p.product_name
FROM Products p
WHERE NOT EXISTS (
  SELECT 1 FROM OrderItems oi WHERE oi.product_id = p.product_id
)
ORDER BY p.product_id`,
 tips:"NOT EXISTS is the clearest and most performant anti-join. It short-circuits as soon as one match is found. NOT IN has NULL-handling issues and LEFT JOIN + IS NULL works too but NOT EXISTS is idiomatic.",
 hints:["You need products with no rows in OrderItems.","Use NOT EXISTS with a correlated subquery checking for the product in OrderItems.","Alternatively, LEFT JOIN OrderItems WHERE product_id IS NULL also works."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Products; DROP TABLE IF EXISTS OrderItems;
   CREATE TABLE Products(product_id INT, product_name VARCHAR);
   CREATE TABLE OrderItems(order_id INT, product_id INT);
   INSERT INTO Products VALUES (1,'A'),(2,'B'),(3,'C'),(4,'D'),(5,'E');
   INSERT INTO OrderItems VALUES (1,1),(2,2),(3,2),(4,3);`,
   rows:[[4,'D'],[5,'E']]}
 ]},

{id:44,title:"Q44 · Customers Active Every Month of Q1",difficulty:"Medium",topic:"Aggregations & JOINs",
 desc:"Orders(order_id INT, customer_id INT, order_date DATE)\n\nFind customers who placed at least one order in each of January, February, and March 2025.\nReturn: customer_id",
 setup:`DROP TABLE IF EXISTS Orders;
 CREATE TABLE Orders(order_id INT, customer_id INT, order_date DATE);
 INSERT INTO Orders VALUES
 (1,1,'2025-01-05'),(2,1,'2025-02-10'),(3,1,'2025-03-15'),
 (4,2,'2025-01-01'),(5,2,'2025-02-01'),
 (6,3,'2025-01-10'),(7,3,'2025-02-20'),(8,3,'2025-03-05');`,
 tables:["orders"],
 cols:["customer_id"],
 rows:[[1],[3]],
 solution:`SELECT customer_id
FROM Orders
WHERE order_date BETWEEN '2025-01-01' AND '2025-03-31'
GROUP BY customer_id
HAVING COUNT(DISTINCT EXTRACT(MONTH FROM order_date)) = 3
ORDER BY customer_id`,
 tips:"HAVING COUNT(DISTINCT MONTH) = 3 elegantly captures 'active in all 3 months'. This is more concise than self-joining three times or using EXISTS for each month.",
 hints:["Filter orders to Q1 2025 first.","GROUP BY customer_id and count distinct months.","HAVING COUNT(DISTINCT EXTRACT(MONTH FROM order_date)) = 3 means active in all 3 months."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Orders; CREATE TABLE Orders(order_id INT, customer_id INT, order_date DATE);
   INSERT INTO Orders VALUES
   (1,10,'2025-01-01'),(2,10,'2025-02-01'),(3,10,'2025-03-01'),
   (4,20,'2025-01-01'),(5,20,'2025-03-01'),
   (6,30,'2025-01-01'),(7,30,'2025-02-01'),(8,30,'2025-03-01'),(9,30,'2025-03-15');`,
   rows:[[10],[30]]}
 ]},

{id:45,title:"Q45 · Mutual Followers",difficulty:"Hard",topic:"Aggregations & JOINs",
 desc:"Follows(follower_id INT, followed_id INT)\n\nFind all pairs (a, b) where a follows b AND b follows a. Return each pair once with a < b.\nReturn: user_a, user_b",
 setup:`DROP TABLE IF EXISTS Follows;
 CREATE TABLE Follows(follower_id INT, followed_id INT);
 INSERT INTO Follows VALUES (1,2),(2,1),(1,3),(3,4),(4,3),(2,3);`,
 tables:["follows"],
 cols:["user_a","user_b"],
 rows:[[1,2],[3,4]],
 solution:`SELECT f1.follower_id AS user_a, f1.followed_id AS user_b
FROM Follows f1
JOIN Follows f2 ON f1.follower_id = f2.followed_id AND f1.followed_id = f2.follower_id
WHERE f1.follower_id < f1.followed_id`,
 tips:"Self-join: for each follow row, check if the reverse row exists. The WHERE a < b deduplicates pairs (avoids returning both (1,2) and (2,1)). An alternative is INTERSECT with a swapped SELECT.",
 hints:["Self-join Follows: each row represents one direction of the relationship.","Join where f1.follower=f2.followed AND f1.followed=f2.follower to find mutual follows.","Add WHERE follower_id < followed_id to return each pair only once."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Follows; CREATE TABLE Follows(follower_id INT, followed_id INT);
   INSERT INTO Follows VALUES (1,2),(2,1),(1,3),(3,1),(4,5),(5,4),(6,7);`,
   rows:[[1,2],[1,3],[4,5]]}
 ]},

{id:46,title:"Q46 · Pivot Monthly Sales as Columns",difficulty:"Hard",topic:"Aggregations & JOINs",
 desc:"Sales(product_id INT, sale_month INT, sales_amount INT)\nsale_month is 1, 2, or 3 (January, February, March)\n\nPivot so each month becomes a column.\nReturn: product_id, jan_sales, feb_sales, mar_sales",
 setup:`DROP TABLE IF EXISTS Sales;
 CREATE TABLE Sales(product_id INT, sale_month INT, sales_amount INT);
 INSERT INTO Sales VALUES (1,1,100),(1,2,200),(1,3,150),(2,1,300),(2,3,400);`,
 tables:["sales"],
 cols:["product_id","jan_sales","feb_sales","mar_sales"],
 rows:[[1,100,200,150],[2,300,0,400]],
 solution:`SELECT product_id,
  COALESCE(SUM(CASE WHEN sale_month = 1 THEN sales_amount END), 0) AS jan_sales,
  COALESCE(SUM(CASE WHEN sale_month = 2 THEN sales_amount END), 0) AS feb_sales,
  COALESCE(SUM(CASE WHEN sale_month = 3 THEN sales_amount END), 0) AS mar_sales
FROM Sales
GROUP BY product_id
ORDER BY product_id`,
 tips:"Conditional aggregation (CASE inside SUM) is the standard SQL pivot technique. COALESCE(..., 0) handles NULLs when a product has no sales in a month. This works in all SQL dialects unlike PIVOT syntax.",
 hints:["Use CASE WHEN sale_month = 1 THEN sales_amount END inside SUM() for each month.","GROUP BY product_id to aggregate across all months.","Wrap in COALESCE(..., 0) to replace NULL with 0 when a product has no sales that month."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Sales; CREATE TABLE Sales(product_id INT, sale_month INT, sales_amount INT);
   INSERT INTO Sales VALUES (1,1,50),(1,2,60),(1,3,70),(2,2,80),(3,1,90),(3,3,100);`,
   rows:[[1,50,60,70],[2,0,80,0],[3,90,0,100]]}
 ]},

{id:47,title:"Q47 · All Orders Exceeded $100",difficulty:"Hard",topic:"Aggregations & JOINs",
 desc:"Orders(order_id INT, customer_id INT, amount INT)\n\nFind customers where ALL their orders exceeded $100 (must have at least 1 order).\nReturn: customer_id",
 setup:`DROP TABLE IF EXISTS Orders;
 CREATE TABLE Orders(order_id INT, customer_id INT, amount INT);
 INSERT INTO Orders VALUES (1,1,150),(2,1,200),(3,2,80),(4,2,120),(5,3,110),(6,3,130),(7,3,150);`,
 tables:["orders"],
 cols:["customer_id"],
 rows:[[1],[3]],
 solution:`SELECT customer_id
FROM Orders
GROUP BY customer_id
HAVING MIN(amount) > 100
ORDER BY customer_id`,
 tips:"HAVING MIN(amount) > 100 is the most elegant solution — if the minimum order is > 100, then ALL orders are > 100. Avoid NOT EXISTS double-negation unless dealing with NULL logic.",
 hints:["You need customers where every single order is > 100.","Think about what aggregate function gives you the 'worst case' order amount.","HAVING MIN(amount) > 100 means the smallest order is still over $100."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Orders; CREATE TABLE Orders(order_id INT, customer_id INT, amount INT);
   INSERT INTO Orders VALUES (1,10,200),(2,10,150),(3,10,300),(4,20,90),(5,20,200),(6,30,101),(7,30,102);`,
   rows:[[10],[30]]}
 ]},
{id:48,title:"Q48 · Rank Students by Score",difficulty:"Easy",topic:"Window Functions",
 desc:"StudentScores(student_id INT, class_id INT, score INT)\n\nRank students within each class by score (highest = rank 1). Ties get the same rank.\nReturn: class_id, student_id, score, rank",
 setup:`DROP TABLE IF EXISTS StudentScores;
 CREATE TABLE StudentScores(student_id INT, class_id INT, score INT);
 INSERT INTO StudentScores VALUES (1,1,95),(2,1,88),(3,1,88),(4,2,75),(5,2,90),(6,2,85);`,
 tables:["studentscores"],
 cols:["class_id","student_id","score","rank"],
 rows:[[1,1,95,1],[1,2,88,2],[1,3,88,2],[2,5,90,1],[2,6,85,2],[2,4,75,3]],
 solution:`SELECT class_id, student_id, score,
  RANK() OVER (PARTITION BY class_id ORDER BY score DESC) AS rank
FROM StudentScores
ORDER BY class_id, rank, student_id`,
 tips:"RANK() assigns the same rank to tied rows and skips the next rank(s). Use DENSE_RANK() if you don't want gaps. ROW_NUMBER() breaks ties arbitrarily. Choose based on whether ties should share a rank.",
 hints:["Use a ranking window function partitioned by class_id.","RANK() assigns the same rank to tied scores and skips numbers (e.g., 1,2,2,4).","PARTITION BY class_id, ORDER BY score DESC."],
 tests:[
  {setup:`DROP TABLE IF EXISTS StudentScores; CREATE TABLE StudentScores(student_id INT, class_id INT, score INT);
   INSERT INTO StudentScores VALUES (1,1,100),(2,1,90),(3,1,90),(4,1,80),(5,2,70),(6,2,85),(7,2,85),(8,2,60);`,
   rows:[[1,1,100,1],[1,2,90,2],[1,3,90,2],[1,4,80,4],[2,6,85,1],[2,7,85,1],[2,5,70,3],[2,8,60,4]]}
 ]},

{id:49,title:"Q49 · Row Numbers by Hire Date",difficulty:"Easy",topic:"Window Functions",
 desc:"Employees(emp_id INT, name VARCHAR, hire_date DATE, dept_id INT)\n\nAdd row numbers to employees sorted by hire_date ascending within each department.\nReturn: dept_id, emp_id, name, hire_date, row_num",
 setup:`DROP TABLE IF EXISTS Employees;
 CREATE TABLE Employees(emp_id INT, name VARCHAR, hire_date DATE, dept_id INT);
 INSERT INTO Employees VALUES (1,'Alice','2020-01-15',1),(2,'Bob','2019-06-01',1),(3,'Carol','2021-03-10',1),(4,'Dave','2020-05-20',2),(5,'Eve','2018-11-01',2);`,
 tables:["employees"],
 cols:["dept_id","emp_id","name","hire_date","row_num"],
 rows:[[1,2,'Bob','2019-06-01',1],[1,1,'Alice','2020-01-15',2],[1,3,'Carol','2021-03-10',3],[2,5,'Eve','2018-11-01',1],[2,4,'Dave','2020-05-20',2]],
 solution:`SELECT dept_id, emp_id, name, hire_date,
  ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY hire_date) AS row_num
FROM Employees
ORDER BY dept_id, row_num`,
 tips:"ROW_NUMBER() is the right function when you want unique sequential numbers per partition. It never assigns the same number to two rows, unlike RANK() or DENSE_RANK().",
 hints:["Use ROW_NUMBER() to assign sequential numbers.","PARTITION BY dept_id, ORDER BY hire_date ASC.","ROW_NUMBER() always produces unique numbers within each partition — no ties."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Employees; CREATE TABLE Employees(emp_id INT, name VARCHAR, hire_date DATE, dept_id INT);
   INSERT INTO Employees VALUES (1,'A','2021-01-01',1),(2,'B','2020-01-01',1),(3,'C','2019-01-01',1),(4,'D','2022-06-01',2),(5,'E','2021-06-01',2),(6,'F','2020-06-01',2);`,
   rows:[[1,3,'C','2019-01-01',1],[1,2,'B','2020-01-01',2],[1,1,'A','2021-01-01',3],[2,6,'F','2020-06-01',1],[2,5,'E','2021-06-01',2],[2,4,'D','2022-06-01',3]]}
 ]},

{id:50,title:"Q50 · Employees Earning Above Dept Average",difficulty:"Medium",topic:"Window Functions",
 desc:"Employees(emp_id INT, dept_id INT, name VARCHAR, salary INT)\n\nFind employees whose salary is above their department's average salary.\nReturn: emp_id, dept_id, name, salary, dept_avg",
 setup:`DROP TABLE IF EXISTS Employees;
 CREATE TABLE Employees(emp_id INT, dept_id INT, name VARCHAR, salary INT);
 INSERT INTO Employees VALUES (1,1,'Alice',90000),(2,1,'Bob',70000),(3,1,'Carol',80000),(4,2,'Dave',60000),(5,2,'Eve',55000),(6,2,'Frank',65000);`,
 tables:["employees"],
 cols:["emp_id","dept_id","name","salary","dept_avg"],
 rows:[[1,1,'Alice',90000,80000.00],[3,1,'Carol',80000,80000.00],[6,2,'Frank',65000,60000.00]],
 note:"Employees earning exactly the department average are NOT included (strictly above).",
 solution:`SELECT emp_id, dept_id, name, salary, dept_avg
FROM (
  SELECT *, ROUND(AVG(salary) OVER (PARTITION BY dept_id), 2) AS dept_avg
  FROM Employees
) t
WHERE salary > dept_avg
ORDER BY dept_id, emp_id`,
 tips:"Window AVG() computes the department average inline without a GROUP BY subquery. Compare salary > dept_avg in the outer query. This is cleaner than joining back to a grouped subquery.",
 hints:["Use AVG(salary) OVER (PARTITION BY dept_id) to compute each employee's department average.","This adds the dept average to every row without reducing rows.","Filter in an outer query WHERE salary > dept_avg."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Employees; CREATE TABLE Employees(emp_id INT, dept_id INT, name VARCHAR, salary INT);
   INSERT INTO Employees VALUES (1,1,'A',100000),(2,1,'B',50000),(3,1,'C',70000),(4,2,'D',80000),(5,2,'E',90000),(6,2,'F',70000);`,
   rows:[[1,1,'A',100000,73333.33],[5,2,'E',90000,80000.00]]}
 ]},

{id:51,title:"Q51 · Year-Over-Year Growth Per Product",difficulty:"Hard",topic:"Window Functions",
 desc:"ProductRevenue(product_id INT, year INT, revenue INT)\n\nCalculate the year-over-year revenue growth percentage for each product.\nReturn: product_id, year, revenue, prev_revenue, yoy_growth_pct",
 setup:`DROP TABLE IF EXISTS ProductRevenue;
 CREATE TABLE ProductRevenue(product_id INT, year INT, revenue INT);
 INSERT INTO ProductRevenue VALUES (1,2022,1000),(1,2023,1200),(1,2024,1100),(2,2022,500),(2,2023,600),(2,2024,750);`,
 tables:["productrevenue"],
 cols:["product_id","year","revenue","prev_revenue","yoy_growth_pct"],
 rows:[[1,2023,1200,1000,20.00],[1,2024,1100,1200,-8.33],[2,2023,600,500,20.00],[2,2024,750,600,25.00]],
 solution:`SELECT product_id, year, revenue, prev_revenue,
  ROUND(100.0 * (revenue - prev_revenue) / prev_revenue, 2) AS yoy_growth_pct
FROM (
  SELECT *, LAG(revenue) OVER (PARTITION BY product_id ORDER BY year) AS prev_revenue
  FROM ProductRevenue
) t WHERE prev_revenue IS NOT NULL
ORDER BY product_id, year`,
 tips:"LAG() gives the previous year's revenue in a single pass. The growth formula is (current - previous) / previous * 100. Filter WHERE prev_revenue IS NOT NULL to exclude the first year per product.",
 hints:["Use LAG(revenue) OVER (PARTITION BY product_id ORDER BY year) for previous year's revenue.","The growth formula: (revenue - prev_revenue) / prev_revenue * 100.","Filter out rows where prev_revenue IS NULL (first year has no comparison)."],
 tests:[
  {setup:`DROP TABLE IF EXISTS ProductRevenue; CREATE TABLE ProductRevenue(product_id INT, year INT, revenue INT);
   INSERT INTO ProductRevenue VALUES (1,2021,200),(1,2022,250),(1,2023,200),(2,2021,400),(2,2022,500),(2,2023,600);`,
   rows:[[1,2022,250,200,25.00],[1,2023,200,250,-20.00],[2,2022,500,400,25.00],[2,2023,600,500,20.00]]}
 ]},

{id:52,title:"Q52 · Gap to Department Max Salary",difficulty:"Hard",topic:"Window Functions",
 desc:"Employees(emp_id INT, dept_id INT, name VARCHAR, salary INT)\n\nFor each employee, show the gap between their salary and the maximum salary in their department.\nReturn: emp_id, dept_id, name, salary, dept_max, salary_gap",
 setup:`DROP TABLE IF EXISTS Employees;
 CREATE TABLE Employees(emp_id INT, dept_id INT, name VARCHAR, salary INT);
 INSERT INTO Employees VALUES (1,1,'Alice',90000),(2,1,'Bob',70000),(3,1,'Carol',80000),(4,2,'Dave',60000),(5,2,'Eve',55000);`,
 tables:["employees"],
 cols:["emp_id","dept_id","name","salary","dept_max","salary_gap"],
 rows:[[1,1,'Alice',90000,90000,0],[2,1,'Bob',70000,90000,20000],[3,1,'Carol',80000,90000,10000],[4,2,'Dave',60000,60000,0],[5,2,'Eve',55000,60000,5000]],
 solution:`SELECT emp_id, dept_id, name, salary,
  MAX(salary) OVER (PARTITION BY dept_id) AS dept_max,
  MAX(salary) OVER (PARTITION BY dept_id) - salary AS salary_gap
FROM Employees
ORDER BY dept_id, emp_id`,
 tips:"MAX() OVER (PARTITION BY dept_id) computes the department max for every row without collapsing rows. The gap is simply dept_max - salary. No self-join or subquery needed.",
 hints:["Use MAX(salary) OVER (PARTITION BY dept_id) to get the department maximum for each row.","Subtract the employee's salary from the department max to get the gap.","Window functions don't reduce rows, so every employee keeps their row plus the computed max."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Employees; CREATE TABLE Employees(emp_id INT, dept_id INT, name VARCHAR, salary INT);
   INSERT INTO Employees VALUES (1,1,'A',100000),(2,1,'B',80000),(3,1,'C',60000),(4,2,'D',70000),(5,2,'E',70000);`,
   rows:[[1,1,'A',100000,100000,0],[2,1,'B',80000,100000,20000],[3,1,'C',60000,100000,40000],[4,2,'D',70000,70000,0],[5,2,'E',70000,70000,0]]}
 ]},

{id:53,title:"Q53 · First and Last Transaction Per Month",difficulty:"Hard",topic:"Window Functions",
 desc:"Transactions(txn_id INT, customer_id INT, txn_date DATE, amount INT)\n\nFor each customer and month, find the first and last transaction amounts.\nReturn: customer_id, month, first_amount, last_amount",
 setup:`DROP TABLE IF EXISTS Transactions;
 CREATE TABLE Transactions(txn_id INT, customer_id INT, txn_date DATE, amount INT);
 INSERT INTO Transactions VALUES
 (1,1,'2025-01-05',100),(2,1,'2025-01-15',200),(3,1,'2025-01-25',150),
 (4,1,'2025-02-10',300),(5,2,'2025-01-08',50),(6,2,'2025-01-20',75);`,
 tables:["transactions"],
 cols:["customer_id","month","first_amount","last_amount"],
 rows:[[1,'2025-01',100,150],[1,'2025-02',300,300],[2,'2025-01',50,75]],
 solution:`SELECT DISTINCT customer_id,
  TO_CHAR(txn_date, 'YYYY-MM') AS month,
  FIRST_VALUE(amount) OVER (PARTITION BY customer_id, TO_CHAR(txn_date,'YYYY-MM') ORDER BY txn_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_amount,
  LAST_VALUE(amount) OVER (PARTITION BY customer_id, TO_CHAR(txn_date,'YYYY-MM') ORDER BY txn_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_amount
FROM Transactions
ORDER BY customer_id, month`,
 tips:"FIRST_VALUE and LAST_VALUE need the full frame ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING. Without it, LAST_VALUE only sees the current row by default. DISTINCT collapses duplicates after the window is computed.",
 hints:["FIRST_VALUE and LAST_VALUE are window functions that access the first/last row in a window.","LAST_VALUE requires ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING to see all rows in the partition.","PARTITION BY customer_id, month and ORDER BY txn_date."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Transactions; CREATE TABLE Transactions(txn_id INT, customer_id INT, txn_date DATE, amount INT);
   INSERT INTO Transactions VALUES (1,1,'2025-03-01',10),(2,1,'2025-03-15',20),(3,1,'2025-03-30',30),(4,2,'2025-03-10',100),(5,2,'2025-03-20',200);`,
   rows:[[1,'2025-03',10,30],[2,'2025-03',100,200]]}
 ]},

{id:54,title:"Q54 · Percentile Ranking by Salary",difficulty:"Hard",topic:"Window Functions",
 desc:"Employees(emp_id INT, name VARCHAR, salary INT)\n\nCompute the percentile rank of each employee by salary (0 to 1).\nReturn: emp_id, name, salary, percentile_rank",
 setup:`DROP TABLE IF EXISTS Employees;
 CREATE TABLE Employees(emp_id INT, name VARCHAR, salary INT);
 INSERT INTO Employees VALUES (1,'Alice',90000),(2,'Bob',60000),(3,'Carol',75000),(4,'Dave',90000),(5,'Eve',50000);`,
 tables:["employees"],
 cols:["emp_id","name","salary","percentile_rank"],
 rows:[[5,'Eve',50000,0.00],[2,'Bob',60000,0.25],[3,'Carol',75000,0.50],[1,'Alice',90000,0.75],[4,'Dave',90000,0.75]],
 solution:`SELECT emp_id, name, salary,
  ROUND(PERCENT_RANK() OVER (ORDER BY salary)::numeric, 2) AS percentile_rank
FROM Employees
ORDER BY salary, emp_id`,
 tips:"PERCENT_RANK() = (rank - 1) / (total_rows - 1). It ranges from 0 to 1. CUME_DIST() is similar but includes the current row's value. Use PERCENT_RANK for classic percentile interpretation.",
 hints:["Use PERCENT_RANK() window function ordered by salary.","PERCENT_RANK() = (rank - 1) / (N - 1), ranging from 0 to 1.","ROUND to 2 decimal places and ORDER BY salary."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Employees; CREATE TABLE Employees(emp_id INT, name VARCHAR, salary INT);
   INSERT INTO Employees VALUES (1,'A',10000),(2,'B',20000),(3,'C',30000),(4,'D',40000),(5,'E',50000);`,
   rows:[[1,'A',10000,0.00],[2,'B',20000,0.25],[3,'C',30000,0.50],[4,'D',40000,0.75],[5,'E',50000,1.00]]}
 ]},
{id:55,title:"Q55 · Running Count of Orders Per Customer",difficulty:"Easy",topic:"Cumulative & Sliding Windows",
 desc:"Orders(order_id INT, customer_id INT, order_date DATE)\n\nFor each order, show the running count of orders placed by that customer up to and including that date.\nReturn: customer_id, order_date, order_id, order_num",
 setup:`DROP TABLE IF EXISTS Orders;
 CREATE TABLE Orders(order_id INT, customer_id INT, order_date DATE);
 INSERT INTO Orders VALUES (1,1,'2025-01-01'),(2,1,'2025-01-05'),(3,1,'2025-01-10'),(4,2,'2025-01-03'),(5,2,'2025-01-08');`,
 tables:["orders"],
 cols:["customer_id","order_date","order_id","order_num"],
 rows:[[1,'2025-01-01',1,1],[1,'2025-01-05',2,2],[1,'2025-01-10',3,3],[2,'2025-01-03',4,1],[2,'2025-01-08',5,2]],
 solution:`SELECT customer_id, order_date, order_id,
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS order_num
FROM Orders
ORDER BY customer_id, order_date`,
 tips:"ROW_NUMBER() OVER (PARTITION BY customer ORDER BY date) gives a sequential count per customer. This is equivalent to COUNT(*) OVER (...) but ROW_NUMBER is cleaner when rows are unique.",
 hints:["You need a sequential count per customer ordered by date.","ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) assigns 1,2,3... per customer.","This automatically resets to 1 for each new customer."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Orders; CREATE TABLE Orders(order_id INT, customer_id INT, order_date DATE);
   INSERT INTO Orders VALUES (1,1,'2025-02-01'),(2,1,'2025-02-10'),(3,2,'2025-02-05'),(4,3,'2025-02-01'),(5,3,'2025-02-08'),(6,3,'2025-02-15');`,
   rows:[[1,'2025-02-01',1,1],[1,'2025-02-10',2,2],[2,'2025-02-05',3,1],[3,'2025-02-01',4,1],[3,'2025-02-08',5,2],[3,'2025-02-15',6,3]]}
 ]},

{id:56,title:"Q56 · Cumulative Sum of Page Views Per Day",difficulty:"Easy",topic:"Cumulative & Sliding Windows",
 desc:"PageViews(view_date DATE, views INT)\n\nCumulative total page views up to and including each day.\nReturn: view_date, daily_views, cumulative_views",
 setup:`DROP TABLE IF EXISTS PageViews;
 CREATE TABLE PageViews(view_date DATE, views INT);
 INSERT INTO PageViews VALUES ('2025-01-01',100),('2025-01-02',150),('2025-01-03',200),('2025-01-04',120),('2025-01-05',180);`,
 tables:["pageviews"],
 cols:["view_date","daily_views","cumulative_views"],
 rows:[['2025-01-01',100,100],['2025-01-02',150,250],['2025-01-03',200,450],['2025-01-04',120,570],['2025-01-05',180,750]],
 solution:`SELECT view_date, views AS daily_views,
  SUM(views) OVER (ORDER BY view_date) AS cumulative_views
FROM PageViews
ORDER BY view_date`,
 tips:"SUM() OVER (ORDER BY date) without PARTITION BY gives a global running total. The default frame is UNBOUNDED PRECEDING to CURRENT ROW, which is exactly what cumulative sum means.",
 hints:["SUM() as a window function with ORDER BY gives a cumulative total.","No PARTITION BY needed — this is a global cumulative sum.","SUM(views) OVER (ORDER BY view_date) accumulates from the first row to the current row."],
 tests:[
  {setup:`DROP TABLE IF EXISTS PageViews; CREATE TABLE PageViews(view_date DATE, views INT);
   INSERT INTO PageViews VALUES ('2025-03-01',50),('2025-03-02',75),('2025-03-03',100),('2025-03-04',25);`,
   rows:[['2025-03-01',50,50],['2025-03-02',75,125],['2025-03-03',100,225],['2025-03-04',25,250]]}
 ]},

{id:57,title:"Q57 · 7-Day Rolling Sum of Website Visits",difficulty:"Medium",topic:"Cumulative & Sliding Windows",
 desc:"WebVisits(visit_date DATE, visits INT)\n\n7-day trailing rolling sum (current day plus up to 6 prior days).\nReturn: visit_date, visits, rolling_7day_sum",
 setup:`DROP TABLE IF EXISTS WebVisits;
 CREATE TABLE WebVisits(visit_date DATE, visits INT);
 INSERT INTO WebVisits VALUES ('2025-01-01',10),('2025-01-02',20),('2025-01-03',15),('2025-01-04',25),('2025-01-05',30),('2025-01-06',12),('2025-01-07',18),('2025-01-08',22);`,
 tables:["webvisits"],
 cols:["visit_date","visits","rolling_7day_sum"],
 rows:[['2025-01-01',10,10],['2025-01-02',20,30],['2025-01-03',15,45],['2025-01-04',25,70],['2025-01-05',30,100],['2025-01-06',12,112],['2025-01-07',18,130],['2025-01-08',22,142]],
 solution:`SELECT visit_date, visits,
  SUM(visits) OVER (ORDER BY visit_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7day_sum
FROM WebVisits
ORDER BY visit_date`,
 tips:"ROWS BETWEEN 6 PRECEDING AND CURRENT ROW defines a 7-row trailing window. For date-based 7-day windows with gaps, use RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW instead.",
 hints:["Use SUM() with a window frame of ROWS BETWEEN 6 PRECEDING AND CURRENT ROW.","This covers the current row plus 6 rows before it (7 total).","For sparse dates with actual date gaps, use RANGE BETWEEN INTERVAL '6 days' PRECEDING instead."],
 tests:[
  {setup:`DROP TABLE IF EXISTS WebVisits; CREATE TABLE WebVisits(visit_date DATE, visits INT);
   INSERT INTO WebVisits VALUES ('2025-02-01',5),('2025-02-02',10),('2025-02-03',15),('2025-02-04',20),('2025-02-05',25),('2025-02-06',30),('2025-02-07',35),('2025-02-08',40);`,
   rows:[['2025-02-01',5,5],['2025-02-02',10,15],['2025-02-03',15,30],['2025-02-04',20,50],['2025-02-05',25,75],['2025-02-06',30,105],['2025-02-07',35,140],['2025-02-08',40,175]]}
 ]},

{id:58,title:"Q58 · Running Average Order Value Per Customer",difficulty:"Medium",topic:"Cumulative & Sliding Windows",
 desc:"Orders(order_id INT, customer_id INT, order_date DATE, amount INT)\n\nFor each order, compute the running average of order amounts per customer up to that order.\nReturn: customer_id, order_date, amount, running_avg",
 setup:`DROP TABLE IF EXISTS Orders;
 CREATE TABLE Orders(order_id INT, customer_id INT, order_date DATE, amount INT);
 INSERT INTO Orders VALUES (1,1,'2025-01-01',100),(2,1,'2025-01-05',200),(3,1,'2025-01-10',150),(4,2,'2025-01-02',80),(5,2,'2025-01-08',120);`,
 tables:["orders"],
 cols:["customer_id","order_date","amount","running_avg"],
 rows:[[1,'2025-01-01',100,100.00],[1,'2025-01-05',200,150.00],[1,'2025-01-10',150,150.00],[2,'2025-01-02',80,80.00],[2,'2025-01-08',120,100.00]],
 solution:`SELECT customer_id, order_date, amount,
  ROUND(AVG(amount) OVER (PARTITION BY customer_id ORDER BY order_date)::numeric, 2) AS running_avg
FROM Orders
ORDER BY customer_id, order_date`,
 tips:"AVG() OVER with ORDER BY computes a running average (UNBOUNDED PRECEDING to CURRENT ROW by default). ROUND with ::numeric avoids type issues in PostgreSQL.",
 hints:["Use AVG() as a window function with PARTITION BY customer_id, ORDER BY order_date.","The default frame gives a cumulative average up to the current row.","Wrap in ROUND(...::numeric, 2) for clean decimal output."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Orders; CREATE TABLE Orders(order_id INT, customer_id INT, order_date DATE, amount INT);
   INSERT INTO Orders VALUES (1,1,'2025-03-01',50),(2,1,'2025-03-05',100),(3,1,'2025-03-10',150),(4,2,'2025-03-02',200),(5,2,'2025-03-06',100),(6,2,'2025-03-09',300);`,
   rows:[[1,'2025-03-01',50,50.00],[1,'2025-03-05',100,75.00],[1,'2025-03-10',150,100.00],[2,'2025-03-02',200,200.00],[2,'2025-03-06',100,150.00],[2,'2025-03-09',300,200.00]]}
 ]},

{id:59,title:"Q59 · Cumulative Percentage of Total",difficulty:"Medium",topic:"Cumulative & Sliding Windows",
 desc:"Products(product_id INT, product_name VARCHAR, revenue INT)\n\nFor each product (ordered by revenue DESC), show the cumulative revenue and what percentage of total revenue it represents.\nReturn: product_id, product_name, revenue, cumulative_revenue, cumulative_pct",
 setup:`DROP TABLE IF EXISTS Products;
 CREATE TABLE Products(product_id INT, product_name VARCHAR, revenue INT);
 INSERT INTO Products VALUES (1,'Widget',5000),(2,'Gadget',3000),(3,'Doohickey',1500),(4,'Gizmo',500);`,
 tables:["products"],
 cols:["product_id","product_name","revenue","cumulative_revenue","cumulative_pct"],
 rows:[[1,'Widget',5000,5000,50.00],[2,'Gadget',3000,8000,80.00],[3,'Doohickey',1500,9500,95.00],[4,'Gizmo',500,10000,100.00]],
 solution:`SELECT product_id, product_name, revenue,
  SUM(revenue) OVER (ORDER BY revenue DESC) AS cumulative_revenue,
  ROUND(100.0 * SUM(revenue) OVER (ORDER BY revenue DESC) / SUM(revenue) OVER (), 2) AS cumulative_pct
FROM Products
ORDER BY revenue DESC`,
 tips:"SUM() OVER () without ORDER BY gives the grand total. SUM() OVER (ORDER BY ...) gives the running total. Dividing gives the cumulative percentage. This is the Pareto/80-20 analysis pattern.",
 hints:["SUM(revenue) OVER (ORDER BY revenue DESC) gives cumulative revenue in descending order.","SUM(revenue) OVER () (no ORDER BY, no PARTITION BY) gives the grand total.","Divide cumulative by grand total and multiply by 100 for the percentage."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Products; CREATE TABLE Products(product_id INT, product_name VARCHAR, revenue INT);
   INSERT INTO Products VALUES (1,'A',4000),(2,'B',3000),(3,'C',2000),(4,'D',1000);`,
   rows:[[1,'A',4000,4000,40.00],[2,'B',3000,7000,70.00],[3,'C',2000,9000,90.00],[4,'D',1000,10000,100.00]]}
 ]},

{id:60,title:"Q60 · Month-over-Month Cumulative Growth Rate",difficulty:"Hard",topic:"Cumulative & Sliding Windows",
 desc:"MonthlySales(sale_month DATE, sales INT)\n\nFor each month, compute the cumulative growth rate as a percentage change from the first month to the current month.\nReturn: sale_month, sales, first_month_sales, cumulative_growth_pct",
 setup:`DROP TABLE IF EXISTS MonthlySales;
 CREATE TABLE MonthlySales(sale_month DATE, sales INT);
 INSERT INTO MonthlySales VALUES ('2025-01-01',1000),('2025-02-01',1200),('2025-03-01',1100),('2025-04-01',1400);`,
 tables:["monthlysales"],
 cols:["sale_month","sales","first_month_sales","cumulative_growth_pct"],
 rows:[['2025-01-01',1000,1000,0.00],['2025-02-01',1200,1000,20.00],['2025-03-01',1100,1000,10.00],['2025-04-01',1400,1000,40.00]],
 solution:`SELECT sale_month, sales,
  FIRST_VALUE(sales) OVER (ORDER BY sale_month) AS first_month_sales,
  ROUND(100.0 * (sales - FIRST_VALUE(sales) OVER (ORDER BY sale_month))
    / FIRST_VALUE(sales) OVER (ORDER BY sale_month), 2) AS cumulative_growth_pct
FROM MonthlySales
ORDER BY sale_month`,
 tips:"FIRST_VALUE() OVER (ORDER BY month) gives the first month's value for every row, useful as a base for cumulative growth. The frame defaults to UNBOUNDED PRECEDING to CURRENT ROW which is fine for FIRST_VALUE.",
 hints:["Use FIRST_VALUE(sales) OVER (ORDER BY sale_month) to get the base month's sales on every row.","Compute growth as (current - first) / first * 100.","Wrap in ROUND(..., 2) for clean output."],
 tests:[
  {setup:`DROP TABLE IF EXISTS MonthlySales; CREATE TABLE MonthlySales(sale_month DATE, sales INT);
   INSERT INTO MonthlySales VALUES ('2025-01-01',500),('2025-02-01',600),('2025-03-01',450),('2025-04-01',750);`,
   rows:[['2025-01-01',500,500,0.00],['2025-02-01',600,500,20.00],['2025-03-01',450,500,-10.00],['2025-04-01',750,500,50.00]]}
 ]},
{id:61,title:"Q61 · Rolling Distinct User Count",difficulty:"Hard",topic:"Cumulative & Sliding Windows",
 desc:"UserLogins(user_id INT, login_date DATE)\n\nFor each date in the data, count distinct users who logged in over the trailing 3 days (including the current day).\nReturn: login_date, rolling_distinct_users",
 setup:`DROP TABLE IF EXISTS UserLogins;
 CREATE TABLE UserLogins(user_id INT, login_date DATE);
 INSERT INTO UserLogins VALUES (1,'2025-01-01'),(2,'2025-01-01'),(1,'2025-01-02'),(3,'2025-01-02'),(2,'2025-01-03'),(4,'2025-01-03'),(1,'2025-01-04');`,
 tables:["userlogins"],
 cols:["login_date","rolling_distinct_users"],
 rows:[['2025-01-01',2],['2025-01-02',3],['2025-01-03',4],['2025-01-04',3]],
 solution:`SELECT d.login_date, COUNT(DISTINCT l.user_id) AS rolling_distinct_users
FROM (SELECT DISTINCT login_date FROM UserLogins) d
JOIN UserLogins l ON l.login_date BETWEEN d.login_date - 2 AND d.login_date
GROUP BY d.login_date
ORDER BY d.login_date`,
 tips:"COUNT(DISTINCT) cannot be used inside window frames, so use a self-join for the rolling window. For each anchor date, join to all logins within the past 3 days and count distinct users.",
 hints:["Window functions don't support COUNT(DISTINCT) in a frame — use a self-join.","For each date, join to all logins within the past 3 days (date - 2 to date).","GROUP BY the anchor date and COUNT(DISTINCT user_id)."],
 tests:[
  {setup:`DROP TABLE IF EXISTS UserLogins; CREATE TABLE UserLogins(user_id INT, login_date DATE);
   INSERT INTO UserLogins VALUES (1,'2025-02-01'),(2,'2025-02-01'),(1,'2025-02-02'),(3,'2025-02-03'),(4,'2025-02-04'),(2,'2025-02-04');`,
   rows:[['2025-02-01',2],['2025-02-02',2],['2025-02-03',3],['2025-02-04',3]]}
 ]},

{id:62,title:"Q62 · First Day Cumulative Sales Hit $1000 Milestones",difficulty:"Hard",topic:"Cumulative & Sliding Windows",
 desc:"DailySales(sale_date DATE, sales INT)\n\nFind the first date cumulative sales reached each $1000 milestone (1000, 2000, 3000, ...).\nReturn: milestone, first_date",
 setup:`DROP TABLE IF EXISTS DailySales;
 CREATE TABLE DailySales(sale_date DATE, sales INT);
 INSERT INTO DailySales VALUES ('2025-01-01',400),('2025-01-02',700),('2025-01-03',300),('2025-01-04',800),('2025-01-05',500);`,
 tables:["dailysales"],
 cols:["milestone","first_date"],
 rows:[[1000,'2025-01-02'],[2000,'2025-01-04'],[2700,'2025-01-05']],
 solution:`WITH cum AS (
  SELECT sale_date,
    SUM(sales) OVER (ORDER BY sale_date) AS cum_sales,
    SUM(sales) OVER (ORDER BY sale_date) - sales AS prev_cum
  FROM DailySales
),
milestones AS (
  SELECT DISTINCT (FLOOR(prev_cum / 1000.0) + 1) * 1000 AS milestone, sale_date
  FROM cum
  WHERE FLOOR(cum_sales / 1000.0) > FLOOR(prev_cum / 1000.0)
    OR (cum_sales >= 1000 AND prev_cum < 1000)
)
SELECT milestone::int AS milestone, MIN(sale_date) AS first_date
FROM milestones
GROUP BY milestone
UNION ALL
SELECT MAX(cum_sales)::int, MAX(sale_date)
FROM cum
WHERE cum_sales < (SELECT (FLOOR(MAX(cum_sales)/1000)+1)*1000 FROM cum)
  AND sale_date = (SELECT MAX(sale_date) FROM cum)
ORDER BY milestone`,
 note:"This problem uses a simplified version: return the first date each 1000-threshold is crossed, plus a final row for the total if it doesn't land on a clean multiple.",
 tips:"Compute running total, then identify dates where the cumulative crossed a 1000 boundary. FLOOR(cum/1000) changes when a boundary is crossed.",
 hints:["First compute the cumulative sum with SUM() OVER (ORDER BY sale_date).","Identify rows where FLOOR(cum_sales/1000) > FLOOR(prev_cum/1000) — a milestone was crossed.","The milestone crossed is (FLOOR(prev/1000)+1)*1000."],
 tests:[
  {setup:`DROP TABLE IF EXISTS DailySales; CREATE TABLE DailySales(sale_date DATE, sales INT);
   INSERT INTO DailySales VALUES ('2025-03-01',600),('2025-03-02',500),('2025-03-03',200),('2025-03-04',900);`,
   rows:[[1000,'2025-03-02'],[2000,'2025-03-04'],[2200,'2025-03-04']]}
 ]},

{id:63,title:"Q63 · Weighted Moving Average (3-Period)",difficulty:"Hard",topic:"Cumulative & Sliding Windows",
 desc:"DailySales(sale_date DATE, sales INT)\n\nCompute a 3-period weighted moving average where weights are: current=3, one prior=2, two prior=1 (total weight=6). For the first row use weight 3/3, for the second use (3*curr+2*prev)/5.\nReturn: sale_date, sales, weighted_avg",
 setup:`DROP TABLE IF EXISTS DailySales;
 CREATE TABLE DailySales(sale_date DATE, sales INT);
 INSERT INTO DailySales VALUES ('2025-01-01',100),('2025-01-02',200),('2025-01-03',300),('2025-01-04',400),('2025-01-05',500);`,
 tables:["dailysales"],
 cols:["sale_date","sales","weighted_avg"],
 rows:[['2025-01-01',100,100.00],['2025-01-02',200,166.67],['2025-01-03',300,250.00],['2025-01-04',400,350.00],['2025-01-05',500,450.00]],
 solution:`SELECT sale_date, sales,
  ROUND(
    (3 * sales
     + 2 * COALESCE(LAG(sales,1) OVER (ORDER BY sale_date), 0)
     + 1 * COALESCE(LAG(sales,2) OVER (ORDER BY sale_date), 0))
    ::numeric /
    (3 + CASE WHEN LAG(sales,1) OVER (ORDER BY sale_date) IS NOT NULL THEN 2 ELSE 0 END
       + CASE WHEN LAG(sales,2) OVER (ORDER BY sale_date) IS NOT NULL THEN 1 ELSE 0 END),
  2) AS weighted_avg
FROM DailySales
ORDER BY sale_date`,
 tips:"LAG(n) gives the value n rows back. Compute the weighted numerator (3*current + 2*lag1 + 1*lag2) and divide by the sum of applicable weights. Use CASE to handle edge rows at the start.",
 hints:["Use LAG(sales, 1) and LAG(sales, 2) to get previous values.","Numerator = 3*current + 2*lag1 + 1*lag2 (use COALESCE(lag, 0)).","Denominator = sum of weights for available rows (3 for first, 5 for second, 6 for rest)."],
 tests:[
  {setup:`DROP TABLE IF EXISTS DailySales; CREATE TABLE DailySales(sale_date DATE, sales INT);
   INSERT INTO DailySales VALUES ('2025-02-01',60),('2025-02-02',90),('2025-02-03',120),('2025-02-04',60);`,
   rows:[['2025-02-01',60,60.00],['2025-02-02',90,80.00],['2025-02-03',120,105.00],['2025-02-04',60,75.00]]}
 ]},
{id:64,title:"Q64 · Consecutive Days With Zero Sales",difficulty:"Easy",topic:"Consecutive Sequences",
 desc:"DailySales(sale_date DATE, sales INT)\n\nFind all periods of consecutive days where sales = 0.\nReturn: start_date, end_date, days_count",
 setup:`DROP TABLE IF EXISTS DailySales;
 CREATE TABLE DailySales(sale_date DATE, sales INT);
 INSERT INTO DailySales VALUES ('2025-01-01',100),('2025-01-02',0),('2025-01-03',0),('2025-01-04',50),('2025-01-05',0),('2025-01-06',0),('2025-01-07',0);`,
 tables:["dailysales"],
 cols:["start_date","end_date","days_count"],
 rows:[['2025-01-02','2025-01-03',2],['2025-01-05','2025-01-07',3]],
 solution:`WITH zeros AS (
  SELECT sale_date,
    sale_date - ROW_NUMBER() OVER (ORDER BY sale_date)::int AS grp
  FROM DailySales WHERE sales = 0
)
SELECT MIN(sale_date) AS start_date, MAX(sale_date) AS end_date, COUNT(*) AS days_count
FROM zeros
GROUP BY grp
ORDER BY start_date`,
 tips:"Filter zero-sales rows first, then apply the islands-and-gaps trick. The date-minus-row_number technique groups consecutive dates together regardless of what the other rows contain.",
 hints:["Filter rows where sales = 0, then apply the islands-and-gaps pattern.","date - ROW_NUMBER() groups consecutive zero-sales dates into the same bucket.","Aggregate each group: MIN for start, MAX for end, COUNT for length."],
 tests:[
  {setup:`DROP TABLE IF EXISTS DailySales; CREATE TABLE DailySales(sale_date DATE, sales INT);
   INSERT INTO DailySales VALUES ('2025-02-01',0),('2025-02-02',0),('2025-02-03',10),('2025-02-04',0),('2025-02-05',0),('2025-02-06',0),('2025-02-07',5);`,
   rows:[['2025-02-01','2025-02-02',2],['2025-02-04','2025-02-06',3]]}
 ]},

{id:65,title:"Q65 · Streak Lengths Per User",difficulty:"Easy",topic:"Consecutive Sequences",
 desc:"UserActivity(user_id INT, activity_date DATE)\n\nFind all streak lengths (consecutive day runs) per user. Return each streak as a separate row.\nReturn: user_id, streak_start, streak_end, streak_length  (row order doesn't matter)",
 setup:`DROP TABLE IF EXISTS UserActivity;
 CREATE TABLE UserActivity(user_id INT, activity_date DATE);
 INSERT INTO UserActivity VALUES
 (1,'2025-01-01'),(1,'2025-01-02'),(1,'2025-01-03'),
 (1,'2025-01-05'),(1,'2025-01-06'),
 (2,'2025-01-01'),(2,'2025-01-04');`,
 tables:["useractivity"],
 cols:["user_id","streak_start","streak_end","streak_length"],
 rows:[[1,'2025-01-01','2025-01-03',3],[1,'2025-01-05','2025-01-06',2],[2,'2025-01-01','2025-01-01',1],[2,'2025-01-04','2025-01-04',1]],
 solution:`WITH groups AS (
  SELECT user_id, activity_date,
    activity_date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY activity_date)::int AS grp
  FROM UserActivity
)
SELECT user_id, MIN(activity_date) AS streak_start, MAX(activity_date) AS streak_end, COUNT(*) AS streak_length
FROM groups GROUP BY user_id, grp
ORDER BY user_id, streak_start`,
 tips:"The islands-and-gaps pattern applied per user. Every consecutive-date group gets a unique (user_id, grp) combination. Aggregate each group for its start, end, and length.",
 hints:["Apply the date-minus-row_number trick per user with PARTITION BY user_id.","GROUP BY user_id and grp, then aggregate with MIN/MAX/COUNT.","Each group represents one continuous streak."],
 tests:[
  {setup:`DROP TABLE IF EXISTS UserActivity; CREATE TABLE UserActivity(user_id INT, activity_date DATE);
   INSERT INTO UserActivity VALUES (1,'2025-03-01'),(1,'2025-03-02'),(1,'2025-03-05'),(2,'2025-03-01'),(2,'2025-03-02'),(2,'2025-03-03'),(2,'2025-03-04');`,
   rows:[[1,'2025-03-01','2025-03-02',2],[1,'2025-03-05','2025-03-05',1],[2,'2025-03-01','2025-03-04',4]]}
 ]},

{id:66,title:"Q66 · Group Consecutive Identical Statuses",difficulty:"Easy",topic:"Consecutive Sequences",
 desc:"TicketHistory(ticket_id INT, changed_at DATE, status VARCHAR)\n\nCollapse consecutive runs of the same status into one row showing the start and end dates.\nReturn: ticket_id, status, start_date, end_date  (row order doesn't matter)",
 setup:`DROP TABLE IF EXISTS TicketHistory;
 CREATE TABLE TicketHistory(ticket_id INT, changed_at DATE, status VARCHAR);
 INSERT INTO TicketHistory VALUES
 (1,'2025-01-01','Open'),(1,'2025-01-02','Open'),(1,'2025-01-03','In Progress'),
 (1,'2025-01-04','In Progress'),(1,'2025-01-05','Closed'),
 (2,'2025-01-01','Open'),(2,'2025-01-02','Closed');`,
 tables:["tickethistory"],
 cols:["ticket_id","status","start_date","end_date"],
 rows:[[1,'Open','2025-01-01','2025-01-02'],[1,'In Progress','2025-01-03','2025-01-04'],[1,'Closed','2025-01-05','2025-01-05'],[2,'Open','2025-01-01','2025-01-01'],[2,'Closed','2025-01-02','2025-01-02']],
 solution:`WITH grps AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY ticket_id ORDER BY changed_at)
    - ROW_NUMBER() OVER (PARTITION BY ticket_id, status ORDER BY changed_at) AS grp
  FROM TicketHistory
)
SELECT ticket_id, status, MIN(changed_at) AS start_date, MAX(changed_at) AS end_date
FROM grps GROUP BY ticket_id, status, grp
ORDER BY ticket_id, start_date`,
 tips:"The dual ROW_NUMBER trick (overall RN minus per-status RN) groups consecutive same-status rows. This works for any value, not just dates — it's the general islands pattern.",
 hints:["Use ROW_NUMBER() overall minus ROW_NUMBER() within the same status per ticket.","This creates a group ID that's the same for consecutive runs of the same status.","GROUP BY ticket_id, status, grp and aggregate MIN/MAX of changed_at."],
 tests:[
  {setup:`DROP TABLE IF EXISTS TicketHistory; CREATE TABLE TicketHistory(ticket_id INT, changed_at DATE, status VARCHAR);
   INSERT INTO TicketHistory VALUES (1,'2025-02-01','New'),(1,'2025-02-02','New'),(1,'2025-02-03','Active'),(1,'2025-02-04','New'),(1,'2025-02-05','New'),(2,'2025-02-01','Active');`,
   rows:[[1,'New','2025-02-01','2025-02-02'],[1,'Active','2025-02-03','2025-02-03'],[1,'New','2025-02-04','2025-02-05'],[2,'Active','2025-02-01','2025-02-01']]}
 ]},

{id:67,title:"Q67 · Find Gaps in Sequential IDs",difficulty:"Medium",topic:"Consecutive Sequences",
 desc:"Records(id INT)\n\nFind all missing IDs in a sequence from MIN(id) to MAX(id).\nReturn: missing_id",
 setup:`DROP TABLE IF EXISTS Records;
 CREATE TABLE Records(id INT);
 INSERT INTO Records VALUES (1),(2),(4),(5),(8),(9),(10);`,
 tables:["records"],
 cols:["missing_id"],
 rows:[[3],[6],[7]],
 solution:`SELECT generate_series(MIN(id), MAX(id)) AS missing_id
FROM Records
EXCEPT
SELECT id FROM Records
ORDER BY missing_id`,
 tips:"generate_series() generates all integers in a range. EXCEPT removes the existing IDs, leaving only the gaps. This is cleaner than self-joins and works in PostgreSQL/PGlite.",
 hints:["Generate all integers from MIN(id) to MAX(id) using generate_series().","Use EXCEPT to remove existing IDs from that range.","What remains are the missing IDs — the gaps in the sequence."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Records; CREATE TABLE Records(id INT);
   INSERT INTO Records VALUES (1),(2),(3),(7),(8),(10),(11),(12);`,
   rows:[[4],[5],[6],[9]]}
 ]},

{id:68,title:"Q68 · Merge Overlapping Date Ranges",difficulty:"Hard",topic:"Consecutive Sequences",
 desc:"EmployeeLeave(emp_id INT, start_date DATE, end_date DATE)\n\nMerge overlapping or adjacent leave periods for the same employee.\nReturn: emp_id, merged_start, merged_end  (row order doesn't matter)",
 setup:`DROP TABLE IF EXISTS EmployeeLeave;
 CREATE TABLE EmployeeLeave(emp_id INT, start_date DATE, end_date DATE);
 INSERT INTO EmployeeLeave VALUES
 (1,'2025-01-01','2025-01-05'),(1,'2025-01-04','2025-01-10'),(1,'2025-01-15','2025-01-20'),
 (2,'2025-02-01','2025-02-05'),(2,'2025-02-06','2025-02-10');`,
 tables:["employeeleave"],
 cols:["emp_id","merged_start","merged_end"],
 rows:[[1,'2025-01-01','2025-01-10'],[1,'2025-01-15','2025-01-20'],[2,'2025-02-01','2025-02-10']],
 solution:`WITH ordered AS (
  SELECT *, MAX(end_date) OVER (PARTITION BY emp_id ORDER BY start_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_max_end
  FROM EmployeeLeave
),
grps AS (
  SELECT *, SUM(CASE WHEN start_date > prev_max_end OR prev_max_end IS NULL THEN 1 ELSE 0 END)
    OVER (PARTITION BY emp_id ORDER BY start_date) AS grp
  FROM ordered
)
SELECT emp_id, MIN(start_date) AS merged_start, MAX(end_date) AS merged_end
FROM grps GROUP BY emp_id, grp
ORDER BY emp_id, merged_start`,
 tips:"The sweep-merge pattern: for each range, compare its start with the max end_date seen so far. If start > max_end, it's a new group. Accumulate these group IDs with a running SUM, then aggregate.",
 hints:["For each row, compare its start_date to the maximum end_date of all previous rows for that employee.","If start_date > max_previous_end, this range starts a new group.","Use a running SUM of the 'new group' flag to assign group IDs, then aggregate MIN/MAX."],
 tests:[
  {setup:`DROP TABLE IF EXISTS EmployeeLeave; CREATE TABLE EmployeeLeave(emp_id INT, start_date DATE, end_date DATE);
   INSERT INTO EmployeeLeave VALUES (1,'2025-03-01','2025-03-05'),(1,'2025-03-03','2025-03-08'),(1,'2025-03-10','2025-03-15'),(2,'2025-03-01','2025-03-04'),(2,'2025-03-05','2025-03-09'),(2,'2025-03-12','2025-03-15');`,
   rows:[[1,'2025-03-01','2025-03-08'],[1,'2025-03-10','2025-03-15'],[2,'2025-03-01','2025-03-09'],[2,'2025-03-12','2025-03-15']]}
 ]},
{id:69,title:"Q69 · Count Events Per Funnel Stage",difficulty:"Easy",topic:"Advanced Analytics",
 desc:"FunnelEvents(event_id INT, user_id INT, stage VARCHAR)\nstages: visit, signup, trial, purchase\n\nCount distinct users who reached each funnel stage.\nReturn: stage, user_count",
 setup:`DROP TABLE IF EXISTS FunnelEvents;
 CREATE TABLE FunnelEvents(event_id INT, user_id INT, stage VARCHAR);
 INSERT INTO FunnelEvents VALUES
 (1,1,'visit'),(2,2,'visit'),(3,3,'visit'),(4,4,'visit'),
 (5,1,'signup'),(6,2,'signup'),(7,3,'signup'),
 (8,1,'trial'),(9,2,'trial'),
 (10,1,'purchase');`,
 tables:["funnelevents"],
 cols:["stage","user_count"],
 rows:[['visit',4],['signup',3],['trial',2],['purchase',1]],
 solution:`SELECT stage, COUNT(DISTINCT user_id) AS user_count
FROM FunnelEvents
GROUP BY stage
ORDER BY CASE stage WHEN 'visit' THEN 1 WHEN 'signup' THEN 2 WHEN 'trial' THEN 3 WHEN 'purchase' THEN 4 END`,
 tips:"COUNT(DISTINCT user_id) per stage is the simplest funnel count. The CASE in ORDER BY enforces funnel ordering since alphabetical order would be wrong.",
 hints:["GROUP BY stage and COUNT(DISTINCT user_id) for each.","Use a CASE expression in ORDER BY to get funnel order (visit → signup → trial → purchase).","DISTINCT ensures a user counted twice in a stage is only counted once."],
 tests:[
  {setup:`DROP TABLE IF EXISTS FunnelEvents; CREATE TABLE FunnelEvents(event_id INT, user_id INT, stage VARCHAR);
   INSERT INTO FunnelEvents VALUES
   (1,1,'visit'),(2,2,'visit'),(3,3,'visit'),(4,4,'visit'),(5,5,'visit'),
   (6,1,'signup'),(7,2,'signup'),(8,3,'signup'),(9,4,'signup'),
   (10,1,'trial'),(11,2,'trial'),(12,3,'trial'),
   (13,1,'purchase'),(14,2,'purchase');`,
   rows:[['visit',5],['signup',4],['trial',3],['purchase',2]]}
 ]},

{id:70,title:"Q70 · Signup-to-First-Action Conversion",difficulty:"Easy",topic:"Advanced Analytics",
 desc:"Users(user_id INT, signup_date DATE)\nActions(user_id INT, action_date DATE)\n\nCalculate the overall conversion rate (% of users who took at least one action after signing up).\nReturn: total_users, converted_users, conversion_rate",
 setup:`DROP TABLE IF EXISTS Users; DROP TABLE IF EXISTS Actions;
 CREATE TABLE Users(user_id INT, signup_date DATE);
 CREATE TABLE Actions(user_id INT, action_date DATE);
 INSERT INTO Users VALUES (1,'2025-01-01'),(2,'2025-01-02'),(3,'2025-01-03'),(4,'2025-01-04');
 INSERT INTO Actions VALUES (1,'2025-01-05'),(2,'2025-01-06'),(3,'2025-01-10');`,
 tables:["users","actions"],
 cols:["total_users","converted_users","conversion_rate"],
 rows:[[4,3,75.00]],
 solution:`SELECT
  COUNT(DISTINCT u.user_id) AS total_users,
  COUNT(DISTINCT a.user_id) AS converted_users,
  ROUND(100.0 * COUNT(DISTINCT a.user_id) / COUNT(DISTINCT u.user_id), 2) AS conversion_rate
FROM Users u
LEFT JOIN Actions a ON u.user_id = a.user_id AND a.action_date > u.signup_date`,
 tips:"LEFT JOIN preserves all users. COUNT(DISTINCT a.user_id) counts only users with a post-signup action (NULLs excluded). Divide by total and multiply by 100.",
 hints:["LEFT JOIN Users with Actions so all users are included.","Filter to actions after signup_date in the JOIN condition.","COUNT(DISTINCT u.user_id) for total, COUNT(DISTINCT a.user_id) for converted."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Users; DROP TABLE IF EXISTS Actions;
   CREATE TABLE Users(user_id INT, signup_date DATE);
   CREATE TABLE Actions(user_id INT, action_date DATE);
   INSERT INTO Users VALUES (1,'2025-02-01'),(2,'2025-02-01'),(3,'2025-02-01'),(4,'2025-02-01'),(5,'2025-02-01');
   INSERT INTO Actions VALUES (1,'2025-02-05'),(2,'2025-02-10');`,
   rows:[[5,2,40.00]]}
 ]},

{id:71,title:"Q71 · Weekly Active Users Count",difficulty:"Easy",topic:"Advanced Analytics",
 desc:"UserActivity(user_id INT, activity_date DATE)\n\nCount distinct active users per calendar week (using EXTRACT(WEEK)).\nReturn: week_number, active_users",
 setup:`DROP TABLE IF EXISTS UserActivity;
 CREATE TABLE UserActivity(user_id INT, activity_date DATE);
 INSERT INTO UserActivity VALUES
 (1,'2025-01-06'),(2,'2025-01-07'),(1,'2025-01-08'),
 (3,'2025-01-13'),(4,'2025-01-14'),(3,'2025-01-15'),(4,'2025-01-16');`,
 tables:["useractivity"],
 cols:["week_number","active_users"],
 rows:[[2,2],[3,2]],
 solution:`SELECT EXTRACT(WEEK FROM activity_date)::int AS week_number,
  COUNT(DISTINCT user_id) AS active_users
FROM UserActivity
GROUP BY EXTRACT(WEEK FROM activity_date)
ORDER BY week_number`,
 tips:"EXTRACT(WEEK FROM date) returns the ISO week number. COUNT(DISTINCT user_id) avoids double-counting users active multiple days in the same week.",
 hints:["Use EXTRACT(WEEK FROM activity_date) to get the week number.","GROUP BY week and COUNT(DISTINCT user_id).","Cast the week number to INT for clean output."],
 tests:[
  {setup:`DROP TABLE IF EXISTS UserActivity; CREATE TABLE UserActivity(user_id INT, activity_date DATE);
   INSERT INTO UserActivity VALUES (1,'2025-02-03'),(2,'2025-02-04'),(3,'2025-02-05'),(1,'2025-02-04'),(4,'2025-02-10'),(5,'2025-02-11'),(4,'2025-02-12');`,
   rows:[[6,3],[7,2]]}
 ]},

{id:72,title:"Q72 · Basic Cohort — Users by Signup Month",difficulty:"Easy",topic:"Advanced Analytics",
 desc:"Users(user_id INT, signup_date DATE)\n\nCount users grouped by their signup month (cohort).\nReturn: cohort_month, user_count",
 setup:`DROP TABLE IF EXISTS Users;
 CREATE TABLE Users(user_id INT, signup_date DATE);
 INSERT INTO Users VALUES
 (1,'2025-01-05'),(2,'2025-01-15'),(3,'2025-01-25'),
 (4,'2025-02-10'),(5,'2025-02-20'),
 (6,'2025-03-01');`,
 tables:["users"],
 cols:["cohort_month","user_count"],
 rows:[['2025-01',3],['2025-02',2],['2025-03',1]],
 solution:`SELECT TO_CHAR(signup_date, 'YYYY-MM') AS cohort_month,
  COUNT(user_id) AS user_count
FROM Users
GROUP BY TO_CHAR(signup_date, 'YYYY-MM')
ORDER BY cohort_month`,
 tips:"TO_CHAR(date, 'YYYY-MM') formats the date as a month string for grouping. This is the foundation of all cohort analyses — group users by their first action month.",
 hints:["Use TO_CHAR(signup_date, 'YYYY-MM') to extract the year-month.","GROUP BY the formatted month string.","COUNT users per group."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Users; CREATE TABLE Users(user_id INT, signup_date DATE);
   INSERT INTO Users VALUES (1,'2025-04-01'),(2,'2025-04-15'),(3,'2025-04-30'),(4,'2025-05-01'),(5,'2025-05-15'),(6,'2025-06-01');`,
   rows:[['2025-04',3],['2025-05',2],['2025-06',1]]}
 ]},

{id:73,title:"Q73 · Time Between First and Second Purchase",difficulty:"Medium",topic:"Advanced Analytics",
 desc:"Purchases(purchase_id INT, customer_id INT, purchase_date DATE)\n\nFor customers with at least 2 purchases, compute days between first and second purchase.\nReturn: customer_id, first_purchase, second_purchase, days_between",
 setup:`DROP TABLE IF EXISTS Purchases;
 CREATE TABLE Purchases(purchase_id INT, customer_id INT, purchase_date DATE);
 INSERT INTO Purchases VALUES
 (1,1,'2025-01-01'),(2,1,'2025-01-15'),(3,1,'2025-02-01'),
 (4,2,'2025-01-05'),(5,2,'2025-01-20'),
 (6,3,'2025-01-10');`,
 tables:["purchases"],
 cols:["customer_id","first_purchase","second_purchase","days_between"],
 rows:[[1,'2025-01-01','2025-01-15',14],[2,'2025-01-05','2025-01-20',15]],
 solution:`WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY purchase_date) AS rn
  FROM Purchases
)
SELECT r1.customer_id,
  r1.purchase_date AS first_purchase,
  r2.purchase_date AS second_purchase,
  r2.purchase_date - r1.purchase_date AS days_between
FROM ranked r1
JOIN ranked r2 ON r1.customer_id = r2.customer_id AND r1.rn = 1 AND r2.rn = 2
ORDER BY r1.customer_id`,
 tips:"Rank purchases per customer, then self-join on rn=1 and rn=2. PostgreSQL date subtraction gives days directly. This is more flexible than LEAD() when you need both dates explicitly.",
 hints:["Rank purchases per customer using ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY purchase_date).","Join the ranked CTE to itself: one join for rn=1, another for rn=2.","Subtract the dates to get days_between."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Purchases; CREATE TABLE Purchases(purchase_id INT, customer_id INT, purchase_date DATE);
   INSERT INTO Purchases VALUES (1,1,'2025-02-01'),(2,1,'2025-02-10'),(3,2,'2025-02-05'),(4,2,'2025-02-25'),(5,3,'2025-02-15');`,
   rows:[[1,'2025-02-01','2025-02-10',9],[2,'2025-02-05','2025-02-25',20]]}
 ]},

{id:74,title:"Q74 · Multi-Step Funnel Drop-Off Rates",difficulty:"Hard",topic:"Advanced Analytics",
 desc:"FunnelEvents(user_id INT, stage VARCHAR, event_time TIMESTAMP)\nstages in order: landing, signup, onboarding, purchase\n\nCount users at each stage and show drop-off rate from the previous stage.\nReturn: stage, users, dropoff_rate",
 setup:`DROP TABLE IF EXISTS FunnelEvents;
 CREATE TABLE FunnelEvents(user_id INT, stage VARCHAR, event_time TIMESTAMP);
 INSERT INTO FunnelEvents VALUES
 (1,'landing','2025-01-01 10:00'),(2,'landing','2025-01-01 10:05'),(3,'landing','2025-01-01 10:10'),(4,'landing','2025-01-01 10:15'),(5,'landing','2025-01-01 10:20'),
 (1,'signup','2025-01-01 10:02'),(2,'signup','2025-01-01 10:07'),(3,'signup','2025-01-01 10:12'),(4,'signup','2025-01-01 10:17'),
 (1,'onboarding','2025-01-01 10:05'),(2,'onboarding','2025-01-01 10:10'),(3,'onboarding','2025-01-01 10:15'),
 (1,'purchase','2025-01-01 10:10'),(2,'purchase','2025-01-01 10:20');`,
 tables:["funnelevents"],
 cols:["stage","users","dropoff_rate"],
 rows:[['landing',5,0.00],['signup',4,20.00],['onboarding',3,25.00],['purchase',2,33.33]],
 solution:`WITH stage_counts AS (
  SELECT stage, COUNT(DISTINCT user_id) AS users
  FROM FunnelEvents GROUP BY stage
),
ordered AS (
  SELECT stage, users,
    LAG(users) OVER (ORDER BY CASE stage WHEN 'landing' THEN 1 WHEN 'signup' THEN 2 WHEN 'onboarding' THEN 3 WHEN 'purchase' THEN 4 END) AS prev_users
  FROM stage_counts
)
SELECT stage, users,
  ROUND(COALESCE(100.0 * (prev_users - users) / prev_users, 0), 2) AS dropoff_rate
FROM ordered
ORDER BY CASE stage WHEN 'landing' THEN 1 WHEN 'signup' THEN 2 WHEN 'onboarding' THEN 3 WHEN 'purchase' THEN 4 END`,
 tips:"Count users per stage, then use LAG() to get the previous stage's count. Drop-off rate = (prev - current) / prev * 100. The CASE ordering ensures correct funnel sequence.",
 hints:["Count distinct users per stage first.","Use LAG() ordered by funnel sequence (CASE) to get the previous stage's count.","Drop-off = (prev_count - current_count) / prev_count * 100. First stage has 0% drop-off."],
 tests:[
  {setup:`DROP TABLE IF EXISTS FunnelEvents; CREATE TABLE FunnelEvents(user_id INT, stage VARCHAR, event_time TIMESTAMP);
   INSERT INTO FunnelEvents VALUES
   (1,'landing','2025-02-01 09:00'),(2,'landing','2025-02-01 09:01'),(3,'landing','2025-02-01 09:02'),(4,'landing','2025-02-01 09:03'),
   (1,'signup','2025-02-01 09:05'),(2,'signup','2025-02-01 09:06'),(3,'signup','2025-02-01 09:07'),
   (1,'onboarding','2025-02-01 09:10'),(2,'onboarding','2025-02-01 09:11'),
   (1,'purchase','2025-02-01 09:15');`,
   rows:[['landing',4,0.00],['signup',3,25.00],['onboarding',2,33.33],['purchase',1,50.00]]}
 ]},

{id:75,title:"Q75 · N-Day Rolling Retention Rate",difficulty:"Hard",topic:"Advanced Analytics",
 desc:"Users(user_id INT, signup_date DATE)\nActivity(user_id INT, activity_date DATE)\n\nFor each signup date, compute the 3-day, 7-day, and 14-day retention rates (% of users active exactly N days after signup).\nReturn: signup_date, total_users, day3_retained, day7_retained, day14_retained, day3_rate, day7_rate, day14_rate",
 setup:`DROP TABLE IF EXISTS Users; DROP TABLE IF EXISTS Activity;
 CREATE TABLE Users(user_id INT, signup_date DATE);
 CREATE TABLE Activity(user_id INT, activity_date DATE);
 INSERT INTO Users VALUES (1,'2025-01-01'),(2,'2025-01-01'),(3,'2025-01-01'),(4,'2025-01-01');
 INSERT INTO Activity VALUES (1,'2025-01-04'),(2,'2025-01-04'),(3,'2025-01-08'),(1,'2025-01-08'),(1,'2025-01-15'),(2,'2025-01-15');`,
 tables:["users","activity"],
 cols:["signup_date","total_users","day3_retained","day7_retained","day14_retained","day3_rate","day7_rate","day14_rate"],
 rows:[['2025-01-01',4,2,2,2,50.00,50.00,50.00]],
 solution:`SELECT u.signup_date,
  COUNT(DISTINCT u.user_id) AS total_users,
  COUNT(DISTINCT a3.user_id) AS day3_retained,
  COUNT(DISTINCT a7.user_id) AS day7_retained,
  COUNT(DISTINCT a14.user_id) AS day14_retained,
  ROUND(100.0 * COUNT(DISTINCT a3.user_id) / COUNT(DISTINCT u.user_id), 2) AS day3_rate,
  ROUND(100.0 * COUNT(DISTINCT a7.user_id) / COUNT(DISTINCT u.user_id), 2) AS day7_rate,
  ROUND(100.0 * COUNT(DISTINCT a14.user_id) / COUNT(DISTINCT u.user_id), 2) AS day14_rate
FROM Users u
LEFT JOIN Activity a3 ON u.user_id = a3.user_id AND a3.activity_date = u.signup_date + 3
LEFT JOIN Activity a7 ON u.user_id = a7.user_id AND a7.activity_date = u.signup_date + 7
LEFT JOIN Activity a14 ON u.user_id = a14.user_id AND a14.activity_date = u.signup_date + 14
GROUP BY u.signup_date`,
 tips:"Three LEFT JOINs, each with a different date offset. COUNT(DISTINCT) on each joined table counts only retained users (NULLs excluded). This is a common pattern for multi-day retention dashboards.",
 hints:["Use three separate LEFT JOINs to Activity — one each for day+3, day+7, and day+14.","The JOIN condition is a3.activity_date = u.signup_date + 3 (exact day match).","COUNT(DISTINCT a3.user_id) counts day-3 retained users; NULLs from LEFT JOIN are excluded."],
 tests:[
  {setup:`DROP TABLE IF EXISTS Users; DROP TABLE IF EXISTS Activity;
   CREATE TABLE Users(user_id INT, signup_date DATE);
   CREATE TABLE Activity(user_id INT, activity_date DATE);
   INSERT INTO Users VALUES (1,'2025-02-01'),(2,'2025-02-01'),(3,'2025-02-01'),(4,'2025-02-01'),(5,'2025-02-01');
   INSERT INTO Activity VALUES (1,'2025-02-04'),(2,'2025-02-04'),(3,'2025-02-04'),(1,'2025-02-08'),(2,'2025-02-08'),(1,'2025-02-15');`,
   rows:[['2025-02-01',5,3,2,1,60.00,40.00,20.00]]}
 ]},
]; /* end Q array */
