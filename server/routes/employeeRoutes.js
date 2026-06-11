const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getEmployees,
  getEmployee,
  addEmployee,      // ← createEmployee nahi, addEmployee hai
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

router.get("/",       protect, getEmployees);
router.get("/:id",    protect, getEmployee);
router.post("/",      protect, adminOnly, addEmployee);
router.put("/:id",    protect, adminOnly, updateEmployee);
router.delete("/:id", protect, adminOnly, deleteEmployee);

module.exports = router;
