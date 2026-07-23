function Table({
  columns = [],
  data = [],
  renderRow,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-[0_14px_40px_rgba(48,37,104,0.07)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F3F0FA] text-xs uppercase tracking-wide text-[#302568]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key || column}
                className="px-4 py-3 font-semibold"
              >
                {column.label || column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#ECEEF5] text-slate-700">
          {data.map((item, index) =>
            renderRow(item, index)
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;