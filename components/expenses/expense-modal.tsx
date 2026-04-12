"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ExpenseModalProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  categories: Array<{ id: string; label: string }>;
  currencies: readonly string[];
  formAction: (formData: FormData) => void;
};

export function ExpenseModal({ workspaceSlug, baseCurrencyCode, categories, currencies, formAction }: ExpenseModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("modal") === "add-expense";
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  function close() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : window.location.pathname);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) close();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-[4px] lg:items-center lg:p-4"
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-2xl lg:rounded-2xl lg:max-h-[90vh] lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-heading">Fast Add Expense</h2>
            <p className="mt-1 text-sm text-muted">Quick-add a new expense entry</p>
          </div>
          <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-secondary text-muted">
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-heading">Title</span>
            <input
              name="title"
              required
              placeholder="Tiles for bathroom"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-heading">Amount</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">&euro;</span>
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="199.99"
                className="w-full rounded-xl border border-border bg-surface pl-8 pr-20 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-primary-lighter px-2 py-0.5 text-xs font-semibold text-primary">
                {baseCurrencyCode}
              </span>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Date</span>
              <input
                name="expenseDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Status</span>
              <select
                name="status"
                defaultValue="posted"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="planned">Planned</option>
                <option value="pending">Pending</option>
                <option value="posted">Posted</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Category</span>
              <select
                name="categoryId"
                required
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-heading">Currency</span>
              <select
                name="currencyCode"
                defaultValue={baseCurrencyCode}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-heading">Description</span>
            <input
              name="description"
              placeholder="Optional short description"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-heading transition hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-br from-primary to-primary-dark py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90"
            >
              Record Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
