const Email = require("../models/Email");

const getEmails = async (req, res) => {
  try {
    res.json(await Email.getEmails(req.user, req.query.mailbox || "inbox"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmailUsers = async (req, res) => {
  try {
    res.json({ success: true, data: await Email.getEmailUsers(req.user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ message: "To, subject and body are required" });
    }
    const email = await Email.createEmail(req.body, req.user);
    const io = req.app.get("io");

    if (io && email.recipientType && email.recipientId) {
      io.to(`user:${email.recipientType}:${email.recipientId}`).emit("email:new", email);
      io.to(`user:${email.senderType}:${email.senderId}`).emit("email:sent", email);
      io.to("admins").emit("email:activity", email);
    }

    res.status(201).json({ success: true, data: email });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

const markRead = async (req, res) => {
  try {
    await Email.markRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEmails, getEmailUsers, sendEmail, markRead };
