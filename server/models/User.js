// models/User.js
const pool = require("../config/db");

// Email se user dhundo (login ke liye)
const findByEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return rows[0];
};

// Email ya employeeId se user dhundo (login ke liye)
const findByEmailOrEmployeeId = async (identifier) => {
  const [rows] = await pool.query(
    `SELECT u.*
     FROM users u
     LEFT JOIN employees e ON e.email = u.email
     WHERE u.email = ? OR e.employeeId = ?
     LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0];
};

// ID se user dhundo
const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};

// Naya user banao
const createUser = async ({ name, email, password, role }) => {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, password, role || "employee"]
  );
  return result.insertId;
};

module.exports = { findByEmail, findByEmailOrEmployeeId, findById, createUser };
