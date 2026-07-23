const pool = require("../config/db");

const normalizeParticipantType = (type) =>
  String(type || "").toLowerCase() === "admin" ? "admin" : "employee";

const toParticipant = (user) => ({
  participantType: user.role === "admin" ? "admin" : "employee",
  participantId: Number(user.id),
});

const pairKeyFor = (a, b) =>
  [a, b]
    .map((p) => `${normalizeParticipantType(p.participantType)}:${Number(p.participantId)}`)
    .sort()
    .join("|");

const initChatSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      type VARCHAR(20) NOT NULL DEFAULT 'direct',
      pair_key VARCHAR(120) NULL,
      created_by_type VARCHAR(20) NOT NULL,
      created_by_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_chat_pair_key (pair_key),
      KEY idx_chat_conversations_updated_at (updated_at)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_participants (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      conversation_id BIGINT UNSIGNED NOT NULL,
      participant_type VARCHAR(20) NOT NULL,
      participant_id BIGINT UNSIGNED NOT NULL,
      joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_read_message_id BIGINT UNSIGNED NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_chat_participant (conversation_id, participant_type, participant_id),
      KEY idx_chat_participant_lookup (participant_type, participant_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      conversation_id BIGINT UNSIGNED NOT NULL,
      sender_type VARCHAR(20) NOT NULL,
      sender_id BIGINT UNSIGNED NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_chat_messages_conversation (conversation_id, id),
      KEY idx_chat_messages_sender (sender_type, sender_id)
    )
  `);
};

const getParticipantNameSql = (aliasType, aliasId) => `
  CASE
    WHEN ${aliasType} = 'admin' THEN (
      SELECT u.name FROM users u WHERE u.id = ${aliasId} LIMIT 1
    )
    ELSE (
      SELECT e.name FROM employees e WHERE e.id = ${aliasId} LIMIT 1
    )
  END
`;

const getChatUsers = async (currentUser) => {
  const current = toParticipant(currentUser);
  const [employees] = await pool.query(
    `SELECT
       'employee' AS participantType,
       e.id AS participantId,
       e.name,
       e.email,
       e.department,
       e.designation,
       e.photo
     FROM employees e
     ORDER BY e.name`
  );

  const [admins] = await pool.query(
    `SELECT
       'admin' AS participantType,
       u.id AS participantId,
       u.name,
       u.email,
       '' AS department,
       'Admin' AS designation,
       '' AS photo
     FROM users u
     WHERE LOWER(u.role) = 'admin'
     ORDER BY u.name`
  );

  return [...admins, ...employees].filter(
    (user) =>
      !(
        user.participantType === current.participantType &&
        Number(user.participantId) === current.participantId
      )
  );
};

const getConversationById = async (conversationId) => {
  const [rows] = await pool.query(
    "SELECT * FROM chat_conversations WHERE id = ? LIMIT 1",
    [conversationId]
  );
  return rows[0] || null;
};

const isConversationParticipant = async (conversationId, participant) => {
  const [rows] = await pool.query(
    `SELECT id FROM chat_participants
     WHERE conversation_id = ? AND participant_type = ? AND participant_id = ?
     LIMIT 1`,
    [conversationId, participant.participantType, participant.participantId]
  );
  return rows.length > 0;
};

const canAccessConversation = async (conversationId, user) => {
  if (user.role === "admin") return true;
  return isConversationParticipant(conversationId, toParticipant(user));
};

const getConversationParticipants = async (conversationId) => {
  const [rows] = await pool.query(
    `SELECT
       cp.participant_type AS participantType,
       cp.participant_id AS participantId,
       ${getParticipantNameSql("cp.participant_type", "cp.participant_id")} AS name
     FROM chat_participants cp
     WHERE cp.conversation_id = ?
     ORDER BY cp.id`,
    [conversationId]
  );
  return rows;
};

const shapeConversation = async (row) => ({
  id: row.id,
  type: row.type,
  pairKey: row.pair_key,
  lastMessage: row.lastMessage || "",
  lastMessageAt: row.lastMessageAt || row.updated_at,
  updatedAt: row.updated_at,
  createdAt: row.created_at,
  participants: await getConversationParticipants(row.id),
});

const getConversations = async (user) => {
  const participant = toParticipant(user);
  const params = [];
  let participantJoin = "";

  if (user.role !== "admin") {
    participantJoin = `
      INNER JOIN chat_participants mine
        ON mine.conversation_id = c.id
       AND mine.participant_type = ?
       AND mine.participant_id = ?
    `;
    params.push(participant.participantType, participant.participantId);
  }

  const [rows] = await pool.query(
    `SELECT
       c.*,
       (
         SELECT m.body
         FROM chat_messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.id DESC
         LIMIT 1
       ) AS lastMessage,
       (
         SELECT m.created_at
         FROM chat_messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.id DESC
         LIMIT 1
       ) AS lastMessageAt
     FROM chat_conversations c
     ${participantJoin}
     ORDER BY COALESCE(lastMessageAt, c.updated_at) DESC`,
    params
  );

  return Promise.all(rows.map(shapeConversation));
};

const createDirectConversation = async (currentUser, other) => {
  const current = toParticipant(currentUser);
  const otherParticipant = {
    participantType: normalizeParticipantType(other.participantType),
    participantId: Number(other.participantId),
  };

  if (!otherParticipant.participantId) {
    const err = new Error("Participant is required");
    err.statusCode = 400;
    throw err;
  }

  if (
    current.participantType === otherParticipant.participantType &&
    current.participantId === otherParticipant.participantId
  ) {
    const err = new Error("You cannot start a chat with yourself");
    err.statusCode = 400;
    throw err;
  }

  const pairKey = pairKeyFor(current, otherParticipant);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT IGNORE INTO chat_conversations
        (type, pair_key, created_by_type, created_by_id)
       VALUES ('direct', ?, ?, ?)`,
      [pairKey, current.participantType, current.participantId]
    );

    const [conversationRows] = await conn.query(
      "SELECT * FROM chat_conversations WHERE pair_key = ? LIMIT 1",
      [pairKey]
    );
    const conversation = conversationRows[0];

    await conn.query(
      `INSERT IGNORE INTO chat_participants
        (conversation_id, participant_type, participant_id)
       VALUES (?, ?, ?), (?, ?, ?)`,
      [
        conversation.id,
        current.participantType,
        current.participantId,
        conversation.id,
        otherParticipant.participantType,
        otherParticipant.participantId,
      ]
    );

    await conn.commit();
    return shapeConversation(conversation);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getMessages = async (conversationId, user, limit = 80, beforeId = null) => {
  const hasAccess = await canAccessConversation(conversationId, user);
  if (!hasAccess) {
    const err = new Error("You do not have access to this chat");
    err.statusCode = 403;
    throw err;
  }

  const params = [conversationId];
  let beforeClause = "";
  if (beforeId) {
    beforeClause = "AND m.id < ?";
    params.push(Number(beforeId));
  }
  params.push(Math.min(Number(limit) || 80, 150));

  const [rows] = await pool.query(
    `SELECT
       m.id,
       m.conversation_id AS conversationId,
       m.sender_type AS senderType,
       m.sender_id AS senderId,
       ${getParticipantNameSql("m.sender_type", "m.sender_id")} AS senderName,
       m.body,
       m.created_at AS createdAt
     FROM chat_messages m
     WHERE m.conversation_id = ?
     ${beforeClause}
     ORDER BY m.id DESC
     LIMIT ?`,
    params
  );

  return rows.reverse();
};

const addMessage = async (conversationId, user, body) => {
  const text = String(body || "").trim();
  if (!text) {
    const err = new Error("Message cannot be empty");
    err.statusCode = 400;
    throw err;
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  const hasAccess = await canAccessConversation(conversationId, user);
  if (!hasAccess) {
    const err = new Error("You do not have access to this chat");
    err.statusCode = 403;
    throw err;
  }

  const sender = toParticipant(user);
  if (user.role === "admin") {
    await pool.query(
      `INSERT IGNORE INTO chat_participants
        (conversation_id, participant_type, participant_id)
       VALUES (?, ?, ?)`,
      [conversationId, sender.participantType, sender.participantId]
    );
  }

  const [result] = await pool.query(
    `INSERT INTO chat_messages
      (conversation_id, sender_type, sender_id, body)
     VALUES (?, ?, ?, ?)`,
    [conversationId, sender.participantType, sender.participantId, text]
  );
  await pool.query("UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
    conversationId,
  ]);

  const [messages] = await pool.query(
    `SELECT
       m.id,
       m.conversation_id AS conversationId,
       m.sender_type AS senderType,
       m.sender_id AS senderId,
       ${getParticipantNameSql("m.sender_type", "m.sender_id")} AS senderName,
       m.body,
       m.created_at AS createdAt
     FROM chat_messages m
     WHERE m.id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return messages[0];
};

module.exports = {
  initChatSchema,
  getChatUsers,
  getConversations,
  createDirectConversation,
  getMessages,
  addMessage,
  canAccessConversation,
  getConversationParticipants,
};
