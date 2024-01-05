const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForCompanyFilters } = require("../helpers/sql");

/** Related functions for companies */

class Job {
  /** Create a job (from data), update db, return new job data.
   * 
   * data should be { title, salary, equity, company_handle} }
   * 
   * Returns { title, salary, equity, companyHandle }
   * 
   * Throws BadReqestError if job is already in database.
   */

  static async create({title, salary, equity, company_handle}) {
   const duplicateCheck = await db.query(
          `SELECT title
           FROM jobs
           WHERE title = $1 AND company_handle = $2`,
        [title, company_handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title} - ${company_handle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle as "companyHandle"`,
        [
          title,
          salary,
          equity,
          company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   * 
   * Return [{ title, salary, equity, companyHandle }, ...]
   */

  static async findAll() {
    const sql = `SELECT title, salary, equity, company_handle as "companyHandle" FROM jobs`;
    const jobs = await db.query(sql);
    if (!jobs.rows.length) throw new NotFoundError(`There are no jobs listed`);
    return jobs.rows;
  }

  /** Given a company handle, return data about jobs in that company.
   * 
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * 
   * Throws NotFoundError if not found.
   */

  static async findJobsInCompany(companyHandle) {
    const sql = `SELECT title, salary, equity, company_handle as "companyHandle"
                FROM jobs 
                WHERE company_handle = $1`;
    
    const jobsRes = await db.query(sql, [companyHandle]);

    const jobs = jobsRes.rows;
    if (!jobs.length) throw new NotFoundError(`No company: ${companyHandle}`);

    return jobs;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async updateJob(title, companyHandle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title: "title",
          salary: "salary",
          equity: "equity"
        });

    const titleVarIdx = "$" + (values.length + 1);
    const handleVarIdx = "$" + (values.length + 2);

    const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE title = ${titleVarIdx} AND company_handle = ${handleVarIdx}
                      RETURNING title, salary, equity, company_handle as "companyHandle"`
    const result = await db.query(querySql, [...values, title, companyHandle]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title} - ${companyHandle}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(title, companyHandle) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE title = $1 AND company_handle = $2
           RETURNING title, company_handle`,
        [title, companyHandle]);
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`Company not found: ${companyHandle}`);
  }
}

module.exports = Job;