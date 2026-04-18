import { z } from "zod";
import { reportingService } from "@/server/services/reporting-service";
import { createTRPCRouter, protectedProcedure, spaceMemberProcedure } from "@/server/trpc";

export const reportingRouter = createTRPCRouter({
  allSpacesOverview: protectedProcedure.query(({ ctx }) => {
    return reportingService.getAllSpacesOverview(ctx.user.id);
  }),

  dashboard: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx }) => {
      return reportingService.getSpaceDashboard({
        spaceId: ctx.membership.spaceId,
        baseCurrencyCode: ctx.membership.space.baseCurrencyCode,
      });
    }),

  overview: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx }) => {
      return reportingService.getSpaceOverview({
        spaceId: ctx.membership.spaceId,
        baseCurrencyCode: ctx.membership.space.baseCurrencyCode,
      });
    }),

  expenseMonthSummary: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx }) => {
      return reportingService.getExpenseMonthSummary(ctx.membership.spaceId);
    }),
});
