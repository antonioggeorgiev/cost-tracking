import { notFound } from "next/navigation";
import { createCategoryAction } from "@/app/(app)/workspaces/[workspaceSlug]/categories/actions";
import { createExpenseAction } from "@/app/(app)/workspaces/[workspaceSlug]/expenses/actions";
import { QuickAddExpenseForm } from "@/components/quick-add/quick-add-expense-form";
import { RecentExpensesTable } from "@/components/quick-add/recent-expenses-table";
import { TypeSelector } from "@/components/quick-add/type-selector";
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

      {/* Type selector */}
      <TypeSelector />

      {/* Quick add form */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold text-heading">New Expense</h2>
          <p className="mt-1 text-sm text-muted-foreground">Record a new expense entry</p>
        </div>
        <QuickAddExpenseForm
          workspaceSlug={workspaceSlug}
          baseCurrencyCode={workspace.baseCurrencyCode}
          categories={categoryTree}
          currencies={supportedCurrencies}
          createExpense={createExpenseAction}
          createCategory={createCategoryAction}
        />
      </section>

      {/* Recent expenses table */}
      <RecentExpensesTable
        expenses={recentResult.items.map((e) => ({
          id: e.id,
          title: e.title,
          categoryPath: e.categoryPath,
          expenseDate: e.expenseDate.toISOString(),
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
