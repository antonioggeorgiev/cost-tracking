"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

const updateSettingsSchema = z.object({
  workspaceSlug: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  baseCurrencyCode: z.enum(supportedCurrencies),
});

export async function updateWorkspaceSettingsAction(formData: FormData) {
  const input = updateSettingsSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    name: formData.get("name"),
    baseCurrencyCode: formData.get("baseCurrencyCode"),
  });

  try {
    const caller = await getServerCaller();
    await caller.workspaces.updateSettings(input);
    revalidatePath(routes.workspace(input.workspaceSlug));
    revalidatePath(routes.workspaceSettings(input.workspaceSlug));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update workspace settings.";
    redirect(`${routes.workspaceSettings(input.workspaceSlug)}?error=${encodeURIComponent(message)}`);
  }
}
