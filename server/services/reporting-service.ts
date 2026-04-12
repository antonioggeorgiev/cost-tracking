import { ExpenseStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export const reportingService = {
  async getWorkspaceDashboard(input: { workspaceId: string; baseCurrencyCode: string }) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = endOfMonth(now);
    const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const [currentMonthExpenses, previousMonthExpenses, recentExpenses, upcomingRecurring, debtAccounts] = await Promise.all([
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
    const spendingByCategoryMap = new Map<string, { label: string; amountMinor: number }>();

    for (const expense of currentMonthExpenses) {
      const label = expense.category.parentCategory ? expense.category.parentCategory.name : expense.category.name;
      const existing = spendingByCategoryMap.get(label);
      spendingByCategoryMap.set(label, { label, amountMinor: (existing?.amountMinor ?? 0) + expense.workspaceAmountMinor });
    }

    return {
      baseCurrencyCode: input.baseCurrencyCode,
      currentMonthTotal,
      previousMonthTotal,
      currentMonthExpenseCount: currentMonthExpenses.length,
      spendingByCategory: Array.from(spendingByCategoryMap.values()).sort((a, b) => b.amountMinor - a.amountMinor),
      recentExpenses: recentExpenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        categoryPath: expense.category.parentCategory ? `${expense.category.parentCategory.name} / ${expense.category.name}` : expense.category.name,
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
