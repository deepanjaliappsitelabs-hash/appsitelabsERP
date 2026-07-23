const Job       = require("../models/Job");
const Candidate = require("../models/Candidate");
const Interview = require("../models/Interview");

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.getAllJobs();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createJob = async (req, res) => {
  try {
    const id  = await Job.createJob(req.body);
    const job = await Job.getJobById(id);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateJob = async (req, res) => {
  try {
    await Job.updateJob(req.params.id, req.body);
    res.json({ success: true, message: "Job updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    await Job.updateJobStatus(req.params.id, req.body.status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const job = await Job.getJobById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    await Job.deleteJob(req.params.id);
    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.getAllCandidates();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.getCandidateById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createCandidate = async (req, res) => {
  try {
    const id        = await Candidate.createCandidate(req.body);
    const candidate = await Candidate.getCandidateById(id);
    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCandidateStage = async (req, res) => {
  try {
    await Candidate.updateCandidateStage(req.params.id, req.body.stage);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.getCandidateById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    await Candidate.deleteCandidate(req.params.id);
    res.json({ success: true, message: "Candidate deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const scheduleInterview = async (req, res) => {
  try {
    const id = await Interview.createInterview(req.body);
    const interview = await Interview.getInterviewById(id);
    res.status(201).json(interview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getJobs,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidateStage,
  deleteCandidate,
  scheduleInterview,
};
