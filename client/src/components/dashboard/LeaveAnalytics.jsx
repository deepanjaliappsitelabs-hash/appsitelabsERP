import Card from "../ui/Card";

const defaultItems = [
  { label: "Approved", value: 64, color: "bg-emerald-500" },
  { label: "Pending",  value: 24, color: "bg-amber-500"   },
  { label: "Rejected", value: 12, color: "bg-red-500"     },
];

function LeaveAnalytics({ items = defaultItems }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Leave Analytics
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-semibold text-slate-950">{item.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#EEF0F6]">
              <div
                className={`h-2 rounded-full ${item.color}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default LeaveAnalytics;