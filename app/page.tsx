import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { routes } from "@/lib/routes";
import { getSelectedSpaceCookieValue } from "@/lib/space-cookie";
import { getServerCaller } from "@/server/trpc-caller";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) {
    redirect(routes.signIn);
  }

  const caller = await getServerCaller();
  const spaces = await caller.spaces.listMine();

  if (spaces.length > 0) {
    const existing = await getSelectedSpaceCookieValue();

    // If the user doesn't have a valid space selected, redirect to overview
    // The user can select a space from the sidebar dropdown
    if (!existing || !spaces.some((s) => s.slug === existing)) {
      // Can't set cookies in a server component — just redirect.
      // The overview page will show "All Spaces" mode if no cookie is set.
      redirect(routes.overview);
    }

    redirect(routes.overview);
  }

  redirect(routes.spaces);
}
