"use client";

import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { Images, Loader2, Paperclip, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AmountInput,
  CategorySelect,
  CurrencySelect,
  DatePickerField,
  FormError,
  StatusSelect,
} from "@/components/form-fields";
import { saveAttachmentsAction } from "@/app/(app)/expenses/attachment-action";
import { BulkExpenseCard, type BulkItemStatus, type BulkCardHandle } from "@/components/quick-add/bulk-expense-card";
import type { ExpenseExtractionResult } from "@/server/services/document-extraction-service";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

type QuickAddExpenseFormProps = {
  spaceSlug: string;
  baseCurrencyCode: string;
  categories: Category[];
  currencies: readonly string[];
  createExpense: (formData: FormData) => Promise<{ id: string } | { error: string }>;
  createCategory?: (formData: FormData) => Promise<{ id: string }>;
  members?: Array<{ userId: string; name: string }>;
  currentUserId?: string;
  submitLabel?: string;
  onSuccess?: () => void;
};

const expenseFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  amount: z.number().positive("Amount must be positive"),
  expenseDate: z.string().min(1, "Date is required"),
  status: z.enum(["planned", "pending", "posted"]),
  parentCategoryId: z.string(),
  categoryId: z.string(),
  currencyCode: z.string().min(1),
  description: z.string().max(500),
});

export function QuickAddExpenseForm({
  spaceSlug,
  baseCurrencyCode,
  categories,
  currencies,
  createExpense,
  createCategory,
  members,
  currentUserId,
  submitLabel = "Add Expense",
  onSuccess,
}: QuickAddExpenseFormProps) {
  const showSplitting = members && members.length > 1;
  const [paidByUserId, setPaidByUserId] = useState(currentUserId ?? members?.[0]?.userId ?? "");
  const [splitEqually, setSplitEqually] = useState(true);
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      title: "",
      amount: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      status: "posted" as "planned" | "pending" | "posted",
      parentCategoryId: "",
      categoryId: "",
      currencyCode: baseCurrencyCode,
      description: "",
    },
    validators: {
      onSubmit: expenseFormSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError(null);

      const formData = new FormData();
      formData.set("spaceSlug", spaceSlug);
      formData.set("title", value.title);
      formData.set("amount", String(value.amount));
      formData.set("expenseDate", value.expenseDate);
      formData.set("status", value.status);
      if (value.categoryId) {
        formData.set("categoryId", value.categoryId);
      }
      formData.set("currencyCode", value.currencyCode);
      formData.set("description", value.description ?? "");

      if (showSplitting && paidByUserId) {
        formData.set("paidByUserId", paidByUserId);
      }
      if (showSplitting && splitEqually) {
        formData.set("splitEqually", "on");
      }

      startTransition(async () => {
        const result = await createExpense(formData);

        if ("error" in result) {
          setFormError(result.error);
          return;
        }

        // Upload file to Vercel Blob via API route
        if (file) {
          const body = new FormData();
          body.set("file", file);
          const res = await fetch("/api/upload", { method: "POST", body });
          const attachment = await res.json() as { url: string; fileName: string; fileSize: number; contentType: string };
          await saveAttachmentsAction(result.id, [attachment]);
        }

        form.reset();

        setFile(null);
        router.refresh();
        onSuccess?.();
      });
    },
  });

  const selectedParentId = useStore(form.store, (state) => state.values.parentCategoryId);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Bulk scan state
  type BulkItem = {
    id: string;
    data: ExpenseExtractionResult;
    status: BulkItemStatus;
    error?: string;
  };
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [isBulkScanning, setIsBulkScanning] = useState(false);
  const [bulkScanError, setBulkScanError] = useState<string | null>(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const bulkFormRefs = useRef<Map<string, BulkCardHandle>>(new Map());

  const isBulkMode = bulkItems.length > 0;

  async function handleBulkScan(scannedFile: File) {
    setIsBulkScanning(true);
    setBulkScanError(null);
    try {
      const body = new FormData();
      body.set("file", scannedFile);
      body.set("spaceSlug", spaceSlug);
      const res = await fetch("/api/scan-bulk", { method: "POST", body });
      const result = await res.json();

      if (result.error) {
        setBulkScanError(result.error);
        return;
      }

      if (!result.expenses || result.expenses.length === 0) {
        setBulkScanError("No transactions found in the screenshot.");
        return;
      }

      setBulkItems(
        result.expenses.map((expense: ExpenseExtractionResult, i: number) => ({
          id: `bulk-${Date.now()}-${i}`,
          data: expense,
          status: "pending" as const,
        })),
      );
    } catch {
      setBulkScanError("Failed to scan screenshot. Please try again.");
    } finally {
      setIsBulkScanning(false);
    }
  }

  function removeBulkItem(id: string) {
    setBulkItems((prev) => prev.filter((item) => item.id !== id));
    bulkFormRefs.current.delete(id);
  }

  const handleSubmitAll = useCallback(async () => {
    setIsSubmittingAll(true);
    const pending = bulkItems.filter((item) => item.status === "pending");

    for (const item of pending) {
      const formHelpers = bulkFormRefs.current.get(item.id);
      if (!formHelpers) continue;

      setBulkItems((prev) =>
        prev.map((bi) => (bi.id === item.id ? { ...bi, status: "submitting" as const } : bi)),
      );

      try {
        const values = formHelpers.getValues();
        const formData = new FormData();
        formData.set("spaceSlug", spaceSlug);
        formData.set("title", String(values.title));
        formData.set("amount", String(values.amount));
        formData.set("expenseDate", String(values.expenseDate));
        formData.set("status", String(values.status));
        if (values.categoryId) formData.set("categoryId", String(values.categoryId));
        formData.set("currencyCode", String(values.currencyCode));
        formData.set("description", String(values.description ?? ""));

        const result = await createExpense(formData);

        if ("error" in result) {
          setBulkItems((prev) =>
            prev.map((bi) =>
              bi.id === item.id ? { ...bi, status: "error" as const, error: result.error } : bi,
            ),
          );
        } else {
          setBulkItems((prev) =>
            prev.map((bi) => (bi.id === item.id ? { ...bi, status: "submitted" as const } : bi)),
          );
        }
      } catch {
        setBulkItems((prev) =>
          prev.map((bi) =>
            bi.id === item.id ? { ...bi, status: "error" as const, error: "Failed to create expense" } : bi,
          ),
        );
      }
    }

    setIsSubmittingAll(false);
    router.refresh();
    onSuccess?.();
  }, [bulkItems, createExpense, spaceSlug, router, onSuccess]);

  async function handleReceiptScan(scannedFile: File) {
    setIsScanning(true);
    setFormError(null);
    try {
      const body = new FormData();
      body.set("file", scannedFile);
      body.set("spaceSlug", spaceSlug);
      const res = await fetch("/api/scan-receipt", { method: "POST", body });
      const result = await res.json();

      if (result.error) {
        setFormError(result.error);
        return;
      }

      // Reset form for a fresh expense from the scan
      form.reset();

      if (result.title) form.setFieldValue("title", result.title);
      if (result.description) form.setFieldValue("description", result.description);
      if (result.amount) form.setFieldValue("amount", result.amount);
      if (result.currencyCode) form.setFieldValue("currencyCode", result.currencyCode);
      if (result.expenseDate) form.setFieldValue("expenseDate", result.expenseDate);

      if (result.parentCategoryId && categories.some((c) => c.id === result.parentCategoryId)) {
        form.setFieldValue("parentCategoryId", result.parentCategoryId);

        if (result.categoryId) {
          const parent = categories.find((c) => c.id === result.parentCategoryId);
          if (parent?.children.some((ch) => ch.id === result.categoryId)) {
            form.setFieldValue("categoryId", result.categoryId);
          }
        }
      }

      // Replace any existing file with the scanned receipt
      setFile(scannedFile);
    } catch {
      setFormError("Failed to scan receipt. Please try again or fill in manually.");
    } finally {
      setIsScanning(false);
    }
  }

  // Bulk mode UI
  if (isBulkMode) {
    const pendingCount = bulkItems.filter((i) => i.status === "pending").length;
    const submittedCount = bulkItems.filter((i) => i.status === "submitted").length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {submittedCount > 0
              ? `${submittedCount} of ${bulkItems.length} submitted`
              : `${bulkItems.length} transactions found`}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setBulkItems([]);
              bulkFormRefs.current.clear();
            }}
            disabled={isSubmittingAll}
          >
            <X className="size-3.5" />
            Clear All
          </Button>
        </div>

        <div className="space-y-3">
          {bulkItems.map((item) => (
            <BulkExpenseCard
              key={item.id}
              item={item.data}
              status={item.status}
              error={item.error}
              baseCurrencyCode={baseCurrencyCode}
              categories={categories}
              currencies={currencies}
              spaceSlug={spaceSlug}
              createCategory={createCategory}
              onRemove={() => removeBulkItem(item.id)}
              formRef={(handle) => {
                bulkFormRefs.current.set(item.id, handle);
              }}
            />
          ))}
        </div>

        {pendingCount > 0 && (
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleSubmitAll}
              disabled={isSubmittingAll}
              className="w-full"
              size="lg"
            >
              {isSubmittingAll ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                `Submit All (${pendingCount})`
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Receipt scan buttons */}
      <div className="grid grid-cols-2 gap-2">
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleReceiptScan(file);
            e.target.value = "";
          }}
        />
        <input
          ref={bulkInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleBulkScan(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isScanning || isBulkScanning || isPending}
          onClick={() => receiptInputRef.current?.click()}
          className="h-12 border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10"
        >
          {isScanning ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <ScanLine className="size-5" />
              Scan Receipt
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isScanning || isBulkScanning || isPending}
          onClick={() => bulkInputRef.current?.click()}
          className="h-12 border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10"
        >
          {isBulkScanning ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Images className="size-5" />
              Scan Multiple
            </>
          )}
        </Button>
      </div>

      <FormError message={formError} />
      <FormError message={bulkScanError} />

      <form.Field name="title">
        {(field) => (
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              required
              placeholder="Tiles for bathroom"
            />
            {field.state.meta.errors.length > 0 && (
              <span className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="amount">
        {(field) => (
          <AmountInput
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            currencyBadge={baseCurrencyCode}
            required
            error={field.state.meta.errors.length > 0 ? field.state.meta.errors[0]?.message : undefined}
          />
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="expenseDate">
          {(field) => (
            <DatePickerField
              value={field.state.value}
              onChange={field.handleChange}
              label="Date"
            />
          )}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <StatusSelect
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val as "planned" | "pending" | "posted")}
            />
          )}
        </form.Field>
      </div>

      <form.Field name="parentCategoryId">
        {(parentField) => (
          <form.Field name="categoryId">
            {(categoryField) => (
              <CategorySelect
                categories={categories}
                parentCategoryId={parentField.state.value}
                onParentChange={parentField.handleChange}
                categoryId={categoryField.state.value}
                onCategoryChange={categoryField.handleChange}
                spaceSlug={spaceSlug}
                createCategory={createCategory}
                parentError={parentField.state.meta.errors.length > 0 ? parentField.state.meta.errors[0]?.message : undefined}
                categoryError={categoryField.state.meta.errors.length > 0 ? categoryField.state.meta.errors[0]?.message : undefined}
              />
            )}
          </form.Field>
        )}
      </form.Field>

      <form.Field name="currencyCode">
        {(field) => (
          <CurrencySelect
            currencies={currencies}
            value={field.state.value}
            onValueChange={field.handleChange}
          />
        )}
      </form.Field>

      {showSplitting && (
        <div className="grid gap-1.5">
          <Label htmlFor="paidByUserId">Paid by</Label>
          <select
            id="paidByUserId"
            value={paidByUserId}
            onChange={(e) => setPaidByUserId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {showSplitting && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={splitEqually}
            onChange={(e) => setSplitEqually(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-body">Split equally among all members</span>
        </label>
      )}

      <form.Field name="description">
        {(field) => (
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={field.state.value ?? ""}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Optional short description"
            />
          </div>
        )}
      </form.Field>

      {/* File attachment */}
      <div className="grid gap-1.5">
        <Label>Attachment</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) setFile(selected);
            e.target.value = "";
          }}
        />
        {file ? (
          <div className="flex items-center justify-between rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-foreground">{file.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setFile(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-dashed"
          >
            <Paperclip className="size-4" />
            Attach file
          </Button>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full" size="lg">
          {isPending ? "Adding..." : submitLabel}
        </Button>
      </div>

    </form>
    </>
  );
}
