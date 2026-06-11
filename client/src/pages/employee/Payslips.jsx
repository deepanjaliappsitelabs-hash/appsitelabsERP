import { useEffect, useState } from "react";
import {
  FiDownload,
  FiEye,
  FiFileText,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiX,
  FiPrinter,
} from "react-icons/fi";
import getStoredUser from "../../utils/authStorage";
import { getEmployeePayroll } from "../../services/payrollService";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const normalizeSlip = (record = {}) => {
  const grossSalary = Number(record.grossSalary ?? record.salary ?? record.gross ?? 0);
  const netSalary = Number(record.netSalary ?? record.inHand ?? record.net_salary ?? 0);
  const deductions = Number(record.deductions ?? Math.max(grossSalary - netSalary, 0));
  return {
    ...record,
    id: record._id || record.id,
    month: record.month || "-",
    issueDate: record.issueDate || record.generated_at?.slice?.(0, 10) || record.created_at?.slice?.(0, 10) || "-",
    grossSalary,
    netSalary,
    deductions,
    status: record.status || "Pending",
    breakdown: record.breakdown || {
      earnings: [{ label: "Gross Salary", amount: grossSalary }],
      deductions: [{ label: "Total Deductions", amount: deductions }],
    },
  };
};

// ── Payslip Modal ─────────────────────────────────────────────────────────────
function PayslipModal({ slip, user, onClose }) {
  if (!slip) return null;

  const totalEarnings   = slip.breakdown.earnings.reduce((a, e) => a + e.amount, 0);
  const totalDeductions = slip.breakdown.deductions.reduce((a, d) => a + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E7E8F0] bg-white shadow-xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E7E8F0] bg-white px-6 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Payslip — {slip.month}</h2>
            <p className="text-xs text-slate-400">Issued: {slip.issueDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-[#E7E8F0] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#F6F7FB]"
            >
              <FiPrinter /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-[#F6F7FB]"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Company + Employee info */}
          <div className="flex flex-wrap justify-between gap-4 rounded-xl bg-[#F5F3FC] p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#302568]">Company</p>
              <p className="mt-1 font-bold text-slate-900">AppsiteLabs Pvt. Ltd.</p>
              <p className="text-xs text-slate-500"> WZ-128, 1st Floor, Budhela Market, Vikaspuri, New Delhi - 110018.</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#302568]">Employee</p>
              <p className="mt-1 font-bold text-slate-900">{user?.name || "-"}</p>
              <p className="text-xs text-slate-500">{user?.department || "-"} · {user?.id || user?.employeeId || "-"}</p>
            </div>
          </div>

          {/* Earnings + Deductions table */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Earnings */}
            <div className="rounded-xl border border-[#E7E8F0] overflow-hidden">
              <div className="bg-green-50 px-4 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700">Earnings</p>
              </div>
              <div className="divide-y divide-[#F0F0F5]">
                {slip.breakdown.earnings.map((e) => (
                  <div key={e.label} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-600">{e.label}</span>
                    <span className="font-semibold text-slate-800">{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-[#E7E8F0] bg-green-50 px-4 py-2.5 text-sm font-bold">
                <span className="text-green-800">Total Earnings</span>
                <span className="text-green-800">{fmt(totalEarnings)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="rounded-xl border border-[#E7E8F0] overflow-hidden">
              <div className="bg-red-50 px-4 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">Deductions</p>
              </div>
              <div className="divide-y divide-[#F0F0F5]">
                {slip.breakdown.deductions.map((d) => (
                  <div key={d.label} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-600">{d.label}</span>
                    <span className="font-semibold text-slate-800">{fmt(d.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-[#E7E8F0] bg-red-50 px-4 py-2.5 text-sm font-bold">
                <span className="text-red-700">Total Deductions</span>
                <span className="text-red-700">{fmt(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="flex items-center justify-between rounded-2xl bg-[#302568] px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-200">Net Pay</p>
              <p className="text-xs text-purple-300 mt-0.5">After all deductions</p>
            </div>
            <p className="text-2xl font-bold text-white">{fmt(slip.netSalary)}</p>
          </div>

          {/* Note */}
          <p className="text-center text-xs text-slate-400">
            This is a computer-generated payslip and does not require a signature.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Payslips() {
  const user = getStoredUser();
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const employeeId = user?.employeeId || user?.id || user?._id;

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    getEmployeePayroll(employeeId)
      .then((rows) => setPayslips(rows.map(normalizeSlip)))
      .catch(() => setPayslips([]))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const latest = payslips[0] || normalizeSlip();

  return (
    <div className="min-h-screen bg-[#F6F7FB] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Payslips</h1>
          <p className="text-sm text-slate-400">Download or view your monthly salary slips</p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: FiDollarSign,
              label: "Gross Salary",
              value: fmt(latest.grossSalary),
              sub: "Per month (CTC component)",
              color: "bg-blue-50 text-blue-600",
            },
            {
              icon: FiTrendingUp,
              label: "Net Take Home",
              value: fmt(latest.netSalary),
              sub: "After all deductions",
              color: "bg-green-50 text-green-600",
            },
            {
              icon: FiFileText,
              label: "Total Deductions",
              value: fmt(latest.deductions),
              sub: "PF + Tax + ESI",
              color: "bg-red-50 text-red-500",
            },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => payslips.length && setSelectedSlip(latest)}
              className="rounded-2xl border border-[#E7E8F0] bg-white p-5 text-left shadow-sm transition hover:border-[#7560A7] hover:bg-[#F8F7FC] focus:outline-none focus:ring-2 focus:ring-[#302568]/20"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="text-lg" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
            </button>
          ))}
        </div>

        {/* Payslips list */}
        <div className="rounded-2xl border border-[#E7E8F0] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#F0F0F5] px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F3FC]">
              <FiCalendar className="text-[#302568]" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Payslip History</h2>
          </div>

          <div className="divide-y divide-[#F0F0F5]">
            {loading ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400">Loading payslips...</div>
            ) : payslips.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400">No payslips found</div>
            ) : payslips.map((slip) => (
              <div
                key={slip.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSlip(slip)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedSlip(slip);
                }}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-[#FAFAFD]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FC]">
                    <FiFileText className="text-[#302568]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{slip.month}</p>
                    <p className="text-xs text-slate-400">Issued: {slip.issueDate} · {slip.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400">Net Pay</p>
                    <p className="font-bold text-slate-900">{fmt(slip.netSalary)}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {slip.status}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedSlip(slip);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-[#E7E8F0] px-3 py-2 text-xs font-semibold text-slate-600 hover:border-[#302568]/30 hover:bg-[#F5F3FC] hover:text-[#302568] transition"
                    >
                      <FiEye className="text-xs" /> View
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-xl bg-[#302568] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3d3080] transition"
                    >
                      <FiDownload className="text-xs" /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal */}
      {selectedSlip && (
        <PayslipModal
          slip={selectedSlip}
          user={user}
          onClose={() => setSelectedSlip(null)}
        />
      )}
    </div>
  );
}
