import { createRecurringTemplateAction } from "@/app/(app)/app/[workspaceSlug]/recurring/actions";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { supportedCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc-caller";

type RecurringPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function RecurringPage({ params, searchParams }: RecurringPageProps) {
  const { workspaceSlug } = await params;
  const { error } = await searchParams;
  const caller = await getServerCaller();
  await caller.recurring.generateDue({ workspaceSlug });

  const [workspace, categories, templates, expenses] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.categories.list({ workspaceSlug }),
    caller.recurring.list({ workspaceSlug }),
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
  const generatedExpenses = expenses.filter((expense) => expense.type === "recurring_generated").slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="card rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">{workspace.name}</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Recurring</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Recurring templates generate concrete expense rows when they become due. This page lazily generates due expenses on load.
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
          <h2 className="text-xl font-semibold text-white">Create recurring template</h2>
          <form action={createRecurringTemplateAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Title</span>
              <input name="title" required placeholder="Internet bill" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
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
              <input name="amount" type="number" min="0.01" step="0.01" required placeholder="49.99" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
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
              <span>Start date</span>
              <input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none" />
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Frequency</span>
              <select name="frequency" defaultValue="monthly" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Interval</span>
              <input name="interval" type="number" min="1" max="24" defaultValue="1" required className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none" />
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Generated expense status</span>
              <select name="defaultStatus" defaultValue="posted" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
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
              <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">Create recurring template</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Templates</h2>
          <p className="text-sm text-slate-400">{templates.length} total</p>
        </div>

        <div className="mt-6 space-y-3">
          {templates.length > 0 ? (
            templates.map((template) => {
              const categoryPath = template.category.parentCategory
                ? `${template.category.parentCategory.name} / ${template.category.name}`
                : template.category.name;

              return (
                <div key={template.id} className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{template.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{categoryPath} · every {template.interval} {template.frequency}</p>
                      <p className="mt-1 text-sm text-slate-400">Next occurrence {new Date(template.nextOccurrenceDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">{formatMoney(template.originalAmountMinor, template.originalCurrencyCode)}</p>
                      <p className="mt-1 text-sm text-slate-400">{formatMoney(template.workspaceAmountMinor, template.workspaceCurrencyCode)} workspace value</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{template.defaultStatus}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
              No recurring templates yet.
            </div>
          )}
        </div>
      </section>

      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Recently generated expenses</h2>
          <p className="text-sm text-slate-400">{generatedExpenses.length} shown</p>
        </div>

        <div className="mt-6 space-y-3">
          {generatedExpenses.length > 0 ? (
            generatedExpenses.map((expense) => (
              <div key={expense.id} className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{expense.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{expense.categoryPath} · {new Date(expense.expenseDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">{formatMoney(expense.originalAmountMinor, expense.originalCurrencyCode)}</p>
                    <p className="mt-1 text-sm text-slate-400">{formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)} workspace value</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
              No generated recurring expenses yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
