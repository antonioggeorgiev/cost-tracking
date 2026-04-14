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
} from "@/components/form-fields";
import { cn } from "@/lib/utils";

type QuickAddDebtFormProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  currencies: readonly string[];
  createDebtAccount: (formData: FormData) => Promise<void>;
};

const kindItems = [
  { value: DebtAccountKind.bank_loan, label: "Bank Loan" },
  { value: DebtAccountKind.personal_loan, label: "Personal" },
  { value: DebtAccountKind.leasing, label: "Leasing" },
] satisfies Array<{ value: DebtAccountKind; label: string }>;

const directionItems = [
  { value: DebtDirection.i_owe, label: "I owe" },
  { value: DebtDirection.they_owe_me, label: "They owe me" },
] satisfies Array<{ value: DebtDirection; label: string }>;

export function QuickAddDebtForm({
  workspaceSlug,
  baseCurrencyCode,
  currencies,
  createDebtAccount,
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
  const [currencyCode, setCurrencyCode] = useState(baseCurrencyCode);
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const showProvider = kind === DebtAccountKind.bank_loan || kind === DebtAccountKind.leasing;
  const showCounterparty = kind === DebtAccountKind.personal_loan;

  function resetForm() {
    setKind(DebtAccountKind.bank_loan);
    setDirection(DebtDirection.i_owe);
    setName("");
    setProvider("");
    setCounterparty("");
    setOriginalAmount(0);
    setCurrencyCode(baseCurrencyCode);
    setOpenedAt(new Date().toISOString().slice(0, 10));
    setNotes("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setFormError(null);

        const formData = new FormData();
        formData.set("workspaceSlug", workspaceSlug);
        formData.set("kind", kind);
        formData.set("direction", direction);
        formData.set("name", name);
        formData.set("originalAmount", String(originalAmount));
        formData.set("currencyCode", currencyCode);
        formData.set("openedAt", openedAt);
        formData.set("notes", notes);

        if (showProvider && provider) formData.set("provider", provider);
        if (showCounterparty && counterparty) formData.set("counterparty", counterparty);

        startTransition(async () => {
          try {
            await createDebtAccount(formData);
            resetForm();
            router.refresh();
          } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to create debt account.");
          }
        });
      }}
      className="space-y-4"
    >
      <FormError message={formError} />

      {/* Kind selector */}
      <div className="grid gap-1.5">
        <Label>Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {kindItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setKind(item.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors",
                kind === item.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                  : "border-border bg-transparent hover:border-primary/40 hover:bg-muted/40 text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Direction selector */}
      <div className="grid gap-1.5">
        <Label>Direction</Label>
        <div className="grid grid-cols-2 gap-2">
          {directionItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDirection(item.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors",
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

      <div className="grid gap-1.5">
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
        <div className="grid gap-1.5">
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
        <div className="grid gap-1.5">
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
        currencyBadge={currencyCode}
        label="Total amount"
        id="quick-debt-amount"
      />

      <div className="grid grid-cols-2 gap-4">
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
      </div>

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

      <div className="pt-2">
        <Button type="submit" disabled={isPending || !name} className="w-full" size="lg">
          {isPending ? "Creating..." : "Create Debt Account"}
        </Button>
      </div>
    </form>
  );
}
