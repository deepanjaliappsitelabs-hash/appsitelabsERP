// server/routes/payrollRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getPayrollRecords,
  generatePayroll,
  runPayroll,
  getPayslip,
  getEmployeePayroll,
  updatePayrollStatus,
  deletePayroll,
} = require("../controllers/payrollController");

const router = express.Router();

router.get("/",                protect, getPayrollRecords);
router.post("/generate",       protect, generatePayroll);
router.post("/run",            protect, runPayroll);
router.get("/payslip/:id",     protect, getPayslip);
router.get("/employee/:id",    protect, getEmployeePayroll);
router.put("/:id",             protect, updatePayrollStatus);
router.delete("/:id",          protect, deletePayroll);

module.exports = router;
