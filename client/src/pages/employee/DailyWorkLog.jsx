import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiTrash2,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiLink,
  FiPaperclip,
  FiChevronDown,
  FiCalendar,
  FiList,
} from "react-icons/fi";
import getStoredUser from "../../utils/authStorage";
import { createWorkLog, getMyWorkLogs } from "../../services/workLogService";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS  = ["Completed", "In Progress", "Pending", "Blocked"];
const WORK_MODE       = ["WFO (Work From Office)", "WFH (Work From Home)", "Hybrid"];
const MOOD_OPTIONS    = [
  { emoji: "😄", label: "Great"   },
  { emoji: "😊", label: "Good"    },
  { emoji: "😐", label: "Okay"    },
  { emoji: "😔", label: "Low"     },
  { emoji: "😫", label: "Burned Out" },
];

const EMPTY_TASK = {
  id:          Date.now(),
  taskName:    "",
  projectName: "",
  description: "",
  status:      "In Progress",
  hours:       "",
};

// ── Reusable field label ──────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2 border-b border-[#F0F0F5] pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F3FC]">
          <Icon className="text-base text-[#302568]" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Input styles ──────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-[#E7E8F0] bg-[#FAFAFD] px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#302568] focus:ring-2 focus:ring-[#302568]/10 placeholder:text-slate-300";
const selectCls =
  "w-full rounded-xl border border-[#E7E8F0] bg-[#FAFAFD] px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#302568] focus:ring-2 focus:ring-[#302568]/10 appearance-none cursor-pointer";

const STATUS_BADGE = {
  "Completed":   "bg-green-50 text-green-700",
  "In Progress": "bg-blue-50 text-blue-700",
  "Pending":     "bg-amber-50 text-amber-700",
  "Blocked":     "bg-red-50 text-red-600",
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function DailyWorkLog() {
  const user = getStoredUser();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Form state
  const [tasks,         setTasks]         = useState([{ ...EMPTY_TASK, id: 1 }]);
  const [blockers,      setBlockers]      = useState("");
  const [tomorrowPlan,  setTomorrowPlan]  = useState("");
  const [workMode,      setWorkMode]      = useState(WORK_MODE[0]);
  const [mood,          setMood]          = useState(null);
  const [productivity,  setProductivity]  = useState(0);
  const [links,         setLinks]         = useState("");
  const [submitted,     setSubmitted]     = useState(false);
  const [activeTab,     setActiveTab]     = useState("form"); // "form" | "history"
  const [errors,        setErrors]        = useState({});
  const [history,       setHistory]       = useState([]);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const logs = await getMyWorkLogs(user?.id || user?.employeeId);
        setHistory(logs);
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, [user?.id, user?.employeeId]);

  // ── Task handlers ──────────────────────────────────────────────────────────
  const addTask = () => {
    setTasks((prev) => [...prev, { ...EMPTY_TASK, id: Date.now() }]);
  };

  const removeTask = (id) => {
    if (tasks.length === 1) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTask = (id, field, value) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    tasks.forEach((t, i) => {
      if (!t.taskName.trim())    e[`task_${i}_name`]    = "Task name required";
      if (!t.projectName.trim()) e[`task_${i}_project`] = "Project name required";
      if (!t.hours || isNaN(t.hours) || Number(t.hours) <= 0)
        e[`task_${i}_hours`] = "Valid hours required";
    });
    if (!tomorrowPlan.trim()) e.tomorrowPlan = "Please fill tomorrow's plan";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const log = await createWorkLog({
        employeeId: user?.id || user?.employeeId,
        date: new Date().toISOString().slice(0, 10),
        tasks,
        blockers,
        tomorrowPlan,
        workMode,
        mood,
        productivity,
        links,
      });
      setHistory((prev) => [log, ...prev]);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Work log save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleNewLog = () => {
    setTasks([{ ...EMPTY_TASK, id: Date.now() }]);
    setBlockers("");
    setTomorrowPlan("");
    setWorkMode(WORK_MODE[0]);
    setMood(null);
    setProductivity(0);
    setLinks("");
    setErrors({});
    setSubmitted(false);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#E7E8F0] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <FiCheckCircle className="text-4xl text-green-500" />
          </div>
          <h2 className="mb-1 text-lg font-bold text-slate-900">Work Log Submitted!</h2>
          <p className="mb-1 text-sm text-slate-500">
            Your daily work log for <strong>{today}</strong> has been saved.
          </p>
          <p className="mb-6 text-xs text-slate-400">Manager will review your log shortly.</p>
          <button
            type="button"
            onClick={handleNewLog}
            className="w-full rounded-xl bg-[#302568] py-2.5 text-sm font-semibold text-white hover:bg-[#3d3080]"
          >
            Submit Another Log
          </button>
          <button
            type="button"
            onClick={() => { setSubmitted(false); setActiveTab("history"); }}
            className="mt-3 w-full rounded-xl border border-[#E7E8F0] py-2.5 text-sm font-semibold text-slate-600 hover:bg-[#F6F7FB]"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Daily Work Log</h1>
            <p className="text-sm text-slate-400">{today}</p>
          </div>
          {/* Tabs */}
          <div className="flex rounded-xl border border-[#E7E8F0] bg-white p-1 shadow-sm">
            {[
              { key: "form",    label: "Today's Log", icon: FiSend },
              { key: "history", label: "History",     icon: FiList },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={[
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  activeTab === key
                    ? "bg-[#302568] text-white"
                    : "text-slate-500 hover:text-[#302568]",
                ].join(" ")}
              >
                <Icon className="text-xs" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* FORM TAB */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "form" && (
          <div className="space-y-5">

            {/* ── Section 1: Employee Info (auto-filled) ── */}
            <Section title="Employee Information" icon={FiCalendar}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Employee Name",  value: user?.name || "-" },
                  { label: "Employee ID",    value: user?.id || user?.employeeId || "-" },
                  { label: "Department",     value: user?.department || "-" },
                  { label: "Designation",    value: user?.designation || user?.role || "-" },
                  { label: "Date",           value: today                                   },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <Label>{label}</Label>
                    <div className="rounded-xl border border-[#E7E8F0] bg-[#F6F7FB] px-4 py-2.5 text-sm font-semibold text-slate-700">
                      {value}
                    </div>
                  </div>
                ))}
                <div>
                  <Label>Work Mode</Label>
                  <div className="relative">
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className={selectCls}
                    >
                      {WORK_MODE.map((m) => <option key={m}>{m}</option>)}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Section 2: Tasks ── */}
            <Section title="Work Tasks Completed Today" icon={FiCheckCircle}>
              <div className="space-y-5">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="relative rounded-xl border border-[#E7E8F0] bg-[#FAFAFD] p-4"
                  >
                    {/* Task number + remove */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-[#302568] px-2.5 py-0.5 text-xs font-bold text-white">
                        Task {index + 1}
                      </span>
                      {tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Task name */}
                      <div>
                        <Label required>Task / Feature / Bug Name</Label>
                        <input
                          type="text"
                          placeholder="e.g. Fix login authentication"
                          value={task.taskName}
                          onChange={(e) => updateTask(task.id, "taskName", e.target.value)}
                          className={inputCls}
                        />
                        {errors[`task_${index}_name`] && (
                          <p className="mt-1 text-xs text-red-500">{errors[`task_${index}_name`]}</p>
                        )}
                      </div>

                      {/* Project name */}
                      <div>
                        <Label required>Project Name</Label>
                        <input
                          type="text"
                          placeholder="e.g. HRM ERP"
                          value={task.projectName}
                          onChange={(e) => updateTask(task.id, "projectName", e.target.value)}
                          className={inputCls}
                        />
                        {errors[`task_${index}_project`] && (
                          <p className="mt-1 text-xs text-red-500">{errors[`task_${index}_project`]}</p>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <Label required>Task Status</Label>
                        <div className="relative">
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task.id, "status", e.target.value)}
                            className={selectCls}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                          </select>
                          <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      {/* Hours */}
                      <div>
                        <Label required>Hours Spent</Label>
                        <input
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          placeholder="e.g. 3"
                          value={task.hours}
                          onChange={(e) => updateTask(task.id, "hours", e.target.value)}
                          className={inputCls}
                        />
                        {errors[`task_${index}_hours`] && (
                          <p className="mt-1 text-xs text-red-500">{errors[`task_${index}_hours`]}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-2">
                        <Label>What was completed / done today</Label>
                        <textarea
                          rows={2}
                          placeholder="Briefly describe what you did on this task..."
                          value={task.description}
                          onChange={(e) => updateTask(task.id, "description", e.target.value)}
                          className={inputCls + " resize-none"}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add task button */}
                <button
                  type="button"
                  onClick={addTask}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#302568]/30 py-3 text-sm font-semibold text-[#302568] transition hover:border-[#302568] hover:bg-[#F5F3FC]"
                >
                  <FiPlus /> Add Another Task
                </button>

                {/* Hours summary */}
                {tasks.some((t) => t.hours) && (
                  <div className="flex items-center justify-end gap-2 rounded-xl bg-[#F5F3FC] px-4 py-2.5">
                    <FiClock className="text-[#302568]" />
                    <span className="text-sm font-semibold text-[#302568]">
                      Total Hours Today:{" "}
                      {tasks.reduce((acc, t) => acc + (parseFloat(t.hours) || 0), 0).toFixed(1)} hrs
                    </span>
                  </div>
                )}
              </div>
            </Section>

            {/* ── Section 3: Blockers ── */}
            <Section title="Challenges / Blockers" icon={FiCheckCircle}>
              <Label>Any blockers or issues faced today?</Label>
              <textarea
                rows={3}
                placeholder="e.g. Waiting for API from backend team, Requirement unclear, Dependency on another team..."
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                className={inputCls + " resize-none"}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Leave blank if no blockers. This helps managers identify delays quickly.
              </p>
            </Section>

            {/* ── Section 4: Tomorrow's Plan ── */}
            <Section title="Tomorrow's Plan" icon={FiCalendar}>
              <Label required>What will you work on tomorrow?</Label>
              <textarea
                rows={3}
                placeholder="e.g. Complete responsive design, Start backend integration, Test payroll module..."
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                className={inputCls + " resize-none"}
              />
              {errors.tomorrowPlan && (
                <p className="mt-1 text-xs text-red-500">{errors.tomorrowPlan}</p>
              )}
            </Section>

            {/* ── Section 5: Optional fields ── */}
            <Section title="Optional Details" icon={FiLink}>
              <div className="space-y-4">

                {/* Links */}
                <div>
                  <Label>GitHub / Jira / Trello / PR Links</Label>
                  <input
                    type="text"
                    placeholder="e.g. https://github.com/org/repo/pull/42"
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Mood */}
                <div>
                  <Label>How are you feeling today?</Label>
                  <div className="flex gap-3">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setMood(m.label)}
                        className={[
                          "flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-lg transition",
                          mood === m.label
                            ? "border-[#302568] bg-[#F5F3FC]"
                            : "border-[#E7E8F0] bg-white hover:border-[#302568]/30",
                        ].join(" ")}
                        title={m.label}
                      >
                        {m.emoji}
                        <span className="text-[10px] font-semibold text-slate-500">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Productivity */}
                <div>
                  <Label>Productivity Rating (1–5)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setProductivity(star)}
                        className={[
                          "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition",
                          productivity >= star
                            ? "border-[#302568] bg-[#302568] text-white"
                            : "border-[#E7E8F0] bg-white text-slate-400 hover:border-[#302568]/40",
                        ].join(" ")}
                      >
                        {star}
                      </button>
                    ))}
                    {productivity > 0 && (
                      <span className="ml-2 self-center text-xs font-semibold text-slate-500">
                        {["", "Poor", "Below Average", "Average", "Good", "Excellent"][productivity]}
                      </span>
                    )}
                  </div>
                </div>

                {/* File attachment placeholder */}
                <div>
                  <Label>Attachments</Label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#E7E8F0] bg-[#FAFAFD] px-4 py-3 transition hover:border-[#302568]/40 hover:bg-[#F5F3FC]">
                    <FiPaperclip className="text-[#302568]" />
                    <span className="text-sm text-slate-400">Click to attach a file (screenshots, reports)</span>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </div>
            </Section>

            {/* ── Submit button ── */}
            <button
              type="button"
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#302568] py-4 text-sm font-bold text-white shadow-md shadow-[#302568]/20 transition hover:bg-[#3d3080] active:bg-[#251d52]"
            >
              <FiSend /> {saving ? "Saving..." : "Submit Today's Work Log"}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HISTORY TAB */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-[#E7E8F0] bg-white py-16 text-center text-slate-400 shadow-sm">
                <FiList className="mx-auto mb-3 text-4xl opacity-30" />
                <p className="text-sm font-medium">No work logs yet</p>
              </div>
            ) : (
              history.map((log) => (
                <div key={log.id} className="rounded-2xl border border-[#E7E8F0] bg-white shadow-sm">
                  {/* Log header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F0F5] px-5 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{log.date}</p>
                      <p className="text-xs text-slate-400">
                        {log.workMode} · {Number(log.totalHours || 0).toFixed(1)}h worked
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-[#F5F3FC] px-3 py-1 text-xs font-semibold text-[#302568]">
                        {log.mood || "Mood not set"}
                      </span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        ⭐ {log.productivity}/5
                      </span>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="px-5 py-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tasks</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#F0F0F5] text-left text-xs font-semibold text-slate-400">
                            <th className="pb-2 pr-4">Task</th>
                            <th className="pb-2 pr-4">Project</th>
                            <th className="pb-2 pr-4">Status</th>
                            <th className="pb-2">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F5]">
                          {log.tasks.map((t, i) => (
                            <tr key={i}>
                              <td className="py-2 pr-4 font-medium text-slate-700">{t.taskName}</td>
                              <td className="py-2 pr-4 text-slate-500">{t.projectName}</td>
                              <td className="py-2 pr-4">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[t.status]}`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-2 font-semibold text-slate-700">{t.hours}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Blockers + Tomorrow */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-red-50 px-4 py-3">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-red-500">Blockers</p>
                        <p className="text-xs text-red-700">{log.blockers || "None"}</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 px-4 py-3">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-500">Tomorrow's Plan</p>
                        <p className="text-xs text-blue-700">{log.tomorrowPlan}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
