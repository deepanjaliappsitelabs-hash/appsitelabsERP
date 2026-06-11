const pool = require("../config/db");

const initNotificationSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipient_type ENUM('admin', 'employee') NOT NULL,
      recipient_id INT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'info',
      title VARCHAR(150) NOT NULL DEFAULT 'Notification',
      message TEXT NULL,
      link VARCHAR(255) NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notifications_recipient (recipient_type, recipient_id, created_at),
      INDEX idx_notifications_created_at (created_at)
    )
  `);
};

const mapRow = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  message: row.message || "",
  link: row.link || null,
  read: Boolean(row.is_read),
  createdAt: row.created_at,
  recipientType: row.recipient_type,
  recipientId: row.recipient_id,
});

const createNotification = async ({
  recipientType,
  recipientId = null,
  type = "info",
  title = "Notification",
  message = "",
  link = null,
}) => {
  const [result] = await pool.query(
    `INSERT INTO notifications
      (recipient_type, recipient_id, type, title, message, link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [recipientType, recipientId, type, title, message, link]
  );

  const [rows] = await pool.query(
    `SELECT id, recipient_type, recipient_id, type, title, message, link, is_read, created_at
     FROM notifications
     WHERE id = ?`,
    [result.insertId]
  );

  return mapRow(rows[0]);
};

const getRecentNotifications = async ({ recipientType, recipientId }) => {
  const params = [recipientType];
  let recipientSql = "recipient_type = ?";

  if (recipientType === "employee") {
    recipientSql += " AND recipient_id = ?";
    params.push(recipientId);
  }

  const [rows] = await pool.query(
    `SELECT id, recipient_type, recipient_id, type, title, message, link, is_read, created_at
     FROM notifications
     WHERE ${recipientSql}
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
     ORDER BY created_at DESC
     LIMIT 100`,
    params
  );

  return rows.map(mapRow);
};

const markRead = async ({ id, recipientType, recipientId }) => {
  const params = [id, recipientType];
  let recipientSql = "id = ? AND recipient_type = ?";

  if (recipientType === "employee") {
    recipientSql += " AND recipient_id = ?";
    params.push(recipientId);
  }

  await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE ${recipientSql}`,
    params
  );
};

const markAllRead = async ({ recipientType, recipientId }) => {
  const params = [recipientType];
  let recipientSql = "recipient_type = ?";

  if (recipientType === "employee") {
    recipientSql += " AND recipient_id = ?";
    params.push(recipientId);
  }

  await pool.query(
    `UPDATE notifications
     SET is_read = 1
     WHERE ${recipientSql}
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    params
  );
};

const deleteNotification = async ({ id, recipientType, recipientId }) => {
  const params = [id, recipientType];
  let recipientSql = "id = ? AND recipient_type = ?";

  if (recipientType === "employee") {
    recipientSql += " AND recipient_id = ?";
    params.push(recipientId);
  }

  await pool.query(
    `DELETE FROM notifications WHERE ${recipientSql}`,
    params
  );
};

module.exports = {
  initNotificationSchema,
  createNotification,
  getRecentNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
