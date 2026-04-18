import { SpaceRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AssignableSpaceRole } from "@/lib/member-roles";

export const memberService = {
  async getSpaceMembershipBySlug(input: { spaceSlug: string; userId: string }) {
    return db.spaceMembership.findFirst({
      where: {
        userId: input.userId,
        space: {
          slug: input.spaceSlug,
          deletedAt: null,
        },
      },
      include: {
        space: true,
      },
    });
  },

  async requireSpaceMembership(input: { spaceSlug: string; userId: string }) {
    const membership = await memberService.getSpaceMembershipBySlug(input);

    if (!membership) {
      throw new Error("Space membership not found.");
    }

    return membership;
  },

  async requireSpaceOwner(input: { spaceSlug: string; userId: string }) {
    const membership = await memberService.requireSpaceMembership(input);

    if (membership.role !== SpaceRole.owner) {
      throw new Error("Only space owners can manage members.");
    }

    return membership;
  },

  async requireSpaceEditor(input: { spaceSlug: string; userId: string }) {
    const membership = await memberService.requireSpaceMembership(input);

    if (membership.role !== SpaceRole.owner && membership.role !== SpaceRole.editor) {
      throw new Error("Only space owners and editors can modify space records.");
    }

    return membership;
  },

  async listSpaceMembersAndInvites(spaceId: string) {
    const [memberships, invites] = await Promise.all([
      db.spaceMembership.findMany({
        where: { spaceId },
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
      db.spaceInvite.findMany({
        where: { spaceId, status: "pending" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { memberships, invites };
  },

  async updateSpaceMemberRole(input: { spaceId: string; membershipId: string; role: AssignableSpaceRole }) {
    const membership = await db.spaceMembership.findUnique({
      where: { id: input.membershipId },
      select: { id: true, spaceId: true, role: true },
    });

    if (!membership || membership.spaceId !== input.spaceId) {
      throw new Error("Space member not found.");
    }

    if (membership.role === SpaceRole.owner) {
      throw new Error("Owner role cannot be changed from this action.");
    }

    return db.spaceMembership.update({
      where: { id: input.membershipId },
      data: { role: input.role },
    });
  },

  async removeSpaceMember(input: { spaceId: string; membershipId: string }) {
    const membership = await db.spaceMembership.findUnique({
      where: { id: input.membershipId },
      select: { id: true, spaceId: true, role: true },
    });

    if (!membership || membership.spaceId !== input.spaceId) {
      throw new Error("Space member not found.");
    }

    if (membership.role === SpaceRole.owner) {
      throw new Error("Owner membership cannot be removed from this action.");
    }

    await db.spaceMembership.delete({ where: { id: input.membershipId } });
    return { success: true };
  },
};
