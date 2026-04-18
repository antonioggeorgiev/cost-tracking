import { z } from "zod";
import { ExpenseStatus } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { expenseService } from "@/server/services/expense-service";
import { createTRPCRouter, protectedProcedure, spaceEditorProcedure, spaceMemberProcedure } from "@/server/trpc";

export const expensesRouter = createTRPCRouter({
  listAllSpaces: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      categoryId: z.string().optional(),
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      page: z.coerce.number().int().min(1).optional(),
      perPage: z.coerce.number().int().min(1).max(100).optional(),
    }))
    .query(({ ctx, input }) => expenseService.listAllUserExpenses(ctx.user.id, input)),

  list: spaceMemberProcedure
    .input(z.object({
      spaceSlug: z.string().min(1),
      search: z.string().optional(),
      categoryId: z.string().optional(),
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      page: z.coerce.number().int().min(1).optional(),
      perPage: z.coerce.number().int().min(1).max(100).optional(),
    }))
    .query(({ ctx, input }) => expenseService.listSpaceExpenses(ctx.membership.spaceId, {
      search: input.search,
      categoryId: input.categoryId,
      status: input.status,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      page: input.page,
      perPage: input.perPage,
    })),

  getById: spaceMemberProcedure
    .input(z.object({
      spaceSlug: z.string().min(1),
      expenseId: z.string().min(1),
    }))
    .query(({ ctx, input }) => expenseService.getById(ctx.membership.spaceId, input.expenseId)),

  update: spaceEditorProcedure
    .input(z.object({
      spaceSlug: z.string().min(1),
      expenseId: z.string().min(1),
      title: z.string().trim().min(2).max(120).optional(),
      categoryId: z.string().cuid().optional().nullable(),
      amount: z.coerce.number().positive().optional(),
      currencyCode: z.enum(supportedCurrencies).optional(),
      expenseDate: z.coerce.date().optional(),
      status: z.nativeEnum(ExpenseStatus).optional(),
      description: z.string().max(500).optional().nullable(),
      notes: z.string().max(1000).optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { spaceSlug: _, expenseId, ...data } = input;
      return expenseService.update(ctx.membership.spaceId, expenseId, data);
    }),

  create: spaceEditorProcedure
    .input(
      z.object({
        spaceSlug: z.string().min(1),
        title: z.string().trim().min(2).max(120),
        categoryId: z.string().cuid().optional().nullable(),
        amount: z.coerce.number().positive(),
        currencyCode: z.enum(supportedCurrencies),
        expenseDate: z.coerce.date(),
        status: z.nativeEnum(ExpenseStatus),
        description: z.string().max(500).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
        paidByUserId: z.string().cuid().optional(),
        splitEqually: z.boolean().optional(),
        splits: z.array(z.object({
          userId: z.string().cuid(),
          shareAmountMinor: z.number().int().min(0),
        })).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let splits = input.splits;

      if (input.splitEqually && !splits) {
        const memberships = await db.spaceMembership.findMany({
          where: { spaceId: ctx.membership.spaceId },
          select: { userId: true },
        });

        if (memberships.length > 1) {
          const totalMinor = toMinorUnits(input.amount);
          const perPerson = Math.floor(totalMinor / memberships.length);
          const remainder = totalMinor - perPerson * memberships.length;

          splits = memberships.map((m, i) => ({
            userId: m.userId,
            shareAmountMinor: perPerson + (i < remainder ? 1 : 0),
          }));
        }
      }

      return expenseService.create({
        spaceId: ctx.membership.spaceId,
        createdByUserId: ctx.user.id,
        paidByUserId: input.paidByUserId,
        title: input.title,
        categoryId: input.categoryId,
        amount: input.amount,
        currencyCode: input.currencyCode,
        expenseDate: input.expenseDate,
        status: input.status,
        description: input.description,
        notes: input.notes,
        splits,
      });
    }),

  settlements: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx }) => expenseService.getSettlementBalances(ctx.membership.spaceId)),
});
