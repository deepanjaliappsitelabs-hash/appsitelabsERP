import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiClock, FiDownload, FiHome, FiUserCheck, FiUserX } from "react-icons/fi";
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

const todayDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const getEmployeeRecordId = (value) => String(value ?? "");

const getMonthValue = (dateValue) => String(dateValue || todayDate()).slice(0, 7);

const getMonthLabel = (monthValue) =>
  new Date(`${monthValue}-01T00:00:00`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

const getDaysInMonth = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month, 0).getDate();
};

const getMonthDateKeys = (monthValue, today) => {
  const daysInMonth = getDaysInMonth(monthValue);
  const maxDay = monthValue === getMonthValue(today)
    ? Number(today.slice(8, 10))
    : daysInMonth;

  return Array.from({ length: maxDay }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${monthValue}-${day}`;
  });
};

const LATE_CHECK_IN_TIME = "10:15";

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const isLateCheckIn = (checkIn) =>
  Boolean(checkIn) && timeToMinutes(checkIn) > timeToMinutes(LATE_CHECK_IN_TIME);

const isSunday = (date) => new Date(`${date}T00:00:00`).getDay() === 0;

const getGeneratedAbsentRows = (dateKeys, recordsForDates, employees) => {
  const markedEmployeeDateKeys = new Set(
    recordsForDates.map(
      (record) => `${getEmployeeRecordId(record.employee_id)}-${record.date}`
    )
  );

  return employees.flatMap((employee) =>
    dateKeys
      .filter((date) => !markedEmployeeDateKeys.has(`${getEmployeeRecordId(employee._id)}-${date}`))
      .map((date) => {
        const holiday = isSunday(date);

        return {
          _id: `${holiday ? "holiday" : "absent"}-${employee._id}-${date}`,
          employee_id: employee._id,
          employeeName: employee.name,
          department: employee.department,
          date,
          checkIn: "",
          checkOut: "",
          hours: "",
          status: holiday ? "Holiday" : "Absent",
          lateNote: holiday ? "Sunday holiday" : "",
          generatedAbsent: !holiday,
          generatedHoliday: holiday,
        };
      })
  );
};

const withDerivedLateStatus = (record) => {
  const status = String(record.status || "");
  const canBeLate = !["Absent", "Holiday", "On Leave", "WFH", "Half Day"].includes(status);

  if (canBeLate && isLateCheckIn(record.checkIn)) {
    return {
      ...record,
      status: "Late",
      lateNote: record.lateNote || `Checked in at ${record.checkIn}`,
    };
  }

  return record;
};

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
    month: getMonthValue(todayDate()),
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

  const today = useMemo(() => todayDate(), []);

  const isTodayRecord = (record) => record.date === today;

  const normalizedRecords = useMemo(
    () => records.map(withDerivedLateStatus),
    [records]
  );

  const todayRecords = useMemo(() => {
    const todaysAttendance = normalizedRecords.filter(isTodayRecord);
    const generatedAbsentRows = getGeneratedAbsentRows([today], todaysAttendance, employees);

    return [...todaysAttendance, ...generatedAbsentRows];
  }, [normalizedRecords, employees, today]);

  const dailyRecords = useMemo(() => {
    if (filters.date) {
      const selectedDateRecords = normalizedRecords.filter((record) => record.date === filters.date);
      return [
        ...selectedDateRecords,
        ...getGeneratedAbsentRows([filters.date], selectedDateRecords, employees),
      ];
    }

    const availableDates = new Set(normalizedRecords.map((record) => record.date).filter(Boolean));
    availableDates.add(today);

    return [
      ...normalizedRecords,
      ...getGeneratedAbsentRows([...availableDates], normalizedRecords, employees),
    ];
  }, [normalizedRecords, employees, filters.date, today]);

  const selectedMonthRecords = useMemo(() => {
    const monthDateKeys = getMonthDateKeys(filters.month, today);
    const monthRecords = normalizedRecords.filter((record) => String(record.date || "").startsWith(filters.month));

    return [
      ...monthRecords,
      ...getGeneratedAbsentRows(monthDateKeys, monthRecords, employees),
    ];
  }, [normalizedRecords, employees, filters.month, today]);

  const displayedRecords = useMemo(() => {
    const statusFilter = activeFilter || filters.status;
    const sourceRecords = activeFilter
      ? todayRecords
      : view === "monthly"
        ? selectedMonthRecords
        : dailyRecords;

    return sourceRecords.filter((record) => {
      const matchesEmployee =
        !filters.employee || record.employeeName === filters.employee;
      const matchesDepartment =
        !filters.department || record.department === filters.department;
      const matchesDate = activeFilter
        ? record.date === today
        : view === "monthly" || !filters.date || record.date === filters.date;
      const matchesStatus = !statusFilter || record.status === statusFilter;
      return matchesEmployee && matchesDepartment && matchesDate && matchesStatus;
    });
  }, [dailyRecords, todayRecords, selectedMonthRecords, filters, activeFilter, today, view]);

  const countStatus = (status) =>
    todayRecords.filter((record) => record.status === status).length;

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
    setView("daily");
    setActiveFilter((prev) => (prev === status ? null : status));
    setFilters((prev) => ({ ...prev, date: "", status: "" }));
  };

  const departments = [
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  const calendarMonthLabel = getMonthLabel(filters.month);

  const statsCards = [
    { title: "Present Today", status: "Present", icon: <FiUserCheck /> },
    { title: "Absent", status: "Absent", icon: <FiUserX /> },
    { title: "Late", status: "Late", icon: <FiClock /> },
    { title: "Half Day", status: "Half Day", icon: <FiClock /> },
    { title: "On Leave", status: "On Leave", icon: <FiClock /> },
    { title: "WFH", status: "WFH", icon: <FiHome /> },
    { title: "Holiday", status: "Holiday", icon: <FiCalendar /> },
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
              onClick={() => exportToExcel(displayedRecords, "attendance")}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800"
            >
              <FiDownload />
              Export
            </Button>
            <Button onClick={() => setShowModal(true)}>Mark Attendance</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-7">
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
          Showing today's <strong>{activeFilter}</strong> records ({displayedRecords.length}).{" "}
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
        <div className="grid gap-4 md:grid-cols-6">
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
            disabled={view === "monthly"}
            className={view === "monthly" ? "cursor-not-allowed bg-slate-50 text-slate-400" : ""}
          />
          <Input
            label="Month"
            name="month"
            type="month"
            value={filters.month}
            onChange={handleFilterChange}
            disabled={view === "daily"}
            className={view === "daily" ? "cursor-not-allowed bg-slate-50 text-slate-400" : ""}
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
              { value: "Half Day", label: "Half Day" },
              { value: "On Leave", label: "On Leave" },
              { value: "WFH", label: "WFH" },
              { value: "Holiday", label: "Holiday" },
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
          records={displayedRecords}
          onUpdate={handleUpdateRecord}
          onDelete={handleDeleteRecord}
        />
      ) : (
        <AttendanceCalendar records={displayedRecords} monthLabel={calendarMonthLabel} />
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
