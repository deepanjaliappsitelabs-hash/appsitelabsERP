import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiDownload, FiFileText, FiRefreshCw, FiX } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import { getReports } from "../../../services/reportService";
import { getAttendance } from "../../../services/attendanceService";
import { getLeaves } from "../../../services/leaveService";
import { getCandidates } from "../../../services/recruitmentService";
import { getEmployees } from "../../../services/employeeService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  const isDate = /^\d{4}-\d{2}-\d{2}/.test(str);
  return isDate ? `"\t${str}"` : `"${str.replaceAll('"', '""')}"`;
}

function downloadCSV(rows, fileName) {
  if (!rows.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => headers.map((h) => formatCell(row[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPDF(rows, title) {
  if (!rows.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(rows[0]);
  const headerRow = headers.map((h) => `<th>${h}</th>`).join("");
  const bodyRows = rows
    .map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
    h1   { font-size: 20px; margin-bottom: 4px; }
    p    { font-size: 12px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #5B3FD6; color: #fff; padding: 8px 10px; text-align: left; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9f9f9; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Generated on ${new Date().toLocaleString("en-IN")}</p>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function fetchReportData(reportId, filters) {
  const { from, to } = filters;
  const inRange = (d) => {
    if (!d) return true;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  switch (reportId) {
    case "attendance": {
      const rows = await getAttendance();
      return rows.filter((r) => inRange(r.date)).map((r) => ({
        Employee:    r.employeeName,
        Department:  r.department || "-",
        Date:        r.date,
        "Check-in":  r.checkIn || "-",
        "Check-out": r.checkOut || "-",
        Hours:       r.hours || "-",
        Status:      r.status,
      }));
    }
    case "leave": {
      const rows = await getLeaves();
      return rows.filter((r) => inRange(r.fromDate)).map((r) => ({
        Employee:     r.employeeName,
        "Leave Type": r.leaveType,
        From:         r.fromDate,
        To:           r.toDate,
        Days:         r.days || 1,
        Reason:       r.reason || "-",
        Status:       r.status,
        "Applied On": r.appliedOn || "-",
      }));
    }
    case "recruitment": {
      const rows = await getCandidates();
      return rows.filter((r) => inRange(r.dateApplied)).map((r) => ({
        Candidate:      r.name,
        Email:          r.email,
        Phone:          r.phone,
        "Applied For":  r.appliedFor,
        Stage:          r.stage,
        "Date Applied": r.dateApplied,
      }));
    }
    default: {
      const rows = await getEmployees();
      return rows.map((e) => ({
        Name:       e.name,
        Department: e.department || "-",
        Role:       e.role || "-",
        Status:     e.status || "-",
        Joined:     e.joiningDate || "-",
        Salary:     e.salary ? `₹${e.salary}` : "-",
      }));
    }
  }
}

// ── Inline Preview Table ──────────────────────────────────────────────────────

function PreviewTable({ rows, onClose }) {
  if (!rows || !rows.length) return null;
  const headers = Object.keys(rows[0]);
  const SHOW = 10;

  return (
    <div className="mt-5 rounded-xl border border-[#E7E8F0] bg-white">
      <div className="flex items-center justify-between border-b border-[#E7E8F0] px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">
          Preview — {rows.length} record{rows.length !== 1 ? "s" : ""}
          {rows.length > SHOW && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              (showing first {SHOW})
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-[#F1EDFF] hover:text-[#5B3FD6]"
        >
          <FiX />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8F9FC]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, SHOW).map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAFD]"}>
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {row[h] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────

function ReportCard({ report, filters }) {
  const [loading, setLoading]       = useState(false);
  const [rows, setRows]             = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await fetchReportData(report.id, filters);
      setRows(data);
      setShowPreview(true);
      toast.success(
        `${report.title} — ${data.length} record${data.length !== 1 ? "s" : ""} found`
      );
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExcel = async () => {
    const data = rows ?? (await fetchReportData(report.id, filters));
    if (!rows) { setRows(data); setShowPreview(true); }
    downloadCSV(data, report.title);
    toast.success("Exported as CSV");
  };

  const handlePDF = async () => {
    const data = rows ?? (await fetchReportData(report.id, filters));
    if (!rows) { setRows(data); setShowPreview(true); }
    downloadPDF(data, report.title);
  };

  return (
    <div className="rounded-2xl border border-[#E7E8F0] bg-white p-5 shadow-[0_14px_40px_rgba(17,24,39,0.05)]">
      {/* Icon + title */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFF] text-[#5B3FD6]">
          <FiFileText className="text-lg" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-950">{report.title}</h2>
          <p className="mt-1 min-h-10 text-sm leading-6 text-slate-500">
            {report.description}
          </p>
        </div>
      </div>

      {/* Record count + toggle */}
      {rows !== null && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F1EDFF] px-3 py-2">
          <span className="text-sm font-semibold text-[#5B3FD6]">
            {rows.length} record{rows.length !== 1 ? "s" : ""} found
          </span>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs font-semibold text-[#5B3FD6] underline underline-offset-2"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="flex items-center gap-2 px-4 py-2"
          onClick={generate}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          {loading ? "Generating…" : "Generate"}
        </Button>

        <button
          type="button"
          onClick={handleExcel}
          className="flex items-center gap-2 rounded-lg border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
        >
          <FiDownload className="text-green-600" />
          Excel
        </button>

        <button
          type="button"
          onClick={handlePDF}
          className="flex items-center gap-2 rounded-lg border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
        >
          <FiDownload className="text-red-500" />
          PDF
        </button>
      </div>

      {/* ── Inline preview table — appears below buttons ── */}
      {showPreview && (
        <PreviewTable rows={rows} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

function Reports() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "" });

  useEffect(() => {
    getReports().then(setReports);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate operational reports across attendance, payroll, recruitment, leaves, and revenue."
      />

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Filter by date range (optional)
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
          />
          <Input
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
          />
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} filters={filters} />
        ))}
      </div>
    </div>
  );
}

export default Reports;