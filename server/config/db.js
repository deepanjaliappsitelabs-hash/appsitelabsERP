const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "appsitelabs_db",
  port:     process.env.DB_PORT     || 3307,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit:    10,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL Connected Successfully!");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
    process.exit(1);
  }
}

testConnection();

module.exports = pool;
