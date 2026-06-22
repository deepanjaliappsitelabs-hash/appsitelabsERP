import Badge from "../ui/Badge";
import Card from "../ui/Card";

const statusVariant = {
  Present: "success",
  Late: "warning",
  Absent: "danger",
  "Half Day": "warning",
  "On Leave": "primary",
  WFH: "neutral",
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
      acc[String(record.date).slice(0, 10)] = record;
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
          const record = recordsByDate[getDateKey(year, monthIndex, day)];
          const status = record?.status;

          return (
            <div
              key={day}
              className="min-h-24 rounded-xl border border-[#E7E8F0] bg-white p-2"
            >
              <p className="text-sm font-semibold text-slate-950">
                {day}
              </p>
              {status && (
                <div className="mt-3">
                  <Badge variant={statusVariant[status] || "neutral"}>
                    {status}
                  </Badge>
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
