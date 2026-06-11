import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar, FiCheckCircle, FiClock,
  FiFileText, FiTrendingUp, FiUser, FiXCircle,
} from "react-icons/fi";
import getStoredUser from "../../utils/authStorage";
import { getMyLeaves, getLeaveBalance, DEFAULT_LEAVE_BALANCE } from "../../services/leaveService";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function today() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function QuickAction({ icon, label, to, color, navigate }) {
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex flex-col items-center gap-2 rounded-2xl border border-[#E7E8F0] bg-white px-4 py-5 text-center shadow-[0_4px_16px_rgba(48,37,104,0.05)] transition hover:border-[#7560A7] hover:bg-[#F3F0FA]"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${color}`}>
        {icon}
      </span>
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-[#E7E8F0] bg-white p-5 text-left shadow-[0_4px_16px_rgba(48,37,104,0.06)] transition hover:border-[#7560A7] hover:bg-[#F8F7FC] focus:outline-none focus:ring-2 focus:ring-[#302568]/20"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${color}`}>
          {icon}
        </span>
      </div>
    </button>
  );
}

function BalanceBar({ label, used, total }) {
  const remaining = total - used;
  const pct = Math.round((used / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-[#302568]">{remaining} left</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#EEF0F6]">
        <div
          className="h-1.5 rounded-full bg-[#302568] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const navigate   = useNavigate();
  const user       = getStoredUser();
  const employeeId = user?.id ?? user?._id ?? user?.employeeId;

  const [myLeaves, setMyLeaves] = useState([]);
  const [balance,  setBalance]  = useState(DEFAULT_LEAVE_BALANCE);

  const refreshLeaveData = useCallback(() => {
    if (!employeeId) return;
    Promise.all([getMyLeaves(employeeId), getLeaveBalance(employeeId)])
      .then(([leaves, bal]) => {
        setMyLeaves(leaves);
        setBalance(bal ?? DEFAULT_LEAVE_BALANCE);
      })
      .catch(() => {});
  }, [employeeId]);

  useEffect(() => {
    refreshLeaveData();
    const intervalId = window.setInterval(refreshLeaveData, 5000);
    window.addEventListener("focus", refreshLeaveData);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshLeaveData);
    };
  }, [refreshLeaveData]);

  const approved = myLeaves.filter((l) => l.status === "Approved").length;
  const pending  = myLeaves.filter((l) => l.status === "Pending").length;
  const rejected = myLeaves.filter((l) => l.status === "Rejected").length;

  const recentLeaves = [...myLeaves]
    .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn))
    .slice(0, 4);

  const STATUS_COLOR = {
    Approved: "bg-emerald-50 text-emerald-700",
    Pending:  "bg-amber-50 text-amber-700",
    Rejected: "bg-red-50 text-red-600",
  };

  const topBalance = Object.entries(balance).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#302568] to-[#7560A7] px-8 py-6 text-white shadow-[0_14px_40px_rgba(48,37,104,0.25)]">
        <p className="text-sm font-medium opacity-80">{today()}</p>
        <h1 className="mt-1 text-2xl font-bold">
          {greeting()}, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="mt-1 text-sm opacity-70">
          {user?.designation || user?.role || "Employee"} · {user?.department || "AppsiteLabs"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Applied" value={myLeaves.length} icon={<FiFileText />}   color="bg-[#EDE8F5] text-[#302568]" onClick={() => navigate("/employee/leaves", { state: { tab: "history", status: "all" } })} />
        <StatCard label="Approved"      value={approved}        icon={<FiCheckCircle />} color="bg-emerald-50 text-emerald-600" onClick={() => navigate("/employee/leaves", { state: { tab: "history", status: "Approved" } })} />
        <StatCard label="Pending"       value={pending}         icon={<FiClock />}       color="bg-amber-50 text-amber-600" onClick={() => navigate("/employee/leaves", { state: { tab: "history", status: "Pending" } })} />
        <StatCard label="Rejected"      value={rejected}        icon={<FiXCircle />}     color="bg-red-50 text-red-500" onClick={() => navigate("/employee/leaves", { state: { tab: "history", status: "Rejected" } })} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(48,37,104,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Leave Requests</h2>
            <button type="button" onClick={() => navigate("/employee/leaves")}
              className="text-xs font-semibold text-[#302568] hover:underline">
              View all →
            </button>
          </div>
          {recentLeaves.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No leave requests yet.{" "}
              <button type="button" onClick={() => navigate("/employee/leaves")}
                className="font-semibold text-[#302568] underline">Apply now</button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((l) => (
                <div key={l._id} className="flex items-center justify-between rounded-xl border border-[#ECEEF5] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{l.leaveType}</p>
                    <p className="text-xs text-slate-400">
                      {l.leaveCategory === "Short Leave"
                        ? `${l.fromDate} · ${l.fromTime}–${l.toTime}`
                        : l.fromDate === l.toDate ? l.fromDate
                        : `${l.fromDate} → ${l.toDate}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {l.leaveCategory && (
                      <span className="rounded-full bg-[#EDE8F5] px-2 py-0.5 text-xs font-semibold text-[#302568]">
                        {l.leaveCategory}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[l.status] || "bg-slate-100 text-slate-600"}`}>
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(48,37,104,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Leave Balance</h2>
            <button type="button" onClick={() => navigate("/employee/leaves")}
              className="text-xs font-semibold text-[#302568] hover:underline">Full view →</button>
          </div>
          {topBalance.length === 0 ? (
            <p className="text-sm text-slate-400">No balance data.</p>
          ) : (
            <div className="space-y-4">
              {topBalance.map(([type, { total, used }]) => (
                <BalanceBar key={type} label={type} used={used} total={total} />
              ))}
            </div>
          )}
          <div className="mt-5 rounded-xl bg-[#EDE8F5] p-3 text-center">
            <p className="text-xs font-semibold text-[#302568]">
              <FiTrendingUp className="mr-1 inline" />
              {Object.values(balance).reduce((s, b) => s + (b.total - b.used), 0)} total days remaining
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(48,37,104,0.07)]">
        <h2 className="mb-4 text-base font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction navigate={navigate} to="/employee/leaves"     label="Apply Leave"   icon={<FiCalendar />}    color="bg-[#EDE8F5] text-[#302568]" />
          <QuickAction navigate={navigate} to="/employee/attendance" label="My Attendance" icon={<FiCheckCircle />} color="bg-emerald-50 text-emerald-600" />
          <QuickAction navigate={navigate} to="/employee/documents"  label="My Documents"  icon={<FiFileText />}    color="bg-blue-50 text-blue-600" />
          <QuickAction navigate={navigate} to="/employee/profile"    label="My Profile"    icon={<FiUser />}        color="bg-amber-50 text-amber-600" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E7E8F0] bg-white p-5 shadow-[0_4px_16px_rgba(48,37,104,0.05)]">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE8F5] text-lg font-bold text-[#302568]">
            {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "E"}
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div><p className="text-xs text-slate-400">Name</p><p className="font-semibold text-slate-800">{user?.name || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Email</p><p className="font-semibold text-slate-800">{user?.email || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Department</p><p className="font-semibold text-slate-800">{user?.department || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Role</p><p className="font-semibold text-slate-800">{user?.role || "—"}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
