import { cookies } from "next/headers";

export const SELECTED_SPACE_COOKIE_NAME = "selectedSpace";

const SELECTED_SPACE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function getSelectedSpaceCookieValue() {
  const cookieStore = await cookies();
  return cookieStore.get(SELECTED_SPACE_COOKIE_NAME)?.value ?? null;
}

export async function setSelectedSpaceCookie(spaceSlug: string) {
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_SPACE_COOKIE_NAME, spaceSlug, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: SELECTED_SPACE_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearSelectedSpaceCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SELECTED_SPACE_COOKIE_NAME);
}
