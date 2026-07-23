const pool = require("../config/db");

const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      user_role VARCHAR(50) NULL,
      ip VARCHAR(80) NULL,
      device VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      user_role VARCHAR(50) NULL,
      action VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const recordLogin = async ({ userId, role, ip, device }) => {
  await ensureTables();
  await pool.query(
    `INSERT INTO login_history (user_id, user_role, ip, device) VALUES (?, ?, ?, ?)`,
    [userId || null, role || "", ip || "", device || ""]
  );
};

const recordActivity = async ({ userId, role, action }) => {
  await ensureTables();
  await pool.query(
    `INSERT INTO activity_logs (user_id, user_role, action) VALUES (?, ?, ?)`,
    [userId || null, role || "", action]
  );
};

const getLoginHistory = async (userId) => {
  await ensureTables();
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS date, ip, device
     FROM login_history
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId]
  );
  return rows;
};

const getActivities = async (userId) => {
  await ensureTables();
  const [rows] = await pool.query(
    `SELECT id, action, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS date
     FROM activity_logs
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId]
  );
  return rows;
};

module.exports = { recordLogin, recordActivity, getLoginHistory, getActivities };
