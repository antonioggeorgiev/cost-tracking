"use client";

import { useState } from "react";
import { QuickAddExpenseForm } from "@/components/quick-add/quick-add-expense-form";
import { QuickAddDebtForm } from "@/components/quick-add/quick-add-debt-form";
import { TypeSelector, type QuickAddType } from "@/components/quick-add/type-selector";
import { RecurringTemplateForm } from "@/components/recurring/recurring-template-form";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

type QuickAddPanelProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  categories: Category[];
  currencies: readonly string[];
  createExpense: (formData: FormData) => Promise<{ id: string } | { error: string }>;
  createCategory: (formData: FormData) => Promise<{ id: string }>;
  createRecurring: (formData: FormData) => Promise<{ success: true } | { error: string }>;
  createDebtAccount: (formData: FormData) => Promise<void>;
};

export function QuickAddPanel({
  workspaceSlug,
  baseCurrencyCode,
  categories,
  currencies,
  createExpense,
  createCategory,
  createRecurring,
  createDebtAccount,
}: QuickAddPanelProps) {
  const [type, setType] = useState<QuickAddType>("expense");

  return (
    <>
      <TypeSelector value={type} onChange={setType} />

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold text-heading">
            {type === "recurring" ? "New Recurring Template" : type === "debt" ? "New Debt Account" : "New Expense"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {type === "recurring"
              ? "Create fixed or variable recurring costs"
              : type === "debt"
                ? "Track a loan, personal debt, or lease"
                : "Record a new expense entry"}
          </p>
        </div>

        {type === "recurring" ? (
          <RecurringTemplateForm
            workspaceSlug={workspaceSlug}
            baseCurrencyCode={baseCurrencyCode}
            categories={categories}
            currencies={currencies}
            createRecurring={createRecurring}
            createCategory={createCategory}
            submitLabel="Create Recurring"
          />
        ) : type === "debt" ? (
          <QuickAddDebtForm
            workspaceSlug={workspaceSlug}
            baseCurrencyCode={baseCurrencyCode}
            currencies={currencies}
            createDebtAccount={createDebtAccount}
          />
        ) : (
          <QuickAddExpenseForm
            workspaceSlug={workspaceSlug}
            baseCurrencyCode={baseCurrencyCode}
            categories={categories}
            currencies={currencies}
            createExpense={createExpense}
            createCategory={createCategory}
          />
        )}
      </section>
    </>
  );
}
