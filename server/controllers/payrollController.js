// server/controllers/payrollController.js
const Payroll = require("../models/Payroll");

// GET /api/payroll?month=May+2026
const getPayrollRecords = async (req, res) => {
  try {
    const { month } = req.query;
    const records = await Payroll.getAllPayroll(month);

    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payroll/generate — manually generate payroll for a month
const generatePayroll = async (req, res) => {
  try {
    const { month, monthDate, employeeId, overrideSalary, customBreakdown } = req.body;
    if (!month || !monthDate) {
      return res.status(400).json({ success: false, message: "Month is required" });
    }

    await Payroll.generateMonthlyPayroll(month, monthDate, {
      employeeId,
      overrideSalary,
      customBreakdown,
    });
    const records = await Payroll.getAllPayroll(month);
    res.json({ success: true, message: "Payroll generated", data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payroll/run — mark all Pending → Processed
const runPayroll = async (req, res) => {
  try {
    const { month } = req.body;
    await Payroll.runPayroll(month);
    const records = await Payroll.getAllPayroll(month);
    res.json({ success: true, message: "Payroll processed successfully", data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payroll/payslip/:id
const getPayslip = async (req, res) => {
  try {
    const record = await Payroll.getPayrollById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Payslip not found" });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payroll/employee/:id — employee ke payslips
const getEmployeePayroll = async (req, res) => {
  try {
    const records = await Payroll.getPayrollByEmployee(req.params.id);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/payroll/:id — status update (Processed / Paid)
const updatePayrollStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const allowed = ["Pending", "Processed", "Paid"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    await Payroll.updatePayrollStatus(req.params.id, status, remarks);
    const record = await Payroll.getPayrollById(req.params.id);
    res.json({ success: true, message: `Payroll marked as ${status}`, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/payroll/:id
const deletePayroll = async (req, res) => {
  try {
    const deleted = await Payroll.deletePayroll(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }
    res.json({ success: true, message: "Payroll record deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPayrollRecords,
  generatePayroll,
  runPayroll,
  getPayslip,
  getEmployeePayroll,
  updatePayrollStatus,
  deletePayroll,
};
