import Link from "next/link";
import { getServerCaller } from "@/server/trpc-caller";
import { routes } from "@/lib/routes";
import { format } from "date-fns";
import { Search } from "lucide-react";

type UsersPageProps = {
  searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page) || 1;

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
      <form className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-body" />
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3 text-sm text-heading outline-none placeholder:text-body focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </form>

      {/* Users table */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left">
                <th className="px-6 py-3 font-medium text-body">User</th>
                <th className="px-6 py-3 font-medium text-body">Email</th>
                <th className="px-6 py-3 font-medium text-body text-center">Workspaces</th>
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
                        {user.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                      </div>
                      <span className="font-medium text-heading hover:underline">{user.name || "—"}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-body">{user.email}</td>
                  <td className="px-6 py-3 text-center text-heading">{user.workspaceCount}</td>
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

        {/* Pagination */}
        {users.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-body">
              Page {users.page} of {users.totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={{ pathname: routes.adminUsers, query: { search: search || undefined, page: page - 1 } }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-heading hover:bg-surface-secondary"
                >
                  Previous
                </Link>
              )}
              {page < users.totalPages && (
                <Link
                  href={{ pathname: routes.adminUsers, query: { search: search || undefined, page: page + 1 } }}
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
