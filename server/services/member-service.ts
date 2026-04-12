import { WorkspaceRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const memberService = {
  async getWorkspaceMembershipBySlug(input: { workspaceSlug: string; userId: string }) {
    return db.workspaceMembership.findFirst({
      where: {
        userId: input.userId,
        workspace: {
          slug: input.workspaceSlug,
        },
      },
      include: {
        workspace: true,
      },
    });
  },

  async requireWorkspaceMembership(input: { workspaceSlug: string; userId: string }) {
    const membership = await memberService.getWorkspaceMembershipBySlug(input);

    if (!membership) {
      throw new Error("Workspace membership not found.");
    }

    return membership;
  },

  async requireWorkspaceOwner(input: { workspaceSlug: string; userId: string }) {
    const membership = await memberService.requireWorkspaceMembership(input);

    if (membership.role !== WorkspaceRole.owner) {
      throw new Error("Only workspace owners can manage members.");
    }

    return membership;
  },

  async requireWorkspaceEditor(input: { workspaceSlug: string; userId: string }) {
    const membership = await memberService.requireWorkspaceMembership(input);

    if (membership.role !== WorkspaceRole.owner && membership.role !== WorkspaceRole.editor) {
      throw new Error("Only workspace owners and editors can modify workspace records.");
    }

    return membership;
  },

  async listWorkspaceMembersAndInvites(workspaceId: string) {
    const [memberships, invites] = await Promise.all([
      db.workspaceMembership.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              imageUrl: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      }),
      db.workspaceInvite.findMany({
        where: { workspaceId, status: "pending" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { memberships, invites };
  },

  async updateWorkspaceMemberRole(input: { workspaceId: string; membershipId: string; role: "editor" | "viewer" }) {
    const membership = await db.workspaceMembership.findUnique({
      where: { id: input.membershipId },
      select: { id: true, workspaceId: true, role: true },
    });

    if (!membership || membership.workspaceId !== input.workspaceId) {
      throw new Error("Workspace member not found.");
    }

    if (membership.role === WorkspaceRole.owner) {
      throw new Error("Owner role cannot be changed from this action.");
    }

    return db.workspaceMembership.update({
      where: { id: input.membershipId },
      data: { role: input.role },
    });
  },

  async removeWorkspaceMember(input: { workspaceId: string; membershipId: string }) {
    const membership = await db.workspaceMembership.findUnique({
      where: { id: input.membershipId },
      select: { id: true, workspaceId: true, role: true },
    });

    if (!membership || membership.workspaceId !== input.workspaceId) {
      throw new Error("Workspace member not found.");
    }

    if (membership.role === WorkspaceRole.owner) {
      throw new Error("Owner membership cannot be removed from this action.");
    }

    await db.workspaceMembership.delete({ where: { id: input.membershipId } });
    return { success: true };
  },
};
