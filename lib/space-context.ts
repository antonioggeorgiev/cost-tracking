import { cookies } from "next/headers";

const COOKIE_NAME = "selectedSpace";

/** Server-side: read the selected space slug from the cookie. Returns null for "All Spaces". */
export async function getSelectedSpaceSlug(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return value || null;
}
