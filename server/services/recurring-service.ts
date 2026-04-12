import { ExpenseType, RecurringFrequency } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { expenseService } from "@/server/services/expense-service";
import { fxService } from "@/server/services/fx";

function addRecurringInterval(date: Date, frequency: (typeof RecurringFrequency)[keyof typeof RecurringFrequency], interval: number) {
  const next = new Date(date);
  if (frequency === RecurringFrequency.weekly) {
    next.setDate(next.getDate() + 7 * interval);
    return next;
  }
  if (frequency === RecurringFrequency.monthly) {
    next.setMonth(next.getMonth() + interval);
    return next;
  }
  next.setFullYear(next.getFullYear() + interval);
  return next;
}

export const recurringService = {
  listTemplates(workspaceId: string) {
    return db.recurringExpenseTemplate.findMany({
      where: { workspaceId },
      include: { category: { include: { parentCategory: true } } },
      orderBy: [{ isActive: "desc" }, { nextOccurrenceDate: "asc" }],
    });
  },

  async createTemplate(input: {
    workspaceId: string;
    createdByUserId: string;
    title: string;
    categoryId: string;
    amount: number;
    currencyCode: string;
    startDate: Date;
    frequency: (typeof RecurringFrequency)[keyof typeof RecurringFrequency];
    interval: number;
    defaultStatus: "planned" | "pending" | "posted" | "cancelled";
    description?: string | null;
    notes?: string | null;
  }) {
    const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { id: true, baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, workspaceId: true, isArchived: true } });
    if (!category || category.workspaceId !== input.workspaceId) throw new Error("Category does not belong to this workspace.");
    if (category.isArchived) throw new Error("Archived categories cannot be used for recurring templates.");

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: input.currencyCode,
      toCurrencyCode: workspace.baseCurrencyCode,
      expenseDate: input.startDate,
    });

    return db.recurringExpenseTemplate.create({
      data: {
        workspaceId: input.workspaceId,
        categoryId: input.categoryId,
        createdByUserId: input.createdByUserId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        originalAmountMinor: toMinorUnits(input.amount),
        originalCurrencyCode: input.currencyCode,
        workspaceAmountMinor: toMinorUnits(input.amount * snapshot.rate),
        workspaceCurrencyCode: workspace.baseCurrencyCode,
        exchangeRate: snapshot.rate.toFixed(8),
        exchangeRateDate: snapshot.rateDate,
        frequency: input.frequency,
        interval: input.interval,
        startDate: input.startDate,
        nextOccurrenceDate: input.startDate,
        defaultStatus: input.defaultStatus,
        notes: input.notes?.trim() || null,
      },
    });
  },

  async generateDueExpenses(workspaceId: string) {
    const templates = await db.recurringExpenseTemplate.findMany({
      where: { workspaceId, isActive: true, nextOccurrenceDate: { lte: new Date() } },
      orderBy: { nextOccurrenceDate: "asc" },
    });

    let generatedCount = 0;
    for (const template of templates) {
      let nextOccurrenceDate = template.nextOccurrenceDate;
      const now = new Date();

      while (nextOccurrenceDate <= now) {
        await expenseService.createRecord({
          workspaceId: template.workspaceId,
          categoryId: template.categoryId,
          createdByUserId: template.createdByUserId,
          title: template.title,
          description: template.description,
          originalAmountMinor: template.originalAmountMinor,
          originalCurrencyCode: template.originalCurrencyCode,
          workspaceAmountMinor: template.workspaceAmountMinor,
          workspaceCurrencyCode: template.workspaceCurrencyCode,
          exchangeRate: Number(template.exchangeRate),
          exchangeRateDate: template.exchangeRateDate,
          expenseDate: nextOccurrenceDate,
          type: ExpenseType.recurring_generated,
          status: template.defaultStatus,
          notes: template.notes,
          recurringTemplateId: template.id,
        });

        generatedCount += 1;
        nextOccurrenceDate = addRecurringInterval(nextOccurrenceDate, template.frequency, template.interval);
      }

      await db.recurringExpenseTemplate.update({
        where: { id: template.id },
        data: { nextOccurrenceDate, lastGeneratedAt: new Date() },
      });
    }

    return { generatedCount };
  },
};
