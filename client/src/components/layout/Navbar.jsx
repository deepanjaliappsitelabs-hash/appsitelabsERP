import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBell, FiCheck, FiMenu, FiSearch, FiSettings, FiX, FiLogOut } from "react-icons/fi";
import getStoredUser from "../../utils/authStorage";
import { useNotifications } from "../../hooks/useNotifications";

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const initials = (name || "AD").split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #302568 0%, #7560A7 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff",
      letterSpacing: "0.04em", flexShrink: 0,
      boxShadow: "0 2px 8px rgba(48,37,104,0.30)",
    }}>
      {initials}
    </div>
  );
}

// ── Notification Dropdown ─────────────────────────────────────────────────────
function NotificationDropdown({ notifications, unreadCount, onMarkAll, onClose, onOpenNotification, onDeleteNotification, onViewAll }) {
  return (
    <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-[#E7E8F0] bg-white shadow-[0_20px_60px_rgba(48,37,104,0.18)]">
      <div className="flex items-center justify-between border-b border-[#E7E8F0] px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-900">Notifications</p>
          {unreadCount > 0 && <span className="rounded-full bg-[#302568] px-2 py-0.5 text-xs font-bold text-white">{unreadCount}</span>}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <button type="button" onClick={onMarkAll} className="text-xs font-semibold text-[#302568] hover:underline">Mark all read</button>}
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-[#EDE8F5] hover:text-[#302568]"><FiX /></button>
        </div>
      </div>
      <div className="max-h-80 divide-y divide-[#F0F0F5] overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={["flex w-full items-start gap-3 px-4 py-3 transition hover:bg-[#FAFAFE]", !n.read ? "bg-[#F5F3FC]" : ""].join(" ")}>
              <button type="button" onClick={() => onOpenNotification(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                <span className={["mt-1.5 h-2 w-2 shrink-0 rounded-full", !n.read ? "bg-[#302568]" : "bg-transparent"].join(" ")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                </div>
                {!n.read && <span className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-[#EDE8F5] hover:text-[#302568]"><FiCheck className="text-xs" /></span>}
              </button>
              <button type="button" onClick={() => onDeleteNotification(n.id)} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><FiX className="text-sm" /></button>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-[#E7E8F0] px-4 py-3 text-center">
        <button type="button" onClick={onViewAll} className="text-xs font-semibold text-[#302568] hover:underline">View all notifications</button>
      </div>
    </div>
  );
}

// ── Search ────────────────────────────────────────────────────────────────────
const SEARCH_LINKS = [
  { label: "Employees",   to: "/admin/employees" },
  { label: "Attendance",  to: "/admin/attendance" },
  { label: "Daily Worklog", to: "/admin/work-logs" },
  { label: "Leaves",      to: "/admin/leaves" },
  { label: "Payroll",     to: "/admin/payroll" },
  { label: "Recruitment", to: "/admin/recruitment" },
  { label: "Jobs",        to: "/admin/recruitment/jobs" },
  { label: "Candidates",  to: "/admin/recruitment/candidates" },
  { label: "Documents",   to: "/admin/documents" },
  { label: "Reports",     to: "/admin/reports" },
  { label: "Projects",    to: "/admin/projects" },
  { label: "Contacts",    to: "/admin/contacts" },
  { label: "Settings",    to: "/admin/settings" },
  { label: "Calendar",    to: "/admin/calendar" },
  { label: "Invoices",    to: "/admin/invoices" },
];
const SEARCH_HIGHLIGHT_NAME = "navbar-search-match";
const IGNORED_SEARCH_TAGS   = new Set(["SCRIPT","STYLE","NOSCRIPT","INPUT","TEXTAREA","SELECT","OPTION"]);
let notificationAudioContext = null;

function installSearchHighlightStyle() {
  if (document.getElementById("navbar-search-highlight-style")) return;
  const s = document.createElement("style");
  s.id = "navbar-search-highlight-style";
  s.textContent = `::highlight(${SEARCH_HIGHLIGHT_NAME}){background:#FDE68A;color:#111827;}`;
  document.head.appendChild(s);
}
function clearSearchHighlights() { if (window.CSS?.highlights) window.CSS.highlights.delete(SEARCH_HIGHLIGHT_NAME); }
function highlightPageText(query) {
  const kw = query.trim().toLowerCase();
  clearSearchHighlights();
  if (!kw || !window.CSS?.highlights || typeof Highlight === "undefined") return;
  installSearchHighlightStyle();
  const root   = document.querySelector("main") || document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p || IGNORED_SEARCH_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const ranges = [];
  let node = walker.nextNode();
  while (node) {
    const text = node.nodeValue || "";
    const lo   = text.toLowerCase();
    let i = lo.indexOf(kw);
    while (i !== -1) { const r = new Range(); r.setStart(node, i); r.setEnd(node, i + kw.length); ranges.push(r); i = lo.indexOf(kw, i + kw.length); }
    node = walker.nextNode();
  }
  if (ranges.length) window.CSS.highlights.set(SEARCH_HIGHLIGHT_NAME, new Highlight(...ranges));
}

function SearchDropdown({ query, onSelect }) {
  const results = SEARCH_LINKS.filter((l) => l.label.toLowerCase().includes(query.toLowerCase()));
  if (!query || !results.length) return null;
  return (
    <div className="absolute left-0 top-[54px] z-50 w-full overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-[0_24px_70px_rgba(48,37,104,0.16)]">
      <div className="border-b border-[#F0F0F5] px-4 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Quick results</p>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {results.map((r) => (
          <button key={r.to} type="button" onClick={() => onSelect(r.to)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-[#F5F3FC] hover:text-[#302568]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1EDFF] text-[#302568]"><FiSearch /></span>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getAudioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!notificationAudioContext) notificationAudioContext = new AC();
  return notificationAudioContext;
}
function unlockSound() { try { getAudioCtx()?.resume?.(); } catch {} }
function playSound() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return; ctx.resume?.();
    const osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.24);
  } catch {}
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
function Navbar({ isSidebarOpen = true, onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = getStoredUser();
  const { notifications, unreadCount, latestNotificationId, markAllRead, markRead, deleteNotification } = useNotifications();

  const [searchQuery,       setSearchQuery]       = useState("");
  const [showSearch,        setShowSearch]        = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellBlink,         setBellBlink]         = useState(false);
  const [showUserMenu,      setShowUserMenu]       = useState(false);

  const notifRef    = useRef(null);
  const searchRef   = useRef(null);
  const userRef     = useRef(null);
  const inputRef    = useRef(null);
  const lastIdRef   = useRef(null);
  const syncedRef   = useRef(false);
  const blinkRef    = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (notifRef.current  && !notifRef.current.contains(e.target))  setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (userRef.current   && !userRef.current.contains(e.target))   setShowUserMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => { highlightPageText(searchQuery); return clearSearchHighlights; }, [searchQuery]);

  useEffect(() => {
    const fn = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setShowSearch(true); inputRef.current?.focus(); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    window.addEventListener("pointerdown", unlockSound, { once: true });
    window.addEventListener("keydown",     unlockSound, { once: true });
    return () => { window.removeEventListener("pointerdown", unlockSound); window.removeEventListener("keydown", unlockSound); };
  }, []);

  useEffect(() => {
    if (!syncedRef.current) { syncedRef.current = true; lastIdRef.current = latestNotificationId; return; }
    if (!latestNotificationId || lastIdRef.current === latestNotificationId) return;
    lastIdRef.current = latestNotificationId;
    playSound(); setBellBlink(true);
    window.clearTimeout(blinkRef.current);
    blinkRef.current = window.setTimeout(() => setBellBlink(false), 3200);
    return () => window.clearTimeout(blinkRef.current);
  }, [latestNotificationId]);

  const displayName = user?.name  || "Admin";
  const roleLabel   = user?.role === "admin" ? "Administrator" : (user?.role || "Admin");
  const handleSettingsClick = () => {
    navigate(location.pathname === "/admin/settings" ? "/admin/dashboard" : "/admin/settings");
  };

  return (
    <div
      className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#E7E8F0] bg-white px-6 lg:px-8"
      style={{ boxShadow: "0 1px 0 #E7E8F0, 0 4px 20px rgba(48,37,104,0.05)" }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={onToggleSidebar} aria-controls="app-sidebar" aria-expanded={isSidebarOpen}
          className="rounded-xl p-2.5 text-slate-500 transition hover:bg-[#F3F0FA] hover:text-[#302568]">
          <FiMenu className="text-xl" />
        </button>

        <div ref={searchRef} className="relative hidden lg:block">
          <div className={["flex h-11 w-[360px] items-center gap-3 rounded-full border px-4 transition",
            showSearch
              ? "border-[#7560A7] bg-white shadow-[0_0_0_3px_rgba(117,96,167,0.14)]"
              : "border-[#E6E8F0] bg-[#F7F6FC] hover:border-[#C8BEE8] hover:bg-white",
          ].join(" ")}>
            <span className={["flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition", showSearch ? "bg-[#302568] text-white" : "bg-[#EDEAF8] text-[#302568]"].join(" ")}>
              <FiSearch className="text-sm" />
            </span>
            <input ref={inputRef} type="text" placeholder="Search…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(""); setShowSearch(false); clearSearchHighlights(); }}
                className="rounded-full p-1 text-slate-400 hover:bg-[#EDE8F5] hover:text-[#302568]">
                <FiX className="text-xs" />
              </button>
            )}
          </div>
          {showSearch && <SearchDropdown query={searchQuery} onSelect={(to) => { setSearchQuery(""); setShowSearch(false); navigate(to); }} />}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">

        {/* Settings */}
        <button type="button" onClick={handleSettingsClick} title="Settings"
          className="rounded-xl p-2.5 text-slate-500 transition hover:bg-[#F3F0FA] hover:text-[#302568]">
          <FiSettings className="text-[18px]" />
        </button>

        {/* Bell */}
        <div ref={notifRef} className="relative">
          <button type="button" onClick={() => setShowNotifications((v) => !v)}
            className={["relative rounded-xl p-2.5 transition hover:bg-[#F3F0FA]", bellBlink ? "text-[#302568]" : "text-slate-500 hover:text-[#302568]"].join(" ")}>
            <FiBell className={["text-[18px] transition-transform duration-200", bellBlink ? "scale-125" : ""].join(" ")} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#302568,#7560A7)" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown
              notifications={notifications} unreadCount={unreadCount}
              onMarkAll={markAllRead} onClose={() => setShowNotifications(false)}
              onOpenNotification={(n) => { markRead(n.id); setShowNotifications(false); if (n.link) navigate(n.link); }}
              onDeleteNotification={deleteNotification}
              onViewAll={() => { setShowNotifications(false); navigate("/admin/notifications"); }}
            />
          )}
        </div>

        {/* Divider */}
        <div className="mx-2 h-8 w-px bg-[#E7E8F0]" />

        {/* Premium User Card */}
        <div ref={userRef} className="relative">
          <button type="button" onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2.5 rounded-2xl border border-[#E7E8F0] bg-[#FAFAFD] px-3 py-2 transition hover:border-[#C8BEE8] hover:bg-[#F3F0FA]"
            style={{ boxShadow: "0 2px 8px rgba(48,37,104,0.07)" }}>
            <Avatar name={displayName} size={34} />
            <div className="hidden text-left md:block">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#7560A7" }}>{roleLabel}</p>
              <p className="text-[13px] font-extrabold leading-snug text-slate-900">{displayName}</p>
            </div>
            <svg className={["hidden text-slate-400 transition-transform duration-200 md:block", showUserMenu ? "rotate-180" : ""].join(" ")}
              width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-[52px] z-50 w-52 rounded-2xl border border-[#E7E8F0] bg-white shadow-[0_20px_60px_rgba(48,37,104,0.18)]">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[#F0EDFC] px-4 py-3"
                style={{ background: "linear-gradient(135deg,#302568 0%,#7560A7 100%)", borderRadius: "1rem 1rem 0 0" }}>
                <Avatar name={displayName} size={36} />
                <div>
                  <p className="text-sm font-bold text-white">{displayName}</p>
                  <p className="text-[11px] font-medium text-white/70">{roleLabel}</p>
                </div>
              </div>
              {/* Links */}
              <div className="p-2">
                <button type="button" onClick={() => { setShowUserMenu(false); navigate("/admin/profile"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F3F0FA] hover:text-[#302568]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDEAF8] text-[#302568]">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </span>
                  My Profile
                </button>
                <button type="button" onClick={() => { setShowUserMenu(false); navigate("/admin/settings"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F3F0FA] hover:text-[#302568]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDEAF8] text-[#302568]"><FiSettings className="text-xs" /></span>
                  Settings
                </button>
              </div>
              <div className="border-t border-[#E7E8F0] p-2">
                <button type="button" onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500"><FiLogOut className="text-xs" /></span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
