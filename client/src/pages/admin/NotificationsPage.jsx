import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiCheckCircle, FiBell, FiX } from "react-icons/fi";
import { useNotifications } from "../../hooks/useNotifications";

const CATEGORIES = ["All", "Leave", "Attendance", "Documents", "Recruitment", "Payroll", "Employees", "Reports"];

const CATEGORY_COLORS = {
  Leave:       { bg: "bg-blue-50",   text: "text-blue-700"   },
  Attendance:  { bg: "bg-green-50",  text: "text-green-700"  },
  Documents:   { bg: "bg-amber-50",  text: "text-amber-700"  },
  Recruitment: { bg: "bg-purple-50", text: "text-purple-700" },
  Payroll:     { bg: "bg-rose-50",   text: "text-rose-700"   },
  Employees:   { bg: "bg-teal-50",   text: "text-teal-700"   },
  Reports:     { bg: "bg-slate-100", text: "text-slate-600"  },
};

const toCategory = (type = "") => {
  const value = String(type).toLowerCase();
  if (value.includes("leave")) return "Leave";
  if (value.includes("attendance")) return "Attendance";
  if (value.includes("document")) return "Documents";
  if (value.includes("recruit")) return "Recruitment";
  if (value.includes("payroll")) return "Payroll";
  if (value.includes("employee")) return "Employees";
  if (value.includes("report")) return "Reports";
  return "Reports";
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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead, deleteNotification } = useNotifications();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filtered = notifications.filter((n) => {
    const category = toCategory(n.type);
    const categoryMatch = activeCategory === "All" || category === activeCategory;
    const unreadMatch   = !showUnreadOnly || !n.read;
    return categoryMatch && unreadMatch;
  });

  const openNotification = (notification) => {
    markRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] px-6 py-8">
      <div className="mx-auto max-w-3xl">

        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#302568]">
              <FiBell className="text-lg text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
              <p className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-lg border border-[#302568] px-3 py-1.5 text-xs font-semibold text-[#302568] transition hover:bg-[#302568] hover:text-white"
            >
              <FiCheckCircle className="text-sm" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                activeCategory === cat
                  ? "bg-[#302568] text-white"
                  : "bg-white text-slate-600 border border-[#E7E8F0] hover:border-[#302568] hover:text-[#302568]",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}

          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="accent-[#302568]"
            />
            Unread only
          </label>
        </div>

        {/* Notification list */}
        <div className="overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FiBell className="mb-3 text-4xl opacity-30" />
              <p className="text-sm font-medium">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F5]">
              {filtered.map((n) => {
                const category = toCategory(n.type);
                const color = CATEGORY_COLORS[category] || { bg: "bg-slate-100", text: "text-slate-600" };
                return (
                  <div
                    key={n.id}
                    className={[
                      "flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-[#FAFAFE]",
                      !n.read ? "bg-[#F5F3FC]" : "",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className="flex min-w-0 flex-1 items-start gap-4 text-left"
                    >
                      {/* Unread dot */}
                      <span
                        className={[
                          "mt-2 h-2 w-2 shrink-0 rounded-full",
                          !n.read ? "bg-[#302568]" : "bg-transparent",
                        ].join(" ")}
                      />

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}>
                            {category}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{n.message}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatTime(n.createdAt)}</p>
                      </div>

                      {/* Mark read button */}
                      {!n.read && (
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
                      onClick={() => deleteNotification(n.id)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-[#FEF3F2] hover:text-[#B42318]"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
