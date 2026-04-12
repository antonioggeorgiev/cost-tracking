import { createExpenseAction } from "@/app/(app)/app/[workspaceSlug]/expenses/actions";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { supportedCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc-caller";

type ExpensesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ExpensesPage({ params, searchParams }: ExpensesPageProps) {
  const { workspaceSlug } = await params;
  const { error } = await searchParams;
  const caller = await getServerCaller();
  const [workspace, categories, expenses] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.categories.list({ workspaceSlug }),
    caller.expenses.list({ workspaceSlug }),
  ]);

  if (!workspace) {
    return null;
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";
  const categoryOptions = categories.flatMap((category) => [
    { id: category.id, label: category.name },
    ...category.children.map((child) => ({ id: child.id, label: `${category.name} / ${child.name}` })),
  ]);

  return (
    <div className="space-y-6">
      <section className="card rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">{workspace.name}</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Expenses</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              One-time expenses are now workspace-scoped and store both original and workspace-normalized currency amounts.
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
        <section className="card rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white">Create expense</h2>
          <form action={createExpenseAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Title</span>
              <input name="title" required placeholder="Tiles for bathroom" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Category</span>
              <select name="categoryId" required className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                <option value="">Select a category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Amount</span>
              <input name="amount" type="number" min="0.01" step="0.01" required placeholder="199.99" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
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
              <span>Expense date</span>
              <input name="expenseDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none" />
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Status</span>
              <select name="status" defaultValue="posted" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                <option value="planned">Planned</option>
                <option value="pending">Pending</option>
                <option value="posted">Posted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
              <span>Description</span>
              <input name="description" placeholder="Optional short description" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
            </label>

            <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
              <span>Notes</span>
              <textarea name="notes" rows={3} placeholder="Optional notes" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
            </label>

            <div className="md:col-span-2">
              <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">Create expense</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Recent expenses</h2>
          <p className="text-sm text-slate-400">{expenses.length} total</p>
        </div>

        <div className="mt-6 space-y-3">
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <div key={expense.id} className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{expense.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{expense.categoryPath} · {new Date(expense.expenseDate).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm text-slate-400">Created by {expense.createdByLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">
                      {formatMoney(expense.originalAmountMinor, expense.originalCurrencyCode)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)} workspace value
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{expense.status}</p>
                  </div>
                </div>
                {expense.description ? <p className="mt-4 text-sm text-slate-300">{expense.description}</p> : null}
                {expense.notes ? <p className="mt-2 text-sm text-slate-400">{expense.notes}</p> : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
              No expenses yet. Create the first expense for this workspace.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
