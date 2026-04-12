import { createWorkspaceAction } from "@/app/(app)/workspaces/actions";
import { supportedCurrencies } from "@/lib/currency";
import { Plus } from "lucide-react";

export function WorkspaceCreator() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="font-heading text-base font-semibold text-heading">Create a new workspace</h2>
      <p className="mt-1 text-sm text-muted">
        Start with a workspace for your renovation, shared household, or another financial context.
      </p>

      <form action={createWorkspaceAction} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1.5 text-sm">
          <span className="font-medium text-heading">Workspace name</span>
          <input
            name="name"
            required
            placeholder="Apartment renovation"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <label className="grid w-full sm:w-[160px] gap-1.5 text-sm">
          <span className="font-medium text-heading">Base currency</span>
          <select name="baseCurrencyCode" defaultValue="BGN" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
            {supportedCurrencies.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </label>

        <button className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90">
          <Plus size={16} />
          Create
        </button>
      </form>
    </section>
  );
}
