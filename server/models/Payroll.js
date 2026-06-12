// server/models/Payroll.js
const pool = require("../config/db");

// ── Calculate salary breakdown ────────────────────────────────────────────────
function calcBreakdown(salary) {
  const basic       = Math.round(salary * 0.50);   // 50% of CTC
  const hra         = Math.round(salary * 0.20);   // 20%
  const da          = Math.round(salary * 0.10);   // 10%
  const other_allow = Math.round(salary * 0.10);   // 10%
  const gross       = basic + hra + da + other_allow;

  // Deductions
  const pf          = Math.round(basic * 0.12);    // 12% of basic
  const esi         = gross <= 21000 ? Math.round(gross * 0.0075) : 0; // ESI only if gross ≤ 21000
  const tds         = Math.round(gross * 0.05);    // simplified 5% TDS
  const deductions  = pf + esi + tds;
  const net_salary  = gross - deductions;
  const ctc         = Math.round(salary * 12);

  return { basic, hra, da, other_allow, gross, pf, esi, tds, deductions, net_salary, ctc };
}

// ── Month helpers ─────────────────────────────────────────────────────────────
function currentMonth() {
  const d = new Date();
  return d.toLocaleString("en-IN", { month: "long", year: "numeric" }); // "May 2026"
}

function currentMonthDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function normalizeBreakdown(breakdown = {}, salary = 0) {
  const basic = Number(breakdown.basic || 0);
  const hra = Number(breakdown.hra || 0);
  const da = Number(breakdown.da || 0);
  const other_allow = Number(breakdown.other_allow || breakdown.other || 0);
  const gross = Number(breakdown.gross || basic + hra + da + other_allow);
  const pf = Number(breakdown.pf || 0);
  const esi = Number(breakdown.esi || 0);
  const tds = Number(breakdown.tds || 0);
  const deductions = Number(breakdown.deductions || pf + esi + tds);
  const net_salary = Number(breakdown.net_salary || breakdown.netSalary || gross - deductions);
  const ctc = Number(breakdown.ctc || salary * 12);

  return { basic, hra, da, other_allow, gross, pf, esi, tds, deductions, net_salary, ctc };
}

// ── Generate payroll for a month (idempotent) ─────────────────────────────────
const generateMonthlyPayroll = async (
  month = currentMonth(),
  monthDate = currentMonthDate(),
  { employeeId, overrideSalary, customBreakdown } = {}
) => {
  const params = [];
  let query = `SELECT id, salary FROM employees WHERE salary IS NOT NULL AND salary > 0`;
  if (employeeId) {
    query += ` AND id = ?`;
    params.push(employeeId);
  }

  const [employees] = await pool.query(query, params);

  const results = [];
  for (const emp of employees) {
    const salary = overrideSalary ? Number(overrideSalary) : Number(emp.salary);
    const breakdown = customBreakdown
      ? normalizeBreakdown(customBreakdown, salary)
      : calcBreakdown(salary);

    try {
      const [result] = await pool.query(
        `INSERT INTO payroll
          (employee_id, month, month_date, basic, hra, da, other_allow,
           gross, pf, esi, tds, deductions, net_salary, ctc, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
         ON DUPLICATE KEY UPDATE
           basic=VALUES(basic), hra=VALUES(hra), da=VALUES(da),
           other_allow=VALUES(other_allow), gross=VALUES(gross),
           pf=VALUES(pf), esi=VALUES(esi), tds=VALUES(tds),
           deductions=VALUES(deductions), net_salary=VALUES(net_salary),
           ctc=VALUES(ctc), updated_at=NOW()`,
        [emp.id, month, monthDate, ...Object.values(breakdown)]
      );
      results.push({ employee_id: emp.id, id: result.insertId || null });
    } catch (e) {
      console.error(`Payroll gen failed for emp ${emp.id}:`, e.message);
    }
  }
  return results;
};

// ── Get all payroll with employee details ─────────────────────────────────────
const getAllPayroll = async (month) => {
  let query = `
    SELECT
      p.id, p.employee_id,
      e.employeeId, e.name AS employee,
      e.department, e.designation,
      p.month, p.month_date,
      p.basic, p.hra, p.da, p.other_allow, p.gross,
      p.pf, p.esi, p.tds, p.deductions,
      p.net_salary, p.ctc,
      p.status, p.paid_on, p.remarks,
      p.created_at
    FROM payroll p
    JOIN employees e ON p.employee_id = e.id
  `;
  const params = [];
  if (month) {
    query += ` WHERE p.month = ?`;
    params.push(month);
  }
  query += ` ORDER BY p.month_date DESC, e.name ASC`;
  const [rows] = await pool.query(query, params);
  return rows;
};

// ── Get payslip by payroll id ─────────────────────────────────────────────────
const getPayrollById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
       p.id, p.employee_id,
       e.employeeId, e.name AS employee,
       e.department, e.designation, e.email AS employeeEmail,
       p.month, p.basic, p.hra, p.da, p.other_allow, p.gross,
       p.pf, p.esi, p.tds, p.deductions,
       p.net_salary, p.ctc,
       p.status, p.paid_on, p.remarks
     FROM payroll p
     JOIN employees e ON p.employee_id = e.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// ── Get payroll by employee (for payslips page) ───────────────────────────────
const getPayrollByEmployee = async (employeeId) => {
  const [rows] = await pool.query(
    `SELECT p.*, e.name AS employee, e.department, e.designation
     FROM payroll p
     JOIN employees e ON p.employee_id = e.id
     WHERE p.employee_id = ?
     ORDER BY p.month_date DESC`,
    [employeeId]
  );
  return rows;
};

// ── Mark as Processed/Paid ────────────────────────────────────────────────────
const updatePayrollStatus = async (id, status, remarks = null) => {
  const paid_on = status === "Paid" ? new Date().toISOString().slice(0, 10) : null;
  await pool.query(
    `UPDATE payroll SET status = ?, paid_on = ?, remarks = ?, updated_at = NOW() WHERE id = ?`,
    [status, paid_on, remarks, id]
  );
};

// ── Delete payroll record ────────────────────────────────────────────────────
const deletePayroll = async (id) => {
  const [result] = await pool.query(`DELETE FROM payroll WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

// ── Run payroll — mark all Pending → Processed ────────────────────────────────
const runPayroll = async (month) => {
  await pool.query(
    `UPDATE payroll SET status = 'Processed', updated_at = NOW()
     WHERE status = 'Pending' ${month ? "AND month = ?" : ""}`,
    month ? [month] : []
  );
};

module.exports = {
  calcBreakdown,
  generateMonthlyPayroll,
  getAllPayroll,
  getPayrollById,
  getPayrollByEmployee,
  updatePayrollStatus,
  deletePayroll,
  runPayroll,
};
