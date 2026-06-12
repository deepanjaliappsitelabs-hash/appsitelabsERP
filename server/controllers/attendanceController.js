// controllers/attendanceController.js
const Attendance = require("../models/Attendance");

const today       = () => new Date().toISOString().slice(0, 10);
const currentTime = () => new Date().toTimeString().slice(0, 5);

const OFFICE_LAT            = 28.636022; 
const OFFICE_LNG            = 77.0706781;  
const ALLOWED_RADIUS_METERS = 100;      

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R    = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLon  = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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
  const [endHour,   endMinute]   = end.split(":").map(Number);
  const diffMinutes = Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute));
  return Number((diffMinutes / 60).toFixed(2));
};

const toTitleStatus = (status = "") => {
  const map = {
    present:    "Present",
    absent:     "Absent",
    late:       "Late",
    "half-day": "Half Day",
    "on leave": "On Leave",
    wfh:        "WFH",
  };
  return map[String(status).toLowerCase()] || String(status || "Present");
};

const cleanLateNote = (note) => {
  const value = String(note || "").trim();
  return value ? value.slice(0, 300) : null;
};

const emitAdminAttendanceNotification = (req, eventName, record, action) => {
  const io = req.app.get("io");
  if (!io || !record) return;
  const employeeName = record.employeeName || record.employee_name || `Employee #${record.employee_id || ""}`.trim();
  io.to("admins").emit(eventName, {
    attendance: record,
    notification: {
      type:    "attendance",
      title:   action,
      message: `${employeeName} - ${toTitleStatus(record.status)} on ${record.date}.`,
      link:    "/admin/attendance",
    },
  });
};

// POST /api/attendance/checkin
const checkIn = async (req, res) => {
  try {
    const { employeeName, latitude, longitude } = req.body;
    const employee_id = req.body.employee_id || req.body.employeeId || req.user.id;
    const date     = req.body.date    || today();
    const checkIn  = req.body.checkIn || currentTime();
    const status   = normalizeStatus(req.body.status);
    const lateNote = cleanLateNote(req.body.lateNote || req.body.late_note || req.body.note);

    if (!employee_id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    // ── GPS Validation ────────────────────────────────────────────────────────
    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Location access is required to check in. Please allow location permission.",
      });
    }

    const distance         = calculateDistance(OFFICE_LAT, OFFICE_LNG, parseFloat(latitude), parseFloat(longitude));
    const distanceRounded  = Math.round(distance);
    const location_verified = distance <= ALLOWED_RADIUS_METERS ? 1 : 0;

    if (!location_verified) {
      return res.status(403).json({
        message: `You are ${distanceRounded}m away from office. Check-in is only allowed within ${ALLOWED_RADIUS_METERS}m of office.`,
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const existing = await Attendance.getTodayAttendance(employee_id, date);
    if (existing) {
      if (lateNote) {
        await Attendance.updateAttendance(existing.id, {
          check_in:    existing.check_in,
          check_out:   existing.check_out,
          status:      existing.status,
          date:        existing.date,
          total_hours: existing.total_hours,
          late_note:   lateNote,
        });
        const updated = await Attendance.getAttendanceById(existing.id);
        emitAdminAttendanceNotification(req, "attendance:updated", updated, "Attendance note updated");
        return res.json({ success: true, message: "Attendance note updated", data: updated });
      }
      return res.status(400).json({ message: "Already checked in today" });
    }

    const id = await Attendance.createAttendance({
      employee_id,
      employeeName,
      date,
      checkIn,
      status,
      lateNote,
      latitude:          parseFloat(latitude),
      longitude:         parseFloat(longitude),
      distance_meters:   distanceRounded,
      location_verified,
    });

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

    const checkOut   = req.body.checkOut || currentTime();
    const totalHours = req.body.totalHours || decimalHours(record.check_in, checkOut);
    await Attendance.updateCheckOut(req.params.id, checkOut, totalHours);
    const updated = await Attendance.getAttendanceById(req.params.id);
    emitAdminAttendanceNotification(req, "attendance:updated", updated, "Attendance checkout updated");
    res.json({ success: true, message: "Checked out successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/attendance/:id
const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.getAttendanceById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });

    const { checkIn, checkOut, status, date } = req.body;
    const normalizedStatus = status ? normalizeStatus(status) : record.status;
    const totalHours = checkIn && checkOut ? decimalHours(checkIn, checkOut) : record.total_hours;
    const lateNote =
      req.body.lateNote !== undefined || req.body.late_note !== undefined || req.body.note !== undefined
        ? cleanLateNote(req.body.lateNote || req.body.late_note || req.body.note)
        : record.lateNote || record.late_note || null;

    await Attendance.updateAttendance(req.params.id, {
      check_in:    checkIn    || record.check_in,
      check_out:   checkOut   || record.check_out,
      status:      normalizedStatus,
      date:        date       || record.date,
      total_hours: totalHours,
      late_note:   lateNote,
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