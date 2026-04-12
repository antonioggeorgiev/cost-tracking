import { ExpenseStatus, ExpenseType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { expenseService } from "@/server/services/expense-service";
import { fxService } from "@/server/services/fx";

async function getDebtPaymentCategoryId(
  tx: Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">,
  workspaceId: string,
) {
  const existing = await tx.category.findFirst({
    where: { workspaceId, parentCategoryId: null, slug: "debt-payments" },
    select: { id: true },
  });
  if (existing) return existing.id;
  const category = await tx.category.create({ data: { workspaceId, name: "Debt Payments", slug: "debt-payments" } });
  return category.id;
}

export const debtService = {
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

  createAccount(input: { workspaceId: string; name: string; provider?: string | null; originalAmount: number; currencyCode: string; openedAt: Date; notes?: string | null }) {
    return db.debtAccount.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name.trim(),
        provider: input.provider?.trim() || null,
        originalAmountMinor: toMinorUnits(input.originalAmount),
        currencyCode: input.currencyCode,
        currentBalanceMinor: toMinorUnits(input.originalAmount),
        openedAt: input.openedAt,
        notes: input.notes?.trim() || null,
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
    notes?: string | null;
    createLinkedExpense: boolean;
  }) {
    const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { id: true, baseCurrencyCode: true } });
    if (!workspace) throw new Error("Workspace not found.");

    const debtAccount = await db.debtAccount.findUnique({
      where: { id: input.debtAccountId },
      select: { id: true, workspaceId: true, name: true, currentBalanceMinor: true, currencyCode: true, isActive: true },
    });
    if (!debtAccount || debtAccount.workspaceId !== input.workspaceId) throw new Error("Debt account does not belong to this workspace.");
    if (!debtAccount.isActive) throw new Error("Inactive debt accounts cannot receive payments.");
    if (debtAccount.currencyCode !== input.currencyCode) throw new Error("Debt payment currency must match the debt account currency.");

    const snapshot = await fxService.getExchangeRateSnapshot({
      fromCurrencyCode: input.currencyCode,
      toCurrencyCode: workspace.baseCurrencyCode,
      expenseDate: input.paymentDate,
    });

    const originalAmountMinor = toMinorUnits(input.amount);
    if (originalAmountMinor > debtAccount.currentBalanceMinor) throw new Error("Payment cannot exceed the current debt balance.");
    const workspaceAmountMinor = toMinorUnits(input.amount * snapshot.rate);

    return db.$transaction(async (tx) => {
      let linkedExpenseId: string | null = null;

      if (input.createLinkedExpense) {
        const expense = await expenseService.createRecord({
          workspaceId: input.workspaceId,
          categoryId: await getDebtPaymentCategoryId(tx, input.workspaceId),
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
          notes: input.notes?.trim() || null,
        },
      });

      await tx.debtAccount.update({
        where: { id: debtAccount.id },
        data: { currentBalanceMinor: debtAccount.currentBalanceMinor - originalAmountMinor },
      });

      return payment;
    });
  },
};
