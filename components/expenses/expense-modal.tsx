"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { QuickAddExpenseForm } from "@/components/quick-add/quick-add-expense-form";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

type ExpenseModalProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  categories: Category[];
  currencies: readonly string[];
  createExpense: (formData: FormData) => Promise<{ id: string } | { error: string }>;
  createCategory?: (formData: FormData) => Promise<{ id: string }>;
};

export function ExpenseModal({ workspaceSlug, baseCurrencyCode, categories, currencies, createExpense, createCategory }: ExpenseModalProps) {
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
      <div className="w-full max-w-2xl rounded-t-3xl bg-surface p-6 shadow-2xl lg:rounded-2xl lg:max-h-[90vh] lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-heading">Add Expense</h2>
            <p className="mt-1 text-sm text-body">Record a new expense entry</p>
          </div>
          <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-secondary text-body">
            <X size={20} />
          </button>
        </div>

        <QuickAddExpenseForm
          workspaceSlug={workspaceSlug}
          baseCurrencyCode={baseCurrencyCode}
          categories={categories}
          currencies={currencies}
          createExpense={createExpense}
          createCategory={createCategory}
          submitLabel="Record Expense"
          onSuccess={close}
        />
      </div>
    </div>
  );
}
