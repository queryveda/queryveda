/** Formula signature hints for autocomplete — covers the most commonly taught functions */
export interface FormulaHint {
  name: string;
  signature: string;
  description: string;
}

export const formulaHints: FormulaHint[] = [
  // Math & Aggregation
  { name: "SUM", signature: "SUM(number1, [number2, ...])", description: "Adds all the numbers in a range of cells" },
  { name: "SUMIF", signature: "SUMIF(range, criteria, [sum_range])", description: "Adds cells that meet a condition" },
  { name: "SUMIFS", signature: "SUMIFS(sum_range, criteria_range1, criteria1, ...)", description: "Adds cells that meet multiple conditions" },
  { name: "SUMPRODUCT", signature: "SUMPRODUCT(array1, [array2, ...])", description: "Multiplies corresponding components and returns the sum" },
  { name: "AVERAGE", signature: "AVERAGE(number1, [number2, ...])", description: "Returns the arithmetic mean" },
  { name: "AVERAGEIF", signature: "AVERAGEIF(range, criteria, [average_range])", description: "Averages cells that meet a condition" },
  { name: "AVERAGEIFS", signature: "AVERAGEIFS(average_range, criteria_range1, criteria1, ...)", description: "Averages cells meeting multiple conditions" },
  { name: "COUNT", signature: "COUNT(value1, [value2, ...])", description: "Counts cells containing numbers" },
  { name: "COUNTA", signature: "COUNTA(value1, [value2, ...])", description: "Counts non-empty cells" },
  { name: "COUNTBLANK", signature: "COUNTBLANK(range)", description: "Counts empty cells in a range" },
  { name: "COUNTIF", signature: "COUNTIF(range, criteria)", description: "Counts cells that meet a condition" },
  { name: "COUNTIFS", signature: "COUNTIFS(criteria_range1, criteria1, ...)", description: "Counts cells meeting multiple conditions" },
  { name: "MAX", signature: "MAX(number1, [number2, ...])", description: "Returns the largest value" },
  { name: "MIN", signature: "MIN(number1, [number2, ...])", description: "Returns the smallest value" },
  { name: "PRODUCT", signature: "PRODUCT(number1, [number2, ...])", description: "Multiplies all numbers together" },
  { name: "SUBTOTAL", signature: "SUBTOTAL(function_num, ref1, ...)", description: "Returns a subtotal using a specified function" },

  // Math
  { name: "ABS", signature: "ABS(number)", description: "Returns the absolute value" },
  { name: "ROUND", signature: "ROUND(number, num_digits)", description: "Rounds to a specified number of digits" },
  { name: "ROUNDUP", signature: "ROUNDUP(number, num_digits)", description: "Rounds up, away from zero" },
  { name: "ROUNDDOWN", signature: "ROUNDDOWN(number, num_digits)", description: "Rounds down, toward zero" },
  { name: "CEILING", signature: "CEILING(number, significance)", description: "Rounds up to nearest multiple" },
  { name: "FLOOR", signature: "FLOOR(number, significance)", description: "Rounds down to nearest multiple" },
  { name: "MOD", signature: "MOD(number, divisor)", description: "Returns the remainder after division" },
  { name: "POWER", signature: "POWER(number, power)", description: "Returns number raised to a power" },
  { name: "SQRT", signature: "SQRT(number)", description: "Returns the square root" },
  { name: "INT", signature: "INT(number)", description: "Rounds down to the nearest integer" },
  { name: "RAND", signature: "RAND()", description: "Returns a random number between 0 and 1" },
  { name: "RANDBETWEEN", signature: "RANDBETWEEN(bottom, top)", description: "Returns a random integer between two values" },

  // Lookup
  { name: "VLOOKUP", signature: "VLOOKUP(lookup_value, table_array, col_index, [range_lookup])", description: "Vertical lookup — searches first column, returns from another" },
  { name: "HLOOKUP", signature: "HLOOKUP(lookup_value, table_array, row_index, [range_lookup])", description: "Horizontal lookup — searches first row, returns from another" },
  { name: "XLOOKUP", signature: "XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])", description: "Flexible lookup — searches any column/row, returns from another" },
  { name: "INDEX", signature: "INDEX(reference, row_num, [col_num])", description: "Returns the value at a given row and column" },
  { name: "MATCH", signature: "MATCH(search_key, range, [match_type])", description: "Returns the position of a value in a range" },
  { name: "LOOKUP", signature: "LOOKUP(search_key, search_range, [result_range])", description: "Looks up a value in a range" },

  // Text
  { name: "CONCATENATE", signature: "CONCATENATE(string1, [string2, ...])", description: "Joins strings together" },
  { name: "CONCAT", signature: "CONCAT(string1, [string2, ...])", description: "Joins strings together" },
  { name: "LEFT", signature: "LEFT(text, [num_chars])", description: "Returns characters from the start of a string" },
  { name: "RIGHT", signature: "RIGHT(text, [num_chars])", description: "Returns characters from the end of a string" },
  { name: "MID", signature: "MID(text, start_num, num_chars)", description: "Returns characters from the middle of a string" },
  { name: "LEN", signature: "LEN(text)", description: "Returns the length of a string" },
  { name: "TRIM", signature: "TRIM(text)", description: "Removes extra spaces" },
  { name: "UPPER", signature: "UPPER(text)", description: "Converts text to uppercase" },
  { name: "LOWER", signature: "LOWER(text)", description: "Converts text to lowercase" },
  { name: "PROPER", signature: "PROPER(text)", description: "Capitalizes the first letter of each word" },
  { name: "SUBSTITUTE", signature: "SUBSTITUTE(text, old_text, new_text, [instance])", description: "Replaces existing text with new text" },
  { name: "FIND", signature: "FIND(find_text, within_text, [start_num])", description: "Finds the position of a substring (case-sensitive)" },
  { name: "SEARCH", signature: "SEARCH(find_text, within_text, [start_num])", description: "Finds the position of a substring (case-insensitive)" },
  { name: "REPLACE", signature: "REPLACE(old_text, start_num, num_chars, new_text)", description: "Replaces part of a text string" },
  { name: "TEXT", signature: "TEXT(value, format_text)", description: "Formats a number as text" },
  { name: "VALUE", signature: "VALUE(text)", description: "Converts text to a number" },

  // Logic
  { name: "IF", signature: "IF(condition, value_if_true, [value_if_false])", description: "Returns one value if true, another if false" },
  { name: "IFS", signature: "IFS(condition1, value1, [condition2, value2, ...])", description: "Checks multiple conditions in order" },
  { name: "IFERROR", signature: "IFERROR(value, value_if_error)", description: "Returns a value if no error, otherwise the fallback" },
  { name: "AND", signature: "AND(logical1, [logical2, ...])", description: "Returns TRUE if all arguments are true" },
  { name: "OR", signature: "OR(logical1, [logical2, ...])", description: "Returns TRUE if any argument is true" },
  { name: "NOT", signature: "NOT(logical)", description: "Reverses the logic of its argument" },
  { name: "SWITCH", signature: "SWITCH(expression, case1, value1, ...)", description: "Matches an expression against a list of cases" },

  // Date
  { name: "TODAY", signature: "TODAY()", description: "Returns today's date" },
  { name: "NOW", signature: "NOW()", description: "Returns the current date and time" },
  { name: "DATE", signature: "DATE(year, month, day)", description: "Creates a date from components" },
  { name: "YEAR", signature: "YEAR(date)", description: "Returns the year of a date" },
  { name: "MONTH", signature: "MONTH(date)", description: "Returns the month of a date" },
  { name: "DAY", signature: "DAY(date)", description: "Returns the day of a date" },
  { name: "DATEDIF", signature: "DATEDIF(start_date, end_date, unit)", description: "Calculates the difference between two dates" },
  { name: "EDATE", signature: "EDATE(start_date, months)", description: "Returns a date shifted by months" },
  { name: "NETWORKDAYS", signature: "NETWORKDAYS(start_date, end_date, [holidays])", description: "Returns working days between two dates" },

  // Stats
  { name: "MEDIAN", signature: "MEDIAN(number1, [number2, ...])", description: "Returns the middle value" },
  { name: "LARGE", signature: "LARGE(data, k)", description: "Returns the k-th largest value" },
  { name: "SMALL", signature: "SMALL(data, k)", description: "Returns the k-th smallest value" },
  { name: "RANK", signature: "RANK(number, ref, [order])", description: "Returns the rank of a number in a list" },
  { name: "STDEV", signature: "STDEV(number1, [number2, ...])", description: "Estimates standard deviation from a sample" },
  { name: "CORREL", signature: "CORREL(data_y, data_x)", description: "Returns the correlation coefficient" },
  { name: "FORECAST", signature: "FORECAST(x, data_y, data_x)", description: "Predicts a value using linear regression" },
  { name: "PERCENTILE", signature: "PERCENTILE(data, k)", description: "Returns the k-th percentile" },
  { name: "FREQUENCY", signature: "FREQUENCY(data_array, bins_array)", description: "Counts how many values fall into each bin" },

  // Info
  { name: "ISBLANK", signature: "ISBLANK(value)", description: "Returns TRUE if the cell is empty" },
  { name: "ISNUMBER", signature: "ISNUMBER(value)", description: "Returns TRUE if the value is a number" },
  { name: "ISTEXT", signature: "ISTEXT(value)", description: "Returns TRUE if the value is text" },
  { name: "ISERROR", signature: "ISERROR(value)", description: "Returns TRUE if the value is an error" },

  // Reference
  { name: "ROW", signature: "ROW([reference])", description: "Returns the row number" },
  { name: "COLUMN", signature: "COLUMN([reference])", description: "Returns the column number" },
  { name: "ROWS", signature: "ROWS(array)", description: "Returns the number of rows in a range" },
  { name: "COLUMNS", signature: "COLUMNS(array)", description: "Returns the number of columns in a range" },
];

/** Map for O(1) lookup by name */
export const formulaHintMap = new Map(formulaHints.map((h) => [h.name, h]));
