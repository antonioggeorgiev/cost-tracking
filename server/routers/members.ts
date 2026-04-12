import { z } from "zod";
import { inviteService } from "@/server/services/invite-service";
import { memberService } from "@/server/services/member-service";
import { createTRPCRouter, protectedProcedure, workspaceMemberProcedure, workspaceOwnerProcedure } from "@/server/trpc";

export const membersRouter = createTRPCRouter({
  list: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(async ({ ctx }) => {
      const data = await memberService.listWorkspaceMembersAndInvites(ctx.membership.workspaceId);

      return {
        workspace: ctx.membership.workspace,
        role: ctx.membership.role,
        ...data,
      };
    }),

  createInvite: workspaceOwnerProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        email: z.email(),
        role: z.enum(["editor", "viewer"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invite = await inviteService.createWorkspaceInvite({
        workspaceId: ctx.membership.workspaceId,
        invitedByUserId: ctx.user.id,
        email: input.email,
        role: input.role,
      });

      await inviteService.sendWorkspaceInviteEmail({
        workspaceName: ctx.membership.workspace.name,
        recipientEmail: invite.email,
        token: invite.token,
      });

      return invite;
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

      return inviteService.acceptWorkspaceInvite({
        token: input.token,
        userId: ctx.user.id,
        userEmail: email,
      });
    }),
});
