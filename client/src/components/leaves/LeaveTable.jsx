import { useState } from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Table from "../ui/Table";

const columns = [
  "Employee", "Leave Type", "Category", "Duration", "Days", "Reason", "Applied On", "Status", "Actions",
];

const statusVariant = { Approved: "success", Pending: "warning", Rejected: "danger" };

const decisionActions = [
  {
    status: "Approved",
    label: "Approve",
    activeLabel: "Approved",
    className: "bg-[#ECFDF3] text-[#027A48] hover:bg-[#D1FADF]",
    activeClassName: "bg-[#D1FADF] text-[#027A48]",
  },
  {
    status: "Rejected",
    label: "Reject",
    activeLabel: "Rejected",
    className: "bg-[#FEF3F2] text-[#B42318] hover:bg-[#FEE4E2]",
    activeClassName: "bg-[#FEE4E2] text-[#B42318]",
  },
];

const leaveTypes = [
  "Casual Leave", "Sick Leave", "Earned Leave",
  "Maternity Leave", "Paternity Leave", "Unpaid Leave",
];

const fieldCls = "w-full rounded-xl border border-[#E0E3EC] px-3 py-2.5 text-sm outline-none focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10";

function EditLeaveModal({ leave, onSave, onClose }) {
  const [form, setForm] = useState({
    leaveType: leave.leaveType || "",
    fromDate:  leave.fromDate  || "",
    toDate:    leave.toDate    || "",
    reason:    leave.reason    || "",
    status:    leave.status    || "Pending",
  });

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Edit Leave Request</h2>
        <p className="mb-5 text-sm text-slate-500">{leave.employeeName}</p>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Leave Type</span>
            <select name="leaveType" value={form.leaveType} onChange={set} className={fieldCls}>
              {leaveTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">From Date</span>
              <input type="date" name="fromDate" value={form.fromDate} onChange={set} className={fieldCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">To Date</span>
              <input type="date" name="toDate" value={form.toDate} onChange={set} className={fieldCls} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Reason</span>
            <textarea name="reason" value={form.reason} onChange={set} rows="3" className={fieldCls} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Status</span>
            <select name="status" value={form.status} onChange={set} className={fieldCls}>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-[#E0E3EC] px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]">
            Cancel
          </button>
          <Button onClick={() => onSave({ ...leave, ...form })}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

function LeaveTable({ leaves = [], onAction, onEdit, onDelete }) {
  const [editLeave, setEditLeave] = useState(null);

  return (
    <>
      <Table
        columns={columns}
        data={leaves}
        renderRow={(leave) => {
          const employeeLabel = leave.employeeName || (leave.employeeId ? `Employee #${leave.employeeId}` : "Unlinked employee");
          const initials = employeeLabel
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
          <tr key={leave._id} className="hover:bg-[#FAFAFE] transition">
            {/* Employee */}
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE8F5] text-xs font-bold text-[#302568]">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{employeeLabel}</p>
                  {leave.department && <p className="text-xs text-slate-500">{leave.department}</p>}
                </div>
              </div>
            </td>

            {/* Leave Type */}
            <td className="px-4 py-4 text-sm text-slate-700">{leave.leaveType}</td>

            {/* Category badge */}
            <td className="px-4 py-4">
              {leave.leaveCategory ? (
                <span className="rounded-full bg-[#EDE8F5] px-2.5 py-1 text-xs font-semibold text-[#302568]">
                  {leave.leaveCategory}
                </span>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>

            {/* Duration — shows time for short leave, dates for others */}
            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
              {leave.leaveCategory === "Short Leave" && leave.fromTime
                ? <span className="font-medium">{leave.fromDate} · {leave.fromTime} – {leave.toTime}</span>
                : leave.fromDate === leave.toDate
                ? leave.fromDate
                : <>{leave.fromDate} &mdash; {leave.toDate}</>
              }
            </td>

            {/* Days */}
            <td className="px-4 py-4 text-center text-sm">
              {leave.leaveCategory === "Short Leave"
                ? <span className="text-xs text-slate-400">Short</span>
                : leave.days || 1}
            </td>

            {/* Reason */}
            <td className="max-w-[140px] truncate px-4 py-4 text-sm text-slate-500">
              {leave.reason || "—"}
            </td>

            {/* Applied on */}
            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-400">
              {leave.appliedOn || leave.createdAt?.slice(0, 10) || "—"}
            </td>

            {/* Status */}
            <td className="px-4 py-4">
              <Badge variant={statusVariant[leave.status] || "neutral"}>{leave.status}</Badge>
            </td>

            {/* Actions */}
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {decisionActions.map((action) => {
                  const isCurrentStatus = leave.status === action.status;

                  return (
                    <button
                      key={action.status}
                      type="button"
                      onClick={() => !isCurrentStatus && onAction?.(leave, action.status)}
                      disabled={isCurrentStatus}
                      className={[
                        "rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed",
                        isCurrentStatus
                          ? `${action.activeClassName} opacity-70`
                          : action.className,
                      ].join(" ")}
                    >
                      {isCurrentStatus ? action.activeLabel : action.label}
                    </button>
                  );
                })}
                <button type="button" onClick={() => setEditLeave(leave)}
                  className="rounded-lg bg-[#EDE8F5] px-3 py-2 text-xs font-semibold text-[#302568] transition hover:bg-[#E0D9F0]">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete?.(leave)}
                  className="rounded-lg bg-[#FEF3F2] px-3 py-2 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        );}}
      />

      {editLeave && (
        <EditLeaveModal
          leave={editLeave}
          onSave={(updated) => { onEdit?.(updated); setEditLeave(null); }}
          onClose={() => setEditLeave(null)}
        />
      )}
    </>
  );
}

export default LeaveTable;
