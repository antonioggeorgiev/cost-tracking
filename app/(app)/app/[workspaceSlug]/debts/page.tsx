import { createDebtAccountAction, createDebtPaymentAction } from "@/app/(app)/app/[workspaceSlug]/debts/actions";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { supportedCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc-caller";

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

  return (
    <div className="space-y-6">
      <section className="card rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">{workspace.name}</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Debts</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Debt accounts are visible to the whole workspace. Payments update balances and can optionally create linked expense records.
            </p>
          </div>
          <MemberRoleBadge role={role} />
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {decodeURIComponent(error)}
        </section>
      ) : null}

      {canManage ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <section className="card rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white">Create debt account</h2>
            <form action={createDebtAccountAction} className="mt-6 grid gap-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Name</span>
                <input name="name" required placeholder="Renovation loan" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Provider</span>
                <input name="provider" placeholder="Optional lender or bank" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Original amount</span>
                <input name="originalAmount" type="number" min="0.01" step="0.01" required placeholder="10000" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Currency</span>
                <select name="currencyCode" defaultValue={workspace.baseCurrencyCode} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                  {supportedCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Opened at</span>
                <input name="openedAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none" />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Notes</span>
                <textarea name="notes" rows={3} placeholder="Optional notes" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              </label>

              <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">Create debt account</button>
            </form>
          </section>

          <section className="card rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white">Record debt payment</h2>
            <form action={createDebtPaymentAction} className="mt-6 grid gap-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Debt account</span>
                <select name="debtAccountId" required className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                  <option value="">Select a debt account</option>
                  {debts.filter((debt) => debt.isActive).map((debt) => (
                    <option key={debt.id} value={debt.id}>
                      {debt.name} · {debt.currencyCode}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Payment amount</span>
                <input name="amount" type="number" min="0.01" step="0.01" required placeholder="300" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Currency</span>
                <select name="currencyCode" defaultValue={workspace.baseCurrencyCode} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                  {supportedCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Payment date</span>
                <input name="paymentDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none" />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Notes</span>
                <textarea name="notes" rows={3} placeholder="Optional notes" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input name="createLinkedExpense" type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/10 bg-slate-950/40" />
                <span>Create a linked expense record for this payment</span>
              </label>

              <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">Record payment</button>
            </form>
          </section>
        </section>
      ) : null}

      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Debt accounts</h2>
          <p className="text-sm text-slate-400">{debts.length} total</p>
        </div>

        <div className="mt-6 space-y-4">
          {debts.length > 0 ? (
            debts.map((debt) => (
              <div key={debt.id} className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{debt.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {debt.provider || "No provider"} · opened {new Date(debt.openedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-slate-300">
                    {debt.isActive ? "Active" : "Archived"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Original</p>
                    <p className="mt-2 font-semibold text-white">{formatMoney(debt.originalAmountMinor, debt.currencyCode)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Remaining</p>
                    <p className="mt-2 font-semibold text-white">{formatMoney(debt.currentBalanceMinor, debt.currencyCode)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Payments</p>
                    <p className="mt-2 font-semibold text-white">{debt.payments.length}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {debt.payments.length > 0 ? (
                    debt.payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-slate-100">{formatMoney(payment.originalAmountMinor, payment.originalCurrencyCode)}</p>
                            <p className="mt-1 text-sm text-slate-400">
                              {new Date(payment.paymentDate).toLocaleDateString()} · {payment.paidByUser.name || payment.paidByUser.email}
                            </p>
                          </div>
                          <p className="text-sm text-slate-400">
                            {formatMoney(payment.workspaceAmountMinor, payment.workspaceCurrencyCode)} workspace value
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-slate-400">
                      No payments recorded yet.
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
              No debt accounts yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
