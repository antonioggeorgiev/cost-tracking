import { MonthSummaryBar } from "@/components/shared/month-summary-bar";
import { formatMoney } from "@/lib/money";

type DebtSummaryBarProps = {
  dueAmountMinor: number;
  paidAmountMinor: number;
  baseCurrencyCode: string;
  totalIOwe: number;
  totalOwedToMe: number;
  totalLeasing: number;
};

export function DebtSummaryBar({ dueAmountMinor, paidAmountMinor, baseCurrencyCode, totalIOwe, totalOwedToMe, totalLeasing }: DebtSummaryBarProps) {
  const net = totalOwedToMe - totalIOwe - totalLeasing;

  return (
    <MonthSummaryBar
      dueAmountMinor={dueAmountMinor}
      paidAmountMinor={paidAmountMinor}
      baseCurrencyCode={baseCurrencyCode}
      bonusMetric={{
        label: "Net Position",
        value: `${net >= 0 ? "+" : ""}${formatMoney(Math.abs(net), baseCurrencyCode)}`,
        color: net >= 0 ? "text-posted" : "text-danger",
      }}
    />
  );
}
