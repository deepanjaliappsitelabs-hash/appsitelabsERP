import api from "./api";

// ── Normalize ─────────────────────────────────────────────────────────────────
const normalize = (rec) => ({
  ...rec,
  _id:        rec.id         ?? rec._id,
  employeeId: rec.employeeId ?? rec.employee_id,
  inHand:     rec.net_salary ?? rec.inHand      ?? 0,
  salary:     rec.gross      ?? rec.salary       ?? 0,
  deductions: rec.deductions ?? 0,
  ctc:        rec.ctc        ?? 0,
  basic:      rec.basic      ?? 0,
  hra:        rec.hra        ?? 0,
  da:         rec.da         ?? 0,
  other_allow:rec.other_allow ?? 0,
  pf:         rec.pf         ?? 0,
  esi:        rec.esi        ?? 0,
  tds:        rec.tds        ?? 0,
  gross:      rec.gross      ?? 0,
  status:     rec.status     ?? "Pending",
});

// ── API calls ─────────────────────────────────────────────────────────────────
export const getPayrollRecords = async (month) => {
  const res = await api.get("/payroll", { params: month ? { month } : {} });
  const list = res.data?.data ?? res.data;
  return Array.isArray(list) ? list.map(normalize) : [];
};

// employeeId = specific employee ka _id, ya undefined for all
export const generatePayroll = async (month, monthDate, employeeId, overrideSalary, customBreakdown) => {
  const payload = { month, monthDate };
  if (employeeId)      payload.employeeId      = employeeId;
  if (overrideSalary)  payload.overrideSalary  = overrideSalary;
  if (customBreakdown) payload.customBreakdown = customBreakdown;
  const res = await api.post("/payroll/generate", payload);
  return res.data;
};

export const runPayroll = async (month) => {
  const res = await api.post("/payroll/run", { month });
  const list = res.data?.data ?? [];
  return Array.isArray(list) ? list.map(normalize) : [];
};

export const getPayslip = async (id) => {
  const res = await api.get(`/payroll/payslip/${id}`);
  const rec = res.data?.data ?? res.data;
  return normalize(rec);
};

export const getEmployeePayroll = async (employeeId) => {
  const res = await api.get(`/payroll/employee/${employeeId}`);
  const list = res.data?.data ?? res.data;
  return Array.isArray(list) ? list.map(normalize) : [];
};

export const updatePayrollStatus = async (id, status, remarks) => {
  const res = await api.put(`/payroll/${id}`, { status, remarks });
  const rec = res.data?.data ?? res.data;
  return normalize(rec);
};

export const deletePayroll = async (id) => {
  const res = await api.delete(`/payroll/${id}`);
  return res.data;
};
