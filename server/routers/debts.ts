import { z } from "zod";
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
        name: z.string().trim().min(2).max(120),
        provider: z.string().max(120).optional().nullable(),
        originalAmount: z.coerce.number().positive(),
        currencyCode: z.enum(supportedCurrencies),
        openedAt: z.coerce.date(),
        notes: z.string().max(1000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return debtService.createAccount({
        workspaceId: ctx.membership.workspaceId,
        name: input.name,
        provider: input.provider,
        originalAmount: input.originalAmount,
        currencyCode: input.currencyCode,
        openedAt: input.openedAt,
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
