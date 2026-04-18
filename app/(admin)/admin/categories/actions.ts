"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "@/server/trpc-caller";

export async function createPlatformCategoryAction(formData: FormData) {
  const name = formData.get("name") as string;
  const parentCategoryId = (formData.get("parentCategoryId") as string) || null;
  const color = (formData.get("color") as string) || null;

  const caller = await getServerCaller();
  await caller.admin.createPlatformCategory({ name, parentCategoryId, color });

  revalidatePath("/admin/categories");
}

export async function updatePlatformCategoryAction(formData: FormData) {
  const categoryId = formData.get("categoryId") as string;
  const isArchived = formData.get("isArchived") === "true";

  const caller = await getServerCaller();
  await caller.admin.updatePlatformCategory({ categoryId, isArchived });

  revalidatePath("/admin/categories");
}
