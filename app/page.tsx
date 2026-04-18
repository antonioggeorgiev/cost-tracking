import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

export default async function HomePage() {
  const caller = await getServerCaller();
  const spaces = await caller.spaces.listMine();

  if (spaces.length > 0) {
    const cookieStore = await cookies();
    const existing = cookieStore.get("selectedSpace")?.value;

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
