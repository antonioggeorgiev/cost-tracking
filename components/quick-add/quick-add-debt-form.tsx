"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DebtAccountKind, DebtDirection } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AmountInput,
  CurrencySelect,
  DatePickerField,
  FormError,
  FormSection,
  SchedulePicker,
} from "@/components/form-fields";
import { debtDirectionItems, debtKindItems } from "@/lib/finance-options";
import { type FrequencyOption, deriveScheduleFields } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";

type QuickAddDebtFormProps = {
  spaceSlug: string;
  baseCurrencyCode: string;
  currencies: readonly string[];
  createDebtAccount: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  onSuccess?: () => void;
};

export function QuickAddDebtForm({
  spaceSlug,
  baseCurrencyCode,
  currencies,
  createDebtAccount,
  submitLabel = "Create Debt Account",
  onSuccess,
}: QuickAddDebtFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const [kind, setKind] = useState<DebtAccountKind>(DebtAccountKind.bank_loan);
  const [direction, setDirection] = useState<DebtDirection>(DebtDirection.i_owe);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [originalAmount, setOriginalAmount] = useState(0);
  const [alreadyPaid, setAlreadyPaid] = useState(0);
  const [currencyCode, setCurrencyCode] = useState(baseCurrencyCode);
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [interestRate, setInterestRate] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [residualValue, setResidualValue] = useState(0);
  const [notes, setNotes] = useState("");

  // Payment schedule state
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [frequency, setFrequency] = useState<FrequencyOption>("monthly");
  const [interval, setInterval] = useState("1");

  const showProvider = kind === DebtAccountKind.bank_loan || kind === DebtAccountKind.leasing;
  const showCounterparty = kind === DebtAccountKind.personal_loan;
  const showInterestRate = kind !== DebtAccountKind.personal_loan;
  const showMonthlyAmount = kind === DebtAccountKind.bank_loan || kind === DebtAccountKind.leasing;
  const showResidualValue = kind === DebtAccountKind.leasing;

  function resetForm() {
    setKind(DebtAccountKind.bank_loan);
    setDirection(DebtDirection.i_owe);
    setName("");
    setProvider("");
    setCounterparty("");
    setOriginalAmount(0);
    setAlreadyPaid(0);
    setCurrencyCode(baseCurrencyCode);
    setOpenedAt(new Date().toISOString().slice(0, 10));
    setInterestRate("");
    setTermMonths("");
    setMonthlyAmount(0);
    setResidualValue(0);
    setNotes("");
    setSelectedDays([]);
    setFrequency("monthly");
    setInterval("1");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setFormError(null);

        const formData = new FormData();
        formData.set("spaceSlug", spaceSlug);
        formData.set("kind", kind);
        formData.set("direction", direction);
        formData.set("name", name);
        formData.set("originalAmount", String(originalAmount));
        if (alreadyPaid > 0) formData.set("alreadyPaid", String(alreadyPaid));
        formData.set("currencyCode", currencyCode);
        formData.set("openedAt", openedAt);
        formData.set("notes", notes);

        if (showProvider && provider) formData.set("provider", provider);
        if (showCounterparty && counterparty) formData.set("counterparty", counterparty);

        const bps = Math.round(parseFloat(interestRate) * 100);
        if (interestRate && !isNaN(bps)) formData.set("interestRateBps", String(bps));
        if (termMonths) formData.set("termMonths", termMonths);
        if (showMonthlyAmount && monthlyAmount) formData.set("monthlyAmount", String(monthlyAmount));
        if (showResidualValue && residualValue) formData.set("residualValue", String(residualValue));

        // Payment schedule
        if (selectedDays.length > 0) {
          const schedule = deriveScheduleFields(selectedDays, frequency, Number(interval) || 1);
          formData.set("frequency", schedule.frequency);
          formData.set("interval", String(schedule.interval));
          formData.set("anchorDays", JSON.stringify(schedule.anchorDays));
          formData.set("nextPaymentDate", schedule.startDate);
        }

        startTransition(async () => {
          try {
            await createDebtAccount(formData);
            resetForm();
            router.refresh();
            onSuccess?.();
          } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to create debt account.");
          }
        });
      }}
      className="space-y-6"
    >
      <FormError message={formError} />

      {/* Kind selector */}
      <div className="grid gap-1.5">
        <Label>Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {debtKindItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setKind(item.value)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left transition-colors",
                kind === item.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-transparent hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <span className={cn("text-sm font-medium", kind === item.value ? "text-primary" : "text-foreground")}>
                {item.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Direction selector */}
      <div className="grid gap-1.5">
        <Label>Direction</Label>
        <div className="grid grid-cols-2 gap-2">
          {debtDirectionItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDirection(item.value)}
              className={cn(
                "rounded-lg border px-4 py-3 text-center text-sm font-medium transition-colors",
                direction === item.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                  : "border-border bg-transparent hover:border-primary/40 hover:bg-muted/40 text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <FormSection legend="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="quick-debt-name">Name</Label>
            <Input
              id="quick-debt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={kind === DebtAccountKind.personal_loan ? "Loan to Alex" : "Renovation loan"}
            />
          </div>

          {showProvider && (
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="quick-debt-provider">{kind === DebtAccountKind.leasing ? "Leasing company" : "Lender / Bank"}</Label>
              <Input
                id="quick-debt-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder={kind === DebtAccountKind.leasing ? "AutoLeasing Co." : "Bank of America"}
              />
            </div>
          )}

          {showCounterparty && (
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="quick-debt-counterparty">Person</Label>
              <Input
                id="quick-debt-counterparty"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                required
                placeholder="Alex Johnson"
              />
            </div>
          )}

          <AmountInput
            value={originalAmount}
            onChange={setOriginalAmount}
            required
            label="Total amount"
            id="quick-debt-amount"
          />

          <AmountInput
            value={alreadyPaid}
            onChange={setAlreadyPaid}
            label="Already paid"
            id="quick-debt-already-paid"
            placeholder="0.00"
          />

          <CurrencySelect
            currencies={currencies}
            value={currencyCode}
            onValueChange={setCurrencyCode}
          />

          <DatePickerField
            value={openedAt}
            onChange={setOpenedAt}
            label="Opened at"
          />

          <div className="grid gap-1.5">
            <Label htmlFor="quick-debt-term">Term (months)</Label>
            <Input
              id="quick-debt-term"
              type="number"
              min="1"
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              placeholder="36"
            />
          </div>
        </div>
      </FormSection>

      {/* Financial details */}
      {(showInterestRate || showMonthlyAmount || showResidualValue) && (
        <FormSection legend="Financial details">
          <div className="grid gap-4 sm:grid-cols-2">
            {showInterestRate && (
              <div className="grid gap-1.5">
                <Label htmlFor="quick-debt-interest">Interest rate (%)</Label>
                <Input
                  id="quick-debt-interest"
                  type="number"
                  min="0"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="3.50"
                />
              </div>
            )}

            {showMonthlyAmount && (
              <AmountInput
                value={monthlyAmount}
                onChange={setMonthlyAmount}
                label="Payment amount"
                id="quick-debt-monthly-amount"
                placeholder="500.00"
              />
            )}

            {showResidualValue && (
              <AmountInput
                value={residualValue}
                onChange={setResidualValue}
                label="Residual value"
                id="quick-debt-residual-value"
                placeholder="5000.00"
              />
            )}
          </div>
        </FormSection>
      )}

      {/* Payment schedule */}
      <FormSection legend="Payment schedule">
        <SchedulePicker
          selectedDays={selectedDays}
          onSelectedDaysChange={setSelectedDays}
          frequency={frequency}
          onFrequencyChange={setFrequency}
          interval={interval}
          onIntervalChange={setInterval}
        />
      </FormSection>

      {/* Notes */}
      <div className="grid gap-1.5">
        <Label htmlFor="quick-debt-notes">Notes</Label>
        <Textarea
          id="quick-debt-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes"
        />
      </div>

      <Button type="submit" disabled={isPending || !name} className="w-full sm:w-auto">
        {isPending ? "Creating..." : submitLabel}
      </Button>
    </form>
  );
}
