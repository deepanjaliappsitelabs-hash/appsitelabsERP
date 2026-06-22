import { forwardRef, useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { FiCheckCircle, FiClock, FiFileText, FiXCircle } from "react-icons/fi";
import getStoredUser from "../../utils/authStorage";
import { createLeave, getMyLeaves, getLeaveBalance, DEFAULT_LEAVE_BALANCE } from "../../services/leaveService";
import Badge from "../../components/ui/Badge";

const LEAVE_TYPES = [
  "Casual Leave", "Sick Leave", "Earned Leave",
  "Maternity Leave", "Paternity Leave", "Unpaid Leave",
];

const LEAVE_MODES = [
  { id: "short",    label: "Short Leave",      description: "A few hours off",   icon: "⏱️" },
  { id: "fullday",  label: "Full Day Leave",    description: "Single day off",    icon: "📅" },
  { id: "multiday", label: "More Than One Day", description: "Multiple days off", icon: "🗓️" },
];

const STATUS_VARIANT = { Approved: "success", Pending: "warning", Rejected: "danger" };

const fieldCls = "w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";
const submitCls = "w-full rounded-xl bg-[#302568] px-6 py-3 text-sm font-bold text-white shadow-[0_1px_3px_rgba(48,37,104,0.35)] transition hover:bg-[#3d3080] active:bg-[#251d52]";

const timeStringToDate = (value) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const dateToTimeString = (date) => {
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const TimeInput = forwardRef(function TimeInput({ value, onClick, placeholder }, ref) {
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-left text-sm text-slate-900 outline-none transition hover:border-[#7560A7] focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
    >
      <span className={value ? "font-medium text-slate-900" : "text-slate-400"}>
        {value || placeholder}
      </span>
      <FiClock className="shrink-0 text-slate-500" />
    </button>
  );
});

function TimePickerField({ label, value, onChange }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <DatePicker
        selected={timeStringToDate(value)}
        onChange={(date) => onChange(dateToTimeString(date))}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="HH:mm"
        placeholderText="--:--"
        customInput={<TimeInput placeholder="--:--" />}
        wrapperClassName="w-full"
        popperPlacement="bottom-start"
      />
    </div>
  );
}

function ModeCard({ mode, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={["flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-5 text-center transition",
        active ? "border-[#302568] bg-[#EDE8F5]" : "border-[#E7E8F0] bg-white hover:border-[#7560A7] hover:bg-[#F3F0FA]",
      ].join(" ")}
    >
      <span className="text-2xl">{mode.icon}</span>
      <span className={["text-sm font-bold", active ? "text-[#302568]" : "text-slate-700"].join(" ")}>{mode.label}</span>
      <span className="text-xs text-slate-400">{mode.description}</span>
    </button>
  );
}

function ShortLeaveForm({ onSubmit }) {
  const [form, setForm] = useState({ leaveType: "", date: "", fromTime: "", toTime: "", reason: "" });
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const duration = (() => {
    if (!form.fromTime || !form.toTime || form.fromTime >= form.toTime) return null;
    const [fh, fm] = form.fromTime.split(":").map(Number);
    const [th, tm] = form.toTime.split(":").map(Number);
    const mins = (th * 60 + tm) - (fh * 60 + fm);
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.leaveType || !form.date || !form.fromTime || !form.toTime || !form.reason)
      return toast.error("Please fill all fields");
    if (form.fromTime >= form.toTime) return toast.error("End time must be after start time");
    onSubmit({ ...form, leaveCategory: "Short Leave", fromDate: form.date, toDate: form.date, days: 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Leave Type</label>
        <select name="leaveType" value={form.leaveType} onChange={set} className={fieldCls}>
          <option value="">Select leave type</option>
          {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Date</label>
        <input type="date" name="date" value={form.date} onChange={set} className={fieldCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TimePickerField
          label="From Time"
          value={form.fromTime}
          onChange={(value) => setForm((p) => ({ ...p, fromTime: value }))}
        />
        <TimePickerField
          label="To Time"
          value={form.toTime}
          onChange={(value) => setForm((p) => ({ ...p, toTime: value }))}
        />
      </div>
      {duration && (
        <div className="rounded-xl bg-[#EDE8F5] px-4 py-2.5 text-sm font-medium text-[#302568]">
          ⏱ Duration: <strong>{duration}</strong>
        </div>
      )}
      <div>
        <label className={labelCls}>Reason</label>
        <textarea name="reason" value={form.reason} onChange={set} rows="3"
          placeholder="Briefly explain the reason" className={fieldCls} />
      </div>
      <button type="submit" className={submitCls}>Apply Short Leave</button>
    </form>
  );
}

function FullDayLeaveForm({ onSubmit }) {
  const [form, setForm] = useState({ leaveType: "", date: "", session: "full", reason: "" });
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.leaveType || !form.date || !form.reason) return toast.error("Please fill all fields");
    onSubmit({ ...form, leaveCategory: "Full Day Leave", fromDate: form.date, toDate: form.date,
      days: form.session === "full" ? 1 : 0.5 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Leave Type</label>
        <select name="leaveType" value={form.leaveType} onChange={set} className={fieldCls}>
          <option value="">Select leave type</option>
          {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Date</label>
        <input type="date" name="date" value={form.date} onChange={set} className={fieldCls} />
      </div>
      <div>
        <label className={labelCls}>Session</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "full", label: "Full Day", sub: "1 day" },
            { value: "morning", label: "Morning", sub: "First half" },
            { value: "afternoon", label: "Afternoon", sub: "Second half" },
          ].map((s) => (
            <button key={s.value} type="button"
              onClick={() => setForm((p) => ({ ...p, session: s.value }))}
              className={["rounded-xl border-2 py-3 text-center transition",
                form.session === s.value ? "border-[#302568] bg-[#EDE8F5]" : "border-[#E7E8F0] hover:border-[#7560A7]"].join(" ")}
            >
              <p className={["text-sm font-bold", form.session === s.value ? "text-[#302568]" : "text-slate-700"].join(" ")}>{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Reason</label>
        <textarea name="reason" value={form.reason} onChange={set} rows="3"
          placeholder="Briefly explain the reason" className={fieldCls} />
      </div>
      <button type="submit" className={submitCls}>Apply Full Day Leave</button>
    </form>
  );
}

function MultiDayLeaveForm({ onSubmit }) {
  const [form, setForm] = useState({ leaveType: "", fromDate: "", toDate: "", reason: "" });
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const dayCount = (() => {
    if (!form.fromDate || !form.toDate) return 0;
    const diff = (new Date(form.toDate) - new Date(form.fromDate)) / 86400000;
    return diff >= 0 ? diff + 1 : 0;
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.leaveType || !form.fromDate || !form.toDate || !form.reason)
      return toast.error("Please fill all fields");
    if (form.toDate < form.fromDate) return toast.error("End date must be after start date");
    if (dayCount < 2) return toast.error("Select more than 1 day");
    onSubmit({ ...form, leaveCategory: "Multi-Day Leave", days: dayCount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Leave Type</label>
        <select name="leaveType" value={form.leaveType} onChange={set} className={fieldCls}>
          <option value="">Select leave type</option>
          {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>From Date</label>
          <input type="date" name="fromDate" value={form.fromDate} onChange={set} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>To Date</label>
          <input type="date" name="toDate" value={form.toDate} min={form.fromDate} onChange={set} className={fieldCls} />
        </div>
      </div>
      {dayCount >= 2 && (
        <div className="rounded-xl bg-[#EDE8F5] px-4 py-2.5 text-sm font-medium text-[#302568]">
          🗓 Total: <strong>{dayCount} days</strong>
        </div>
      )}
      <div>
        <label className={labelCls}>Reason</label>
        <textarea name="reason" value={form.reason} onChange={set} rows="4"
          placeholder="Explain the reason for your leave" className={fieldCls} />
      </div>
      <button type="submit" className={submitCls}>Apply Leave</button>
    </form>
  );
}

function LeaveBalanceSection({ balance }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Object.entries(balance).map(([type, { total, used }]) => {
        const remaining = total - used;
        const pct = Math.round((used / total) * 100);
        return (
          <div key={type} className="rounded-2xl border border-[#E7E8F0] bg-white p-4 shadow-[0_4px_16px_rgba(48,37,104,0.06)]">
            <p className="text-xs font-semibold text-slate-500">{type}</p>
            <p className="mt-1 text-2xl font-bold text-[#302568]">{remaining}</p>
            <p className="text-xs text-slate-400">of {total} remaining</p>
            <div className="mt-2 h-1.5 rounded-full bg-[#EEF0F6]">
              <div className="h-1.5 rounded-full bg-[#302568] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaveHistory({ leaves, activeStatus, onStatusChange }) {
  if (!leaves.length)
    return <p className="py-10 text-center text-sm text-slate-400">No leave requests yet.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "Approved", "Pending", "Rejected"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(status)}
            className={[
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              activeStatus === status
                ? "bg-[#302568] text-white"
                : "bg-[#F6F7FB] text-slate-600 hover:bg-[#EDE8F5] hover:text-[#302568]",
            ].join(" ")}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>
      {leaves.map((l) => (
        <div key={l._id} className="flex items-start justify-between rounded-2xl border border-[#E7E8F0] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(48,37,104,0.05)]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">{l.leaveType}</p>
              {l.leaveCategory && (
                <span className="rounded-full bg-[#EDE8F5] px-2 py-0.5 text-xs font-semibold text-[#302568]">
                  {l.leaveCategory}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {l.leaveCategory === "Short Leave"
                ? `${l.fromDate} · ${l.fromTime} – ${l.toTime}`
                : l.fromDate === l.toDate ? l.fromDate
                : `${l.fromDate} → ${l.toDate} (${l.days} days)`}
            </p>
            {l.reason && <p className="text-xs text-slate-400">{l.reason}</p>}
            {l.remarks && <p className="mt-1 text-xs font-medium text-[#7560A7]">Remarks: {l.remarks}</p>}
          </div>
          <Badge variant={STATUS_VARIANT[l.status] || "neutral"}>{l.status}</Badge>
        </div>
      ))}
    </div>
  );
}

function Tab({ id, label, active, onClick }) {
  return (
    <button type="button" onClick={() => onClick(id)}
      className={["rounded-xl px-5 py-2.5 text-sm font-semibold transition",
        active ? "bg-[#302568] text-white" : "text-slate-600 hover:bg-[#EDE8F5] hover:text-[#302568]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Leaves() {
  const location = useLocation();
  const user = getStoredUser();
  const employeeId = user?.id ?? user?._id ?? user?.employeeId;

  const [activeTab, setActiveTab] = useState(location.state?.tab || "apply");
  const [statusFilter, setStatusFilter] = useState(location.state?.status || "all");
  const [mode, setMode]           = useState("fullday");
  const [myLeaves, setMyLeaves]   = useState([]);
  const [balance, setBalance]     = useState(DEFAULT_LEAVE_BALANCE);
  const [loading, setLoading]     = useState(false);

  const refreshLeaveData = useCallback(() => {
    if (!employeeId) return;
    Promise.all([getMyLeaves(employeeId), getLeaveBalance(employeeId)])
      .then(([leaves, bal]) => {
        setMyLeaves(leaves);
        setBalance(bal ?? DEFAULT_LEAVE_BALANCE);
      })
      .catch(() => {});
  }, [employeeId]);

  useEffect(() => {
    refreshLeaveData();
    const intervalId = window.setInterval(refreshLeaveData, 5002);
    window.addEventListener("focus", refreshLeaveData);
    const handleNotification = (event) => {
      if (event.detail?.type === "leave") refreshLeaveData();
    };
    window.addEventListener("app:notification", handleNotification);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshLeaveData);
      window.removeEventListener("app:notification", handleNotification);
    };
  }, [refreshLeaveData]);

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
    if (location.state?.status) setStatusFilter(location.state.status);
  }, [location.state]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        employeeId,
        employeeName: user?.name || "Employee",
        appliedOn: new Date().toISOString().slice(0, 10),
        status: "Pending",
      };
      const created = await createLeave(payload);
      setMyLeaves((prev) => [created, ...prev]);
      refreshLeaveData();
      toast.success("Leave applied successfully!");
      setActiveTab("history");
    } catch (err) {
      toast.error("Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const activeMode = LEAVE_MODES.find((m) => m.id === mode);
  const stats = [
    { label: "Total Applied", status: "all",      value: myLeaves.length,                                        icon: <FiFileText />,    color: "text-slate-700" },
    { label: "Approved",      status: "Approved", value: myLeaves.filter((l) => l.status === "Approved").length, icon: <FiCheckCircle />, color: "text-emerald-600" },
    { label: "Pending",       status: "Pending",  value: myLeaves.filter((l) => l.status === "Pending").length,  icon: <FiClock />,       color: "text-amber-600" },
    { label: "Rejected",      status: "Rejected", value: myLeaves.filter((l) => l.status === "Rejected").length, icon: <FiXCircle />,     color: "text-red-500" },
  ];
  const filteredLeaves = statusFilter === "all"
    ? myLeaves
    : myLeaves.filter((leave) => leave.status === statusFilter);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#302568]">My Leaves</h1>
        <p className="mt-1 text-sm text-slate-500">Apply for leave, track your requests, and check your leave balance.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setStatusFilter(s.status);
              setActiveTab("history");
            }}
            className={[
              "rounded-2xl border bg-white px-4 py-3 text-left shadow-[0_4px_16px_rgba(48,37,104,0.05)] transition hover:border-[#7560A7] hover:bg-[#F8F7FC] focus:outline-none focus:ring-2 focus:ring-[#302568]/20",
              activeTab === "history" && statusFilter === s.status ? "border-[#302568]" : "border-[#E7E8F0]",
            ].join(" ")}
          >
            <div className={["mb-1 text-lg", s.color].join(" ")}>{s.icon}</div>
            <p className="text-xl font-bold text-slate-950">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 rounded-2xl border border-[#E7E8F0] bg-white p-2">
        <Tab id="apply"   label="Apply Leave"   active={activeTab === "apply"}   onClick={setActiveTab} />
        <Tab id="history" label="My History"    active={activeTab === "history"} onClick={setActiveTab} />
        <Tab id="balance" label="Leave Balance" active={activeTab === "balance"} onClick={setActiveTab} />
      </div>

      {activeTab === "apply" && (
        <>
          <div className="flex gap-3">
            {LEAVE_MODES.map((m) => (
              <ModeCard key={m.id} mode={m} active={mode === m.id} onClick={() => setMode(m.id)} />
            ))}
          </div>
          <div className="rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(48,37,104,0.07)]">
            <div className="mb-5 flex items-center gap-3 border-b border-[#ECEEF5] pb-4">
              <span className="text-xl">{activeMode?.icon}</span>
              <div>
                <h2 className="text-base font-bold text-slate-900">{activeMode?.label}</h2>
                <p className="text-xs text-slate-400">{activeMode?.description}</p>
              </div>
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Submitting…</p>
            ) : (
              <>
                {mode === "short"    && <ShortLeaveForm   onSubmit={handleSubmit} />}
                {mode === "fullday"  && <FullDayLeaveForm  onSubmit={handleSubmit} />}
                {mode === "multiday" && <MultiDayLeaveForm onSubmit={handleSubmit} />}
              </>
            )}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(48,37,104,0.07)]">
          <h2 className="mb-4 text-base font-bold text-slate-900">My Leave Requests</h2>
          <LeaveHistory
            leaves={filteredLeaves}
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>
      )}

      {activeTab === "balance" && (
        <div className="rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(48,37,104,0.07)]">
          <h2 className="mb-4 text-base font-bold text-slate-900">Leave Balance</h2>
          <LeaveBalanceSection balance={balance} />
        </div>
      )}
    </div>
  );
}

export default Leaves;
