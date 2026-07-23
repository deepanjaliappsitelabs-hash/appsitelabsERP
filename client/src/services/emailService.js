import api from "./api";

export const getEmails = async (mailbox = "inbox") => {
  const res = await api.get("/emails", { params: { mailbox } });
  return Array.isArray(res.data) ? res.data : [];
};

export const getEmailUsers = async () => {
  const res = await api.get("/emails/users");
  return res.data?.data || [];
};

export const sendEmail = async (payload) => {
  const res = await api.post("/emails", payload);
  return res.data;
};

export const markEmailRead = async (id) => {
  const res = await api.put(`/emails/${id}/read`);
  return res.data;
};
