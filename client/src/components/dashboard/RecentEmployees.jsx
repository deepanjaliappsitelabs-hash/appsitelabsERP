function RecentEmployees({
  employees,
}) {
  return (
    <div className="rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(17,24,39,0.05)]">
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Recent Employees
      </h2>

      <div className="space-y-4">
        {employees.slice(0, 5).map((emp) => (
          <div
            key={emp._id}
            className="flex justify-between border-b border-[#ECEEF5] pb-3 last:border-0 last:pb-0"
          >
            <div>
              <h3 className="font-semibold text-slate-950">
                {emp.name}
              </h3>

              <p className="text-sm text-slate-500">
                {emp.designation}
              </p>
            </div>

            <span className="text-sm font-medium text-[#5B3FD6]">
              {emp.department}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentEmployees;
