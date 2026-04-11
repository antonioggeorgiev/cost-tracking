import { z } from "zod";
import { supportedCurrencies } from "@/lib/currency";
import { workspaceService } from "@/server/services/workspace-service";
import { createTRPCRouter, protectedProcedure, workspaceMemberProcedure, workspaceOwnerProcedure } from "@/server/trpc";

export const workspacesRouter = createTRPCRouter({
  listMine: protectedProcedure.query(({ ctx }) => {
    return workspaceService.listForUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(80),
        baseCurrencyCode: z.enum(supportedCurrencies),
      }),
    )
    .mutation(({ ctx, input }) => {
      return workspaceService.createForUser({
        name: input.name,
        baseCurrencyCode: input.baseCurrencyCode,
        userId: ctx.user.id,
      });
    }),

  bySlug: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx, input }) => {
      return workspaceService.getForUserBySlug({ slug: input.workspaceSlug, userId: ctx.user.id });
    }),

  updateSettings: workspaceOwnerProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        name: z.string().trim().min(2).max(80),
        baseCurrencyCode: z.enum(supportedCurrencies),
      }),
    )
    .mutation(({ ctx, input }) => {
      return workspaceService.updateSettings({
        workspaceId: ctx.membership.workspaceId,
        name: input.name,
        baseCurrencyCode: input.baseCurrencyCode,
      });
    }),
});
