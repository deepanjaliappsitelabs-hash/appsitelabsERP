import { Outlet } from "react-router-dom";
import EmployeeSidebar from "../components/employee/EmployeeSidebar";
import EmployeeNavbar  from "../components/employee/EmployeeNavbar";
import useSidebarToggle from "../hooks/useSidebarToggle";

function EmployeeLayout() {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebarToggle();

  return (
    <div className="flex">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        className={[
          "fixed inset-y-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-[#E7E8F0] bg-white shadow-[10px_0_30px_rgba(17,24,39,0.03)] transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
          isSidebarOpen
            ? "translate-x-0 overflow-y-auto p-4 opacity-100"
            : "-translate-x-full overflow-hidden p-4 opacity-0 lg:w-0 lg:border-r-0 lg:p-0",
        ].join(" ")}
      >
        <EmployeeSidebar />
      </aside>

      {/* Main content */}
      <div className="min-h-screen min-w-0 flex-1 bg-[#F6F7FB]">
        <EmployeeNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <main className="p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default EmployeeLayout;