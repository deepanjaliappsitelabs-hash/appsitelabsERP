import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import InvoiceTable from "../components/InvoiceTable.jsx";
import { useAuth } from "../hooks/useAuth";
import { useInvoices } from "../hooks/useInvoices";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invoices, loading, error, remove } = useInvoices(user?.uid);
  const adminEmails = String(import.meta.env.VITE_ADMIN_EMAILS || "business@appsitelabs.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(String(user?.email || "").toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-primary bg-clip-text text-transparent mb-2">
              Your Invoices
            </h1>
            <p className="text-slate-600 font-medium">
              {loading ? "Loading..." : error ? error : `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition duration-200 whitespace-nowrap"
            onClick={() => navigate("/invoice/new")}
          >
            ✨ Create New Invoice
          </button>
        </div>

        {isAdmin ? (
          <div className="mb-8 rounded-2xl border border-primary/10 bg-white p-6 shadow-lg shadow-primary/5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-secondary">Admin Workspace</p>
                <h2 className="mt-2 text-2xl font-extrabold text-primary">Go back to admin panel</h2>
                <p className="mt-1 text-sm text-brand-700">
                  Return to the admin dashboard to manage invoices, users, and payment activity.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-gradient-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
                onClick={() => navigate("/admin/dashboard")}
              >
                Open Admin Panel
              </button>
            </div>
          </div>
        ) : null}

        {/* Recent Invoices Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Recent Saved Invoices</h2>
            <p className="text-slate-600 text-sm">View and manage all your invoices</p>
          </div>
          <InvoiceTable
            invoices={invoices}
            onDelete={async (id) => {
              if (!confirm("Delete this invoice?")) return;
              await remove(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}
