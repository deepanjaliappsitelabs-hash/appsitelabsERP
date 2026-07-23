// models/Leave.js
const pool = require("../config/db");

const leaveSelect = `
  SELECT
    l.id,
    l.employee_id,
    l.employee_id AS employeeId,
    l.leave_type AS leaveType,
    l.from_date AS fromDate,
    l.to_date AS toDate,
    l.reason,
    l.status,
    l.created_at AS createdAt,
    e.employeeId AS employeeCode,
    e.name AS employeeName,
    e.email AS employeeEmail,
    e.department,
    e.designation
  FROM leaves l
  LEFT JOIN employees e ON l.employee_id = e.id
`;

// Apply for leave.
const createLeave = async ({ employee_id, leaveType, fromDate, toDate, reason }) => {
  const [result] = await pool.query(
    `INSERT INTO leaves (employee_id, leave_type, from_date, to_date, reason, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [employee_id, leaveType, fromDate, toDate, reason]
  );
  return result.insertId;
};

// Fetch all leaves for admin.
const getAllLeaves = async () => {
  const [rows] = await pool.query(
    `${leaveSelect}
     ORDER BY l.created_at DESC`
  );
  return rows;
};

// Fetch leaves for one employee.
const getLeavesByEmployee = async (employee_id) => {
  const [rows] = await pool.query(
    `${leaveSelect}
     WHERE l.employee_id = ?
     ORDER BY l.created_at DESC`,
    [employee_id]
  );
  return rows;
};

const getLeaveById = async (id) => {
  const [rows] = await pool.query(
    `${leaveSelect}
     WHERE l.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0];
};

// Update leave status as approved or rejected.
const updateLeaveStatus = async (id, status) => {
  await pool.query(
    `UPDATE leaves SET status = ? WHERE id = ?`,
    [status, id]
  );
};

const deleteLeave = async (id) => {
  await pool.query("DELETE FROM leaves WHERE id = ?", [id]);
};

const getLeaveBalance = async (employee_id) => {
  const [rows] = await pool.query(
    `SELECT leave_type AS leaveType,
            COALESCE(SUM(DATEDIFF(to_date, from_date) + 1), 0) AS used
     FROM leaves
     WHERE employee_id = ? AND status = 'approved'
     GROUP BY leave_type`,
    [employee_id]
  );

  const balance = {
    "Casual Leave":    { total: 12, used: 0 },
    "Sick Leave":      { total: 10, used: 0 },
    "Earned Leave":    { total: 15, used: 0 },
    "Maternity Leave": { total: 90, used: 0 },
    "Paternity Leave": { total: 15, used: 0 },
    "Unpaid Leave":    { total: 30, used: 0 },
  };

  rows.forEach(({ leaveType, used }) => {
    if (!balance[leaveType]) balance[leaveType] = { total: 0, used: 0 };
    balance[leaveType].used = Number(used) || 0;
  });

  return balance;
};

module.exports = {
  createLeave,
  getAllLeaves,
  getLeavesByEmployee,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave,
  getLeaveBalance,
};
