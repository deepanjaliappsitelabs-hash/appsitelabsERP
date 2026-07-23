import api from "./api";

// Helper — MySQL id → _id normalize
const toTitleStatus = (status = "Pending") => {
  const value = String(status || "Pending").toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const toDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export const normalizeLeave = (rec = {}) => ({
  ...rec,
  _id: rec.id ?? rec._id,
  employeeId: rec.employeeId ?? rec.employee_id,
  leaveType: rec.leaveType ?? rec.leave_type ?? "",
  fromDate: toDateInput(rec.fromDate ?? rec.from_date),
  toDate: toDateInput(rec.toDate ?? rec.to_date),
  appliedOn: rec.appliedOn ?? toDateInput(rec.createdAt ?? rec.created_at),
  createdAt: rec.createdAt ?? rec.created_at,
  status: toTitleStatus(rec.status),
});

const toApiPayload = (leaveData = {}) => ({
  ...leaveData,
  employee_id: leaveData.employee_id ?? leaveData.employeeId,
  leave_type: leaveData.leaveType,
  from_date: leaveData.fromDate,
  to_date: leaveData.toDate,
  status: leaveData.status ? String(leaveData.status).toLowerCase() : undefined,
});

export const DEFAULT_LEAVE_BALANCE = {
  "Casual Leave":    { total: 12, used: 0 },
  "Sick Leave":      { total: 10, used: 0 },
  "Earned Leave":    { total: 15, used: 0 },
  "Maternity Leave": { total: 90, used: 0 },
  "Paternity Leave": { total: 15, used: 0 },
  "Unpaid Leave":    { total: 30, used: 0 },
};

export const getLeaves = async () => {
  const res = await api.get("/leaves");
  const list = res.data?.data ?? res.data;
  return Array.isArray(list) ? list.map(normalizeLeave) : [];
};

export const getMyLeaves = async (employeeId) => {
  const res = await api.get("/leaves/my", { params: { employeeId } });
  const list = res.data?.data ?? res.data;
  return Array.isArray(list) ? list.map(normalizeLeave) : [];
};

export const getLeaveBalance = async (employeeId) => {
  try {
    const res = await api.get(`/leaves/balance/${employeeId}`);
    return res.data?.data ?? res.data ?? DEFAULT_LEAVE_BALANCE;
  } catch {
    return DEFAULT_LEAVE_BALANCE;
  }
};

export const getLeaveById = async (id) => {
  const res = await api.get(`/leaves/${id}`);
  const rec = res.data?.data ?? res.data;
  return normalizeLeave(rec);
};

export const createLeave = async (leaveData) => {
  const res = await api.post("/leaves", toApiPayload(leaveData));
  const rec = res.data?.data ?? res.data;
  return normalizeLeave(rec);
};

export const updateLeave = async (id, leaveData) => {
  const res = await api.put(`/leaves/${id}`, toApiPayload(leaveData));
  const rec = res.data?.data ?? res.data;
  return normalizeLeave(rec);
};

export const deleteLeave = async (id) => {
  const res = await api.delete(`/leaves/${id}`);
  return res.data;
};
