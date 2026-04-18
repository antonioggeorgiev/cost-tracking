import type { ReactNode } from "react";
import { DebtCard } from "@/components/debt/debt-card";
import { formatMoney } from "@/lib/money";

type SerializedMonthStatus = {
  dueCount: number;
  paidCount: number;
  unpaidCount: number;
  nextUnpaidDate: string | null;
  unpaidDueDates: string[];
};

type DebtData = {
  id: string;
  kind: string;
  direction: string;
  name: string;
  provider: string | null;
  counterparty: string | null;
  originalAmountMinor: number;
  currencyCode: string;
  currentBalanceMinor: number;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  workspaceBalanceMinor: number;
  workspaceMonthlyAmountMinor: number | null;
  workspaceResidualValueMinor: number | null;
  interestRateBps: number | null;
  termMonths: number | null;
  monthlyAmountMinor: number | null;
  nextPaymentDate: Date | string | null;
  isActive: boolean;
  payments: Array<{ id: string }>;
};

type DebtGroupSectionProps = {
  title: string;
  icon: ReactNode;
  debts: DebtData[];
  baseCurrencyCode: string;
  spaceSlug: string;
  canManage: boolean;
  quickPayAction?: (formData: FormData) => Promise<void>;
  monthStatusMap?: Record<string, SerializedMonthStatus>;
};

export function DebtGroupSection({ title, icon, debts, baseCurrencyCode, spaceSlug, canManage, quickPayAction, monthStatusMap }: DebtGroupSectionProps) {
  if (debts.length === 0) return null;

  const active = debts.filter((d) => d.isActive);
  const totalRemaining = active.reduce((sum, d) => sum + d.workspaceBalanceMinor, 0);
  const nextPayment = active
    .filter((d) => d.nextPaymentDate)
    .sort((a, b) => new Date(a.nextPaymentDate!).getTime() - new Date(b.nextPaymentDate!).getTime())[0];

  // Group month status totals
  let groupDue = 0;
  let groupPaid = 0;
  if (monthStatusMap) {
    for (const d of active) {
      const s = monthStatusMap[d.id];
      if (s) { groupDue += s.dueCount; groupPaid += s.paidCount; }
    }
  }

  return (
    <section className="space-y-4">
      {/* Group header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-lighter text-primary">
            {icon}
          </div>
          <h2 className="font-heading text-lg font-semibold text-heading">{title}</h2>
          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-body">
            {active.length} active
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-body">
            Total: <span className="font-semibold text-heading">{formatMoney(totalRemaining, baseCurrencyCode)}</span>
          </span>
          {groupDue > 0 && (
            <span className={`font-medium ${groupPaid >= groupDue ? "text-posted" : "text-heading"}`}>
              {groupPaid >= groupDue ? "All paid" : `${groupPaid}/${groupDue} paid`}
            </span>
          )}
          {nextPayment?.nextPaymentDate && (
            <span className="text-body">
              Next:{" "}
              <span className="font-medium text-heading">
                {new Date(nextPayment.nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {debts.map((debt) => (
          <DebtCard
            key={debt.id}
            debt={debt}
            spaceSlug={spaceSlug}
            canManage={canManage}
            quickPayAction={quickPayAction}
            monthStatus={monthStatusMap?.[debt.id]}
          />
        ))}
      </div>
    </section>
  );
}
