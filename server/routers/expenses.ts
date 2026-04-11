import { z } from "zod";
import { ExpenseStatus } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { expenseService } from "@/server/services/expense-service";
import { createTRPCRouter, workspaceEditorProcedure, workspaceMemberProcedure } from "@/server/trpc";

export const expensesRouter = createTRPCRouter({
  list: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => expenseService.listWorkspaceExpenses(ctx.membership.workspaceId)),

  create: workspaceEditorProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        title: z.string().trim().min(2).max(120),
        categoryId: z.string().cuid(),
        amount: z.coerce.number().positive(),
        currencyCode: z.enum(supportedCurrencies),
        expenseDate: z.coerce.date(),
        status: z.nativeEnum(ExpenseStatus),
        description: z.string().max(500).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return expenseService.create({
        workspaceId: ctx.membership.workspaceId,
        createdByUserId: ctx.user.id,
        title: input.title,
        categoryId: input.categoryId,
        amount: input.amount,
        currencyCode: input.currencyCode,
        expenseDate: input.expenseDate,
        status: input.status,
        description: input.description,
        notes: input.notes,
      });
    }),
});
