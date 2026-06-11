import api from "./api";

export const getMyWorkLogs = async (employeeId) => {
  const res = await api.get("/work-logs/my", { params: { employeeId } });
  const list = res.data?.data ?? res.data;
  return Array.isArray(list) ? list : [];
};

export const createWorkLog = async (payload) => {
  const res = await api.post("/work-logs", payload);
  return res.data?.data ?? res.data;
};
