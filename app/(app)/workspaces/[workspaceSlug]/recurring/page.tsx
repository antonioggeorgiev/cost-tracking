import Link from "next/link";
import { createCategoryAction } from "@/app/(app)/workspaces/[workspaceSlug]/categories/actions";
import { createRecurringTemplateAction, recordVariableRecurringExpenseAction } from "@/app/(app)/workspaces/[workspaceSlug]/recurring/actions";
import { RecordVariableRecurringForm } from "@/components/recurring/record-variable-recurring-form";
import { RecurringTemplateForm } from "@/components/recurring/recurring-template-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { supportedCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc-caller";
import { RefreshCw, Calendar, ExternalLink } from "lucide-react";

type RecurringPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function RecurringPage({ params }: RecurringPageProps) {
  const { workspaceSlug } = await params;
  const caller = await getServerCaller();
  await caller.recurring.generateDue({ workspaceSlug });

  const [workspace, categories, templates, dueVariableTemplates, expenseResult] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.categories.list({ workspaceSlug }),
    caller.recurring.list({ workspaceSlug }),
    caller.recurring.dueVariable({ workspaceSlug }),
    caller.expenses.list({ workspaceSlug }),
  ]);

  if (!workspace) {
    return null;
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";
  const categoryTree = categories.map((category) => ({
    id: category.id,
    name: category.name,
    children: category.children.map((child) => ({ id: child.id, name: child.name })),
  }));
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

      {canManage ? (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-heading">Create recurring template</h2>
          <div className="mt-5">
            <RecurringTemplateForm
              workspaceSlug={workspaceSlug}
              baseCurrencyCode={workspace.baseCurrencyCode}
              categories={categoryTree}
              currencies={supportedCurrencies}
              createRecurring={createRecurringTemplateAction}
              createCategory={createCategoryAction}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Due variable bills</h2>
          <span className="text-sm text-muted">{dueVariableTemplates.length} due</span>
        </div>

        {dueVariableTemplates.length > 0 ? (
          <div className="divide-y divide-border">
            {dueVariableTemplates.map((template) => {
              const categoryPath = template.category.parentCategory
                ? `${template.category.parentCategory.name} / ${template.category.name}`
                : template.category.name;

              return (
                <div key={template.id} className="space-y-4 px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-heading">{template.title}</p>
                        <span className="rounded-full bg-pending-bg px-2 py-0.5 text-xs font-semibold text-pending-badge">Variable</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{categoryPath}</p>
                      <p className="mt-1 text-xs text-muted">
                        Due {new Date(template.nextOccurrenceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {template.paymentUrl ? (
                      <Link href={template.paymentUrl} target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                        Payment link
                        <ExternalLink size={14} />
                      </Link>
                    ) : null}
                  </div>

                  {canManage ? (
                    <RecordVariableRecurringForm
                      workspaceSlug={workspaceSlug}
                      templateId={template.id}
                      currencyCode={template.originalCurrencyCode}
                      action={recordVariableRecurringExpenseAction}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">No variable recurring bills are due right now.</div>
        )}
      </section>

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
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-heading">{template.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {template.kind === "fixed_amount" ? "Fixed" : "Variable"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{categoryPath} · every {template.interval} {template.frequency}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                        {template.endDate ? <span>Ends {new Date(template.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> : <span>Infinite schedule</span>}
                        {template.paymentUrl ? (
                          <Link href={template.paymentUrl} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
                            Payment link
                            <ExternalLink size={12} />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium text-heading">
                        {template.originalAmountMinor !== null
                          ? formatMoney(template.originalAmountMinor, template.originalCurrencyCode)
                          : "Amount set when due"}
                      </p>
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
