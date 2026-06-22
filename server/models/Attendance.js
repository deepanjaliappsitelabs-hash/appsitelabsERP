// models/Attendance.js
const pool = require("../config/db");

let attendanceColumnsReady = false;

const ensureAttendanceColumns = async () => {
  if (attendanceColumnsReady) return;

  const [cols] = await pool.query("SHOW COLUMNS FROM attendance");
  const existingColumns = new Set(cols.map((col) => col.Field));

  if (!existingColumns.has("late_note")) {
    await pool.query("ALTER TABLE attendance ADD COLUMN late_note TEXT NULL AFTER status");
  }

  if (!existingColumns.has("check_in_latitude")) {
    await pool.query("ALTER TABLE attendance ADD COLUMN check_in_latitude DECIMAL(10, 8) NULL AFTER late_note");
  }

  if (!existingColumns.has("check_in_longitude")) {
    await pool.query("ALTER TABLE attendance ADD COLUMN check_in_longitude DECIMAL(11, 8) NULL AFTER check_in_latitude");
  }

  if (!existingColumns.has("check_in_distance_meters")) {
    await pool.query("ALTER TABLE attendance ADD COLUMN check_in_distance_meters INT NULL AFTER check_in_longitude");
  }

  if (!existingColumns.has("location_verified")) {
    await pool.query("ALTER TABLE attendance ADD COLUMN location_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER check_in_distance_meters");
  }

  attendanceColumnsReady = true;
};

const createAttendance = async ({
  employee_id,
  employeeName,
  date,
  checkIn,
  checkOut,
  totalHours,
  status,
  lateNote,
  latitude,
  longitude,
  distance_meters,
  location_verified,
}) => {
  await ensureAttendanceColumns();
  const [result] = await pool.query(
    `INSERT INTO attendance
      (employee_id, date, check_in, check_out, total_hours, status, late_note,
       check_in_latitude, check_in_longitude, check_in_distance_meters, location_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employee_id,
      date,
      checkIn,
      checkOut,
      totalHours,
      status || "present",
      lateNote || null,
      latitude ?? null,
      longitude ?? null,
      distance_meters ?? null,
      location_verified ?? 0,
    ]
  );
  return result.insertId;
};

const getAttendanceById = async (id) => {
  await ensureAttendanceColumns();
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.employee_id,
       DATE_FORMAT(a.date, '%Y-%m-%d')   AS date,
       TIME_FORMAT(a.check_in, '%H:%i')  AS check_in,
       TIME_FORMAT(a.check_out, '%H:%i') AS check_out,
       a.total_hours,
       a.status,
       a.late_note                       AS lateNote,
       a.late_note                       AS late_note,
       a.check_in_latitude,
       a.check_in_longitude,
       a.check_in_distance_meters,
       a.location_verified,
       e.name                            AS employeeName,
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

const updateAttendance = async (id, { check_in, check_out, status, date, total_hours, late_note }) => {
  await ensureAttendanceColumns();
  await pool.query(
    `UPDATE attendance
     SET check_in = ?, check_out = ?, status = ?, date = ?, total_hours = ?, late_note = ?
     WHERE id = ?`,
    [check_in, check_out, status, date, total_hours, late_note, id]
  );
};

const getAllAttendance = async () => {
  await ensureAttendanceColumns();
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.employee_id,
       DATE_FORMAT(a.date, '%Y-%m-%d')   AS date,
       TIME_FORMAT(a.check_in, '%H:%i')  AS check_in,
       TIME_FORMAT(a.check_out, '%H:%i') AS check_out,
       a.total_hours,
       a.status,
       a.late_note                       AS lateNote,
       a.late_note                       AS late_note,
       a.check_in_latitude,
       a.check_in_longitude,
       a.check_in_distance_meters,
       a.location_verified,
       e.name                            AS employeeName,
       e.department
     FROM attendance a
     LEFT JOIN employees e ON a.employee_id = e.id
     ORDER BY a.date DESC`
  );
  return rows;
};

const getAttendanceByEmployee = async (employee_id) => {
  await ensureAttendanceColumns();
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.employee_id,
       DATE_FORMAT(a.date, '%Y-%m-%d')   AS date,
       TIME_FORMAT(a.check_in, '%H:%i')  AS check_in,
       TIME_FORMAT(a.check_out, '%H:%i') AS check_out,
       a.total_hours,
       a.status,
       a.late_note                       AS lateNote,
       a.late_note                       AS late_note,
       a.check_in_latitude,
       a.check_in_longitude,
       a.check_in_distance_meters,
       a.location_verified
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
  await ensureAttendanceColumns();
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
