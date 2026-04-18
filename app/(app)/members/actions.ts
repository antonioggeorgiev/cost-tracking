"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

const createInviteSchema = z.object({
  spaceSlug: z.string().min(1),
  email: z.email(),
  role: z.enum(["editor", "viewer"]),
});

const updateRoleSchema = z.object({
  spaceSlug: z.string().min(1),
  membershipId: z.string().cuid(),
  role: z.enum(["editor", "viewer"]),
});

const removeMemberSchema = z.object({
  spaceSlug: z.string().min(1),
  membershipId: z.string().cuid(),
});

const revokeInviteSchema = z.object({
  spaceSlug: z.string().min(1),
  inviteId: z.string().cuid(),
});

export async function createWorkspaceInviteAction(formData: FormData) {
  const input = createInviteSchema.parse({
    spaceSlug: formData.get("spaceSlug"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  try {
    const caller = await getServerCaller();
    await caller.members.createInvite(input);
    revalidatePath(routes.members);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create invite.";
    redirect(`${routes.members}?error=${encodeURIComponent(message)}`);
  }
}

export async function updateWorkspaceMemberRoleAction(formData: FormData) {
  const input = updateRoleSchema.parse({
    spaceSlug: formData.get("spaceSlug"),
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });

  try {
    const caller = await getServerCaller();
    await caller.members.updateRole(input);
    revalidatePath(routes.members);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update member role.";
    redirect(`${routes.members}?error=${encodeURIComponent(message)}`);
  }
}

export async function removeWorkspaceMemberAction(formData: FormData) {
  const input = removeMemberSchema.parse({
    spaceSlug: formData.get("spaceSlug"),
    membershipId: formData.get("membershipId"),
  });

  try {
    const caller = await getServerCaller();
    await caller.members.removeMember(input);
    revalidatePath(routes.members);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove member.";
    redirect(`${routes.members}?error=${encodeURIComponent(message)}`);
  }
}

export async function revokeWorkspaceInviteAction(formData: FormData) {
  const input = revokeInviteSchema.parse({
    spaceSlug: formData.get("spaceSlug"),
    inviteId: formData.get("inviteId"),
  });

  try {
    const caller = await getServerCaller();
    await caller.members.revokeInvite(input);
    revalidatePath(routes.members);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to revoke invite.";
    redirect(`${routes.members}?error=${encodeURIComponent(message)}`);
  }
}
