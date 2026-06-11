import api from "./api";

export const getReports = async () => {
  const res = await api.get("/reports");
  return res.data;
};

export const generateReport = async (type, filters = {}) => {
  const res = await api.post(`/reports/${type}/generate`, filters);
  return res.data;
};

export const downloadReport = async (type, format = "excel") => {
  const res = await api.get(`/reports/${type}/download`, {
    params: { format },
  });
  return res.data;
};
