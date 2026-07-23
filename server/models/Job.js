const pool = require("../config/db");

const getAllJobs = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM jobs ORDER BY created_at DESC"
  );
  return rows;
};

const getJobById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [id]);
  return rows[0];
};

const createJob = async (data) => {
  const { title, department, type, openings, status, description, requirements, salary_range, location, last_date } = data;
  const [result] = await pool.query(
    `INSERT INTO jobs (title, department, type, openings, status, description, requirements, salary_range, location, last_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, department, type || "Full-time", openings || 1, status || "Active", description, requirements, salary_range, location, last_date || null]
  );
  return result.insertId;
};

const updateJobStatus = async (id, status) => {
  await pool.query("UPDATE jobs SET status = ? WHERE id = ?", [status, id]);
};

const updateJob = async (id, data) => {
  const { title, department, type, openings, status, description, requirements, salary_range, location, last_date } = data;
  await pool.query(
    `UPDATE jobs SET title=?, department=?, type=?, openings=?, status=?, description=?, requirements=?, salary_range=?, location=?, last_date=? WHERE id=?`,
    [title, department, type, openings, status, description, requirements, salary_range, location, last_date || null, id]
  );
};

const deleteJob = async (id) => {
  await pool.query("UPDATE candidates SET job_id = NULL WHERE job_id = ?", [id]);
  await pool.query("DELETE FROM jobs WHERE id = ?", [id]);
};

module.exports = { getAllJobs, getJobById, createJob, updateJobStatus, updateJob, deleteJob };
