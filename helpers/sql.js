const { BadRequestError } = require("../expressError");

/* update a subset of SQL columns */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // return cols = ['"first_name"=$1', '"age"=$2'];
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/* Filter function for finding companies.

 * Takes provided filters and returns SQL SELECT query with correct WHERE parameters.

 * checks for:
 *    nameLike
 *    min_employee count
 *    max_employee count
 * 
 * Works for any number of filters.
 * */
function sqlForCompanyFilters(filters = null) {
  if (filters) {
    const sqlFilters = [];
    if (filters.minEmployees && filters.maxEmployees && filters.minEmployees > filters.maxEmployees) 
      throw new BadRequestError("Minimum employee filter exceeds max filter");    
    if (filters.nameLike) 
      sqlFilters.push(`name ILIKE '${filters.nameLike}%'`);
    if (filters.minEmployees) 
      sqlFilters.push(`num_employees >= ${filters.minEmployees}`);
    if (filters.maxEmployees) 
      sqlFilters.push(`num_employees <= ${filters.maxEmployees}`);
      
    const sqlWHERE = sqlFilters.length ? ` WHERE ${sqlFilters.join(" AND ")} ` : ' ';
      
    const sql = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies${sqlWHERE}ORDER BY name`;
    return sql;
  }
  return `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies ORDER BY name`; 
}

/* Filter function finding jobs

 * Takes provided filters and return SQL SELECT query with correct WHERE parameters.

 * Checks for:
 *    title
 *    salary
 *    equity
 * 
 * Works for any number of filters.
 * */
function sqlForJobFilters(filters = null) {
  if (filters) {
    const sqlFilters = [];
    if (filters.title) 
      sqlFilters.push(`title ILIKE '${filters.title}%'`);
    if (filters.minSalary) 
      sqlFilters.push(`salary >= ${filters.minSalary}`);
    if (filters.hasEquity) 
      sqlFilters.push(`equity > 0.0`);
      
    const sqlWHERE = sqlFilters.length ? ` WHERE ${sqlFilters.join(" AND ")} ` : ' ';
      
    const sql = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs${sqlWHERE}ORDER BY company_handle`;
    return sql;
  }
  return `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs ORDER BY company_handle`
}

module.exports = { 
  sqlForPartialUpdate,
  sqlForCompanyFilters,
  sqlForJobFilters
};
