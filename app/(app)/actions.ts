"use server";

import {
  clearSelectedSpaceCookie,
  setSelectedSpaceCookie,
} from "@/lib/space-cookie";

export async function switchSpace(slug: string | null) {
  if (slug) {
    await setSelectedSpaceCookie(slug);
  } else {
    await clearSelectedSpaceCookie();
  }
}
