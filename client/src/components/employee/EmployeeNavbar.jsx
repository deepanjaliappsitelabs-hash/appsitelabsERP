import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiMenu, FiX } from "react-icons/fi";
import getStoredUser from "../../utils/authStorage";
import { useNotifications } from "../../hooks/useNotifications";

const formatNotificationTime = (createdAt) => {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EmployeeNavbar({  onToggleSidebar }) {
  const navigate  = useNavigate();
  const user      = getStoredUser();
  const { notifications, unreadCount, markAllRead, markRead, deleteNotification } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // Greeting based on time
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E7E8F0] bg-white px-6 shadow-[0_4px_20px_rgba(48,37,104,0.04)]">

      {/* Left — hamburger + greeting */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="rounded-xl p-2 text-slate-500 hover:bg-[#F6F7FB] hover:text-slate-900"
        >
          <FiMenu className="text-xl" />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-bold text-slate-900">
            {greeting}, {user?.name?.split(" ")[0] || "Employee"} 👋
          </p>
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Right — bell + logout */}
      <div className="flex items-center gap-3">

        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotif((v) => !v)}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-[#F6F7FB]"
          >
            <FiBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#302568] text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#E7E8F0] bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E7E8F0] px-4 py-3">
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-semibold text-[#302568] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotif(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 divide-y divide-[#F0F0F5] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs font-medium text-slate-400">
                    No real-time notifications yet
                  </p>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className={["flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#FAFAFE]", !n.read ? "bg-[#F5F3FC]" : ""].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          markRead(n.id);
                          if (n.link) {
                            setShowNotif(false);
                            navigate(n.link);
                          }
                        }}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <span className={["mt-1.5 h-2 w-2 shrink-0 rounded-full", !n.read ? "bg-[#302568]" : "bg-transparent"].join(" ")} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-800">{n.title}</p>
                          {n.message && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">{n.message}</p>
                          )}
                          <p className="mt-0.5 text-[11px] text-slate-400">{formatNotificationTime(n.createdAt)}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        title="Delete notification"
                        onClick={() => deleteNotification(n.id)}
                        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-[#FEF3F2] hover:text-[#B42318]"
                      >
                        <FiX className="text-sm" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#E7E8F0] px-4 py-2 text-center">
                <button
                  type="button"
                  onClick={() => { setShowNotif(false); navigate("/employee/notices"); }}
                  className="text-xs font-semibold text-[#302568] hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User chip */}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#302568] text-xs font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || "E"}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold text-slate-900">{user?.name || "Employee"}</p>
            <p className="text-[11px] text-slate-400">{user?.role || "employee"}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-[#302568] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3d3080] active:bg-[#251d52]"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
