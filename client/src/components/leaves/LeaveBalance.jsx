import Card from "../ui/Card";

function LeaveBalance({ balances = [], loading = false }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Leave Balance
      </h2>
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">
          Loading leave balances...
        </p>
      ) : balances.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No leave balance data found.
        </p>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-3">
                Employee
              </th>
              <th className="py-3">
                Casual
              </th>
              <th className="py-3">
                Sick
              </th>
              <th className="py-3">
                Earned
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECEEF5]">
            {balances.map((balance) => (
              <tr key={balance.employee}>
                <td className="py-3 font-semibold text-slate-950">
                  {balance.employee}
                </td>
                <td className="py-3">
                  {balance.casual}
                </td>
                <td className="py-3">
                  {balance.sick}
                </td>
                <td className="py-3">
                  {balance.earned}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </Card>
  );
}

export default LeaveBalance;
