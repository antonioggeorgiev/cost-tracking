import type { ReactNode } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { isClerkConfigured } from "@/lib/clerk";
import { db } from "@/lib/db";
import { routes } from "@/lib/routes";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) {
    redirect(routes.home);
  }

  const session = await auth();
  if (!session.userId) {
    redirect(routes.signIn);
  }

  const [dbUser, clerkUser] = await Promise.all([
    db.user.findUnique({
      where: { clerkUserId: session.userId },
      select: { isPlatformAdmin: true },
    }),
    currentUser(),
  ]);

  if (!dbUser?.isPlatformAdmin) {
    redirect(routes.workspaces);
  }

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
    <AdminShell user={user}>
      {children}
    </AdminShell>
  );
}
