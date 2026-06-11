import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiCheckCircle, FiClock, FiFileText, FiXCircle } from "react-icons/fi";
import HolidayCalendar from "../../components/leaves/HolidayCalendar";
import LeaveBalance from "../../components/leaves/LeaveBalance";
import LeaveTable from "../../components/leaves/LeaveTable";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import StatsCard from "../../components/ui/StatsCard";
import Tabs from "../../components/ui/Tabs";
import { useNotifications } from "../../hooks/useNotifications";
import { getEmployees } from "../../services/employeeService";
import { deleteLeave, getLeaveBalance, getLeaves, normalizeLeave, updateLeave } from "../../services/leaveService";

const tabs = [
  { id: "requests", label: "All Requests" },
  { id: "holidays", label: "Holiday Calendar" },
  { id: "balance", label: "Leave Balance" },
];

function Leaves() {
  useNotifications();
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");
  const [action, setAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balanceRows, setBalanceRows] = useState([]);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const data = await getLeaves();
        setLeaves(data);
      } catch (err) {
        toast.error("Leaves load nahi hue: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (activeTab !== "balance") return;

    const fetchBalances = async () => {
      try {
        setBalanceLoading(true);
        const employees = await getEmployees();
        const rows = await Promise.all(
          employees.map(async (employee) => {
            const balance = await getLeaveBalance(employee._id);
            const getRemaining = (type) => {
              const item = balance?.[type] || { total: 0, used: 0 };
              return Math.max(Number(item.total || 0) - Number(item.used || 0), 0);
            };

            return {
              employee: employee.name || employee.email || employee.employeeId || "Employee",
              casual: getRemaining("Casual Leave"),
              sick: getRemaining("Sick Leave"),
              earned: getRemaining("Earned Leave"),
            };
          })
        );
        setBalanceRows(rows);
      } catch (err) {
        toast.error("Leave balances load nahi hue: " + (err.response?.data?.message || err.message));
        setBalanceRows([]);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalances();
  }, [activeTab]);

  useEffect(() => {
    const upsertLeave = (event) => {
      const incoming = event.detail?.leave;
      if (!incoming) return;

      const normalized = normalizeLeave(incoming);
      setLeaves((current) => {
        const exists = current.some((leave) => leave._id === normalized._id);
        if (exists) {
          return current.map((leave) =>
            leave._id === normalized._id ? { ...leave, ...normalized } : leave
          );
        }
        return [normalized, ...current];
      });
    };

    const removeLeave = (event) => {
      const deleted = event.detail?.leave;
      const deletedId = deleted?.id ?? deleted?._id;
      if (!deletedId) return;

      setLeaves((current) => current.filter((leave) => String(leave._id) !== String(deletedId)));
    };

    window.addEventListener("leave:created", upsertLeave);
    window.addEventListener("leave:updated", upsertLeave);
    window.addEventListener("leave:deleted", removeLeave);

    return () => {
      window.removeEventListener("leave:created", upsertLeave);
      window.removeEventListener("leave:updated", upsertLeave);
      window.removeEventListener("leave:deleted", removeLeave);
    };
  }, []);

  const countStatus = (status) =>
    leaves.filter((leave) => leave.status === status).length;

  const submitAction = async () => {
    try {
      const updatedLeave = { ...action.leave, status: action.status, remarks };
      const savedLeave = await updateLeave(action.leave._id, updatedLeave);
      setLeaves((current) =>
        current.map((l) => (l._id === action.leave._id ? { ...l, ...savedLeave } : l))
      );
      toast.success(`Leave ${action.status.toLowerCase()}`);
      setAction(null);
      setRemarks("");
    } catch (err) {
      toast.error("Action failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEditLeave = async (updated) => {
    try {
      const savedLeave = await updateLeave(updated._id, updated);
      setLeaves((current) =>
        current.map((l) => (l._id === updated._id ? { ...l, ...updated, ...savedLeave } : l))
      );
      toast.success("Leave updated");
    } catch (err) {
      toast.error("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteLeave = async (leave) => {
    if (!window.confirm(`Delete leave request for ${leave.employeeName || "this employee"}?`)) {
      return;
    }

    try {
      await deleteLeave(leave._id);
      setLeaves((current) => current.filter((item) => item._id !== leave._id));
      toast.success("Leave deleted");
    } catch (err) {
      toast.error("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCardClick = (status) => {
    if (!status) {
      setActiveFilter(null);
      return;
    }
    setActiveFilter((prev) => (prev === status ? null : status));
  };

  const displayedLeaves = activeFilter
    ? leaves.filter((l) => l.status === activeFilter)
    : leaves;

  const statsCards = [
    { title: "Total Requests", status: null, value: leaves.length, icon: <FiFileText /> },
    { title: "Approved", status: "Approved", value: countStatus("Approved"), icon: <FiCheckCircle /> },
    { title: "Pending", status: "Pending", value: countStatus("Pending"), icon: <FiClock /> },
    { title: "Rejected", status: "Rejected", value: countStatus("Rejected"), icon: <FiXCircle /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        subtitle="Approve leave requests, review balances, and maintain the holiday calendar."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map(({ title, status, value, icon }) => (
          <button
            key={title}
            type="button"
            onClick={() => handleCardClick(status)}
            className={[
              "rounded-2xl border text-left transition focus:outline-none",
              "cursor-pointer focus:ring-2 focus:ring-[#5B3FD6]/40",
              activeFilter === status && status
                ? "border-[#5B3FD6] ring-2 ring-[#5B3FD6]/20"
                : "border-transparent",
            ].join(" ")}
          >
            <StatsCard title={title} value={value} icon={icon} />
          </button>
        ))}
      </div>

      {activeFilter && (
        <p className="text-sm text-[#5B3FD6]">
          Showing <strong>{activeFilter}</strong> leaves ({displayedLeaves.length}).{" "}
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className="underline"
          >
            Clear filter
          </button>
        </p>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <p className="text-center text-slate-400 py-10">Loading leaves…</p>
      ) : (
        <>
          {activeTab === "requests" && (
            <LeaveTable
              leaves={displayedLeaves}
              onAction={(leave, status) => setAction({ leave, status })}
              onEdit={handleEditLeave}
              onDelete={handleDeleteLeave}
            />
          )}
          {activeTab === "holidays" && <HolidayCalendar />}
          {activeTab === "balance" && (
            <LeaveBalance balances={balanceRows} loading={balanceLoading} />
          )}
        </>
      )}

      {action && (
        <Modal
          title={`${action.status} Leave`}
          onClose={() => setAction(null)}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAction(null)}
                className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
              >
                Cancel
              </button>
              <Button onClick={submitAction}>Save</Button>
            </div>
          }
        >
          <div className="mb-4 rounded-xl bg-[#F8F9FC] p-4 text-sm text-slate-700">
            <p><span className="font-semibold">Employee:</span> {action.leave.employeeName}</p>
            <p><span className="font-semibold">Leave Type:</span> {action.leave.leaveType}</p>
            <p><span className="font-semibold">Duration:</span> {action.leave.fromDate} — {action.leave.toDate}</p>
            <p><span className="font-semibold">Reason:</span> {action.leave.reason || "-"}</p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Remarks</span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="3"
              className="w-full rounded-xl border border-[#E0E3EC] p-3 text-sm outline-none focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
              placeholder="Add approval or rejection remarks"
            />
          </label>
        </Modal>
      )}
    </div>
  );
}

export default Leaves;
