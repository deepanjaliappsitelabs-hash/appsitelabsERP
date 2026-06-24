import Card from "../ui/Card";

const statusStyle = {
  Present: {
    label: "P",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  Late: {
    label: "L",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  Absent: {
    label: "A",
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
  "Half Day": {
    label: "H",
    className: "bg-orange-50 text-orange-700 ring-orange-600/20",
  },
  "On Leave": {
    label: "OL",
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
  },
  WFH: {
    label: "W",
    className: "bg-sky-50 text-sky-700 ring-sky-600/20",
  },
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getMonthInfo = (monthLabel) => {
  const [monthName, yearValue] = String(monthLabel).split(" ");
  const monthIndex = monthNames.findIndex(
    (name) => name.toLowerCase() === monthName?.toLowerCase()
  );
  const year = Number(yearValue);
  const today = new Date();

  if (monthIndex === -1 || !year) {
    return {
      year: today.getFullYear(),
      monthIndex: today.getMonth(),
    };
  }

  return { year, monthIndex };
};

const getDateKey = (year, monthIndex, day) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function AttendanceCalendar({
  records = [],
  monthLabel = "May 2026",
}) {
  const { year, monthIndex } = getMonthInfo(monthLabel);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const leadingBlankDays = Array.from(
    { length: new Date(year, monthIndex, 1).getDay() },
    (_, index) => `blank-${index}`
  );
  const recordsByDate = records.reduce((acc, record) => {
    if (record.date) {
      const dateKey = String(record.date).slice(0, 10);
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(record);
    }
    return acc;
  }, {});

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">
          Monthly Attendance
        </h2>
        <span className="text-sm font-semibold text-[#5B3FD6]">
          {monthLabel}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>
            {day}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {leadingBlankDays.map((key) => (
          <div key={key} />
        ))}
        {days.map((day) => {
          const dayRecords = recordsByDate[getDateKey(year, monthIndex, day)] || [];

          return (
            <div
              key={day}
              className="min-h-24 rounded-xl border border-[#E7E8F0] bg-white p-2"
            >
              <p className="text-sm font-semibold text-slate-950">
                {day}
              </p>
              {dayRecords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dayRecords.map((record, index) => {
                    const style = statusStyle[record.status] || {
                      label: "?",
                      className: "bg-slate-100 text-slate-700 ring-slate-600/20",
                    };

                    return (
                      <span
                        key={record._id || `${record.employee_id}-${record.date}-${index}`}
                        title={`${record.employeeName || "Employee"} - ${record.status}`}
                        className={[
                          "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ring-1 ring-inset",
                          style.className,
                        ].join(" ")}
                      >
                        {style.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default AttendanceCalendar;
