import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerCaller } from "@/server/trpc-caller";
import { routes } from "@/lib/routes";
import { format } from "date-fns";
import { ArrowLeft, Users, Receipt, RefreshCw } from "lucide-react";

type SpaceDetailPageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function AdminSpaceDetailPage({ params }: SpaceDetailPageProps) {
  const { spaceId } = await params;
  const caller = await getServerCaller();
  const space = await caller.admin.getSpaceDetail({ spaceId });

  if (!space) notFound();

  const totalSpend = space.totalSpendMinor / 100;

  return (
    <div className="space-y-6">
      <div>
        <Link href={routes.adminSpaces} className="inline-flex items-center gap-1.5 text-sm text-body hover:text-heading mb-4">
          <ArrowLeft size={14} />
          Back to Spaces
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Space Detail</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-heading">{space.name}</h1>
      </div>

      {/* Info card */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-body">Slug</p>
            <p className="mt-1 font-mono text-sm text-heading">{space.slug}</p>
          </div>
          <div>
            <p className="text-xs text-body">Base Currency</p>
            <p className="mt-1 text-sm font-medium text-heading">{space.baseCurrencyCode}</p>
          </div>
          <div>
            <p className="text-xs text-body">Created By</p>
            <p className="mt-1 text-sm text-heading">{space.createdBy}</p>
          </div>
          <div>
            <p className="text-xs text-body">Created</p>
            <p className="mt-1 text-sm text-heading">{format(space.createdAt, "MMM d, yyyy")}</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-lighter">
              <Users size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-body">Members</p>
              <p className="font-heading text-lg font-bold text-heading">{space.members.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-lighter">
              <Receipt size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-body">Expenses</p>
              <p className="font-heading text-lg font-bold text-heading">{space.expenseCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-lighter">
              <RefreshCw size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-body">Total Spend</p>
              <p className="font-heading text-lg font-bold text-heading">
                {totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {space.baseCurrencyCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Members</h2>
          <span className="text-sm text-body">{space.members.length} members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left">
                <th className="px-6 py-3 font-medium text-body">User</th>
                <th className="px-6 py-3 font-medium text-body">Email</th>
                <th className="px-6 py-3 font-medium text-body">Role</th>
                <th className="px-6 py-3 font-medium text-body">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {space.members.map((member) => (
                <tr key={member.userId} className="transition hover:bg-surface-secondary">
                  <td className="px-6 py-3">
                    <Link href={routes.adminUser(member.userId)} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-xs font-bold text-primary">
                        {member.name ? member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                      </div>
                      <span className="font-medium text-heading hover:underline">{member.name || "—"}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-body">{member.email}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      member.role === "owner"
                        ? "bg-primary-lighter text-primary"
                        : member.role === "editor"
                          ? "bg-surface-secondary text-heading"
                          : "bg-surface-secondary text-body"
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-body">{format(member.joinedAt, "MMM d, yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
