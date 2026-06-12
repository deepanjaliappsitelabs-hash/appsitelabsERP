// models/User.js
const pool = require("../config/db");

// Find user by email for login.
const findByEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return rows[0];
};

// Find user by email or employee ID for login.
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

// Find user by ID.
const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};

// Create a new user.
const createUser = async ({ name, email, password, role }) => {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, password, role || "employee"]
  );
  return result.insertId;
};

module.exports = { findByEmail, findByEmailOrEmployeeId, findById, createUser };
