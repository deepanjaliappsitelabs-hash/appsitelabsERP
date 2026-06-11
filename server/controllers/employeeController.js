// controllers/employeeController.js
const Employee = require("../models/Employee");

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.getAllEmployees();
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/employees/:id
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.getEmployeeById(req.params.id);
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/employees
const addEmployee = async (req, res) => {
  try {
    const { employeeId, name, email, password } = req.body;

    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, name, email and password are required",
      });
    }

    const id = await Employee.createEmployee(req.body);
    res.status(201).json({
      success: true,
      message: "Employee and login account created",
      id,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    await Employee.updateEmployee(req.params.id, req.body);
    res.json({ success: true, message: "Employee updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    await Employee.deleteEmployee(req.params.id);
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  addEmployee,
  updateEmployee,
  deleteEmployee,
};
