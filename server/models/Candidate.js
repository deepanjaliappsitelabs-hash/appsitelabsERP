// server/models/Candidate.js
const pool = require("../config/db");

const getAllCandidates = async () => {
  const [rows] = await pool.query(
    `SELECT c.*, j.title as job_title
     FROM candidates c
     LEFT JOIN jobs j ON c.job_id = j.id
     ORDER BY c.created_at DESC`
  );
  return rows;
};

const getCandidateById = async (id) => {
  const [rows] = await pool.query(
    `SELECT c.*, j.title as job_title
     FROM candidates c
     LEFT JOIN jobs j ON c.job_id = j.id
     WHERE c.id = ?`, [id]
  );
  return rows[0];
};

const createCandidate = async (data) => {
  const { job_id, name, email, phone, applied_for, stage, date_applied, resume, notes } = data;
  const [result] = await pool.query(
    `INSERT INTO candidates (job_id, name, email, phone, applied_for, stage, date_applied, resume, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [job_id || null, name, email, phone, applied_for, stage || "Applied", date_applied || null, resume, notes]
  );
  if (job_id) {
    await pool.query("UPDATE jobs SET applications = applications + 1 WHERE id = ?", [job_id]);
  }
  return result.insertId;
};

const updateCandidateStage = async (id, stage) => {
  await pool.query("UPDATE candidates SET stage = ? WHERE id = ?", [stage, id]);
};

const deleteCandidate = async (id) => {
  const candidate = await getCandidateById(id);
  await pool.query("DELETE FROM candidates WHERE id = ?", [id]);

  if (candidate?.job_id) {
    await pool.query(
      "UPDATE jobs SET applications = GREATEST(applications - 1, 0) WHERE id = ?",
      [candidate.job_id]
    );
  }
};

module.exports = {
  getAllCandidates,
  getCandidateById,
  createCandidate,
  updateCandidateStage,
  deleteCandidate,
};
