import { z } from "zod";
import { DebtAccountKind, DebtDirection, RecurringFrequency } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { debtService } from "@/server/services/debt-service";
import { createTRPCRouter, workspaceEditorProcedure, workspaceMemberProcedure } from "@/server/trpc";

export const debtsRouter = createTRPCRouter({
  list: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => debtService.listAccounts(ctx.membership.workspaceId)),

  createAccount: workspaceEditorProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        kind: z.nativeEnum(DebtAccountKind),
        direction: z.nativeEnum(DebtDirection),
        name: z.string().trim().min(2).max(120),
        provider: z.string().max(120).optional().nullable(),
        counterparty: z.string().max(120).optional().nullable(),
        originalAmount: z.coerce.number().positive(),
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
        workspaceId: ctx.membership.workspaceId,
        kind: input.kind,
        direction: input.direction,
        name: input.name,
        provider: input.provider,
        counterparty: input.counterparty,
        originalAmount: input.originalAmount,
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

  createPayment: workspaceEditorProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        debtAccountId: z.string().cuid(),
        amount: z.coerce.number().positive(),
        currencyCode: z.enum(supportedCurrencies),
        paymentDate: z.coerce.date(),
        notes: z.string().max(1000).optional().nullable(),
        createLinkedExpense: z.boolean().default(true),
      }),
    )
    .mutation(({ ctx, input }) => {
      return debtService.createPayment({
        workspaceId: ctx.membership.workspaceId,
        paidByUserId: ctx.user.id,
        debtAccountId: input.debtAccountId,
        amount: input.amount,
        currencyCode: input.currencyCode,
        paymentDate: input.paymentDate,
        notes: input.notes,
        createLinkedExpense: input.createLinkedExpense,
      });
    }),
});
