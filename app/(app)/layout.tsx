import type { ReactNode } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SpaceProvider } from "@/components/space-context";
import { isClerkConfigured } from "@/lib/clerk";
import { db } from "@/lib/db";
import { routes } from "@/lib/routes";
import { getSelectedSpaceSlug } from "@/lib/space-context";
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

  const [caller, clerkUser, dbUser] = await Promise.all([
    getServerCaller(),
    currentUser(),
    db.user.findUnique({
      where: { clerkUserId: session.userId },
      select: { isPlatformAdmin: true },
    }),
  ]);

  if (!dbUser) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <h1 className="font-heading text-xl font-bold text-heading">
            Account Not Activated
          </h1>
          <p className="mt-3 text-sm text-body">
            New registrations are currently disabled. Your account has not been
            activated. Please contact an administrator for access.
          </p>
          <SignOutButton>
            <button className="mt-5 inline-block rounded-lg bg-heading px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </main>
    );
  }

  const spaces = await caller.spaces.listMine();

  const user = clerkUser
    ? {
        name:
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          clerkUser.username ||
          "User",
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: clerkUser.imageUrl,
        isPlatformAdmin: dbUser?.isPlatformAdmin ?? false,
      }
    : undefined;

  // Read selected space from cookie
  const selectedSlug = await getSelectedSpaceSlug();
  const selectedSpace = selectedSlug
    ? spaces.find((s) => s.slug === selectedSlug) ?? null
    : null;

  return (
    <SpaceProvider spaces={spaces} selectedSpace={selectedSpace}>
      <AppShell spaces={spaces} selectedSpace={selectedSpace} user={user}>
        {children}
      </AppShell>
    </SpaceProvider>
  );
}
