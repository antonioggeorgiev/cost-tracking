import Link from "next/link";
import { getServerCaller } from "@/server/trpc-caller";
import { routes } from "@/lib/routes";
import { format } from "date-fns";
import { Search } from "lucide-react";

type WorkspacesPageProps = {
  searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function AdminWorkspacesPage({ searchParams }: WorkspacesPageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page) || 1;

  const caller = await getServerCaller();
  const workspaces = await caller.admin.listWorkspaces({ search: search || undefined, page, perPage: 20 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Administration</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Workspaces</h1>
          <p className="mt-2 text-sm text-body">{workspaces.total} total workspaces on the platform.</p>
        </div>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-body" />
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or slug..."
          className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3 text-sm text-heading outline-none placeholder:text-body focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </form>

      {/* Workspaces table */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left">
                <th className="px-6 py-3 font-medium text-body">Workspace</th>
                <th className="px-6 py-3 font-medium text-body">Slug</th>
                <th className="px-6 py-3 font-medium text-body">Currency</th>
                <th className="px-6 py-3 font-medium text-body">Created By</th>
                <th className="px-6 py-3 font-medium text-body text-center">Members</th>
                <th className="px-6 py-3 font-medium text-body text-center">Expenses</th>
                <th className="px-6 py-3 font-medium text-body">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workspaces.items.map((ws) => (
                <tr key={ws.id} className="transition hover:bg-surface-secondary">
                  <td className="px-6 py-3">
                    <Link href={routes.adminWorkspace(ws.id)} className="font-medium text-heading hover:underline">
                      {ws.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-body font-mono text-xs">{ws.slug}</td>
                  <td className="px-6 py-3 text-body">{ws.baseCurrencyCode}</td>
                  <td className="px-6 py-3 text-body">{ws.createdBy}</td>
                  <td className="px-6 py-3 text-center text-heading">{ws.memberCount}</td>
                  <td className="px-6 py-3 text-center text-heading">{ws.expenseCount}</td>
                  <td className="px-6 py-3 text-body">{format(ws.createdAt, "MMM d, yyyy")}</td>
                </tr>
              ))}
              {workspaces.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-body">No workspaces found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {workspaces.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-body">
              Page {workspaces.page} of {workspaces.totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={{ pathname: routes.adminWorkspaces, query: { search: search || undefined, page: page - 1 } }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-heading hover:bg-surface-secondary"
                >
                  Previous
                </Link>
              )}
              {page < workspaces.totalPages && (
                <Link
                  href={{ pathname: routes.adminWorkspaces, query: { search: search || undefined, page: page + 1 } }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-heading hover:bg-surface-secondary"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
