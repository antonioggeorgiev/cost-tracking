import Link from "next/link";
import { createCategoryAction } from "@/app/(app)/workspaces/[workspaceSlug]/categories/actions";
import { createExpenseAction } from "@/app/(app)/workspaces/[workspaceSlug]/expenses/actions";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseModal } from "@/components/expenses/expense-modal";
import { MonthSummaryBar } from "@/components/shared/month-summary-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { supportedCurrencies } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";
import { Search, Download, Plus, Receipt } from "lucide-react";

type ExpensesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{
    error?: string;
    modal?: string;
    search?: string;
    status?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    period?: string;
    page?: string;
  }>;
};

function getDefaultMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dateFrom = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { dateFrom, dateTo };
}

export default async function ExpensesPage({ params, searchParams }: ExpensesPageProps) {
  const { workspaceSlug } = await params;
  const sp = await searchParams;
  const caller = await getServerCaller();

  const currentPage = sp.page ? parseInt(sp.page, 10) : 1;

  // Default to current month unless "all" period or explicit dates are set
  const isAllTime = sp.period === "all";
  const defaultRange = getDefaultMonthRange();
  const effectiveDateFrom = isAllTime ? undefined : (sp.dateFrom || defaultRange.dateFrom);
  const effectiveDateTo = isAllTime ? undefined : (sp.dateTo || defaultRange.dateTo);

  const [workspace, categories, expenseResult, monthSummary] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.categories.list({ workspaceSlug }),
    caller.expenses.list({
      workspaceSlug,
      search: sp.search || undefined,
      status: sp.status || undefined,
      categoryId: sp.categoryId || undefined,
      dateFrom: effectiveDateFrom,
      dateTo: effectiveDateTo,
      page: currentPage,
      perPage: 20,
    }),
    caller.reporting.expenseMonthSummary({ workspaceSlug }),
  ]);

  if (!workspace) {
    return null;
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";
  const categoryOptions = categories.flatMap((category) => [
    { value: category.id, label: category.name },
    ...category.children.map((child) => ({ value: child.id, label: `${category.name} / ${child.name}` })),
  ]);
  const categoryTree = categories.map((c) => ({
    id: c.id,
    name: c.name,
    children: c.children.map((child) => ({ id: child.id, name: child.name })),
  }));

  const { items: expenses, total, totalAmount, page, totalPages } = expenseResult;
  const startIdx = (page - 1) * 20 + 1;
  const endIdx = Math.min(page * 20, total);

  const hasFilters = !!(sp.search || sp.status || sp.categoryId || sp.dateFrom || sp.dateTo || sp.period);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const base: Record<string, string> = {};
    if (sp.search) base.search = sp.search;
    if (sp.status) base.status = sp.status;
    if (sp.categoryId) base.categoryId = sp.categoryId;
    if (sp.dateFrom) base.dateFrom = sp.dateFrom;
    if (sp.dateTo) base.dateTo = sp.dateTo;
    if (sp.period) base.period = sp.period;
    const merged = { ...base, ...overrides };
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined) filtered[k] = v;
    }
    const qs = new URLSearchParams(filtered).toString();
    return `${routes.workspaceExpenses(workspaceSlug)}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      {sp.error ? (
        <section className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(sp.error)}
        </section>
      ) : null}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Expenses</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-heading transition hover:bg-surface-secondary">
            <Download size={16} />
            Export
          </button>
          {canManage ? (
            <Link
              href={`${routes.workspaceExpenses(workspaceSlug)}?modal=add-expense`}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus size={16} />
              New Entry
            </Link>
          ) : null}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <form className="relative flex-1 min-w-[200px]" action={routes.workspaceExpenses(workspaceSlug)}>
            {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
            {sp.categoryId ? <input type="hidden" name="categoryId" value={sp.categoryId} /> : null}
            {sp.dateFrom ? <input type="hidden" name="dateFrom" value={sp.dateFrom} /> : null}
            {sp.dateTo ? <input type="hidden" name="dateTo" value={sp.dateTo} /> : null}
            {sp.period ? <input type="hidden" name="period" value={sp.period} /> : null}
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              name="search"
              type="text"
              defaultValue={sp.search ?? ""}
              placeholder="Search expenses..."
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-heading outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </form>
        </div>

        <ExpenseFilters categories={categoryOptions} workspaceSlug={workspaceSlug} />
      </div>

      {/* Monthly summary stats */}
      {monthSummary.totalMinor > 0 && (
        <MonthSummaryBar
          dueAmountMinor={monthSummary.totalMinor}
          paidAmountMinor={monthSummary.postedMinor}
          baseCurrencyCode={workspace.baseCurrencyCode}
          bonusMetric={monthSummary.pendingCount > 0 ? {
            label: "Pending",
            value: `${monthSummary.pendingCount}`,
            subtext: formatMoney(monthSummary.pendingMinor, workspace.baseCurrencyCode),
          } : undefined}
        />
      )}

      {/* Expense table/list */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        {/* Table header (desktop) */}
        <div className="hidden border-b border-border px-6 py-3 sm:grid sm:grid-cols-[1fr_100px_100px_120px_80px] sm:gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Date</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Created</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-right">Amount</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-right">Status</span>
        </div>

        {expenses.length > 0 ? (
          <div className="divide-y divide-border">
            {expenses.map((expense) => (
              <Link
                key={expense.id}
                href={routes.workspaceExpense(workspaceSlug, expense.id)}
                className="block px-6 py-3.5 transition hover:bg-surface-secondary sm:grid sm:grid-cols-[1fr_100px_100px_120px_80px] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-heading">{expense.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{expense.categoryPath} · {expense.createdByLabel}</p>
                </div>
                <p className="mt-1 text-sm text-body sm:mt-0">
                  {new Date(expense.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="mt-1 text-sm text-body sm:mt-0">
                  {new Date(expense.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <div className="mt-1 sm:mt-0 sm:text-right">
                  <p className="font-medium text-heading">
                    {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 sm:text-right">
                  <StatusBadge status={expense.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Receipt size={40} className="mx-auto text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-heading">
              {hasFilters ? "No expenses match your filters" : "No expenses yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters
                ? "Try adjusting your search or filter criteria."
                : "Create the first expense for this workspace."}
            </p>
            {!hasFilters && canManage && (
              <Link
                href={`${routes.workspaceExpenses(workspaceSlug)}?modal=add-expense`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-heading px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90"
              >
                <Plus size={16} />
                Add Expense
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {startIdx}-{endIdx} of {total}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-heading hover:bg-surface-secondary"
                >
                  Prev
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <Link
                    key={p}
                    href={buildUrl({ page: p === 1 ? undefined : String(p) })}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      p === page
                        ? "bg-primary text-on-primary"
                        : "text-heading hover:bg-surface-secondary"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-heading hover:bg-surface-secondary"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Expense Modal */}
      {canManage ? (
        <ExpenseModal
          workspaceSlug={workspaceSlug}
          baseCurrencyCode={workspace.baseCurrencyCode}
          categories={categoryTree}
          currencies={supportedCurrencies}
          createExpense={createExpenseAction}
          createCategory={createCategoryAction}
        />
      ) : null}
    </div>
  );
}
