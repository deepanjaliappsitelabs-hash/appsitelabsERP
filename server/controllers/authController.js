// controllers/authController.js
const User     = require("../models/User");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const pool     = require("../config/db");
const ActivityLog = require("../models/ActivityLog");

// ── SIGNUP ────────────────────────────────────────────────────────────────────
const signupUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Check karo user already exist karta hai ya nahi
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Password hash karo
    const hashedPassword = await bcrypt.hash(password, 10);

    // User banao
    const userId = await User.createUser({
      name,
      email,
      password: hashedPassword,
      role: role || "employee",
    });

    res.status(201).json({
      id:    userId,
      name,
      email,
      role:  role || "employee",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = email?.trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/Employee ID and password are required" });
    }

    // User dhundo
    const user = await User.findByEmailOrEmployeeId(identifier);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Password check karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Employee details bhi lao agar role employee hai
    const [empRows] = await pool.query(
      "SELECT * FROM employees WHERE email = ?",
      [user.email]
    );
    const employee = empRows[0] || null;
    const authId = user.role === "employee" && employee?.id ? employee.id : user.id;

    // JWT token banao
    const token = jwt.sign(
      { id: authId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await ActivityLog.recordLogin({
      userId: authId,
      role: user.role,
      ip: req.ip,
      device: req.headers["user-agent"] || "",
    });
    await ActivityLog.recordActivity({
      userId: authId,
      role: user.role,
      action: "Logged in",
    });

    res.json({
      token,
      id:          authId,
      userId:      user.id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      department:  employee?.department  || "",
      designation: employee?.designation || "",
      phone:       employee?.phone       || "",
      join_date:   employee?.join_date   || null,
      employeeId:  employee?.id          || user.id,
      employeeCode: employee?.employeeId || "",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signupUser, loginUser };
