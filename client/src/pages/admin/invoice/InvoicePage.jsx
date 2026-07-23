import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiEdit2, FiEye, FiFileText, FiTrash2 } from "react-icons/fi";
import InvoiceForm from "../../../components/invoice/InvoiceForm.jsx";
import InvoicePreview from "../../../components/invoice/InvoicePreview.jsx";
import { useAuth } from "../../../hooks/useAuth";
import {
  createInvoice,
  deleteInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoices,
  updateInvoice,
} from "../../../firebase/invoiceService";

const PRIMARY   = "#302568";
const SECONDARY = "#7560A7";

function todayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function generateInvoiceNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const xxx = String(Math.floor(100 + Math.random() * 900));
  return `INV-${y}${m}${day}-${xxx}`;
}

function makeDefault(email = "") {
  return {
    invoiceNo: generateInvoiceNo(),
    date: todayIso(),
    billFrom: { company: "APPSITE LABS", email },
    billTo: { name: "", address: "", email: "", phone: "" },
    items: [
      { description: "Website Design",   qty: 1, price: 12000, amount: 12000 },
      { description: "SEO Optimization", qty: 1, price: 8000,  amount: 8000  },
    ],
    discount: 0,
    tax: 18,
    currency: "INR",
    paymentMode: "Full Payment",
    paymentStatus: "UNPAID",
    paidAmount: 0,
    emiMonths: 0,
    notes: "Thank you for your business!",
  };
}

function formatMoney(currency, value) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${currency || "INR"} ${Number(value || 0).toFixed(2)}`;
  }
}

export default function InvoicePage({ adminMode = false, viewMode = false }) {
  const navigate = useNavigate();
  const { id }   = useParams();
  const { user } = useAuth();
  const isNew    = !id;

  const [loading, setLoading]           = useState(!isNew);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [invoiceOwnerId, setInvoiceOwnerId] = useState("");
  const [base, setBase]                 = useState(() => makeDefault(user?.email || ""));
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState("");
  const [deletingRecentId, setDeletingRecentId] = useState("");

  // ── Load existing ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const inv = await getInvoiceById(id, adminMode ? undefined : user?.uid);
        if (cancelled) return;
        if (inv) {
          setInvoiceOwnerId(inv.userId || "");
          setBase({
            invoiceNo:     inv.invoiceNo     || generateInvoiceNo(),
            date:          inv.date          || todayIso(),
            billFrom:      inv.billFrom      || { company: "", email: user?.email || "" },
            billTo:        inv.billTo        || { name: "", address: "", email: "", phone: "" },
            items:         inv.items         || [],
            discount:      Number(inv.discount   || 0),
            tax:           Number(inv.tax        || 0),
            currency:      inv.currency      || "INR",
            paymentMode:   inv.paymentMode   || "Full Payment",
            paymentStatus: (inv.paymentStatus || "UNPAID").toUpperCase(),
            paidAmount:    Number(inv.paidAmount || 0),
            emiMonths:     Number(inv.emiMonths  || 0),
            notes:         inv.notes         || "",
          });
        } else {
          setError("Invoice was not found.");
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load invoice.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [adminMode, id, user?.uid, user?.email]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecent() {
      setRecentLoading(true);
      setRecentError("");
      try {
        const rows = adminMode ? await getAllInvoices() : await getInvoices(user?.uid);
        if (!cancelled) setRecentInvoices(rows.slice(0, 5));
      } catch (err) {
        if (!cancelled) setRecentError(err?.message || "Failed to load recent invoices.");
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    }

    if (adminMode || user?.uid) {
      loadRecent();
    }

    return () => { cancelled = true; };
  }, [adminMode, user?.uid]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const computed = useMemo(() => {
    const items = (base.items || []).map((it) => {
      const qty = Number(it.qty || 0);
      const price = Number(it.price || 0);
      return { ...it, qty, price, amount: qty * price };
    });
    const subtotal       = items.reduce((s, it) => s + Number(it.amount || 0), 0);
    const discount       = Number(base.discount || 0);
    const tax            = Number(base.tax || 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount  = subtotal - discountAmount;
    const taxAmount      = afterDiscount * (tax / 100);
    const grandTotal     = afterDiscount + taxAmount;
    const paidAmount     = Number(base.paidAmount || 0);
    const dueAmount      = grandTotal - paidAmount;
    const emiMonths      = Number(base.emiMonths || 0);
    const emiPerMonth    = emiMonths > 0 ? dueAmount / emiMonths : 0;
    return {
      ...base, items, subtotal, discountAmount, taxAmount,
      grandTotal, dueAmount, emiPerMonth, paidAmount, emiMonths, discount, tax,
    };
  }, [base]);

  // ── Save ────────────────────────────────────────────────────────────────────
  async function onSave() {
    if (saving) return;
    if (!user?.uid) {
      setError("Login session is missing. Please log out, log in again, and then save the invoice.");
      return;
    }
    setSaving(true);
    setError("");
    const billTo  = computed.billTo || {};
    const missing = ["name", "address", "email", "phone"].filter(
      (f) => !String(billTo[f] || "").trim()
    );
    if (missing.length) {
      setError("Please fill client name, address, email, and phone before saving.");
      setSaving(false);
      return;
    }
    const ownerId = adminMode ? invoiceOwnerId || user.uid : user.uid;
    const payload = {
      ...computed,
      userId:        ownerId,
      createdBy:     user.uid,
      createdByEmail: user.email || "",
      ownerEmail:    user.email || "",
      paymentStatus: (computed.paymentStatus || "UNPAID").toUpperCase(),
    };
    try {
      if (isNew) await createInvoice(payload);
      else       await updateInvoice(id, payload);
      navigate("/admin/invoices", { replace: true });
    } catch (err) {
      setError(err?.message || "Invoice could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setBase(makeDefault(user?.email || ""));
  }

  async function onDeleteRecent(invoiceId) {
    if (!confirm("Delete this invoice permanently?")) return;
    setDeletingRecentId(invoiceId);
    setRecentError("");
    try {
      await deleteInvoice(invoiceId);
      setRecentInvoices((rows) => rows.filter((inv) => inv.id !== invoiceId));
      if (invoiceId === id) {
        navigate("/admin/invoices", { replace: true });
      }
    } catch (err) {
      setRecentError(err?.message || "Invoice could not be deleted.");
    } finally {
      setDeletingRecentId("");
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: SECONDARY }}>
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-extrabold" style={{ color: PRIMARY }}>
            {isNew ? "New Invoice" : viewMode ? "View Invoice" : "Edit Invoice"}
          </h1>
          {!isNew && (
            <p className="mt-1 text-sm" style={{ color: SECONDARY }}>
              {base.invoiceNo || id}
            </p>
          )}
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate("/admin/invoices")}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:shadow-md"
          style={{
            borderColor: `${PRIMARY}30`,
            color: PRIMARY,
            background: "#EDE8F5",
          }}
        >
          <FiArrowLeft />
          Back to Invoices
        </button>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-lg">
          <div
            className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200"
            style={{ borderTopColor: PRIMARY }}
          />
          <p className="font-medium text-slate-500">Loading invoice…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className={`grid grid-cols-1 items-start gap-6 ${viewMode ? "" : "lg:grid-cols-2"}`}>
            {/* Form */}
            {!viewMode && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <InvoiceForm
                  invoice={computed}
                  setInvoice={setBase}
                  onSave={onSave}
                  saving={saving}
                />
              </div>
            )}

            {/* Preview */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg lg:sticky lg:top-6">
              <InvoicePreview
                invoice={computed}
                onPrint={() => window.print()}
                onReset={viewMode ? undefined : onReset}
              />
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: SECONDARY }}>
                  Recent Saved Invoices
                </p>
                <h2 className="mt-1 text-xl font-extrabold" style={{ color: PRIMARY }}>
                  Latest invoices
                </h2>
              </div>
              <Link
                to="/admin/invoices"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        Loading recent invoices...
                      </td>
                    </tr>
                  ) : recentError ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-red-600">
                        {recentError}
                      </td>
                    </tr>
                  ) : recentInvoices.length ? (
                    recentInvoices.map((inv) => (
                      <tr key={inv.id} className="transition hover:bg-[#F8F6FF]">
                        <td className="px-6 py-4">
                          <Link
                            to={`/admin/invoices/${inv.id}/edit`}
                            className="inline-flex items-center gap-2 font-bold"
                            style={{ color: PRIMARY }}
                          >
                            <FiFileText className="text-sm" />
                            {inv.invoiceNo || inv.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {inv.billTo?.name || inv.billTo?.email || "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-bold" style={{ color: PRIMARY }}>
                          {formatMoney(inv.currency, inv.grandTotal)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-[#EDE8F5] px-3 py-1 text-xs font-bold" style={{ color: PRIMARY }}>
                            {String(inv.paymentStatus || "UNPAID").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/invoices/${inv.id}/view`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                              title="View invoice"
                            >
                              <FiEye className="text-sm" />
                              View
                            </Link>
                            <Link
                              to={`/admin/invoices/${inv.id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:opacity-80"
                              style={{ background: "#EDE8F5", color: PRIMARY }}
                              title="Edit invoice"
                            >
                              <FiEdit2 className="text-sm" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              disabled={deletingRecentId === inv.id}
                              onClick={() => onDeleteRecent(inv.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete invoice"
                            >
                              <FiTrash2 className="text-sm" />
                              {deletingRecentId === inv.id ? "Deleting" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        No saved invoices yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
