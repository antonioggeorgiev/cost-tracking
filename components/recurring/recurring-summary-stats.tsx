import { MonthSummaryBar } from "@/components/shared/month-summary-bar";

type RecurringSummaryStatsProps = {
  dueThisMonthMinor: number;
  paidThisMonthMinor: number;
  baseCurrencyCode: string;
  nextPaymentDate: Date | string | null;
  nextPaymentTitle: string | null;
};

export function RecurringSummaryStats({
  dueThisMonthMinor,
  paidThisMonthMinor,
  baseCurrencyCode,
  nextPaymentDate,
  nextPaymentTitle,
}: RecurringSummaryStatsProps) {
  const nextDate = nextPaymentDate ? new Date(nextPaymentDate) : null;
  const nextLabel = nextDate
    ? nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "None";

  return (
    <MonthSummaryBar
      dueAmountMinor={dueThisMonthMinor}
      paidAmountMinor={paidThisMonthMinor}
      baseCurrencyCode={baseCurrencyCode}
      bonusMetric={{
        label: "Next Payment",
        value: nextLabel,
        subtext: nextPaymentTitle ?? undefined,
      }}
    />
  );
}
