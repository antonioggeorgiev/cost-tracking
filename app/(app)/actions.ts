"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "selectedSpace";

export async function switchSpace(slug: string | null) {
  const cookieStore = await cookies();

  if (slug) {
    cookieStore.set(COOKIE_NAME, slug, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    cookieStore.delete(COOKIE_NAME);
  }
}
