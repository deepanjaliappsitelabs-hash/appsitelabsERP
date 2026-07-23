const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllNotificationsRead);
router.put("/:id/read", protect, markNotificationRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
