"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

const updateSettingsSchema = z.object({
  spaceSlug: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  baseCurrencyCode: z.enum(supportedCurrencies),
});

export async function updateSpaceSettingsAction(formData: FormData) {
  const input = updateSettingsSchema.parse({
    spaceSlug: formData.get("spaceSlug"),
    name: formData.get("name"),
    baseCurrencyCode: formData.get("baseCurrencyCode"),
  });

  try {
    const caller = await getServerCaller();
    await caller.spaces.updateSettings(input);
    revalidatePath(routes.overview);
    revalidatePath(routes.settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update space settings.";
    redirect(`${routes.settings}?error=${encodeURIComponent(message)}`);
  }
}

const deleteSpaceSchema = z.object({
  spaceSlug: z.string().min(1),
});

export async function deleteSpaceAction(formData: FormData) {
  const input = deleteSpaceSchema.parse({
    spaceSlug: formData.get("spaceSlug"),
  });

  const caller = await getServerCaller();
  await caller.spaces.delete({ spaceSlug: input.spaceSlug });

  const cookieStore = await cookies();
  cookieStore.delete("selectedSpace");

  revalidatePath(routes.spaces);
  redirect(routes.spaces);
}
