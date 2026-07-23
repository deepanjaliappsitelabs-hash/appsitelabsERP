const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { createWorkLog, getMyWorkLogs, getAllWorkLogs, updateWorkLog, deleteWorkLog } = require("../controllers/workLogController");

const router = express.Router();

router.get("/", protect, adminOnly, getAllWorkLogs);
router.get("/my", protect, getMyWorkLogs);
router.post("/", protect, createWorkLog);
router.put("/:id", protect, updateWorkLog);
router.delete("/:id", protect, deleteWorkLog);

module.exports = router;
