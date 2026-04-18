import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { SpendingChart } from "@/components/charts/spending-chart";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { getSelectedSpaceSlug } from "@/lib/space-context";
import { getServerCaller } from "@/server/trpc-caller";
import {
  Receipt, RefreshCw, Landmark, ExternalLink, FolderTree,
  TrendingUp, TrendingDown, ArrowRight, AlertCircle, Clock, Calendar, Users,
} from "lucide-react";

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

export default async function OverviewPage() {
  const spaceSlug = await getSelectedSpaceSlug();

  if (!spaceSlug) {
    const caller = await getServerCaller();
    const data = await caller.reporting.allSpacesOverview();

    return (
      <>
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">All Spaces</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Overview</h1>
          <p className="mt-2 text-sm text-body">Your financial summary across all spaces.</p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.spaces.map((space) => (
            <section key={space.spaceId} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-lighter text-primary text-xs font-bold">
                  {space.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-heading">{space.name}</h3>
                  <p className="text-xs text-body">{space.baseCurrencyCode}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-heading">
                  {formatMoney(space.currentMonthTotal, space.baseCurrencyCode)}
                </p>
                <p className="text-xs text-body">{space.expenseCount} expenses this month</p>
              </div>
            </section>
          ))}
        </div>

        {data.spaces.length === 0 && (
          <section className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
            <p className="text-body">No spaces yet. Create one to start tracking expenses.</p>
          </section>
        )}
      </>
    );
  }

  const caller = await getServerCaller();

  let space, data, settlements;
  try {
    [space, data, settlements] = await Promise.all([
      caller.spaces.bySlug({ spaceSlug }),
      caller.reporting.overview({ spaceSlug }),
      caller.expenses.settlements({ spaceSlug }),
    ]);
  } catch {
    // Stale cookie — clear it and redirect to show all-spaces view
    const cookieStore = await cookies();
    cookieStore.delete("selectedSpace");
    redirect("/overview");
  }

  if (!space) {
    notFound();
  }

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const progressPct = data.totalDueMinor > 0 ? Math.min(100, Math.round((data.totalPaidMinor / data.totalDueMinor) * 100)) : 0;
  const allClear = data.totalDueMinor > 0 && data.totalRemainingMinor === 0;
  const changeIsUp = data.monthOverMonthChangePct > 0;
  const changeIsDown = data.monthOverMonthChangePct < 0;

  const hasActionItems = data.unpaidDebtPayments.length > 0 || data.dueVariableRecurring.length > 0 || data.pendingExpenses.length > 0;
  const forecastTotal = data.nextMonthForecast.totalMinor;

  const sections = [
    {
      label: "Expenses",
      icon: Receipt,
      dueMinor: data.expenses.dueMinor,
      paidMinor: data.expenses.paidMinor,
      href: routes.expenses,
    },
    {
      label: "Recurring",
      icon: RefreshCw,
      dueMinor: data.recurring.dueMinor,
      paidMinor: data.recurring.paidMinor,
      href: routes.recurring,
    },
    {
      label: "Debts",
      icon: Landmark,
      dueMinor: data.debts.dueMinor,
      paidMinor: data.debts.paidMinor,
      href: routes.debts,
    },
  ];

  return (
    <>
      {/* Row 1: Monthly Pulse Hero */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{monthLabel}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-body">{space.name}</p>
        </div>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="font-heading text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
            {formatMoney(data.totalDueMinor, data.baseCurrencyCode)}
          </span>
          <span className="text-sm font-medium text-body">total due</span>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="font-medium text-posted">
            {formatMoney(data.totalPaidMinor, data.baseCurrencyCode)} paid
          </span>
          <span className="text-body">/</span>
          <span className={`font-medium ${allClear ? "text-posted" : "text-danger"}`}>
            {allClear ? "All clear" : `${formatMoney(data.totalRemainingMinor, data.baseCurrencyCode)} remaining`}
          </span>
        </div>
        {data.totalDueMinor > 0 && (
          <div className="mt-3 h-2.5 rounded-full bg-surface-secondary">
            <div
              className={`h-2.5 rounded-full transition-all ${allClear ? "bg-posted" : "bg-primary"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </section>

      {/* Row 2: Section Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((section) => {
          const remaining = Math.max(0, section.dueMinor - section.paidMinor);
          const pct = section.dueMinor > 0 ? Math.min(100, Math.round((section.paidMinor / section.dueMinor) * 100)) : 0;
          const sectionClear = section.dueMinor > 0 && remaining === 0;
          const Icon = section.icon;
          return (
            <Link
              key={section.label}
              href={section.href}
              className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-primary-light hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-lighter text-primary">
                  <Icon size={16} />
                </div>
                <h3 className="font-heading text-sm font-semibold text-heading">{section.label}</h3>
                <ArrowRight size={14} className="ml-auto text-body opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-heading text-lg font-bold text-heading">
                  {formatMoney(section.dueMinor, data.baseCurrencyCode)}
                </span>
                <span className={`text-xs font-medium ${sectionClear ? "text-posted" : remaining > 0 ? "text-danger" : "text-body"}`}>
                  {section.dueMinor === 0 ? "Nothing due" : sectionClear ? "All paid" : `${formatMoney(remaining, data.baseCurrencyCode)} left`}
                </span>
              </div>
              {section.dueMinor > 0 && (
                <div className="mt-2 h-1.5 rounded-full bg-surface-secondary">
                  <div
                    className={`h-1.5 rounded-full ${sectionClear ? "bg-posted" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Row 3: Comparison + Forecast */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Month-over-Month */}
        <div className="space-y-6 lg:col-span-8">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold text-heading">Month-over-Month</h2>
              {data.monthOverMonthChangePct !== 0 && (
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${changeIsUp ? "bg-danger-bg text-danger" : "bg-posted-bg text-posted"}`}>
                  {changeIsUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(data.monthOverMonthChangePct)}%
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-surface-secondary p-4">
                <p className="text-xs font-medium text-body">This Month</p>
                <p className="mt-1 font-heading text-xl font-bold text-heading">
                  {formatMoney(data.currentMonthTotal, data.baseCurrencyCode)}
                </p>
              </div>
              <div className="rounded-xl bg-surface-secondary p-4">
                <p className="text-xs font-medium text-body">Last Month</p>
                <p className="mt-1 font-heading text-xl font-bold text-heading">
                  {formatMoney(data.previousMonthTotal, data.baseCurrencyCode)}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-sm font-medium text-body">Weekly Spending</h3>
              <div className="mt-3">
                <SpendingChart data={data.weeklySpending} currencyCode={data.baseCurrencyCode} />
              </div>
            </div>
          </section>
        </div>

        {/* Next Month Forecast */}
        <div className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <h2 className="font-heading text-base font-semibold text-heading">Next Month</h2>
            </div>
            <p className="mt-3 font-heading text-2xl font-bold text-heading">
              {formatMoney(forecastTotal, data.baseCurrencyCode)}
            </p>
            <p className="mt-1 text-xs text-body">Expected obligations</p>
            <div className="mt-4 space-y-2">
              {data.nextMonthForecast.recurringMinor > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-body">
                    <RefreshCw size={12} /> Recurring
                  </span>
                  <span className="font-medium text-heading">{formatMoney(data.nextMonthForecast.recurringMinor, data.baseCurrencyCode)}</span>
                </div>
              )}
              {data.nextMonthForecast.debtMinor > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-body">
                    <Landmark size={12} /> Debt payments
                  </span>
                  <span className="font-medium text-heading">{formatMoney(data.nextMonthForecast.debtMinor, data.baseCurrencyCode)}</span>
                </div>
              )}
              {data.nextMonthForecast.plannedMinor > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-body">
                    <Receipt size={12} /> Planned
                  </span>
                  <span className="font-medium text-heading">{formatMoney(data.nextMonthForecast.plannedMinor, data.baseCurrencyCode)}</span>
                </div>
              )}
              {data.nextMonthForecast.variableBillCount > 0 && (
                <p className="mt-2 text-xs text-body">
                  + {data.nextMonthForecast.variableBillCount} variable bill{data.nextMonthForecast.variableBillCount > 1 ? "s" : ""} TBD
                </p>
              )}
              {forecastTotal === 0 && data.nextMonthForecast.variableBillCount === 0 && (
                <p className="text-sm text-body">No forecast data available.</p>
              )}
            </div>
          </section>

          {/* Debt Balances */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-heading">Debt Balances</h2>
            <div className="mt-4 space-y-3">
              {data.debtBalances.liabilities > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-body">Liabilities</span>
                  <span className="font-medium text-heading">{formatMoney(data.debtBalances.liabilities, data.baseCurrencyCode)}</span>
                </div>
              )}
              {data.debtBalances.leasing > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-body">Leasing</span>
                  <span className="font-medium text-heading">{formatMoney(data.debtBalances.leasing, data.baseCurrencyCode)}</span>
                </div>
              )}
              {data.debtBalances.receivables > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-body">Receivables</span>
                  <span className="font-medium text-posted">{formatMoney(data.debtBalances.receivables, data.baseCurrencyCode)}</span>
                </div>
              )}
              {(data.debtBalances.liabilities > 0 || data.debtBalances.receivables > 0 || data.debtBalances.leasing > 0) && (
                <>
                  <div className="border-t border-border" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-body">Net Position</span>
                    <span className={`font-heading font-bold ${data.debtBalances.net >= 0 ? "text-posted" : "text-danger"}`}>
                      {data.debtBalances.net >= 0 ? "+" : ""}{formatMoney(Math.abs(data.debtBalances.net), data.baseCurrencyCode)}
                    </span>
                  </div>
                </>
              )}
              {data.debtBalances.liabilities === 0 && data.debtBalances.receivables === 0 && data.debtBalances.leasing === 0 && (
                <p className="text-sm text-body">No active debts.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Row 4: Action Items */}
      {hasActionItems && (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-primary" />
            <h2 className="font-heading text-base font-semibold text-heading">Action Required</h2>
          </div>
          <div className="mt-4 divide-y divide-border">
            {data.unpaidDebtPayments.map((item) => (
              <div key={`${item.debtId}-${item.dueDate}`} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
                  <Landmark size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-heading">{item.name}</p>
                  <p className="text-xs text-body">
                    Due {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className="shrink-0 font-medium text-heading">
                  {formatMoney(item.amountMinor, data.baseCurrencyCode)}
                </span>
              </div>
            ))}
            {data.dueVariableRecurring.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                  <RefreshCw size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-heading">{item.title}</p>
                  <p className="text-xs text-body">{item.categoryPath} · Needs amount</p>
                </div>
                {item.paymentUrl ? (
                  <Link href={item.paymentUrl} target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    Pay <ExternalLink size={12} />
                  </Link>
                ) : (
                  <Link href={routes.recurring} className="text-xs font-medium text-primary hover:underline">
                    Record
                  </Link>
                )}
              </div>
            ))}
            {data.pendingExpenses.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pending-bg text-pending">
                  <Clock size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-heading">{item.title}</p>
                  <p className="text-xs text-body">Pending confirmation</p>
                </div>
                <span className="shrink-0 font-medium text-heading">
                  {formatMoney(item.amountMinor, data.baseCurrencyCode)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Row 5: Top Categories + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Top Categories */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:col-span-5">
          <h2 className="font-heading text-base font-semibold text-heading">Top Categories</h2>
          <div className="mt-4 space-y-3">
            {data.categoryPercentages.length > 0 ? (
              data.categoryPercentages.slice(0, 5).map((entry) => (
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

        {/* Recent Activity */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-base font-semibold text-heading">Recent Activity</h2>
            <Link
              href={routes.expenses}
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {data.recentExpenses.length > 0 ? (
              data.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                    <FolderTree size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-heading">{expense.title}</p>
                      <StatusBadge status={expense.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-body">
                      {expense.categoryPath} · {timeAgo(expense.expenseDate)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-heading">
                    {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-body">No activity yet.</div>
            )}
          </div>
        </section>
      </div>

      {/* Row 6: Member Balances (Settlements) */}
      {settlements.balances.some((b) => b.netMinor !== 0) && (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <h2 className="font-heading text-base font-semibold text-heading">Member Balances</h2>
          </div>
          <div className="mt-4 space-y-3">
            {settlements.balances
              .filter((b) => b.netMinor !== 0)
              .map((balance) => (
                <div key={balance.userId} className="flex items-center justify-between">
                  <span className="text-sm text-heading">{balance.userName}</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      balance.netMinor > 0 ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {balance.netMinor > 0 ? "is owed " : "owes "}
                    {formatMoney(Math.abs(balance.netMinor), settlements.currencyCode)}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </>
  );
}
