import { getServerCaller } from "@/server/trpc-caller";
import { FolderTree, Plus, ChevronRight, Archive, ArchiveRestore } from "lucide-react";
import { createPlatformCategoryAction, updatePlatformCategoryAction } from "./actions";

export default async function AdminCategoriesPage() {
  const caller = await getServerCaller();
  const categories = await caller.admin.listPlatformCategories();

  const activeCategories = categories.filter((c) => !c.isArchived);
  const totalChildren = categories.reduce((sum, c) => sum + c.children.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Administration</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Categories</h1>
          <p className="mt-2 text-sm text-body">
            Manage platform-wide expense categories available to all workspaces.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-primary-lighter px-3 py-1 text-xs font-semibold text-primary">
            {activeCategories.length} parents
          </span>
          <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-heading">
            {totalChildren} children
          </span>
        </div>
      </div>

      {/* Create forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-heading">Create parent category</h2>
          <form action={createPlatformCategoryAction} className="mt-5 space-y-4">
            <input type="hidden" name="parentCategoryId" value="" />
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Name</span>
              <input
                name="name"
                required
                placeholder="e.g. Housing & Rent"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-body focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Color (optional)</span>
              <input
                name="color"
                placeholder="#6366F1"
                pattern="^#[0-9a-fA-F]{6}$"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-body focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <button className="flex items-center gap-2 rounded-xl bg-heading px-5 py-3 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90">
              <Plus size={16} />
              Create Parent
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-heading">Create child category</h2>
          <form action={createPlatformCategoryAction} className="mt-5 space-y-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Parent</span>
              <select
                name="parentCategoryId"
                required
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="">Select parent</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Name</span>
              <input
                name="name"
                required
                placeholder="e.g. Rent / Mortgage"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-body focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <button className="flex items-center gap-2 rounded-xl bg-heading px-5 py-3 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90">
              <Plus size={16} />
              Create Child
            </button>
          </form>
        </section>
      </div>

      {/* Category tree */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Category Tree</h2>
          <span className="text-sm text-body">{categories.length} parents</span>
        </div>

        {categories.length > 0 ? (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div key={category.id} className={`px-6 py-4 ${category.isArchived ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                    {category.color ? (
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: category.color }} />
                    ) : (
                      <FolderTree size={18} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-heading">
                      {category.name}
                      {category.isArchived && (
                        <span className="ml-2 text-xs text-body">(archived)</span>
                      )}
                    </p>
                    <p className="text-xs text-body">
                      /{category.slug} · {category.children.length} children
                      {category.color && <> · <span className="inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: category.color }} /></>}
                    </p>
                  </div>
                  <form action={updatePlatformCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input type="hidden" name="isArchived" value={category.isArchived ? "false" : "true"} />
                    <button
                      type="submit"
                      className="rounded-lg p-2 text-body transition hover:bg-surface-secondary hover:text-heading"
                      title={category.isArchived ? "Restore" : "Archive"}
                    >
                      {category.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </button>
                  </form>
                </div>

                {category.children.length > 0 && (
                  <div className="mt-3 ml-13 space-y-1.5">
                    {category.children.map((child) => (
                      <div key={child.id} className={`flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2.5 ${child.isArchived ? "opacity-50" : ""}`}>
                        <ChevronRight size={14} className="text-body" />
                        <span className="text-sm font-medium text-heading">
                          {child.name}
                          {child.isArchived && <span className="ml-1 text-xs text-body">(archived)</span>}
                        </span>
                        <span className="text-xs text-body ml-auto mr-2">/{child.slug}</span>
                        <form action={updatePlatformCategoryAction}>
                          <input type="hidden" name="categoryId" value={child.id} />
                          <input type="hidden" name="isArchived" value={child.isArchived ? "false" : "true"} />
                          <button
                            type="submit"
                            className="rounded p-1 text-body transition hover:text-heading"
                            title={child.isArchived ? "Restore" : "Archive"}
                          >
                            {child.isArchived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}

                {category.children.length === 0 && (
                  <p className="mt-3 ml-13 text-sm text-body">No child categories yet.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-body">
            No platform categories yet. Create a parent category to start, or run the seed script.
          </div>
        )}
      </section>
    </div>
  );
}
