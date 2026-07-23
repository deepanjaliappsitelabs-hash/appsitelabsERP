import api from "./api";

// Helper - maps MySQL "id" to "_id" so the UI stays consistent.
const parseDocuments = (documents) => {
  if (!documents) return {};
  if (typeof documents === "object") return documents;
  try {
    return JSON.parse(documents);
  } catch {
    return {};
  }
};

const toDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const normalize = (emp) => ({
  ...emp,
  _id: emp.id ?? emp._id,
  dob: toDateInput(emp.dob),
  emergencyContact: emp.emergencyContact ?? emp.emergency_contact ?? "",
  joiningDate: toDateInput(emp.joiningDate ?? emp.join_date),
  documents: parseDocuments(emp.documents),
});

export const getEmployees = async () => {
  const res = await api.get("/employees");
  // Backend returns { success: true, data: [...] }.
  const list = res.data?.data ?? res.data;
  return Array.isArray(list) ? list.map(normalize) : [];
};

export const createEmployee = async (data) => {
  const res = await api.post("/employees", data);
  const emp = res.data?.data ?? res.data;
  return normalize(emp);
};

export const updateEmployee = async (id, data) => {
  const res = await api.put(`/employees/${id}`, data);
  const emp = res.data?.data ?? res.data;
  return normalize(emp);
};

export const deleteEmployee = async (id) => {
  const res = await api.delete(`/employees/${id}`);
  return res.data;
};
