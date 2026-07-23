// ─────────────────────────────────────────────────────────────────────────────
// Invoice.jsx
// Save as: client/src/pages/admin/apps/Invoice.jsx
// ─────────────────────────────────────────────────────────────────────────────
import PageHeader from "../../../components/layout/PageHeader";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

// ── InvoiceList ───────────────────────────────────────────────────────────────
export function InvoiceList() {
  const openInvoiceApp = () => {
    window.open("/invoice/", "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all client invoices."
        action={
          <Button onClick={openInvoiceApp}>
            Open Invoice App ↗
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
          {/* Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F1EDFF] text-4xl">
            🧾
          </div>

          {/* Text */}
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Invoice Management
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Your invoice application is ready. Click the button below to open
              it in a new tab and manage all your invoices, clients, and
              payments.
            </p>
          </div>

          {/* Main CTA button */}
          <button
            type="button"
            onClick={openInvoiceApp}
            className="flex items-center gap-3 rounded-2xl bg-[#5B3FD6] px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-[#4c34b5] hover:shadow-xl"
          >
            <span className="text-xl">🧾</span>
            Open Invoice App
            <span className="text-lg">↗</span>
          </button>

          <p className="text-xs text-slate-400">
            Opens in a new tab · Your invoice data is saved separately
          </p>
        </div>
      </Card>

      {/* Quick action cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: "📤", label: "Open Invoice App", desc: "Create, edit and manage invoices" },
          { icon: "📊", label: "View Reports",      desc: "Check invoice reports and analytics" },
          { icon: "💳", label: "Track Payments",    desc: "Monitor paid and pending invoices" },
        ].map(({ icon, label, desc }) => (
          <button
            key={label}
            type="button"
            onClick={openInvoiceApp}
            className="rounded-2xl border border-[#E7E8F0] bg-white p-5 text-left shadow-sm transition hover:border-[#CFC6FF] hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EDFF] text-xl">
              {icon}
            </div>
            <p className="font-bold text-slate-900">{label}</p>
            <p className="mt-1 text-sm text-slate-500">{desc}</p>
            <p className="mt-3 text-xs font-semibold text-[#5B3FD6]">Open ↗</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Kept so AppRoutes.jsx imports don't break
export function InvoiceDetails() {
  return <InvoiceList />;
}

export function CreateInvoice() {
  return <InvoiceList />;
}