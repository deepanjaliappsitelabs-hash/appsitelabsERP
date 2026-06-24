import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiCalendar, FiClock, FiSearch, FiUserCheck } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatsCard from "../../components/ui/StatsCard";
import { getAllWorkLogs } from "../../services/workLogService";

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

export default function DailyWorkLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    employee: "",
    date: "",
    status: "",
  });

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

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
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
    </div>
  );
}
