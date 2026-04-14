import Link from "next/link";
import { createDebtAccountAction, createDebtPaymentAction } from "@/app/(app)/workspaces/[workspaceSlug]/debts/actions";
import { DebtAccountModal } from "@/components/debt/debt-account-modal";
import { DebtGroupSection } from "@/components/debt/debt-group-section";
import { DebtPaymentModal } from "@/components/debt/debt-payment-modal";
import { DebtSummaryBar } from "@/components/debt/debt-summary-bar";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";
import { Landmark, Users, Car, Plus, CreditCard } from "lucide-react";

type DebtsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string; modal?: string; debtId?: string }>;
};

export default async function DebtsPage({ params, searchParams }: DebtsPageProps) {
  const { workspaceSlug } = await params;
  const { error } = await searchParams;
  const caller = await getServerCaller();
  const now = new Date();
  const [workspace, debts, monthStatus] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.debts.list({ workspaceSlug }),
    caller.debts.monthStatus({ workspaceSlug, year: now.getFullYear(), month: now.getMonth() }),
  ]);

  if (!workspace) {
    return null;
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";

  // Serialize debts to strip Decimal objects (not serializable to client components)
  const serializedDebts = debts.map((d) => ({
    id: d.id,
    kind: d.kind,
    direction: d.direction,
    name: d.name,
    provider: d.provider,
    counterparty: d.counterparty,
    originalAmountMinor: d.originalAmountMinor,
    currencyCode: d.currencyCode,
    currentBalanceMinor: d.currentBalanceMinor,
    interestRateBps: d.interestRateBps,
    termMonths: d.termMonths,
    monthlyAmountMinor: d.monthlyAmountMinor,
    nextPaymentDate: d.nextPaymentDate,
    isActive: d.isActive,
    payments: d.payments.map((p) => ({ id: p.id })),
  }));

  // Group debts
  const iOweDebts = serializedDebts.filter((d) => d.direction === "i_owe" && d.kind !== "leasing");
  const theyOweMeDebts = serializedDebts.filter((d) => d.direction === "they_owe_me");
  const leasingDebts = serializedDebts.filter((d) => d.kind === "leasing");

  // Summary stats
  const activeDebts = serializedDebts.filter((d) => d.isActive);
  const totalIOwe = activeDebts
    .filter((d) => d.direction === "i_owe" && d.kind !== "leasing")
    .reduce((sum, d) => sum + d.currentBalanceMinor, 0);
  const totalOwedToMe = activeDebts
    .filter((d) => d.direction === "they_owe_me")
    .reduce((sum, d) => sum + d.currentBalanceMinor, 0);
  const totalLeasing = activeDebts
    .filter((d) => d.kind === "leasing")
    .reduce((sum, d) => sum + d.currentBalanceMinor, 0);

  // Serialize monthStatus dates for client components
  const serializedMonthStatus: Record<string, {
    dueCount: number;
    paidCount: number;
    unpaidCount: number;
    nextUnpaidDate: string | null;
    unpaidDueDates: string[];
  }> = {};
  let monthlyPaymentsDue = 0;
  let monthlyPaymentsPaid = 0;
  for (const [id, status] of Object.entries(monthStatus)) {
    monthlyPaymentsDue += status.dueCount;
    monthlyPaymentsPaid += status.paidCount;
    serializedMonthStatus[id] = {
      dueCount: status.dueCount,
      paidCount: status.paidCount,
      unpaidCount: status.unpaidCount,
      nextUnpaidDate: status.nextUnpaidDate?.toISOString().slice(0, 10) ?? null,
      unpaidDueDates: status.unpaidDueDates.map((d) => d.toISOString().slice(0, 10)),
    };
  }

  const activeAccounts = debts.map((d) => {
    const status = serializedMonthStatus[d.id];
    return {
      id: d.id,
      name: d.name,
      currencyCode: d.currencyCode,
      isActive: d.isActive,
      monthlyAmountMinor: d.monthlyAmountMinor,
      unpaidDueDates: status?.unpaidDueDates ?? [],
    };
  });

  const hasAnyDebt = serializedDebts.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Debts</h1>
          <p className="mt-2 text-sm text-body">Track debt accounts, loans, and leases.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Link
              href={`${routes.workspaceDebts(workspaceSlug)}?modal=record-payment`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-surface-secondary"
            >
              <CreditCard size={16} />
              Record Payment
            </Link>
            <Link
              href={`${routes.workspaceDebts(workspaceSlug)}?modal=add-debt`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-heading px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90"
            >
              <Plus size={16} />
              Add Debt
            </Link>
          </div>
        )}
      </div>

      {error && (
        <section className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </section>
      )}

      {/* Summary bar */}
      {hasAnyDebt && (
        <DebtSummaryBar
          totalIOwe={totalIOwe}
          totalOwedToMe={totalOwedToMe}
          totalLeasing={totalLeasing}
          baseCurrencyCode={workspace.baseCurrencyCode}
          monthlyPaymentsDue={monthlyPaymentsDue}
          monthlyPaymentsPaid={monthlyPaymentsPaid}
        />
      )}

      {/* Grouped sections */}
      <DebtGroupSection
        title="Liabilities"
        icon={<Landmark size={16} />}
        debts={iOweDebts}
        baseCurrencyCode={workspace.baseCurrencyCode}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
        quickPayAction={createDebtPaymentAction}
        monthStatusMap={serializedMonthStatus}
      />

      <DebtGroupSection
        title="Receivables"
        icon={<Users size={16} />}
        debts={theyOweMeDebts}
        baseCurrencyCode={workspace.baseCurrencyCode}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
        quickPayAction={createDebtPaymentAction}
        monthStatusMap={serializedMonthStatus}
      />

      <DebtGroupSection
        title="Leasing"
        icon={<Car size={16} />}
        debts={leasingDebts}
        baseCurrencyCode={workspace.baseCurrencyCode}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
        quickPayAction={createDebtPaymentAction}
        monthStatusMap={serializedMonthStatus}
      />

      {/* Empty state */}
      {!hasAnyDebt && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <Landmark size={24} />
          </div>
          <p className="mt-4 font-heading text-lg font-semibold text-heading">No debt accounts yet</p>
          <p className="mt-1 text-sm text-body">Add your first debt, loan, or lease to start tracking.</p>
          {canManage && (
            <Link
              href={`${routes.workspaceDebts(workspaceSlug)}?modal=add-debt`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-heading px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90"
            >
              <Plus size={16} />
              Add Debt
            </Link>
          )}
        </div>
      )}

      {/* Modals */}
      {canManage && (
        <>
          <DebtAccountModal
            workspaceSlug={workspaceSlug}
            baseCurrencyCode={workspace.baseCurrencyCode}
            currencies={supportedCurrencies}
            createDebtAccount={createDebtAccountAction}
          />
          <DebtPaymentModal
            workspaceSlug={workspaceSlug}
            baseCurrencyCode={workspace.baseCurrencyCode}
            currencies={supportedCurrencies}
            debtAccounts={activeAccounts}
            createDebtPayment={createDebtPaymentAction}
          />
        </>
      )}
    </div>
  );
}
