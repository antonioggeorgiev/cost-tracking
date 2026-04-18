import { z } from "zod";
import { DebtAccountKind, DebtDirection, RecurringFrequency } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { debtService } from "@/server/services/debt-service";
import { createTRPCRouter, protectedProcedure, spaceEditorProcedure, spaceMemberProcedure } from "@/server/trpc";

export const debtsRouter = createTRPCRouter({
  listAllSpaces: protectedProcedure.query(({ ctx }) => debtService.listAllUserAccounts(ctx.user.id)),

  list: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx }) => debtService.listAccounts(ctx.membership.spaceId)),

  getById: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1), debtAccountId: z.string().min(1) }))
    .query(({ ctx, input }) => debtService.getById(ctx.membership.spaceId, input.debtAccountId)),

  update: spaceEditorProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        debtAccountId: z.string().min(1),
        kind: z.nativeEnum(DebtAccountKind).optional(),
        direction: z.nativeEnum(DebtDirection).optional(),
        name: z.string().trim().min(2).max(120).optional(),
        provider: z.string().max(120).optional().nullable(),
        counterparty: z.string().max(120).optional().nullable(),
        originalAmount: z.coerce.number().positive().optional(),
        alreadyPaid: z.coerce.number().min(0).optional().nullable(),
        currencyCode: z.enum(supportedCurrencies).optional(),
        openedAt: z.coerce.date().optional(),
        interestRateBps: z.coerce.number().int().min(0).optional().nullable(),
        termMonths: z.coerce.number().int().min(1).optional().nullable(),
        monthlyAmount: z.coerce.number().positive().optional().nullable(),
        residualValue: z.coerce.number().min(0).optional().nullable(),
        frequency: z.nativeEnum(RecurringFrequency).optional().nullable(),
        interval: z.coerce.number().int().min(1).optional().nullable(),
        anchorDays: z.array(z.number().int()).optional().nullable(),
        nextPaymentDate: z.coerce.date().optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { spaceSlug: _, debtAccountId, ...rest } = input;
      return debtService.updateAccount(ctx.membership.spaceId, debtAccountId, rest);
    }),

  createAccount: spaceEditorProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        kind: z.nativeEnum(DebtAccountKind),
        direction: z.nativeEnum(DebtDirection),
        name: z.string().trim().min(2).max(120),
        provider: z.string().max(120).optional().nullable(),
        counterparty: z.string().max(120).optional().nullable(),
        originalAmount: z.coerce.number().positive(),
        alreadyPaid: z.coerce.number().min(0).optional().nullable(),
        currencyCode: z.enum(supportedCurrencies),
        openedAt: z.coerce.date(),
        interestRateBps: z.coerce.number().int().min(0).optional().nullable(),
        termMonths: z.coerce.number().int().min(1).optional().nullable(),
        monthlyAmount: z.coerce.number().positive().optional().nullable(),
        residualValue: z.coerce.number().min(0).optional().nullable(),
        frequency: z.nativeEnum(RecurringFrequency).optional().nullable(),
        interval: z.coerce.number().int().min(1).optional().nullable(),
        anchorDays: z.array(z.number().int()).optional().nullable(),
        nextPaymentDate: z.coerce.date().optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return debtService.createAccount({
        spaceId: ctx.membership.spaceId,
        kind: input.kind,
        direction: input.direction,
        name: input.name,
        provider: input.provider,
        counterparty: input.counterparty,
        originalAmount: input.originalAmount,
        alreadyPaid: input.alreadyPaid ?? undefined,
        currencyCode: input.currencyCode,
        openedAt: input.openedAt,
        interestRateBps: input.interestRateBps,
        termMonths: input.termMonths,
        monthlyAmount: input.monthlyAmount,
        residualValue: input.residualValue,
        frequency: input.frequency,
        interval: input.interval,
        anchorDays: input.anchorDays,
        nextPaymentDate: input.nextPaymentDate,
        notes: input.notes,
      });
    }),

  createPayment: spaceEditorProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        debtAccountId: z.string().cuid(),
        amount: z.coerce.number().positive(),
        currencyCode: z.enum(supportedCurrencies),
        paymentDate: z.coerce.date(),
        dueDate: z.coerce.date().optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
        createLinkedExpense: z.boolean().default(true),
      }),
    )
    .mutation(({ ctx, input }) => {
      return debtService.createPayment({
        spaceId: ctx.membership.spaceId,
        paidByUserId: ctx.user.id,
        debtAccountId: input.debtAccountId,
        amount: input.amount,
        currencyCode: input.currencyCode,
        paymentDate: input.paymentDate,
        dueDate: input.dueDate ?? undefined,
        notes: input.notes,
        createLinkedExpense: input.createLinkedExpense,
      });
    }),

  monthStatus: spaceMemberProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        year: z.number().int(),
        month: z.number().int().min(0).max(11),
      }),
    )
    .query(({ ctx, input }) => debtService.getAllDebtsMonthStatus(ctx.membership.spaceId, input.year, input.month)),
});
