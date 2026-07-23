import { useState } from "react";
import { FiChevronDown, FiEye, FiTrash2 } from "react-icons/fi";
import formatCurrency from "../../utils/formatCurrency";

const PRIMARY   = "#302568";
const SECONDARY = "#7560A7";
const SOFT      = "#EDE8F5";

const columns = [
  "Employee",
  "Department",
  "Month",
  "Gross",
  "Deductions",
  "Net Pay",
  "Status",
  "Actions",
];

const statusVariant = {
  Paid:      "success",
  Processed: "primary",
  Pending:   "warning",
};

const statusOptions = ["Pending", "Processed", "Paid"];

// ── Salary Breakdown Tooltip ──────────────────────────────────────────────────
function BreakdownTooltip({ record }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="rounded-lg px-2 py-1 text-xs font-semibold transition hover:opacity-80"
        style={{ background: SOFT, color: PRIMARY }}
      >
        Breakdown
      </button>
      {show && (
        <div
          className="absolute left-0 top-8 z-50 w-52 rounded-xl border bg-white p-4 shadow-xl"
          style={{ borderColor: "#E7E8F0" }}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY }}>
            Salary Breakdown
          </p>
          {[
            { label: "Basic",       value: record.basic },
            { label: "HRA",         value: record.hra },
            { label: "DA",          value: record.da },
            { label: "Other Allow", value: record.other_allow },
            { label: "Gross",       value: record.gross,      bold: true },
            { label: "PF",          value: record.pf,         minus: true },
            { label: "ESI",         value: record.esi,        minus: true },
            { label: "TDS",         value: record.tds,        minus: true },
            { label: "Attendance",  value: record.attendanceDeduction, minus: true },
            { label: "Deductions",  value: record.deductions, minus: true, bold: true },
            { label: "Net Pay",     value: record.inHand,     bold: true, highlight: true },
          ].map(({ label, value, bold, minus, highlight }) => (
            <div
              key={label}
              className={`flex justify-between py-1 text-xs ${highlight ? "mt-1 rounded-lg px-2 py-1.5" : ""}`}
              style={highlight ? { background: SOFT } : {}}
            >
              <span className={bold ? "font-bold text-slate-700" : "text-slate-500"}>{label}</span>
              <span
                className={bold ? "font-bold" : "font-semibold"}
                style={{ color: highlight ? PRIMARY : minus ? "#B45309" : "#1e293b" }}
              >
                {minus ? "−" : ""}{formatCurrency(value)}
              </span>
            </div>
          ))}
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <p className="font-bold">Attendance deduction</p>
            <p className="mt-1">Absent: {record.absentDays || 0} days</p>
            <p>Saturday absent: {record.saturdayAbsentDays || 0} days</p>
            <p>Sunday penalty: {record.sundayPenaltyDays || 0} days</p>
            <p>Per day: {formatCurrency(record.perDaySalary || 0)}</p>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="mt-3 w-full rounded-lg py-1 text-xs text-slate-400 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ── Status Dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({ record, onStatusChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition hover:opacity-80"
        style={
          record.status === "Paid"
            ? { background: "#ECFDF3", color: "#027A48", borderColor: "#A6F4C5" }
            : record.status === "Processed"
            ? { background: SOFT, color: PRIMARY, borderColor: "#C8BEE8" }
            : { background: "#FFFBEB", color: "#B45309", borderColor: "#FDE68A" }
        }
      >
        <span className={`h-1.5 w-1.5 rounded-full ${
          record.status === "Paid" ? "bg-emerald-500" :
          record.status === "Processed" ? "bg-[#7560A7]" : "bg-amber-500"
        }`} />
        {record.status}
        <FiChevronDown className="text-xs" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-8 z-50 w-36 overflow-hidden rounded-xl border bg-white shadow-xl"
          style={{ borderColor: "#E7E8F0" }}
        >
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onStatusChange(record, s);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition hover:bg-[#F8F6FF] ${
                record.status === s ? "font-bold" : ""
              }`}
              style={{ color: s === record.status ? PRIMARY : "#374151" }}
            >
              {s === record.status ? "✓ " : ""}{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────
function PayrollTable({ records = [], onViewPayroll, onViewPayslip, onDeletePayroll, onStatusChange }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#E7E8F0" }}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
              {columns.map((col) => (
                <th key={col} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-white">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                  No payroll records found
                </td>
              </tr>
            ) : (
              records.map((record, idx) => (
                <tr
                  key={record._id}
                  className="transition hover:bg-[#F8F6FF]"
                  style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAFE" }}
                >
                  {/* Employee */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
                      >
                        {record.employee?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: PRIMARY }}>{record.employee}</p>
                        <p className="text-xs text-slate-400">{record.employeeId}</p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-5 py-4 text-sm text-slate-600">{record.department || "—"}</td>

                  {/* Month */}
                  <td className="px-5 py-4">
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-bold"
                      style={{ background: SOFT, color: PRIMARY }}
                    >
                      {record.month}
                    </span>
                  </td>

                  {/* Gross */}
                  <td className="px-5 py-4 font-semibold" style={{ color: PRIMARY }}>
                    {formatCurrency(record.gross ?? record.salary)}
                  </td>

                  {/* Deductions */}
                  <td className="px-5 py-4 font-semibold text-amber-600">
                    <div>{formatCurrency(record.deductions)}</div>
                    {Number(record.attendanceDeduction || 0) > 0 && (
                      <p className="mt-1 text-xs font-semibold text-red-500">
                        Attendance {formatCurrency(record.attendanceDeduction)}
                      </p>
                    )}
                  </td>

                  {/* Net Pay */}
                  <td className="px-5 py-4 font-bold" style={{ color: "#059669" }}>
                    {formatCurrency(record.inHand)}
                  </td>

                  {/* Status — clickable dropdown */}
                  <td className="px-5 py-4">
                    <StatusDropdown record={record} onStatusChange={onStatusChange} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <BreakdownTooltip record={record} />
                      <button
                        type="button"
                        onClick={() => onViewPayroll?.(record)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition hover:opacity-80"
                        style={{ background: SOFT, color: PRIMARY }}
                        title="View payroll"
                      >
                        <FiEye /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewPayslip?.(record)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
                      >
                        Payslip
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePayroll?.(record)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                        title="Delete payroll"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Footer totals */}
          {records.length > 0 && (
            <tfoot>
              <tr style={{ background: SOFT }}>
                <td colSpan={3} className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY }}>
                  Total ({records.length} employees)
                </td>
                <td className="px-5 py-3 font-bold" style={{ color: PRIMARY }}>
                  {formatCurrency(records.reduce((s, r) => s + Number(r.gross ?? r.salary ?? 0), 0))}
                </td>
                <td className="px-5 py-3 font-bold text-amber-600">
                  {formatCurrency(records.reduce((s, r) => s + Number(r.deductions || 0), 0))}
                </td>
                <td className="px-5 py-3 font-bold" style={{ color: "#059669" }}>
                  {formatCurrency(records.reduce((s, r) => s + Number(r.inHand || 0), 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default PayrollTable;
