import { notFound } from "next/navigation";
import { updateSpaceSettingsAction } from "@/app/(app)/settings/actions";
import { DeleteSpaceDialog } from "@/components/delete-space-dialog";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { supportedCurrencies } from "@/lib/currency";
import { getSelectedSpaceSlug } from "@/lib/space-context";
import { getServerCaller } from "@/server/trpc-caller";
import { Settings as SettingsIcon, Shield, AlertTriangle } from "lucide-react";

type SettingsPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const spaceSlug = await getSelectedSpaceSlug();

  if (!spaceSlug) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-heading">No space selected</h1>
        <p className="mt-2 text-sm text-body">Select a space to manage settings.</p>
      </div>
    );
  }

  const { error } = await searchParams;
  const caller = await getServerCaller();
  const space = await caller.spaces.bySlug({ spaceSlug });

  if (!space) {
    notFound();
  }

  const role = space.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{space.name}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Settings</h1>
          <p className="mt-2 text-sm text-body">Space configuration. Owner-only access.</p>
        </div>
        <MemberRoleBadge role={role} />
      </div>

      {error ? (
        <section className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </section>
      ) : null}

      {/* Space details */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <SettingsIcon size={18} />
          </div>
          <h2 className="font-heading text-base font-semibold text-heading">Space Details</h2>
        </div>

        {canManage ? (
          <form action={updateSpaceSettingsAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="spaceSlug" value={spaceSlug} />

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Name</span>
              <input name="name" defaultValue={space.name} required className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Base currency</span>
              <select name="baseCurrencyCode" defaultValue={space.baseCurrencyCode} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
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
            <p className="mt-2 text-sm text-body">Only space owners can update settings.</p>
          </div>
        )}
      </section>

      {/* Space info */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="font-heading text-base font-semibold text-heading">Space Info</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Slug</p>
            <p className="mt-1 font-medium text-heading">/{space.slug}</p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Currency</p>
            <p className="mt-1 font-medium text-heading">{space.baseCurrencyCode}</p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Members</p>
            <p className="mt-1 font-medium text-heading">{space._count.memberships}</p>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      {canManage && (
        <section className="rounded-2xl border border-danger/30 bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-heading">Danger Zone</h2>
              <p className="text-xs text-body">Irreversible actions</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-danger/20 p-4">
            <div>
              <p className="text-sm font-medium text-heading">Delete this space</p>
              <p className="mt-0.5 text-xs text-body">
                All expenses, categories, and member data will become inaccessible.
              </p>
            </div>
            <DeleteSpaceDialog spaceSlug={spaceSlug} spaceName={space.name} />
          </div>
        </section>
      )}
    </div>
  );
}
