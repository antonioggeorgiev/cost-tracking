import { MemberRoleBadge } from "@/components/member-role-badge";
import { isResendConfigured } from "@/lib/resend";
import {
  createWorkspaceInviteAction,
  removeWorkspaceMemberAction,
  revokeWorkspaceInviteAction,
  updateWorkspaceMemberRoleAction,
} from "@/app/(app)/workspaces/[workspaceSlug]/members/actions";
import { getServerCaller } from "@/server/trpc-caller";
import { Users, UserPlus, Mail, Shield } from "lucide-react";

type MembersPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const { workspaceSlug } = await params;
  const { error } = await searchParams;
  const caller = await getServerCaller();
  const data = await caller.members.list({ workspaceSlug });
  const canManage = data.role === "owner";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{data.workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Members</h1>
          <p className="mt-2 text-sm text-body">Manage workspace access and invite new members.</p>
        </div>
        <span className="rounded-full bg-primary-lighter px-3 py-1 text-xs font-semibold text-primary">{data.memberships.length} members</span>
      </div>

      {error ? (
        <section className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </section>
      ) : null}

      {/* Invite form */}
      {canManage ? (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-heading">Invite a member</h2>
              <p className="mt-1 text-sm text-muted">They will join after accepting the invite link.</p>
            </div>
            {!isResendConfigured ? (
              <span className="rounded-full bg-pending-bg px-3 py-1 text-xs font-semibold text-pending-badge">Email disabled</span>
            ) : null}
          </div>

          <form action={createWorkspaceInviteAction} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

            <label className="grid flex-1 gap-1.5 text-sm">
              <span className="font-medium text-heading">Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="friend@example.com"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="grid w-full sm:w-[140px] gap-1.5 text-sm">
              <span className="font-medium text-heading">Role</span>
              <select name="role" defaultValue="editor" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>

            <button className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90 sm:w-auto">
              <UserPlus size={16} />
              Invite
            </button>
          </form>
        </section>
      ) : null}

      {/* Members list */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Active Members</h2>
          <span className="text-sm text-muted">{data.memberships.length} total</span>
        </div>

        <div className="divide-y divide-border">
          {data.memberships.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                <Users size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-heading">{item.user.name || item.user.email}</p>
                <p className="truncate text-xs text-muted">{item.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <MemberRoleBadge role={item.role} />
                {canManage && item.role !== "owner" ? (
                  <div className="flex items-center gap-1">
                    <form action={updateWorkspaceMemberRoleAction}>
                      <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                      <input type="hidden" name="membershipId" value={item.id} />
                      <input type="hidden" name="role" value={item.role === "editor" ? "viewer" : "editor"} />
                      <button className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-heading transition hover:bg-surface-secondary">
                        {item.role === "editor" ? "Viewer" : "Editor"}
                      </button>
                    </form>
                    <form action={removeWorkspaceMemberAction}>
                      <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                      <input type="hidden" name="membershipId" value={item.id} />
                      <button className="rounded-lg border border-danger/20 px-2.5 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-bg">
                        Remove
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending invites */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Pending Invites</h2>
          <span className="text-sm text-muted">{data.invites.length} active</span>
        </div>

        {data.invites.length > 0 ? (
          <div className="divide-y divide-border">
            {data.invites.map((invite) => (
              <div key={invite.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pending-bg text-pending-badge">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-heading">{invite.email}</p>
                      <p className="text-xs text-muted">Expires {invite.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MemberRoleBadge role={invite.role} />
                    {canManage ? (
                      <form action={revokeWorkspaceInviteAction}>
                        <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <button className="rounded-lg border border-danger/20 px-2.5 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-bg">
                          Revoke
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">No pending invites.</div>
        )}
      </section>
    </div>
  );
}
