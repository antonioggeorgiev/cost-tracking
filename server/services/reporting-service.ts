import { DebtDirection, ExpenseStatus, ExpenseType, RecurringTemplateKind } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { normalizeToMonthlyMinor } from "@/lib/recurring-display";
import { debtService } from "@/server/services/debt-service";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function endOfMonthInclusive(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getWeekLabel(date: Date) {
  const day = date.getDate();
  if (day <= 7) return "Week 1";
  if (day <= 14) return "Week 2";
  if (day <= 21) return "Week 3";
  return "Week 4";
}

function categoryPath(category: { name: string; parentCategory?: { name: string } | null } | null): string {
  if (!category) return "Uncategorized";
  return category.parentCategory ? `${category.parentCategory.name} / ${category.name}` : category.name;
}

function categoryName(category: { name: string; parentCategory?: { name: string } | null } | null): string {
  if (!category) return "Uncategorized";
  return category.parentCategory ? category.parentCategory.name : category.name;
}

export const reportingService = {
  async getExpenseMonthSummary(spaceId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = endOfMonth(now);

    const grouped = await db.expense.groupBy({
      by: ["status"],
      where: {
        spaceId,
        expenseDate: { gte: monthStart, lt: nextMonthStart },
        status: { not: ExpenseStatus.cancelled },
      },
      _sum: { workspaceAmountMinor: true },
      _count: true,
    });

    let postedMinor = 0, pendingMinor = 0, plannedMinor = 0;
    let postedCount = 0, pendingCount = 0, plannedCount = 0;
    for (const g of grouped) {
      const amount = g._sum.workspaceAmountMinor ?? 0;
      const count = g._count;
      if (g.status === ExpenseStatus.posted) { postedMinor = amount; postedCount = count; }
      else if (g.status === ExpenseStatus.pending) { pendingMinor = amount; pendingCount = count; }
      else if (g.status === ExpenseStatus.planned) { plannedMinor = amount; plannedCount = count; }
    }

    return {
      postedMinor,
      pendingMinor,
      plannedMinor,
      totalMinor: postedMinor + pendingMinor + plannedMinor,
      postedCount,
      pendingCount,
      plannedCount,
    };
  },

  async getSpaceOverview(input: { spaceId: string; baseCurrencyCode: string }) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = endOfMonth(now);
    const monthEndInclusive = endOfMonthInclusive(now);
    const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const nextMonthNextStart = endOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      allCurrentMonthExpenses,
      previousMonthExpenses,
      recentExpenses,
      activeRecurringTemplates,
      recurringExpensesThisMonth,
      dueVariableRecurring,
      debtAccounts,
      debtPaymentsThisMonth,
      monthStatus,
      plannedExpensesNextMonth,
    ] = await Promise.all([
      // 1. All current month expenses (for status breakdown + categories + weekly)
      db.expense.findMany({
        where: { spaceId: input.spaceId, expenseDate: { gte: monthStart, lt: nextMonthStart } },
        include: { category: { include: { parentCategory: true } }, createdByUser: { select: { name: true, email: true } } },
      }),
      // 2. Previous month posted expenses
      db.expense.findMany({
        where: { spaceId: input.spaceId, status: ExpenseStatus.posted, expenseDate: { gte: previousMonthStart, lt: monthStart } },
        select: { workspaceAmountMinor: true },
      }),
      // 3. Recent activity
      db.expense.findMany({
        where: { spaceId: input.spaceId },
        include: { category: { include: { parentCategory: true } }, createdByUser: { select: { name: true, email: true } } },
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
      // 4. Active recurring templates
      db.recurringExpenseTemplate.findMany({
        where: { spaceId: input.spaceId, isActive: true },
        include: { category: { include: { parentCategory: true } } },
      }),
      // 5. Recurring-generated expenses this month
      db.expense.findMany({
        where: {
          spaceId: input.spaceId,
          recurringTemplateId: { not: null },
          expenseDate: { gte: monthStart, lt: nextMonthStart },
        },
        select: { recurringTemplateId: true, workspaceAmountMinor: true },
      }),
      // 6. Due variable recurring
      db.recurringExpenseTemplate.findMany({
        where: {
          spaceId: input.spaceId,
          kind: RecurringTemplateKind.variable_amount,
          isActive: true,
          nextOccurrenceDate: { lte: now },
        },
        include: { category: { include: { parentCategory: true } } },
        orderBy: { nextOccurrenceDate: "asc" },
      }),
      // 7. All active debt accounts
      db.debtAccount.findMany({
        where: { spaceId: input.spaceId, isActive: true },
      }),
      // 8. Debt payments this month
      db.debtPayment.findMany({
        where: {
          spaceId: input.spaceId,
          paymentDate: { gte: monthStart, lt: nextMonthStart },
        },
        select: { debtAccountId: true, workspaceAmountMinor: true },
      }),
      // 9. Debt month status
      debtService.getAllDebtsMonthStatus(input.spaceId, now.getFullYear(), now.getMonth()),
      // 10. Planned expenses next month (for forecast)
      db.expense.aggregate({
        where: {
          spaceId: input.spaceId,
          status: ExpenseStatus.planned,
          expenseDate: { gte: nextMonthDate, lt: nextMonthNextStart },
        },
        _sum: { workspaceAmountMinor: true },
      }),
    ]);

    // --- EXPENSES SECTION ---
    // Exclude recurring_generated and debt_payment types to avoid double-counting in the overview hero
    const standaloneExpenses = allCurrentMonthExpenses.filter(
      (e) => e.type !== ExpenseType.recurring_generated && e.type !== ExpenseType.debt_payment && e.status !== ExpenseStatus.cancelled,
    );
    const expenseDueMinor = standaloneExpenses.reduce((sum, e) => sum + e.workspaceAmountMinor, 0);
    const expensePaidMinor = standaloneExpenses
      .filter((e) => e.status === ExpenseStatus.posted)
      .reduce((sum, e) => sum + e.workspaceAmountMinor, 0);

    // Posted expenses (all types) for weekly spending + categories
    const postedExpenses = allCurrentMonthExpenses.filter((e) => e.status === ExpenseStatus.posted);
    const currentMonthTotal = postedExpenses.reduce((sum, e) => sum + e.workspaceAmountMinor, 0);
    const previousMonthTotal = previousMonthExpenses.reduce((sum, e) => sum + e.workspaceAmountMinor, 0);

    // Weekly spending
    const weeklyMap = new Map<string, number>();
    for (const expense of postedExpenses) {
      const week = getWeekLabel(expense.expenseDate);
      weeklyMap.set(week, (weeklyMap.get(week) ?? 0) + expense.workspaceAmountMinor);
    }
    const weeklySpending = ["Week 1", "Week 2", "Week 3", "Week 4"].map((week) => ({
      week,
      total: weeklyMap.get(week) ?? 0,
    }));

    // Category percentages
    const catMap = new Map<string, { label: string; amountMinor: number }>();
    for (const expense of postedExpenses) {
      const label = categoryName(expense.category);
      const existing = catMap.get(label);
      catMap.set(label, { label, amountMinor: (existing?.amountMinor ?? 0) + expense.workspaceAmountMinor });
    }
    const categoryPercentages = Array.from(catMap.values())
      .sort((a, b) => b.amountMinor - a.amountMinor)
      .map((entry) => ({
        ...entry,
        percentage: currentMonthTotal > 0 ? Math.round((entry.amountMinor / currentMonthTotal) * 100) : 0,
      }));

    // Pending expenses (for action items)
    const pendingExpenses = allCurrentMonthExpenses
      .filter((e) => e.status === ExpenseStatus.pending)
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        title: e.title,
        amountMinor: e.workspaceAmountMinor,
        expenseDate: e.expenseDate,
      }));

    // --- RECURRING SECTION ---
    const paidTemplateAmounts = new Map<string, number>();
    for (const e of recurringExpensesThisMonth) {
      if (e.recurringTemplateId) {
        paidTemplateAmounts.set(e.recurringTemplateId, (paidTemplateAmounts.get(e.recurringTemplateId) ?? 0) + e.workspaceAmountMinor);
      }
    }

    let recurringDueMinor = 0;
    let recurringPaidMinor = 0;
    for (const t of activeRecurringTemplates) {
      if (t.kind === RecurringTemplateKind.fixed_amount && t.workspaceAmountMinor != null) {
        const next = new Date(t.nextOccurrenceDate);
        const hasDueThisMonth = (next >= monthStart && next <= monthEndInclusive) || paidTemplateAmounts.has(t.id);
        if (hasDueThisMonth) {
          recurringDueMinor += t.workspaceAmountMinor;
        }
      }
      if (paidTemplateAmounts.has(t.id)) {
        recurringPaidMinor += paidTemplateAmounts.get(t.id)!;
      }
    }

    // --- DEBTS SECTION ---
    // Build a lookup for debt direction
    const debtById = new Map(debtAccounts.map((d) => [d.id, d]));
    // Debt payments by account
    const debtPaymentByAccount = new Map<string, number>();
    for (const p of debtPaymentsThisMonth) {
      const debt = debtById.get(p.debtAccountId);
      if (debt && debt.direction === DebtDirection.i_owe) {
        debtPaymentByAccount.set(p.debtAccountId, (debtPaymentByAccount.get(p.debtAccountId) ?? 0) + p.workspaceAmountMinor);
      }
    }

    let debtDueMinor = 0;
    let debtPaidMinor = 0;
    for (const debt of debtAccounts) {
      if (debt.direction !== DebtDirection.i_owe) continue;
      const status = monthStatus[debt.id];
      if (status && status.dueCount > 0 && debt.workspaceMonthlyAmountMinor != null) {
        debtDueMinor += debt.workspaceMonthlyAmountMinor * status.dueCount;
      }
      debtPaidMinor += debtPaymentByAccount.get(debt.id) ?? 0;
    }

    // Unpaid debt payments (action items)
    const unpaidDebtPayments: Array<{ debtId: string; name: string; amountMinor: number; dueDate: string }> = [];
    for (const debt of debtAccounts) {
      if (debt.direction !== DebtDirection.i_owe) continue;
      const status = monthStatus[debt.id];
      if (status && status.unpaidCount > 0) {
        for (const dueDate of status.unpaidDueDates) {
          unpaidDebtPayments.push({
            debtId: debt.id,
            name: debt.name,
            amountMinor: debt.workspaceMonthlyAmountMinor ?? 0,
            dueDate: dueDate.toISOString().slice(0, 10),
          });
        }
      }
    }

    // Debt balances
    const liabilities = debtAccounts.filter((d) => d.direction === DebtDirection.i_owe && d.kind !== "leasing").reduce((s, d) => s + d.workspaceBalanceMinor, 0);
    const receivables = debtAccounts.filter((d) => d.direction === "they_owe_me").reduce((s, d) => s + d.workspaceBalanceMinor, 0);
    const leasingTotal = debtAccounts.filter((d) => d.kind === "leasing").reduce((s, d) => s + d.workspaceBalanceMinor, 0);

    // --- HERO TOTALS ---
    const totalDueMinor = expenseDueMinor + debtDueMinor + recurringDueMinor;
    const totalPaidMinor = expensePaidMinor + debtPaidMinor + recurringPaidMinor;
    const totalRemainingMinor = Math.max(0, totalDueMinor - totalPaidMinor);

    // --- MONTH-OVER-MONTH ---
    const monthOverMonthChangePct = previousMonthTotal > 0
      ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100)
      : 0;

    // --- NEXT MONTH FORECAST ---
    let forecastRecurringMinor = 0;
    for (const t of activeRecurringTemplates) {
      if (t.kind === RecurringTemplateKind.fixed_amount && t.workspaceAmountMinor != null) {
        forecastRecurringMinor += normalizeToMonthlyMinor(t.workspaceAmountMinor, t.frequency, t.interval);
      }
    }
    const forecastDebtMinor = debtAccounts
      .filter((d) => d.direction === DebtDirection.i_owe && d.workspaceMonthlyAmountMinor != null)
      .reduce((sum, d) => sum + (d.workspaceMonthlyAmountMinor ?? 0), 0);
    const forecastPlannedMinor = plannedExpensesNextMonth._sum.workspaceAmountMinor ?? 0;
    const variableBillCount = activeRecurringTemplates.filter((t) => t.kind === RecurringTemplateKind.variable_amount).length;

    return {
      baseCurrencyCode: input.baseCurrencyCode,
      // Hero
      totalDueMinor,
      totalPaidMinor,
      totalRemainingMinor,
      // Section breakdown
      expenses: { dueMinor: expenseDueMinor, paidMinor: expensePaidMinor },
      debts: { dueMinor: debtDueMinor, paidMinor: debtPaidMinor },
      recurring: { dueMinor: recurringDueMinor, paidMinor: recurringPaidMinor },
      // Comparison
      currentMonthTotal,
      previousMonthTotal,
      monthOverMonthChangePct,
      weeklySpending,
      // Forecast
      nextMonthForecast: {
        totalMinor: forecastRecurringMinor + forecastDebtMinor + forecastPlannedMinor,
        recurringMinor: forecastRecurringMinor,
        debtMinor: forecastDebtMinor,
        plannedMinor: forecastPlannedMinor,
        variableBillCount,
      },
      // Categories
      categoryPercentages,
      // Action items
      unpaidDebtPayments,
      dueVariableRecurring: dueVariableRecurring.map((t) => ({
        id: t.id,
        title: t.title,
        nextOccurrenceDate: t.nextOccurrenceDate,
        originalCurrencyCode: t.originalCurrencyCode,
        paymentUrl: t.paymentUrl,
        categoryPath: categoryPath(t.category),
      })),
      pendingExpenses,
      // Recent
      recentExpenses: recentExpenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        categoryPath: categoryPath(expense.category),
        categoryName: categoryName(expense.category),
        createdByLabel: expense.createdByUser.name || expense.createdByUser.email,
        expenseDate: expense.expenseDate,
        workspaceAmountMinor: expense.workspaceAmountMinor,
        workspaceCurrencyCode: expense.workspaceCurrencyCode,
        status: expense.status,
        type: expense.type,
      })),
      // Debt balances
      debtBalances: { liabilities, receivables, leasing: leasingTotal, net: receivables - liabilities - leasingTotal },
    };
  },

  async getAllSpacesOverview(userId: string) {
    const memberships = await db.spaceMembership.findMany({
      where: { userId },
      select: { spaceId: true, space: { select: { name: true, slug: true, baseCurrencyCode: true } } },
    });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = endOfMonth(now);

    const spacesSummaries = await Promise.all(
      memberships.map(async (m) => {
        const [sumResult, countResult] = await Promise.all([
          db.expense.aggregate({
            where: {
              spaceId: m.spaceId,
              status: ExpenseStatus.posted,
              expenseDate: { gte: monthStart, lt: nextMonthStart },
            },
            _sum: { workspaceAmountMinor: true },
          }),
          db.expense.count({
            where: {
              spaceId: m.spaceId,
              status: ExpenseStatus.posted,
              expenseDate: { gte: monthStart, lt: nextMonthStart },
            },
          }),
        ]);

        return {
          spaceId: m.spaceId,
          name: m.space.name,
          slug: m.space.slug,
          baseCurrencyCode: m.space.baseCurrencyCode,
          currentMonthTotal: sumResult._sum.workspaceAmountMinor ?? 0,
          expenseCount: countResult,
        };
      }),
    );

    return { spaces: spacesSummaries };
  },

  async getSpaceDashboard(input: { spaceId: string; baseCurrencyCode: string }) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = endOfMonth(now);
    const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const [currentMonthExpenses, previousMonthExpenses, allCurrentMonthExpenses, recentExpenses, upcomingRecurring, dueVariableRecurring, debtAccounts] = await Promise.all([
      db.expense.findMany({
        where: { spaceId: input.spaceId, status: ExpenseStatus.posted, expenseDate: { gte: monthStart, lt: nextMonthStart } },
        include: { category: { include: { parentCategory: true } }, createdByUser: { select: { name: true, email: true } } },
        orderBy: { expenseDate: "desc" },
      }),
      db.expense.findMany({
        where: { spaceId: input.spaceId, status: ExpenseStatus.posted, expenseDate: { gte: previousMonthStart, lt: monthStart } },
        select: { workspaceAmountMinor: true },
      }),
      db.expense.findMany({
        where: { spaceId: input.spaceId, expenseDate: { gte: monthStart, lt: nextMonthStart } },
        select: { workspaceAmountMinor: true, status: true, expenseDate: true },
      }),
      db.expense.findMany({
        where: { spaceId: input.spaceId },
        include: { category: { include: { parentCategory: true } }, createdByUser: { select: { name: true, email: true } } },
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
      db.recurringExpenseTemplate.findMany({
        where: { spaceId: input.spaceId, kind: RecurringTemplateKind.fixed_amount, isActive: true },
        include: { category: { include: { parentCategory: true } } },
        orderBy: { nextOccurrenceDate: "asc" },
        take: 5,
      }),
      db.recurringExpenseTemplate.findMany({
        where: {
          spaceId: input.spaceId,
          kind: RecurringTemplateKind.variable_amount,
          isActive: true,
          nextOccurrenceDate: { lte: now },
        },
        include: { category: { include: { parentCategory: true } } },
        orderBy: { nextOccurrenceDate: "asc" },
        take: 5,
      }),
      db.debtAccount.findMany({
        where: { spaceId: input.spaceId, isActive: true },
        orderBy: { currentBalanceMinor: "desc" },
        take: 5,
      }),
    ]);

    const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.workspaceAmountMinor, 0);
    const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.workspaceAmountMinor, 0);

    // Pending and planned totals (all statuses in current month)
    const pendingTotal = allCurrentMonthExpenses
      .filter((e) => e.status === ExpenseStatus.pending)
      .reduce((sum, e) => sum + e.workspaceAmountMinor, 0);
    const plannedTotal = allCurrentMonthExpenses
      .filter((e) => e.status === ExpenseStatus.planned)
      .reduce((sum, e) => sum + e.workspaceAmountMinor, 0);

    // Weekly spending (posted expenses grouped by week)
    const weeklyMap = new Map<string, number>();
    for (const expense of currentMonthExpenses) {
      const week = getWeekLabel(expense.expenseDate);
      weeklyMap.set(week, (weeklyMap.get(week) ?? 0) + expense.workspaceAmountMinor);
    }
    const weeklySpending = ["Week 1", "Week 2", "Week 3", "Week 4"].map((week) => ({
      week,
      total: weeklyMap.get(week) ?? 0,
    }));

    // Spending by category with percentages
    const spendingByCategoryMap = new Map<string, { label: string; amountMinor: number }>();
    for (const expense of currentMonthExpenses) {
      const label = expense.category
        ? (expense.category.parentCategory ? expense.category.parentCategory.name : expense.category.name)
        : "Uncategorized";
      const existing = spendingByCategoryMap.get(label);
      spendingByCategoryMap.set(label, { label, amountMinor: (existing?.amountMinor ?? 0) + expense.workspaceAmountMinor });
    }
    const spendingByCategory = Array.from(spendingByCategoryMap.values()).sort((a, b) => b.amountMinor - a.amountMinor);
    const categoryPercentages = spendingByCategory.map((entry) => ({
      ...entry,
      percentage: currentMonthTotal > 0 ? Math.round((entry.amountMinor / currentMonthTotal) * 100) : 0,
    }));

    return {
      baseCurrencyCode: input.baseCurrencyCode,
      currentMonthTotal,
      previousMonthTotal,
      pendingTotal,
      plannedTotal,
      currentMonthExpenseCount: currentMonthExpenses.length,
      weeklySpending,
      spendingByCategory,
      categoryPercentages,
      recentExpenses: recentExpenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        categoryPath: expense.category
          ? (expense.category.parentCategory ? `${expense.category.parentCategory.name} / ${expense.category.name}` : expense.category.name)
          : "Uncategorized",
        categoryName: expense.category
          ? (expense.category.parentCategory ? expense.category.parentCategory.name : expense.category.name)
          : "Uncategorized",
        createdByLabel: expense.createdByUser.name || expense.createdByUser.email,
        expenseDate: expense.expenseDate,
        workspaceAmountMinor: expense.workspaceAmountMinor,
        workspaceCurrencyCode: expense.workspaceCurrencyCode,
        status: expense.status,
        type: expense.type,
      })),
      upcomingRecurring: upcomingRecurring.map((template) => ({
        id: template.id,
        title: template.title,
        nextOccurrenceDate: template.nextOccurrenceDate,
        workspaceAmountMinor: template.workspaceAmountMinor,
        workspaceCurrencyCode: template.workspaceCurrencyCode,
        categoryPath: template.category.parentCategory ? `${template.category.parentCategory.name} / ${template.category.name}` : template.category.name,
      })),
      dueVariableRecurring: dueVariableRecurring.map((template) => ({
        id: template.id,
        title: template.title,
        nextOccurrenceDate: template.nextOccurrenceDate,
        originalCurrencyCode: template.originalCurrencyCode,
        paymentUrl: template.paymentUrl,
        categoryPath: template.category.parentCategory ? `${template.category.parentCategory.name} / ${template.category.name}` : template.category.name,
      })),
      activeDebts: debtAccounts.map((debt) => ({
        id: debt.id,
        name: debt.name,
        workspaceBalanceMinor: debt.workspaceBalanceMinor,
        workspaceCurrencyCode: debt.workspaceCurrencyCode,
      })),
    };
  },
};
