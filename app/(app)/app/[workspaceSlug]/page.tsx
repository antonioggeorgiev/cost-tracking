import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceOverviewCard } from "@/components/workspace-overview-card";
import { getServerCaller } from "@/server/trpc-caller";

type WorkspacePageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceSlug } = await params;
  const caller = await getServerCaller();
  const workspace = await caller.workspaces.bySlug({ workspaceSlug });

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
        <WorkspaceOverviewCard label="Members" value={String(workspace._count.memberships)} help="Everyone in the workspace can view all workspace data." />
        <WorkspaceOverviewCard label="Categories" value={String(workspace._count.categories)} help="Parent and child categories now structure workspace spending." />
        <WorkspaceOverviewCard label="Expenses" value={String(workspace._count.expenses)} help="One-time expenses are now tracked inside the workspace." />
        <WorkspaceOverviewCard label="Recurring" value={String(workspace._count.recurringTemplates)} help="Recurring templates will land in a follow-up branch." />
        <WorkspaceOverviewCard label="Debts" value={String(workspace._count.debtAccounts)} help="Debt tracking will land in a follow-up branch." />
      </section>

      <section className="card rounded-3xl p-6">
        <h2 className="text-xl font-semibold text-white">Workspace foundation</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Members", "Invite users into the workspace and review current members.", `/app/${workspace.slug}/members`],
            ["Categories", "Manage parent and child categories.", `/app/${workspace.slug}/categories`],
            ["Expenses", "Track one-time purchases and daily costs.", `/app/${workspace.slug}/expenses`],
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
