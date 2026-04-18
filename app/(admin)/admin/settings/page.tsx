import { getServerCaller } from "@/server/trpc-caller";
import { ShieldCheck, ShieldOff, Plus, Trash2, Mail } from "lucide-react";
import { format } from "date-fns";
import { toggleSignupsAction, addAllowedEmailAction, removeAllowedEmailAction } from "./actions";

export default async function AdminSettingsPage() {
  const caller = await getServerCaller();
  const [config, whitelist] = await Promise.all([
    caller.admin.getConfig(),
    caller.admin.listAllowedEmails({ perPage: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Administration</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Settings</h1>
        <p className="mt-2 text-sm text-body">Platform-wide configuration and feature controls.</p>
      </div>

      {/* Sign-ups toggle */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter">
            {config.signupsEnabled ? (
              <ShieldCheck size={18} className="text-primary" />
            ) : (
              <ShieldOff size={18} className="text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-base font-semibold text-heading">User Registrations</h2>
            <p className="mt-1 text-sm text-body">
              {config.signupsEnabled
                ? "Sign-ups are open. Anyone can create a new account."
                : "Sign-ups are closed. Only whitelisted emails can register."}
            </p>
          </div>
          <form action={toggleSignupsAction}>
            <input type="hidden" name="signupsEnabled" value={config.signupsEnabled ? "false" : "true"} />
            <button
              type="submit"
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
                config.signupsEnabled
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-heading text-on-primary hover:bg-heading/90"
              }`}
            >
              {config.signupsEnabled ? "Disable Sign-ups" : "Enable Sign-ups"}
            </button>
          </form>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              config.signupsEnabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${config.signupsEnabled ? "bg-emerald-500" : "bg-red-500"}`} />
            {config.signupsEnabled ? "Open" : "Closed"}
          </span>
          <span className="text-xs text-body">
            {whitelist.total} whitelisted {whitelist.total === 1 ? "email" : "emails"}
          </span>
        </div>
      </section>

      {/* Email whitelist */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Email Whitelist</h2>
          <p className="mt-1 text-sm text-body">
            These email addresses can register even when sign-ups are disabled.
          </p>
        </div>

        {/* Add email form */}
        <div className="border-b border-border px-6 py-4">
          <form action={addAllowedEmailAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Email address</span>
              <input
                name="email"
                type="email"
                required
                placeholder="user@example.com"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-body focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <label className="flex-1 grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Note (optional)</span>
              <input
                name="note"
                placeholder="e.g. Beta tester"
                maxLength={200}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-body focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <button className="flex items-center gap-2 rounded-xl bg-heading px-5 py-3 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90">
              <Plus size={16} />
              Add
            </button>
          </form>
        </div>

        {/* Whitelist table */}
        {whitelist.items.length > 0 ? (
          <div className="divide-y divide-border">
            {whitelist.items.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-6 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-lighter">
                  <Mail size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-heading truncate">{entry.email}</p>
                  <p className="text-xs text-body truncate">
                    {entry.note && <>{entry.note} · </>}
                    Added {format(entry.createdAt, "MMM d, yyyy")}
                  </p>
                </div>
                <form action={removeAllowedEmailAction}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button
                    type="submit"
                    className="rounded-lg p-2 text-body transition hover:bg-red-50 hover:text-red-600"
                    title="Remove from whitelist"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-body">
            No whitelisted emails yet. Add an email above to allow specific users to register when sign-ups are disabled.
          </div>
        )}
      </section>
    </div>
  );
}
