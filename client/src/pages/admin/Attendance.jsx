import { useEffect, useMemo, useState } from "react";
import { FiClock, FiDownload, FiHome, FiUserCheck, FiUserX } from "react-icons/fi";
import toast from "react-hot-toast";
import AttendanceCalendar from "../../components/attendance/AttendanceCalendar";
import MarkAttendanceModal from "../../components/attendance/MarkAttendanceModal";
import AttendanceTable from "../../components/attendance/AttendanceTable";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatsCard from "../../components/ui/StatsCard";
import {
  deleteAttendance,
  getAttendance,
  markManualAttendance,
  updateAttendance,
} from "../../services/attendanceService";
import { getEmployees } from "../../services/employeeService";
import exportToExcel from "../../utils/exportToExcel";
import { useNotifications } from "../../hooks/useNotifications";

function Attendance() {
  useNotifications();
  const [view, setView] = useState("daily");
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({
    employee: "",
    department: "",
    date: "",
    status: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [attendanceData, employeeData] = await Promise.all([
          getAttendance(),
          getEmployees(),
        ]);
        setRecords(attendanceData);
        setEmployees(employeeData);
      } catch (err) {
        toast.error("Data could not be loaded: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const refreshAttendance = async () => {
      try {
        const attendanceData = await getAttendance();
        setRecords(attendanceData);
      } catch {
        // The notification still shows even if a silent refresh fails.
      }
    };

    window.addEventListener("attendance:updated", refreshAttendance);
    return () => window.removeEventListener("attendance:updated", refreshAttendance);
  }, []);

  const filteredRecords = useMemo(() => {
    const statusFilter = activeFilter || filters.status;
    return records.filter((record) => {
      const matchesEmployee =
        !filters.employee || record.employeeName === filters.employee;
      const matchesDepartment =
        !filters.department || record.department === filters.department;
      const matchesDate = !filters.date || record.date === filters.date;
      const matchesStatus = !statusFilter || record.status === statusFilter;
      return matchesEmployee && matchesDepartment && matchesDate && matchesStatus;
    });
  }, [records, filters, activeFilter]);

  const countStatus = (status) =>
    records.filter((record) => record.status === status).length;

  const handleFilterChange = (event) => {
    setActiveFilter(null);
    setFilters({ ...filters, [event.target.name]: event.target.value });
  };

  const handleMarkAttendance = async (payload) => {
    try {
      const created = await markManualAttendance({
        ...payload,
        manualEntry: true,
      });
      setRecords((current) => {
        const existingIndex = current.findIndex(
          (record) =>
            record._id === created._id ||
            (record.employee_id === created.employee_id && record.date === created.date)
        );

        if (existingIndex === -1) return [created, ...current];

        return current.map((record, index) =>
          index === existingIndex ? created : record
        );
      });
      setShowModal(false);
      toast.success("Attendance marked!");
    } catch (err) {
      toast.error("Mark attendance failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateRecord = async (updated) => {
    try {
      const saved = await updateAttendance(updated._id, updated);
      setRecords((current) =>
        current.map((r) =>
          (r._id && r._id === saved._id) ||
          (r.employeeName === saved.employeeName && r.date === saved.date)
            ? saved
            : r
        )
      );
      toast.success("Attendance updated");
    } catch (err) {
      toast.error("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Delete attendance record for ${record.employeeName || "this employee"}?`)) {
      return;
    }

    try {
      await deleteAttendance(record._id);
      setRecords((current) => current.filter((item) => item._id !== record._id));
      toast.success("Attendance deleted");
    } catch (err) {
      toast.error("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCardClick = (status) => {
    setActiveFilter((prev) => (prev === status ? null : status));
    setFilters((prev) => ({ ...prev, status: "" }));
  };

  const departments = [
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  const statsCards = [
    { title: "Present Today", status: "Present", icon: <FiUserCheck /> },
    { title: "Absent", status: "Absent", icon: <FiUserX /> },
    { title: "Late", status: "Late", icon: <FiClock /> },
    { title: "On Leave", status: "On Leave", icon: <FiClock /> },
    { title: "WFH", status: "WFH", icon: <FiHome /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="Monitor daily status, monthly patterns, and employee working hours."
        action={
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => exportToExcel(filteredRecords, "attendance")}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800"
            >
              <FiDownload />
              Export
            </Button>
            <Button onClick={() => setShowModal(true)}>Mark Attendance</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {statsCards.map(({ title, status, icon }) => (
          <button
            key={status}
            type="button"
            onClick={() => handleCardClick(status)}
            className={[
              "rounded-2xl border text-left transition focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/40",
              activeFilter === status
                ? "border-[#5B3FD6] ring-2 ring-[#5B3FD6]/20"
                : "border-transparent",
            ].join(" ")}
          >
            <StatsCard
              title={title}
              value={countStatus(status)}
              icon={icon}
              highlight={activeFilter === status}
            />
          </button>
        ))}
      </div>

      {activeFilter && (
        <p className="text-sm text-[#5B3FD6]">
          Showing <strong>{activeFilter}</strong> records ({filteredRecords.length}).{" "}
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className="underline"
          >
            Clear filter
          </button>
        </p>
      )}

      <Card>
        <div className="grid gap-4 md:grid-cols-5">
          <Select
            label="Employee"
            name="employee"
            value={filters.employee}
            onChange={handleFilterChange}
            options={[
              { value: "", label: "All employees" },
              ...employees.map((e) => ({ value: e.name, label: e.name })),
            ]}
          />
          <Select
            label="Department"
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            options={[
              { value: "", label: "All departments" },
              ...departments.map((d) => ({ value: d, label: d })),
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
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={[
              { value: "", label: "All status" },
              { value: "Present", label: "Present" },
              { value: "Absent", label: "Absent" },
              { value: "Late", label: "Late" },
              { value: "On Leave", label: "On Leave" },
              { value: "WFH", label: "WFH" },
            ]}
          />
          <div className="flex items-end rounded-xl bg-[#F6F7FB] p-1">
            {["daily", "monthly"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={[
                  "flex-1 rounded-lg px-3 py-3 text-sm font-semibold capitalize transition",
                  view === item
                    ? "bg-white text-[#5B3FD6] shadow-sm"
                    : "text-slate-500",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <p className="text-center text-slate-400 py-10">Loading attendance…</p>
      ) : view === "daily" ? (
        <AttendanceTable
          records={filteredRecords}
          onUpdate={handleUpdateRecord}
          onDelete={handleDeleteRecord}
        />
      ) : (
        <AttendanceCalendar records={filteredRecords} />
      )}

      <MarkAttendanceModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleMarkAttendance}
        employees={employees}
      />
    </div>
  );
}

export default Attendance;
