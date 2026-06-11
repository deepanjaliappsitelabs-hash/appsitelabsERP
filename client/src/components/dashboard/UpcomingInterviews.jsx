import Avatar from "../ui/Avatar";
import Card from "../ui/Card";

const defaultInterviews = [
  {
    name: "Ishaan Kapoor",
    role: "React Developer",
    time: "Today 2 PM",
  },
  {
    name: "Sara Joseph",
    role: "UX Designer",
    time: "Tomorrow 11 AM",
  },
  {
    name: "Dev Malik",
    role: "Node Engineer",
    time: "15 May 3 PM",
  },
];

function UpcomingInterviews({ interviews = defaultInterviews }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Upcoming Interviews
      </h2>
      <div className="space-y-3">
        {interviews.map((interview) => (
          <div
            key={`${interview.name}-${interview.time}`}
            className="flex items-center justify-between gap-3 border-b border-[#ECEEF5] pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={interview.name}
                className="h-9 w-9"
              />
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {interview.name}
                </p>
                <p className="text-xs text-slate-500">
                  {interview.role}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#F1EDFF] px-3 py-1 text-xs font-semibold text-[#5B3FD6]">
              {interview.time}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default UpcomingInterviews;
