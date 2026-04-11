import { redirect } from "next/navigation";
import { DashboardCard } from "@/components/dashboard-card";
import { WorkspaceCreator } from "@/components/workspace-creator";
import { WorkspaceList } from "@/components/workspace-list";
import { getServerCaller } from "@/server/trpc-caller";

export default async function AppHomePage() {
  const caller = await getServerCaller();
  const workspaces = await caller.workspaces.listMine();

  if (workspaces.length === 1) {
    redirect(`/app/${workspaces[0].slug}`);
  }

  return (
    <>
      <section className="card rounded-3xl p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Overview</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Workspaces are now the entry point.</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Create your first workspace or pick an existing one. The workspace creation flow now creates the workspace and the owner membership together.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Your workspaces",
            value: String(workspaces.length),
            description: "Each workspace is private by default and invite-only.",
          },
          {
            title: "Shared visibility",
            value: workspaces.length > 0 ? "On" : "Pending",
            description: "Once a user joins a workspace, all records in that workspace are visible to them.",
          },
          {
            title: "Next feature slice",
            value: "Invites",
            description: "The next implementation slice is full invite flow and workspace-scoped dashboards.",
          },
        ].map((card) => (
          <DashboardCard key={card.title} {...card} />
        ))}
      </section>

      <WorkspaceCreator />

      {workspaces.length > 0 ? <WorkspaceList workspaces={workspaces} /> : null}
    </>
  );
}
