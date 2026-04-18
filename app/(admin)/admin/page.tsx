import Link from "next/link";
import { getServerCaller } from "@/server/trpc-caller";
import { routes } from "@/lib/routes";
import { getUserInitials } from "@/lib/user-display";
import { Users, Building2, Receipt, FolderTree } from "lucide-react";
import { format } from "date-fns";

export default async function AdminDashboardPage() {
  const caller = await getServerCaller();
  const statsP = caller.admin.stats();
  const usersP = caller.admin.listUsers({ perPage: 5 });
  const spacesP = caller.admin.listSpaces({ perPage: 5 });
  const [stats, recentUsers, recentSpaces] = await Promise.all([statsP, usersP, spacesP]);

  const statCards = [
    { label: "Total Users", value: stats.userCount, icon: Users, href: routes.adminUsers },
    { label: "Total Spaces", value: stats.spaceCount, icon: Building2, href: routes.adminSpaces },
    { label: "Total Expenses", value: stats.expenseCount, icon: Receipt, href: undefined },
    { label: "Platform Categories", value: stats.categoryCount, icon: FolderTree, href: routes.adminCategories },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Administration</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Dashboard</h1>
        <p className="mt-2 text-sm text-body">Platform overview and quick stats.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-body">{card.label}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-heading">{card.value.toLocaleString()}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-lighter">
                  <Icon size={18} className="text-primary" />
                </div>
              </div>
            </div>
          );
          return card.href ? (
            <Link key={card.label} href={card.href}>{content}</Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <section className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-heading">Recent Users</h2>
            <Link href={routes.adminUsers} className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {recentUsers.items.map((user) => (
              <Link
                key={user.id}
                href={routes.adminUser(user.id)}
                className="flex items-center gap-3 px-6 py-3 transition hover:bg-surface-secondary"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-xs font-bold text-primary">
                  {getUserInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-heading truncate">
                    {user.name || user.email}
                    {user.isPlatformAdmin && (
                      <span className="ml-2 rounded-md bg-primary-lighter px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">Admin</span>
                    )}
                  </p>
                  <p className="text-xs text-body truncate">{user.email}</p>
                </div>
                <span className="text-xs text-body">{format(user.createdAt, "MMM d")}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Spaces */}
        <section className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-heading">Recent Spaces</h2>
            <Link href={routes.adminSpaces} className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {recentSpaces.items.map((ws) => (
              <Link
                key={ws.id}
                href={routes.adminSpace(ws.id)}
                className="flex items-center gap-3 px-6 py-3 transition hover:bg-surface-secondary"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-xs font-bold text-heading">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-heading truncate">{ws.name}</p>
                  <p className="text-xs text-body">{ws.memberCount} members · {ws.expenseCount} expenses</p>
                </div>
                <span className="text-xs text-body">{format(ws.createdAt, "MMM d")}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
