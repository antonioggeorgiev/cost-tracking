import { createCategoryAction } from "@/app/(app)/workspaces/[workspaceSlug]/categories/actions";
import { getServerCaller } from "@/server/trpc-caller";
import { FolderTree, Plus, ChevronRight } from "lucide-react";

type CategoriesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { workspaceSlug } = await params;
  const caller = await getServerCaller();
  const [workspace, categories] = await Promise.all([
    caller.workspaces.bySlug({ workspaceSlug }),
    caller.categories.list({ workspaceSlug }),
  ]);

  if (!workspace) {
    return null;
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Categories</h1>
          <p className="mt-2 text-sm text-body">Organize expenses with parent and child categories.</p>
        </div>
        <span className="rounded-full bg-primary-lighter px-3 py-1 text-xs font-semibold text-primary">{categories.length} parents</span>
      </div>

      {/* Create forms */}
      {canManage ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-heading">Create parent category</h2>
            <form action={createCategoryAction} className="mt-5 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <input type="hidden" name="parentCategoryId" value="" />
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Name</span>
                <input name="name" required placeholder="Renovation" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90">
                <Plus size={16} />
                Create Parent
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-heading">Create child category</h2>
            <form action={createCategoryAction} className="mt-5 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Parent</span>
                <select name="parentCategoryId" required className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                  <option value="">Select parent</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-heading">Name</span>
                <input name="name" required placeholder="Bathroom" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </label>
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90">
                <Plus size={16} />
                Create Child
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {/* Category tree */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Category Tree</h2>
          <span className="text-sm text-muted">{categories.length} parents</span>
        </div>

        {categories.length > 0 ? (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div key={category.id} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                    <FolderTree size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-heading">{category.name}</p>
                    <p className="text-xs text-muted">/{category.slug} · {category.children.length} children</p>
                  </div>
                </div>

                {category.children.length > 0 && (
                  <div className="mt-3 ml-13 space-y-1.5">
                    {category.children.map((child) => (
                      <div key={child.id} className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2.5">
                        <ChevronRight size={14} className="text-muted" />
                        <span className="text-sm font-medium text-heading">{child.name}</span>
                        <span className="text-xs text-muted ml-auto">/{child.slug}</span>
                      </div>
                    ))}
                  </div>
                )}

                {category.children.length === 0 && (
                  <p className="mt-3 ml-13 text-sm text-muted">No child categories yet.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">
            No categories yet. Create a parent category to start.
          </div>
        )}
      </section>
    </div>
  );
}
