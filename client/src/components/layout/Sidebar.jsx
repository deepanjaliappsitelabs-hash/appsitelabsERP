import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiMail,
  FiMessageCircle,
  FiFolder,
  FiPieChart,
  FiUsers,
} from "react-icons/fi";
import { BsReceipt } from "react-icons/bs";

const sassItems = [
  {
    id: "hr",
    title: "HR Management",
    icon: <FiUsers />,
    items: [
      { label: "Employees",   to: "/admin/employees" },
      { label: "Attendances", to: "/admin/attendance" },
      { label: "Daily Worklog", to: "/admin/work-logs" },
      { label: "Leaves",      to: "/admin/leaves" },
      { label: "Payroll",     to: "/admin/payroll" },
      { label: "Reports",     to: "/admin/reports" },
    ],
  },
  {
    id: "job-hiring",
    title: "Job Hiring",
    icon: <FiBriefcase />,
    items: [
      { label: "Recruitment", to: "/admin/recruitment" },
      { label: "Jobs",        to: "/admin/recruitment/jobs" },
      {
        label: "Candidates",
        children: [
          { label: "Candidate List", to: "/admin/recruitment/candidates" },
        ],
      },
      { label: "Documents", to: "/admin/documents" },
    ],
  },
  {
    id: "project",
    title: "Project Management",
    icon: <FiFolder />,
    items: [
      { label: "Projects", to: "/admin/projects" },
      { label: "Contacts", to: "/admin/project-contacts" },
    ],
  },
  {
    id: "general",
    title: "General",
    icon: <FiClock />,
    items: [
      { label: "Dashboard", to: "/admin/general" },
      { label: "Contacts",  to: "/admin/contacts" },
      { label: "Profile",   to: "/admin/profile" },
      { label: "Settings",  to: "/admin/settings" },
    ],
  },
];

const appItems = [
  { label: "Calendar", to: "/admin/calendar", icon: <FiCalendar /> },
  {
    label: "Email",
    icon: <FiMail />,
    children: [
      { label: "Inbox",   to: "/admin/email/inbox" },
      { label: "Compose", to: "/admin/email/compose" },
      { label: "Preview", to: "/admin/email/preview" },
    ],
  },
  {
    label: "Chat",
    icon: <FiMessageCircle />,
    children: [
      { label: "Inbox",   to: "/admin/chat/inbox" },
      { label: "Preview", to: "/admin/chat/preview" },
    ],
  },
  {
    label: "Invoices",
    icon: <BsReceipt />,
    children: [
      // ✅ Match exact AppRoutes paths
      { label: "All Invoices",   to: "/admin/invoices" },
      { label: "Create Invoice", to: "/admin/invoices/new" },
    ],
  },
  {
    label: "Tasks",
    icon: <FiFolder />,
    children: [
      { label: "Task List", to: "/admin/tasks" },
      { label: "Kanban",    to: "/admin/tasks/kanban" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function itemMatchesPath(item, pathname) {
  if (item.to && pathname.startsWith(item.to)) return true;
  return item.children?.some((child) => pathname.startsWith(child.to));
}

// ── SASS Sub Item ─────────────────────────────────────────────────────────────
function SassSubItem({ item }) {
  const location = useLocation();
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const hasActiveChild =
    hasChildren &&
    item.children.some((child) => location.pathname.startsWith(child.to));
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen((c) => !c)}
          className={[
            "flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-sm font-medium transition",
            hasActiveChild || isOpen
              ? "text-[#302568]"
              : "text-slate-500 hover:text-[#302568]",
          ].join(" ")}
        >
          <span className={["text-base font-bold", hasActiveChild || isOpen ? "text-[#302568]" : "text-slate-400"].join(" ")}>
            -
          </span>
          <span>{item.label}</span>
          {isOpen
            ? <FiChevronDown className="ml-auto text-lg text-[#302568]" />
            : <FiChevronRight className="ml-auto text-lg text-slate-400" />}
        </button>

        <div className={["grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"].join(" ")}>
          <div className="overflow-hidden">
            <div className="space-y-1 pl-8 pt-1">
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  className={({ isActive }) =>
                    ["flex min-h-8 items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
                      isActive ? "text-[#302568]" : "text-slate-500 hover:text-[#302568]"].join(" ")
                  }
                >
                  <span className="text-slate-400">-</span>
                  {child.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        ["flex min-h-9 items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition",
          isActive ? "text-[#302568]" : "text-slate-500 hover:text-[#302568]"].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span className={["text-base font-bold", isActive ? "text-[#302568]" : "text-slate-400"].join(" ")}>-</span>
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

// ── SASS Accordion ────────────────────────────────────────────────────────────
function SassAccordionItem({ section, isOpen, onToggle }) {
  const location = useLocation();
  const hasActiveChild = section.items.some((item) =>
    itemMatchesPath(item, location.pathname)
  );
  const isHighlighted = isOpen || hasActiveChild;

  return (
    <div className={["overflow-hidden rounded-xl transition", isOpen ? "bg-[#FAFAFD]" : "bg-white"].join(" ")}>
      <button
        type="button"
        onClick={onToggle}
        className={[
          "flex w-full items-center justify-between px-4 py-3.5 text-left transition",
          isHighlighted ? "bg-[#EDE8F5] text-[#302568]" : "text-slate-900 hover:bg-[#F3F0FA]",
        ].join(" ")}
      >
        <span className="flex items-center gap-3.5">
          <span className="text-lg">{section.icon}</span>
          <span className="text-[15px] font-semibold">{section.title}</span>
        </span>
        {isOpen
          ? <FiChevronDown className="text-lg text-[#302568]" />
          : <FiChevronRight className="text-lg text-slate-400" />}
      </button>

      <div className={["grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"].join(" ")}>
        <div className="overflow-hidden">
          <div className="space-y-1.5 px-4 py-3">
            {section.items.map((item) => (
              <SassSubItem key={item.label} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Menu Item ─────────────────────────────────────────────────────────────
function AppMenuItem({ item }) {
  const location = useLocation();
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const hasActiveChild =
    hasChildren &&
    item.children.some((child) => location.pathname.startsWith(child.to));
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  if (hasChildren) {
    return (
      <div className={["overflow-hidden rounded-xl transition", isOpen ? "bg-[#FAFAFD]" : "bg-white"].join(" ")}>
        <button
          type="button"
          onClick={() => setIsOpen((c) => !c)}
          className={[
            "flex w-full items-center justify-between px-4 py-3.5 text-left transition",
            hasActiveChild || isOpen ? "text-[#302568]" : "text-slate-900 hover:bg-[#F3F0FA]",
          ].join(" ")}
        >
          <span className="flex items-center gap-3.5">
            <span className="text-lg">{item.icon}</span>
            <span className="text-[15px] font-semibold">{item.label}</span>
          </span>
          {isOpen
            ? <FiChevronDown className="text-lg text-[#302568]" />
            : <FiChevronRight className="text-lg text-slate-400" />}
        </button>

        <div className={["grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"].join(" ")}>
          <div className="overflow-hidden">
            <div className="space-y-1.5 px-4 py-3">
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  className={({ isActive }) =>
                    ["flex min-h-9 items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                      isActive ? "text-[#302568]" : "text-slate-500 hover:text-[#302568]"].join(" ")
                  }
                >
                  <span className="text-base font-bold text-slate-400">-</span>
                  {child.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        ["flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-slate-900 transition",
          isActive ? "bg-[#EDE8F5] text-[#302568]" : "hover:bg-[#F3F0FA]"].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span className={["text-lg", isActive ? "text-[#302568]" : "text-slate-900"].join(" ")}>
            {item.icon}
          </span>
          <span className="text-[15px] font-semibold">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({
  isOpen = true,
  maxWidth = 440,
  minWidth = 240,
  onWidthChange,
  width = 320,
}) {
  const location = useLocation();
  const activeSassSection =
    sassItems.find((section) =>
      section.items.some((item) => itemMatchesPath(item, location.pathname))
    )?.id || "";
  const [openSassSection, setOpenSassSection] = useState(activeSassSection);
  const [isResizing, setIsResizing] = useState(false);
  const frameRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);
  const sidebarWidth = typeof width === "number" ? `${width}px` : width;

  useEffect(() => {
    if (!isResizing) return undefined;

    const handlePointerMove = (event) => {
      const nextWidth = startWidthRef.current + event.clientX - startXRef.current;
      const clampedWidth = Math.min(Math.max(nextWidth, minWidth), maxWidth);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        onWidthChange?.(clampedWidth);
      });
    };

    const stopResizing = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setIsResizing(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
    };
  }, [isResizing, maxWidth, minWidth, onWidthChange]);

  const startResizing = (event) => {
    startXRef.current = event.clientX;
    startWidthRef.current = width;
    setIsResizing(true);
  };

  return (
    <aside
      id="app-sidebar"
      style={{ "--sidebar-width": sidebarWidth }}
      className={[
        "fixed inset-y-0 left-0 z-40 h-screen w-[var(--sidebar-width)] shrink-0 border-r border-[#E7E8F0] bg-white shadow-[10px_0_30px_rgba(48,37,104,0.04)] will-change-[width,transform,opacity] lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
        isResizing
          ? "transition-none"
          : "transition-[width,transform,opacity,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isOpen
          ? "translate-x-0 overflow-y-auto px-4 py-5 opacity-100"
          : "-translate-x-full overflow-hidden px-4 py-5 opacity-0 lg:w-0 lg:border-r-0 lg:px-0",
      ].join(" ")}
    >
      {isOpen && (
        <button
          type="button"
          onPointerDown={startResizing}
          className="group absolute -right-2 top-0 z-50 hidden h-full w-4 cursor-col-resize touch-none items-center justify-center lg:flex"
          aria-label="Resize sidebar"
        >
          <span
            className={[
              "absolute inset-y-5 left-1/2 w-px -translate-x-1/2 rounded-full transition-colors duration-200",
              isResizing ? "bg-[#7560A7]/45" : "bg-transparent group-hover:bg-[#7560A7]/25",
            ].join(" ")}
          />
          <span
            className={[
              "h-16 w-1.5 rounded-full shadow-sm transition-all duration-200",
              isResizing
                ? "scale-x-125 bg-[#7560A7] opacity-100 shadow-[#7560A7]/30"
                : "bg-[#CFC6FF] opacity-0 group-hover:opacity-100",
            ].join(" ")}
          />
        </button>
      )}

      <div className="w-full">
        {/* Logo */}
        <div className="mb-7 rounded-2xl border border-[#ECEEF5] bg-[#FAFAFD] p-3">
          <img
            src="/ASL_Official-logo.png"
            alt="AppsiteLabs"
            className="h-10 w-full object-contain"
          />
        </div>

        <nav className="space-y-5">
          {/* Dashboard */}
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              ["flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition",
                isActive
                  ? "bg-[#EDE8F5] text-[#302568]"
                  : "text-slate-500 hover:bg-[#F3F0FA] hover:text-slate-900"].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <FiPieChart className={["text-lg", isActive ? "text-[#302568]" : ""].join(" ")} />
                Dashboard
              </>
            )}
          </NavLink>

          {/* SASS */}
          <div>
            <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">SASS</p>
            <div className="space-y-2">
              {sassItems.map((section) => (
                <SassAccordionItem
                  key={section.id}
                  section={section}
                  isOpen={openSassSection === section.id}
                  onToggle={() =>
                    setOpenSassSection((current) =>
                      current === section.id ? "" : section.id
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* APPS */}
          <div>
            <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">APPS</p>
            <div className="space-y-2">
              {appItems.map((item) => (
                <AppMenuItem key={item.to || item.label} item={item} />
              ))}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
