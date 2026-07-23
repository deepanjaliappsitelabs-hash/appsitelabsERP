import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiClock,
  FiCalendar,
  FiFileText,
  FiFolder,
  FiBell,
  FiUser,
  FiClipboard,
  FiMessageCircle,
  FiMail,
} from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/employee/dashboard",  label: "Dashboard",       icon: FiGrid       },
  { to: "/employee/attendance", label: "Attendance",      icon: FiClock      },
  { to: "/employee/leaves",     label: "Leaves",          icon: FiCalendar   },
  { to: "/employee/work-log",   label: "Daily Work Log",  icon: FiClipboard  },
  { to: "/employee/payslips",   label: "Payslips",        icon: FiFileText   },
  { to: "/employee/documents",  label: "Documents",       icon: FiFolder     },
  { to: "/employee/notices",    label: "Notices",         icon: FiBell       },
  { to: "/employee/email/inbox", label: "Email",           icon: FiMail       },
  { to: "/employee/chat/inbox", label: "Chat",            icon: FiMessageCircle },
  { to: "/employee/profile",    label: "My Profile",      icon: FiUser       },
];

export default function EmployeeSidebar() {
  return (
    <div className="w-56">
      {/* Logo */}
      <div className="mb-7 rounded-2xl border border-[#ECEEF5] bg-[#FAFAFD] p-3">
        <img
          src="/ASL_Official-logo.png"
          alt="AppsiteLabs"
          className="h-10 w-full object-contain"
        />
      </div>

      {/* Section label */}
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Employee Portal
      </p>

      {/* Nav links */}
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-[#302568] text-white shadow-sm shadow-[#302568]/20"
                  : "text-slate-600 hover:bg-[#F1EDFF] hover:text-[#302568]",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={[
                    "shrink-0 text-base",
                    isActive ? "text-white" : "text-[#7560A7]",
                  ].join(" ")}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — version tag */}
      <div className="mt-10 rounded-xl bg-[#F5F3FC] px-4 py-3">
        <p className="text-xs font-semibold text-[#302568]">Employee Panel</p>
        <p className="mt-0.5 text-[11px] text-slate-400">HRM v1.0 · AppsiteLabs</p>
      </div>
    </div>
  );
}
