import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { createAdminListPageHref, parseAdminListSearchParams } from "@/lib/admin-list";
import { getServerCaller } from "@/server/trpc-caller";
import { routes } from "@/lib/routes";
import { format } from "date-fns";

type SpacesPageProps = {
  searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function AdminSpacesPage({ searchParams }: SpacesPageProps) {
  const params = await searchParams;
  const { search, page } = parseAdminListSearchParams(params);

  const caller = await getServerCaller();
  const spaces = await caller.admin.listSpaces({ search: search || undefined, page, perPage: 20 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Administration</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Spaces</h1>
          <p className="mt-2 text-sm text-body">{spaces.total} total spaces on the platform.</p>
        </div>
      </div>

      {/* Search */}
      <AdminSearchForm defaultValue={search} placeholder="Search by name or slug..." />

      {/* Spaces table */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left">
                <th className="px-6 py-3 font-medium text-body">Space</th>
                <th className="px-6 py-3 font-medium text-body">Slug</th>
                <th className="px-6 py-3 font-medium text-body">Currency</th>
                <th className="px-6 py-3 font-medium text-body">Created By</th>
                <th className="px-6 py-3 font-medium text-body text-center">Members</th>
                <th className="px-6 py-3 font-medium text-body text-center">Expenses</th>
                <th className="px-6 py-3 font-medium text-body">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {spaces.items.map((ws) => (
                <tr key={ws.id} className="transition hover:bg-surface-secondary">
                  <td className="px-6 py-3">
                    <Link href={routes.adminSpace(ws.id)} className="font-medium text-heading hover:underline">
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
              {spaces.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-body">No spaces found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={spaces.page}
          totalPages={spaces.totalPages}
          previousHref={page > 1 ? createAdminListPageHref(routes.adminSpaces, { search, page: page - 1 }) : null}
          nextHref={page < spaces.totalPages ? createAdminListPageHref(routes.adminSpaces, { search, page: page + 1 }) : null}
        />
      </section>
    </div>
  );
}
