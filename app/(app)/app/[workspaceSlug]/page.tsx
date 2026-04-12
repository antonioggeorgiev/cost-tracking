import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceOverviewCard } from "@/components/workspace-overview-card";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc-caller";

type WorkspacePageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceSlug } = await params;
  const caller = await getServerCaller();
  const [workspace, dashboard] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.reporting.dashboard({ workspaceSlug }),
  ]);

  if (!workspace) {
    notFound();
  }

  const userRole = workspace.memberships[0]?.role ?? "viewer";

  return (
    <>
      <section className="card rounded-3xl p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Workspace</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">{workspace.name}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Base currency is <span className="font-medium text-white">{workspace.baseCurrencyCode}</span>. Your current role is <span className="font-medium capitalize text-white">{userRole.toLowerCase()}</span>.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">
            /{workspace.slug}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <WorkspaceOverviewCard label="This month" value={formatMoney(dashboard.currentMonthTotal, dashboard.baseCurrencyCode)} help="Posted expenses in workspace base currency." />
        <WorkspaceOverviewCard label="Last month" value={formatMoney(dashboard.previousMonthTotal, dashboard.baseCurrencyCode)} help="Previous month's posted expenses." />
        <WorkspaceOverviewCard label="Posted expenses" value={String(dashboard.currentMonthExpenseCount)} help="Current month's posted expense count." />
        <WorkspaceOverviewCard label="Members" value={String(workspace._count.memberships)} help="Everyone in the workspace can view all workspace data." />
        <WorkspaceOverviewCard label="Active debts" value={String(dashboard.activeDebts.length)} help="Debt accounts remain separate from regular expenses." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Spend by category</h2>
            <p className="text-sm text-slate-400">Current month</p>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.spendingByCategory.length > 0 ? (
              dashboard.spendingByCategory.map((entry) => (
                <div key={entry.label}>
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                    <span>{entry.label}</span>
                    <span>{formatMoney(entry.amountMinor, dashboard.baseCurrencyCode)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-emerald-300"
                      style={{
                        width: `${dashboard.currentMonthTotal > 0 ? (entry.amountMinor / dashboard.currentMonthTotal) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                No posted expenses this month yet.
              </div>
            )}
          </div>
        </section>

        <section className="card rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white">Upcoming recurring</h2>
          <div className="mt-6 space-y-3">
            {dashboard.upcomingRecurring.length > 0 ? (
              dashboard.upcomingRecurring.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.categoryPath}</p>
                  <div className="mt-2 flex items-center justify-between gap-4 text-sm text-slate-300">
                    <span>{new Date(item.nextOccurrenceDate).toLocaleDateString()}</span>
                    <span>{formatMoney(item.workspaceAmountMinor, item.workspaceCurrencyCode)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                No active recurring templates yet.
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Recent activity</h2>
            <p className="text-sm text-slate-400">Latest records</p>
          </div>

          <div className="mt-6 space-y-3">
            {dashboard.recentExpenses.length > 0 ? (
              dashboard.recentExpenses.map((expense) => (
                <div key={expense.id} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{expense.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{expense.categoryPath} · {expense.createdByLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}</p>
                      <p className="mt-1 text-sm text-slate-400">{new Date(expense.expenseDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                No activity yet.
              </div>
            )}
          </div>
        </section>

        <section className="card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Debt summary</h2>
            <p className="text-sm text-slate-400">Active accounts</p>
          </div>

          <div className="mt-6 space-y-3">
            {dashboard.activeDebts.length > 0 ? (
              dashboard.activeDebts.map((debt) => (
                <div key={debt.id} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{debt.name}</p>
                    <p className="text-sm text-slate-300">{formatMoney(debt.currentBalanceMinor, debt.currencyCode)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                No active debts.
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="card rounded-3xl p-6">
        <h2 className="text-xl font-semibold text-white">Workspace areas</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Expenses", "Track one-time purchases and daily costs.", `/app/${workspace.slug}/expenses`],
            ["Categories", "Manage parent and child categories.", `/app/${workspace.slug}/categories`],
            ["Members", "Invite and review workspace members.", `/app/${workspace.slug}/members`],
            ["Recurring", "Manage recurring templates and generated entries.", `/app/${workspace.slug}/recurring`],
            ["Debts", "Track debt accounts and manual payments.", `/app/${workspace.slug}/debts`],
            ["Settings", "Update workspace name and base currency.", `/app/${workspace.slug}/settings`],
          ].map(([title, body, href]) => (
            <Link key={title} href={href} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition hover:border-emerald-300/30 hover:bg-slate-950/40">
              <h3 className="font-medium text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-300">{body}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
