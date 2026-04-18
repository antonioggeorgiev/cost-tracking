"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Landmark, Users, Car, CreditCard, Pencil, Archive, RotateCcw, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
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
  workspaceSlug: string;
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

const kindLabel: Record<string, string> = {
  bank_loan: "Bank Loan",
  personal_loan: "Personal",
  leasing: "Leasing",
};

const kindItems = [
  { value: "bank_loan", label: "Bank Loan" },
  { value: "personal_loan", label: "Personal" },
  { value: "leasing", label: "Leasing" },
];

const directionItems = [
  { value: "i_owe", label: "I owe" },
  { value: "they_owe_me", label: "They owe me" },
];

function formatPercent(bps: number) {
  return (bps / 100).toFixed(2) + "%";
}

export function DebtAccountDetailClient({
  workspaceSlug,
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
    formData.set("workspaceSlug", workspaceSlug);
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
    formData.set("workspaceSlug", workspaceSlug);
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
    formData.set("workspaceSlug", workspaceSlug);
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Type</Label>
                  <SearchableSelect items={kindItems} value={kind} onValueChange={setKind} placeholder="Type" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Direction</Label>
                  <SearchableSelect items={directionItems} value={direction} onValueChange={setDirection} placeholder="Direction" />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              {(kind === "bank_loan" || kind === "leasing") && (
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-provider">Provider</Label>
                  <Input id="edit-provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Bank or company name" />
                </div>
              )}

              {kind === "personal_loan" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-counterparty">Counterparty</Label>
                  <Input id="edit-counterparty" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Person name" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-amount">Original Amount</Label>
                  <Input id="edit-amount" type="number" min="0.01" step="0.01" value={originalAmount || ""} onChange={(e) => setOriginalAmount(e.target.valueAsNumber || 0)} required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-already-paid">Already Paid</Label>
                  <Input id="edit-already-paid" type="number" min="0" step="0.01" value={alreadyPaid || ""} onChange={(e) => setAlreadyPaid(e.target.valueAsNumber || 0)} placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Currency</Label>
                  <SearchableSelect items={currencyItems} value={currencyCode} onValueChange={setCurrencyCode} placeholder="Currency" searchPlaceholder="Search..." />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Opened At</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger className={cn("flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", !openedAt && "text-muted-foreground")}>
                    {openedDateValue ? format(openedDateValue, "MMM d, yyyy") : "Pick a date"}
                    <CalendarIcon className="size-4 text-muted-foreground" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={openedDateValue} onSelect={(date) => { if (date) setOpenedAt(format(date, "yyyy-MM-dd")); setCalendarOpen(false); }} defaultMonth={openedDateValue} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-interest">Interest Rate (%)</Label>
                  <Input id="edit-interest" type="number" min="0" step="0.01" value={interestRateBps} onChange={(e) => setInterestRateBps(e.target.value === "" ? "" : e.target.valueAsNumber)} placeholder="e.g. 5.25" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-term">Term (months)</Label>
                  <Input id="edit-term" type="number" min="1" step="1" value={termMonths} onChange={(e) => setTermMonths(e.target.value === "" ? "" : e.target.valueAsNumber)} placeholder="e.g. 24" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-monthly">Monthly Payment</Label>
                  <Input id="edit-monthly" type="number" min="0.01" step="0.01" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value === "" ? "" : e.target.valueAsNumber)} placeholder="Amount" />
                </div>
                {kind === "leasing" && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-residual">Residual Value</Label>
                    <Input id="edit-residual" type="number" min="0" step="0.01" value={residualValue} onChange={(e) => setResidualValue(e.target.value === "" ? "" : e.target.valueAsNumber)} placeholder="Amount" />
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="ghost" onClick={handleCancel} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </div>
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
                    {kindLabel[debt.kind] ?? "Debt"}
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

              {/* Payment schedule for this month */}
              {debt.isActive && monthStatus.dueCount > 0 && (
                <div className="rounded-xl border border-border bg-surface-secondary p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-heading">
                      Payment Schedule &mdash; {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${monthStatus.unpaidCount === 0 ? "bg-posted/10 text-posted" : "bg-warning/10 text-warning"}`}>
                      {monthStatus.unpaidCount === 0 ? "All paid" : `${monthStatus.paidCount}/${monthStatus.dueCount} paid`}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {/* Build combined list: paid dates from payments + unpaid dates from monthStatus */}
                    {(() => {
                      const now = new Date();
                      const currentMonthPayments = payments.filter((p) => {
                        if (!p.dueDate) return false;
                        const d = new Date(p.dueDate + "T00:00:00");
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      });
                      const paidDateMap = new Map(currentMonthPayments.map((p) => [p.dueDate!, p]));
                      const allDates = [
                        ...currentMonthPayments.map((p) => ({ date: p.dueDate!, paid: true as const, payment: p })),
                        ...monthStatus.unpaidDueDates.map((d) => ({ date: d, paid: false as const, payment: null })),
                      ].sort((a, b) => a.date.localeCompare(b.date));
                      // Deduplicate (in case a paid date also appears in unpaid list due to timing)
                      const seen = new Set<string>();
                      const unique = allDates.filter((item) => {
                        if (seen.has(item.date)) return false;
                        seen.add(item.date);
                        return true;
                      });
                      return unique.map((item) => (
                        <div key={item.date} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${item.paid ? "bg-posted/5" : "bg-surface"}`}>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${item.paid ? "bg-posted/20 text-posted" : "bg-surface-secondary text-body"}`}>
                            {item.paid ? "\u2713" : "\u00B7"}
                          </span>
                          <span className="text-sm font-medium text-heading">
                            {new Date(item.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          {item.paid && item.payment ? (
                            <span className="text-xs text-posted">
                              Paid &mdash; {formatMoney(item.payment.workspaceAmountMinor, item.payment.workspaceCurrencyCode)} on{" "}
                              {new Date(item.payment.paymentDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          ) : (
                            <span className="text-xs text-body">
                              {new Date(item.date + "T00:00:00") < now ? "Overdue" : "Due"}
                              {debt.workspaceMonthlyAmountMinor != null && ` \u2014 ${formatMoney(debt.workspaceMonthlyAmountMinor, debt.workspaceCurrencyCode)}`}
                            </span>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Next payment due (fallback for debts without monthly schedule) */}
              {debt.nextPaymentDate && debt.isActive && monthStatus.dueCount === 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                  <span className="text-sm font-medium text-primary">Next payment due:</span>
                  <span className="text-sm font-semibold text-heading">
                    {new Date(debt.nextPaymentDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {debt.workspaceMonthlyAmountMinor != null && (
                    <span className="ml-auto text-sm font-semibold text-heading">
                      {formatMoney(debt.workspaceMonthlyAmountMinor, debt.workspaceCurrencyCode)}
                    </span>
                  )}
                </div>
              )}

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
                    {new Date(debt.openedAt + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {debt.interestRateBps != null && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Interest Rate</p>
                    <p className="mt-1 font-medium text-heading">{formatPercent(debt.interestRateBps)}</p>
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
                    {new Date(debt.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
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

          {showPaymentForm && (
            <div className="border-t border-border px-6 py-4 space-y-4">
              {/* Due date selector */}
              {monthStatus.unpaidDueDates.length > 0 && (
                <div className="grid gap-1.5">
                  <Label>Due date</Label>
                  <select
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {monthStatus.unpaidDueDates.map((d) => (
                      <option key={d} value={d}>
                        {new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {monthStatus.dueCount > 0 && monthStatus.unpaidDueDates.length === 0 && (
                <div className="rounded-lg border border-posted/20 bg-posted/5 px-4 py-3 text-sm text-posted">
                  All scheduled payments for this month have been recorded.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="payment-amount">Amount ({debt.currencyCode})</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Payment Date</Label>
                  <Popover open={paymentCalendarOpen} onOpenChange={setPaymentCalendarOpen}>
                    <PopoverTrigger className={cn("flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", !paymentDate && "text-muted-foreground")}>
                      {paymentDateValue ? format(paymentDateValue, "MMM d, yyyy") : "Pick a date"}
                      <CalendarIcon className="size-4 text-muted-foreground" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={paymentDateValue} onSelect={(date) => { if (date) setPaymentDate(format(date, "yyyy-MM-dd")); setPaymentCalendarOpen(false); }} defaultMonth={paymentDateValue} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="payment-notes">Notes</Label>
                <Input id="payment-notes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Optional" />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createLinkedExpense}
                  onChange={(e) => setCreateLinkedExpense(e.target.checked)}
                  className="rounded border-input"
                />
                Create linked expense record
              </label>

              <div className="flex items-center gap-2">
                <Button onClick={handleRecordPayment} disabled={isPending || !paymentAmount}>
                  {isPending ? "Recording..." : "Record Payment"}
                </Button>
                <Button variant="ghost" onClick={() => setShowPaymentForm(false)} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
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
                        For: {new Date(payment.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(payment.paymentDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}
                    {payment.paidByLabel}
                    {payment.notes && ` · ${payment.notes}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {payment.expenseId && (
                    <Link
                      href={routes.workspaceExpense(workspaceSlug, payment.expenseId)}
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
