"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuickAddExpenseForm } from "@/components/quick-add/quick-add-expense-form";
import { QuickAddDebtForm } from "@/components/quick-add/quick-add-debt-form";
import { TypeSelector, type QuickAddType } from "@/components/quick-add/type-selector";
import { RecurringTemplateForm } from "@/components/recurring/recurring-template-form";
import { switchSpace } from "@/app/(app)/actions";
import { Label } from "@/components/ui/label";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

type QuickAddPanelProps = {
  spaceSlug: string;
  baseCurrencyCode: string;
  categories: Category[];
  currencies: readonly string[];
  createExpense: (formData: FormData) => Promise<{ id: string } | { error: string }>;
  createCategory?: (formData: FormData) => Promise<{ id: string }>;
  createRecurring: (formData: FormData) => Promise<{ success: true } | { error: string }>;
  createDebtAccount: (formData: FormData) => Promise<void>;
  members?: Array<{ userId: string; name: string }>;
  currentUserId?: string;
  availableSpaces?: Array<{ slug: string; name: string }>;
};

export function QuickAddPanel({
  spaceSlug,
  baseCurrencyCode,
  categories,
  currencies,
  createExpense,
  createCategory,
  createRecurring,
  createDebtAccount,
  members,
  currentUserId,
  availableSpaces,
}: QuickAddPanelProps) {
  const [type, setType] = useState<QuickAddType>("expense");
  const router = useRouter();

  async function handleSpaceChange(slug: string) {
    await switchSpace(slug);
    router.refresh();
  }

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

        {/* Space selector — shown when in All Spaces mode */}
        {availableSpaces && availableSpaces.length > 1 && (
          <div className="mb-6 grid gap-1.5">
            <Label htmlFor="space-select">Space</Label>
            <select
              id="space-select"
              value={spaceSlug}
              onChange={(e) => handleSpaceChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {availableSpaces.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {type === "recurring" ? (
          <RecurringTemplateForm
            spaceSlug={spaceSlug}
            baseCurrencyCode={baseCurrencyCode}
            categories={categories}
            currencies={currencies}
            createRecurring={createRecurring}
            createCategory={createCategory}
            submitLabel="Create Recurring"
          />
        ) : type === "debt" ? (
          <QuickAddDebtForm
            spaceSlug={spaceSlug}
            baseCurrencyCode={baseCurrencyCode}
            currencies={currencies}
            createDebtAccount={createDebtAccount}
          />
        ) : (
          <QuickAddExpenseForm
            spaceSlug={spaceSlug}
            baseCurrencyCode={baseCurrencyCode}
            categories={categories}
            currencies={currencies}
            createExpense={createExpense}
            createCategory={createCategory}
            members={members}
            currentUserId={currentUserId}
          />
        )}
      </section>
    </>
  );
}
