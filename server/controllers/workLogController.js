const WorkLog = require("../models/WorkLog");

const createWorkLog = async (req, res) => {
  try {
    const employeeId = req.user.role === "admin"
      ? (req.body.employee_id || req.body.employeeId || req.user.id)
      : req.user.id;
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
    const employeeId = req.user.role === "admin" ? (req.query.employeeId || req.user.id) : req.user.id;
    const logs = await WorkLog.getByEmployee(employeeId);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const canManageLog = async (req, id) => {
  const log = await WorkLog.getById(id);
  if (!log) return { error: "Work log not found", status: 404 };
  if (req.user.role !== "admin" && Number(log.employeeId) !== Number(req.user.id)) {
    return { error: "You can only manage your own work logs", status: 403 };
  }
  return { log };
};

const updateWorkLog = async (req, res) => {
  try {
    const access = await canManageLog(req, req.params.id);
    if (access.error) return res.status(access.status).json({ message: access.error });
    if (!Array.isArray(req.body.tasks) || req.body.tasks.length === 0) {
      return res.status(400).json({ message: "At least one task is required" });
    }
    await WorkLog.updateWorkLog(req.params.id, { ...access.log, ...req.body });
    res.json({ success: true, data: await WorkLog.getById(req.params.id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteWorkLog = async (req, res) => {
  try {
    const access = await canManageLog(req, req.params.id);
    if (access.error) return res.status(access.status).json({ message: access.error });
    await WorkLog.deleteWorkLog(req.params.id);
    res.json({ success: true, message: "Work log deleted" });
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

module.exports = { createWorkLog, getMyWorkLogs, getAllWorkLogs, updateWorkLog, deleteWorkLog };
