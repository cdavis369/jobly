"use strict";

const { sqlForPartialUpdate, sqlForCompanyFilters, sqlForJobFilters } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", () => {
  test("get correct SQL for partial update with valid input", () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };
    const jsToSql = { firstName: 'first_name', age: 'age' };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ['Aliya', 32],
    });
  });

  test("throw error for empty input", () => {
    const dataToUpdate = {};
    const jsToSql = { firstName: 'first_name', age: 'age' };
    const wrapper = () => sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(wrapper).toThrow("No data");
  });

});

describe("sqlForCompanyFilters", () => {
  test("3 filters", () => {
    const filters = {
      nameLike: "test",
      minEmployees: 10,
      maxEmployees: 100,
    };
    const result = sqlForCompanyFilters(filters);
    const expectedSQL = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name ILIKE 'test%' AND num_employees >= 10 AND num_employees <= 100 ORDER BY name`;
    expect(result).toEqual(expectedSQL.trim());
  });

    test("2 filters", () => {
    const filters = {
      nameLike: "test",
      maxEmployees: 100,
    };
    const result = sqlForCompanyFilters(filters);
    const expectedSQL = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name ILIKE 'test%' AND num_employees <= 100 ORDER BY name`;
    expect(result.trim()).toEqual(expectedSQL.trim());
  });

    test("1 filter", () => {
    const filters = {
      nameLike: "test",
    };
    const result = sqlForCompanyFilters(filters);
    const expectedSQL = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name ILIKE 'test%' ORDER BY name`;
    expect(result.trim()).toEqual(expectedSQL.trim());
  });

  test("Throws BadRequestError for minEmployees exceeding maxEmployees", () => {
    const filters = {
      minEmployees: 50,
      maxEmployees: 20,
    };
    const wrapper = () => sqlForCompanyFilters(filters);
    expect(wrapper).toThrow(BadRequestError);
    expect(wrapper).toThrow("Minimum employee filter exceeds max filter");
  });
});

describe('sqlForJobFilters', () => {
  test('title filter', () => {
    const filters = { title: 'c1' };
    const result = sqlForJobFilters(filters);
    const expected = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs WHERE title ILIKE 'c1%' ORDER BY company_handle`;
    expect(result).toBe(expected);
  });

  test('minSalary filter', () => {
    const filters = { minSalary: 100000 };
    const result = sqlForJobFilters(filters);
    const expected = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs WHERE salary >= 100000 ORDER BY company_handle`;
    expect(result).toBe(expected);
  });

  test('hasEquity filter (true)', () => {
    const filters = { hasEquity: true };
    const result = sqlForJobFilters(filters);
    const expected = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs WHERE equity > 0.0 ORDER BY company_handle`;
    expect(result).toBe(expected);
  });

    test('hasEquity filter (false)', () => {
    const filters = { hasEquity: false };
    const result = sqlForJobFilters(filters);
    const expected = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs ORDER BY company_handle`;
    expect(result).toBe(expected);
  });

  test('3 filters', () => {
    const filters = { title: 'c1', minSalary: 100000, hasEquity: true };
    const result = sqlForJobFilters(filters);
    const expected = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs WHERE title ILIKE 'c1%' AND salary >= 100000 AND equity > 0.0 ORDER BY company_handle`;
    expect(result).toBe(expected);
  });

  test('2 filters', () => {
    const filters = { minSalary: 100000, hasEquity: true };
    const result = sqlForJobFilters(filters);
    const expected = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs WHERE salary >= 100000 AND equity > 0.0 ORDER BY company_handle`;
    expect(result).toBe(expected);
  });

  test('without filters', () => {
    const result = sqlForJobFilters();
    const expected = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs ORDER BY company_handle`;
    expect(result).toBe(expected);
  });

  test('empty filters', () => {
    const filters = {};
    const result = sqlForJobFilters(filters);
    const expected = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs ORDER BY company_handle`;
    expect(result).toBe(expected);
  });
});