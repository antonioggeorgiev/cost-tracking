import { formatMoney } from "@/lib/money";

type RecurringSummaryStatsProps = {
  totalMonthlyMinor: number;
  activeCount: number;
  nextPaymentDate: Date | string | null;
  nextPaymentTitle: string | null;
  dueThisMonthMinor: number;
  baseCurrencyCode: string;
  paidThisMonthCount?: number;
  dueThisMonthCount?: number;
};

export function RecurringSummaryStats({
  totalMonthlyMinor,
  activeCount,
  nextPaymentDate,
  nextPaymentTitle,
  dueThisMonthMinor,
  baseCurrencyCode,
  paidThisMonthCount,
  dueThisMonthCount,
}: RecurringSummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">Monthly Cost</p>
        <p className="mt-1 font-heading text-lg font-bold text-heading">
          {formatMoney(totalMonthlyMinor, baseCurrencyCode)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">Active</p>
        <p className="mt-1 font-heading text-lg font-bold text-heading">{activeCount}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">Next Payment</p>
        {nextPaymentDate ? (
          <div>
            <p className="mt-1 font-heading text-lg font-bold text-heading">
              {new Date(nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            {nextPaymentTitle && (
              <p className="truncate text-xs text-body">{nextPaymentTitle}</p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-body">None scheduled</p>
        )}
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-body">Due This Month</p>
        <p className="mt-1 font-heading text-lg font-bold text-heading">
          {formatMoney(dueThisMonthMinor, baseCurrencyCode)}
        </p>
        {dueThisMonthCount != null && dueThisMonthCount > 0 && (
          <p className={`mt-0.5 text-xs font-medium ${paidThisMonthCount != null && paidThisMonthCount >= dueThisMonthCount ? "text-posted" : "text-body"}`}>
            {paidThisMonthCount != null && paidThisMonthCount >= dueThisMonthCount
              ? "All paid"
              : `${paidThisMonthCount ?? 0} of ${dueThisMonthCount} paid`}
          </p>
        )}
      </div>
    </div>
  );
}
