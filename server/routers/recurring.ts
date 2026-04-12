import { z } from "zod";
import { ExpenseStatus, RecurringFrequency } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { recurringService } from "@/server/services/recurring-service";
import { createTRPCRouter, workspaceEditorProcedure, workspaceMemberProcedure } from "@/server/trpc";

export const recurringRouter = createTRPCRouter({
  list: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => recurringService.listTemplates(ctx.membership.workspaceId)),

  generateDue: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .mutation(({ ctx }) => recurringService.generateDueExpenses(ctx.membership.workspaceId)),

  create: workspaceEditorProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        title: z.string().trim().min(2).max(120),
        categoryId: z.string().cuid(),
        amount: z.coerce.number().positive(),
        currencyCode: z.enum(supportedCurrencies),
        startDate: z.coerce.date(),
        frequency: z.nativeEnum(RecurringFrequency),
        interval: z.coerce.number().int().min(1).max(24),
        defaultStatus: z.nativeEnum(ExpenseStatus),
        description: z.string().max(500).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return recurringService.createTemplate({
        workspaceId: ctx.membership.workspaceId,
        createdByUserId: ctx.user.id,
        title: input.title,
        categoryId: input.categoryId,
        amount: input.amount,
        currencyCode: input.currencyCode,
        startDate: input.startDate,
        frequency: input.frequency,
        interval: input.interval,
        defaultStatus: input.defaultStatus,
        description: input.description,
        notes: input.notes,
      });
    }),
});
