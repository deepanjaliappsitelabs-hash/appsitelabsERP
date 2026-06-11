const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getReports, generateReport, downloadReport } = require("../controllers/reportController");

const router = express.Router();

router.get("/", protect, getReports);
router.post("/:type/generate", protect, generateReport);
router.get("/:type/download", protect, downloadReport);

module.exports = router;
