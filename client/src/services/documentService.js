import api from "./api";

export const getDocuments = async () => {
  const res = await api.get("/documents");
  return res.data.map((d) => ({ ...d, _id: d._id || d.id }));
};

export const uploadDocument = async (payload) => {
  const res = await api.post("/documents", payload);
  return res.data;
};

export const deleteDocument = async (id) => {
  const res = await api.delete(`/documents/${id}`);
  return res.data;
};
