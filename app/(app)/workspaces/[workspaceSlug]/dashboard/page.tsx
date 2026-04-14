import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusCard } from "@/components/ui/status-card";
import { SpendingChart } from "@/components/charts/spending-chart";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";
import { FolderTree, Receipt, RefreshCw, Landmark, ExternalLink } from "lucide-react";

type DashboardPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

function timeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  return `${diffDay}d ago`;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspaceSlug } = await params;
  const caller = await getServerCaller();
  const [workspace, dashboard] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.reporting.dashboard({ workspaceSlug }),
  ]);

  if (!workspace) {
    notFound();
  }

  const heroAmount = formatMoney(dashboard.currentMonthTotal, dashboard.baseCurrencyCode);

  return (
    <>
      {/* Desktop: bento grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Hero + Chart — spans 8 cols on desktop */}
        <div className="space-y-6 lg:col-span-8">
          {/* Hero amount */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-body">Current Month Ledger</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-heading text-5xl font-extrabold tracking-tight text-heading lg:text-6xl">
                {heroAmount}
              </span>
            </div>
            <p className="mt-2 text-sm text-body">
              {dashboard.currentMonthExpenseCount} posted expenses · Previous month {formatMoney(dashboard.previousMonthTotal, dashboard.baseCurrencyCode)}
            </p>
          </section>

          {/* Spending chart */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-heading">Weekly Spending</h2>
            <div className="mt-4">
              <SpendingChart data={dashboard.weeklySpending} currencyCode={dashboard.baseCurrencyCode} />
            </div>
          </section>
        </div>

        {/* Sidebar — spans 4 cols on desktop */}
        <div className="space-y-6 lg:col-span-4">
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <StatusCard
              label="Pending"
              value={formatMoney(dashboard.pendingTotal, dashboard.baseCurrencyCode)}
              helpText="Awaiting confirmation"
              variant="pending"
            />
            <StatusCard
              label="Planned"
              value={formatMoney(dashboard.plannedTotal, dashboard.baseCurrencyCode)}
              helpText="Future expenses"
              variant="planned"
            />
          </div>

          {/* Top Categories */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-heading">Top Categories</h2>
            <div className="mt-4 space-y-3">
              {dashboard.categoryPercentages.length > 0 ? (
                dashboard.categoryPercentages.slice(0, 5).map((entry) => (
                  <div key={entry.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-body">{entry.label}</span>
                      <span className="font-medium text-heading">{entry.percentage}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-surface-secondary">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary-dark"
                        style={{ width: `${entry.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-body">No category data this month.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold text-heading">Due Variable Bills</h2>
              <Link href={routes.workspaceRecurring(workspace.slug)} className="text-sm font-medium text-primary hover:underline">
                Open recurring
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {dashboard.dueVariableRecurring.length > 0 ? (
                dashboard.dueVariableRecurring.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-heading">{item.title}</p>
                        <p className="mt-1 text-xs text-body">{item.categoryPath}</p>
                        <p className="mt-1 text-xs text-body">
                          Due {new Date(item.nextOccurrenceDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      {item.paymentUrl ? (
                        <Link href={item.paymentUrl} target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          Pay
                          <ExternalLink size={12} />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-body">No variable bills need an amount right now.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Recent Activity */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-base font-semibold text-heading">Recent Activity</h2>
          <Link
            href={routes.workspaceExpenses(workspace.slug)}
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 divide-y divide-border">
          {dashboard.recentExpenses.length > 0 ? (
            dashboard.recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                  <FolderTree size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-heading">{expense.title}</p>
                    <StatusBadge status={expense.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-body">
                    {expense.categoryPath} · {timeAgo(expense.expenseDate)}
                  </p>
                </div>
                <p className="shrink-0 font-medium text-heading">
                  {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}
                </p>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-body">No activity yet.</div>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Expenses", desc: "Track purchases and costs", href: routes.workspaceExpenses(workspace.slug), icon: Receipt },
          { title: "Recurring", desc: "Manage recurring templates", href: routes.workspaceRecurring(workspace.slug), icon: RefreshCw },
          { title: "Debts", desc: "Track debt accounts", href: routes.workspaceDebts(workspace.slug), icon: Landmark },
          { title: "Categories", desc: "Manage categories", href: routes.workspaceCategories(workspace.slug), icon: FolderTree },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.title}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-primary-light hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-lighter text-primary">
                <Icon size={18} />
              </div>
              <div>
                <h3 className="font-medium text-heading">{link.title}</h3>
                <p className="text-sm text-body">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
