import { z } from "zod";
import { supportedCurrencies } from "@/lib/currency";
import { spaceService } from "@/server/services/space-service";
import { createTRPCRouter, protectedProcedure, spaceMemberProcedure, spaceOwnerProcedure } from "@/server/trpc";

export const spacesRouter = createTRPCRouter({
  listMine: protectedProcedure.query(({ ctx }) => {
    return spaceService.listForUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(80),
        baseCurrencyCode: z.enum(supportedCurrencies),
      }),
    )
    .mutation(({ ctx, input }) => {
      return spaceService.createForUser({
        name: input.name,
        baseCurrencyCode: input.baseCurrencyCode,
        userId: ctx.user.id,
      });
    }),

  bySlug: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx, input }) => {
      return spaceService.getForUserBySlug({ slug: input.spaceSlug, userId: ctx.user.id });
    }),

  updateSettings: spaceOwnerProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        name: z.string().trim().min(2).max(80),
        baseCurrencyCode: z.enum(supportedCurrencies),
      }),
    )
    .mutation(({ ctx, input }) => {
      return spaceService.updateSettings({
        spaceId: ctx.membership.spaceId,
        name: input.name,
        baseCurrencyCode: input.baseCurrencyCode,
      });
    }),

  delete: spaceOwnerProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .mutation(({ ctx }) => {
      return spaceService.softDelete(ctx.membership.spaceId);
    }),
});
