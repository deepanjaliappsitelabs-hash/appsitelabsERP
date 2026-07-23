import api from "./api";

// Helper — MySQL id → _id normalize
const toTitleStatus = (status) => {
  const value = String(status || "");
  const map = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    "half-day": "Half Day",
    "on leave": "On Leave",
    wfh: "WFH",
    holiday: "Holiday",
  };
  return map[value.toLowerCase()] || value || "Present";
};

const normalize = (rec) => ({
  ...rec,
  _id: rec.id ?? rec._id,
  employeeName: rec.employeeName || rec.employee_name || "",
  checkIn: rec.checkIn || rec.check_in || "",
  checkOut: rec.checkOut || rec.check_out || "",
  hours: rec.hours || rec.total_hours || "",
  lateNote: rec.lateNote || rec.late_note || rec.note || rec.reason || "",
  status: toTitleStatus(rec.status),
});

export const getAttendance = async () => {
  const res = await api.get("/attendance");
  const list = res.data?.data ?? res.data;
  return Array.isArray(list) ? list.map(normalize) : [];
};

export const getAttendanceByEmployee = async (employeeId) => {
  const res = await api.get(`/attendance/employee/${employeeId}`);
  const list = res.data?.data ?? res.data;
  return Array.isArray(list) ? list.map(normalize) : [];
};

// Mark attendance through the backend POST /checkin route.
export const markAttendance = async (attendanceData) => {
  const res = await api.post("/attendance/checkin", attendanceData);
  const rec = res.data?.data ?? res.data;
  return normalize(rec);
};

export const markManualAttendance = async (attendanceData) => {
  const res = await api.post("/attendance/manual", attendanceData);
  const rec = res.data?.data ?? res.data;
  return normalize(rec);
};

export const checkOutAttendance = async (id, attendanceData) => {
  const res = await api.put(`/attendance/checkout/${id}`, attendanceData);
  const rec = res.data?.data ?? res.data;
  return normalize(rec);
};

export const updateAttendance = async (id, attendanceData) => {
  const res = await api.put(`/attendance/${id}`, attendanceData);
  const rec = res.data?.data ?? res.data;
  return normalize(rec);
};

export const deleteAttendance = async (id) => {
  const res = await api.delete(`/attendance/${id}`);
  return res.data;
};
