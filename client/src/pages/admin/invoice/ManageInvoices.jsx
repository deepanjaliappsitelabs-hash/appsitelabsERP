import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFileText, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { deleteInvoice, getAllInvoices } from "../../../firebase/invoiceService";

function formatMoney(currency, value) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `₹${Number(value || 0).toFixed(2)}`;
  }
}

function StatusBadge({ status }) {
  const s = String(status || "UNPAID").toUpperCase();
  const styles = {
    "PAID":           "bg-emerald-50 text-emerald-700 border-emerald-200",
    "PARTIALLY PAID": "bg-[#EDE8F5] text-[#302568] border-[#C8BEE8]",
    "UNPAID":         "bg-amber-50 text-amber-700 border-amber-200",
  };
  const dots = {
    "PAID":           "bg-emerald-500",
    "PARTIALLY PAID": "bg-[#7560A7]",
    "UNPAID":         "bg-amber-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${styles[s] || styles["UNPAID"]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[s] || dots["UNPAID"]}`} />
      {s}
    </span>
  );
}

// ── Client-wise Summary Table ─────────────────────────────────────────────────
function ClientSummary({ invoices }) {
  const [expanded, setExpanded] = useState(null);

  const clientGroups = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      const email = inv.billTo?.email || inv.billTo?.phone || "unknown";
      if (!map[email]) {
        map[email] = {
          email,
          name: inv.billTo?.name || "Unknown",
          invoices: [],
          currency: inv.currency || "INR",
        };
      }
      map[email].invoices.push(inv);
    });

    return Object.values(map).map((client) => {
      // Sort invoices by date ascending (oldest first)
      const sorted = [...client.invoices].sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(a.createdAt?.seconds * 1000 || 0);
        const db = b.date ? new Date(b.date) : new Date(b.createdAt?.seconds * 1000 || 0);
        return da - db;
      });

      // Total Paid = sum of all paidAmount across invoices
      const totalPaid = sorted.reduce((s, i) => s + Number(i.paidAmount || 0), 0);

      // Latest invoice ka dueAmount = actual current outstanding (cumulative)
      const latestInv = sorted[sorted.length - 1];
      const totalDue = Number(latestInv?.dueAmount || 0);

      // Total Billed = totalPaid + totalDue (actual contract value)
      const totalBilled = totalPaid + totalDue;

      return {
        ...client,
        invoices: sorted.reverse(), // newest first for display
        totalBilled,
        totalPaid,
        totalDue,
      };
    }).sort((a, b) => b.totalBilled - a.totalBilled);
  }, [invoices]);

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#E7E8F0" }}>
      <div className="border-b px-6 py-4" style={{ borderColor: "#E7E8F0", background: "linear-gradient(135deg, #302568, #7560A7)" }}>
        <h2 className="text-base font-bold text-white">Client-wise Payment Summary</h2>
        <p className="mt-0.5 text-xs text-white/70">Grouped by client email — total billed, paid & due per client</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[#F8F6FF]">
              {["Client", "Email", "Invoices", "Total Billed", "Total Paid", "Total Due", "Details"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{ color: "#7560A7" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clientGroups.map((client) => (
              <>
                <tr
                  key={client.email}
                  className="cursor-pointer transition hover:bg-[#F8F6FF]"
                  onClick={() => setExpanded(expanded === client.email ? null : client.email)}
                >
                  <td className="px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #302568, #7560A7)" }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold" style={{ color: "#302568" }}>{client.name}</p>
                    <p className="text-xs text-slate-400">{client.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: "#EDE8F5", color: "#302568" }}>
                      {client.invoices.length} invoice{client.invoices.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold" style={{ color: "#302568" }}>
                    {formatMoney(client.currency, client.totalBilled)}
                  </td>
                  <td className="px-5 py-4 font-bold" style={{ color: "#059669" }}>
                    {formatMoney(client.currency, client.totalPaid)}
                  </td>
                  <td className="px-5 py-4 font-bold" style={{ color: client.totalDue > 0 ? "#B45309" : "#059669" }}>
                    {formatMoney(client.currency, client.totalDue)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition"
                      style={{ background: "#EDE8F5", color: "#302568" }}
                    >
                      {expanded === client.email ? <FiChevronUp /> : <FiChevronDown />}
                      {expanded === client.email ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>

                {expanded === client.email && client.invoices.map((inv) => (
                  <tr key={inv.id} style={{ background: "#FAFAFE" }}>
                    <td className="py-3 pl-12" colSpan={2}>
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: "#EDE8F5", color: "#302568" }}>
                        <FiFileText className="text-xs" />
                        {inv.invoiceNo || inv.id}
                      </span>
                      <span className="ml-3 text-xs text-slate-400">
                        {inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold" style={{ color: "#302568" }}>
                      {formatMoney(inv.currency, inv.grandTotal)}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold" style={{ color: "#059669" }}>
                      {formatMoney(inv.currency, inv.paidAmount)}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold" style={{ color: Number(inv.dueAmount) > 0 ? "#B45309" : "#059669" }}>
                      {formatMoney(inv.currency, inv.dueAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/invoices/${inv.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition hover:opacity-80"
                        style={{ background: "#EDE8F5", color: "#302568" }}
                      >
                        <FiEdit2 className="text-xs" /> Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>

          <tfoot>
            <tr style={{ background: "linear-gradient(135deg, #302568, #7560A7)" }}>
              <td className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-white" colSpan={3}>
                Grand Total ({invoices.length} invoices · {clientGroups.length} clients)
              </td>
              <td className="px-5 py-4 text-right font-extrabold text-white">
                {formatMoney("INR", invoices.reduce((s, i) => s + Number(i.grandTotal || 0), 0))}
              </td>
              <td className="px-5 py-4 text-right font-extrabold" style={{ color: "#86efac" }}>
                {formatMoney("INR", invoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0))}
              </td>
              <td className="px-5 py-4 text-right font-extrabold" style={{ color: "#fcd34d" }}>
                {formatMoney("INR", invoices.reduce((s, i) => s + Number(i.dueAmount || 0), 0))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ManageInvoices() {
  const [invoices, setInvoices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [query, setQuery]           = useState("");
  const [status, setStatus]         = useState("ALL");
  const [deletingId, setDeletingId] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const data = await getAllInvoices();
      if (mountedRef.current) setInvoices(data);
    } catch (err) {
      if (mountedRef.current) setError(err?.message || "Failed to load invoices.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesStatus = status === "ALL" || String(inv.paymentStatus || "").toUpperCase() === status;
      const text = [inv.invoiceNo, inv.billTo?.name, inv.billTo?.email, inv.billTo?.phone, inv.billFrom?.email, inv.userId, inv.paymentMode].join(" ").toLowerCase();
      return matchesStatus && (!q || text.includes(q));
    });
  }, [invoices, query, status]);

  async function onDelete(id) {
    if (!confirm("Delete this invoice permanently?")) return;
    setDeletingId(id); setError("");
    try { await deleteInvoice(id); await load(); }
    catch (err) { setError(err?.message || "Invoice could not be deleted."); }
    finally { setDeletingId(""); }
  }

  // ── Counts
  const paidCount    = invoices.filter((i) => String(i.paymentStatus || "").toUpperCase() === "PAID").length;
  const unpaidCount  = invoices.filter((i) => String(i.paymentStatus || "").toUpperCase() === "UNPAID").length;
  const partialCount = invoices.filter((i) => String(i.paymentStatus || "").toUpperCase() === "PARTIALLY PAID").length;

  // ── Amount Totals (cumulative-safe) ✅
  // Group by client email, pick latest invoice's dueAmount per client
  const clientTotals = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      const email = inv.billTo?.email || inv.billTo?.phone || "unknown";
      if (!map[email]) map[email] = { invoices: [] };
      map[email].invoices.push(inv);
    });

    let totalPaid = 0;
    let totalDue  = 0;

    Object.values(map).forEach((client) => {
      const sorted = [...client.invoices].sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(a.createdAt?.seconds * 1000 || 0);
        const db = b.date ? new Date(b.date) : new Date(b.createdAt?.seconds * 1000 || 0);
        return da - db;
      });
      const paid = sorted.reduce((s, i) => s + Number(i.paidAmount || 0), 0);
      const due  = Number(sorted[sorted.length - 1]?.dueAmount || 0);
      totalPaid += paid;
      totalDue  += due;
    });

    return { totalPaid, totalDue, totalBilled: totalPaid + totalDue };
  }, [invoices]);

  const totalBilled = clientTotals.totalBilled;
  const totalPaid   = clientTotals.totalPaid;
  const totalDue    = clientTotals.totalDue;
  const partialPaid = invoices
    .filter((i) => String(i.paymentStatus || "").toUpperCase() === "PARTIALLY PAID")
    .reduce((s, i) => s + Number(i.paidAmount || 0), 0);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7560A7" }}>Admin</p>
          <h1 className="mt-1 text-3xl font-extrabold" style={{ color: "#302568" }}>Manage Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Loading…" : `${filtered.length} of ${invoices.length} invoices shown`}
          </p>
        </div>
        <Link
          to="/admin/invoices/new"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #302568, #7560A7)" }}
        >
          <FiPlus className="text-base" />
          New Invoice
        </Link>
      </div>

      {/* ── Status Pills ── ✅ UPDATED with amounts */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Invoices */}
        <div className="flex min-h-[112px] w-full flex-col justify-center gap-1 rounded-xl border bg-white px-6 py-4 shadow-sm" style={{ borderColor: "#E7E8F0" }}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: "#302568" }} />
            <span className="whitespace-nowrap text-xs font-semibold text-slate-500">Total Invoices</span>
            <strong className="text-sm" style={{ color: "#302568" }}>{invoices.length}</strong>
          </div>
          <p className="pl-4 text-sm font-extrabold" style={{ color: "#302568" }}>
            {formatMoney("INR", totalBilled)}
          </p>
          <p className="pl-4 text-xs text-slate-400">Total Billed</p>
        </div>

        {/* Paid */}
        <div className="flex min-h-[112px] w-full flex-col justify-center gap-1 rounded-xl border bg-white px-6 py-4 shadow-sm" style={{ borderColor: "#E7E8F0" }}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="whitespace-nowrap text-xs font-semibold text-slate-500">Paid</span>
            <strong className="text-sm" style={{ color: "#059669" }}>{paidCount}</strong>
          </div>
          <p className="pl-4 text-sm font-extrabold" style={{ color: "#059669" }}>
            {formatMoney("INR", totalPaid)}
          </p>
          <p className="pl-4 text-xs text-slate-400">Total Received</p>
        </div>

        {/* Partially Paid */}
        <div className="flex min-h-[112px] w-full flex-col justify-center gap-1 rounded-xl border bg-white px-6 py-4 shadow-sm" style={{ borderColor: "#E7E8F0" }}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: "#7560A7" }} />
            <span className="whitespace-nowrap text-xs font-semibold text-slate-500">Partially Paid</span>
            <strong className="text-sm" style={{ color: "#7560A7" }}>{partialCount}</strong>
          </div>
          <p className="pl-4 text-sm font-extrabold" style={{ color: "#7560A7" }}>
            {formatMoney("INR", partialPaid)}
          </p>
          <p className="pl-4 text-xs text-slate-400">Partially Received</p>
        </div>

        {/* Unpaid / Due */}
        <div className="flex min-h-[112px] w-full flex-col justify-center gap-1 rounded-xl border bg-white px-6 py-4 shadow-sm" style={{ borderColor: "#E7E8F0" }}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="whitespace-nowrap text-xs font-semibold text-slate-500">Unpaid</span>
            <strong className="text-sm" style={{ color: "#B45309" }}>{unpaidCount}</strong>
          </div>
          <p className="pl-4 text-sm font-extrabold" style={{ color: "#B45309" }}>
            {formatMoney("INR", totalDue)}
          </p>
          <p className="pl-4 text-xs text-slate-400">Total Due</p>
        </div>

      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#E7E8F0" }}>
          <FiSearch style={{ color: "#7560A7" }} className="shrink-0 text-lg" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            style={{ color: "#302568" }}
            placeholder="Search invoice, client, email, user…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button type="button" onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">✕</button>}
        </div>
        <select
          className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold outline-none"
          style={{ borderColor: "#E7E8F0", color: "#302568" }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">All status</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY PAID">Partially Paid</option>
          <option value="UNPAID">Unpaid</option>
        </select>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* ── All Invoices Table ── */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#E7E8F0" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #302568, #7560A7)" }}>
                {["Invoice", "Date", "Client", "Owner", "Total", "Paid", "Due", "Status", "Actions"].map((h) => (
                  <th key={h} className={`px-5 py-4 text-xs font-bold uppercase tracking-widest text-white ${["Total","Paid","Due","Actions"].includes(h) ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <FiFileText className="text-4xl opacity-30" />
                    <p>Loading invoices…</p>
                  </div>
                </td></tr>
              ) : filtered.length ? (
                filtered.map((inv, idx) => (
                  <tr key={inv.id} className="transition-colors hover:bg-[#F8F6FF]" style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAFE" }}>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: "#EDE8F5", color: "#302568" }}>
                        <FiFileText className="text-xs" />{inv.invoiceNo || inv.id}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold" style={{ color: "#302568" }}>{inv.billTo?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{inv.billTo?.email || inv.billTo?.phone || ""}</p>
                    </td>
                    <td className="max-w-[160px] truncate px-5 py-4 text-sm text-slate-500">{inv.billFrom?.email || inv.userId || "—"}</td>
                    <td className="px-5 py-4 text-right font-bold" style={{ color: "#302568" }}>{formatMoney(inv.currency, inv.grandTotal)}</td>
                    <td className="px-5 py-4 text-right font-bold" style={{ color: "#059669" }}>{formatMoney(inv.currency, inv.paidAmount)}</td>
                    <td className="px-5 py-4 text-right font-bold" style={{ color: Number(inv.dueAmount) > 0 ? "#B45309" : "#059669" }}>{formatMoney(inv.currency, inv.dueAmount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={inv.paymentStatus} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/invoices/${inv.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:opacity-80" style={{ background: "#EDE8F5", color: "#302568" }}>
                          <FiEdit2 className="text-xs" /> Edit
                        </Link>
                        <button type="button" disabled={deletingId === inv.id} onClick={() => onDelete(inv.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                          <FiTrash2 className="text-xs" />
                          {deletingId === inv.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FiFileText className="text-5xl text-slate-200" />
                    <p className="font-semibold text-slate-400">No invoices match your filters</p>
                    <Link to="/admin/invoices/new" className="mt-1 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: "#302568" }}>
                      <FiPlus /> Create your first invoice
                    </Link>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Client-wise Summary ── */}
      {!loading && invoices.length > 0 && <ClientSummary invoices={invoices} />}

    </div>
  );
}
