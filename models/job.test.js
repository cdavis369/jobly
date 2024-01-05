"use strict";

const db = require('../db.js');
const Job = require('./job');
const { BadRequestError, NotFoundError } = require('../expressError');

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

describe('Job class', function () {
  describe('create', function () {
    const newJob = {
      title: "QA",
      salary: 60000,
      equity: 0.01,
      company_handle: "c1"
    };
    test('create', async function () {
      const job = await Job.create(newJob);
      expect(job).toEqual(
        {
        title: "QA",
        salary: 60000,
        equity: "0.01",
        companyHandle: "c1",
        }
      );
    });

    test('BadRequestError', async function () {
      await Job.create(newJob);
      await expect(Job.create(newJob)).rejects.toThrow(BadRequestError);
    });
  });

  describe('findAll', function () {
    test('NotFoundError', async function () {
      await db.query('DELETE FROM jobs');
      await expect(Job.findAll()).rejects.toThrow(NotFoundError);
    });

    test('returns all jobs', async function () {
      const jobs = await Job.findAll();
      expect(jobs).toHaveLength(9);
    });
  });

  describe('findJobsInCompany method', function () {
    test('NotFoundError', async function () {
      await expect(Job.findJobsInCompany('nonexistent')).rejects.toThrow(NotFoundError);
    });

    test('get jobs', async function () {
      const jobs = await Job.findJobsInCompany('c1');
      expect(jobs).toHaveLength(3);
    });
  });

  describe('update', function () {
    test('updates job', async function () {
      const updatedData = {
        salary: 120000,
        equity: 0.02
      };
      const updatedJob = await Job.updateJob('j1', 'c1', updatedData);

      expect(updatedJob).toEqual({
        title: 'j1',
        salary: 120000,
        equity: '0.02',
        companyHandle: 'c1'
      });
    });

    test('NotFoundError', async function () {
      const updatedData = {
        salary: 120000,
        equity: 0.02
      };

      // Attempt to update a nonexistent job
      await expect(Job.updateJob('nonexistent', 'c1', updatedData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', function () {
    test('removes the job from the database', async function () {
      await Job.remove('j1', 'c1');
      const query = await db.query('SELECT * FROM jobs');
      expect(query.rows.length).toEqual(8)
    });

    test('NotFoundError', async function () {
      // Attempt to remove a nonexistent job
      await expect(Job.remove('nonexistent', 'c1')).rejects.toThrow(NotFoundError);
    });
  });
});
