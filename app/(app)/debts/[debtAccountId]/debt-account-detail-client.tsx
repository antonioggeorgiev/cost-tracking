"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Landmark, Users, Car, CreditCard, Pencil, Archive, RotateCcw, Pause, Play } from "lucide-react";
import { DebtAccountEditForm } from "@/components/debt/debt-account-edit-form";
import { Button } from "@/components/ui/button";
import { DebtPaymentSchedule } from "@/components/debt/debt-payment-schedule";
import { DebtRecordPaymentForm } from "@/components/debt/debt-record-payment-form";
import { Input } from "@/components/ui/input";
import { buildDebtMonthSchedule } from "@/lib/debt-schedule";
import {
  debtDirectionItems,
  debtKindItems,
  debtKindLabels,
  formatBasisPointsPercent,
} from "@/lib/finance-options";
import {
  formatLongMonthDayYear,
  formatMonthDay,
  formatMonthDayYear,
  formatShortDateTime,
} from "@/lib/format-date";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";
import { updateDebtAccountAction, toggleDebtActiveAction, createDebtPaymentAction } from "../actions";

type DebtData = {
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
  residualValueMinor: number | null;
  frequency: string | null;
  interval: number | null;
  anchorDays: number[];
  nextPaymentDate: string | null;
  openedAt: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type PaymentData = {
  id: string;
  originalAmountMinor: number;
  originalCurrencyCode: string;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  paymentDate: string;
  dueDate: string | null;
  notes: string | null;
  paidByLabel: string;
  expenseId: string | null;
};

type MonthStatusData = {
  dueCount: number;
  paidCount: number;
  unpaidCount: number;
  unpaidDueDates: string[];
};

type DebtAccountDetailClientProps = {
  spaceSlug: string;
  debt: DebtData;
  payments: PaymentData[];
  monthStatus: MonthStatusData;
  currencies: readonly string[];
  baseCurrencyCode: string;
  canManage: boolean;
};

const kindIcon: Record<string, typeof Landmark> = {
  bank_loan: Landmark,
  personal_loan: Users,
  leasing: Car,
};

export function DebtAccountDetailClient({
  spaceSlug,
  debt,
  payments,
  monthStatus,
  currencies,
  baseCurrencyCode,
  canManage,
}: DebtAccountDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentCalendarOpen, setPaymentCalendarOpen] = useState(false);

  // Edit form state
  const [kind, setKind] = useState(debt.kind);
  const [direction, setDirection] = useState(debt.direction);
  const [name, setName] = useState(debt.name);
  const [provider, setProvider] = useState(debt.provider ?? "");
  const [counterparty, setCounterparty] = useState(debt.counterparty ?? "");
  const [originalAmount, setOriginalAmount] = useState(debt.originalAmountMinor / 100);
  const [alreadyPaid, setAlreadyPaid] = useState((debt.originalAmountMinor - debt.currentBalanceMinor) / 100);
  const [currencyCode, setCurrencyCode] = useState(debt.currencyCode);
  const [openedAt, setOpenedAt] = useState(debt.openedAt);
  const [interestRateBps, setInterestRateBps] = useState(debt.interestRateBps != null ? debt.interestRateBps / 100 : "");
  const [termMonths, setTermMonths] = useState(debt.termMonths ?? "");
  const [monthlyAmount, setMonthlyAmount] = useState(debt.monthlyAmountMinor != null ? debt.monthlyAmountMinor / 100 : "");
  const [residualValue, setResidualValue] = useState(debt.residualValueMinor != null ? debt.residualValueMinor / 100 : "");
  const [notes, setNotes] = useState(debt.notes ?? "");

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState(
    debt.monthlyAmountMinor != null ? String(debt.monthlyAmountMinor / 100) : ""
  );
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentDueDate, setPaymentDueDate] = useState(monthStatus.unpaidDueDates[0] ?? "");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [createLinkedExpense, setCreateLinkedExpense] = useState(true);

  const currencyItems = currencies.map((c) => ({ value: c, label: c }));
  const Icon = kindIcon[debt.kind] ?? CreditCard;
  const isPersonal = debt.kind === "personal_loan";
  const theyOweMe = debt.direction === "they_owe_me";
  const paidPercent = debt.workspaceAmountMinor > 0
    ? Math.round(((debt.workspaceAmountMinor - debt.workspaceBalanceMinor) / debt.workspaceAmountMinor) * 100)
    : 0;
  const paymentSchedule = buildDebtMonthSchedule(payments, monthStatus.unpaidDueDates);

  function resetForm() {
    setKind(debt.kind);
    setDirection(debt.direction);
    setName(debt.name);
    setProvider(debt.provider ?? "");
    setCounterparty(debt.counterparty ?? "");
    setOriginalAmount(debt.originalAmountMinor / 100);
    setAlreadyPaid((debt.originalAmountMinor - debt.currentBalanceMinor) / 100);
    setCurrencyCode(debt.currencyCode);
    setOpenedAt(debt.openedAt);
    setInterestRateBps(debt.interestRateBps != null ? debt.interestRateBps / 100 : "");
    setTermMonths(debt.termMonths ?? "");
    setMonthlyAmount(debt.monthlyAmountMinor != null ? debt.monthlyAmountMinor / 100 : "");
    setResidualValue(debt.residualValueMinor != null ? debt.residualValueMinor / 100 : "");
    setNotes(debt.notes ?? "");
    setFormError(null);
  }

  function handleCancel() {
    resetForm();
    setIsEditing(false);
  }

  function handleSave() {
    setFormError(null);
    const formData = new FormData();
    formData.set("spaceSlug", spaceSlug);
    formData.set("debtAccountId", debt.id);
    formData.set("kind", kind);
    formData.set("direction", direction);
    formData.set("name", name);
    formData.set("provider", provider);
    formData.set("counterparty", counterparty);
    formData.set("originalAmount", String(originalAmount));
    if (alreadyPaid > 0) formData.set("alreadyPaid", String(alreadyPaid));
    formData.set("currencyCode", currencyCode);
    formData.set("openedAt", openedAt);
    formData.set("notes", notes);
    if (interestRateBps !== "") formData.set("interestRateBps", String(Math.round(Number(interestRateBps) * 100)));
    if (termMonths !== "") formData.set("termMonths", String(termMonths));
    if (monthlyAmount !== "") formData.set("monthlyAmount", String(monthlyAmount));
    if (residualValue !== "") formData.set("residualValue", String(residualValue));

    startTransition(async () => {
      const result = await updateDebtAccountAction(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleToggleActive() {
    const formData = new FormData();
    formData.set("spaceSlug", spaceSlug);
    formData.set("debtAccountId", debt.id);
    formData.set("isActive", String(!debt.isActive));

    startTransition(async () => {
      const result = await toggleDebtActiveAction(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRecordPayment() {
    setFormError(null);
    const formData = new FormData();
    formData.set("spaceSlug", spaceSlug);
    formData.set("debtAccountId", debt.id);
    formData.set("amount", paymentAmount);
    formData.set("currencyCode", debt.currencyCode);
    formData.set("paymentDate", paymentDate);
    if (paymentDueDate) formData.set("dueDate", paymentDueDate);
    formData.set("notes", paymentNotes);
    if (createLinkedExpense) formData.set("createLinkedExpense", "on");

    startTransition(async () => {
      try {
        await createDebtPaymentAction(formData);
        setPaymentAmount(debt.monthlyAmountMinor != null ? String(debt.monthlyAmountMinor / 100) : "");
        setPaymentNotes("");
        setPaymentDate(format(new Date(), "yyyy-MM-dd"));
        setPaymentDueDate("");
        setShowPaymentForm(false);
        router.refresh();
      } catch {
        setFormError("Unable to record payment.");
      }
    });
  }

  const openedDateValue = openedAt ? new Date(openedAt + "T00:00:00") : undefined;
  const paymentDateValue = paymentDate ? new Date(paymentDate + "T00:00:00") : undefined;

  return (
    <div className="space-y-6">
      {/* Back link + actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-heading"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        {canManage && !isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={isPending}>
              {debt.isActive ? <Archive size={14} data-icon="inline-start" /> : <RotateCcw size={14} data-icon="inline-start" />}
              {debt.isActive ? "Archive" : "Reactivate"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil size={14} data-icon="inline-start" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {formError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      {/* Main content card */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="px-6 py-5">
          {isEditing ? (
            /* ---------- EDIT MODE ---------- */
            <DebtAccountEditForm
              kind={kind}
              direction={direction}
              name={name}
              provider={provider}
              counterparty={counterparty}
              originalAmount={originalAmount}
              alreadyPaid={alreadyPaid}
              currencyCode={currencyCode}
              openedAt={openedAt}
              interestRateBps={interestRateBps}
              termMonths={termMonths}
              monthlyAmount={monthlyAmount}
              residualValue={residualValue}
              notes={notes}
              kindItems={kindItems}
              directionItems={debtDirectionItems}
              currencyItems={currencyItems}
              calendarOpen={calendarOpen}
              openedDateValue={openedDateValue}
              isPending={isPending}
              onKindChange={setKind}
              onDirectionChange={setDirection}
              onNameChange={setName}
              onProviderChange={setProvider}
              onCounterpartyChange={setCounterparty}
              onOriginalAmountChange={setOriginalAmount}
              onAlreadyPaidChange={setAlreadyPaid}
              onCurrencyCodeChange={setCurrencyCode}
              onOpenedAtChange={setOpenedAt}
              onInterestRateBpsChange={setInterestRateBps}
              onTermMonthsChange={setTermMonths}
              onMonthlyAmountChange={setMonthlyAmount}
              onResidualValueChange={setResidualValue}
              onNotesChange={setNotes}
              onCalendarOpenChange={setCalendarOpen}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            /* ---------- VIEW MODE ---------- */
            <div className="space-y-5">
              {/* Title + badges */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h1 className="font-heading text-xl font-bold text-heading">{debt.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {isPersonal && debt.counterparty
                        ? theyOweMe ? `${debt.counterparty} owes you` : `You owe ${debt.counterparty}`
                        : debt.provider || "No provider"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-body">
                    {debtKindLabels[debt.kind] ?? "Debt"}
                  </span>
                  {theyOweMe && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-primary">
                      Receivable
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${debt.isActive ? "bg-posted-bg text-posted" : "bg-surface-secondary text-muted"}`}>
                    {debt.isActive ? "Active" : "Archived"}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-body">Paid {paidPercent}%</span>
                  <span className="font-medium text-heading">{formatMoney(debt.workspaceBalanceMinor, debt.workspaceCurrencyCode)} remaining</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-surface-secondary">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary to-primary-dark" style={{ width: `${paidPercent}%` }} />
                </div>
              </div>

              <DebtPaymentSchedule
                dueCount={monthStatus.dueCount}
                paidCount={monthStatus.paidCount}
                unpaidCount={monthStatus.unpaidCount}
                paymentSchedule={paymentSchedule}
                workspaceMonthlyAmountMinor={debt.workspaceMonthlyAmountMinor}
                workspaceCurrencyCode={debt.workspaceCurrencyCode}
                nextPaymentDate={debt.nextPaymentDate}
                isActive={debt.isActive}
              />

              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Original Amount</p>
                  <p className="mt-1 text-lg font-semibold text-heading">{formatMoney(debt.workspaceAmountMinor, debt.workspaceCurrencyCode)}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Current Balance</p>
                  <p className="mt-1 text-lg font-semibold text-heading">{formatMoney(debt.workspaceBalanceMinor, debt.workspaceCurrencyCode)}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Opened</p>
                  <p className="mt-1 font-medium text-heading">
                    {formatLongMonthDayYear(`${debt.openedAt}T00:00:00`)}
                  </p>
                </div>

                {debt.interestRateBps != null && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Interest Rate</p>
                    <p className="mt-1 font-medium text-heading">{formatBasisPointsPercent(debt.interestRateBps)}</p>
                  </div>
                )}

                {debt.termMonths != null && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Term</p>
                    <p className="mt-1 font-medium text-heading">{debt.termMonths} months</p>
                  </div>
                )}

                {debt.workspaceMonthlyAmountMinor != null && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Monthly Payment</p>
                    <p className="mt-1 font-medium text-heading">{formatMoney(debt.workspaceMonthlyAmountMinor, debt.workspaceCurrencyCode)}</p>
                  </div>
                )}

                {debt.workspaceResidualValueMinor != null && debt.kind === "leasing" && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Residual Value</p>
                    <p className="mt-1 font-medium text-heading">{formatMoney(debt.workspaceResidualValueMinor, debt.workspaceCurrencyCode)}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Payments</p>
                  <p className="mt-1 font-medium text-heading">{payments.length}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last updated</p>
                  <p className="mt-1 font-medium text-heading">
                    {formatShortDateTime(debt.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {debt.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-body">{debt.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Record Payment section */}
      {canManage && debt.isActive && (
        <section className="rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-heading">Record Payment</h2>
            {!showPaymentForm && (
              <Button variant="outline" size="sm" onClick={() => setShowPaymentForm(true)}>
                New Payment
              </Button>
            )}
          </div>

          {showPaymentForm ? (
            <DebtRecordPaymentForm
              unpaidDueDates={monthStatus.unpaidDueDates}
              dueCount={monthStatus.dueCount}
              paymentDueDate={paymentDueDate}
              paymentAmount={paymentAmount}
              paymentDate={paymentDate}
              paymentNotes={paymentNotes}
              createLinkedExpense={createLinkedExpense}
              paymentCalendarOpen={paymentCalendarOpen}
              paymentDateValue={paymentDateValue}
              currencyCode={debt.currencyCode}
              isPending={isPending}
              onPaymentDueDateChange={setPaymentDueDate}
              onPaymentAmountChange={setPaymentAmount}
              onPaymentDateChange={setPaymentDate}
              onPaymentNotesChange={setPaymentNotes}
              onCreateLinkedExpenseChange={setCreateLinkedExpense}
              onPaymentCalendarOpenChange={setPaymentCalendarOpen}
              onSubmit={handleRecordPayment}
              onCancel={() => setShowPaymentForm(false)}
            />
          ) : null}
        </section>
      )}

      {/* Payment History */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Payment History</h2>
          <span className="text-sm text-muted">{payments.length} total</span>
        </div>

        {payments.length > 0 ? (
          <div className="divide-y divide-border">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-heading">
                    {formatMoney(payment.workspaceAmountMinor, payment.workspaceCurrencyCode)}
                    {payment.dueDate && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        For: {formatMonthDay(`${payment.dueDate}T00:00:00`)}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatMonthDayYear(`${payment.paymentDate}T00:00:00`)}
                    {" · "}
                    {payment.paidByLabel}
                    {payment.notes && ` · ${payment.notes}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {payment.expenseId && (
                    <Link
                      href={routes.expense(payment.expenseId)}
                      className="text-xs text-primary hover:underline"
                    >
                      View expense
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">
            No payments recorded yet.
          </div>
        )}
      </section>
    </div>
  );
}
