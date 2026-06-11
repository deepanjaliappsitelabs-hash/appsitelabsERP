// models/Attendance.js
const pool = require("../config/db");

const createAttendance = async ({ employee_id, employeeName, date, checkIn, status }) => {
  const [result] = await pool.query(
    `INSERT INTO attendance (employee_id, date, check_in, status)
     VALUES (?, ?, ?, ?)`,
    [employee_id, date, checkIn, status || "present"]
  );
  return result.insertId;
};

const getAttendanceById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.employee_id,
       DATE_FORMAT(a.date, '%Y-%m-%d')    AS date,
       TIME_FORMAT(a.check_in, '%H:%i')   AS check_in,
       TIME_FORMAT(a.check_out, '%H:%i')  AS check_out,
       a.total_hours,
       a.status,
       e.name        AS employeeName,
       e.department
     FROM attendance a
     LEFT JOIN employees e ON a.employee_id = e.id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0];
};

const updateCheckOut = async (id, checkOut, totalHours) => {
  await pool.query(
    `UPDATE attendance SET check_out = ?, total_hours = ? WHERE id = ?`,
    [checkOut, totalHours, id]
  );
};

// ── NEW: General update ───────────────────────────────────────────────────────
const updateAttendance = async (id, { check_in, check_out, status, date, total_hours }) => {
  await pool.query(
    `UPDATE attendance
     SET check_in = ?, check_out = ?, status = ?, date = ?, total_hours = ?
     WHERE id = ?`,
    [check_in, check_out, status, date, total_hours, id]
  );
};

const getAllAttendance = async () => {
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.employee_id,
       DATE_FORMAT(a.date, '%Y-%m-%d')    AS date,
       TIME_FORMAT(a.check_in, '%H:%i')   AS check_in,
       TIME_FORMAT(a.check_out, '%H:%i')  AS check_out,
       a.total_hours,
       a.status,
       e.name        AS employeeName,
       e.department
     FROM attendance a
     LEFT JOIN employees e ON a.employee_id = e.id
     ORDER BY a.date DESC`
  );
  return rows;
};

const getAttendanceByEmployee = async (employee_id) => {
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.employee_id,
       DATE_FORMAT(a.date, '%Y-%m-%d')    AS date,
       TIME_FORMAT(a.check_in, '%H:%i')   AS check_in,
       TIME_FORMAT(a.check_out, '%H:%i')  AS check_out,
       a.total_hours,
       a.status
     FROM attendance a
     WHERE a.employee_id = ?
     ORDER BY a.date DESC`,
    [employee_id]
  );
  return rows;
};

const getTodayAttendance = async (
  employee_id,
  date = new Date().toISOString().split("T")[0]
) => {
  const [rows] = await pool.query(
    `SELECT * FROM attendance WHERE employee_id = ? AND date = ?`,
    [employee_id, date]
  );
  return rows[0];
};

const deleteAttendance = async (id) => {
  await pool.query("DELETE FROM attendance WHERE id = ?", [id]);
};

module.exports = {
  createAttendance,
  getAttendanceById,
  updateCheckOut,
  updateAttendance,
  getAllAttendance,
  getAttendanceByEmployee,
  getTodayAttendance,
  deleteAttendance,
};