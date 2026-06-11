import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import useSidebarToggle from "../hooks/useSidebarToggle";
import { Outlet } from "react-router-dom";

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 320;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 440;

const clampSidebarWidth = (width) =>
  Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);

const getInitialSidebarWidth = () => {
  const storedWidth = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
  return Number.isFinite(storedWidth)
    ? clampSidebarWidth(storedWidth)
    : DEFAULT_SIDEBAR_WIDTH;
};

function AdminLayout() {
  const {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
  } = useSidebarToggle();
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth);

  const handleSidebarWidthChange = (width) => {
    setSidebarWidth(clampSidebarWidth(width));
  };

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  return (
    <div className="flex">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        maxWidth={MAX_SIDEBAR_WIDTH}
        minWidth={MIN_SIDEBAR_WIDTH}
        onWidthChange={handleSidebarWidthChange}
        width={sidebarWidth}
      />

      <div className="min-h-screen min-w-0 flex-1 bg-[#F6F7FB]">
        <Navbar
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

export default AdminLayout;
