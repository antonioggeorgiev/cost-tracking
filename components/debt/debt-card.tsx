"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Landmark, Users, Car, CreditCard, ArrowRight, Plus, CheckCircle } from "lucide-react";
import { ProgressRing } from "@/components/debt/progress-ring";
import { debtKindLabels } from "@/lib/finance-options";
import { formatMonthDay } from "@/lib/format-date";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";

const kindIcon: Record<string, typeof Landmark> = {
  bank_loan: Landmark,
  personal_loan: Users,
  leasing: Car,
};

export type DebtMonthStatus = {
  dueCount: number;
  paidCount: number;
  unpaidCount: number;
  nextUnpaidDate: string | null;
  unpaidDueDates: string[];
};

type DebtCardProps = {
  debt: {
    id: string;
    kind: string;
    direction: string;
    name: string;
    provider: string | null;
    counterparty: string | null;
    originalAmountMinor: number;
    currencyCode: string;
    currentBalanceMinor: number;
    workspaceAmountMinor: number;
    workspaceCurrencyCode: string;
    workspaceBalanceMinor: number;
    workspaceMonthlyAmountMinor: number | null;
    workspaceResidualValueMinor: number | null;
    interestRateBps: number | null;
    termMonths: number | null;
    monthlyAmountMinor: number | null;
    nextPaymentDate: Date | string | null;
    isActive: boolean;
    payments: Array<{ id: string }>;
  };
  spaceSlug: string;
  canManage: boolean;
  quickPayAction?: (formData: FormData) => Promise<void>;
  monthStatus?: DebtMonthStatus;
};

function formatPercent(bps: number) {
  return (bps / 100).toFixed(2) + "%";
}

export function DebtCard({ debt, spaceSlug, canManage, quickPayAction, monthStatus }: DebtCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Icon = kindIcon[debt.kind] ?? CreditCard;
  const label = debtKindLabels[debt.kind] ?? "Debt";
  const isPersonal = debt.kind === "personal_loan";
  const theyOweMe = debt.direction === "they_owe_me";

  const paidPercent =
    debt.workspaceAmountMinor > 0
      ? Math.round(((debt.workspaceAmountMinor - debt.workspaceBalanceMinor) / debt.workspaceAmountMinor) * 100)
      : 0;

  const subtitle = isPersonal && debt.counterparty
    ? theyOweMe
      ? `${debt.counterparty} owes you`
      : `You owe ${debt.counterparty}`
    : debt.provider || null;

  const hasMonthlyAmount = debt.monthlyAmountMinor != null && debt.monthlyAmountMinor > 0;
  const allPaidThisMonth = monthStatus != null && monthStatus.dueCount > 0 && monthStatus.unpaidCount === 0;
  const hasUnpaidDueDates = monthStatus != null && monthStatus.unpaidCount > 0;
  const nextUnpaidDate = monthStatus?.nextUnpaidDate
    ? new Date(monthStatus.nextUnpaidDate)
    : null;

  function handleQuickPay() {
    if (!quickPayAction) return;
    const formData = new FormData();
    formData.set("spaceSlug", spaceSlug);
    formData.set("debtAccountId", debt.id);
    formData.set("amount", String(debt.monthlyAmountMinor! / 100));
    formData.set("currencyCode", debt.currencyCode);
    formData.set("paymentDate", new Date().toISOString().slice(0, 10));
    formData.set("createLinkedExpense", "on");
    if (nextUnpaidDate) {
      formData.set("dueDate", nextUnpaidDate.toISOString().slice(0, 10));
    }
    startTransition(async () => {
      try {
        await quickPayAction(formData);
        router.refresh();
      } catch {
        // fall back silently, user can use the modal
      }
    });
  }

  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md ${!debt.isActive ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-heading">{debt.name}</p>
            {subtitle && <p className="truncate text-xs text-body">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-body">
            {label}
          </span>
          {theyOweMe && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
              Receivable
            </span>
          )}
          {!debt.isActive && (
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-body">
              Archived
            </span>
          )}
        </div>
      </div>

      {/* Progress + Amounts */}
      <div className="mt-4 flex items-center gap-4">
        <ProgressRing percentage={paidPercent} size={72} strokeWidth={7} />
        <div className="min-w-0 flex-1 space-y-1">
          <div>
            <p className="text-xs text-body">Original</p>
            <p className="font-semibold text-heading">{formatMoney(debt.workspaceAmountMinor, debt.workspaceCurrencyCode)}</p>
          </div>
          <div>
            <p className="text-xs text-body">Remaining</p>
            <p className="font-heading text-lg font-bold text-heading">{formatMoney(debt.workspaceBalanceMinor, debt.workspaceCurrencyCode)}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {/* This Month status */}
        {monthStatus != null && monthStatus.dueCount > 0 && debt.isActive && (
          <div className="rounded-lg bg-surface-secondary px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-body">This month</p>
            <p className={`mt-0.5 text-sm font-medium ${allPaidThisMonth ? "text-posted" : hasUnpaidDueDates ? "text-warning" : "text-heading"}`}>
              {allPaidThisMonth ? "All paid" : `${monthStatus.paidCount}/${monthStatus.dueCount} paid`}
            </p>
          </div>
        )}
        {/* Next unpaid date */}
        {nextUnpaidDate && debt.isActive && (
          <div className="rounded-lg bg-surface-secondary px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-body">Next due</p>
            <p className="mt-0.5 text-sm font-medium text-heading">
              {formatMonthDay(nextUnpaidDate)}
            </p>
          </div>
        )}
        {/* Fallback: show stored nextPaymentDate if no month status */}
        {(!monthStatus || monthStatus.dueCount === 0) && debt.nextPaymentDate && debt.isActive && (
          <div className="rounded-lg bg-surface-secondary px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-body">Next payment</p>
            <p className="mt-0.5 text-sm font-medium text-heading">
              {formatMonthDay(debt.nextPaymentDate)}
            </p>
          </div>
        )}
        {hasMonthlyAmount && (
          <div className="rounded-lg bg-surface-secondary px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-body">Monthly</p>
            <p className="mt-0.5 text-sm font-medium text-heading">{formatMoney(debt.workspaceMonthlyAmountMinor!, debt.workspaceCurrencyCode)}</p>
          </div>
        )}
        {debt.interestRateBps != null && (
          <div className="rounded-lg bg-surface-secondary px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-body">Interest</p>
            <p className="mt-0.5 text-sm font-medium text-heading">{formatPercent(debt.interestRateBps)}</p>
          </div>
        )}
        <div className="rounded-lg bg-surface-secondary px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-body">Payments</p>
          <p className="mt-0.5 text-sm font-medium text-heading">{debt.payments.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        {canManage && debt.isActive && (
          allPaidThisMonth && monthStatus!.dueCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-posted/10 px-4 py-2 text-sm font-semibold text-posted">
              <CheckCircle size={14} />
              Paid
            </span>
          ) : hasMonthlyAmount && quickPayAction && nextUnpaidDate ? (
            <button
              type="button"
              onClick={handleQuickPay}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-heading px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90 disabled:opacity-50"
            >
              <CheckCircle size={14} />
              {isPending
                ? "Paying..."
                : `Pay ${formatMonthDay(nextUnpaidDate)} - ${formatMoney(debt.workspaceMonthlyAmountMinor!, debt.workspaceCurrencyCode)}`}
            </button>
          ) : hasMonthlyAmount && quickPayAction ? (
            <button
              type="button"
              onClick={handleQuickPay}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-heading px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90 disabled:opacity-50"
            >
              <CheckCircle size={14} />
              {isPending ? "Paying..." : `Pay ${formatMoney(debt.workspaceMonthlyAmountMinor!, debt.workspaceCurrencyCode)}`}
            </button>
          ) : (
            <Link
              href={`${routes.debts}?modal=record-payment&debtId=${debt.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-heading px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90"
            >
              <Plus size={14} />
              {theyOweMe ? "Record Receipt" : "Add Payment"}
            </Link>
          )
        )}
        <Link
          href={routes.debt(debt.id)}
          className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:underline"
        >
          Details
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
