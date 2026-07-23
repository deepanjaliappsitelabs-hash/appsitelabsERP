// server/models/Payroll.js
const pool = require("../config/db");

let payrollColumnsReady = false;

const ensurePayrollColumns = async () => {
  if (payrollColumnsReady) return;

  const [cols] = await pool.query("SHOW COLUMNS FROM payroll");
  const existingColumns = new Set(cols.map((col) => col.Field));

  const addColumn = async (name, definition) => {
    if (!existingColumns.has(name)) {
      await pool.query(`ALTER TABLE payroll ADD COLUMN ${name} ${definition}`);
    }
  };

  await addColumn("per_day_salary", "DECIMAL(12,2) DEFAULT 0 AFTER tds");
  await addColumn("absent_days", "INT DEFAULT 0 AFTER per_day_salary");
  await addColumn("saturday_absent_days", "INT DEFAULT 0 AFTER absent_days");
  await addColumn("sunday_penalty_days", "INT DEFAULT 0 AFTER saturday_absent_days");
  await addColumn("attendance_deduction", "DECIMAL(12,2) DEFAULT 0 AFTER sunday_penalty_days");

  payrollColumnsReady = true;
};

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

const getMonthRange = (monthDate) => {
  const start = new Date(`${monthDate}T00:00:00`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const toKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return {
    startKey: toKey(start),
    endKey: toKey(end),
  };
};

const isSunday = (dateKey) => new Date(`${dateKey}T00:00:00`).getDay() === 0;
const isSaturday = (dateKey) => new Date(`${dateKey}T00:00:00`).getDay() === 6;

const nextDateKey = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getAttendanceDeduction = async (employeeId, monthDate, salary) => {
  const { startKey, endKey } = getMonthRange(monthDate);
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, LOWER(status) AS status
     FROM attendance
     WHERE employee_id = ? AND date BETWEEN ? AND ?`,
    [employeeId, startKey, endKey]
  );

  const absentDates = new Set(
    rows
      .filter((row) => row.status === "absent")
      .map((row) => row.date)
  );

  const absentDays = [...absentDates].filter((date) => !isSunday(date)).length;
  const saturdayAbsentDays = [...absentDates].filter(isSaturday).length;
  const sundayPenaltyDays = [...absentDates].filter((date) => {
    if (!isSaturday(date)) return false;
    const sunday = nextDateKey(date);
    return sunday <= endKey;
  }).length;
  const totalDeductionDays = absentDays + sundayPenaltyDays;
  const perDaySalary = Number((Number(salary || 0) / 30).toFixed(2));
  const attendanceDeduction = Number((perDaySalary * totalDeductionDays).toFixed(2));

  return {
    per_day_salary: perDaySalary,
    absent_days: absentDays,
    saturday_absent_days: saturdayAbsentDays,
    sunday_penalty_days: sundayPenaltyDays,
    attendance_deduction: attendanceDeduction,
  };
};

// ── Generate payroll for a month (idempotent) ─────────────────────────────────
const generateMonthlyPayroll = async (
  month = currentMonth(),
  monthDate = currentMonthDate(),
  { employeeId, overrideSalary, customBreakdown } = {}
) => {
  await ensurePayrollColumns();

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
    const attendance = await getAttendanceDeduction(emp.id, monthDate, salary);
    const finalBreakdown = {
      ...breakdown,
      deductions: Number(breakdown.deductions || 0) + attendance.attendance_deduction,
      net_salary: Number(breakdown.net_salary || 0) - attendance.attendance_deduction,
    };

    try {
      const [result] = await pool.query(
        `INSERT INTO payroll
          (employee_id, month, month_date, basic, hra, da, other_allow,
           gross, pf, esi, tds, per_day_salary, absent_days, saturday_absent_days,
           sunday_penalty_days, attendance_deduction, deductions, net_salary, ctc, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
         ON DUPLICATE KEY UPDATE
           basic=VALUES(basic), hra=VALUES(hra), da=VALUES(da),
           other_allow=VALUES(other_allow), gross=VALUES(gross),
           pf=VALUES(pf), esi=VALUES(esi), tds=VALUES(tds),
           per_day_salary=VALUES(per_day_salary),
           absent_days=VALUES(absent_days),
           saturday_absent_days=VALUES(saturday_absent_days),
           sunday_penalty_days=VALUES(sunday_penalty_days),
           attendance_deduction=VALUES(attendance_deduction),
           deductions=VALUES(deductions), net_salary=VALUES(net_salary),
           ctc=VALUES(ctc), updated_at=NOW()`,
        [
          emp.id,
          month,
          monthDate,
          finalBreakdown.basic,
          finalBreakdown.hra,
          finalBreakdown.da,
          finalBreakdown.other_allow,
          finalBreakdown.gross,
          finalBreakdown.pf,
          finalBreakdown.esi,
          finalBreakdown.tds,
          attendance.per_day_salary,
          attendance.absent_days,
          attendance.saturday_absent_days,
          attendance.sunday_penalty_days,
          attendance.attendance_deduction,
          finalBreakdown.deductions,
          finalBreakdown.net_salary,
          finalBreakdown.ctc,
        ]
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
  await ensurePayrollColumns();
  let query = `
    SELECT
      p.id, p.employee_id,
      e.employeeId, e.name AS employee,
      e.department, e.designation,
      p.month, p.month_date,
      p.basic, p.hra, p.da, p.other_allow, p.gross,
      p.pf, p.esi, p.tds,
      p.per_day_salary, p.absent_days, p.saturday_absent_days,
      p.sunday_penalty_days, p.attendance_deduction,
      p.deductions,
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
  await ensurePayrollColumns();
  const [rows] = await pool.query(
    `SELECT
       p.id, p.employee_id,
       e.employeeId, e.name AS employee,
       e.department, e.designation, e.email AS employeeEmail,
       p.month, p.basic, p.hra, p.da, p.other_allow, p.gross,
       p.pf, p.esi, p.tds,
       p.per_day_salary, p.absent_days, p.saturday_absent_days,
       p.sunday_penalty_days, p.attendance_deduction,
       p.deductions,
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
  await ensurePayrollColumns();
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
  await ensurePayrollColumns();
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
