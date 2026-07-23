const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  applyLeave,
  getLeaves,
  getMyLeaves,
  getLeaveBalance,
  updateLeaveStatus,
  deleteLeave,
} = require("../controllers/leaveController");

const router = express.Router();

router.post("/",       protect, applyLeave);
router.get("/",        protect, getLeaves);
router.get("/my",      protect, getMyLeaves);
router.get("/balance/:id", protect, getLeaveBalance);
router.put("/:id",     protect, updateLeaveStatus);
router.delete("/:id",  protect, deleteLeave);

module.exports = router;
