import { notFound } from "next/navigation";
import { getCurrentClerkUser } from "@/lib/auth";
import { userService } from "@/server/services/user-service";
import { workspaceService } from "@/server/services/workspace-service";

const sectionCopy: Record<string, { title: string; body: string }> = {
  expenses: {
    title: "Expenses",
    body: "Workspace-scoped expense CRUD, statuses, and FX snapshots are next.",
  },
  recurring: {
    title: "Recurring",
    body: "Recurring templates and generated expense rows will be implemented in this workspace section.",
  },
  debts: {
    title: "Debts",
    body: "Manual debt accounts and debt payments remain visible to every workspace member.",
  },
  categories: {
    title: "Categories",
    body: "Parent and child category management with depth limited to two levels will live here.",
  },
  members: {
    title: "Members",
    body: "Invite flow, membership management, and role changes will live here.",
  },
  settings: {
    title: "Settings",
    body: "Workspace name, slug, and base currency settings will live here.",
  },
};

type WorkspaceSectionPageProps = {
  params: Promise<{ workspaceSlug: string; section: string }>;
};

export default async function WorkspaceSectionPage({ params }: WorkspaceSectionPageProps) {
  const { workspaceSlug, section } = await params;
  const content = sectionCopy[section];

  if (!content) {
    notFound();
  }

  const clerkUser = await getCurrentClerkUser();
  const user = await userService.syncFromClerk(clerkUser);
  const workspace = await workspaceService.getForUserBySlug({ slug: workspaceSlug, userId: user.id });

  if (!workspace) {
    notFound();
  }

  return (
    <section className="card rounded-3xl p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">{workspace.name}</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">{content.title}</h1>
      <p className="mt-3 max-w-2xl text-slate-300">{content.body}</p>
    </section>
  );
}
