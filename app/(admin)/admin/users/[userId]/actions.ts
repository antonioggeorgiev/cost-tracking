"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "@/server/trpc-caller";

export async function toggleAdminAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const isPlatformAdmin = formData.get("isPlatformAdmin") === "true";

  const caller = await getServerCaller();
  await caller.admin.setUserAdmin({ userId, isPlatformAdmin });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
