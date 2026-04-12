import Link from "next/link";
import { createRecurringTemplateAction } from "@/app/(app)/workspaces/[workspaceSlug]/recurring/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { supportedCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc-caller";
import { Plus, RefreshCw, Calendar } from "lucide-react";

type RecurringPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function RecurringPage({ params, searchParams }: RecurringPageProps) {
  const { workspaceSlug } = await params;
  const { error } = await searchParams;
  const caller = await getServerCaller();
  await caller.recurring.generateDue({ workspaceSlug });

  const [workspace, categories, templates, expenseResult] = await Promise.all([
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
  const generatedExpenses = expenseResult.items.filter((expense) => expense.type === "recurring_generated").slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Recurring</h1>
          <p className="mt-2 text-sm text-body">Manage templates that auto-generate expense entries.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-posted-bg px-3 py-1 text-xs font-semibold text-posted">{templates.length} active</span>
        </div>
      </div>

      {error ? (
        <section className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </section>
      ) : null}

      {/* Create form */}
      {canManage ? (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-heading">Create recurring template</h2>
          <form action={createRecurringTemplateAction} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Title</span>
              <input name="title" required placeholder="Internet bill" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Category</span>
              <select name="categoryId" required className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option value="">Select a category</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Amount</span>
              <input name="amount" type="number" min="0.01" step="0.01" required placeholder="49.99" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Currency</span>
              <select name="currencyCode" defaultValue={workspace.baseCurrencyCode} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                {supportedCurrencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Start date</span>
              <input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Frequency</span>
              <select name="frequency" defaultValue="monthly" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Interval</span>
              <input name="interval" type="number" min="1" max="24" defaultValue="1" required className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Generated status</span>
              <select name="defaultStatus" defaultValue="posted" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option value="planned">Planned</option>
                <option value="pending">Pending</option>
                <option value="posted">Posted</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm sm:col-span-2">
              <span className="font-medium text-heading">Description</span>
              <input name="description" placeholder="Optional short description" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>

            <label className="grid gap-1.5 text-sm sm:col-span-2">
              <span className="font-medium text-heading">Notes</span>
              <textarea name="notes" rows={2} placeholder="Optional notes" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>

            <div className="sm:col-span-2">
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90">
                <Plus size={16} />
                Create Template
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Templates list */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Templates</h2>
          <span className="text-sm text-muted">{templates.length} total</span>
        </div>

        {templates.length > 0 ? (
          <div className="divide-y divide-border">
            {templates.map((template) => {
              const categoryPath = template.category.parentCategory
                ? `${template.category.parentCategory.name} / ${template.category.name}`
                : template.category.name;

              return (
                <div key={template.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                    <RefreshCw size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-heading">{template.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{categoryPath} · every {template.interval} {template.frequency}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-heading">{formatMoney(template.originalAmountMinor, template.originalCurrencyCode)}</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <Calendar size={12} className="text-muted" />
                      <span className="text-xs text-muted">{new Date(template.nextOccurrenceDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">No recurring templates yet.</div>
        )}
      </section>

      {/* Generated expenses */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Recently Generated</h2>
          <span className="text-sm text-muted">{generatedExpenses.length} shown</span>
        </div>

        {generatedExpenses.length > 0 ? (
          <div className="divide-y divide-border">
            {generatedExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-heading">{expense.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{expense.categoryPath} · {new Date(expense.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-heading">{formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}</p>
                  <div className="mt-1">
                    <StatusBadge status={expense.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">No generated recurring expenses yet.</div>
        )}
      </section>
    </div>
  );
}
