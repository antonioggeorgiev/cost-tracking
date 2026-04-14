"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { RecurringTemplateKind } from "@/generated/prisma/enums";
import { Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AmountInput,
  CategorySelect,
  CurrencySelect,
  DatePickerField,
  FormError,
  StatusSelect,
} from "@/components/form-fields";
import { cn } from "@/lib/utils";
import { type FrequencyOption, deriveScheduleFields } from "@/lib/schedule-utils";
import { FormSection } from "@/components/form-fields/form-section";
import { SchedulePicker } from "@/components/form-fields/schedule-picker";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

type RecurringTemplateFormProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  categories: Category[];
  currencies: readonly string[];
  createRecurring: (formData: FormData) => Promise<{ success: true } | { error: string }>;
  createCategory: (formData: FormData) => Promise<{ id: string }>;
  submitLabel?: string;
  onSuccess?: () => void;
};

const kindItems = [
  { value: RecurringTemplateKind.fixed_amount, label: "Same every time", description: "e.g. Netflix, rent" },
  { value: RecurringTemplateKind.variable_amount, label: "Changes each time", description: "e.g. electricity, water" },
] satisfies Array<{ value: RecurringTemplateKind; label: string; description: string }>;

export function RecurringTemplateForm({
  workspaceSlug,
  baseCurrencyCode,
  categories,
  currencies,
  createRecurring,
  createCategory,
  submitLabel = "Create Template",
  onSuccess,
}: RecurringTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [kind, setKind] = useState<RecurringTemplateKind>(RecurringTemplateKind.fixed_amount);
  const [title, setTitle] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(0);
  const [currencyCode, setCurrencyCode] = useState(baseCurrencyCode);
  const [selectedDays, setSelectedDays] = useState<Date[]>([new Date()]);
  const [frequency, setFrequency] = useState<FrequencyOption>("monthly");
  const [interval, setInterval] = useState("1");
  const [endDate, setEndDate] = useState("");
  const [defaultStatus, setDefaultStatus] = useState("posted");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  async function handleDocumentScan(scannedFile: File) {
    setIsScanning(true);
    setFormError(null);
    try {
      const body = new FormData();
      body.set("file", scannedFile);
      body.set("workspaceSlug", workspaceSlug);
      const res = await fetch("/api/scan-recurring", { method: "POST", body });
      const result = await res.json();

      if (result.error) {
        setFormError(result.error);
        return;
      }

      if (result.title) setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.currencyCode) setCurrencyCode(result.currencyCode);
      if (result.kind) setKind(result.kind as RecurringTemplateKind);
      if (result.amount != null) setAmount(result.amount);
      if (result.frequency) setFrequency(result.frequency as FrequencyOption);

      if (result.parentCategoryId && categories.some((c) => c.id === result.parentCategoryId)) {
        setParentCategoryId(result.parentCategoryId);
        if (result.categoryId) {
          const parent = categories.find((c) => c.id === result.parentCategoryId);
          if (parent?.children.some((ch) => ch.id === result.categoryId)) {
            setCategoryId(result.categoryId);
          }
        }
      }
    } catch {
      setFormError("Failed to scan document. Please try again or fill in manually.");
    } finally {
      setIsScanning(false);
    }
  }

  function resetForm() {
    setKind(RecurringTemplateKind.fixed_amount);
    setTitle("");
    setParentCategoryId("");
    setCategoryId("");
    setAmount(0);
    setCurrencyCode(baseCurrencyCode);
    setSelectedDays([new Date()]);
    setFrequency("monthly");
    setInterval("1");
    setEndDate("");
    setDefaultStatus("posted");
    setPaymentUrl("");
    setDescription("");
    setNotes("");
  }

  // Send the most specific category: subcategory if selected, otherwise parent
  const effectiveCategoryId = categoryId || parentCategoryId;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setFormError(null);

        if (selectedDays.length === 0) {
          setFormError("Select at least one day on the calendar.");
          return;
        }

        const schedule = deriveScheduleFields(
          selectedDays,
          frequency,
          Number(interval) || 1,
        );

        const formData = new FormData();
        formData.set("workspaceSlug", workspaceSlug);
        formData.set("kind", kind);
        formData.set("title", title);
        formData.set("categoryId", effectiveCategoryId);
        if (kind === RecurringTemplateKind.fixed_amount && amount) {
          formData.set("amount", String(amount));
        }
        formData.set("currencyCode", currencyCode);
        formData.set("startDate", schedule.startDate);
        if (endDate) {
          formData.set("endDate", endDate);
        }
        formData.set("frequency", schedule.frequency);
        formData.set("interval", String(schedule.interval));
        formData.set("anchorDays", JSON.stringify(schedule.anchorDays));
        formData.set("defaultStatus", defaultStatus);
        formData.set("paymentUrl", paymentUrl);
        formData.set("description", description);
        formData.set("notes", notes);

        startTransition(async () => {
          const result = await createRecurring(formData);
          if ("error" in result) {
            setFormError(result.error);
            return;
          }

          resetForm();
          router.refresh();
          onSuccess?.();
        });
      }}
      className="space-y-6"
    >
      {/* Document scan */}
      <div className="grid gap-1.5">
        <input
          ref={scanInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleDocumentScan(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isScanning || isPending}
          onClick={() => scanInputRef.current?.click()}
          className="h-12 w-full border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10"
        >
          {isScanning ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Scanning document...
            </>
          ) : (
            <>
              <ScanLine className="size-5" />
              Scan Bill / Subscription
            </>
          )}
        </Button>
      </div>

      <FormError message={formError} />

      {/* Template type toggle */}
      <div className="grid gap-1.5">
        <Label>Template type</Label>
        <div className="grid grid-cols-2 gap-2">
          {kindItems.map((item) => (
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

      {/* ── Details ── */}
      <FormSection legend="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="recurring-title">Title</Label>
            <Input id="recurring-title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Internet bill" />
          </div>

          <div className="sm:col-span-2">
            <CategorySelect
              categories={categories}
              parentCategoryId={parentCategoryId}
              onParentChange={setParentCategoryId}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              workspaceSlug={workspaceSlug}
              createCategory={createCategory}
            />
          </div>

          <CurrencySelect
            currencies={currencies}
            value={currencyCode}
            onValueChange={setCurrencyCode}
          />

          <AmountInput
            value={amount}
            onChange={setAmount}
            required={kind === RecurringTemplateKind.fixed_amount}
            disabled={kind === RecurringTemplateKind.variable_amount}
            placeholder={kind === RecurringTemplateKind.variable_amount ? "Set when due" : "0.00"}
          />

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="recurring-payment-url">Payment link</Label>
            <Input id="recurring-payment-url" type="url" value={paymentUrl} onChange={(e) => setPaymentUrl(e.target.value)} placeholder="https://provider.example/pay" />
          </div>

          <StatusSelect
            value={defaultStatus}
            onValueChange={setDefaultStatus}
            label="Status for created expenses"
          />

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="recurring-description">Description</Label>
            <Input id="recurring-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional short description" />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="recurring-notes">Notes</Label>
            <Textarea id="recurring-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional notes" />
          </div>
        </div>
      </FormSection>

      {/* ── Schedule ── */}
      <FormSection legend="Schedule">
        <SchedulePicker
          selectedDays={selectedDays}
          onSelectedDaysChange={setSelectedDays}
          frequency={frequency}
          onFrequencyChange={setFrequency}
          interval={interval}
          onIntervalChange={setInterval}
        />

        <DatePickerField
          value={endDate}
          onChange={setEndDate}
          label="Ends on"
          hint="Leave empty for an infinite schedule."
        />
      </FormSection>

      <Button type="submit" disabled={isPending || !effectiveCategoryId || selectedDays.length === 0} className="w-full sm:w-auto">
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
