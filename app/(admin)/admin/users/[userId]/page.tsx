import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerCaller } from "@/server/trpc-caller";
import { routes } from "@/lib/routes";
import { format } from "date-fns";
import { ArrowLeft, Shield, ShieldOff } from "lucide-react";
import { toggleAdminAction } from "@/app/(admin)/admin/users/[userId]/actions";

type UserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  const caller = await getServerCaller();
  const user = await caller.admin.getUserDetail({ userId });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.adminUsers} className="inline-flex items-center gap-1.5 text-sm text-body hover:text-heading mb-4">
          <ArrowLeft size={14} />
          Back to Users
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">User Detail</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-heading">{user.name || user.email}</h1>
      </div>

      {/* User info */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-lg font-bold text-primary">
              {user.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-heading">{user.name || "—"}</p>
              <p className="text-sm text-body">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-body">
                <span>Joined {format(user.createdAt, "MMM d, yyyy")}</span>
                <span>·</span>
                <span>{user.expenseCount} expenses</span>
                <span>·</span>
                <span>{user.workspaces.length} workspaces</span>
              </div>
            </div>
          </div>

          <form action={toggleAdminAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="isPlatformAdmin" value={user.isPlatformAdmin ? "false" : "true"} />
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                user.isPlatformAdmin
                  ? "border border-border bg-surface text-heading hover:bg-surface-secondary"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {user.isPlatformAdmin ? (
                <>
                  <ShieldOff size={14} />
                  Remove Admin
                </>
              ) : (
                <>
                  <Shield size={14} />
                  Make Admin
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Workspaces */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Workspaces</h2>
          <span className="text-sm text-body">{user.workspaces.length} workspaces</span>
        </div>

        {user.workspaces.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-left">
                  <th className="px-6 py-3 font-medium text-body">Workspace</th>
                  <th className="px-6 py-3 font-medium text-body">Currency</th>
                  <th className="px-6 py-3 font-medium text-body">Role</th>
                  <th className="px-6 py-3 font-medium text-body">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {user.workspaces.map((ws) => (
                  <tr key={ws.id} className="transition hover:bg-surface-secondary">
                    <td className="px-6 py-3">
                      <Link href={routes.adminWorkspace(ws.id)} className="font-medium text-heading hover:underline">
                        {ws.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-body">{ws.baseCurrencyCode}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        ws.role === "owner"
                          ? "bg-primary-lighter text-primary"
                          : ws.role === "editor"
                            ? "bg-surface-secondary text-heading"
                            : "bg-surface-secondary text-body"
                      }`}>
                        {ws.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-body">{format(ws.joinedAt, "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-body">
            This user is not a member of any workspace.
          </div>
        )}
      </section>
    </div>
  );
}
