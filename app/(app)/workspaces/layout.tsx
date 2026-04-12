import type { ReactNode } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isClerkConfigured } from "@/lib/clerk";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) {
    return (
      <AppShell>
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-heading">Auth not configured</h1>
          <p className="mt-3 text-body">
            Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to enable protected app routes.
          </p>
        </section>
      </AppShell>
    );
  }

  const session = await auth();

  if (!session.userId) {
    redirect(routes.signIn);
  }

  const [caller, clerkUser] = await Promise.all([
    getServerCaller(),
    currentUser(),
  ]);
  const workspaces = await caller.workspaces.listMine();

  const user = clerkUser
    ? {
        name:
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          clerkUser.username ||
          "User",
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: clerkUser.imageUrl,
      }
    : undefined;

  return (
    <AppShell workspaces={workspaces} user={user}>
      {children}
    </AppShell>
  );
}
