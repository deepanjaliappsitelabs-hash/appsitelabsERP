import { useEffect, useRef, useState } from "react";
import {
  FiClock,
  FiLogIn,
  FiLogOut,
  FiAlertCircle,
  FiCheckCircle,
  FiCalendar,
  FiXCircle,
} from "react-icons/fi";
import getStoredUser from "../../utils/authStorage";
import {
  checkOutAttendance,
  getAttendanceByEmployee,
  markAttendance,
} from "../../services/attendanceService";
import toast from "react-hot-toast";

// ── Office timing constants ────────────────────────────────────────────────────
const ENTRY_HOUR   = 10;
const ENTRY_MINUTE = 15; // 10:15 AM
const EXIT_HOUR    = 18;
const EXIT_MINUTE  = 30; // 6:30 PM

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n) {
  return String(n).padStart(2, "0");
}



function formatHHMM(date) {
  if (!date) return "--:--";
  const d = new Date(date);
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function diffHHMMSS(start, end) {
  const diff = Math.floor((end - start) / 1000);
  const h    = Math.floor(diff / 3600);
  const m    = Math.floor((diff % 3600) / 60);
  const s    = diff % 60;
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

function canEntry(now) {
  const entryLimit = new Date(now);
  entryLimit.setHours(ENTRY_HOUR, ENTRY_MINUTE, 0, 0);
  return now >= entryLimit;
}

function canExit(now) {
  const exitLimit = new Date(now);
  exitLimit.setHours(EXIT_HOUR, EXIT_MINUTE, 0, 0);
  return now >= exitLimit;
}

function minutesUntilEntry(now) {
  const entryLimit = new Date(now);
  entryLimit.setHours(ENTRY_HOUR, ENTRY_MINUTE, 0, 0);
  return Math.max(0, Math.ceil((entryLimit - now) / 60000));
}

function minutesUntilExit(now) {
  const exitLimit = new Date(now);
  exitLimit.setHours(EXIT_HOUR, EXIT_MINUTE, 0, 0);
  return Math.max(0, Math.ceil((exitLimit - now) / 60000));
}

// ── Popup component ───────────────────────────────────────────────────────────
function StrictPopup({ type, onClose }) {
  const isEntry = type === "entry";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex justify-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isEntry ? "bg-red-50" : "bg-amber-50"}`}>
            <FiAlertCircle className={`text-3xl ${isEntry ? "text-red-500" : "text-amber-500"}`} />
          </div>
        </div>
        <h2 className="mb-2 text-center text-base font-bold text-slate-900">
          {isEntry ? "Entry Not Allowed" : "Exit Not Allowed"}
        </h2>
        <p className="mb-1 text-center text-sm text-slate-500">
          {isEntry
            ? `Office entry opens at 10:15 AM only.`
            : `You cannot exit before 6:30 PM.`}
        </p>
        <p className="mb-6 text-center text-xs text-slate-400">
          {isEntry
            ? "Please wait until 10:15 AM to mark your attendance."
            : "Please complete your working hours before logging out."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-[#302568] py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d3080]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

const STATUS_STYLE = {
  Present: "bg-green-50 text-green-700",
  Absent:  "bg-red-50 text-red-600",
  Leave:   "bg-blue-50 text-blue-700",
  Late:    "bg-amber-50 text-amber-700",
};

function formatTime(value) {
  if (!value) return "--";
  const [hour = "0", minute = "00"] = String(value).split(":");
  let hourNumber = Number(hour);
  const ampm = hourNumber >= 12 ? "PM" : "AM";
  hourNumber = hourNumber % 12 || 12;
  return `${hourNumber}:${minute} ${ampm}`;
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeAttendance() {
  const user = getStoredUser();

  const [now,        setNow]        = useState(new Date());
  const [checkedIn,  setCheckedIn]  = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [entryTime,  setEntryTime]  = useState(null);
  const [exitTime,   setExitTime]   = useState(null);
  const [elapsed,    setElapsed]    = useState("00h 00m 00s");
  const [popup,      setPopup]      = useState(null); // "entry" | "exit" | null
  const [todayRecord, setTodayRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef(null);

  // Live clock — updates every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const employeeId = user?.employeeId || user?.id || user?._id;
    if (!employeeId) return;

    getAttendanceByEmployee(employeeId)
      .then((rows) => {
        const todayKey = localDateKey();
        const currentRecord = rows.find((row) => row.date === todayKey);
        setRecords(rows);

        if (currentRecord) {
          setTodayRecord(currentRecord);
          setCheckedIn(Boolean(currentRecord.checkIn));
          setCheckedOut(Boolean(currentRecord.checkOut));
          if (currentRecord.checkIn) {
            setEntryTime(new Date(`${todayKey}T${currentRecord.checkIn}:00`));
          }
          if (currentRecord.checkOut) {
            setExitTime(new Date(`${todayKey}T${currentRecord.checkOut}:00`));
          }
          if (currentRecord.hours) {
            setElapsed(`${currentRecord.hours}h`);
          }
        }
      })
      .catch(() => {});
  }, [user?.employeeId, user?.id, user?._id]);

  // Running timer after check-in
  useEffect(() => {
    if (checkedIn && !checkedOut && entryTime) {
      timerRef.current = setInterval(() => {
        setElapsed(diffHHMMSS(entryTime, new Date()));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [checkedIn, checkedOut, entryTime]);

  const handleCheckIn = async () => {
    if (!canEntry(now)) {
      setPopup("entry");
      return;
    }
    const t = new Date();
    const employeeId = user?.employeeId || user?.id || user?._id;

    try {
      setSaving(true);
      const created = await markAttendance({
        employee_id: employeeId,
        date: localDateKey(t),
        checkIn: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
        status: "present",
      });
      setTodayRecord(created);
      setRecords((current) => [created, ...current.filter((row) => row._id !== created._id)]);
      setEntryTime(t);
      setCheckedIn(true);
      toast.success("Attendance marked");
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-in failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async () => {
    if (!canExit(now)) {
      setPopup("exit");
      return;
    }
    if (!todayRecord?._id) return;
    const t = new Date();
    const finalElapsed = diffHHMMSS(entryTime, t);

    try {
      setSaving(true);
      const updated = await checkOutAttendance(todayRecord._id, {
        checkOut: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
      });
      setTodayRecord(updated);
      setRecords((current) =>
        current.map((row) => (row._id === updated._id ? updated : row))
      );
      setExitTime(t);
      setCheckedOut(true);
      clearInterval(timerRef.current);
      setElapsed(finalElapsed);
      toast.success("Checked out");
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-out failed");
    } finally {
      setSaving(false);
    }
  };

  // Status label
  const statusLabel = checkedOut
    ? "Day Complete ✅"
    : checkedIn
    ? "Currently Working 🟢"
    : "Not Checked In";

  const statusColor = checkedOut
    ? "text-green-600"
    : checkedIn
    ? "text-emerald-600"
    : "text-slate-400";

  // Time info pills
  const entryOpen = canEntry(now);
  const exitOpen  = canExit(now);

  return (
    <div className="min-h-screen bg-[#F6F7FB] px-4 py-8 sm:px-8">
      {/* Popup */}
      {popup && <StrictPopup type={popup} onClose={() => setPopup(null)} />}

      <div className="mx-auto max-w-3xl space-y-6">

        {/* ── Page header ── */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-400">
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* ── Live clock card ── */}
        <div className="rounded-2xl border border-[#E7E8F0] bg-white px-6 py-8 text-center shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Current Time
          </p>
          <p className="font-mono text-5xl font-bold tabular-nums text-slate-900">
            {pad(now.getHours())}:{pad(now.getMinutes())}
            <span className="text-3xl text-slate-400">:{pad(now.getSeconds())}</span>
          </p>
          <p className={`mt-3 text-sm font-semibold ${statusColor}`}>{statusLabel}</p>

          {/* Office timing info */}
          <div className="mt-4 flex justify-center gap-4 text-xs">
            <span className={`flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${entryOpen ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {entryOpen ? <FiCheckCircle /> : <FiXCircle />}
              Entry: 10:15 AM
            </span>
            <span className={`flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${exitOpen ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              {exitOpen ? <FiCheckCircle /> : <FiXCircle />}
              Exit: 6:30 PM
            </span>
          </div>
        </div>

        {/* ── Check-in / Check-out card ── */}
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Entry */}
          <div className="rounded-2xl border border-[#E7E8F0] bg-white p-5 text-center shadow-sm">
            <FiLogIn className="mx-auto mb-2 text-2xl text-[#302568]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Check In</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {entryTime ? formatHHMM(entryTime) : "--:--"}
            </p>
            {!checkedIn && (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={!entryOpen || saving}
                className={[
                  "mt-3 w-full rounded-xl py-2 text-sm font-semibold transition",
                  entryOpen
                    ? "bg-[#302568] text-white hover:bg-[#3d3080]"
                    : "cursor-not-allowed bg-slate-100 text-slate-400",
                ].join(" ")}
              >
                {entryOpen ? "Mark Entry" : `Opens at 10:15 AM`}
              </button>
            )}
            {checkedIn && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                <FiCheckCircle /> Checked In
              </span>
            )}
          </div>

          {/* Timer */}
          <div className="rounded-2xl border border-[#302568]/20 bg-[#F5F3FC] p-5 text-center shadow-sm">
            <FiClock className="mx-auto mb-2 text-2xl text-[#302568]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#302568]">
              {checkedOut ? "Total Hours" : "Time Elapsed"}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#302568]">
              {checkedIn ? elapsed : "00h 00m 00s"}
            </p>
            {!checkedIn && (
              <p className="mt-2 text-xs text-slate-400">Timer starts on check-in</p>
            )}
            {checkedIn && !checkedOut && (
              <span className="mt-2 inline-block animate-pulse rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                ● Live
              </span>
            )}
            {checkedOut && (
              <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                Completed
              </span>
            )}
          </div>

          {/* Exit */}
          <div className="rounded-2xl border border-[#E7E8F0] bg-white p-5 text-center shadow-sm">
            <FiLogOut className="mx-auto mb-2 text-2xl text-[#302568]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Check Out</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {exitTime ? formatHHMM(exitTime) : "--:--"}
            </p>
            {checkedIn && !checkedOut && (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={!exitOpen || saving}
                className={[
                  "mt-3 w-full rounded-xl py-2 text-sm font-semibold transition",
                  exitOpen
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "cursor-not-allowed bg-slate-100 text-slate-400",
                ].join(" ")}
              >
                {exitOpen
                  ? "Mark Exit"
                  : `Available at 6:30 PM`}
              </button>
            )}
            {!checkedIn && (
              <p className="mt-3 text-xs text-slate-400">Check in first</p>
            )}
            {checkedOut && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                <FiCheckCircle /> Checked Out
              </span>
            )}
          </div>
        </div>

        {/* ── Warning banners ── */}
        {!entryOpen && !checkedIn && (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <FiAlertCircle className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Entry not open yet</p>
              <p className="text-xs text-red-500">
                Office entry opens at <strong>10:15 AM</strong>. You have{" "}
                {minutesUntilEntry(now)} minute(s) remaining.
              </p>
            </div>
          </div>
        )}

        {checkedIn && !checkedOut && !exitOpen && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <FiAlertCircle className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Exit locked until 6:30 PM</p>
              <p className="text-xs text-amber-600">
                You can check out after <strong>6:30 PM</strong>.{" "}
                {minutesUntilExit(now)} minute(s) remaining.
              </p>
            </div>
          </div>
        )}

        {checkedOut && (
          <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
            <FiCheckCircle className="mt-0.5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-700">
                Great work today, {user?.name?.split(" ")[0] || "Employee"}! 🎉
              </p>
              <p className="text-xs text-green-600">
                You worked for <strong>{elapsed}</strong> today. See you tomorrow!
              </p>
            </div>
          </div>
        )}

        {/* ── Past attendance table ── */}
        <div className="rounded-2xl border border-[#E7E8F0] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#E7E8F0] px-5 py-4">
            <FiCalendar className="text-[#302568]" />
            <p className="font-semibold text-slate-900">This Week's Attendance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F5] bg-[#FAFAFD] text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Entry</th>
                  <th className="px-5 py-3">Exit</th>
                  <th className="px-5 py-3">Hours</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F5]">
                {records.map((r) => (
                  <tr key={r.date} className="hover:bg-[#FAFAFE]">
                    <td className="px-5 py-3 font-medium text-slate-700">{r.entry ? r.date : formatDate(r.date)}</td>
                    <td className="px-5 py-3 text-slate-500">{r.entry || formatTime(r.checkIn)}</td>
                    <td className="px-5 py-3 text-slate-500">{r.exit || formatTime(r.checkOut)}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{r.hours || "--"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-400">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
