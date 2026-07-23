import Badge from "../ui/Badge";
import Card from "../ui/Card";

const defaultHolidays = [
  {
    name: "Independence Day",
    date: "15 Aug 2026",
  },
  {
    name: "Diwali",
    date: "08 Nov 2026",
  },
  {
    name: "Christmas",
    date: "25 Dec 2026",
  },
];

function UpcomingHolidays({ holidays = defaultHolidays }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Upcoming Holidays
      </h2>
      <div className="space-y-3">
        {holidays.map((holiday) => (
          <div
            key={holiday.name}
            className="flex items-center justify-between border-b border-[#ECEEF5] pb-3 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {holiday.name}
              </p>
              <p className="text-xs text-slate-500">
                {holiday.date}
              </p>
            </div>
            <Badge variant="primary">
              Holiday
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default UpcomingHolidays;
