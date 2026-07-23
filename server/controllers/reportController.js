const pool = require("../config/db");

const reports = [
  { id: "attendance", title: "Attendance Report", description: "Daily, monthly, and status-wise attendance export." },
  { id: "salary", title: "Salary Report", description: "Payroll summary with earnings and deductions." },
  { id: "recruitment", title: "Recruitment Report", description: "Pipeline health, sources, and selection movement." },
  { id: "department", title: "Department Performance", description: "Team headcount, growth, and productivity indicators." },
  { id: "leave", title: "Leave Report", description: "Leave requests, balances, approvals, and trends." },
  { id: "revenue", title: "Revenue Analytics", description: "Revenue trend and project billing analytics." },
];

const getReports = (req, res) => res.json(reports);

const safeCount = async (table) => {
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM ${table}`);
    return rows[0]?.total || 0;
  } catch {
    return 0;
  }
};

const generateReport = async (req, res) => {
  try {
    const type = req.params.type;
    const summary = {
      attendance: await safeCount("attendance"),
      leaves: await safeCount("leaves"),
      jobs: await safeCount("jobs"),
      candidates: await safeCount("candidates"),
      projects: await safeCount("projects"),
      documents: await safeCount("documents"),
    };
    res.json({ ok: true, type, filters: req.body || {}, summary, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadReport = async (req, res) => {
  res.json({ ok: true, type: req.params.type, format: req.query.format || "excel" });
};

module.exports = { getReports, generateReport, downloadReport };
