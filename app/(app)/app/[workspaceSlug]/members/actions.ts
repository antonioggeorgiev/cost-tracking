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

const updateRoleSchema = z.object({
  workspaceSlug: z.string().min(1),
  membershipId: z.string().cuid(),
  role: z.enum(["editor", "viewer"]),
});

const removeMemberSchema = z.object({
  workspaceSlug: z.string().min(1),
  membershipId: z.string().cuid(),
});

const revokeInviteSchema = z.object({
  workspaceSlug: z.string().min(1),
  inviteId: z.string().cuid(),
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

export async function updateWorkspaceMemberRoleAction(formData: FormData) {
  const input = updateRoleSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });

  try {
    const caller = await getServerCaller();
    await caller.members.updateRole(input);
    revalidatePath(`/app/${input.workspaceSlug}/members`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update member role.";
    redirect(`/app/${input.workspaceSlug}/members?error=${encodeURIComponent(message)}`);
  }
}

export async function removeWorkspaceMemberAction(formData: FormData) {
  const input = removeMemberSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    membershipId: formData.get("membershipId"),
  });

  try {
    const caller = await getServerCaller();
    await caller.members.removeMember(input);
    revalidatePath(`/app/${input.workspaceSlug}/members`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove member.";
    redirect(`/app/${input.workspaceSlug}/members?error=${encodeURIComponent(message)}`);
  }
}

export async function revokeWorkspaceInviteAction(formData: FormData) {
  const input = revokeInviteSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    inviteId: formData.get("inviteId"),
  });

  try {
    const caller = await getServerCaller();
    await caller.members.revokeInvite(input);
    revalidatePath(`/app/${input.workspaceSlug}/members`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to revoke invite.";
    redirect(`/app/${input.workspaceSlug}/members?error=${encodeURIComponent(message)}`);
  }
}
