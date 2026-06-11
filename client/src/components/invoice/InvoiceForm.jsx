import ItemRow from "./ItemRow.jsx";

const PRIMARY   = "#302568";
const SECONDARY = "#7560A7";
const SOFT      = "#EDE8F5";

export default function InvoiceForm({ invoice, setInvoice, onSave, saving = false }) {
  const items = invoice.items || [];

  function updateBillFromText(value) {
    const lines = value.split("\n");
    const company = lines[0] || "";
    const email = lines.slice(1).join(" ").trim();
    setInvoice((prev) => ({ ...prev, billFrom: { company, email } }));
  }

  function updateBillToField(field, value) {
    setInvoice((prev) => ({
      ...prev,
      billTo: { name: "", address: "", email: "", phone: "", ...(prev.billTo || {}), [field]: value },
    }));
  }

  function setItem(idx, next) {
    setInvoice((prev) => {
      const itemsNext = [...(prev.items || [])];
      itemsNext[idx] = next;
      return { ...prev, items: itemsNext };
    });
  }

  function removeItem(idx) {
    setInvoice((prev) => {
      const itemsNext = [...(prev.items || [])];
      itemsNext.splice(idx, 1);
      return { ...prev, items: itemsNext };
    });
  }

  function addItem() {
    setInvoice((prev) => ({
      ...prev,
      items: [...(prev.items || []), { description: "", qty: 1, price: 0, amount: 0 }],
    }));
  }

  function quickPayment(mode) {
    if (mode === "Full Payment") {
      setInvoice((p) => ({
        ...p, paymentMode: "Full Payment", paymentStatus: "PAID",
        paidAmount: Number(invoice.grandTotal || 0), emiMonths: 0,
      }));
    } else if (mode === "Partial/Advance") {
      setInvoice((p) => ({
        ...p, paymentMode: "Partial/Advance", paymentStatus: "PARTIALLY PAID",
        paidAmount: Number(invoice.grandTotal || 0) * 0.5, emiMonths: 0,
      }));
    } else {
      setInvoice((p) => ({
        ...p, paymentMode: "EMI", paymentStatus: "PARTIALLY PAID", emiMonths: 3,
      }));
    }
  }

  const showEmi = invoice.paymentMode === "EMI";

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-[#302568] focus:ring-2 focus:ring-[#302568]/20";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2";

  return (
    <div className="no-print rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">

      {/* ── Header ── */}
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <img src="/ASL_Official-logo.png" alt="Appsitelabs" className="h-10 w-10 object-contain" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: SECONDARY }}>
            Invoice Management
          </p>
          <h1 className="text-2xl font-extrabold" style={{ color: PRIMARY }}>
            Create Invoice
          </h1>
        </div>
      </div>

      {/* ── Invoice No & Date ── */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Invoice No.</label>
          <input
            type="text"
            value={invoice.invoiceNo}
            onChange={(e) => setInvoice((p) => ({ ...p, invoiceNo: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input
            type="date"
            className={inputCls}
            value={(invoice.date || "").slice(0, 10)}
            onChange={(e) => setInvoice((p) => ({ ...p, date: `${e.target.value}T00:00:00.000Z` }))}
          />
        </div>
      </div>

      {/* ── Billing Info ── */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY }}>
          Billing Information
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <div className={labelCls}>Bill From</div>
            <textarea
              className={`${inputCls} min-h-20 resize-none`}
              placeholder={"Company name\ncompany@email.com"}
              value={[invoice.billFrom?.company || "", invoice.billFrom?.email || ""].join("\n").trim()}
              onChange={(e) => updateBillFromText(e.target.value)}
            />
          </label>
          <div>
            <div className={labelCls}>Bill To</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { field: "name",    placeholder: "Client name", type: "text" },
                { field: "email",   placeholder: "Email",       type: "email" },
                { field: "phone",   placeholder: "Phone",       type: "text" },
                { field: "address", placeholder: "Address",     type: "text" },
              ].map(({ field, placeholder, type }) => (
                <input
                  key={field}
                  type={type}
                  className={inputCls}
                  placeholder={placeholder}
                  value={invoice.billTo?.[field] || ""}
                  onChange={(e) => updateBillToField(field, e.target.value)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Line Items ── */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY }}>
            Line Items
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
          >
            + Add Item
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
                {["Description", "Qty", "Price", "Amount", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-white ${
                      i > 0 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <ItemRow
                  key={idx}
                  item={it}
                  onChange={(next) => setItem(idx, next)}
                  onRemove={() => removeItem(idx)}
                />
              ))}
              {!items.length && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={5}>
                    No items added. Click "+ Add Item" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pricing & Tax ── */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY }}>
          Pricing & Tax
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={labelCls}>Discount (%)</label>
            <input
              className={inputCls} type="number" min="0"
              value={invoice.discount}
              onChange={(e) => setInvoice((p) => ({ ...p, discount: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className={labelCls}>Tax / GST (%)</label>
            <input
              className={inputCls} type="number" min="0"
              value={invoice.tax}
              onChange={(e) => setInvoice((p) => ({ ...p, tax: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select
              className={inputCls}
              value={invoice.currency}
              onChange={(e) => setInvoice((p) => ({ ...p, currency: e.target.value }))}
            >
              {["INR", "USD", "EUR", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Payment Options ── */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY }}>
          Payment Options
        </h3>

        {/* Quick select tabs */}
        <div className="mb-4 flex gap-2">
          {["Full Payment", "Partial/Advance", "EMI"].map((m) => {
            const isActive = invoice.paymentMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => quickPayment(m)}
                className="rounded-lg px-4 py-2 text-xs font-bold transition"
                style={
                  isActive
                    ? { background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`, color: "#fff", boxShadow: `0 4px 12px ${PRIMARY}40` }
                    : { background: SOFT, color: PRIMARY, border: `1px solid ${PRIMARY}30` }
                }
              >
                {m}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Payment Mode</label>
            <select
              className={inputCls}
              value={invoice.paymentMode}
              onChange={(e) => setInvoice((p) => ({ ...p, paymentMode: e.target.value }))}
            >
              {["Full Payment", "Partial/Advance", "EMI"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Payment Status</label>
            <select
              className={inputCls}
              value={invoice.paymentStatus}
              onChange={(e) => setInvoice((p) => ({ ...p, paymentStatus: e.target.value }))}
            >
              {["UNPAID", "PAID", "PARTIALLY PAID"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Paid Amount</label>
            <input
              className={inputCls} type="number" min="0"
              value={invoice.paidAmount}
              onChange={(e) => setInvoice((p) => ({ ...p, paidAmount: Number(e.target.value || 0) }))}
            />
          </div>
          {showEmi && (
            <div>
              <label className={labelCls}>EMI Months</label>
              <input
                className={inputCls} type="number" min="0"
                value={invoice.emiMonths}
                onChange={(e) => setInvoice((p) => ({ ...p, emiMonths: Number(e.target.value || 0) }))}
              />
              <p className="mt-1.5 text-xs" style={{ color: SECONDARY }}>
                EMI / month:{" "}
                <strong style={{ color: PRIMARY }}>
                  {Number(invoice.emiPerMonth || 0).toFixed(2)}
                </strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="mb-6">
        <label className={labelCls}>Additional Notes</label>
        <textarea
          className={`${inputCls} min-h-20 resize-none`}
          value={invoice.notes}
          onChange={(e) => setInvoice((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Add any additional notes..."
        />
      </div>

      {/* ── Save Button ── */}
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`, boxShadow: `0 4px 16px ${PRIMARY}40` }}
      >
        {saving ? "Saving Invoice…" : "Save Invoice Securely"}
      </button>
    </div>
  );
}