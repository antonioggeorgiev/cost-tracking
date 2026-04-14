import { ExpenseType, RecurringFrequency, RecurringTemplateKind } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { expenseService } from "@/server/services/expense-service";
import { fxService } from "@/server/services/fx";

export function addRecurringInterval(date: Date, frequency: (typeof RecurringFrequency)[keyof typeof RecurringFrequency], interval: number) {
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

function isPastEndDate(date: Date, endDate?: Date | null) {
  return Boolean(endDate && date > endDate);
}

/**
 * Expand anchor days for a given period's base date.
 * If anchorDays is empty, returns just the base date (legacy behaviour).
 * For weekly: anchorDays are day-of-week (0=Sun..6=Sat).
 * For monthly/yearly: anchorDays are day-of-month (1-31).
 */
function expandAnchorDates(
  baseDate: Date,
  frequency: (typeof RecurringFrequency)[keyof typeof RecurringFrequency],
  anchorDays: number[],
): Date[] {
  if (anchorDays.length === 0) return [baseDate];

  if (frequency === RecurringFrequency.weekly) {
    // baseDate is the start of the period week; compute dates for each anchor day-of-week
    const baseDow = baseDate.getDay();
    return anchorDays.map((dow) => {
      const diff = ((dow - baseDow) % 7 + 7) % 7;
      const d = new Date(baseDate);
      d.setDate(d.getDate() + diff);
      return d;
    }).sort((a, b) => a.getTime() - b.getTime());
  }

  // monthly or yearly: anchorDays are day-of-month numbers
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  return anchorDays.map((dayOfMonth) => {
    // Clamp to actual days in the month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const clamped = Math.min(dayOfMonth, lastDay);
    return new Date(year, month, clamped);
  }).sort((a, b) => a.getTime() - b.getTime());
}

function getNextTemplateState(date: Date, frequency: (typeof RecurringFrequency)[keyof typeof RecurringFrequency], interval: number, endDate?: Date | null) {
  const nextOccurrenceDate = addRecurringInterval(date, frequency, interval);
  return {
    nextOccurrenceDate,
    isActive: !isPastEndDate(nextOccurrenceDate, endDate),
  };
}

export const recurringService = {
  listTemplates(workspaceId: string) {
    return db.recurringExpenseTemplate.findMany({
      where: { workspaceId },
      include: { category: { include: { parentCategory: true } } },
      orderBy: [{ isActive: "desc" }, { nextOccurrenceDate: "asc" }],
    });
  },

  listDueVariableTemplates(workspaceId: string) {
    return db.recurringExpenseTemplate.findMany({
      where: {
        workspaceId,
        kind: RecurringTemplateKind.variable_amount,
        isActive: true,
        nextOccurrenceDate: { lte: new Date() },
      },
      include: { category: { include: { parentCategory: true } } },
      orderBy: { nextOccurrenceDate: "asc" },
    });
  },

  async createTemplate(input: {
    workspaceId: string;
    createdByUserId: string;
    kind: (typeof RecurringTemplateKind)[keyof typeof RecurringTemplateKind];
    title: string;
    categoryId: string;
    amount?: number;
    currencyCode: string;
    startDate: Date;
    endDate?: Date | null;
    frequency: (typeof RecurringFrequency)[keyof typeof RecurringFrequency];
    interval: number;
    anchorDays?: number[];
    defaultStatus: "planned" | "pending" | "posted" | "cancelled";
    paymentUrl?: string | null;
    description?: string | null;
    notes?: string | null;
  }) {
    const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { id: true, baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, workspaceId: true, isArchived: true } });
    if (!category || category.workspaceId !== input.workspaceId) throw new Error("Category does not belong to this workspace.");
    if (category.isArchived) throw new Error("Archived categories cannot be used for recurring templates.");

    if (input.endDate && input.endDate < input.startDate) {
      throw new Error("End date cannot be before the first due date.");
    }

    if (input.kind === RecurringTemplateKind.fixed_amount && input.amount === undefined) {
      throw new Error("Fixed recurring templates require an amount.");
    }

    const trimmedPaymentUrl = input.paymentUrl?.trim() || null;

    let originalAmountMinor: number | null = null;
    let workspaceAmountMinor: number | null = null;
    let exchangeRate: string | null = null;
    let exchangeRateDate: Date | null = null;

    if (input.kind === RecurringTemplateKind.fixed_amount) {
      const snapshot = await fxService.getExchangeRateSnapshot({
        fromCurrencyCode: input.currencyCode,
        toCurrencyCode: workspace.baseCurrencyCode,
        expenseDate: input.startDate,
      });

      originalAmountMinor = toMinorUnits(input.amount ?? 0);
      workspaceAmountMinor = toMinorUnits((input.amount ?? 0) * snapshot.rate);
      exchangeRate = snapshot.rate.toFixed(8);
      exchangeRateDate = snapshot.rateDate;
    }

    return db.recurringExpenseTemplate.create({
      data: {
        workspaceId: input.workspaceId,
        categoryId: input.categoryId,
        createdByUserId: input.createdByUserId,
        kind: input.kind,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        originalAmountMinor,
        originalCurrencyCode: input.currencyCode,
        workspaceAmountMinor,
        workspaceCurrencyCode: workspace.baseCurrencyCode,
        exchangeRate,
        exchangeRateDate,
        frequency: input.frequency,
        interval: input.interval,
        anchorDays: input.anchorDays ?? [],
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        nextOccurrenceDate: input.startDate,
        defaultStatus: input.defaultStatus,
        paymentUrl: trimmedPaymentUrl,
        notes: input.notes?.trim() || null,
      },
    });
  },

  async generateDueExpenses(workspaceId: string) {
    const templates = await db.recurringExpenseTemplate.findMany({
      where: {
        workspaceId,
        kind: RecurringTemplateKind.fixed_amount,
        isActive: true,
        nextOccurrenceDate: { lte: new Date() },
      },
      orderBy: { nextOccurrenceDate: "asc" },
    });

    let generatedCount = 0;
    for (const template of templates) {
      let nextOccurrenceDate = template.nextOccurrenceDate;
      const now = new Date();

      while (nextOccurrenceDate <= now && !isPastEndDate(nextOccurrenceDate, template.endDate)) {
        const datesToGenerate = expandAnchorDates(nextOccurrenceDate, template.frequency, template.anchorDays);

        for (const expenseDate of datesToGenerate) {
          if (expenseDate > now || isPastEndDate(expenseDate, template.endDate)) continue;

          const existingExpense = await db.expense.findFirst({
            where: {
              recurringTemplateId: template.id,
              expenseDate,
            },
            select: { id: true },
          });

          if (!existingExpense) {
            await expenseService.createRecord({
              workspaceId: template.workspaceId,
              categoryId: template.categoryId,
              createdByUserId: template.createdByUserId,
              title: template.title,
              description: template.description,
              originalAmountMinor: template.originalAmountMinor ?? 0,
              originalCurrencyCode: template.originalCurrencyCode,
              workspaceAmountMinor: template.workspaceAmountMinor ?? 0,
              workspaceCurrencyCode: template.workspaceCurrencyCode,
              exchangeRate: Number(template.exchangeRate ?? 1),
              exchangeRateDate: template.exchangeRateDate ?? expenseDate,
              expenseDate,
              type: ExpenseType.recurring_generated,
              status: template.defaultStatus,
              notes: template.notes,
              recurringTemplateId: template.id,
            });

            generatedCount += 1;
          }
        }

        nextOccurrenceDate = addRecurringInterval(nextOccurrenceDate, template.frequency, template.interval);
      }

      const isActive = !isPastEndDate(nextOccurrenceDate, template.endDate);

      await db.recurringExpenseTemplate.update({
        where: { id: template.id },
        data: { nextOccurrenceDate, lastGeneratedAt: new Date(), isActive },
      });
    }

    return { generatedCount };
  },

  async recordVariableExpense(input: {
    workspaceId: string;
    createdByUserId: string;
    templateId: string;
    amount: number;
    notes?: string | null;
  }) {
    const template = await db.recurringExpenseTemplate.findUnique({ where: { id: input.templateId } });
    if (!template || template.workspaceId !== input.workspaceId) throw new Error("Recurring template not found.");
    if (template.kind !== RecurringTemplateKind.variable_amount) throw new Error("Only variable recurring templates can be recorded manually.");
    if (!template.isActive) throw new Error("Recurring template is inactive.");
    if (isPastEndDate(template.nextOccurrenceDate, template.endDate)) throw new Error("Recurring template has already ended.");

    const existingExpense = await db.expense.findFirst({
      where: {
        recurringTemplateId: template.id,
        expenseDate: template.nextOccurrenceDate,
      },
      select: { id: true },
    });

    if (existingExpense) {
      throw new Error("This recurring occurrence has already been recorded.");
    }

    const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: template.originalCurrencyCode,
      toCurrencyCode: workspace.baseCurrencyCode,
      expenseDate: template.nextOccurrenceDate,
    });

    const expense = await expenseService.createRecord({
      workspaceId: template.workspaceId,
      categoryId: template.categoryId,
      createdByUserId: input.createdByUserId,
      title: template.title,
      description: template.description,
      originalAmountMinor: toMinorUnits(input.amount),
      originalCurrencyCode: template.originalCurrencyCode,
      workspaceAmountMinor: toMinorUnits(input.amount * snapshot.rate),
      workspaceCurrencyCode: workspace.baseCurrencyCode,
      exchangeRate: snapshot.rate,
      exchangeRateDate: snapshot.rateDate,
      expenseDate: template.nextOccurrenceDate,
      type: ExpenseType.recurring_generated,
      status: template.defaultStatus,
      notes: input.notes?.trim() || template.notes,
      recurringTemplateId: template.id,
    });

    const nextState = getNextTemplateState(template.nextOccurrenceDate, template.frequency, template.interval, template.endDate);

    await db.recurringExpenseTemplate.update({
      where: { id: template.id },
      data: {
        nextOccurrenceDate: nextState.nextOccurrenceDate,
        lastGeneratedAt: new Date(),
        isActive: nextState.isActive,
      },
    });

    return expense;
  },
};
