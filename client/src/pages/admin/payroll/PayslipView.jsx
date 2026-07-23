import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { getPayslip } from "../../../services/payrollService";
import formatCurrency from "../../../utils/formatCurrency";

function PayslipView() {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayslip(id)
      .then(setPayslip)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Loading payslip…
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Payslip not found.
      </div>
    );
  }

  // ── Use REAL fields from backend ──────────────────────────────────────────
  const basic      = Number(payslip.basic       || 0);
  const hra        = Number(payslip.hra         || 0);
  const da         = Number(payslip.da          || 0);
  const otherAllow = Number(payslip.other_allow || 0);
  const gross      = Number(payslip.gross       || basic + hra + da + otherAllow);

  const pf          = Number(payslip.pf          || 0);
  const esi         = Number(payslip.esi         || 0);
  const tds         = Number(payslip.tds         || 0);
  const profTax     = Number(payslip.prof_tax    || 0);
  const totalDeduct = Number(payslip.deductions  || pf + esi + tds + profTax);

  const netPay = Number(payslip.inHand || gross - totalDeduct);

  const earnings = {
    Basic:        basic,
    HRA:          hra,
    "DA":         da,
    ...(otherAllow > 0 && { "Other Allowances": otherAllow }),
  };

  const deductions = {
    ...(pf      > 0 && { "PF (12%)":           pf }),
    ...(esi     > 0 && { "ESI":                 esi }),
    ...(tds     > 0 && { "TDS":                 tds }),
    ...(profTax > 0 && { "Professional Tax":    profTax }),
  };

  // Fallback: if backend sends no breakdown, derive from gross
  const hasBreakdown = basic > 0 || hra > 0 || da > 0;
  const displayEarnings = hasBreakdown
    ? earnings
    : {
        Basic:        Math.round(gross * 0.50),
        HRA:          Math.round(gross * 0.20),
        DA:           Math.round(gross * 0.10),
        "Allowances": Math.round(gross * 0.20),
      };

  const hasDeductBreakdown = pf > 0 || esi > 0 || tds > 0;
  const displayDeductions = hasDeductBreakdown
    ? deductions
    : {
        "PF (12%)": Math.round(gross * 0.12),
        "TDS (5%)": Math.round(gross * 0.05),
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslip"
        subtitle="Printable monthly salary statement."
        action={<Button onClick={() => window.print()}>Download as PDF</Button>}
      />

      <Card>
        {/* Header */}
        <div className="border-b border-[#E7E8F0] pb-6">
          <div className="flex items-center justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">AppsiteLabs</h2>
              <p className="mt-1 text-sm text-slate-500">
                Salary Slip for {payslip.month}
              </p>
            </div>
            <img
              src="/ASL_Official-logo.png"
              alt="AppsiteLabs"
              className="h-14 object-contain"
            />
          </div>
        </div>

        {/* Employee Info */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Employee",    payslip.employee   || "—"],
            ["Employee ID", payslip.employeeId || "—"],
            ["Department",  payslip.department || "—"],
            ["Status",      payslip.status     || "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#E7E8F0] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        {/* CTC row */}
        {payslip.ctc > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#E7E8F0] bg-[#FAFAFA] px-5 py-3">
            <span className="text-sm font-semibold text-slate-500">Annual CTC</span>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(payslip.ctc)}
            </span>
          </div>
        )}

        {/* Earnings & Deductions */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <SalaryTable
            title="Earnings"
            rows={displayEarnings}
            totalLabel="Gross Earnings"
            total={gross}
          />
          <SalaryTable
            title="Deductions"
            rows={displayDeductions}
            totalLabel="Total Deductions"
            total={totalDeduct}
          />
        </div>

        {/* Net Pay */}
        <div className="mt-8 rounded-2xl bg-[#F1EDFF] p-5 text-right">
          <p className="text-sm font-semibold text-[#5B3FD6]">Net Salary (In-Hand)</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">
            {formatCurrency(netPay)}
          </p>
        </div>
      </Card>
    </div>
  );
}

function SalaryTable({ title, rows, totalLabel, total }) {
  return (
    <div className="rounded-2xl border border-[#E7E8F0] p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">{title}</h3>
      <div className="space-y-3">
        {Object.entries(rows).map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-950">{formatCurrency(value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t border-[#ECEEF5] pt-4 text-sm font-bold text-slate-950">
        <span>{totalLabel}</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export default PayslipView;