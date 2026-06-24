const WorkLog = require("../models/WorkLog");

const createWorkLog = async (req, res) => {
  try {
    const employeeId = req.body.employee_id || req.body.employeeId || req.user.id;
    if (!employeeId || !Array.isArray(req.body.tasks) || req.body.tasks.length === 0) {
      return res.status(400).json({ message: "Employee and tasks are required" });
    }

    const id = await WorkLog.createWorkLog({ ...req.body, employeeId });
    const log = await WorkLog.getById(id);
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyWorkLogs = async (req, res) => {
  try {
    const employeeId = req.query.employeeId || req.user.id;
    const logs = await WorkLog.getByEmployee(employeeId);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllWorkLogs = async (req, res) => {
  try {
    const logs = await WorkLog.getAll();
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createWorkLog, getMyWorkLogs, getAllWorkLogs };
