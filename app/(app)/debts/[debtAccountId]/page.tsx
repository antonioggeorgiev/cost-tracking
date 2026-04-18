import { notFound } from "next/navigation";
import { getServerCaller } from "@/server/trpc-caller";
import { supportedCurrencies } from "@/lib/currency";
import { getSelectedSpaceSlug } from "@/lib/space-context";
import { debtService } from "@/server/services/debt-service";
import { DebtAccountDetailClient } from "./debt-account-detail-client";

type DebtDetailPageProps = {
  params: Promise<{ debtAccountId: string }>;
};

export default async function DebtDetailPage({ params }: DebtDetailPageProps) {
  const spaceSlug = await getSelectedSpaceSlug();
  if (!spaceSlug) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16 text-center shadow-sm">
        <p className="font-heading text-lg font-semibold text-heading">No space selected</p>
        <p className="mt-1 text-sm text-body">Please select a space from the sidebar to view this debt account.</p>
      </div>
    );
  }

  const { debtAccountId } = await params;
  const caller = await getServerCaller();

  const [workspace, debt] = await Promise.all([
    caller.spaces.bySlug({ spaceSlug }),
    caller.debts.getById({ spaceSlug, debtAccountId }),
  ]);

  if (!workspace || !debt) {
    notFound();
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";

  const now = new Date();
  const monthStatus = await debtService.getMonthPaymentStatus(
    workspace.id,
    debtAccountId,
    now.getFullYear(),
    now.getMonth(),
  );

  return (
    <DebtAccountDetailClient
      spaceSlug={spaceSlug}
      debt={{
        id: debt.id,
        kind: debt.kind,
        direction: debt.direction,
        name: debt.name,
        provider: debt.provider,
        counterparty: debt.counterparty,
        originalAmountMinor: debt.originalAmountMinor,
        currencyCode: debt.currencyCode,
        currentBalanceMinor: debt.currentBalanceMinor,
        workspaceAmountMinor: debt.workspaceAmountMinor,
        workspaceCurrencyCode: debt.workspaceCurrencyCode,
        workspaceBalanceMinor: debt.workspaceBalanceMinor,
        workspaceMonthlyAmountMinor: debt.workspaceMonthlyAmountMinor,
        workspaceResidualValueMinor: debt.workspaceResidualValueMinor,
        interestRateBps: debt.interestRateBps,
        termMonths: debt.termMonths,
        monthlyAmountMinor: debt.monthlyAmountMinor,
        residualValueMinor: debt.residualValueMinor,
        frequency: debt.frequency,
        interval: debt.interval,
        anchorDays: debt.anchorDays,
        nextPaymentDate: debt.nextPaymentDate?.toISOString().slice(0, 10) ?? null,
        openedAt: debt.openedAt.toISOString().slice(0, 10),
        isActive: debt.isActive,
        notes: debt.notes,
        createdAt: debt.createdAt.toISOString(),
        updatedAt: debt.updatedAt.toISOString(),
      }}
      payments={debt.payments.map((p) => ({
        id: p.id,
        originalAmountMinor: p.originalAmountMinor,
        originalCurrencyCode: p.originalCurrencyCode,
        workspaceAmountMinor: p.workspaceAmountMinor,
        workspaceCurrencyCode: p.workspaceCurrencyCode,
        paymentDate: p.paymentDate.toISOString().slice(0, 10),
        dueDate: p.dueDate?.toISOString().slice(0, 10) ?? null,
        notes: p.notes,
        paidByLabel: p.paidByUser.name || p.paidByUser.email,
        expenseId: p.expense?.id ?? null,
      }))}
      monthStatus={{
        dueCount: monthStatus.dueCount,
        paidCount: monthStatus.paidCount,
        unpaidCount: monthStatus.unpaidCount,
        unpaidDueDates: monthStatus.unpaidDueDates.map((d) => d.toISOString().slice(0, 10)),
      }}
      currencies={supportedCurrencies}
      baseCurrencyCode={workspace.baseCurrencyCode}
      canManage={canManage}
    />
  );
}
