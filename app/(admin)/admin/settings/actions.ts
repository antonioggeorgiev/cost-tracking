"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "@/server/trpc-caller";

export async function toggleSignupsAction(formData: FormData) {
  const signupsEnabled = formData.get("signupsEnabled") === "true";

  const caller = await getServerCaller();
  await caller.admin.updateConfig({ signupsEnabled });

  revalidatePath("/admin/settings");
}

export async function addAllowedEmailAction(formData: FormData) {
  const email = formData.get("email") as string;
  const note = (formData.get("note") as string) || undefined;

  const caller = await getServerCaller();
  await caller.admin.addAllowedEmail({ email, note });

  revalidatePath("/admin/settings");
}

export async function removeAllowedEmailAction(formData: FormData) {
  const id = formData.get("id") as string;

  const caller = await getServerCaller();
  await caller.admin.removeAllowedEmail({ id });

  revalidatePath("/admin/settings");
}
