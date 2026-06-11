import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiPieChart,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import ActivityFeed        from "../../components/dashboard/ActivityFeed";
import AttendanceChart     from "../../components/dashboard/AttendanceChart";
import LeaveAnalytics      from "../../components/dashboard/LeaveAnalytics";
import PayrollSummary      from "../../components/dashboard/PayrollSummary";
import RecentEmployees     from "../../components/dashboard/RecentEmployees";
import RevenueChart        from "../../components/dashboard/RevenueChart";
import SectionWidgets      from "../../components/dashboard/SectionWidgets";
import UpcomingHolidays    from "../../components/dashboard/UpcomingHolidays";
import UpcomingInterviews  from "../../components/dashboard/UpcomingInterviews";
import PageHeader          from "../../components/layout/PageHeader";
import Card                from "../../components/ui/Card";
import StatsCard           from "../../components/ui/StatsCard";
import { useNotifications } from "../../hooks/useNotifications";
import { getEmployees }    from "../../services/employeeService";
import { getLeaves, normalizeLeave } from "../../services/leaveService";

function Dashboard() {
  useNotifications();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [leaves,    setLeaves]    = useState([]);

  useEffect(() => {
    Promise.all([getEmployees(), getLeaves()])
      .then(([employeeData, leaveData]) => {
        setEmployees(employeeData);
        setLeaves(leaveData);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const upsertLeave = (event) => {
      const incoming = event.detail?.leave;
      if (!incoming) return;

      const normalized = normalizeLeave(incoming);
      setLeaves((current) => {
        const exists = current.some((leave) => leave._id === normalized._id);
        if (exists) {
          return current.map((leave) =>
            leave._id === normalized._id ? { ...leave, ...normalized } : leave
          );
        }
        return [normalized, ...current];
      });
    };

    const removeLeave = (event) => {
      const deleted = event.detail?.leave;
      const deletedId = deleted?.id ?? deleted?._id;
      if (!deletedId) return;

      setLeaves((current) => current.filter((leave) => String(leave._id) !== String(deletedId)));
    };

    window.addEventListener("leave:created", upsertLeave);
    window.addEventListener("leave:updated", upsertLeave);
    window.addEventListener("leave:deleted", removeLeave);

    return () => {
      window.removeEventListener("leave:created", upsertLeave);
      window.removeEventListener("leave:updated", upsertLeave);
      window.removeEventListener("leave:deleted", removeLeave);
    };
  }, []);

  const stats = useMemo(() => {
    const present      = employees.length ? Math.max(employees.length - 1, 0) : 0;
    const pendingLeaves = leaves.filter(
      (leave) => leave.status?.toLowerCase() === "pending"
    ).length;

    return [
      {
        title: "Total Employees",
        value: employees.length,
        icon:  <FiUsers />,
        to:    "/admin/employees",          // ← click → employees page
      },
      {
        title: "Present Today",
        value: present,
        icon:  <FiCheckCircle />,
        to:    "/admin/attendance",         // ← click → attendance page
      },
      {
        title: "Absent Today",
        value: Math.max(employees.length - present, 0),
        icon:  <FiClock />,
        to:    "/admin/attendance",         // ← click → attendance page
      },
      {
        title: "New Candidates",
        value: 23,
        icon:  <FiUserPlus />,
        to:    "/admin/recruitment/candidates", // ← click → candidates page
      },
      {
        title: "Pending Approvals",
        value: pendingLeaves,
        icon:  <FiClock />,
        to:    "/admin/leaves",             // ← click → leaves page
      },
    ];
  }, [employees, leaves]);

  const sections = [
    {
      title: "HR Management",
      icon:  <FiUsers />,
      to:    "/admin/employees",
      stats: [
        { label: "Staff",  value: employees.length },
        { label: "Leave",  value: leaves.filter((l) => l.status === "Pending").length },
        { label: "Active", value: "92%" },
      ],
    },
    {
      title: "Job Hiring",
      icon:  <FiBriefcase />,
      to:    "/admin/recruitment",
      stats: [
        { label: "Jobs",       value: 12 },
        { label: "Candidates", value: 38 },
        { label: "Interviews", value: 4  },
      ],
    },
    {
      title: "Project Management",
      icon:  <FiFolder />,
      to:    "/admin/projects",
      stats: [
        { label: "Projects", value: 9    },
        { label: "Tasks",    value: 54   },
        { label: "Done",     value: "67%" },
      ],
    },
    {
      title: "General",
      icon:  <FiPieChart />,
      to:    "/admin/general",
      stats: [
        { label: "Contacts", value: 210   },
        { label: "Revenue",  value: "31L" },
        { label: "Growth",   value: "+14%" },
      ],
    },
  ];

  const quickActions = [
    { label: "Add Employee",  to: "/admin/employees/add" },
    { label: "Review Leaves", to: "/admin/leaves"        },
    { label: "Run Payroll",   to: "/admin/payroll"       },
    { label: "View Reports",  to: "/admin/reports"       },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="A complete overview of HR, hiring, project, and company activity."
      />

      {/* ── Clickable Stats Cards ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionWidgets sections={sections} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AttendanceChart />
        </div>
        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PayrollSummary />
        <LeaveAnalytics />
        <UpcomingHolidays />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <UpcomingInterviews />
        <ActivityFeed />
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Quick Actions</h2>
          <div className="grid gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.to)}
                className="rounded-xl border border-[#E7E8F0] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#7560A7] hover:bg-[#EDE8F5] hover:text-[#302568]"
              >
                {action.label}
              </button>
            ))}
          </div>
        </Card>
        <RecentEmployees employees={employees} />
      </div>
    </div>
  );
}

export default Dashboard;
