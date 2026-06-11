// server/scripts/createPayrollTable.js
// Run: node scripts/createPayrollTable.js  (server/ folder se)

// require("dotenv").config({ path: "../.env" }); // server ke .env se

const mysql = require("mysql2/promise");

async function createPayrollTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
     host:     "localhost",
    user:     "root",
    password: "",
    database: "appsitelabs_db",
      port:     3307, 
    });

    console.log("✅ MySQL Connected");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payroll (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        employee_id   INT NOT NULL,
        month         VARCHAR(20)   NOT NULL,
        month_date    DATE          NOT NULL,
        basic         DECIMAL(12,2) DEFAULT 0,
        hra           DECIMAL(12,2) DEFAULT 0,
        da            DECIMAL(12,2) DEFAULT 0,
        other_allow   DECIMAL(12,2) DEFAULT 0,
        gross         DECIMAL(12,2) DEFAULT 0,
        pf            DECIMAL(12,2) DEFAULT 0,
        esi           DECIMAL(12,2) DEFAULT 0,
        tds           DECIMAL(12,2) DEFAULT 0,
        other_deduct  DECIMAL(12,2) DEFAULT 0,
        deductions    DECIMAL(12,2) DEFAULT 0,
        net_salary    DECIMAL(12,2) DEFAULT 0,
        ctc           DECIMAL(12,2) DEFAULT 0,
        status        ENUM('Pending','Processed','Paid') DEFAULT 'Pending',
        paid_on       DATE,
        remarks       TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_emp_month (employee_id, month_date),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ Payroll table created successfully!");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

createPayrollTable();