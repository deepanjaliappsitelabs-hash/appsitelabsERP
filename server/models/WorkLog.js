const pool = require("../config/db");

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS work_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      work_date DATE NOT NULL,
      work_mode VARCHAR(80) NULL,
      tasks JSON NOT NULL,
      blockers TEXT NULL,
      tomorrow_plan TEXT NULL,
      mood VARCHAR(50) NULL,
      productivity INT DEFAULT 0,
      links TEXT NULL,
      total_hours DECIMAL(5,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const mapWorkLog = (row) => ({
  ...row,
  _id: row.id,
  employeeId: row.employee_id,
  date: row.work_date,
  workMode: row.work_mode,
  tomorrowPlan: row.tomorrow_plan,
  totalHours: row.total_hours,
  tasks: typeof row.tasks === "string" ? JSON.parse(row.tasks || "[]") : row.tasks,
});

const createWorkLog = async (data = {}) => {
  await ensureTable();
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const totalHours = tasks.reduce((sum, task) => sum + (Number(task.hours) || 0), 0);
  const [result] = await pool.query(
    `INSERT INTO work_logs
      (employee_id, work_date, work_mode, tasks, blockers, tomorrow_plan, mood, productivity, links, total_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.employee_id || data.employeeId,
      data.date || new Date().toISOString().slice(0, 10),
      data.workMode || "",
      JSON.stringify(tasks),
      data.blockers || "",
      data.tomorrowPlan || "",
      data.mood || "",
      Number(data.productivity) || 0,
      data.links || "",
      totalHours,
    ]
  );
  return result.insertId;
};

const getByEmployee = async (employeeId) => {
  await ensureTable();
  const [rows] = await pool.query(
    `SELECT id, employee_id, DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
            work_mode, tasks, blockers, tomorrow_plan, mood, productivity,
            links, total_hours, created_at
     FROM work_logs
     WHERE employee_id = ?
     ORDER BY work_date DESC, created_at DESC`,
    [employeeId]
  );
  return rows.map(mapWorkLog);
};

const getById = async (id) => {
  await ensureTable();
  const [rows] = await pool.query(
    `SELECT id, employee_id, DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
            work_mode, tasks, blockers, tomorrow_plan, mood, productivity,
            links, total_hours, created_at
     FROM work_logs
     WHERE id = ?`,
    [id]
  );
  return rows[0] ? mapWorkLog(rows[0]) : null;
};

module.exports = { createWorkLog, getByEmployee, getById };
