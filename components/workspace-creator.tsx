import { createWorkspaceAction } from "@/app/(app)/app/actions";
import { supportedCurrencies } from "@/lib/currency";

export function WorkspaceCreator() {
  return (
    <section className="card rounded-3xl p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Workspace setup</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Create your first workspace</h2>
      <p className="mt-3 max-w-2xl text-slate-300">
        Start with a workspace for your apartment renovation, shared household spending, or another financial context.
      </p>

      <form action={createWorkspaceAction} className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto]">
        <label className="grid gap-2 text-sm text-slate-200">
          <span>Workspace name</span>
          <input
            name="name"
            required
            placeholder="Apartment renovation"
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
          />
        </label>

        <label className="grid gap-2 text-sm text-slate-200">
          <span>Base currency</span>
          <select
            name="baseCurrencyCode"
            defaultValue="BGN"
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
          >
            {supportedCurrencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button className="w-full rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">
            Create workspace
          </button>
        </div>
      </form>
    </section>
  );
}
