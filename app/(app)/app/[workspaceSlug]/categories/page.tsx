import { createCategoryAction } from "@/app/(app)/app/[workspaceSlug]/categories/actions";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { getServerCaller } from "@/server/trpc-caller";

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
      <section className="card rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">{workspace.name}</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Categories</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Categories are workspace-scoped and support one child level. Parent totals will eventually roll up all child spending.
            </p>
          </div>
          <MemberRoleBadge role={role} />
        </div>
      </section>

      {canManage ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <section className="card rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white">Create parent category</h2>
            <form action={createCategoryAction} className="mt-6 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <input type="hidden" name="parentCategoryId" value="" />
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Name</span>
                <input name="name" required placeholder="Renovation" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              </label>
              <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">Create parent</button>
            </form>
          </section>

          <section className="card rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white">Create child category</h2>
            <form action={createCategoryAction} className="mt-6 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Parent</span>
                <select name="parentCategoryId" required className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                  <option value="">Select a parent category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Name</span>
                <input name="name" required placeholder="Bathroom" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
              </label>
              <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">Create child</button>
            </form>
          </section>
        </section>
      ) : null}

      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Category tree</h2>
          <p className="text-sm text-slate-400">{categories.length} parents</p>
        </div>

        <div className="mt-6 space-y-4">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category.id} className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">/{category.slug}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-slate-300">
                    Parent
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {category.children.length > 0 ? (
                    category.children.map((child) => (
                      <div key={child.id} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                        <p className="font-medium text-slate-100">{category.name} / {child.name}</p>
                        <p className="mt-1 text-sm text-slate-400">/{child.slug}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-slate-400">
                      No child categories yet.
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
              No categories yet. Create a parent category to start structuring the workspace.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
