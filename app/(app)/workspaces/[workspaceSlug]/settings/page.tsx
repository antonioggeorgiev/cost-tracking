import { updateWorkspaceSettingsAction } from "@/app/(app)/workspaces/[workspaceSlug]/settings/actions";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { supportedCurrencies } from "@/lib/currency";
import { getServerCaller } from "@/server/trpc-caller";
import { Settings as SettingsIcon, Shield } from "lucide-react";

type SettingsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { workspaceSlug } = await params;
  const { error } = await searchParams;
  const caller = await getServerCaller();
  const workspace = await caller.workspaces.bySlug({ workspaceSlug });

  if (!workspace) {
    return null;
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{workspace.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Settings</h1>
          <p className="mt-2 text-sm text-body">Workspace configuration. Owner-only access.</p>
        </div>
        <MemberRoleBadge role={role} />
      </div>

      {error ? (
        <section className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </section>
      ) : null}

      {/* Workspace details */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <SettingsIcon size={18} />
          </div>
          <h2 className="font-heading text-base font-semibold text-heading">Workspace Details</h2>
        </div>

        {canManage ? (
          <form action={updateWorkspaceSettingsAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Name</span>
              <input name="name" defaultValue={workspace.name} required className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Base currency</span>
              <select name="baseCurrencyCode" defaultValue={workspace.baseCurrencyCode} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                {supportedCurrencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <div className="sm:col-span-2">
              <button className="rounded-xl bg-heading px-5 py-3 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90">
                Save Settings
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Shield size={24} className="mx-auto text-body" />
            <p className="mt-2 text-sm text-body">Only workspace owners can update settings.</p>
          </div>
        )}
      </section>

      {/* Workspace info */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="font-heading text-base font-semibold text-heading">Workspace Info</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Slug</p>
            <p className="mt-1 font-medium text-heading">/{workspace.slug}</p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Currency</p>
            <p className="mt-1 font-medium text-heading">{workspace.baseCurrencyCode}</p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Members</p>
            <p className="mt-1 font-medium text-heading">{workspace._count.memberships}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
