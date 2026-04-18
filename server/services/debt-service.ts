import { DebtAccountKind, DebtDirection, ExpenseStatus, ExpenseType, RecurringFrequency } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { addRecurringInterval, expandAnchorDates } from "@/server/services/recurring-service";
import { expenseService } from "@/server/services/expense-service";
import { fxService } from "@/server/services/fx";

type DebtScheduleFields = {
  openedAt: Date;
  frequency: (typeof RecurringFrequency)[keyof typeof RecurringFrequency] | null;
  interval: number | null;
  anchorDays: number[];
};

/**
 * Compute all scheduled due dates for a debt that fall within [rangeStart, rangeEnd].
 * Walks forward from openedAt by frequency/interval, expanding anchor days each period.
 */
function getDebtDueDatesInRange(debt: DebtScheduleFields, rangeStart: Date, rangeEnd: Date): Date[] {
  if (!debt.frequency || !debt.interval) return [];

  const results: Date[] = [];
  let cursor = new Date(debt.openedAt);

  // Walk forward until we pass rangeEnd
  // Safety: cap at 1000 iterations to prevent infinite loops
  for (let i = 0; i < 1000; i++) {
    const expanded = expandAnchorDates(cursor, debt.frequency, debt.anchorDays);
    for (const d of expanded) {
      if (d >= rangeStart && d <= rangeEnd && d >= debt.openedAt) {
        results.push(d);
      }
    }

    const nextCursor = addRecurringInterval(cursor, debt.frequency, debt.interval);
    // If every expanded date in this period is past rangeEnd, we're done
    if (expanded.length > 0 && expanded[expanded.length - 1] > rangeEnd) break;
    // Also break if cursor didn't advance (shouldn't happen, but safety)
    if (nextCursor.getTime() <= cursor.getTime()) break;
    cursor = nextCursor;
  }

  return results.sort((a, b) => a.getTime() - b.getTime());
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type MonthPaymentStatus = {
  dueCount: number;
  paidCount: number;
  unpaidCount: number;
  nextUnpaidDate: Date | null;
  unpaidDueDates: Date[];
};

async function getDebtPaymentCategoryId(
  tx: Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">,
  workspaceId: string,
) {
  // First check for a platform-wide "Debt Payments" category
  const platform = await tx.category.findFirst({
    where: { workspaceId: null, parentCategoryId: null, slug: "debt-and-loan-payments" },
    select: { id: true },
  });
  if (platform) return platform.id;

  // Fallback: check workspace-specific
  const existing = await tx.category.findFirst({
    where: { workspaceId, parentCategoryId: null, slug: "debt-payments" },
    select: { id: true },
  });
  if (existing) return existing.id;

  // Last resort: create workspace-specific
  const category = await tx.category.create({ data: { workspaceId, name: "Debt Payments", slug: "debt-payments" } });
  return category.id;
}

export const debtService = {
  async getById(workspaceId: string, debtAccountId: string) {
    const account = await db.debtAccount.findUnique({
      where: { id: debtAccountId },
      include: {
        payments: {
          include: {
            paidByUser: { select: { name: true, email: true } },
            expense: { select: { id: true } },
          },
          orderBy: { paymentDate: "desc" as const },
        },
      },
    });

    if (!account || account.workspaceId !== workspaceId) return null;
    return account;
  },

  async updateAccount(workspaceId: string, debtAccountId: string, input: {
    kind?: (typeof DebtAccountKind)[keyof typeof DebtAccountKind];
    direction?: (typeof DebtDirection)[keyof typeof DebtDirection];
    name?: string;
    provider?: string | null;
    counterparty?: string | null;
    originalAmount?: number;
    alreadyPaid?: number | null;
    currencyCode?: string;
    openedAt?: Date;
    interestRateBps?: number | null;
    termMonths?: number | null;
    monthlyAmount?: number | null;
    residualValue?: number | null;
    frequency?: RecurringFrequency | null;
    interval?: number | null;
    anchorDays?: number[] | null;
    nextPaymentDate?: Date | null;
    notes?: string | null;
    isActive?: boolean;
  }) {
    const existing = await db.debtAccount.findUnique({
      where: { id: debtAccountId },
      include: { payments: { select: { originalAmountMinor: true } } },
    });
    if (!existing || existing.workspaceId !== workspaceId) throw new Error("Debt account not found.");

    // Reject currency change if payments exist
    if (input.currencyCode !== undefined && input.currencyCode !== existing.currencyCode && existing.payments.length > 0) {
      throw new Error("Cannot change currency on a debt account that already has payments.");
    }

    const data: Record<string, unknown> = {};

    if (input.kind !== undefined) data.kind = input.kind;
    if (input.direction !== undefined) data.direction = input.direction;
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.provider !== undefined) data.provider = input.provider?.trim() || null;
    if (input.counterparty !== undefined) data.counterparty = input.counterparty?.trim() || null;
    if (input.openedAt !== undefined) data.openedAt = input.openedAt;
    if (input.interestRateBps !== undefined) data.interestRateBps = input.interestRateBps;
    if (input.termMonths !== undefined) data.termMonths = input.termMonths;
    if (input.monthlyAmount !== undefined) data.monthlyAmountMinor = input.monthlyAmount != null ? toMinorUnits(input.monthlyAmount) : null;
    if (input.residualValue !== undefined) data.residualValueMinor = input.residualValue != null ? toMinorUnits(input.residualValue) : null;
    if (input.frequency !== undefined) data.frequency = input.frequency;
    if (input.interval !== undefined) data.interval = input.interval;
    if (input.anchorDays !== undefined) data.anchorDays = input.anchorDays ?? [];
    if (input.nextPaymentDate !== undefined) data.nextPaymentDate = input.nextPaymentDate;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.currencyCode !== undefined) data.currencyCode = input.currencyCode;

    // Recalculate balance if original amount or already paid changes
    if (input.originalAmount !== undefined || input.alreadyPaid !== undefined) {
      const newOriginalMinor = input.originalAmount !== undefined ? toMinorUnits(input.originalAmount) : existing.originalAmountMinor;
      if (input.originalAmount !== undefined) data.originalAmountMinor = newOriginalMinor;

      const totalPayments = existing.payments.reduce((sum, p) => sum + p.originalAmountMinor, 0);
      const alreadyPaidMinor = input.alreadyPaid != null ? toMinorUnits(input.alreadyPaid) : 0;
      // alreadyPaid represents the total paid including recorded payments
      // Use the larger of alreadyPaid or actual payments to avoid reducing below recorded payments
      const effectivePaid = Math.max(alreadyPaidMinor, totalPayments);
      data.currentBalanceMinor = Math.max(0, newOriginalMinor - effectivePaid);
    }

    // Recalculate workspace-converted fields when amount, currency, or balance changes
    const needsFxUpdate = input.originalAmount !== undefined || input.currencyCode !== undefined
      || input.alreadyPaid !== undefined || input.monthlyAmount !== undefined || input.residualValue !== undefined;

    if (needsFxUpdate) {
      const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { baseCurrencyCode: true } });
      if (!workspace) throw new Error("Workspace not found.");

      const effectiveCurrency = (input.currencyCode ?? existing.currencyCode);
      const effectiveOpenedAt = (input.openedAt ?? existing.openedAt);
      const snapshot = await fxService.getExchangeRateSnapshot({
        fromCurrencyCode: effectiveCurrency,
        toCurrencyCode: workspace.baseCurrencyCode,
        expenseDate: effectiveOpenedAt,
      });

      const effectiveOriginalMinor = (data.originalAmountMinor as number | undefined) ?? existing.originalAmountMinor;
      const effectiveBalanceMinor = (data.currentBalanceMinor as number | undefined) ?? existing.currentBalanceMinor;

      data.workspaceAmountMinor = Math.round(effectiveOriginalMinor * snapshot.rate);
      data.workspaceBalanceMinor = Math.round(effectiveBalanceMinor * snapshot.rate);
      data.workspaceCurrencyCode = workspace.baseCurrencyCode;
      data.exchangeRate = snapshot.rate.toFixed(8);
      data.exchangeRateDate = snapshot.rateDate;

      const effectiveMonthly = input.monthlyAmount !== undefined
        ? (input.monthlyAmount != null ? toMinorUnits(input.monthlyAmount) : null)
        : existing.monthlyAmountMinor;
      data.workspaceMonthlyAmountMinor = effectiveMonthly != null ? Math.round(effectiveMonthly * snapshot.rate) : null;

      const effectiveResidual = input.residualValue !== undefined
        ? (input.residualValue != null ? toMinorUnits(input.residualValue) : null)
        : existing.residualValueMinor;
      data.workspaceResidualValueMinor = effectiveResidual != null ? Math.round(effectiveResidual * snapshot.rate) : null;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
      if (!input.isActive) data.nextPaymentDate = null;
    }

    return db.debtAccount.update({ where: { id: debtAccountId }, data });
  },

  listAccounts(workspaceId: string) {
    return db.debtAccount.findMany({
      where: { workspaceId },
      include: {
        payments: {
          include: { paidByUser: { select: { name: true, email: true } } },
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: [{ isActive: "desc" }, { openedAt: "desc" }],
    });
  },

  async createAccount(input: {
    workspaceId: string;
    kind: DebtAccountKind;
    direction: DebtDirection;
    name: string;
    provider?: string | null;
    counterparty?: string | null;
    originalAmount: number;
    alreadyPaid?: number;
    currencyCode: string;
    openedAt: Date;
    interestRateBps?: number | null;
    termMonths?: number | null;
    monthlyAmount?: number | null;
    residualValue?: number | null;
    frequency?: RecurringFrequency | null;
    interval?: number | null;
    anchorDays?: number[] | null;
    nextPaymentDate?: Date | null;
    notes?: string | null;
  }) {
    // Workaround: Prisma 7 query compiler rejects enum fields in create().
    // Create with defaults, then update the enum fields.
    const originalMinor = toMinorUnits(input.originalAmount);
    const alreadyPaidMinor = input.alreadyPaid ? toMinorUnits(input.alreadyPaid) : 0;
    const balanceMinor = Math.max(0, originalMinor - alreadyPaidMinor);

    const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: input.currencyCode,
      toCurrencyCode: workspace.baseCurrencyCode,
      expenseDate: input.openedAt,
    });

    const account = await db.debtAccount.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name.trim(),
        provider: input.provider?.trim() || null,
        counterparty: input.counterparty?.trim() || null,
        originalAmountMinor: originalMinor,
        currencyCode: input.currencyCode,
        currentBalanceMinor: balanceMinor,
        workspaceAmountMinor: toMinorUnits(input.originalAmount * snapshot.rate),
        workspaceCurrencyCode: workspace.baseCurrencyCode,
        workspaceBalanceMinor: toMinorUnits(Math.max(0, input.originalAmount - (input.alreadyPaid ?? 0)) * snapshot.rate),
        exchangeRate: snapshot.rate.toFixed(8),
        exchangeRateDate: snapshot.rateDate,
        interestRateBps: input.interestRateBps ?? null,
        termMonths: input.termMonths ?? null,
        monthlyAmountMinor: input.monthlyAmount != null ? toMinorUnits(input.monthlyAmount) : null,
        residualValueMinor: input.residualValue != null ? toMinorUnits(input.residualValue) : null,
        workspaceMonthlyAmountMinor: input.monthlyAmount != null ? toMinorUnits(input.monthlyAmount * snapshot.rate) : null,
        workspaceResidualValueMinor: input.residualValue != null ? toMinorUnits(input.residualValue * snapshot.rate) : null,
        interval: input.interval ?? null,
        anchorDays: input.anchorDays ?? [],
        nextPaymentDate: input.nextPaymentDate ?? null,
        openedAt: input.openedAt,
        notes: input.notes?.trim() || null,
      },
    });

    // Set enum fields via update (bypasses the create validation bug)
    return db.debtAccount.update({
      where: { id: account.id },
      data: {
        kind: input.kind,
        direction: input.direction,
        frequency: input.frequency ?? null,
      },
    });
  },

  async createPayment(input: {
    workspaceId: string;
    paidByUserId: string;
    debtAccountId: string;
    amount: number;
    currencyCode: string;
    paymentDate: Date;
    dueDate?: Date | null;
    notes?: string | null;
    createLinkedExpense: boolean;
  }) {
    const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { id: true, baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    const debtAccount = await db.debtAccount.findUnique({
      where: { id: input.debtAccountId },
      select: { id: true, workspaceId: true, name: true, currentBalanceMinor: true, workspaceBalanceMinor: true, currencyCode: true, isActive: true, direction: true, frequency: true, interval: true, anchorDays: true, openedAt: true, nextPaymentDate: true },
    });
    if (!debtAccount || debtAccount.workspaceId !== input.workspaceId) throw new Error("Debt account does not belong to this workspace.");
    if (!debtAccount.isActive) throw new Error("Inactive debt accounts cannot receive payments.");
    if (debtAccount.currencyCode !== input.currencyCode) throw new Error("Debt payment currency must match the debt account currency.");

    // Validate dueDate if provided
    if (input.dueDate) {
      // Check that a scheduled due date exists on that day
      const dayStart = new Date(input.dueDate.getFullYear(), input.dueDate.getMonth(), input.dueDate.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const scheduledDates = getDebtDueDatesInRange(debtAccount, dayStart, dayEnd);
      if (scheduledDates.length === 0) {
        throw new Error("The selected due date does not match any scheduled payment date.");
      }

      // Check no existing payment for this due date
      const existingPayment = await db.debtPayment.findFirst({
        where: { debtAccountId: debtAccount.id, dueDate: dayStart },
        select: { id: true },
      });
      if (existingPayment) {
        throw new Error("A payment has already been recorded for this due date.");
      }
    }

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: input.currencyCode,
      toCurrencyCode: workspace.baseCurrencyCode,
      expenseDate: input.paymentDate,
    });

    const originalAmountMinor = toMinorUnits(input.amount);
    if (originalAmountMinor > debtAccount.currentBalanceMinor) throw new Error("Payment cannot exceed the current debt balance.");
    const workspaceAmountMinor = toMinorUnits(input.amount * snapshot.rate);

    // Ensure "Debt Payments" category exists before the transaction so it's visible to expenseService
    const categoryId = input.createLinkedExpense && debtAccount.direction !== DebtDirection.they_owe_me
      ? await getDebtPaymentCategoryId(db, input.workspaceId)
      : null;

    return db.$transaction(async (tx) => {
      let linkedExpenseId: string | null = null;

      if (categoryId) {
        const expense = await expenseService.createRecord({
          workspaceId: input.workspaceId,
          categoryId,
          createdByUserId: input.paidByUserId,
          title: `${debtAccount.name} payment`,
          description: null,
          originalAmountMinor,
          originalCurrencyCode: input.currencyCode,
          workspaceAmountMinor,
          workspaceCurrencyCode: workspace.baseCurrencyCode,
          exchangeRate: snapshot.rate,
          exchangeRateDate: snapshot.rateDate,
          expenseDate: input.paymentDate,
          type: ExpenseType.debt_payment,
          status: ExpenseStatus.posted,
          notes: input.notes?.trim() || null,
          debtAccountId: debtAccount.id,
        });
        linkedExpenseId = expense.id;
      }

      // Normalize dueDate to start-of-day if provided
      const normalizedDueDate = input.dueDate
        ? new Date(input.dueDate.getFullYear(), input.dueDate.getMonth(), input.dueDate.getDate())
        : null;

      const payment = await tx.debtPayment.create({
        data: {
          workspaceId: input.workspaceId,
          debtAccountId: debtAccount.id,
          expenseId: linkedExpenseId,
          paidByUserId: input.paidByUserId,
          originalAmountMinor,
          originalCurrencyCode: input.currencyCode,
          workspaceAmountMinor,
          workspaceCurrencyCode: workspace.baseCurrencyCode,
          exchangeRate: snapshot.rate.toFixed(8),
          exchangeRateDate: snapshot.rateDate,
          paymentDate: input.paymentDate,
          dueDate: normalizedDueDate,
          notes: input.notes?.trim() || null,
        },
      });

      const newBalance = debtAccount.currentBalanceMinor - originalAmountMinor;
      const newWorkspaceBalance = newBalance <= 0 ? 0 : Math.max(0, debtAccount.workspaceBalanceMinor - workspaceAmountMinor);
      const accountUpdate: Record<string, unknown> = { currentBalanceMinor: newBalance, workspaceBalanceMinor: newWorkspaceBalance };

      // Advance nextPaymentDate if a schedule is configured
      if (debtAccount.frequency && debtAccount.interval) {
        if (newBalance <= 0) {
          // Debt fully paid — clear the next payment date
          accountUpdate.nextPaymentDate = null;
          accountUpdate.isActive = false;
        } else {
          // Find the next unpaid due date by looking ahead from now
          const lookAheadStart = new Date();
          lookAheadStart.setHours(0, 0, 0, 0);
          // Look 3 periods ahead to find the next unpaid date
          let lookAheadEnd = new Date(lookAheadStart);
          for (let i = 0; i < 3; i++) {
            lookAheadEnd = addRecurringInterval(lookAheadEnd, debtAccount.frequency, debtAccount.interval);
          }

          const upcomingDueDates = getDebtDueDatesInRange(debtAccount, lookAheadStart, lookAheadEnd);

          // Get all existing payments (including the one we just created) to find which dates are paid
          const existingPayments = await tx.debtPayment.findMany({
            where: {
              debtAccountId: debtAccount.id,
              dueDate: { not: null },
            },
            select: { dueDate: true },
          });
          const paidKeys = new Set(existingPayments.map((p) => dateKey(p.dueDate!)));

          const nextUnpaid = upcomingDueDates.find((d) => !paidKeys.has(dateKey(d)));
          accountUpdate.nextPaymentDate = nextUnpaid ?? null;
        }
      }

      await tx.debtAccount.update({
        where: { id: debtAccount.id },
        data: accountUpdate,
      });

      return payment;
    });
  },

  /**
   * Get payment status for a single debt in a given month.
   */
  async getMonthPaymentStatus(workspaceId: string, debtAccountId: string, year: number, month: number): Promise<MonthPaymentStatus> {
    const account = await db.debtAccount.findUnique({
      where: { id: debtAccountId },
      select: { workspaceId: true, openedAt: true, frequency: true, interval: true, anchorDays: true, monthlyAmountMinor: true },
    });
    if (!account || account.workspaceId !== workspaceId) {
      return { dueCount: 0, paidCount: 0, unpaidCount: 0, nextUnpaidDate: null, unpaidDueDates: [] };
    }

    const rangeStart = new Date(year, month, 1);
    const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const dueDates = getDebtDueDatesInRange(account, rangeStart, rangeEnd);

    if (dueDates.length > 0) {
      // Has a formal schedule
      const payments = await db.debtPayment.findMany({
        where: { debtAccountId, dueDate: { gte: rangeStart, lte: rangeEnd } },
        select: { dueDate: true },
      });
      const paidKeys = new Set(payments.filter((p) => p.dueDate).map((p) => dateKey(p.dueDate!)));
      const unpaidDueDates = dueDates.filter((d) => !paidKeys.has(dateKey(d)));
      return {
        dueCount: dueDates.length,
        paidCount: dueDates.length - unpaidDueDates.length,
        unpaidCount: unpaidDueDates.length,
        nextUnpaidDate: unpaidDueDates[0] ?? null,
        unpaidDueDates,
      };
    }

    if (account.monthlyAmountMinor != null && account.monthlyAmountMinor > 0) {
      // No formal schedule but has monthlyAmount — check if any payment was made this month
      const paymentCount = await db.debtPayment.count({
        where: { debtAccountId, paymentDate: { gte: rangeStart, lte: rangeEnd } },
      });
      return {
        dueCount: 1,
        paidCount: paymentCount > 0 ? 1 : 0,
        unpaidCount: paymentCount > 0 ? 0 : 1,
        nextUnpaidDate: null,
        unpaidDueDates: [],
      };
    }

    return { dueCount: 0, paidCount: 0, unpaidCount: 0, nextUnpaidDate: null, unpaidDueDates: [] };
  },

  /**
   * Get payment status for all active debts in a workspace for a given month.
   * For debts with a schedule: matches payments against scheduled due dates.
   * For debts without a schedule but with monthlyAmountMinor: checks if any payment was made this month.
   */
  async getAllDebtsMonthStatus(workspaceId: string, year: number, month: number): Promise<Record<string, MonthPaymentStatus>> {
    const accounts = await db.debtAccount.findMany({
      where: { workspaceId, isActive: true },
      select: { id: true, openedAt: true, frequency: true, interval: true, anchorDays: true, monthlyAmountMinor: true },
    });

    const rangeStart = new Date(year, month, 1);
    const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Fetch all payments for the month — by both dueDate and paymentDate
    const allPayments = await db.debtPayment.findMany({
      where: {
        workspaceId,
        OR: [
          { dueDate: { gte: rangeStart, lte: rangeEnd } },
          { paymentDate: { gte: rangeStart, lte: rangeEnd } },
        ],
      },
      select: { debtAccountId: true, dueDate: true, paymentDate: true },
    });

    // Group payments by debt account
    const dueDatePaymentsByDebt = new Map<string, Set<string>>();
    const paymentDateCountByDebt = new Map<string, number>();
    for (const p of allPayments) {
      if (p.dueDate && p.dueDate >= rangeStart && p.dueDate <= rangeEnd) {
        if (!dueDatePaymentsByDebt.has(p.debtAccountId)) dueDatePaymentsByDebt.set(p.debtAccountId, new Set());
        dueDatePaymentsByDebt.get(p.debtAccountId)!.add(dateKey(p.dueDate));
      }
      if (p.paymentDate >= rangeStart && p.paymentDate <= rangeEnd) {
        paymentDateCountByDebt.set(p.debtAccountId, (paymentDateCountByDebt.get(p.debtAccountId) ?? 0) + 1);
      }
    }

    const result: Record<string, MonthPaymentStatus> = {};
    for (const account of accounts) {
      const dueDates = getDebtDueDatesInRange(account, rangeStart, rangeEnd);

      if (dueDates.length > 0) {
        // Has a formal schedule — match against due dates
        const paidKeys = dueDatePaymentsByDebt.get(account.id) ?? new Set();
        const unpaidDueDates = dueDates.filter((d) => !paidKeys.has(dateKey(d)));
        result[account.id] = {
          dueCount: dueDates.length,
          paidCount: dueDates.length - unpaidDueDates.length,
          unpaidCount: unpaidDueDates.length,
          nextUnpaidDate: unpaidDueDates[0] ?? null,
          unpaidDueDates,
        };
      } else if (account.monthlyAmountMinor != null && account.monthlyAmountMinor > 0) {
        // No formal schedule but has monthlyAmount — treat as 1 due payment per month
        const paidThisMonth = (paymentDateCountByDebt.get(account.id) ?? 0) > 0;
        result[account.id] = {
          dueCount: 1,
          paidCount: paidThisMonth ? 1 : 0,
          unpaidCount: paidThisMonth ? 0 : 1,
          nextUnpaidDate: null,
          unpaidDueDates: [],
        };
      }
    }
    return result;
  },
};
