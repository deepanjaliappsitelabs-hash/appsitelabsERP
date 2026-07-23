// controllers/leaveController.js
const Leave = require("../models/Leave");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

const normalizeStatus = (status = "") => {
  const value = String(status).trim().toLowerCase();
  if (["approved", "rejected", "pending"].includes(value)) return value;
  return "";
};

const toTitleStatus = (status = "") =>
  String(status).charAt(0).toUpperCase() + String(status).slice(1).toLowerCase();

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const emitAdminNotification = (req, eventName, payload) => {
  const io = req.app.get("io");
  if (!io) return;

  io.to("admins").emit(eventName, payload);
};

const emitEmployeeNotification = (req, employeeId, notification) => {
  const io = req.app.get("io");
  if (!io || !employeeId) return;

  io.to(`user:employee:${employeeId}`).emit("notification", notification);
};

const createStoredNotification = async (notification, recipientId = null) => {
  try {
    return await Notification.createNotification({
      recipientType: notification.recipientType,
      recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
    });
  } catch (error) {
    console.error("Notification save failed:", error.message);
    return notification;
  }
};

const buildLeaveNotification = (leave, action = "created") => {
  const employeeName = leave?.employeeName || `Employee #${leave?.employeeId || leave?.employee_id || ""}`.trim();
  const leaveType = leave?.leaveType || "leave";
  const status = toTitleStatus(leave?.status || "pending");

  if (action === "created") {
    return {
      type: "leave",
      recipientType: "admin",
      title: "New leave request",
      message: `${employeeName} applied for ${leaveType}.`,
      link: "/admin/leaves",
    };
  }

  if (action === "deleted") {
    return {
      type: "leave",
      recipientType: "admin",
      title: "Leave request deleted",
      message: `${employeeName}'s ${leaveType} request was deleted.`,
      link: "/admin/leaves",
    };
  }

  return {
    type: "leave",
    recipientType: "admin",
    title: "Leave request updated",
    message: `${employeeName}'s ${leaveType} request is now ${status}.`,
    link: "/admin/leaves",
  };
};

const buildEmployeeLeaveNotification = (leave) => {
  const status = toTitleStatus(leave?.status || "pending");
  const leaveType = leave?.leaveType || "leave";

  return {
    type: "leave",
    recipientType: "employee",
    title: "Leave request updated",
    message: `Your ${leaveType} request is now ${status}.`,
    link: "/employee/leaves",
  };
};

// POST /api/leaves - apply for leave
const applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    const employee_id = req.body.employee_id || req.body.employeeId || req.user.id;

    if (!employee_id || !leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ message: "Employee, leave type, dates and reason are required" });
    }

    const id = await Leave.createLeave({
      employee_id,
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    const leave = await Leave.getLeaveById(id);
    const notification = await createStoredNotification(buildLeaveNotification(leave, "created"));
    emitAdminNotification(req, "leave:created", { leave, notification });

    res.status(201).json({ success: true, message: "Leave applied successfully", data: leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leaves - admin views all leaves
const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.getAllLeaves();
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leaves/my - employee views their leaves
const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.query.employeeId || req.user.id;
    const leaves = await Leave.getLeavesByEmployee(employeeId);
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leaves/balance/:id
const getLeaveBalance = async (req, res) => {
  try {
    const balance = await Leave.getLeaveBalance(req.params.id);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/leaves/:id - admin approves or rejects leave
const updateLeaveStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);

    if (!status) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const previousLeave = await Leave.getLeaveById(req.params.id);
    await Leave.updateLeaveStatus(req.params.id, status);
    const leave = await Leave.getLeaveById(req.params.id);
    let emailSent = false;

    if (status === "approved" && leave?.employeeEmail) {
      try {
        const mailResult = await sendEmail({
          to: leave.employeeEmail,
          subject: "Your leave request has been approved",
          text: `Hi ${leave.employeeName || "Employee"}, your ${leave.leaveType || "leave"} request from ${leave.fromDate} to ${leave.toDate} has been approved.`,
          html: `
            <p>Hi ${escapeHtml(leave.employeeName || "Employee")},</p>
            <p>Your <strong>${escapeHtml(leave.leaveType || "leave")}</strong> request from <strong>${escapeHtml(leave.fromDate)}</strong> to <strong>${escapeHtml(leave.toDate)}</strong> has been approved.</p>
            ${req.body.remarks ? `<p><strong>Remarks:</strong> ${escapeHtml(req.body.remarks)}</p>` : ""}
            <p>Regards,<br/>HR Team</p>
          `,
        });
        emailSent = !mailResult?.skipped;
      } catch (mailError) {
        console.error("Leave approval email failed:", mailError.message);
      }
    }

    const employeeId = leave?.employeeId || leave?.employee_id;
    const employeeNotification = await createStoredNotification(
      buildEmployeeLeaveNotification(leave),
      employeeId
    );

    emitAdminNotification(req, "leave:updated", { leave, previousLeave });
    emitEmployeeNotification(req, employeeId, employeeNotification);

    res.json({
      success: true,
      message: `Leave ${toTitleStatus(status)} successfully`,
      data: leave,
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.getLeaveById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    await Leave.deleteLeave(req.params.id);
    const notification = await createStoredNotification(buildLeaveNotification(leave, "deleted"));
    emitAdminNotification(req, "leave:deleted", { leave, notification });

    res.json({ success: true, message: "Leave request deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  getMyLeaves,
  getLeaveBalance,
  updateLeaveStatus,
  deleteLeave,
};
