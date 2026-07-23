const pool = require("../config/db");

async function ensureEmployeeIdColumn() {
  const [cols] = await pool.query("SHOW COLUMNS FROM employees LIKE 'employeeId'");

  if (!cols.length) {
    await pool.query("ALTER TABLE employees ADD COLUMN employeeId VARCHAR(50) NULL AFTER id");
    await pool.query(
      "UPDATE employees SET employeeId = CONCAT('ASL-', LPAD(id, 3, '0')) WHERE employeeId IS NULL OR employeeId = ''"
    );
    await pool.query("ALTER TABLE employees ADD UNIQUE KEY employees_employeeId_unique (employeeId)");
    console.log("employeeId column added and existing employees backfilled.");
  } else {
    console.log("employeeId column already exists.");
  }

  const fields = [
    ["dob", "DATE NULL"],
    ["gender", "VARCHAR(30) NULL"],
    ["bloodGroup", "VARCHAR(10) NULL"],
    ["address", "TEXT NULL"],
    ["emergencyContact", "VARCHAR(50) NULL"],
    ["role", "VARCHAR(30) NULL DEFAULT 'Employee'"],
    ["bankName", "VARCHAR(100) NULL"],
    ["accountNumber", "VARCHAR(50) NULL"],
    ["ifsc", "VARCHAR(20) NULL"],
    ["panNumber", "VARCHAR(20) NULL"],
    ["documents", "LONGTEXT NULL"],
    ["photo", "LONGTEXT NULL"],
  ];

  for (const [field, definition] of fields) {
    const [fieldCols] = await pool.query(`SHOW COLUMNS FROM employees LIKE '${field}'`);
    if (!fieldCols.length) {
      await pool.query(`ALTER TABLE employees ADD COLUMN ${field} ${definition}`);
      console.log(`${field} column added.`);
    }
  }
}

ensureEmployeeIdColumn()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
