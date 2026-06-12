const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  checkIn,
  checkOut,
  getAttendance,
  getMyAttendance,
  getAttendanceByEmployee,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");

const router = express.Router();

router.post("/checkin",      protect, checkIn);
router.put("/checkout/:id",  protect, checkOut);
router.get("/",              protect, getAttendance);
router.get("/my",            protect, getMyAttendance);
router.get("/employee/:id",  protect, getAttendanceByEmployee);
router.put("/:id",           protect, updateAttendance);   // Added update route
router.delete("/:id",        protect, deleteAttendance);

module.exports = router;
