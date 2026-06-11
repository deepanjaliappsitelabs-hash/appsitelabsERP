const jwt = require("jsonwebtoken");
const Chat = require("../models/Chat");

const socketUserRoom = (user) => `user:${user.role === "admin" ? "admin" : "employee"}:${user.id}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;

function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.user;
    socket.join(socketUserRoom(user));

    if (user.role === "admin") {
      socket.join("admins");
    }

    socket.on("conversation:join", async ({ conversationId }, ack) => {
      try {
        const allowed = await Chat.canAccessConversation(conversationId, user);
        if (!allowed) throw new Error("You do not have access to this chat");

        socket.join(conversationRoom(conversationId));
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on("message:send", async ({ conversationId, body }, ack) => {
      try {
        const message = await Chat.addMessage(conversationId, user, body);
        const participants = await Chat.getConversationParticipants(conversationId);

        io.to(conversationRoom(conversationId)).emit("message:new", message);
        io.to("admins").emit("conversation:updated", { conversationId, message });

        participants.forEach((participant) => {
          io.to(
            `user:${participant.participantType}:${participant.participantId}`
          ).emit("conversation:updated", { conversationId, message });
        });

        ack?.({ success: true, data: message });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });
  });
}

module.exports = registerChatSocket;
