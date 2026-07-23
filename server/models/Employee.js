// models/Employee.js
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const normalizeRole = (role) =>
  String(role || "employee").toLowerCase() === "admin" ? "admin" : "employee";

const normalizeEmployee = (data) => ({
  employeeId: data.employeeId,
  name: data.name,
  email: data.email,
  phone: data.phone || "",
  dob: data.dob || null,
  gender: data.gender || "",
  bloodGroup: data.bloodGroup || "",
  address: data.address || "",
  emergencyContact: data.emergencyContact || data.emergency_contact || "",
  department: data.department || "",
  designation: data.designation || "",
  salary: data.salary || 0,
  join_date: data.join_date || data.joiningDate || null,
  role: data.role || "Employee",
  bankName: data.bankName || "",
  accountNumber: data.accountNumber || "",
  ifsc: data.ifsc || "",
  panNumber: data.panNumber || "",
  documents:
    typeof data.documents === "string"
      ? data.documents
      : JSON.stringify(data.documents || {}),
  photo: data.photo || "",
});

// Fetch all employees.
const getAllEmployees = async () => {
  const [rows] = await pool.query("SELECT * FROM employees");
  return rows;
};

// Fetch one employee by ID.
const getEmployeeById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM employees WHERE id = ?", [id]
  );
  return rows[0];
};

// Create a new employee.
const createEmployee = async (data) => {
  const employee = normalizeEmployee(data);
  const {
    employeeId,
    name,
    email,
    phone,
    dob,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    department,
    designation,
    salary,
    join_date,
    role: employeeRole,
    bankName,
    accountNumber,
    ifsc,
    panNumber,
    documents,
    photo,
  } = employee;
  const password = data.password;
  const role = normalizeRole(data.role);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existingUsers] = await conn.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (existingUsers.length) {
      const err = new Error("Login account already exists for this email");
      err.statusCode = 400;
      throw err;
    }

    if (employeeId) {
      const [existingEmployees] = await conn.query(
        "SELECT id FROM employees WHERE employeeId = ? LIMIT 1",
        [employeeId]
      );
      if (existingEmployees.length) {
        const err = new Error("Employee ID already exists");
        err.statusCode = 400;
        throw err;
      }
    }

    const [employeeResult] = await conn.query(
      `INSERT INTO employees
        (
          employeeId, name, email, phone, dob, gender, bloodGroup, address,
          emergencyContact, department, designation, salary, join_date, role,
          bankName, accountNumber, ifsc, panNumber, documents, photo
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        name,
        email,
        phone,
        dob,
        gender,
        bloodGroup,
        address,
        emergencyContact,
        department,
        designation,
        salary,
        join_date,
        employeeRole,
        bankName,
        accountNumber,
        ifsc,
        panNumber,
        documents,
        photo,
      ]
    );

    const hashedPassword = await bcrypt.hash(password, 10);
    await conn.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    await conn.commit();
    return employeeResult.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Update an employee.
const updateEmployee = async (id, data) => {
  const {
    employeeId,
    name,
    email,
    phone,
    dob,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    department,
    designation,
    salary,
    join_date,
    role,
    bankName,
    accountNumber,
    ifsc,
    panNumber,
    documents,
    photo,
  } = normalizeEmployee(data);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [currentRows] = await conn.query(
      "SELECT email FROM employees WHERE id = ?",
      [id]
    );
    const currentEmail = currentRows[0]?.email;

    await conn.query(
      `UPDATE employees
     SET
       employeeId=?, name=?, email=?, phone=?, dob=?, gender=?, bloodGroup=?,
       address=?, emergencyContact=?, department=?, designation=?, salary=?,
       join_date=?, role=?, bankName=?, accountNumber=?, ifsc=?, panNumber=?,
       documents=?, photo=?
     WHERE id=?`,
      [
        employeeId,
        name,
        email,
        phone,
        dob,
        gender,
        bloodGroup,
        address,
        emergencyContact,
        department,
        designation,
        salary,
        join_date,
        role,
        bankName,
        accountNumber,
        ifsc,
        panNumber,
        documents,
        photo,
        id,
      ]
    );

    if (currentEmail) {
      await conn.query(
        "UPDATE users SET name=?, email=? WHERE email=?",
        [name, email, currentEmail]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Delete an employee.
const deleteEmployee = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      "SELECT email FROM employees WHERE id = ?",
      [id]
    );
    await conn.query("DELETE FROM employees WHERE id = ?", [id]);

    if (rows[0]?.email) {
      await conn.query("DELETE FROM users WHERE email = ?", [rows[0].email]);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
