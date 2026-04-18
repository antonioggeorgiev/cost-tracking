import { ExpenseType, RecurringFrequency, RecurringTemplateKind } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { ExpenseStatus } from "@/lib/expense-status";
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
export function expandAnchorDates(
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
  async getById(spaceId: string, templateId: string) {
    const template = await db.recurringExpenseTemplate.findUnique({
      where: { id: templateId },
      include: {
        category: { include: { parentCategory: true } },
        createdByUser: { select: { name: true, email: true } },
        expenses: {
          orderBy: { expenseDate: "desc" as const },
          take: 20,
          select: {
            id: true,
            title: true,
            expenseDate: true,
            originalAmountMinor: true,
            originalCurrencyCode: true,
            workspaceAmountMinor: true,
            workspaceCurrencyCode: true,
            status: true,
          },
        },
      },
    });

    if (!template || template.spaceId !== spaceId) return null;

    return {
      ...template,
      categoryPath: template.category
        ? (template.category.parentCategory
          ? `${template.category.parentCategory.name} / ${template.category.name}`
          : template.category.name)
        : "Uncategorized",
      createdByLabel: template.createdByUser.name || template.createdByUser.email,
    };
  },

  async updateTemplate(spaceId: string, templateId: string, input: {
    title?: string;
    categoryId?: string;
    amount?: number | null;
    currencyCode?: string;
    description?: string | null;
    notes?: string | null;
    frequency?: (typeof RecurringFrequency)[keyof typeof RecurringFrequency];
    interval?: number;
    anchorDays?: number[];
    startDate?: Date;
    endDate?: Date | null;
    defaultStatus?: ExpenseStatus;
    paymentUrl?: string | null;
    isActive?: boolean;
  }) {
    const existing = await db.recurringExpenseTemplate.findUnique({ where: { id: templateId } });
    if (!existing || existing.spaceId !== spaceId) throw new Error("Recurring template not found.");

    const space = await db.space.findUnique({ where: { id: spaceId }, select: { baseCurrencyCode: true } });
    if (!space) throw new Error("Space not found.");

    const data: Record<string, unknown> = {};

    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.defaultStatus !== undefined) data.defaultStatus = input.defaultStatus;
    if (input.paymentUrl !== undefined) data.paymentUrl = input.paymentUrl?.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.endDate !== undefined) data.endDate = input.endDate;

    if (input.categoryId !== undefined) {
      const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, spaceId: true, isArchived: true } });
      if (!category || (category.spaceId !== null && category.spaceId !== spaceId)) throw new Error("Category does not belong to this space.");
      if (category.isArchived) throw new Error("Archived categories cannot be used.");
      data.categoryId = input.categoryId;
    }

    // Recalculate FX if amount or currency changed on fixed templates
    const needsRecalc = input.amount !== undefined || input.currencyCode !== undefined;
    if (needsRecalc && existing.kind === RecurringTemplateKind.fixed_amount) {
      const amount = input.amount ?? (existing.originalAmountMinor ? existing.originalAmountMinor / 100 : 0);
      const currencyCode = input.currencyCode ?? existing.originalCurrencyCode;
      const refDate = input.startDate ?? existing.startDate;

      const snapshot = await fxService.getExchangeRateSnapshot({
        fromCurrencyCode: currencyCode,
        toCurrencyCode: space.baseCurrencyCode,
        expenseDate: refDate,
      });

      data.originalAmountMinor = toMinorUnits(amount ?? 0);
      data.originalCurrencyCode = currencyCode;
      data.workspaceAmountMinor = toMinorUnits((amount ?? 0) * snapshot.rate);
      data.workspaceCurrencyCode = space.baseCurrencyCode;
      data.exchangeRate = snapshot.rate.toFixed(8);
      data.exchangeRateDate = snapshot.rateDate;
    } else if (input.currencyCode !== undefined) {
      data.originalCurrencyCode = input.currencyCode;
    }

    // Recalculate nextOccurrenceDate if schedule fields changed
    const scheduleChanged = input.frequency !== undefined || input.interval !== undefined || input.anchorDays !== undefined || input.startDate !== undefined;
    if (scheduleChanged) {
      if (input.frequency !== undefined) data.frequency = input.frequency;
      if (input.interval !== undefined) data.interval = input.interval;
      if (input.anchorDays !== undefined) data.anchorDays = input.anchorDays;
      if (input.startDate !== undefined) data.startDate = input.startDate;

      const frequency = input.frequency ?? existing.frequency;
      const interval = input.interval ?? existing.interval;
      const startDate = input.startDate ?? existing.startDate;
      const endDate = input.endDate !== undefined ? input.endDate : existing.endDate;

      // Find the next future occurrence from now
      const now = new Date();
      let next = new Date(startDate);
      while (next <= now && !isPastEndDate(next, endDate)) {
        next = addRecurringInterval(next, frequency, interval);
      }
      data.nextOccurrenceDate = next;
      data.isActive = !isPastEndDate(next, endDate);
    }

    return db.recurringExpenseTemplate.update({ where: { id: templateId }, data });
  },

  listTemplates(spaceId: string) {
    return db.recurringExpenseTemplate.findMany({
      where: { spaceId },
      include: { category: { include: { parentCategory: true } } },
      orderBy: [{ isActive: "desc" }, { nextOccurrenceDate: "asc" }],
    });
  },

  async listAllUserTemplates(userId: string) {
    const memberships = await db.spaceMembership.findMany({
      where: { userId },
      select: { spaceId: true },
    });
    const spaceIds = memberships.map(m => m.spaceId);

    const templates = await db.recurringExpenseTemplate.findMany({
      where: { spaceId: { in: spaceIds } },
      include: {
        category: { include: { parentCategory: true } },
        space: { select: { name: true, slug: true } },
      },
      orderBy: [{ isActive: "desc" }, { nextOccurrenceDate: "asc" }],
    });

    return templates.map((t) => ({
      ...t,
      spaceName: t.space.name,
      spaceSlug: t.space.slug,
    }));
  },

  listDueVariableTemplates(spaceId: string) {
    return db.recurringExpenseTemplate.findMany({
      where: {
        spaceId,
        kind: RecurringTemplateKind.variable_amount,
        isActive: true,
        nextOccurrenceDate: { lte: new Date() },
      },
      include: { category: { include: { parentCategory: true } } },
      orderBy: { nextOccurrenceDate: "asc" },
    });
  },

  async createTemplate(input: {
    spaceId: string;
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
    defaultStatus: ExpenseStatus;
    paymentUrl?: string | null;
    description?: string | null;
    notes?: string | null;
  }) {
    const space = await db.space.findUnique({ where: { id: input.spaceId }, select: { id: true, baseCurrencyCode: true } });
    if (!space) throw new Error("Space not found.");

    const category = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true, spaceId: true, isArchived: true } });
    if (!category || (category.spaceId !== null && category.spaceId !== input.spaceId)) throw new Error("Category does not belong to this space.");
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
        toCurrencyCode: space.baseCurrencyCode,
        expenseDate: input.startDate,
      });

      originalAmountMinor = toMinorUnits(input.amount ?? 0);
      workspaceAmountMinor = toMinorUnits((input.amount ?? 0) * snapshot.rate);
      exchangeRate = snapshot.rate.toFixed(8);
      exchangeRateDate = snapshot.rateDate;
    }

    return db.recurringExpenseTemplate.create({
      data: {
        spaceId: input.spaceId,
        categoryId: input.categoryId,
        createdByUserId: input.createdByUserId,
        kind: input.kind,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        originalAmountMinor,
        originalCurrencyCode: input.currencyCode,
        workspaceAmountMinor,
        workspaceCurrencyCode: space.baseCurrencyCode,
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

  async generateDueExpenses(spaceId: string) {
    const templates = await db.recurringExpenseTemplate.findMany({
      where: {
        spaceId,
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
              spaceId: template.spaceId,
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

  async markFixedAsPaid(input: {
    spaceId: string;
    createdByUserId: string;
    templateId: string;
  }) {
    const template = await db.recurringExpenseTemplate.findUnique({ where: { id: input.templateId } });
    if (!template || template.spaceId !== input.spaceId) throw new Error("Recurring template not found.");
    if (template.kind !== RecurringTemplateKind.fixed_amount) throw new Error("Only fixed recurring templates can be marked as paid.");
    if (!template.isActive) throw new Error("Recurring template is inactive.");

    // Check if expense already exists for this occurrence
    const existingExpense = await db.expense.findFirst({
      where: { recurringTemplateId: template.id, expenseDate: template.nextOccurrenceDate },
      select: { id: true },
    });

    // Create the expense if it doesn't exist yet
    if (!existingExpense) {
      await expenseService.createRecord({
        spaceId: template.spaceId,
        categoryId: template.categoryId,
        createdByUserId: input.createdByUserId,
        title: template.title,
        description: template.description,
        originalAmountMinor: template.originalAmountMinor ?? 0,
        originalCurrencyCode: template.originalCurrencyCode,
        workspaceAmountMinor: template.workspaceAmountMinor ?? 0,
        workspaceCurrencyCode: template.workspaceCurrencyCode,
        exchangeRate: Number(template.exchangeRate ?? 1),
        exchangeRateDate: template.exchangeRateDate ?? template.nextOccurrenceDate,
        expenseDate: template.nextOccurrenceDate,
        type: ExpenseType.recurring_generated,
        status: template.defaultStatus,
        notes: template.notes,
        recurringTemplateId: template.id,
      });
    }

    // Always advance the template
    const nextState = getNextTemplateState(template.nextOccurrenceDate, template.frequency, template.interval, template.endDate);
    await db.recurringExpenseTemplate.update({
      where: { id: template.id },
      data: {
        nextOccurrenceDate: nextState.nextOccurrenceDate,
        lastGeneratedAt: new Date(),
        isActive: nextState.isActive,
      },
    });
  },

  async recordVariableExpense(input: {
    spaceId: string;
    createdByUserId: string;
    templateId: string;
    amount: number;
    notes?: string | null;
  }) {
    const template = await db.recurringExpenseTemplate.findUnique({ where: { id: input.templateId } });
    if (!template || template.spaceId !== input.spaceId) throw new Error("Recurring template not found.");
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

    const space = await db.space.findUnique({ where: { id: input.spaceId }, select: { baseCurrencyCode: true } });
    if (!space) throw new Error("Space not found.");

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: template.originalCurrencyCode,
      toCurrencyCode: space.baseCurrencyCode,
      expenseDate: template.nextOccurrenceDate,
    });

    const expense = await expenseService.createRecord({
      spaceId: template.spaceId,
      categoryId: template.categoryId,
      createdByUserId: input.createdByUserId,
      title: template.title,
      description: template.description,
      originalAmountMinor: toMinorUnits(input.amount),
      originalCurrencyCode: template.originalCurrencyCode,
      workspaceAmountMinor: toMinorUnits(input.amount * snapshot.rate),
      workspaceCurrencyCode: space.baseCurrencyCode,
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
