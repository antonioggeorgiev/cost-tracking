import type { ReactNode } from "react";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";

type AppShellProps = {
  children: ReactNode;
  workspaces?: Array<{
    id: string;
    name: string;
    slug: string;
    baseCurrencyCode: string;
    role: string;
  }>;
};

export function AppShell({ children, workspaces = [] }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="container py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="card rounded-3xl p-5">
            <div className="mb-8">
              <Link href="/app" className="text-lg font-semibold text-white">
                Cost Tracking
              </Link>
              <p className="mt-2 text-sm text-muted">
                Workspace-first finance tracking for renovation, recurring costs, and debts.
              </p>
            </div>

            <nav className="space-y-2">
              <Link
                href="/app"
                className="block rounded-2xl border border-white/8 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-300/30 hover:bg-white/5"
              >
                Overview
              </Link>
            </nav>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspaces</p>
              <div className="mt-3 space-y-2">
                {workspaces.length > 0 ? (
                  workspaces.map((workspace) => (
                    <Link
                      key={workspace.id}
                      href={`/app/${workspace.slug}`}
                      className="block rounded-2xl border border-white/8 px-3 py-3 text-sm text-slate-200 transition hover:border-emerald-300/30 hover:bg-white/5"
                    >
                      <span className="block font-medium text-white">{workspace.name}</span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {workspace.baseCurrencyCode} · {workspace.role}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
                    No workspaces yet.
                  </div>
                )}
              </div>
            </div>

            {isClerkConfigured ? (
              <div className="mt-6">
                <SignOutButton>
                  <button className="w-full rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            ) : null}
          </aside>

          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
