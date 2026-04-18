import Link from "next/link";
import { createRecurringTemplateAction, markFixedAsPaidAction, recordVariableRecurringExpenseAction } from "@/app/(app)/workspaces/[workspaceSlug]/recurring/actions";
import { RecurringCard } from "@/components/recurring/recurring-card";
import { RecurringDueSection } from "@/components/recurring/recurring-due-section";
import { RecurringModal } from "@/components/recurring/recurring-modal";
import { RecurringSummaryStats } from "@/components/recurring/recurring-summary-stats";
import { StatusBadge } from "@/components/ui/status-badge";
import { supportedCurrencies } from "@/lib/currency";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { normalizeToMonthlyMinor } from "@/lib/recurring-display";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";
import { Plus, RefreshCw } from "lucide-react";

type RecurringPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ modal?: string }>;
};

export default async function RecurringPage({ params, searchParams }: RecurringPageProps) {
  const { workspaceSlug } = await params;
  await searchParams; // consume to avoid Next.js warnings
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

  // Serialize templates to strip Decimal objects (not serializable to client components)
  function serializeTemplate(t: (typeof templates)[number]) {
    return {
      id: t.id,
      kind: t.kind,
      title: t.title,
      originalAmountMinor: t.originalAmountMinor,
      originalCurrencyCode: t.originalCurrencyCode,
      workspaceAmountMinor: t.workspaceAmountMinor,
      workspaceCurrencyCode: t.workspaceCurrencyCode,
      frequency: t.frequency,
      interval: t.interval,
      anchorDays: t.anchorDays,
      nextOccurrenceDate: t.nextOccurrenceDate.toISOString(),
      lastGeneratedAt: t.lastGeneratedAt?.toISOString() ?? null,
      defaultStatus: t.defaultStatus,
      isActive: t.isActive,
      paymentUrl: t.paymentUrl,
      category: t.category,
    };
  }

  // Sort templates: active first (by nextOccurrenceDate), then inactive
  const activeTemplates = templates
    .filter((t) => t.isActive)
    .sort((a, b) => new Date(a.nextOccurrenceDate).getTime() - new Date(b.nextOccurrenceDate).getTime())
    .map(serializeTemplate);
  const inactiveTemplates = templates.filter((t) => !t.isActive).map(serializeTemplate);

  // Summary stats (computed from raw templates before serialization)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let totalMonthlyMinor = 0;
  let dueThisMonthMinor = 0;
  const rawActiveTemplates = templates
    .filter((t) => t.isActive)
    .sort((a, b) => new Date(a.nextOccurrenceDate).getTime() - new Date(b.nextOccurrenceDate).getTime());
  for (const t of rawActiveTemplates) {
    if (t.kind === "fixed_amount" && t.workspaceAmountMinor != null) {
      totalMonthlyMinor += normalizeToMonthlyMinor(t.workspaceAmountMinor, t.frequency, t.interval);
      const next = new Date(t.nextOccurrenceDate);
      if (next >= currentMonthStart && next <= currentMonthEnd) {
        dueThisMonthMinor += t.workspaceAmountMinor;
      }
    }
  }

  const nextPaymentTemplate = activeTemplates[0] ?? null;

  // Count and sum paid this month for recurring templates
  const recurringExpensesThisMonth = await db.expense.findMany({
    where: {
      workspaceId: workspace.id,
      recurringTemplateId: { not: null },
      expenseDate: { gte: currentMonthStart, lte: currentMonthEnd },
    },
    select: { recurringTemplateId: true, workspaceAmountMinor: true },
  });
  const paidTemplateIds = new Set(recurringExpensesThisMonth.map((e) => e.recurringTemplateId));
  let paidThisMonthMinor = 0;
  for (const e of recurringExpensesThisMonth) {
    paidThisMonthMinor += e.workspaceAmountMinor;
  }

  // Count how many active templates are expected to have occurrences this month
  let dueThisMonthCount = 0;
  let paidThisMonthCount = 0;
  for (const t of rawActiveTemplates) {
    const next = new Date(t.nextOccurrenceDate);
    const hasDueThisMonth = (next >= currentMonthStart && next <= currentMonthEnd) || paidTemplateIds.has(t.id);
    if (hasDueThisMonth) {
      dueThisMonthCount++;
      if (paidTemplateIds.has(t.id)) paidThisMonthCount++;
    }
  }

  // Recently generated expenses
  const generatedExpenses = expenseResult.items
    .filter((expense) => expense.type === "recurring_generated")
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Recurring</h1>
          <p className="mt-2 text-sm text-body">Manage templates that auto-generate expense entries.</p>
        </div>
        {canManage && (
          <Link
            href={`${routes.workspaceRecurring(workspaceSlug)}?modal=add-recurring`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-heading px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90"
          >
            <Plus size={16} />
            Add Recurring
          </Link>
        )}
      </div>

      {/* Summary stats */}
      {templates.length > 0 && (
        <RecurringSummaryStats
          dueThisMonthMinor={dueThisMonthMinor}
          paidThisMonthMinor={paidThisMonthMinor}
          baseCurrencyCode={workspace.baseCurrencyCode}
          nextPaymentDate={nextPaymentTemplate?.nextOccurrenceDate ?? null}
          nextPaymentTitle={nextPaymentTemplate?.title ?? null}
        />
      )}

      {/* Due / Action required section */}
      <RecurringDueSection
        dueVariableTemplates={dueVariableTemplates}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
        recordAction={recordVariableRecurringExpenseAction}
      />

      {/* Active templates card grid */}
      {activeTemplates.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-lg font-semibold text-heading">Active Templates</h2>
            <span className="rounded-full bg-posted-bg px-2.5 py-0.5 text-xs font-semibold text-posted">
              {activeTemplates.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeTemplates.map((template) => (
              <RecurringCard
                key={template.id}
                template={template}
                workspaceSlug={workspaceSlug}
                canManage={canManage}
                markPaidAction={markFixedAsPaidAction}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inactive templates */}
      {inactiveTemplates.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-base font-semibold text-body">Inactive Templates</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {inactiveTemplates.map((template) => (
              <RecurringCard
                key={template.id}
                template={template}
                workspaceSlug={workspaceSlug}
                canManage={canManage}
                markPaidAction={markFixedAsPaidAction}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {templates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <RefreshCw size={24} />
          </div>
          <p className="mt-4 font-heading text-lg font-semibold text-heading">No recurring templates yet</p>
          <p className="mt-1 text-sm text-body">Create your first template to auto-generate expenses.</p>
          {canManage && (
            <Link
              href={`${routes.workspaceRecurring(workspaceSlug)}?modal=add-recurring`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-heading px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90"
            >
              <Plus size={16} />
              Add Recurring
            </Link>
          )}
        </div>
      )}

      {/* Recently generated expenses */}
      {generatedExpenses.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-heading">Recently Generated</h2>
            <span className="text-sm text-body">{generatedExpenses.length} shown</span>
          </div>
          <div className="divide-y divide-border">
            {generatedExpenses.map((expense) => (
              <Link
                key={expense.id}
                href={routes.workspaceExpense(workspaceSlug, expense.id)}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-surface-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-heading">{expense.title}</p>
                  <p className="mt-0.5 text-xs text-body">
                    {expense.categoryPath} ·{" "}
                    {new Date(expense.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-heading">
                    {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={expense.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {canManage && (
        <RecurringModal
          workspaceSlug={workspaceSlug}
          baseCurrencyCode={workspace.baseCurrencyCode}
          categories={categoryTree}
          currencies={supportedCurrencies}
          createRecurring={createRecurringTemplateAction}
        />
      )}
    </div>
  );
}
