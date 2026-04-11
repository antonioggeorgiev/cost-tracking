"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supportedCurrencies } from "@/lib/currency";
import { getServerCaller } from "@/server/trpc-caller";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  baseCurrencyCode: z.enum(supportedCurrencies),
});

export async function createWorkspaceAction(formData: FormData) {
  const input = createWorkspaceSchema.parse({
    name: formData.get("name"),
    baseCurrencyCode: formData.get("baseCurrencyCode"),
  });

  const caller = await getServerCaller();
  const workspace = await caller.workspaces.create(input);

  revalidatePath("/app");
  redirect(`/app/${workspace.slug}`);
}
