import { ExpenseStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function getWeekLabel(date: Date) {
  const day = date.getDate();
  if (day <= 7) return "Week 1";
  if (day <= 14) return "Week 2";
  if (day <= 21) return "Week 3";
  return "Week 4";
}

export const reportingService = {
  async getWorkspaceDashboard(input: { workspaceId: string; baseCurrencyCode: string }) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = endOfMonth(now);
    const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const [currentMonthExpenses, previousMonthExpenses, allCurrentMonthExpenses, recentExpenses, upcomingRecurring, debtAccounts] = await Promise.all([
      db.expense.findMany({
        where: { workspaceId: input.workspaceId, status: ExpenseStatus.posted, expenseDate: { gte: monthStart, lt: nextMonthStart } },
        include: { category: { include: { parentCategory: true } }, createdByUser: { select: { name: true, email: true } } },
        orderBy: { expenseDate: "desc" },
      }),
      db.expense.findMany({
        where: { workspaceId: input.workspaceId, status: ExpenseStatus.posted, expenseDate: { gte: previousMonthStart, lt: monthStart } },
        select: { workspaceAmountMinor: true },
      }),
      db.expense.findMany({
        where: { workspaceId: input.workspaceId, expenseDate: { gte: monthStart, lt: nextMonthStart } },
        select: { workspaceAmountMinor: true, status: true, expenseDate: true },
      }),
      db.expense.findMany({
        where: { workspaceId: input.workspaceId },
        include: { category: { include: { parentCategory: true } }, createdByUser: { select: { name: true, email: true } } },
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
      db.recurringExpenseTemplate.findMany({
        where: { workspaceId: input.workspaceId, isActive: true },
        include: { category: { include: { parentCategory: true } } },
        orderBy: { nextOccurrenceDate: "asc" },
        take: 5,
      }),
      db.debtAccount.findMany({
        where: { workspaceId: input.workspaceId, isActive: true },
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
      const label = expense.category.parentCategory ? expense.category.parentCategory.name : expense.category.name;
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
        categoryPath: expense.category.parentCategory ? `${expense.category.parentCategory.name} / ${expense.category.name}` : expense.category.name,
        categoryName: expense.category.parentCategory ? expense.category.parentCategory.name : expense.category.name,
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
      activeDebts: debtAccounts.map((debt) => ({
        id: debt.id,
        name: debt.name,
        currentBalanceMinor: debt.currentBalanceMinor,
        currencyCode: debt.currencyCode,
      })),
    };
  },
};
