import { z } from "zod";
import { ExpenseStatus, RecurringFrequency, RecurringTemplateKind } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { recurringService } from "@/server/services/recurring-service";
import { createTRPCRouter, protectedProcedure, spaceEditorProcedure, spaceMemberProcedure } from "@/server/trpc";

export const recurringRouter = createTRPCRouter({
  listAllSpaces: protectedProcedure.query(({ ctx }) => recurringService.listAllUserTemplates(ctx.user.id)),

  list: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx }) => recurringService.listTemplates(ctx.membership.spaceId)),

  getById: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1), templateId: z.string().min(1) }))
    .query(({ ctx, input }) => recurringService.getById(ctx.membership.spaceId, input.templateId)),

  update: spaceEditorProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        templateId: z.string().min(1),
        title: z.string().trim().min(2).max(120).optional(),
        categoryId: z.string().cuid().optional(),
        amount: z.coerce.number().positive().optional().nullable(),
        currencyCode: z.enum(supportedCurrencies).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional().nullable(),
        frequency: z.nativeEnum(RecurringFrequency).optional(),
        interval: z.coerce.number().int().min(1).max(24).optional(),
        anchorDays: z.array(z.number().int().min(0).max(31)).optional(),
        defaultStatus: z.nativeEnum(ExpenseStatus).optional(),
        paymentUrl: z.string().url().max(500).optional().nullable(),
        description: z.string().max(500).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { spaceSlug: _, templateId, ...rest } = input;
      return recurringService.updateTemplate(ctx.membership.spaceId, templateId, rest);
    }),

  generateDue: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .mutation(({ ctx }) => recurringService.generateDueExpenses(ctx.membership.spaceId)),

  dueVariable: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx }) => recurringService.listDueVariableTemplates(ctx.membership.spaceId)),

  create: spaceEditorProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
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
        spaceId: ctx.membership.spaceId,
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

  markFixedAsPaid: spaceEditorProcedure
    .input(z.object({ spaceSlug: z.string().min(1), templateId: z.string().cuid() }))
    .mutation(({ ctx, input }) => {
      return recurringService.markFixedAsPaid({
        spaceId: ctx.membership.spaceId,
        createdByUserId: ctx.user.id,
        templateId: input.templateId,
      });
    }),

  recordVariableExpense: spaceEditorProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        templateId: z.string().cuid(),
        amount: z.coerce.number().positive(),
        notes: z.string().max(1000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return recurringService.recordVariableExpense({
        spaceId: ctx.membership.spaceId,
        createdByUserId: ctx.user.id,
        templateId: input.templateId,
        amount: input.amount,
        notes: input.notes,
      });
    }),
});
