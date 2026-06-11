const Notification = require("../models/Notification");

const getRecipient = (user) => ({
  recipientType: user.role === "admin" ? "admin" : "employee",
  recipientId: user.role === "admin" ? null : user.id,
});

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.getRecentNotifications(getRecipient(req.user));
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await Notification.markRead({
      id: req.params.id,
      ...getRecipient(req.user),
    });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.markAllRead(getRecipient(req.user));
    res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await Notification.deleteNotification({
      id: req.params.id,
      ...getRecipient(req.user),
    });
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
