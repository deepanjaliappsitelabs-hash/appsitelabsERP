import { useState } from "react";
import { FiMail, FiPhone, FiMapPin, FiCalendar, FiX, FiUser } from "react-icons/fi";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Table from "../ui/Table";

const columns = ["Name", "Email", "Department", "Designation", "Salary", "Action"];

// ── Full Details Modal ────────────────────────────────────────────────────────
function EmployeeDetailModal({ employee, onClose }) {
  const initials = employee.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const fields = [
    { label: "Employee ID",       value: employee.employeeId },
    { label: "Department",        value: employee.department },
    { label: "Designation",       value: employee.designation },
    { label: "Role",              value: employee.role },
    { label: "Joining Date",      value: employee.joiningDate?.slice(0, 10) },
    { label: "Salary",            value: employee.salary ? `INR ${Number(employee.salary).toLocaleString("en-IN")}` : "-" },
    { label: "Date of Birth",     value: employee.dob },
    { label: "Gender",            value: employee.gender },
    { label: "Blood Group",       value: employee.bloodGroup },
    { label: "Emergency Contact", value: employee.emergencyContact },
    { label: "Bank Name",         value: employee.bankName },
    { label: "Account Number",    value: employee.accountNumber },
    { label: "IFSC",              value: employee.ifsc },
    { label: "PAN Number",        value: employee.panNumber },
  ].filter((f) => f.value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E7E8F0] px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Employee Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F1EDFF] hover:text-[#5B3FD6]"
          >
            <FiX />
          </button>
        </div>

        {/* Profile top */}
        <div className="flex items-center gap-5 bg-[#F8F9FC] px-6 py-5">
          {/* Avatar / Photo */}
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md">
            {employee.photo ? (
              <img
                src={employee.photo}
                alt={employee.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F1EDFF] text-xl font-bold text-[#5B3FD6]">
                {initials || <FiUser />}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-950">{employee.name}</h3>
            <p className="text-sm text-slate-500">
              {employee.designation || "—"} · {employee.department || "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
              {employee.email && (
                <span className="flex items-center gap-1">
                  <FiMail className="text-[#5B3FD6]" /> {employee.email}
                </span>
              )}
              {employee.phone && (
                <span className="flex items-center gap-1">
                  <FiPhone className="text-[#5B3FD6]" /> {employee.phone}
                </span>
              )}
              {employee.address && (
                <span className="flex items-center gap-1">
                  <FiMapPin className="text-[#5B3FD6]" /> {employee.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="px-6 py-5">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            Details
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-[#E7E8F0] bg-[#FAFAFA] px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Documents */}
          {employee.documents && Object.keys(employee.documents).length > 0 && (
            <>
              <h4 className="mb-4 mt-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                Documents
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(employee.documents).map(([key, val]) =>
                  val ? (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-xl border border-[#E7E8F0] bg-[#FAFAFA] px-4 py-3"
                    >
                      <FiCalendar className="text-[#5B3FD6]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {key}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">{val}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#E7E8F0] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E0E3EC] px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────
function EmployeeTable({ employees, onAdd, handleEdit, deleteEmployee }) {
  const [viewEmployee, setViewEmployee] = useState(null);

  if (employees.length === 0) {
    return (
      <EmptyState
        title="No employees found"
        description="Add a new employee or adjust your search filters."
        action={<Button onClick={onAdd}>Add Employee</Button>}
      />
    );
  }

  return (
    <>
      <Table
        columns={columns}
        data={employees}
        renderRow={(employee) => (
          <tr key={employee._id} className="hover:bg-[#FAFAFE] transition">
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                {/* Mini avatar */}
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#E7E8F0]">
                  {employee.photo ? (
                    <img
                      src={employee.photo}
                      alt={employee.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#F1EDFF] text-xs font-bold text-[#5B3FD6]">
                      {employee.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{employee.name}</p>
                  <p className="text-xs text-slate-500">{employee.phone}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-4 text-sm">{employee.email}</td>
            <td className="px-4 py-4">
              <Badge variant="primary">
                {employee.department || "Not Assigned"}
              </Badge>
            </td>
            <td className="px-4 py-4 text-sm">{employee.designation || "-"}</td>
            <td className="px-4 py-4 text-sm">
              INR {Number(employee.salary || 0).toLocaleString("en-IN")}
            </td>
            <td className="px-4 py-4">
              <div className="flex gap-2">
                {/* View — opens full detail modal */}
                <button
                  type="button"
                  onClick={() => setViewEmployee(employee)}
                  className="rounded-lg bg-[#ECFDF3] px-3 py-2 text-sm font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(employee)}
                  className="rounded-lg bg-[#F1EDFF] px-3 py-2 text-sm font-semibold text-[#5B3FD6] transition hover:bg-[#E4DCFF]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteEmployee(employee._id)}
                  className="rounded-lg bg-[#FEF3F2] px-3 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Full detail modal */}
      {viewEmployee && (
        <EmployeeDetailModal
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
        />
      )}
    </>
  );
}

export default EmployeeTable;