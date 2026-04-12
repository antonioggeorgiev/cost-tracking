import { MemberRoleBadge } from "@/components/member-role-badge";
import { isResendConfigured } from "@/lib/resend";
import { createWorkspaceInviteAction } from "@/app/(app)/app/[workspaceSlug]/members/actions";
import { getServerCaller } from "@/server/trpc-caller";

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
      <section className="card rounded-3xl p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">{data.workspace.name}</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Members</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Every member can view all data in this workspace. Only owners can invite or manage members.
        </p>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {decodeURIComponent(error)}
        </section>
      ) : null}

      {canManage ? (
        <section className="card rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Invite a member</h2>
              <p className="mt-2 text-sm text-slate-300">
                Invite users by email. They will join after accepting the link with the same Clerk email.
              </p>
            </div>
            {!isResendConfigured ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Resend is not configured. Invites will still be created, but email sending is skipped.
              </div>
            ) : null}
          </div>

          <form action={createWorkspaceInviteAction} className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="friend@example.com"
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Role</span>
              <select name="role" defaultValue="editor" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>

            <div className="flex items-end">
              <button className="w-full rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">
                Create invite
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Active members</h2>
          <p className="text-sm text-slate-400">{data.memberships.length} total</p>
        </div>

        <div className="mt-6 space-y-3">
          {data.memberships.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4">
              <div>
                <p className="font-medium text-white">{item.user.name || item.user.email}</p>
                <p className="mt-1 text-sm text-slate-400">{item.user.email}</p>
              </div>
              <MemberRoleBadge role={item.role} />
            </div>
          ))}
        </div>
      </section>

      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Pending invites</h2>
          <p className="text-sm text-slate-400">{data.invites.length} active</p>
        </div>

        <div className="mt-6 space-y-3">
          {data.invites.length > 0 ? (
            data.invites.map((invite) => (
              <div key={invite.id} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{invite.email}</p>
                    <p className="mt-1 text-sm text-slate-400">Expires {invite.expiresAt.toLocaleDateString()}</p>
                  </div>
                  <MemberRoleBadge role={invite.role} />
                </div>
                <p className="mt-3 break-all text-sm text-slate-400">
                  Accept link: <span className="text-slate-200">{process.env.APP_BASE_URL}/accept-invite/{invite.token}</span>
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
              No pending invites yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
