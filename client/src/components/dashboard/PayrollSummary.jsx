import Card from "../ui/Card";
import formatCurrency from "../../utils/formatCurrency";

const defaultItems = [
  { department: "Development", amount: 480000, percent: 80 },
  { department: "Design",      amount: 220000, percent: 45 },
  { department: "HR",          amount: 120000, percent: 25 },
];

function PayrollSummary({ items = defaultItems }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Payroll Summary
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.department}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-slate-600">
                {item.department}
              </span>
              <span className="font-semibold text-slate-950">
                {formatCurrency(item.amount)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#EEF0F6]">
              <div
                className="h-2 rounded-full bg-[#302568]"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default PayrollSummary;