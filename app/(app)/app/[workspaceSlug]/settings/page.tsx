import { updateWorkspaceSettingsAction } from "@/app/(app)/app/[workspaceSlug]/settings/actions";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { supportedCurrencies } from "@/lib/currency";
import { getServerCaller } from "@/server/trpc-caller";

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
      <section className="card rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">{workspace.name}</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Settings</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Workspace settings are owner-only. Base currency changes affect future reporting display and new records.
            </p>
          </div>
          <MemberRoleBadge role={role} />
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {decodeURIComponent(error)}
        </section>
      ) : null}

      <section className="card rounded-3xl p-6">
        <h2 className="text-xl font-semibold text-white">Workspace details</h2>

        {canManage ? (
          <form action={updateWorkspaceSettingsAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Name</span>
              <input name="name" defaultValue={workspace.name} required className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none" />
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Base currency</span>
              <select name="baseCurrencyCode" defaultValue={workspace.baseCurrencyCode} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none">
                {supportedCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2">
              <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">Save settings</button>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
            Only workspace owners can update settings.
          </div>
        )}
      </section>
    </div>
  );
}
