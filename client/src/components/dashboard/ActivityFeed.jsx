import Card from "../ui/Card";

const defaultActivities = [
  {
    title: "New employee profile created",
    time: "Today",
  },
  {
    title: "Leave request submitted",
    time: "Yesterday",
  },
  {
    title: "Payroll processed",
    time: "2 days ago",
  },
];

function ActivityFeed({ activities = defaultActivities }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Activity Feed
      </h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.title}
            className="border-b border-[#ECEEF5] pb-3 last:border-0 last:pb-0"
          >
            <p className="text-sm font-semibold text-slate-950">
              {activity.title}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {activity.time}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default ActivityFeed;
