const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

require("./config/db");

const authRoutes       = require("./routes/authRoutes");
const employeeRoutes   = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes      = require("./routes/leaveRoutes");
const payrollRoutes    = require("./routes/payrollRoutes");
const recruitmentRoutes = require("./routes/recruitmentRoutes");
const documentRoutes = require("./routes/documentRoutes");
const projectRoutes  = require("./routes/projectRoutes");
const contactRoutes  = require("./routes/contactRoutes");
const reportRoutes   = require("./routes/reportRoutes");
const workLogRoutes  = require("./routes/workLogRoutes");
const activityRoutes = require("./routes/activityRoutes");
const emailRoutes    = require("./routes/emailRoutes");
const chatRoutes     = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { initChatSchema } = require("./models/Chat");
const { initNotificationSchema } = require("./models/Notification");
const registerChatSocket = require("./socket/chatSocket");
const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://admin.localhost:5173",
  "http://erp.localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
];

const corsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^http:\/\/([a-z0-9-]+\.)?localhost:517[3-9]$/i.test(origin)
    ) {
      return callback(null, origin || true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};
const io = new Server(server, { cors: corsOptions });

registerChatSocket(io);
app.set("io", io);

app.use(cors(corsOptions));

app.use(express.json({ limit: "25mb" }));

app.use("/api/auth",       authRoutes);
app.use("/api/employees",  employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves",     leaveRoutes);
app.use("/api/payroll",    payrollRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/documents",        documentRoutes);
app.use("/api/projects",         projectRoutes);
app.use("/api/project-contacts", contactRoutes);
app.use("/api/reports",          reportRoutes);
app.use("/api/work-logs",        workLogRoutes);
app.use("/api/activity",         activityRoutes);
app.use("/api/emails",           emailRoutes);
app.use("/api/chats",            chatRoutes);
app.use("/api/notifications",     notificationRoutes);

app.get("/", (req, res) => {
  res.send("ERP Backend Running");
});

const PORT = process.env.PORT || 5000;
initChatSchema().catch((err) => {
  console.error("❌ Chat schema setup failed:", err.message);
});
initNotificationSchema().catch((err) => {
  console.error("❌ Notification schema setup failed:", err.message);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
