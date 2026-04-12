import { createDebtAccountAction, createDebtPaymentAction } from "@/app/(app)/workspaces/[workspaceSlug]/debts/actions";
import { supportedCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc-caller";
import { Landmark, CreditCard, Plus } from "lucide-react";

type DebtsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

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
            <form action={createDebtAccountAction} className="mt-5 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Name</span>
                <input name="name" required placeholder="Renovation loan" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Provider</span>
                <input name="provider" placeholder="Optional lender or bank" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Original amount</span>
                <input name="originalAmount" type="number" min="0.01" step="0.01" required placeholder="10000" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-heading">Currency</span>
                  <select name="currencyCode" defaultValue={workspace.baseCurrencyCode} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                    {supportedCurrencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-heading">Opened at</span>
                  <input name="openedAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Notes</span>
                <textarea name="notes" rows={2} placeholder="Optional notes" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>

              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90">
                <Plus size={16} />
                Create Account
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-heading">Record payment</h2>
            <form action={createDebtPaymentAction} className="mt-5 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Debt account</span>
                <select name="debtAccountId" required className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                  <option value="">Select account</option>
                  {debts.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>{d.name} · {d.currencyCode}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Payment amount</span>
                <input name="amount" type="number" min="0.01" step="0.01" required placeholder="300" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-heading">Currency</span>
                  <select name="currencyCode" defaultValue={workspace.baseCurrencyCode} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                    {supportedCurrencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-heading">Payment date</span>
                  <input name="paymentDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Notes</span>
                <textarea name="notes" rows={2} placeholder="Optional notes" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>

              <label className="flex items-center gap-3 text-sm text-heading">
                <input name="createLinkedExpense" type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-primary" />
                <span>Create a linked expense record</span>
              </label>

              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90">
                <Plus size={16} />
                Record Payment
              </button>
            </form>
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

              return (
                <div key={debt.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-heading">{debt.name}</p>
                        <p className="text-xs text-muted">{debt.provider || "No provider"} · opened {new Date(debt.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${debt.isActive ? "bg-posted-bg text-posted" : "bg-surface-secondary text-muted"}`}>
                      {debt.isActive ? "Active" : "Archived"}
                    </span>
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

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
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
