import { z } from "zod";
import { ExpenseStatus, RecurringFrequency, RecurringTemplateKind } from "@/generated/prisma/enums";
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

  dueVariable: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => recurringService.listDueVariableTemplates(ctx.membership.workspaceId)),

  create: workspaceEditorProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        kind: z.nativeEnum(RecurringTemplateKind),
        title: z.string().trim().min(2).max(120),
        categoryId: z.string().cuid(),
        amount: z.coerce.number().positive().optional(),
        currencyCode: z.enum(supportedCurrencies),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional().nullable(),
        frequency: z.nativeEnum(RecurringFrequency),
        interval: z.coerce.number().int().min(1).max(24),
        anchorDays: z.array(z.number().int().min(0).max(31)).default([]),
        defaultStatus: z.nativeEnum(ExpenseStatus),
        paymentUrl: z.url().max(500).optional().nullable(),
        description: z.string().max(500).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return recurringService.createTemplate({
        workspaceId: ctx.membership.workspaceId,
        createdByUserId: ctx.user.id,
        kind: input.kind,
        title: input.title,
        categoryId: input.categoryId,
        amount: input.amount,
        currencyCode: input.currencyCode,
        startDate: input.startDate,
        endDate: input.endDate,
        frequency: input.frequency,
        interval: input.interval,
        anchorDays: input.anchorDays,
        defaultStatus: input.defaultStatus,
        paymentUrl: input.paymentUrl,
        description: input.description,
        notes: input.notes,
      });
    }),

  recordVariableExpense: workspaceEditorProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        templateId: z.string().cuid(),
        amount: z.coerce.number().positive(),
        notes: z.string().max(1000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return recurringService.recordVariableExpense({
        workspaceId: ctx.membership.workspaceId,
        createdByUserId: ctx.user.id,
        templateId: input.templateId,
        amount: input.amount,
        notes: input.notes,
      });
    }),
});
