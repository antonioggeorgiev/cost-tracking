"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type QuickAddExpenseFormProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  categories: Array<{ id: string; label: string }>;
  currencies: readonly string[];
  formAction: (formData: FormData) => Promise<void>;
};

const expenseFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  amount: z.number().positive("Amount must be positive"),
  expenseDate: z.string().min(1, "Date is required"),
  status: z.enum(["planned", "pending", "posted"]),
  categoryId: z.string().min(1, "Category is required"),
  currencyCode: z.string().min(1),
  description: z.string().max(500),
});

export function QuickAddExpenseForm({
  workspaceSlug,
  baseCurrencyCode,
  categories,
  currencies,
  formAction,
}: QuickAddExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      title: "",
      amount: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      status: "posted",
      categoryId: "",
      currencyCode: baseCurrencyCode,
      description: "",
    },
    validators: {
      onSubmit: expenseFormSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.set("workspaceSlug", workspaceSlug);
      formData.set("title", value.title);
      formData.set("amount", String(value.amount));
      formData.set("expenseDate", value.expenseDate);
      formData.set("status", value.status);
      formData.set("categoryId", value.categoryId);
      formData.set("currencyCode", value.currencyCode);
      formData.set("description", value.description ?? "");
      formData.set("redirectOnError", `/workspaces/${workspaceSlug}`);

      startTransition(async () => {
        await formAction(formData);
        form.reset();
        router.refresh();
      });
    },
  });

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field name="title">
        {(field) => (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-heading">Title</span>
            <input
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              required
              placeholder="Tiles for bathroom"
              className={inputClass}
            />
            {field.state.meta.errors.length > 0 && (
              <span className="text-xs text-danger">{field.state.meta.errors[0]?.message}</span>
            )}
          </label>
        )}
      </form.Field>

      <form.Field name="amount">
        {(field) => (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-heading">Amount</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">&euro;</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={field.state.value || ""}
                onChange={(e) => field.handleChange(e.target.valueAsNumber || 0)}
                onBlur={field.handleBlur}
                required
                placeholder="199.99"
                className="w-full rounded-xl border border-border bg-surface pl-8 pr-20 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-primary-lighter px-2 py-0.5 text-xs font-semibold text-primary">
                {baseCurrencyCode}
              </span>
            </div>
            {field.state.meta.errors.length > 0 && (
              <span className="text-xs text-danger">{field.state.meta.errors[0]?.message}</span>
            )}
          </label>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="expenseDate">
          {(field) => (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Date</span>
              <input
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                required
                className={inputClass}
              />
            </label>
          )}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Status</span>
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as "planned" | "pending" | "posted")}
                onBlur={field.handleBlur}
                className={inputClass}
              >
                <option value="planned">Planned</option>
                <option value="pending">Pending</option>
                <option value="posted">Posted</option>
              </select>
            </label>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="categoryId">
          {(field) => (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Category</span>
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                required
                className={inputClass}
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              {field.state.meta.errors.length > 0 && (
                <span className="text-xs text-danger">{field.state.meta.errors[0]?.message}</span>
              )}
            </label>
          )}
        </form.Field>

        <form.Field name="currencyCode">
          {(field) => (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Currency</span>
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
        </form.Field>
      </div>

      <form.Field name="description">
        {(field) => (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-heading">Description</span>
            <input
              value={field.state.value ?? ""}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Optional short description"
              className={inputClass}
            />
          </label>
        )}
      </form.Field>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-gradient-to-br from-primary to-primary-dark py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
