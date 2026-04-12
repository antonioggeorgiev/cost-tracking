import { ExpenseStatus, ExpenseType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { fxService } from "@/server/services/fx-service";

export const expenseService = {
  async listWorkspaceExpenses(workspaceId: string, options?: {
    search?: string;
    categoryId?: string;
    status?: string;
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

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          category: { include: { parentCategory: true } },
          createdByUser: { select: { name: true, email: true } },
        },
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        skip,
        take: perPage,
      }),
      db.expense.count({ where }),
    ]);

    return {
      items: expenses.map((expense) => ({
        ...expense,
        categoryPath: expense.category.parentCategory ? `${expense.category.parentCategory.name} / ${expense.category.name}` : expense.category.name,
        createdByLabel: expense.createdByUser.name || expense.createdByUser.email,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  async create(input: {
    workspaceId: string;
    createdByUserId: string;
    title: string;
    categoryId: string;
    amount: number;
    currencyCode: string;
    expenseDate: Date;
    status: (typeof ExpenseStatus)[keyof typeof ExpenseStatus];
    description?: string | null;
    notes?: string | null;
  }) {
    const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { id: true, baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, workspaceId: true, isArchived: true } });
    if (!category || category.workspaceId !== input.workspaceId) throw new Error("Category does not belong to this workspace.");
    if (category.isArchived) throw new Error("Archived categories cannot be used for new expenses.");

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: input.currencyCode,
      toCurrencyCode: workspace.baseCurrencyCode,
      expenseDate: input.expenseDate,
    });

    return expenseService.createRecord({
      workspaceId: input.workspaceId,
      categoryId: input.categoryId,
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
    categoryId: string;
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
        categoryId: input.categoryId,
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
