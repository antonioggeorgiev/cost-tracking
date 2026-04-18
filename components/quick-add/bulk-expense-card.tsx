"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AmountInput,
  CategorySelect,
  CurrencySelect,
  DatePickerField,
  StatusSelect,
} from "@/components/form-fields";
import type { ExpenseExtractionResult } from "@/server/services/document-extraction-service";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

export type BulkItemStatus = "pending" | "submitting" | "submitted" | "error";

type FormValues = {
  title: string;
  amount: number;
  expenseDate: string;
  status: "planned" | "pending" | "posted";
  parentCategoryId: string;
  categoryId: string;
  currencyCode: string;
  description: string;
};

export type BulkCardHandle = {
  getValues: () => FormValues;
};

type BulkExpenseCardProps = {
  item: ExpenseExtractionResult;
  status: BulkItemStatus;
  error?: string;
  baseCurrencyCode: string;
  categories: Category[];
  currencies: readonly string[];
  workspaceSlug: string;
  createCategory?: (formData: FormData) => Promise<{ id: string }>;
  onRemove: () => void;
  formRef?: (handle: BulkCardHandle) => void;
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

export function BulkExpenseCard({
  item,
  status,
  error,
  baseCurrencyCode,
  categories,
  currencies,
  workspaceSlug,
  createCategory,
  onRemove,
  formRef,
}: BulkExpenseCardProps) {
  const isDisabled = status === "submitting" || status === "submitted";

  const form = useForm({
    defaultValues: {
      title: item.title || "",
      amount: item.amount || 0,
      expenseDate: item.expenseDate || new Date().toISOString().slice(0, 10),
      status: "posted" as "planned" | "pending" | "posted",
      parentCategoryId: resolveParentCategory(item, categories),
      categoryId: resolveChildCategory(item, categories),
      currencyCode: item.currencyCode || baseCurrencyCode,
      description: item.description || "",
    },
    validators: {
      onSubmit: expenseFormSchema,
    },
  });

  // Expose form values to parent for bulk submit
  if (formRef) {
    formRef({ getValues: () => form.state.values });
  }

  const borderClass =
    status === "submitted"
      ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
      : status === "error"
        ? "border-destructive/50 bg-destructive/5"
        : "border-border";

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-colors ${borderClass}`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {status === "submitted" && <Check className="size-4 shrink-0 text-green-600" />}
          {status === "submitting" && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
          <span className="text-sm font-medium truncate">
            {form.state.values.title || "Untitled"}
          </span>
        </div>
        {status === "pending" && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Form fields — pointer-events disabled when not editable */}
      <div className={`space-y-3 ${isDisabled ? "pointer-events-none opacity-60" : ""}`}>
        <form.Field name="title">
          {(field) => (
            <div className="grid gap-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isDisabled}
                className="h-8 text-sm"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</span>
              )}
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-3">
          <form.Field name="amount">
            {(field) => (
              <AmountInput
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                currencyBadge={form.state.values.currencyCode || baseCurrencyCode}
                error={field.state.meta.errors.length > 0 ? field.state.meta.errors[0]?.message : undefined}
              />
            )}
          </form.Field>

          <form.Field name="expenseDate">
            {(field) => (
              <DatePickerField
                value={field.state.value}
                onChange={field.handleChange}
                label="Date"
              />
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <form.Field name="status">
            {(field) => (
              <StatusSelect
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as "planned" | "pending" | "posted")}
              />
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
                  workspaceSlug={workspaceSlug}
                  createCategory={createCategory}
                  parentError={parentField.state.meta.errors.length > 0 ? parentField.state.meta.errors[0]?.message : undefined}
                  categoryError={categoryField.state.meta.errors.length > 0 ? categoryField.state.meta.errors[0]?.message : undefined}
                />
              )}
            </form.Field>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div className="grid gap-1">
              <Label className="text-xs">Description</Label>
              <Input
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isDisabled}
                placeholder="Optional"
                className="h-8 text-sm"
              />
            </div>
          )}
        </form.Field>
      </div>
    </div>
  );
}

function resolveParentCategory(item: ExpenseExtractionResult, categories: Category[]): string {
  if (item.parentCategoryId && categories.some((c) => c.id === item.parentCategoryId)) {
    return item.parentCategoryId;
  }
  return "";
}

function resolveChildCategory(item: ExpenseExtractionResult, categories: Category[]): string {
  if (item.parentCategoryId && item.categoryId) {
    const parent = categories.find((c) => c.id === item.parentCategoryId);
    if (parent?.children.some((ch) => ch.id === item.categoryId)) {
      return item.categoryId!;
    }
  }
  return "";
}
