import Badge from "../ui/Badge";
import Card from "../ui/Card";

const defaultHolidays = [
  {
    name: "Independence Day",
    date: "2026-08-15",
    type: "National",
  },
  {
    name: "Diwali",
    date: "2026-11-08",
    type: "Festival",
  },
  {
    name: "Christmas",
    date: "2026-12-25",
    type: "Festival",
  },
];

function HolidayCalendar({ holidays = defaultHolidays }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Holiday Calendar
      </h2>
      <div className="space-y-3">
        {holidays.map((holiday) => (
          <div
            key={holiday.name}
            className="flex items-center justify-between rounded-xl border border-[#E7E8F0] px-4 py-3"
          >
            <div>
              <p className="font-semibold text-slate-950">
                {holiday.name}
              </p>
              <p className="text-sm text-slate-500">
                {holiday.date}
              </p>
            </div>
            <Badge variant="primary">
              {holiday.type}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default HolidayCalendar;
