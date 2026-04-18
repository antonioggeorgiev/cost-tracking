"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMonthDay } from "@/lib/format-date";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";

type Expense = {
  id: string;
  title: string;
  categoryPath: string;
  expenseDate: string | Date;
  createdAt: string | Date;
  originalAmountMinor: number;
  originalCurrencyCode: string;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  status: string;
};

type RecentExpensesTableProps = {
  expenses: Expense[];
};

export function RecentExpensesTable({ expenses }: RecentExpensesTableProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="font-heading text-base font-semibold text-heading">Recent Expenses</h2>
        <Link
          href={routes.expenses}
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {/* Table header (desktop) */}
      <div className="hidden border-t border-border px-6 py-3 sm:grid sm:grid-cols-[1fr_100px_100px_120px_80px] sm:gap-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Date</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Created</span>
        <span className="text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground">Amount</span>
        <span className="text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</span>
      </div>

      {expenses.length > 0 ? (
        <div className="divide-y divide-border border-t border-border">
          {expenses.map((expense) => (
            <Link
              key={expense.id}
              href={routes.expense(expense.id)}
              className="block px-6 py-3.5 transition hover:bg-surface-secondary sm:grid sm:grid-cols-[1fr_100px_100px_120px_80px] sm:items-center sm:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-heading">{expense.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{expense.categoryPath}</p>
              </div>
              <span className="text-sm text-body">{formatMonthDay(expense.expenseDate)}</span>
              <span className="text-sm text-body">{formatMonthDay(expense.createdAt)}</span>
              <div className="text-right">
                <p className="font-medium text-heading">
                  {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={expense.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
          No expenses yet. Add your first expense above.
        </div>
      )}
    </section>
  );
}
