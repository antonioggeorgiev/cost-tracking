import { z } from "zod";
import { reportingService } from "@/server/services/reporting-service";
import { createTRPCRouter, workspaceMemberProcedure } from "@/server/trpc";

export const reportingRouter = createTRPCRouter({
  dashboard: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => {
      return reportingService.getWorkspaceDashboard({
        workspaceId: ctx.membership.workspaceId,
        baseCurrencyCode: ctx.membership.workspace.baseCurrencyCode,
      });
    }),

  overview: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => {
      return reportingService.getWorkspaceOverview({
        workspaceId: ctx.membership.workspaceId,
        baseCurrencyCode: ctx.membership.workspace.baseCurrencyCode,
      });
    }),

  expenseMonthSummary: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => {
      return reportingService.getExpenseMonthSummary(ctx.membership.workspaceId);
    }),
});
