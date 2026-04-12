import Link from "next/link";

type WorkspaceListProps = {
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    baseCurrencyCode: string;
    role: string;
  }>;
};

export function WorkspaceList({ workspaces }: WorkspaceListProps) {
  return (
    <section className="card rounded-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Workspaces</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Your shared finance spaces</h2>
        </div>
        <p className="text-sm text-slate-400">{workspaces.length} total</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => (
          <Link
            key={workspace.id}
            href={`/app/${workspace.slug}`}
            className="rounded-3xl border border-white/10 bg-slate-950/30 p-5 transition hover:border-emerald-300/30 hover:bg-slate-950/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{workspace.name}</h3>
                <p className="mt-2 text-sm text-slate-400">/{workspace.slug}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-300">
                {workspace.role}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Base currency: <span className="font-medium text-white">{workspace.baseCurrencyCode}</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
