"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerCaller } from "@/server/trpc-caller";

const createInviteSchema = z.object({
  workspaceSlug: z.string().min(1),
  email: z.email(),
  role: z.enum(["editor", "viewer"]),
});

export async function createWorkspaceInviteAction(formData: FormData) {
  const input = createInviteSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  try {
    const caller = await getServerCaller();
    await caller.members.createInvite(input);
    revalidatePath(`/app/${input.workspaceSlug}/members`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create invite.";
    redirect(`/app/${input.workspaceSlug}/members?error=${encodeURIComponent(message)}`);
  }
}
