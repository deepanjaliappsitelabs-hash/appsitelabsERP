import api from "./api";

const normalizeJob = (job) => ({
  ...job,
  _id: job.id ?? job._id,
  salaryRange: job.salaryRange || job.salary_range || "",
  lastDate: job.lastDate || job.last_date || "",
});

const normalizeCandidate = (candidate) => ({
  ...candidate,
  _id: candidate.id ?? candidate._id,
});

export const getJobs = async () => {
  try {
    const res = await api.get("/recruitment/jobs");
    return Array.isArray(res.data) ? res.data.map(normalizeJob) : [];
  } catch { return []; }
};

export const createJob = async (data) => {
  try {
    const res = await api.post("/recruitment/jobs", data);
    return normalizeJob(res.data);
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to create job", { cause: err });
  }
};

export const updateJobStatus = async (id, status) => {
  try {
    const res = await api.put(`/recruitment/jobs/${id}`, { status });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to update job", { cause: err });
  }
};

export const deleteJob = async (id) => {
  try {
    const res = await api.delete(`/recruitment/jobs/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to delete job", { cause: err });
  }
};

export const getCandidates = async () => {
  try {
    const res = await api.get("/recruitment/candidates");
    return res.data.map(normalizeCandidate);
  } catch { return []; }
};

export const getCandidateById = async (id) => {
  try {
    const res = await api.get(`/recruitment/candidates/${id}`);
    return normalizeCandidate(res.data);
  } catch { return null; }
};

export const createCandidate = async (data) => {
  try {
    const res = await api.post("/recruitment/candidates", data);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to add candidate", { cause: err });
  }
};

export const updateCandidateStage = async (id, stage) => {
  try {
    const res = await api.put(`/recruitment/candidates/${id}`, { stage });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to update stage", { cause: err });
  }
};

export const deleteCandidate = async (id) => {
  try {
    const res = await api.delete(`/recruitment/candidates/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to delete candidate", { cause: err });
  }
};

export const scheduleInterview = async (payload) => {
  try {
    const res = await api.post("/recruitment/interviews", payload);
    return res.data;
  } catch { return { ...payload, id: Date.now() }; }
};
