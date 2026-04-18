import { formatMoney } from "@/lib/money";

type BonusMetric = {
  label: string;
  value: string;
  subtext?: string;
  color?: string;
};

type MonthSummaryBarProps = {
  dueAmountMinor: number;
  paidAmountMinor: number;
  baseCurrencyCode: string;
  bonusMetric?: BonusMetric;
  dueLabel?: string;
  paidLabel?: string;
};

export function MonthSummaryBar({
  dueAmountMinor,
  paidAmountMinor,
  baseCurrencyCode,
  bonusMetric,
  dueLabel = "Due This Month",
  paidLabel = "Paid",
}: MonthSummaryBarProps) {
  const remainingMinor = Math.max(0, dueAmountMinor - paidAmountMinor);
  const progressPct = dueAmountMinor > 0 ? Math.min(100, Math.round((paidAmountMinor / dueAmountMinor) * 100)) : 0;
  const allClear = dueAmountMinor > 0 && remainingMinor === 0;

  return (
    <div className="space-y-3">
      <div className={`grid grid-cols-2 gap-3 ${bonusMetric ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-body">{dueLabel}</p>
          <p className="mt-1 font-heading text-lg font-bold text-heading">
            {formatMoney(dueAmountMinor, baseCurrencyCode)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-body">{paidLabel}</p>
          <p className={`mt-1 font-heading text-lg font-bold ${allClear ? "text-posted" : "text-heading"}`}>
            {formatMoney(paidAmountMinor, baseCurrencyCode)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-body">Remaining</p>
          <p className={`mt-1 font-heading text-lg font-bold ${allClear ? "text-posted" : remainingMinor > 0 ? "text-danger" : "text-heading"}`}>
            {allClear ? "All clear" : formatMoney(remainingMinor, baseCurrencyCode)}
          </p>
        </div>
        {bonusMetric && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">{bonusMetric.label}</p>
            <p className={`mt-1 font-heading text-lg font-bold ${bonusMetric.color ?? "text-heading"}`}>
              {bonusMetric.value}
            </p>
            {bonusMetric.subtext && (
              <p className="mt-0.5 truncate text-xs text-body">{bonusMetric.subtext}</p>
            )}
          </div>
        )}
      </div>
      {dueAmountMinor > 0 && (
        <div className="h-2 rounded-full bg-surface-secondary">
          <div
            className={`h-2 rounded-full transition-all ${allClear ? "bg-posted" : "bg-primary"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
