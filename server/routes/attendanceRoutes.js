const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  markManualAttendance,
  checkIn,
  checkOut,
  getAttendance,
  getMyAttendance,
  getAttendanceByEmployee,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/checkin",      protect, checkIn);
router.post("/manual",       protect, adminOnly, markManualAttendance);
router.put("/checkout/:id",  protect, checkOut);
router.get("/",              protect, getAttendance);
router.get("/my",            protect, getMyAttendance);
router.get("/employee/:id",  protect, getAttendanceByEmployee);
router.put("/:id",           protect, updateAttendance);   // Added update route
router.delete("/:id",        protect, deleteAttendance);

module.exports = router;
