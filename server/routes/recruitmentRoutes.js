const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getJobs, createJob, updateJob, updateJobStatus,
  deleteJob,
  getCandidates, getCandidateById, createCandidate, updateCandidateStage,
  deleteCandidate,
  scheduleInterview,
} = require("../controllers/recruitmentController");

// Jobs
router.get("/jobs",         protect, getJobs);
router.post("/jobs",        protect, createJob);
router.put("/jobs/:id",     protect, updateJob);
router.delete("/jobs/:id",  protect, deleteJob);

// Candidates
router.get("/candidates",          protect, getCandidates);
router.get("/candidates/:id",      protect, getCandidateById);
router.post("/candidates",         protect, createCandidate);
router.put("/candidates/:id",      protect, updateCandidateStage);
router.delete("/candidates/:id",   protect, deleteCandidate);
router.post("/interviews",         protect, scheduleInterview);

module.exports = router;
