const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getMyActivity } = require("../controllers/activityController");

const router = express.Router();

router.get("/my", protect, getMyActivity);

module.exports = router;
