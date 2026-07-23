export default function ItemRow({ item, onChange, onRemove }) {
  const qty = Number(item.qty || 0);
  const price = Number(item.price || 0);
  const amount = qty * price;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition duration-150">
      <td className="px-4 py-3">
        <input
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/40 focus:shadow-lg focus:shadow-primary/20"
          value={item.description}
          placeholder="Item description"
          onChange={(e) => onChange({ ...item, description: e.target.value })}
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="w-24 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-right text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/40 focus:shadow-lg focus:shadow-primary/20"
          value={item.qty}
          type="number"
          min="0"
          onChange={(e) => onChange({ ...item, qty: Number(e.target.value || 0) })}
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="w-32 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-right text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/40 focus:shadow-lg focus:shadow-primary/20"
          value={item.price}
          type="number"
          min="0"
          onChange={(e) => onChange({ ...item, price: Number(e.target.value || 0) })}
        />
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
        {amount.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-primary/10 hover:text-primary transition duration-200"
          onClick={onRemove}
          title="Remove item"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

