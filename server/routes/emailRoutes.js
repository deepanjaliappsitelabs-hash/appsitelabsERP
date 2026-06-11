const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getEmails, getEmailUsers, sendEmail, markRead } = require("../controllers/emailController");

const router = express.Router();

router.get("/", protect, getEmails);
router.get("/users", protect, getEmailUsers);
router.post("/", protect, sendEmail);
router.put("/:id/read", protect, markRead);

module.exports = router;
