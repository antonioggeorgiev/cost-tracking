import { z } from "zod";
import { db } from "@/lib/db";
import { assignableSpaceRoleSchema } from "@/lib/member-roles";
import { inviteService } from "@/server/services/invite-service";
import { memberService } from "@/server/services/member-service";
import { createTRPCRouter, protectedProcedure, spaceMemberProcedure, spaceOwnerProcedure } from "@/server/trpc";

export const membersRouter = createTRPCRouter({
  list: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(async ({ ctx }) => {
      const data = await memberService.listSpaceMembersAndInvites(ctx.membership.spaceId);

      return {
        space: ctx.membership.space,
        role: ctx.membership.role,
        ...data,
      };
    }),

  listSimple: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(async ({ ctx }) => {
      const memberships = await db.spaceMembership.findMany({
        where: { spaceId: ctx.membership.spaceId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      });
      return memberships.map(m => ({
        userId: m.user.id,
        name: m.user.name || m.user.email,
      }));
    }),

  createInvite: spaceOwnerProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        email: z.email(),
        role: assignableSpaceRoleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invite = await inviteService.createSpaceInvite({
        spaceId: ctx.membership.spaceId,
        invitedByUserId: ctx.user.id,
        email: input.email,
        role: input.role,
      });

      await inviteService.sendSpaceInviteEmail({
        spaceName: ctx.membership.space.name,
        recipientEmail: invite.email,
        token: invite.token,
      });

      return invite;
    }),

  updateRole: spaceOwnerProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        membershipId: z.string().cuid(),
        role: assignableSpaceRoleSchema,
      }),
    )
    .mutation(({ ctx, input }) => {
      return memberService.updateSpaceMemberRole({
        spaceId: ctx.membership.spaceId,
        membershipId: input.membershipId,
        role: input.role,
      });
    }),

  removeMember: spaceOwnerProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        membershipId: z.string().cuid(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return memberService.removeSpaceMember({
        spaceId: ctx.membership.spaceId,
        membershipId: input.membershipId,
      });
    }),

  revokeInvite: spaceOwnerProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        inviteId: z.string().cuid(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return inviteService.revokeSpaceInvite({
        spaceId: ctx.membership.spaceId,
        inviteId: input.inviteId,
      });
    }),

  inviteByToken: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(({ input }) => inviteService.getInviteByToken(input.token)),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const email = ctx.clerkUser.primaryEmailAddress?.emailAddress;

      if (!email) {
        throw new Error("Your account needs a primary email before accepting an invite.");
      }

      return inviteService.acceptSpaceInvite({
        token: input.token,
        userId: ctx.user.id,
        userEmail: email,
      });
    }),
});
