import { createDebtAccountAction, createDebtPaymentAction } from "@/app/(app)/workspaces/[workspaceSlug]/debts/actions";
import { DebtAccountForm } from "@/components/debt/debt-account-form";
import { DebtPaymentForm } from "@/components/debt/debt-payment-form";
import { supportedCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc-caller";
import { Landmark, Users, Car, CreditCard } from "lucide-react";

type DebtsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

const kindIcon: Record<string, typeof Landmark> = {
  bank_loan: Landmark,
  personal_loan: Users,
  leasing: Car,
};

const kindLabel: Record<string, string> = {
  bank_loan: "Bank Loan",
  personal_loan: "Personal",
  leasing: "Leasing",
};

function formatPercent(rate: number) {
  return (rate / 100).toFixed(2) + "%";
}

export default async function DebtsPage({ params, searchParams }: DebtsPageProps) {
  const { workspaceSlug } = await params;
  const { error } = await searchParams;
  const caller = await getServerCaller();
  const [workspace, debts] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.debts.list({ workspaceSlug }),
  ]);

  if (!workspace) {
    return null;
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";
  const totalDebt = debts.filter((d) => d.isActive).reduce((sum, d) => sum + d.currentBalanceMinor, 0);

  const activeAccounts = debts.map((d) => ({
    id: d.id,
    name: d.name,
    currencyCode: d.currencyCode,
    isActive: d.isActive,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Debts</h1>
          <p className="mt-2 text-sm text-body">Track debt accounts and record payments.</p>
        </div>
        {totalDebt > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Total remaining</p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-heading">{formatMoney(totalDebt, workspace.baseCurrencyCode)}</p>
          </div>
        )}
      </div>

      {error ? (
        <section className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </section>
      ) : null}

      {/* Create forms */}
      {canManage ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-heading">Create debt account</h2>
            <div className="mt-5">
              <DebtAccountForm
                workspaceSlug={workspaceSlug}
                baseCurrencyCode={workspace.baseCurrencyCode}
                currencies={supportedCurrencies}
                createDebtAccount={createDebtAccountAction}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-heading">Record payment</h2>
            <div className="mt-5">
              <DebtPaymentForm
                workspaceSlug={workspaceSlug}
                baseCurrencyCode={workspace.baseCurrencyCode}
                currencies={supportedCurrencies}
                debtAccounts={activeAccounts}
                createDebtPayment={createDebtPaymentAction}
              />
            </div>
          </section>
        </div>
      ) : null}

      {/* Debt accounts list */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Debt Accounts</h2>
          <span className="text-sm text-muted">{debts.length} total</span>
        </div>

        {debts.length > 0 ? (
          <div className="divide-y divide-border">
            {debts.map((debt) => {
              const paidPercent = debt.originalAmountMinor > 0
                ? Math.round(((debt.originalAmountMinor - debt.currentBalanceMinor) / debt.originalAmountMinor) * 100)
                : 0;

              const Icon = kindIcon[debt.kind] ?? CreditCard;
              const label = kindLabel[debt.kind] ?? "Debt";
              const isPersonal = debt.kind === "personal_loan";
              const theyOweMe = debt.direction === "they_owe_me";

              return (
                <div key={debt.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-heading">{debt.name}</p>
                          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                            {label}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          {isPersonal && debt.counterparty
                            ? theyOweMe
                              ? `${debt.counterparty} owes you`
                              : `You owe ${debt.counterparty}`
                            : debt.provider || "No provider"}
                          {" · opened "}
                          {new Date(debt.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {theyOweMe && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-primary">
                          Receivable
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${debt.isActive ? "bg-posted-bg text-posted" : "bg-surface-secondary text-muted"}`}>
                        {debt.isActive ? "Active" : "Archived"}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-body">Paid {paidPercent}%</span>
                      <span className="font-medium text-heading">{formatMoney(debt.currentBalanceMinor, debt.currencyCode)} remaining</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-surface-secondary">
                      <div className="h-2 rounded-full bg-gradient-to-r from-primary to-primary-dark" style={{ width: `${paidPercent}%` }} />
                    </div>
                  </div>

                  {/* Next payment due */}
                  {debt.nextPaymentDate && debt.isActive && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                      <span className="text-sm font-medium text-primary">Next payment due:</span>
                      <span className="text-sm font-semibold text-heading">
                        {new Date(debt.nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {debt.monthlyAmountMinor != null && (
                        <span className="ml-auto text-sm font-semibold text-heading">
                          {formatMoney(debt.monthlyAmountMinor, debt.currencyCode)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                    <div className="rounded-xl bg-surface-secondary p-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Original</p>
                      <p className="mt-1 font-semibold text-heading text-sm">{formatMoney(debt.originalAmountMinor, debt.currencyCode)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-secondary p-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Remaining</p>
                      <p className="mt-1 font-semibold text-heading text-sm">{formatMoney(debt.currentBalanceMinor, debt.currencyCode)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-secondary p-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payments</p>
                      <p className="mt-1 font-semibold text-heading text-sm">{debt.payments.length}</p>
                    </div>
                    {debt.interestRateBps != null && (
                      <div className="rounded-xl bg-surface-secondary p-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Interest</p>
                        <p className="mt-1 font-semibold text-heading text-sm">{formatPercent(debt.interestRateBps)}</p>
                      </div>
                    )}
                    {debt.termMonths != null && (
                      <div className="rounded-xl bg-surface-secondary p-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Term</p>
                        <p className="mt-1 font-semibold text-heading text-sm">{debt.termMonths}mo</p>
                      </div>
                    )}
                  </div>

                  {/* Recent payments */}
                  {debt.payments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {debt.payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
                          <div>
                            <p className="text-sm font-medium text-heading">{formatMoney(payment.originalAmountMinor, payment.originalCurrencyCode)}</p>
                            <p className="text-xs text-muted">{new Date(payment.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {payment.paidByUser.name || payment.paidByUser.email}</p>
                          </div>
                          <p className="text-xs text-muted">{formatMoney(payment.workspaceAmountMinor, payment.workspaceCurrencyCode)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">No debt accounts yet.</div>
        )}
      </section>
    </div>
  );
}
