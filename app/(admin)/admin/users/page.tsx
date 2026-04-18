import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { createAdminListPageHref, parseAdminListSearchParams } from "@/lib/admin-list";
import { getServerCaller } from "@/server/trpc-caller";
import { routes } from "@/lib/routes";
import { getUserInitials } from "@/lib/user-display";
import { format } from "date-fns";

type UsersPageProps = {
  searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const { search, page } = parseAdminListSearchParams(params);

  const caller = await getServerCaller();
  const users = await caller.admin.listUsers({ search: search || undefined, page, perPage: 20 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Administration</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Users</h1>
          <p className="mt-2 text-sm text-body">{users.total} total users on the platform.</p>
        </div>
      </div>

      {/* Search */}
      <AdminSearchForm defaultValue={search} placeholder="Search by name or email..." />

      {/* Users table */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left">
                <th className="px-6 py-3 font-medium text-body">User</th>
                <th className="px-6 py-3 font-medium text-body">Email</th>
                <th className="px-6 py-3 font-medium text-body text-center">Spaces</th>
                <th className="px-6 py-3 font-medium text-body">Role</th>
                <th className="px-6 py-3 font-medium text-body">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.items.map((user) => (
                <tr key={user.id} className="transition hover:bg-surface-secondary">
                  <td className="px-6 py-3">
                    <Link href={routes.adminUser(user.id)} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-xs font-bold text-primary">
                        {getUserInitials(user.name)}
                      </div>
                      <span className="font-medium text-heading hover:underline">{user.name || "—"}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-body">{user.email}</td>
                  <td className="px-6 py-3 text-center text-heading">{user.spaceCount}</td>
                  <td className="px-6 py-3">
                    {user.isPlatformAdmin ? (
                      <span className="rounded-full bg-primary-lighter px-2.5 py-1 text-xs font-semibold text-primary">Admin</span>
                    ) : (
                      <span className="text-body">User</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-body">{format(user.createdAt, "MMM d, yyyy")}</td>
                </tr>
              ))}
              {users.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-body">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={users.page}
          totalPages={users.totalPages}
          previousHref={page > 1 ? createAdminListPageHref(routes.adminUsers, { search, page: page - 1 }) : null}
          nextHref={page < users.totalPages ? createAdminListPageHref(routes.adminUsers, { search, page: page + 1 }) : null}
        />
      </section>
    </div>
  );
}
