const pool = require("../config/db");

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS interviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NULL,
      candidate_name VARCHAR(150) NULL,
      job_title VARCHAR(150) NULL,
      interview_date DATE NULL,
      interview_time TIME NULL,
      mode VARCHAR(50) NULL,
      interviewer VARCHAR(150) NULL,
      notes TEXT NULL,
      status VARCHAR(50) DEFAULT 'Scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const mapInterview = (row) => ({
  ...row,
  _id: row.id,
  candidateId: row.candidate_id,
  candidateName: row.candidate_name,
  jobTitle: row.job_title,
  interviewDate: row.interview_date,
  interviewTime: row.interview_time,
});

const createInterview = async (data = {}) => {
  await ensureTable();
  const candidateId = data.candidateId || data.candidate_id || null;
  const candidateName = data.candidateName || data.candidate_name || data.name || "";
  const jobTitle = data.jobTitle || data.job_title || data.applied_for || "";
  const interviewDate = data.interviewDate || data.interview_date || data.date || null;
  const interviewTime = data.interviewTime || data.interview_time || data.time || null;

  const [result] = await pool.query(
    `INSERT INTO interviews
      (candidate_id, candidate_name, job_title, interview_date, interview_time, mode, interviewer, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      candidateId,
      candidateName,
      jobTitle,
      interviewDate,
      interviewTime,
      data.mode || "Online",
      data.interviewer || "",
      data.notes || "",
      data.status || "Scheduled",
    ]
  );
  return result.insertId;
};

const getInterviewById = async (id) => {
  await ensureTable();
  const [rows] = await pool.query(
    `SELECT id, candidate_id, candidate_name, job_title,
            DATE_FORMAT(interview_date, '%Y-%m-%d') AS interview_date,
            TIME_FORMAT(interview_time, '%H:%i') AS interview_time,
            mode, interviewer, notes, status, created_at
     FROM interviews
     WHERE id = ?`,
    [id]
  );
  return rows[0] ? mapInterview(rows[0]) : null;
};

module.exports = { createInterview, getInterviewById };
