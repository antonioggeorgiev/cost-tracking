"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AmountInput,
  CurrencySelect,
  DatePickerField,
  FormError,
} from "@/components/form-fields";

type DebtAccountOption = {
  id: string;
  name: string;
  currencyCode: string;
  isActive: boolean;
  monthlyAmountMinor?: number | null;
  unpaidDueDates?: string[];
};

type DebtPaymentFormProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  currencies: readonly string[];
  debtAccounts: DebtAccountOption[];
  createDebtPayment: (formData: FormData) => Promise<void>;
  defaultDebtAccountId?: string;
  onSuccess?: () => void;
};

export function DebtPaymentForm({
  workspaceSlug,
  baseCurrencyCode,
  currencies,
  debtAccounts,
  createDebtPayment,
  defaultDebtAccountId,
  onSuccess,
}: DebtPaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const [debtAccountId, setDebtAccountId] = useState(defaultDebtAccountId ?? "");
  const [amount, setAmount] = useState(0);
  const [currencyCode, setCurrencyCode] = useState(baseCurrencyCode);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [createLinkedExpense, setCreateLinkedExpense] = useState(true);

  const activeAccounts = debtAccounts.filter((d) => d.isActive);
  const accountItems = activeAccounts.map((d) => ({
    value: d.id,
    label: `${d.name} · ${d.currencyCode}`,
  }));

  const selectedAccount = activeAccounts.find((d) => d.id === debtAccountId);
  const unpaidDates = selectedAccount?.unpaidDueDates ?? [];
  const hasSchedule = unpaidDates.length > 0;

  // Auto-select first unpaid date and auto-fill amount when account changes
  useEffect(() => {
    if (selectedAccount) {
      setCurrencyCode(selectedAccount.currencyCode);
      if (unpaidDates.length > 0) {
        setDueDate(unpaidDates[0]);
        if (selectedAccount.monthlyAmountMinor != null && selectedAccount.monthlyAmountMinor > 0) {
          setAmount(selectedAccount.monthlyAmountMinor / 100);
        }
      } else {
        setDueDate("");
      }
    }
  }, [debtAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setDebtAccountId("");
    setAmount(0);
    setCurrencyCode(baseCurrencyCode);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setNotes("");
    setCreateLinkedExpense(true);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setFormError(null);

        const formData = new FormData();
        formData.set("workspaceSlug", workspaceSlug);
        formData.set("debtAccountId", debtAccountId);
        formData.set("amount", String(amount));
        formData.set("currencyCode", currencyCode);
        formData.set("paymentDate", paymentDate);
        if (dueDate) formData.set("dueDate", dueDate);
        formData.set("notes", notes);
        if (createLinkedExpense) formData.set("createLinkedExpense", "on");

        startTransition(async () => {
          try {
            await createDebtPayment(formData);
            resetForm();
            router.refresh();
            onSuccess?.();
          } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to record payment.");
          }
        });
      }}
      className="space-y-4"
    >
      <FormError message={formError} />

      <div className="grid gap-1.5">
        <Label>Debt account</Label>
        <SearchableSelect
          items={accountItems}
          value={debtAccountId}
          onValueChange={setDebtAccountId}
          placeholder="Select account"
          searchPlaceholder="Search accounts..."
        />
      </div>

      {/* Due date selector when account has scheduled payments */}
      {debtAccountId && hasSchedule && (
        <div className="grid gap-1.5">
          <Label>Due date</Label>
          <select
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {unpaidDates.map((d) => (
              <option key={d} value={d}>
                {new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Message when all scheduled payments are done */}
      {debtAccountId && selectedAccount && unpaidDates.length === 0 && selectedAccount.monthlyAmountMinor != null && (
        <div className="rounded-lg border border-posted/20 bg-posted/5 px-4 py-3 text-sm text-posted">
          All scheduled payments for this month have been recorded.
        </div>
      )}

      <AmountInput
        value={amount}
        onChange={setAmount}
        required
        label="Payment amount"
        id="debt-payment-amount"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CurrencySelect
          currencies={currencies}
          value={currencyCode}
          onValueChange={setCurrencyCode}
        />

        <DatePickerField
          value={paymentDate}
          onChange={setPaymentDate}
          label="Payment date"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="debt-payment-notes">Notes</Label>
        <Textarea
          id="debt-payment-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes"
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={createLinkedExpense}
          onChange={(e) => setCreateLinkedExpense(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <span>Create a linked expense record</span>
      </label>

      <Button type="submit" disabled={isPending || !debtAccountId || !amount} className="w-full sm:w-auto">
        {isPending ? "Recording..." : "Record Payment"}
      </Button>
    </form>
  );
}
