import { getServerCaller } from "@/server/trpc-caller";
import { FolderTree, ChevronRight, Info } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Categories</h1>
          <p className="mt-2 text-sm text-body">Expense categories available for this workspace.</p>
        </div>
        <span className="rounded-full bg-primary-lighter px-3 py-1 text-xs font-semibold text-primary">{categories.length} parents</span>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-secondary px-5 py-4">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-sm text-body">
          Categories are managed by platform administrators and shared across all workspaces.
        </p>
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
              <div key={category.id} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                    {category.color ? (
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: category.color }} />
                    ) : (
                      <FolderTree size={18} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-heading">{category.name}</p>
                    <p className="text-xs text-body">/{category.slug} · {category.children.length} children</p>
                  </div>
                </div>

                {category.children.length > 0 && (
                  <div className="mt-3 ml-13 space-y-1.5">
                    {category.children.map((child) => (
                      <div key={child.id} className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2.5">
                        <ChevronRight size={14} className="text-body" />
                        <span className="text-sm font-medium text-heading">{child.name}</span>
                        <span className="text-xs text-body ml-auto">/{child.slug}</span>
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
            No categories available. Contact a platform administrator.
          </div>
        )}
      </section>
    </div>
  );
}
