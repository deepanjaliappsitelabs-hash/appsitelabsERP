const pool = require("../config/db");

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender VARCHAR(150) NOT NULL,
      recipient VARCHAR(150) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      tag VARCHAR(80) DEFAULT 'General',
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [columns] = await pool.query("SHOW COLUMNS FROM emails");
  const existing = new Set(columns.map((column) => column.Field));
  const addColumn = async (name, definition) => {
    if (!existing.has(name)) {
      await pool.query(`ALTER TABLE emails ADD COLUMN ${name} ${definition}`);
    }
  };

  await addColumn("sender_type", "VARCHAR(20) NULL");
  await addColumn("sender_id", "BIGINT UNSIGNED NULL");
  await addColumn("sender_name", "VARCHAR(150) NULL");
  await addColumn("sender_email", "VARCHAR(150) NULL");
  await addColumn("recipient_type", "VARCHAR(20) NULL");
  await addColumn("recipient_id", "BIGINT UNSIGNED NULL");
  await addColumn("recipient_name", "VARCHAR(150) NULL");
  await addColumn("recipient_email", "VARCHAR(150) NULL");
};

const normalizeParticipantType = (type) =>
  String(type || "").toLowerCase() === "admin" ? "admin" : "employee";

const toParticipant = (user) => ({
  participantType: user.role === "admin" ? "admin" : "employee",
  participantId: Number(user.id),
});

const getCurrentUserProfile = async (user) => {
  if (user.role === "admin") {
    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
      [user.id]
    );
    return {
      participantType: "admin",
      participantId: Number(user.id),
      name: rows[0]?.name || "Admin",
      email: rows[0]?.email || "",
    };
  }

  const [rows] = await pool.query(
    "SELECT id, name, email, designation FROM employees WHERE id = ? LIMIT 1",
    [user.id]
  );
  return {
    participantType: "employee",
    participantId: Number(user.id),
    name: rows[0]?.name || "Employee",
    email: rows[0]?.email || "",
  };
};

const getEmailUsers = async (currentUser) => {
  const current = toParticipant(currentUser);
  const [admins] = await pool.query(
    `SELECT
       'admin' AS participantType,
       u.id AS participantId,
       u.name,
       u.email,
       'Admin' AS designation
     FROM users u
     WHERE LOWER(u.role) = 'admin'
     ORDER BY u.name`
  );
  const [employees] = await pool.query(
    `SELECT
       'employee' AS participantType,
       e.id AS participantId,
       e.name,
       e.email,
       e.designation
     FROM employees e
     ORDER BY e.name`
  );

  return [...admins, ...employees].filter(
    (item) =>
      !(
        item.participantType === current.participantType &&
        Number(item.participantId) === current.participantId
      )
  );
};

const findRecipient = async (value) => {
  const identifier = String(value || "").trim();
  if (!identifier) return null;

  const [adminRows] = await pool.query(
    `SELECT 'admin' AS participantType, id AS participantId, name, email
     FROM users
     WHERE LOWER(email) = LOWER(?) AND LOWER(role) = 'admin'
     LIMIT 1`,
    [identifier]
  );
  if (adminRows[0]) return adminRows[0];

  const [employeeRows] = await pool.query(
    `SELECT 'employee' AS participantType, id AS participantId, name, email
     FROM employees
     WHERE LOWER(email) = LOWER(?) OR employeeId = ?
     LIMIT 1`,
    [identifier, identifier]
  );
  return employeeRows[0] || null;
};

const mapEmail = (row) => ({
  id: row.id,
  from: row.sender_name || row.sender || row.sender_email,
  fromEmail: row.sender_email || row.sender,
  to: row.recipient_name || row.recipient || row.recipient_email,
  toEmail: row.recipient_email || row.recipient,
  senderType: row.sender_type,
  senderId: row.sender_id,
  recipientType: row.recipient_type,
  recipientId: row.recipient_id,
  subject: row.subject,
  body: row.body,
  preview: row.body?.slice(0, 120) || "",
  tag: row.tag,
  read: Boolean(row.is_read),
  date: row.date,
  createdAt: row.created_at,
});

const getEmails = async (user, mailbox = "inbox") => {
  await ensureTable();
  const participant = toParticipant(user);
  const params = [];
  let where = "";

  if (user.role !== "admin" || mailbox !== "all") {
    if (mailbox === "sent") {
      where =
        "WHERE sender_type = ? AND sender_id = ?";
      params.push(participant.participantType, participant.participantId);
    } else {
      where =
        "WHERE recipient_type = ? AND recipient_id = ?";
      params.push(participant.participantType, participant.participantId);
    }
  }

  const [rows] = await pool.query(
    `SELECT *,
            DATE_FORMAT(created_at, '%b %e, %Y %h:%i %p') AS date
     FROM emails
     ${where}
     ORDER BY created_at DESC`
    ,
    params
  );
  return rows.map(mapEmail);
};

const createEmail = async ({ to, subject, body, tag }, user) => {
  await ensureTable();
  const sender = await getCurrentUserProfile(user);
  const recipient = await findRecipient(to);

  if (!recipient) {
    const err = new Error("Recipient not found. Use a valid admin/employee email or employee ID.");
    err.statusCode = 404;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO emails (
       sender, recipient, subject, body, tag,
       sender_type, sender_id, sender_name, sender_email,
       recipient_type, recipient_id, recipient_name, recipient_email
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sender.email || sender.name,
      recipient.email,
      subject,
      body,
      tag || "General",
      sender.participantType,
      sender.participantId,
      sender.name,
      sender.email,
      recipient.participantType,
      recipient.participantId,
      recipient.name,
      recipient.email,
    ]
  );

  const [rows] = await pool.query(
    `SELECT *, DATE_FORMAT(created_at, '%b %e, %Y %h:%i %p') AS date
     FROM emails
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return mapEmail(rows[0]);
};

const markRead = async (id) => {
  await ensureTable();
  await pool.query("UPDATE emails SET is_read = 1 WHERE id = ?", [id]);
};

module.exports = { getEmails, createEmail, markRead, getEmailUsers };
