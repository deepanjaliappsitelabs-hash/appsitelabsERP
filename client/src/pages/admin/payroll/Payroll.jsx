import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle, FiClock, FiDollarSign, FiMinusCircle,
  FiDownload, FiRefreshCw, FiPlay, FiPlus,
} from "react-icons/fi";
import PayrollTable from "../../../components/payroll/PayrollTable";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Select from "../../../components/ui/Select";
import StatsCard from "../../../components/ui/StatsCard";
import Modal from "../../../components/ui/Modal";
import {
  getPayrollRecords,
  generatePayroll,
  runPayroll,
  updatePayrollStatus,
  deletePayroll,
} from "../../../services/payrollService";
import { getEmployees } from "../../../services/employeeService";
import formatCurrency from "../../../utils/formatCurrency";
import exportToExcel from "../../../utils/exportToExcel";

// ── Month options ─────────────────────────────────────────────────────────────
function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
    const value = label;
    const monthDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    options.push({ label, value, monthDate });
  }
  return options;
}

const PRIMARY   = "#302568";
const SECONDARY = "#7560A7";
const SOFT      = "#EDE8F5";

function Payroll() {
  const navigate  = useNavigate();
  const [records, setRecords]       = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning]       = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [filters, setFilters]       = useState({ month: "", department: "" });
  const [genForm, setGenForm]       = useState({ month: "", employeeId: "all", overrideSalary: "" });

  const monthOptions = getMonthOptions();

  // ── Load data ───────────────────────────────────────────────────────────────
  const load = async (month) => {
    try {
      setLoading(true);
      const [data, empData] = await Promise.all([
        getPayrollRecords(month || undefined),
        getEmployees(),
      ]);
      setRecords(data);
      setEmployees(empData);
      if (data.length && !filters.month) {
        setFilters((prev) => ({ ...prev, month: data[0].month }));
      }
    } catch (err) {
      toast.error("Payroll load failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Filtered records ────────────────────────────────────────────────────────
  const filteredRecords = useMemo(
    () =>
      records.filter((r) => {
        const matchesMonth      = !filters.month      || r.month      === filters.month;
        const matchesDepartment = !filters.department || r.department === filters.department;
        return matchesMonth && matchesDepartment;
      }),
    [records, filters]
  );

  const processed    = records.filter((r) => r.status === "Processed").length;
  const paid         = records.filter((r) => r.status === "Paid").length;
  const pending      = records.filter((r) => r.status === "Pending").length;
  const totalNetPay  = filteredRecords.reduce((s, r) => s + Number(r.inHand     || 0), 0);
  const totalDeduct  = filteredRecords.reduce((s, r) => s + Number(r.deductions || 0), 0);
  const departments  = [...new Set(records.map((r) => r.department).filter(Boolean))];
  const months       = [...new Set(records.map((r) => r.month).filter(Boolean))];

  // ── Generate payroll ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!genForm.month) { toast.error("Month select karo"); return; }
    try {
      setGenerating(true);
      const selected   = monthOptions.find((m) => m.value === genForm.month);
      const employeeId = genForm.employeeId !== "all" ? genForm.employeeId : undefined;
      const override   = genForm.overrideSalary ? Number(genForm.overrideSalary) : undefined;
      const customBreakdown = breakdownTouched ? {
        basic: bdNum("basic"), hra: bdNum("hra"), da: bdNum("da"),
        other_allow: bdNum("other"), pf: bdNum("pf"), tds: bdNum("tds"),
        gross: bdGross, net_salary: bdNet,
      } : undefined;
      await generatePayroll(genForm.month, selected?.monthDate, employeeId, override, customBreakdown);
      const empName = employeeId
        ? employees.find((e) => String(e._id ?? e.id) === String(employeeId))?.name || "Employee"
        : "All employees";
      toast.success(`Payroll generated for ${empName}!`);
      const genMonth = genForm.month;
      setShowGenModal(false);
      setGenForm({ month: "", employeeId: "all", overrideSalary: "" });
      setBreakdown({ basic: "", hra: "", da: "", other: "", pf: "", tds: "" });
      setBreakdownTouched(false);
      await load(genMonth);
      setFilters((prev) => ({ ...prev, month: genMonth }));
    } catch (err) {
      toast.error("Generate failed: " + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  // ── Run payroll (Pending → Processed) ──────────────────────────────────────
  const handleRunPayroll = async () => {
    try {
      setRunning(true);
      const updated = await runPayroll(filters.month || undefined);
      if (updated.length) setRecords(updated);
      else await load(filters.month);
      toast.success("Payroll processed — all Pending → Processed");
    } catch (err) {
      toast.error("Run payroll failed: " + (err.response?.data?.message || err.message));
    } finally {
      setRunning(false);
    }
  };

  // ── Status toggle ───────────────────────────────────────────────────────────
  const handleStatusChange = async (record, newStatus) => {
    try {
      await updatePayrollStatus(record._id, newStatus);
      setRecords((prev) =>
        prev.map((r) => (r._id === record._id ? { ...r, status: newStatus } : r))
      );
      toast.success(`Status updated → ${newStatus}`);
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const handleDeletePayroll = async (record) => {
    const payrollId = record._id ?? record.id;
    if (!payrollId) {
      toast.error("Delete failed: payroll id missing");
      return;
    }

    const employeeName = record.employee || "this employee";
    if (!window.confirm(`Delete payroll record for ${employeeName} (${record.month})?`)) return;

    try {
      await deletePayroll(payrollId);
      setRecords((prev) => prev.filter((r) => String(r._id ?? r.id) !== String(payrollId)));
      await load(filters.month);
      toast.success("Payroll record deleted");
    } catch (err) {
      toast.error("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  // ── Export Excel ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!filteredRecords.length) { toast.error("No records to export"); return; }
    const rows = filteredRecords.map((r) => ({
      "Employee":    r.employee,
      "Employee ID": r.employeeId,
      "Department":  r.department,
      "Month":       r.month,
      "Basic":       r.basic,
      "HRA":         r.hra,
      "DA":          r.da,
      "Other Allow": r.other_allow,
      "Gross":       r.gross,
      "PF":          r.pf,
      "ESI":         r.esi,
      "TDS":         r.tds,
      "Deductions":  r.deductions,
      "Net Salary":  r.inHand,
      "CTC":         r.ctc,
      "Status":      r.status,
    }));
    exportToExcel(rows, `Payroll_${filters.month || "All"}`);
    toast.success("Exported!");
  };

  // ── Selected employee preview ───────────────────────────────────────────────
  const selectedEmp = genForm.employeeId !== "all"
    ? employees.find((e) => String(e._id ?? e.id) === String(genForm.employeeId))
    : null;

  // Editable breakdown state
  const [breakdown, setBreakdown] = useState({ basic: "", hra: "", da: "", other: "", pf: "", tds: "" });
  const [breakdownTouched, setBreakdownTouched] = useState(false);

  // Auto-calculate breakdown when employee or override salary changes
  useEffect(() => {
    if (!selectedEmp && !genForm.overrideSalary) { setBreakdownTouched(false); return; }
    if (breakdownTouched) return; // Admin ne manually edit kiya hai — override mat karo
    const base = genForm.overrideSalary
      ? Number(genForm.overrideSalary)
      : Number(selectedEmp?.salary || 0);
    if (!base) return;
    const basic = Math.round(base * 0.50);
    const hra   = Math.round(base * 0.20);
    const da    = Math.round(base * 0.10);
    const other = Math.round(base * 0.20);
    const gross = basic + hra + da + other;
    const pf    = Math.round(gross * 0.12);
    const tds   = Math.round(gross * 0.05);
    setBreakdown({ basic, hra, da, other, pf, tds });
  }, [selectedEmp, genForm.overrideSalary, breakdownTouched]);

  // Reset breakdown when employee changes
  useEffect(() => { setBreakdownTouched(false); }, [genForm.employeeId]);

  const bdNum   = (k) => Number(breakdown[k] || 0);
  const bdGross = bdNum("basic") + bdNum("hra") + bdNum("da") + bdNum("other");
  const bdNet   = bdGross - bdNum("pf") - bdNum("tds");
  const showBreakdown = !!(selectedEmp || genForm.overrideSalary) && genForm.month;

  const handleBd = (key, val) => {
    setBreakdownTouched(true);
    setBreakdown((p) => ({ ...p, [key]: val }));
  };

  // Recalc PF/TDS when gross changes (only if not manually edited)
  const recalcDeductions = () => {
    setBreakdown((p) => {
      const g = Number(p.basic||0) + Number(p.hra||0) + Number(p.da||0) + Number(p.other||0);
      return { ...p, pf: Math.round(g * 0.12), tds: Math.round(g * 0.05) };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Process salary, deductions, and payslips by month and department."
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:shadow-md"
              style={{ borderColor: `${PRIMARY}30`, color: PRIMARY, background: SOFT }}
            >
              <FiDownload /> Export
            </button>
            <button
              type="button"
              onClick={() => setShowGenModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
            >
              <FiPlus /> Generate Payroll
            </button>
            <Button onClick={handleRunPayroll} disabled={running} className="inline-flex items-center gap-2">
              <FiPlay className={running ? "animate-pulse" : ""} />
              {running ? "Running…" : "Run Payroll"}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Net Pay This Month" value={formatCurrency(totalNetPay)} icon={<FiDollarSign />} />
        <StatsCard title="Processed"          value={processed}                   icon={<FiCheckCircle />} />
        <StatsCard title="Pending"            value={pending}                     icon={<FiClock />} />
        <StatsCard title="Total Deductions"   value={formatCurrency(totalDeduct)} icon={<FiMinusCircle />} />
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total",     value: records.length, color: PRIMARY,   dot: PRIMARY },
          { label: "Pending",   value: pending,        color: "#B45309", dot: "#D97706" },
          { label: "Processed", value: processed,      color: SECONDARY, dot: SECONDARY },
          { label: "Paid",      value: paid,           color: "#059669", dot: "#059669" },
        ].map(({ label, value, color, dot }) => (
          <div key={label} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 shadow-sm" style={{ borderColor: "#E7E8F0" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
            <span className="text-sm font-semibold text-slate-600">{label}:</span>
            <strong style={{ color }}>{value}</strong>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Month"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            options={[
              { value: "", label: "All months" },
              ...months.map((m) => ({ value: m, label: m })),
            ]}
          />
          <Select
            label="Department"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            options={[
              { value: "", label: "All departments" },
              ...departments.map((d) => ({ value: d, label: d })),
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FiRefreshCw className="mb-3 animate-spin text-3xl" style={{ color: PRIMARY }} />
          <p>Loading payroll…</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <FiDollarSign className="mx-auto mb-3 text-4xl text-slate-300" />
          <p className="font-semibold text-slate-400">No payroll records found</p>
          <p className="mt-1 text-sm text-slate-400">Click "Generate Payroll" to create records</p>
          <button
            type="button"
            onClick={() => setShowGenModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
          >
            <FiPlus /> Generate Payroll
          </button>
        </div>
      ) : (
        <PayrollTable
          records={filteredRecords}
          onViewPayroll={(record) => navigate(`/admin/payroll/payslip/${record._id}`)}
          onViewPayslip={(record) => navigate(`/admin/payroll/payslip/${record._id}`)}
          onDeletePayroll={handleDeletePayroll}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* ── Generate Modal ── */}
      {showGenModal && (
        <Modal
          title="Generate Payroll"
          onClose={() => { setShowGenModal(false); setGenForm({ month: "", employeeId: "all", overrideSalary: "" }); setBreakdown({ basic: "", hra: "", da: "", other: "", pf: "", tds: "" }); setBreakdownTouched(false); }}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowGenModal(false); setGenForm({ month: "", employeeId: "all", overrideSalary: "" }); setBreakdown({ basic: "", hra: "", da: "", other: "", pf: "", tds: "" }); setBreakdownTouched(false); }}
                className="rounded-xl border border-[#E0E3EC] px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Month + Employee — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Month <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-xl border border-[#E0E3EC] px-3 py-2.5 text-sm outline-none focus:border-[#302568] focus:ring-2 focus:ring-[#302568]/20"
                  value={genForm.month}
                  onChange={(e) => setGenForm((p) => ({ ...p, month: e.target.value }))}
                >
                  <option value="">-- Select --</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Employee
                </label>
                <select
                  className="w-full rounded-xl border border-[#E0E3EC] px-3 py-2.5 text-sm outline-none focus:border-[#302568] focus:ring-2 focus:ring-[#302568]/20"
                  value={genForm.employeeId}
                  onChange={(e) => setGenForm((p) => ({ ...p, employeeId: e.target.value, overrideSalary: "" }))}
                >
                  <option value="all">All Employees</option>
                  {employees.map((emp) => {
                    const empId   = emp._id || emp.id;
                    const empCode = emp.employeeId || emp.employee_id || "";
                    return (
                      <option key={empId} value={empId}>
                        {emp.name} {empCode ? `(${empCode})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Selected employee card */}
            {selectedEmp && (
              <div className="rounded-xl border border-[#E0DAF5] bg-[#F8F5FF] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
                    >
                      {selectedEmp.name?.[0]?.toUpperCase() || "E"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{selectedEmp.name}</p>
                      <p className="text-xs text-slate-500">
                        {selectedEmp.department || selectedEmp.dept || "—"} •{" "}
                        {selectedEmp.employeeId || selectedEmp.employee_id || ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Monthly Salary</p>
                    <p className="text-sm font-bold" style={{ color: PRIMARY }}>
                      ₹{Number(selectedEmp.salary || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Override salary */}
                <div className="mt-3 border-t border-[#E0DAF5] pt-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Override Salary this month? <span className="font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder={`Default: ${Number(selectedEmp.salary || 0).toLocaleString("en-IN")}`}
                      className="w-full rounded-lg border border-[#E0E3EC] pl-7 pr-3 py-2 text-sm outline-none focus:border-[#302568] focus:ring-2 focus:ring-[#302568]/20"
                      value={genForm.overrideSalary}
                      onChange={(e) => setGenForm((p) => ({ ...p, overrideSalary: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Editable Breakdown */}
            {showBreakdown && (
              <div className="rounded-xl border border-[#E7E8F0] bg-white px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Salary Breakdown <span className="normal-case font-normal text-slate-400">(editable)</span>
                  </p>
                  {breakdownTouched && (
                    <button
                      type="button"
                      onClick={() => { setBreakdownTouched(false); }}
                      className="text-xs font-semibold"
                      style={{ color: SECONDARY }}
                    >
                      ↺ Reset to default
                    </button>
                  )}
                </div>

                {/* Earnings */}
                <p className="mb-2 text-xs font-semibold text-green-600">Earnings</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    ["basic", "Basic (50%)"],
                    ["hra",   "HRA (20%)"],
                    ["da",    "DA (10%)"],
                    ["other", "Other Allow"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs text-slate-500">{label}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-[#E0E3EC] pl-6 pr-2 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#302568] focus:ring-1 focus:ring-[#302568]/20"
                          value={breakdown[key]}
                          onChange={(e) => handleBd(key, e.target.value)}
                          onBlur={recalcDeductions}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gross */}
                <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-600">Gross</span>
                  <span className="text-sm font-bold text-slate-800">
                    ₹{bdGross.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Deductions */}
                <p className="mb-2 text-xs font-semibold text-red-500">Deductions</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    ["pf",  "PF (12%)"],
                    ["tds", "TDS (5%)"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs text-slate-500">{label}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-red-400">₹</span>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-red-100 pl-6 pr-2 py-2 text-xs font-semibold text-red-600 outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
                          value={breakdown[key]}
                          onChange={(e) => handleBd(key, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Net In-Hand */}
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: `linear-gradient(135deg, ${PRIMARY}15, ${SECONDARY}15)` }}
                >
                  <span className="text-sm font-bold text-slate-700">Net In-Hand</span>
                  <span className="text-base font-bold" style={{ color: bdNet < 0 ? "#dc2626" : PRIMARY }}>
                    ₹{bdNet.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            {/* Info box — only when no breakdown */}
            {!showBreakdown && (
              <div className="rounded-xl border border-[#E7E8F0] bg-[#FAFAFA] px-4 py-3">
                <p className="text-xs font-semibold" style={{ color: PRIMARY }}>ℹ️ What will happen:</p>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-500">
                  <li>• {genForm.employeeId === "all" ? "All employees" : "Selected employee"}for payroll will generate </li>
                  <li>• Breakdown: Basic 50%, HRA 20%, DA 10%</li>
                  <li>• Deductions: PF 12%, TDS 5%</li>
                  <li>• If Already exist then it will update</li>
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Payroll;
