import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiCalendar, FiClock, FiSearch, FiUserCheck, FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatsCard from "../../components/ui/StatsCard";
import { deleteWorkLog, getAllWorkLogs, updateWorkLog } from "../../services/workLogService";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const STATUS_BADGE = {
  Completed: "bg-green-50 text-green-700",
  "In Progress": "bg-blue-50 text-blue-700",
  Pending: "bg-amber-50 text-amber-700",
  Blocked: "bg-red-50 text-red-600",
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hasTaskStatus(log, status) {
  if (!status) return true;
  return (log.tasks || []).some((task) => task.status === status);
}

function formatChartDate(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function buildWorkLogChartData(rows) {
  const grouped = rows.reduce((acc, log) => {
    const date = log.date || "No date";
    if (!acc[date]) {
      acc[date] = {
        date,
        label: formatChartDate(date),
        hours: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        blocked: 0,
        productivityTotal: 0,
        productivityCount: 0,
      };
    }

    acc[date].hours += Number(log.totalHours) || 0;
    acc[date].productivityTotal += Number(log.productivity) || 0;
    acc[date].productivityCount += log.productivity ? 1 : 0;

    (log.tasks || []).forEach((task) => {
      if (task.status === "Completed") acc[date].completed += 1;
      if (task.status === "In Progress") acc[date].inProgress += 1;
      if (task.status === "Pending") acc[date].pending += 1;
      if (task.status === "Blocked") acc[date].blocked += 1;
    });

    return acc;
  }, {});

  return Object.values(grouped)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((item) => ({
      ...item,
      hours: Number(item.hours.toFixed(1)),
      productivity: item.productivityCount
        ? Number((item.productivityTotal / item.productivityCount).toFixed(1))
        : 0,
    }));
}

export default function DailyWorkLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    employee: "",
    date: "",
    status: "",
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const rows = await getAllWorkLogs();
        setLogs(rows);
      } catch (err) {
        toast.error("Work logs could not be loaded: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const employees = useMemo(
    () => [...new Set(logs.map((log) => log.employeeName || `Employee #${log.employeeId}`).filter(Boolean))],
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return logs.filter((log) => {
      const employeeName = log.employeeName || `Employee #${log.employeeId}`;
      const matchesEmployee = !filters.employee || employeeName === filters.employee;
      const matchesDate = !filters.date || log.date === filters.date;
      const matchesStatus = hasTaskStatus(log, filters.status);
      const taskText = (log.tasks || [])
        .map((task) => `${task.taskName} ${task.projectName} ${task.description}`)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !search ||
        employeeName.toLowerCase().includes(search) ||
        String(log.department || "").toLowerCase().includes(search) ||
        taskText.includes(search);

      return matchesEmployee && matchesDate && matchesStatus && matchesSearch;
    });
  }, [logs, filters]);

  const totalHours = filteredLogs.reduce((sum, log) => sum + (Number(log.totalHours) || 0), 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((log) => log.date === todayKey).length;
  const blockers = filteredLogs.filter((log) => String(log.blockers || "").trim()).length;
  const chartData = useMemo(() => buildWorkLogChartData(filteredLogs), [filteredLogs]);
  const chartTitle = filters.employee
    ? `${filters.employee}'s worklog graph`
    : "All employees worklog graph";

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const openLog = (log, editable = false) => {
    setSelectedLog({ ...log, tasks: (log.tasks || []).map((task) => ({ ...task })) });
    setEditMode(editable);
  };

  const updateSelected = (field, value) => setSelectedLog((log) => ({ ...log, [field]: value }));
  const updateTask = (index, field, value) => setSelectedLog((log) => ({
    ...log,
    tasks: log.tasks.map((task, taskIndex) => taskIndex === index ? { ...task, [field]: value } : task),
  }));

  const saveLog = async () => {
    if (!selectedLog?.tasks?.length) return toast.error("At least one task is required");
    setSaving(true);
    try {
      const saved = await updateWorkLog(selectedLog.id || selectedLog._id, selectedLog);
      setLogs((current) => current.map((log) => String(log.id || log._id) === String(saved.id || saved._id) ? { ...log, ...saved } : log));
      setSelectedLog(saved);
      setEditMode(false);
      toast.success("Work log updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Work log could not be updated");
    } finally { setSaving(false); }
  };

  const removeLog = async () => {
    if (!deleteTarget) return;
    try {
      const id = deleteTarget.id || deleteTarget._id;
      await deleteWorkLog(id);
      setLogs((current) => current.filter((log) => String(log.id || log._id) !== String(id)));
      if (String(selectedLog?.id || selectedLog?._id) === String(id)) setSelectedLog(null);
      toast.success("Work log deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Work log could not be deleted");
    } finally { setDeleteTarget(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Worklog"
        subtitle="Review daily employee work logs with task progress, hours, blockers, and next-day plans."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Logs" value={filteredLogs.length} icon={<FiUserCheck />} />
        <StatsCard title="Today Submitted" value={todayLogs} icon={<FiCalendar />} />
        <StatsCard title="Total Hours" value={totalHours.toFixed(1)} icon={<FiClock />} />
        <StatsCard title="With Blockers" value={blockers} icon={<FiAlertCircle />} />
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Employee, department, task..."
          />
          <Select
            label="Employee"
            name="employee"
            value={filters.employee}
            onChange={handleFilterChange}
            options={[
              { value: "", label: "All employees" },
              ...employees.map((name) => ({ value: name, label: name })),
            ]}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={filters.date}
            onChange={handleFilterChange}
          />
          <Select
            label="Task Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={[
              { value: "", label: "All statuses" },
              { value: "Completed", label: "Completed" },
              { value: "In Progress", label: "In Progress" },
              { value: "Pending", label: "Pending" },
              { value: "Blocked", label: "Blocked" },
            ]}
          />
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{chartTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Track hours, productivity, and task status by date.
            </p>
          </div>
          <div className="rounded-full bg-[#F5F3FC] px-3 py-1 text-xs font-semibold text-[#302568]">
            {chartData.length} days
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 text-sm font-medium text-slate-400">
            No graph data for selected filters
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E8F0" />
                  <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" name="Hours" fill="#5B3FD6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name="Completed Tasks" fill="#16A34A" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="blocked" name="Blocked Tasks" fill="#DC2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E8F0" />
                  <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: "#64748B", fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="productivity"
                    name="Productivity"
                    stroke="#302568"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="inProgress"
                    name="In Progress"
                    stroke="#2563EB"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    name="Pending"
                    stroke="#D97706"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      {loading ? (
        <p className="py-10 text-center text-slate-400">Loading work logs...</p>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-slate-400">
            <FiSearch className="mx-auto mb-3 text-4xl opacity-30" />
            <p className="text-sm font-medium">No work logs found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const employeeName = log.employeeName || `Employee #${log.employeeId}`;
            return (
              <div key={log._id || log.id} className="rounded-2xl border border-[#E7E8F0] bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#F0F0F5] px-5 py-4">
                  <div>
                    <p className="text-base font-bold text-slate-900">{employeeName}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {log.department || "No department"} · {log.designation || "Employee"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-[#F5F3FC] px-3 py-1 text-[#302568]">
                      {formatDate(log.date)}
                    </span>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                      {Number(log.totalHours || 0).toFixed(1)}h
                    </span>
                    <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">
                      {log.workMode || "Work mode not set"}
                    </span>
                    <button type="button" onClick={() => openLog(log)} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200"><FiEye /> View</button>
                    <button type="button" onClick={() => openLog(log, true)} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100"><FiEdit2 /> Edit</button>
                    <button type="button" onClick={() => setDeleteTarget(log)} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100"><FiTrash2 /> Delete</button>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F0F0F5] text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="pb-2 pr-4">Task</th>
                          <th className="pb-2 pr-4">Project</th>
                          <th className="pb-2 pr-4">Status</th>
                          <th className="pb-2 pr-4">Hours</th>
                          <th className="pb-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F0F5]">
                        {(log.tasks || []).map((task, index) => (
                          <tr key={`${log._id || log.id}-${index}`}>
                            <td className="py-3 pr-4 font-semibold text-slate-800">{task.taskName || "-"}</td>
                            <td className="py-3 pr-4 text-slate-500">{task.projectName || "-"}</td>
                            <td className="py-3 pr-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[task.status] || "bg-slate-50 text-slate-500"}`}>
                                {task.status || "Unknown"}
                              </span>
                            </td>
                            <td className="py-3 pr-4 font-semibold text-slate-700">{task.hours || 0}h</td>
                            <td className="max-w-md py-3 text-slate-500">{task.description || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-red-50 px-4 py-3">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-red-500">Blockers</p>
                      <p className="text-xs leading-5 text-red-700">{log.blockers || "None"}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 px-4 py-3">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-500">Tomorrow's Plan</p>
                      <p className="text-xs leading-5 text-blue-700">{log.tomorrowPlan || "-"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Mood / Productivity</p>
                      <p className="text-xs leading-5 text-slate-700">
                        {log.mood || "Mood not set"} · {log.productivity || 0}/5
                      </p>
                      {log.links && (
                        <p className="mt-1 break-all text-xs leading-5 text-[#302568]">{log.links}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedLog && (
        <Modal
          title={`${editMode ? "Edit" : "View"} Work Log — ${selectedLog.employeeName || `Employee #${selectedLog.employeeId}`}`}
          onClose={() => setSelectedLog(null)}
          className="max-w-4xl"
          footer={<div className="flex justify-end gap-3">{editMode ? <><button type="button" onClick={() => setEditMode(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="button" disabled={saving} onClick={saveLog} className="rounded-xl bg-[#302568] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></> : <button type="button" onClick={() => setEditMode(true)} className="rounded-xl bg-[#302568] px-4 py-2 text-sm font-semibold text-white">Edit work log</button>}</div>}
        >
          {editMode ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Date" type="date" value={selectedLog.date || ""} onChange={(e) => updateSelected("date", e.target.value)} />
                <Input label="Work mode" value={selectedLog.workMode || ""} onChange={(e) => updateSelected("workMode", e.target.value)} />
                <Input label="Mood" value={selectedLog.mood || ""} onChange={(e) => updateSelected("mood", e.target.value)} />
                <Input label="Productivity (1–5)" type="number" min="0" max="5" value={selectedLog.productivity || 0} onChange={(e) => updateSelected("productivity", e.target.value)} />
              </div>
              {selectedLog.tasks.map((task, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2"><Input label="Task" value={task.taskName || ""} onChange={(e) => updateTask(index, "taskName", e.target.value)} /><Input label="Project" value={task.projectName || ""} onChange={(e) => updateTask(index, "projectName", e.target.value)} /><Select label="Status" value={task.status || "Pending"} onChange={(e) => updateTask(index, "status", e.target.value)} options={["Completed", "In Progress", "Pending", "Blocked"].map((value) => ({ value, label: value }))} /><Input label="Hours" type="number" min="0" step="0.5" value={task.hours || ""} onChange={(e) => updateTask(index, "hours", e.target.value)} /><div className="sm:col-span-2"><Input label="Description" value={task.description || ""} onChange={(e) => updateTask(index, "description", e.target.value)} /></div></div>)}
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Blockers</label><textarea value={selectedLog.blockers || ""} onChange={(e) => updateSelected("blockers", e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows="2" /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Tomorrow's plan</label><textarea value={selectedLog.tomorrowPlan || ""} onChange={(e) => updateSelected("tomorrowPlan", e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows="2" /></div>
              <Input label="Links" value={selectedLog.links || ""} onChange={(e) => updateSelected("links", e.target.value)} />
            </div>
          ) : <div className="space-y-4"><p className="text-sm text-slate-500">{formatDate(selectedLog.date)} · {selectedLog.workMode || "Work mode not set"} · {selectedLog.totalHours}h</p>{(selectedLog.tasks || []).map((task, index) => <div key={index} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold text-slate-800">{task.taskName} <span className="font-normal text-slate-500">— {task.projectName}</span></p><p className="mt-1 text-sm text-slate-500">{task.description || "No description"}</p><p className="mt-2 text-xs font-semibold text-slate-600">{task.status} · {task.hours}h</p></div>)}<div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase text-slate-400">Blockers</p><p className="mt-1 text-sm text-slate-700">{selectedLog.blockers || "None"}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Tomorrow's plan</p><p className="mt-1 text-sm text-slate-700">{selectedLog.tomorrowPlan || "-"}</p></div></div></div>}
        </Modal>
      )}
      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete work log?" message="This work log will be permanently deleted." confirmLabel="Delete" onConfirm={removeLog} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
