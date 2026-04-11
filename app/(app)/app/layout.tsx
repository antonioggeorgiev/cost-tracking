import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isClerkConfigured } from "@/lib/clerk";
import { getServerCaller } from "@/server/trpc-caller";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) {
    return (
      <AppShell>
        <section className="card rounded-3xl p-6">
          <h1 className="text-2xl font-semibold text-white">Auth not configured</h1>
          <p className="mt-3 text-slate-300">
            Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to enable protected app routes.
          </p>
        </section>
      </AppShell>
    );
  }

  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  const caller = await getServerCaller();
  const workspaces = await caller.workspaces.listMine();

  return <AppShell workspaces={workspaces}>{children}</AppShell>;
}
