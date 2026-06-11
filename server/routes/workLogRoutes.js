const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createWorkLog, getMyWorkLogs } = require("../controllers/workLogController");

const router = express.Router();

router.get("/my", protect, getMyWorkLogs);
router.post("/", protect, createWorkLog);

module.exports = router;
