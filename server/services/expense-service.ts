import { ExpenseStatus, ExpenseType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { fxService } from "@/server/services/fx";

export const expenseService = {
  async listWorkspaceExpenses(workspaceId: string, options?: {
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

    const where: Record<string, unknown> = { workspaceId };

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

  async getById(workspaceId: string, expenseId: string) {
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: {
        category: { include: { parentCategory: true } },
        createdByUser: { select: { name: true, email: true } },
        attachments: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!expense || expense.workspaceId !== workspaceId) return null;

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

  async update(workspaceId: string, expenseId: string, input: {
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
    if (!existing || existing.workspaceId !== workspaceId) throw new Error("Expense not found.");

    const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    const data: Record<string, unknown> = {};

    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.categoryId !== undefined) {
      if (input.categoryId) {
        const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, workspaceId: true, isArchived: true } });
        if (!category || (category.workspaceId !== null && category.workspaceId !== workspaceId)) throw new Error("Category does not belong to this workspace.");
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
        toCurrencyCode: workspace.baseCurrencyCode,
        expenseDate,
      });

      data.originalAmountMinor = toMinorUnits(amount);
      data.originalCurrencyCode = currencyCode;
      data.workspaceAmountMinor = toMinorUnits(amount * snapshot.rate);
      data.workspaceCurrencyCode = workspace.baseCurrencyCode;
      data.exchangeRate = snapshot.rate.toFixed(8);
      data.exchangeRateDate = snapshot.rateDate;
    }

    return db.expense.update({ where: { id: expenseId }, data });
  },

  async create(input: {
    workspaceId: string;
    createdByUserId: string;
    title: string;
    categoryId?: string | null;
    amount: number;
    currencyCode: string;
    expenseDate: Date;
    status: (typeof ExpenseStatus)[keyof typeof ExpenseStatus];
    description?: string | null;
    notes?: string | null;
  }) {
    const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { id: true, baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    if (input.categoryId) {
      const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, workspaceId: true, isArchived: true } });
      if (!category || (category.workspaceId !== null && category.workspaceId !== input.workspaceId)) throw new Error("Category does not belong to this workspace.");
      if (category.isArchived) throw new Error("Archived categories cannot be used for new expenses.");
    }

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: input.currencyCode,
      toCurrencyCode: workspace.baseCurrencyCode,
      expenseDate: input.expenseDate,
    });

    return expenseService.createRecord({
      workspaceId: input.workspaceId,
      categoryId: input.categoryId ?? null,
      createdByUserId: input.createdByUserId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      originalAmountMinor: toMinorUnits(input.amount),
      originalCurrencyCode: input.currencyCode,
      workspaceAmountMinor: toMinorUnits(input.amount * snapshot.rate),
      workspaceCurrencyCode: workspace.baseCurrencyCode,
      exchangeRate: snapshot.rate,
      exchangeRateDate: snapshot.rateDate,
      expenseDate: input.expenseDate,
      type: ExpenseType.one_time,
      status: input.status,
      notes: input.notes?.trim() || null,
    });
  },

  async createRecord(input: {
    workspaceId: string;
    categoryId?: string | null;
    createdByUserId: string;
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
        workspaceId: input.workspaceId,
        categoryId: input.categoryId || null,
        createdByUserId: input.createdByUserId,
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
};
