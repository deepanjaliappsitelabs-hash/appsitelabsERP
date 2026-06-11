const Chat = require("../models/Chat");

const getUsers = async (req, res) => {
  try {
    const users = await Chat.getChatUsers(req.user);
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await Chat.getConversations(req.user);
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const startConversation = async (req, res) => {
  try {
    const conversation = await Chat.createDirectConversation(req.user, req.body);
    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Chat.getMessages(
      req.params.id,
      req.user,
      req.query.limit,
      req.query.beforeId
    );
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const message = await Chat.addMessage(req.params.id, req.user, req.body.body);
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getUsers,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
};
