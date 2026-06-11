const PRIMARY   = "#302568";
const SECONDARY = "#7560A7";
const SOFT      = "#EDE8F5";

function formatMoney(currency, value) {
  const num = Number(value || 0);
  return `${currency || "INR"} ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatusBadge({ status }) {
  const s = String(status || "UNPAID").toUpperCase();
  const styles = {
    PAID:             { background: "#ECFDF3", color: "#027A48", border: "1px solid #A6F4C5" },
    "PARTIALLY PAID": { background: SOFT,      color: PRIMARY,   border: `1px solid #C8BEE8` },
    UNPAID:           { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" },
  };
  const dot = {
    PAID:             "#059669",
    "PARTIALLY PAID": SECONDARY,
    UNPAID:           "#D97706",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
      style={styles[s] || styles.UNPAID}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: dot[s] || dot.UNPAID }}
      />
      {s}
    </span>
  );
}

export default function InvoicePreview({ invoice, onPrint, onReset }) {
  const items = invoice.items || [];

  const summaryRows = [
    { label: "Subtotal",    value: invoice.subtotal,      color: "#1e293b" },
    { label: "Discount",    value: `-${formatMoney(invoice.currency, invoice.discountAmount)}`, raw: true, color: "#B45309" },
    { label: "Tax",         value: invoice.taxAmount,     color: "#1e293b" },
    { label: "Paid",        value: invoice.paidAmount,    color: "#059669" },
    { label: "Due",         value: invoice.dueAmount,     color: Number(invoice.dueAmount) > 0 ? "#B45309" : "#059669" },
    { label: "EMI / Month", value: invoice.emiPerMonth,   color: PRIMARY },
  ];

  return (
    <div className="invoice-print-area print-preview flex flex-col bg-white">
      <div className="flex-1 p-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/ASL_Official-logo.png"
                alt="Appsitelabs"
                className="h-12 w-12 object-contain"
                style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold" style={{ color: PRIMARY }}>Invoice</h1>
              <p className="mt-1 text-xs text-slate-500">
                Invoice No: <span className="font-semibold text-slate-700">{invoice.invoiceNo}</span>
              </p>
              <p className="text-xs text-slate-500">
                Date: <span className="font-semibold text-slate-700">{invoice.date?.slice(0, 10) || ""}</span>
              </p>
            </div>
          </div>
          <StatusBadge status={invoice.paymentStatus} />
        </div>

        {/* ── From / To ── */}
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">From</p>
            <p className="text-sm font-bold" style={{ color: PRIMARY }}>{invoice.billFrom?.company || ""}</p>
            {invoice.billFrom?.email && (
              <p className="mt-0.5 text-xs text-slate-500">Email: {invoice.billFrom.email}</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">To</p>
            <p className="text-sm font-bold text-slate-800">{invoice.billTo?.name || "—"}</p>
            {invoice.billTo?.address && <p className="text-xs text-slate-500">{invoice.billTo.address}</p>}
            {invoice.billTo?.email   && <p className="text-xs text-slate-500">{invoice.billTo.email}</p>}
            {invoice.billTo?.phone   && <p className="text-xs text-slate-500">{invoice.billTo.phone}</p>}
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
                {["Description", "Qty", "Price", "Total"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-white ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length ? (
                items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 text-slate-800">{it.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{Number(it.qty || 0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: PRIMARY }}>
                      {formatMoney(invoice.currency, it.price)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold" style={{ color: PRIMARY }}>
                      {formatMoney(invoice.currency, it.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={4}>
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Summary ── */}
        <div className="mt-5 space-y-2">
          {summaryRows.map(({ label, value, raw, color }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="font-bold tabular-nums" style={{ color }}>
                {raw ? value : formatMoney(invoice.currency, value)}
              </span>
            </div>
          ))}

          {/* Grand Total */}
          <div
            className="mt-3 flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: SOFT }}
          >
            <span className="text-base font-bold" style={{ color: PRIMARY }}>Grand Total</span>
            <span className="text-xl font-extrabold tabular-nums" style={{ color: PRIMARY }}>
              {formatMoney(invoice.currency, invoice.grandTotal)}
            </span>
          </div>
        </div>

        {/* ── Notes ── */}
        {invoice.notes && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: SECONDARY }}>
              Notes
            </p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="no-print flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
        )}
        <button
          type="button"
          onClick={onPrint}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
        >
          Print Invoice
        </button>
      </div>
    </div>
  );
}
