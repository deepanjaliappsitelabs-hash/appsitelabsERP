const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getUsers,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/users", protect, getUsers);
router.get("/conversations", protect, getConversations);
router.post("/conversations", protect, startConversation);
router.get("/conversations/:id/messages", protect, getMessages);
router.post("/conversations/:id/messages", protect, sendMessage);

module.exports = router;
