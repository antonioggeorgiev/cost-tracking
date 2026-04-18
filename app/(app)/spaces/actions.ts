"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

const createSpaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  baseCurrencyCode: z.enum(supportedCurrencies),
});

export async function createSpaceAction(formData: FormData) {
  const input = createSpaceSchema.parse({
    name: formData.get("name"),
    baseCurrencyCode: formData.get("baseCurrencyCode"),
  });

  const caller = await getServerCaller();
  const space = await caller.spaces.create(input);

  const cookieStore = await cookies();
  cookieStore.set("selectedSpace", space.slug, { path: "/" });

  revalidatePath(routes.spaces);
  redirect(routes.overview);
}
