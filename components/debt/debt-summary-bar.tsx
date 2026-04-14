import { formatMoney } from "@/lib/money";

type DebtSummaryBarProps = {
  totalIOwe: number;
  totalOwedToMe: number;
  totalLeasing: number;
  baseCurrencyCode: string;
  monthlyPaymentsDue: number;
  monthlyPaymentsPaid: number;
};

export function DebtSummaryBar({ totalIOwe, totalOwedToMe, totalLeasing, baseCurrencyCode, monthlyPaymentsDue, monthlyPaymentsPaid }: DebtSummaryBarProps) {
  const net = totalOwedToMe - totalIOwe - totalLeasing;
  const allPaid = monthlyPaymentsDue > 0 && monthlyPaymentsPaid >= monthlyPaymentsDue;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">Liabilities</p>
        <p className="mt-1 font-heading text-lg font-bold text-heading">{formatMoney(totalIOwe, baseCurrencyCode)}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">Receivables</p>
        <p className="mt-1 font-heading text-lg font-bold text-heading">{formatMoney(totalOwedToMe, baseCurrencyCode)}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">Leasing</p>
        <p className="mt-1 font-heading text-lg font-bold text-heading">{formatMoney(totalLeasing, baseCurrencyCode)}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">Net Position</p>
        <p className={`mt-1 font-heading text-lg font-bold ${net >= 0 ? "text-posted" : "text-danger"}`}>
          {net >= 0 ? "+" : ""}{formatMoney(Math.abs(net), baseCurrencyCode)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">This Month</p>
        {monthlyPaymentsDue > 0 ? (
          <p className={`mt-1 font-heading text-lg font-bold ${allPaid ? "text-posted" : "text-heading"}`}>
            {allPaid ? "All paid" : `${monthlyPaymentsPaid}/${monthlyPaymentsDue} paid`}
          </p>
        ) : (
          <p className="mt-1 font-heading text-lg font-bold text-body">No payments due</p>
        )}
      </div>
    </div>
  );
}
