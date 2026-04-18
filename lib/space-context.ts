import { getSelectedSpaceCookieValue } from "@/lib/space-cookie";

/** Server-side: read the selected space slug from the cookie. Returns null for "All Spaces". */
export async function getSelectedSpaceSlug(): Promise<string | null> {
  return getSelectedSpaceCookieValue();
}
