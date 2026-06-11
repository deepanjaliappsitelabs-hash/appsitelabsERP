// controllers/attendanceController.js
const Attendance = require("../models/Attendance");

const today = () => new Date().toISOString().slice(0, 10);
const currentTime = () => new Date().toTimeString().slice(0, 5);

const normalizeStatus = (status) => {
  const value = String(status || "present").toLowerCase();
  const map = {
    present:    "present",
    absent:     "absent",
    late:       "late",
    "half day": "half-day",
    "half-day": "half-day",
    "on leave": "on leave",
    wfh:        "wfh",
  };
  return map[value] || "present";
};

const decimalHours = (start, end) => {
  if (!start || !end) return null;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute]     = end.split(":").map(Number);
  const diffMinutes = Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute));
  return Number((diffMinutes / 60).toFixed(2));
};

const toTitleStatus = (status = "") => {
  const map = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    "half-day": "Half Day",
    "on leave": "On Leave",
    wfh: "WFH",
  };
  const value = String(status).toLowerCase();
  return map[value] || String(status || "Present");
};

const emitAdminAttendanceNotification = (req, eventName, record, action) => {
  const io = req.app.get("io");
  if (!io || !record) return;

  const employeeName = record.employeeName || record.employee_name || `Employee #${record.employee_id || ""}`.trim();
  io.to("admins").emit(eventName, {
    attendance: record,
    notification: {
      type: "attendance",
      title: action,
      message: `${employeeName} - ${toTitleStatus(record.status)} on ${record.date}.`,
      link: "/admin/attendance",
    },
  });
};

// POST /api/attendance/checkin
const checkIn = async (req, res) => {
  try {
    const { employeeName } = req.body;
    const employee_id = req.body.employee_id || req.body.employeeId || req.user.id;
    const date    = req.body.date   || today();
    const checkIn = req.body.checkIn || currentTime();
    const status  = normalizeStatus(req.body.status);

    if (!employee_id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const existing = await Attendance.getTodayAttendance(employee_id, date);
    if (existing) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    const id     = await Attendance.createAttendance({ employee_id, employeeName, date, checkIn, status });
    const record = await Attendance.getAttendanceById(id);
    emitAdminAttendanceNotification(req, "attendance:created", record, "Attendance marked");
    res.status(201).json({ success: true, message: "Checked in successfully", data: record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/attendance/checkout/:id
const checkOut = async (req, res) => {
  try {
    const record = await Attendance.getAttendanceById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });

    const checkOut    = req.body.checkOut || currentTime();
    const totalHours  = req.body.totalHours || decimalHours(record.check_in, checkOut);
    await Attendance.updateCheckOut(req.params.id, checkOut, totalHours);
    const updated = await Attendance.getAttendanceById(req.params.id);
    emitAdminAttendanceNotification(req, "attendance:updated", updated, "Attendance checkout updated");
    res.json({ success: true, message: "Checked out successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/attendance/:id  ← NEW
const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.getAttendanceById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });

    const { checkIn, checkOut, status, date } = req.body;
    const normalizedStatus = status ? normalizeStatus(status) : record.status;
    const totalHours = checkIn && checkOut ? decimalHours(checkIn, checkOut) : record.total_hours;

    await Attendance.updateAttendance(req.params.id, {
      check_in:    checkIn    || record.check_in,
      check_out:   checkOut   || record.check_out,
      status:      normalizedStatus,
      date:        date       || record.date,
      total_hours: totalHours,
    });

    const updated = await Attendance.getAttendanceById(req.params.id);
    emitAdminAttendanceNotification(req, "attendance:updated", updated, "Attendance updated");
    res.json({ success: true, message: "Attendance updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance
const getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.getAllAttendance();
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/my
const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.getAttendanceByEmployee(req.user.id);
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/employee/:id
const getAttendanceByEmployee = async (req, res) => {
  try {
    const attendance = await Attendance.getAttendanceByEmployee(req.params.id);
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/attendance/:id
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.getAttendanceById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    await Attendance.deleteAttendance(req.params.id);
    res.json({ success: true, message: "Attendance deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  updateAttendance,
  getAttendance,
  getMyAttendance,
  getAttendanceByEmployee,
  deleteAttendance,
};
