import { notFound } from "next/navigation";
import { createExpenseAction } from "@/app/(app)/workspaces/[workspaceSlug]/expenses/actions";
import { createDebtAccountAction } from "@/app/(app)/workspaces/[workspaceSlug]/debts/actions";
import { createRecurringTemplateAction } from "@/app/(app)/workspaces/[workspaceSlug]/recurring/actions";
import { QuickAddPanel } from "@/components/quick-add/quick-add-panel";
import { RecentExpensesTable } from "@/components/quick-add/recent-expenses-table";
import { supportedCurrencies } from "@/lib/currency";
import { getServerCaller } from "@/server/trpc-caller";

type WorkspacePageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function WorkspacePage({ params, searchParams }: WorkspacePageProps) {
  const { workspaceSlug } = await params;
  const sp = await searchParams;
  const caller = await getServerCaller();

  const [workspace, categories, recentResult] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.categories.list({ workspaceSlug }),
    caller.expenses.list({ workspaceSlug, page: 1, perPage: 5 }),
  ]);

  if (!workspace) {
    notFound();
  }

  const categoryTree = categories.map((c) => ({
    id: c.id,
    name: c.name,
    children: c.children.map((child) => ({ id: child.id, name: child.name })),
  }));

  return (
    <div className="space-y-6">
      {sp.error ? (
        <section className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(sp.error)}
        </section>
      ) : null}

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Quick Add</h1>
      </div>

      <QuickAddPanel
        workspaceSlug={workspaceSlug}
        baseCurrencyCode={workspace.baseCurrencyCode}
        categories={categoryTree}
        currencies={supportedCurrencies}
        createExpense={createExpenseAction}
        createRecurring={createRecurringTemplateAction}
        createDebtAccount={createDebtAccountAction}
      />

      {/* Recent expenses table */}
      <RecentExpensesTable
        expenses={recentResult.items.map((e) => ({
          id: e.id,
          title: e.title,
          categoryPath: e.categoryPath,
          expenseDate: e.expenseDate.toISOString(),
          createdAt: e.createdAt.toISOString(),
          originalAmountMinor: e.originalAmountMinor,
          originalCurrencyCode: e.originalCurrencyCode,
          workspaceAmountMinor: e.workspaceAmountMinor,
          workspaceCurrencyCode: e.workspaceCurrencyCode,
          status: e.status,
        }))}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
