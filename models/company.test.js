"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img"
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    var companies = await Company.findAll();
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img"
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img"
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ]);
  });
  test("works: 1 filter", async function () {
    var filters = {nameLike: "C1"}
    var companies = await Company.findAll(filters);
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img"
      }
    ]);

    filters = {minEmployees: 2}
    companies = await Company.findAll(filters);
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img"
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ]);

    filters = {maxEmployees: 2}
    companies = await Company.findAll(filters);
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img"
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img"
      }
    ]);
  });
  test("works: 2 filters", async function () {
    var filters = {nameLike: "c", minEmployees: 2}
    var companies = await Company.findAll(filters);
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img"
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ]);
  });
  test("works: 3 filters", async function () {
    var filters = {nameLike: "c", minEmployees: 2, maxEmployees: 2}
    var companies = await Company.findAll(filters);
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img"
      }
    ]);
    filters = {nameLike: "c", minEmployees: 1, maxEmployees: 3}
    companies = await Company.findAll(filters);
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img"
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img"
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ]);
    filters = {nameLike: "d", minEmployees: 1, maxEmployees: 3}
    companies = await Company.findAll(filters);
    expect(companies).toEqual([]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: 'c1',
      name: 'C1',
      description: 'Desc1',
      numEmployees: 1,
      logoUrl: 'http://c1.img',
      jobs: [
        {
          title: 'j1',
          salary: 100000,
          equity: '0.01',
          companyHandle: 'c1'
        },
        {
          title: 'j2',
          salary: 120000,
          equity: '0.02',
          companyHandle: 'c1'
        },
        {
          title: 'j3',
          salary: 130000,
          equity: '0.03',
          companyHandle: 'c1'
        }
      ]
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img"
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
