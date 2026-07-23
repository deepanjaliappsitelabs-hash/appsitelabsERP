import { useMemo, useState } from "react";
import { FiX } from "react-icons/fi";
import StatsCard from "../ui/StatsCard";

import {
  FaUsers,
  FaUserCheck,
  FaUserClock,
} from "react-icons/fa";

function EmployeeStats({
  employees,
}) {
  const [selectedStat, setSelectedStat] = useState(null);

  const statGroups = useMemo(() => {
    const activeEmployees = employees.filter(
      (employee) => employee.status !== "Inactive"
    );
    const interns = employees.filter(
      (employee) => employee.designation?.trim().toLowerCase() === "intern"
    );

    return {
      total: {
        title: "Total Employees",
        employees,
      },
      active: {
        title: "Active Employees",
        employees: activeEmployees,
      },
      interns: {
        title: "Interns",
        employees: interns,
      },
    };
  }, [employees]);

  const selectedGroup = selectedStat ? statGroups[selectedStat] : null;

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatsCard
          title="Total Employees"
          value={statGroups.total.employees.length}
          icon={<FaUsers />}
          onClick={() => setSelectedStat("total")}
        />

        <StatsCard
          title="Active Employees"
          value={statGroups.active.employees.length}
          icon={<FaUserCheck />}
          onClick={() => setSelectedStat("active")}
        />

        <StatsCard
          title="Interns"
          value={statGroups.interns.employees.length}
          icon={<FaUserClock />}
          onClick={() => setSelectedStat("interns")}
        />
      </div>

      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {selectedGroup.title}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedGroup.employees.length} employees
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStat(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F1EDFF] hover:text-[#5B3FD6]"
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {selectedGroup.employees.length > 0 ? (
                <div className="divide-y divide-[#E7E8F0]">
                  {selectedGroup.employees.map((employee) => (
                    <div
                      key={employee._id || employee.email}
                      className="flex items-center justify-between gap-4 px-2 py-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {employee.name || "Unnamed Employee"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {employee.designation || "-"} · {employee.department || "-"}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm text-slate-500">
                        {employee.employeeId || employee.phone || ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  No employees found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmployeeStats;
