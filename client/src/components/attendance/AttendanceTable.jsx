import { useState } from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Table from "../ui/Table";

const columns = [
  "Employee",
  "Date",
  "Check-in",
  "Check-out",
  "Hours",
  "Status",
  "Note",
  "Actions",
];

const statusVariant = {
  Present: "success",
  Late: "warning",
  Absent: "danger",
  "Half Day": "warning",
  "On Leave": "primary",
  WFH: "neutral",
};

const statusOptions = ["Present", "Absent", "Late", "Half Day", "On Leave", "WFH"];

function EditModal({ record, onSave, onClose }) {
  const [form, setForm] = useState({
    checkIn: record.checkIn || "",
    checkOut: record.checkOut || "",
    hours: record.hours || "",
    status: record.status || "Present",
    lateNote: record.lateNote || "",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Edit Attendance</h2>
        <p className="mb-5 text-sm text-slate-500">{record.employeeName} &mdash; {record.date}</p>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Check-in</span>
            <input
              type="time"
              name="checkIn"
              value={form.checkIn}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#E0E3EC] px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Check-out</span>
            <input
              type="time"
              name="checkOut"
              value={form.checkOut}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#E0E3EC] px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Hours</span>
            <input
              type="text"
              name="hours"
              value={form.hours}
              onChange={handleChange}
              placeholder="e.g. 8h 30m"
              className="w-full rounded-xl border border-[#E0E3EC] px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Status</span>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#E0E3EC] px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Late login note</span>
            <textarea
              name="lateNote"
              value={form.lateNote}
              onChange={handleChange}
              rows={3}
              maxLength={300}
              placeholder="Reason for late check-in"
              className="w-full resize-none rounded-xl border border-[#E0E3EC] px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E0E3EC] px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
          >
            Cancel
          </button>
          <Button onClick={() => onSave({ ...record, ...form })}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function AttendanceTable({ records = [], onUpdate, onDelete }) {
  const [editRecord, setEditRecord] = useState(null);

  const handleSave = (updated) => {
    onUpdate?.(updated);
    setEditRecord(null);
  };

  return (
    <>
      <Table
        columns={columns}
        data={records}
        renderRow={(item) => (
          <tr key={item._id || `${item.employeeName}-${item.date}`}>
            <td className="px-4 py-4">
              <p className="font-semibold text-slate-950">{item.employeeName}</p>
              <p className="text-xs text-slate-500">{item.department}</p>
            </td>
            <td className="px-4 py-4 text-sm text-slate-600">
              {item.date || "-"}
            </td>
            <td className="px-4 py-4">{item.checkIn || "-"}</td>
            <td className="px-4 py-4">{item.checkOut || "-"}</td>
            <td className="px-4 py-4">{item.hours || "-"}</td>
            <td className="px-4 py-4">
              <Badge variant={statusVariant[item.status] || "neutral"}>
                {item.status || "Unknown"}
              </Badge>
            </td>
            <td className="px-4 py-4">
              {item.lateNote ? (
                <p className="max-w-xs rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium leading-relaxed text-amber-700">
                  {item.lateNote}
                </p>
              ) : (
                <span className="text-sm text-slate-400">-</span>
              )}
            </td>
            <td className="px-4 py-4">
              {item.generatedAbsent ? (
                <span className="text-xs font-semibold text-slate-400">Auto</span>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRecord(item)}
                    className="rounded-lg bg-[#F1EDFF] px-3 py-2 text-xs font-semibold text-[#5B3FD6] transition hover:bg-[#E4DCFF]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(item)}
                    className="rounded-lg bg-[#FEF3F2] px-3 py-2 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                  >
                    Delete
                  </button>
                </div>
              )}
            </td>
          </tr>
        )}
      />

      {editRecord && (
        <EditModal
          record={editRecord}
          onSave={handleSave}
          onClose={() => setEditRecord(null)}
        />
      )}
    </>
  );
}

export default AttendanceTable;
