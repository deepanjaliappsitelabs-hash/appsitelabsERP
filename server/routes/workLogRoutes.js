const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { createWorkLog, getMyWorkLogs, getAllWorkLogs } = require("../controllers/workLogController");

const router = express.Router();

router.get("/", protect, adminOnly, getAllWorkLogs);
router.get("/my", protect, getMyWorkLogs);
router.post("/", protect, createWorkLog);

module.exports = router;
