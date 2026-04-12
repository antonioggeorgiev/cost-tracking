import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { WorkspaceCreator } from "@/components/workspace-creator";
import { WorkspaceList } from "@/components/workspace-list";
import { getServerCaller } from "@/server/trpc-caller";
import { LayoutDashboard } from "lucide-react";

export default async function WorkspaceSwitcherPage() {
  const caller = await getServerCaller();
  const workspaces = await caller.workspaces.listMine();

  if (workspaces.length === 1) {
    redirect(routes.workspace(workspaces[0].slug));
  }

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Overview</p>
            <h1 className="font-heading text-2xl font-bold text-heading">Your Workspaces</h1>
          </div>
        </div>
        <p className="text-sm text-body">
          Create a workspace or select an existing one. Each workspace has its own currency, categories, and members.
        </p>
      </section>

      <WorkspaceCreator />

      {workspaces.length > 0 ? <WorkspaceList workspaces={workspaces} /> : null}
    </>
  );
}
