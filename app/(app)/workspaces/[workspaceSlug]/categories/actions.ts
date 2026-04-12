"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { routes } from "@/lib/routes";
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
  const category = await caller.categories.create(input);

  revalidatePath(routes.workspaceCategories(input.workspaceSlug));
  revalidatePath(routes.workspace(input.workspaceSlug));

  return { id: category.id };
}

export async function createCategoryFormAction(formData: FormData) {
  await createCategoryAction(formData);
}
