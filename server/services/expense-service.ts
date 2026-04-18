import { ExpenseStatus, ExpenseType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { fxService } from "@/server/services/fx";

export const expenseService = {
  async listSpaceExpenses(spaceId: string, options?: {
    search?: string;
    categoryId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
  }) {
    const page = options?.page ?? 1;
    const perPage = options?.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = { spaceId };

    if (options?.search) {
      where.title = { contains: options.search, mode: "insensitive" };
    }
    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }
    if (options?.status && options.status !== "all") {
      where.status = options.status;
    }
    if (options?.dateFrom || options?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (options.dateFrom) dateFilter.gte = new Date(options.dateFrom);
      if (options.dateTo) {
        const to = new Date(options.dateTo);
        to.setHours(23, 59, 59, 999);
        dateFilter.lte = to;
      }
      where.expenseDate = dateFilter;
    }

    const [expenses, total, aggregates] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          category: { include: { parentCategory: true } },
          createdByUser: { select: { name: true, email: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: perPage,
      }),
      db.expense.count({ where }),
      db.expense.aggregate({ where, _sum: { workspaceAmountMinor: true } }),
    ]);

    const totalAmount = aggregates._sum.workspaceAmountMinor ?? 0;

    return {
      items: expenses.map((expense) => ({
        ...expense,
        categoryPath: expense.category
          ? (expense.category.parentCategory ? `${expense.category.parentCategory.name} / ${expense.category.name}` : expense.category.name)
          : "Uncategorized",
        createdByLabel: expense.createdByUser.name || expense.createdByUser.email,
      })),
      total,
      totalAmount,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  async listAllUserExpenses(userId: string, options?: {
    search?: string;
    categoryId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
  }) {
    const memberships = await db.spaceMembership.findMany({
      where: { userId },
      select: { spaceId: true },
    });
    const spaceIds = memberships.map(m => m.spaceId);

    const page = options?.page ?? 1;
    const perPage = options?.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = { spaceId: { in: spaceIds } };

    if (options?.search) {
      where.title = { contains: options.search, mode: "insensitive" };
    }
    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }
    if (options?.status && options.status !== "all") {
      where.status = options.status;
    }
    if (options?.dateFrom || options?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (options.dateFrom) dateFilter.gte = new Date(options.dateFrom);
      if (options.dateTo) {
        const to = new Date(options.dateTo);
        to.setHours(23, 59, 59, 999);
        dateFilter.lte = to;
      }
      where.expenseDate = dateFilter;
    }

    const [expenses, total, aggregates] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          category: { include: { parentCategory: true } },
          createdByUser: { select: { name: true, email: true } },
          space: { select: { name: true, slug: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: perPage,
      }),
      db.expense.count({ where }),
      db.expense.aggregate({ where, _sum: { workspaceAmountMinor: true } }),
    ]);

    const totalAmount = aggregates._sum.workspaceAmountMinor ?? 0;

    return {
      items: expenses.map((expense) => ({
        ...expense,
        spaceName: expense.space.name,
        spaceSlug: expense.space.slug,
        categoryPath: expense.category
          ? (expense.category.parentCategory ? `${expense.category.parentCategory.name} / ${expense.category.name}` : expense.category.name)
          : "Uncategorized",
        createdByLabel: expense.createdByUser.name || expense.createdByUser.email,
      })),
      total,
      totalAmount,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  async getById(spaceId: string, expenseId: string) {
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: {
        category: { include: { parentCategory: true } },
        createdByUser: { select: { name: true, email: true } },
        attachments: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!expense || expense.spaceId !== spaceId) return null;

    return {
      ...expense,
      categoryPath: expense.category
        ? (expense.category.parentCategory
          ? `${expense.category.parentCategory.name} / ${expense.category.name}`
          : expense.category.name)
        : "Uncategorized",
      createdByLabel: expense.createdByUser.name || expense.createdByUser.email,
    };
  },

  async update(spaceId: string, expenseId: string, input: {
    title?: string;
    categoryId?: string | null;
    amount?: number;
    currencyCode?: string;
    expenseDate?: Date;
    status?: (typeof ExpenseStatus)[keyof typeof ExpenseStatus];
    description?: string | null;
    notes?: string | null;
  }) {
    const existing = await db.expense.findUnique({ where: { id: expenseId } });
    if (!existing || existing.spaceId !== spaceId) throw new Error("Expense not found.");

    const space = await db.space.findUnique({ where: { id: spaceId }, select: { baseCurrencyCode: true } });
    if (!space) throw new Error("Space not found.");

    const data: Record<string, unknown> = {};

    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.categoryId !== undefined) {
      if (input.categoryId) {
        const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, spaceId: true, isArchived: true } });
        if (!category || (category.spaceId !== null && category.spaceId !== spaceId)) throw new Error("Category does not belong to this space.");
        if (category.isArchived) throw new Error("Archived categories cannot be used.");
      }
      data.categoryId = input.categoryId || null;
    }
    if (input.expenseDate !== undefined) data.expenseDate = input.expenseDate;

    // Recalculate amounts if amount or currency changed
    const needsRecalc = input.amount !== undefined || input.currencyCode !== undefined;
    if (needsRecalc) {
      const amount = input.amount ?? existing.originalAmountMinor / 100;
      const currencyCode = input.currencyCode ?? existing.originalCurrencyCode;
      const expenseDate = input.expenseDate ?? existing.expenseDate;

      const snapshot = await fxService.getExchangeRateSnapshot({
        fromCurrencyCode: currencyCode,
        toCurrencyCode: space.baseCurrencyCode,
        expenseDate,
      });

      data.originalAmountMinor = toMinorUnits(amount);
      data.originalCurrencyCode = currencyCode;
      data.workspaceAmountMinor = toMinorUnits(amount * snapshot.rate);
      data.workspaceCurrencyCode = space.baseCurrencyCode;
      data.exchangeRate = snapshot.rate.toFixed(8);
      data.exchangeRateDate = snapshot.rateDate;
    }

    return db.expense.update({ where: { id: expenseId }, data });
  },

  async create(input: {
    spaceId: string;
    createdByUserId: string;
    paidByUserId?: string;
    title: string;
    categoryId?: string | null;
    amount: number;
    currencyCode: string;
    expenseDate: Date;
    status: (typeof ExpenseStatus)[keyof typeof ExpenseStatus];
    description?: string | null;
    notes?: string | null;
    splits?: Array<{ userId: string; shareAmountMinor: number }>;
  }) {
    const space = await db.space.findUnique({ where: { id: input.spaceId }, select: { id: true, baseCurrencyCode: true } });
    if (!space) throw new Error("Space not found.");

    if (input.categoryId) {
      const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, spaceId: true, isArchived: true } });
      if (!category || (category.spaceId !== null && category.spaceId !== input.spaceId)) throw new Error("Category does not belong to this space.");
      if (category.isArchived) throw new Error("Archived categories cannot be used for new expenses.");
    }

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: input.currencyCode,
      toCurrencyCode: space.baseCurrencyCode,
      expenseDate: input.expenseDate,
    });

    const expense = await expenseService.createRecord({
      spaceId: input.spaceId,
      categoryId: input.categoryId ?? null,
      createdByUserId: input.createdByUserId,
      paidByUserId: input.paidByUserId ?? input.createdByUserId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      originalAmountMinor: toMinorUnits(input.amount),
      originalCurrencyCode: input.currencyCode,
      workspaceAmountMinor: toMinorUnits(input.amount * snapshot.rate),
      workspaceCurrencyCode: space.baseCurrencyCode,
      exchangeRate: snapshot.rate,
      exchangeRateDate: snapshot.rateDate,
      expenseDate: input.expenseDate,
      type: ExpenseType.one_time,
      status: input.status,
      notes: input.notes?.trim() || null,
    });

    if (input.splits && input.splits.length > 0) {
      await db.expenseSplit.createMany({
        data: input.splits.map(s => ({
          expenseId: expense.id,
          userId: s.userId,
          shareAmountMinor: s.shareAmountMinor,
        })),
      });
    }

    return expense;
  },

  async createRecord(input: {
    spaceId: string;
    categoryId?: string | null;
    createdByUserId: string;
    paidByUserId?: string;
    title: string;
    description?: string | null;
    originalAmountMinor: number;
    originalCurrencyCode: string;
    workspaceAmountMinor: number;
    workspaceCurrencyCode: string;
    exchangeRate: number;
    exchangeRateDate: Date;
    expenseDate: Date;
    type: (typeof ExpenseType)[keyof typeof ExpenseType];
    status: (typeof ExpenseStatus)[keyof typeof ExpenseStatus];
    notes?: string | null;
    recurringTemplateId?: string | null;
    debtAccountId?: string | null;
  }) {
    return db.expense.create({
      data: {
        spaceId: input.spaceId,
        categoryId: input.categoryId || null,
        createdByUserId: input.createdByUserId,
        paidByUserId: input.paidByUserId ?? input.createdByUserId,
        title: input.title,
        description: input.description ?? null,
        originalAmountMinor: input.originalAmountMinor,
        originalCurrencyCode: input.originalCurrencyCode,
        workspaceAmountMinor: input.workspaceAmountMinor,
        workspaceCurrencyCode: input.workspaceCurrencyCode,
        exchangeRate: input.exchangeRate.toFixed(8),
        exchangeRateDate: input.exchangeRateDate,
        expenseDate: input.expenseDate,
        type: input.type,
        status: input.status,
        notes: input.notes ?? null,
        recurringTemplateId: input.recurringTemplateId ?? null,
        debtAccountId: input.debtAccountId ?? null,
      },
    });
  },

  async getSettlementBalances(spaceId: string) {
    const expenses = await db.expense.findMany({
      where: { spaceId, status: ExpenseStatus.posted, splits: { some: {} } },
      select: {
        id: true,
        paidByUserId: true,
        workspaceAmountMinor: true,
        splits: { select: { userId: true, shareAmountMinor: true } },
      },
    });

    // Compute net balances: positive = others owe them, negative = they owe others
    const balanceMap = new Map<string, number>();

    for (const expense of expenses) {
      if (!expense.paidByUserId) continue;

      const payerId = expense.paidByUserId;
      balanceMap.set(payerId, (balanceMap.get(payerId) ?? 0) + expense.workspaceAmountMinor);

      for (const split of expense.splits) {
        balanceMap.set(split.userId, (balanceMap.get(split.userId) ?? 0) - split.shareAmountMinor);
      }
    }

    const userIds = [...balanceMap.keys()];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.name || u.email]));

    const space = await db.space.findUnique({
      where: { id: spaceId },
      select: { baseCurrencyCode: true },
    });

    return {
      balances: userIds.map(id => ({
        userId: id,
        userName: userMap.get(id) ?? "Unknown",
        netMinor: balanceMap.get(id) ?? 0,
      })),
      currencyCode: space?.baseCurrencyCode ?? "USD",
    };
  },
};
