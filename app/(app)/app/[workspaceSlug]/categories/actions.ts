"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerCaller } from "@/server/trpc-caller";

const createCategorySchema = z.object({
  workspaceSlug: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  parentCategoryId: z.string().cuid().nullable(),
});

export async function createCategoryAction(formData: FormData) {
  const input = createCategorySchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    name: formData.get("name"),
    parentCategoryId: formData.get("parentCategoryId") || null,
  });

  const caller = await getServerCaller();
  await caller.categories.create(input);

  revalidatePath(`/app/${input.workspaceSlug}/categories`);
  revalidatePath(`/app/${input.workspaceSlug}`);
}
