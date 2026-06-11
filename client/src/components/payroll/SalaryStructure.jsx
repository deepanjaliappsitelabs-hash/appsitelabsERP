import Card from "../ui/Card";
import formatCurrency from "../../utils/formatCurrency";

function SalaryStructure({
  earnings = {},
  deductions = {},
}) {
  const earningRows = Object.entries(earnings);
  const deductionRows = Object.entries(deductions);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950">
          Earnings
        </h2>
        <div className="space-y-3">
          {earningRows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between text-sm"
            >
              <span className="text-slate-500">
                {label}
              </span>
              <span className="font-semibold text-slate-950">
                {formatCurrency(value)}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950">
          Deductions
        </h2>
        <div className="space-y-3">
          {deductionRows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between text-sm"
            >
              <span className="text-slate-500">
                {label}
              </span>
              <span className="font-semibold text-slate-950">
                {formatCurrency(value)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default SalaryStructure;
