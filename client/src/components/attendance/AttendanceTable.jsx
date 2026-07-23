import { Fragment, useState } from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Table from "../ui/Table";

const columns = [
  "Employee",
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
  Holiday: "primary",
};

const statusOptions = ["Present", "Absent", "Late", "Half Day", "On Leave", "WFH", "Holiday"];

const formatDateHeading = (date) => {
  if (!date) return "Date not set";

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const lateByLabel = (checkIn) => {
  if (!checkIn) return "";

  const lateBy = timeToMinutes(checkIn) - timeToMinutes("10:15");
  if (lateBy <= 0) return "";

  const hours = Math.floor(lateBy / 60);
  const minutes = lateBy % 60;
  if (hours && minutes) return `Late by ${hours}h ${minutes}m`;
  if (hours) return `Late by ${hours}h`;
  return `Late by ${minutes}m`;
};

const sortByDateAndName = (a, b) => {
  const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
  if (dateCompare !== 0) return dateCompare;
  return String(a.employeeName || "").localeCompare(String(b.employeeName || ""));
};

const groupRecordsByDate = (records) =>
  [...records].sort(sortByDateAndName).reduce((groups, record) => {
    const date = record.date || "No Date";
    const last = groups[groups.length - 1];

    if (last?.date === date) {
      last.records.push(record);
    } else {
      groups.push({ date, records: [record] });
    }

    return groups;
  }, []);

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
  const groupedRecords = groupRecordsByDate(records);

  const handleSave = (updated) => {
    onUpdate?.(updated);
    setEditRecord(null);
  };

  return (
    <>
      <Table
        columns={columns}
        data={groupedRecords}
        renderRow={(group) => (
          <Fragment key={group.date}>
            <tr key={`date-${group.date}`} className="bg-slate-50/80">
              <td colSpan={columns.length} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{formatDateHeading(group.date)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
                      {group.records.length} employees
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100">
                      {group.records.filter((record) => record.status === "Present").length} Present
                    </span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-amber-100">
                      {group.records.filter((record) => record.status === "Late").length} Late
                    </span>
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700 ring-1 ring-red-100">
                      {group.records.filter((record) => record.status === "Absent").length} Absent
                    </span>
                    <span className="rounded-full bg-[#F5F3FC] px-2.5 py-1 text-[#302568] ring-1 ring-[#EDE8F5]">
                      {group.records.filter((record) => record.status === "Holiday").length} Holiday
                    </span>
                  </div>
                </div>
              </td>
            </tr>

            {group.records.map((item) => {
              const lateBy = item.status === "Late" ? lateByLabel(item.checkIn) : "";

              return (
                <tr key={item._id || `${item.employeeName}-${item.date}`}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{item.employeeName}</p>
                    <p className="text-xs text-slate-500">{item.department}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{item.checkIn || "-"}</p>
                    {lateBy && <p className="mt-1 text-xs font-semibold text-amber-600">{lateBy}</p>}
                  </td>
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
                    {item.generatedAbsent || item.generatedHoliday ? (
                      <span className="text-xs font-semibold text-slate-400">
                        {item.generatedHoliday ? "Auto Holiday" : "Auto Absent"}
                      </span>
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
              );
            })}
          </Fragment>
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
