import { useMemo, useState } from "react";
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "leave", label: "Leave" },
  { key: "attendance", label: "Attendance" },
  { key: "chat", label: "Chat" },
  { key: "email", label: "Email" },
];

const getTypeLabel = (type = "") => {
  const value = String(type || "notification").toLowerCase();
  if (value.includes("leave")) return "Leave";
  if (value.includes("attendance")) return "Attendance";
  if (value.includes("chat")) return "Chat";
  if (value.includes("email")) return "Email";
  return "Notification";
};

const getTypeClass = (type = "") => {
  const value = String(type).toLowerCase();
  if (value.includes("leave")) return "bg-blue-50 text-blue-700";
  if (value.includes("attendance")) return "bg-green-50 text-green-700";
  if (value.includes("chat")) return "bg-purple-50 text-purple-700";
  if (value.includes("email")) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const formatTime = (createdAt) => {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Notices() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead, deleteNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const type = String(notification.type || "").toLowerCase();
      const text = [
        notification.title,
        notification.message,
        notification.type,
      ].join(" ").toLowerCase();

      const matchesSearch = !keyword || text.includes(keyword);
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !notification.read) ||
        type.includes(filter);

      return matchesSearch && matchesFilter;
    });
  }, [filter, notifications, search]);

  const openNotification = (notification) => {
    markRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-400">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-xl border border-[#302568] px-3 py-2 text-xs font-semibold text-[#302568] transition hover:bg-[#302568] hover:text-white"
            >
              <FiCheckCircle className="text-sm" />
              Mark all read
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-[#E7E8F0] bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-[#302568] focus:ring-2 focus:ring-[#302568]/10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={[
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                  filter === key
                    ? "border-[#302568] bg-[#302568] text-white"
                    : "border-[#E7E8F0] bg-white text-slate-500 hover:border-[#302568]/30 hover:text-[#302568]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FiBell className="mb-3 text-4xl opacity-20" />
              <p className="text-sm font-medium">No real-time notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F5]">
              {filtered.map((notification) => (
                <div
                  key={notification.id}
                  className={[
                    "flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-[#FAFAFE]",
                    !notification.read ? "bg-[#F5F3FC]" : "",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="flex min-w-0 flex-1 items-start gap-4 text-left"
                  >
                    <span
                      className={[
                        "mt-2 h-2 w-2 shrink-0 rounded-full",
                        !notification.read ? "bg-[#302568]" : "bg-transparent",
                      ].join(" ")}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {notification.title || "Notification"}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTypeClass(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </span>
                      </div>
                      {notification.message && (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span
                        title="Mark as read"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-[#EDE8F5] hover:text-[#302568]"
                      >
                        <FiCheck className="text-sm" />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    title="Delete notification"
                    onClick={() => deleteNotification(notification.id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-[#FEF3F2] hover:text-[#B42318]"
                  >
                    <FiX className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
