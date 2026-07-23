import api from "./api";

const read = async (path) => {
  const res = await api.get(path);
  return res.data;
};

export const getProjects = () =>
  read("/projects");

export const getProjectById = async (id) => {
  const res = await api.get(`/projects/${id}`);
  return res.data;
};

export const createProject = async (data) => {
  const res = await api.post("/projects", data);
  return res.data;
};

export const updateProject = async (id, data) => {
  const res = await api.put(`/projects/${id}`, data);
  return res.data;
};

export const deleteProject = async (id) => {
  const res = await api.delete(`/projects/${id}`);
  return res.data;
};

export const getContacts = () =>
  read("/project-contacts");

export const createContact = async (data) => {
  const res = await api.post("/project-contacts", data);
  return res.data;
};

export const updateContact = async (id, data) => {
  const res = await api.put(`/project-contacts/${id}`, data);
  return res.data;
};

export const deleteContact = async (id) => {
  const res = await api.delete(`/project-contacts/${id}`);
  return res.data;
};
