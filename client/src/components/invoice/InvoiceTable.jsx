import { useNavigate } from "react-router-dom";

function formatMoney(currency, value) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${currency || ""} ${Number(value || 0).toFixed(2)}`;
  }
}

function Badge({ status }) {
  const s = String(status || "UNPAID").toUpperCase();
  const cls =
    s === "PAID"
      ? "bg-primary/10 text-primary border border-primary/30"
      : s === "PARTIALLY PAID"
        ? "bg-secondary/10 text-secondary border border-secondary/30"
        : "bg-accent/10 text-accent border border-accent/30";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      {s}
    </span>
  );
}

export default function InvoiceTable({ invoices, onDelete, compact = false }) {
  const navigate = useNavigate();
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="overflow-x-auto">
        <table className={`min-w-full ${compact ? "text-xs" : "text-sm"}`}>
          <thead className="bg-gradient-to-r from-primary/5 to-secondary/5 text-left text-xs font-bold uppercase tracking-widest text-primary">
            <tr>
              <th className={`${compact ? "px-4 py-3" : "px-6 py-4"}`}>Invoice No.</th>
              <th className={`${compact ? "px-4 py-3" : "px-6 py-4"}`}>Date</th>
              <th className={`${compact ? "px-4 py-3" : "px-6 py-4"}`}>Client</th>
              <th className={`${compact ? "px-4 py-3" : "px-6 py-4"} text-right`}>Total</th>
              <th className={`${compact ? "px-4 py-3" : "px-6 py-4"}`}>Payment Mode</th>
              <th className={`${compact ? "px-4 py-3" : "px-6 py-4"}`}>Status</th>
              <th className={`${compact ? "px-4 py-3" : "px-6 py-4"} text-right`}>Due Amount</th>
              {!compact ? <th className="px-6 py-4 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices?.length ? (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="group cursor-pointer transition duration-200 hover:bg-slate-50"
                  onClick={() => navigate(`/invoice/${inv.id}`)}
                >
                  <td className={`${compact ? "px-4 py-3" : "px-6 py-4"} font-semibold text-slate-900 group-hover:text-secondary`}>
                    {inv.invoiceNo}
                  </td>
                  <td className={`${compact ? "px-4 py-3" : "px-6 py-4"} text-slate-600`}>
                    {new Date(inv.date).toLocaleDateString()}
                  </td>
                  <td className={`${compact ? "px-4 py-3" : "px-6 py-4"} text-slate-700 font-medium`}>
                    {inv.billTo?.name || "-"}
                  </td>
                  <td className={`${compact ? "px-4 py-3" : "px-6 py-4"} text-right font-semibold text-slate-900`}>
                    {formatMoney(inv.currency, inv.grandTotal)}
                  </td>
                  <td className={`${compact ? "px-4 py-3" : "px-6 py-4"} text-slate-600 text-sm`}>
                    {inv.paymentMode || "—"}
                  </td>
                  <td className={`${compact ? "px-4 py-3" : "px-6 py-4"}`}>
                    <Badge status={inv.paymentStatus} />
                  </td>
                  <td className={`${compact ? "px-4 py-3" : "px-6 py-4"} text-right font-semibold text-slate-900`}>
                    {formatMoney(inv.currency, inv.dueAmount)}
                  </td>
                  {!compact ? (
                    <td className="px-6 py-4 text-right">
                      <div
                        className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-600 hover:bg-primary/10 hover:text-primary transition duration-200"
                          onClick={() => navigate(`/invoice/${inv.id}`)}
                          title="Edit Invoice"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 transition duration-200"
                          onClick={() => onDelete?.(inv.id)}
                          title="Delete Invoice"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-12 text-center text-slate-500" colSpan={compact ? 7 : 8}>
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">No invoices yet</span>
                    <span className="text-xs">Start by creating your first invoice</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
