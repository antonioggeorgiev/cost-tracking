"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { SearchableSelect, type SearchableSelectItem } from "@/components/ui/searchable-select";
import {
  formatExpensePeriodLabel,
  getExpenseMonthRange,
} from "@/lib/expense-filters";

type ExpenseFiltersProps = {
  categories: SearchableSelectItem[];
};

const statusOptions: SearchableSelectItem[] = [
  { value: "all", label: "All statuses" },
  { value: "posted", label: "Posted" },
  { value: "pending", label: "Pending" },
  { value: "planned", label: "Planned" },
  { value: "cancelled", label: "Cancelled" },
];

export function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showCustomRange, setShowCustomRange] = useState(false);

  const now = new Date();
  const thisMonth = getExpenseMonthRange(now.getFullYear(), now.getMonth());

  const currentStatus = searchParams.get("status") ?? "all";
  const currentCategoryId = searchParams.get("categoryId") ?? "all";
  const currentDateFrom = searchParams.get("dateFrom") ?? thisMonth.dateFrom;
  const currentDateTo = searchParams.get("dateTo") ?? thisMonth.dateTo;

  // Determine if period is "all time" (no date params and user explicitly cleared them)
  const isAllTime = searchParams.get("period") === "all";

  function navigate(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  const categoryItems: SearchableSelectItem[] = [
    { value: "all", label: "All categories" },
    ...categories,
  ];

  // Current month being viewed
  const currentMonthDate = isAllTime ? null : new Date(`${currentDateFrom}T00:00:00`);

  function goToPrevMonth() {
    if (!currentMonthDate) return;
    const prev = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
    const range = getExpenseMonthRange(prev.getFullYear(), prev.getMonth());
    navigate({ dateFrom: range.dateFrom, dateTo: range.dateTo, period: undefined });
    setShowCustomRange(false);
  }

  function goToNextMonth() {
    if (!currentMonthDate) return;
    const next = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
    const range = getExpenseMonthRange(next.getFullYear(), next.getMonth());
    navigate({ dateFrom: range.dateFrom, dateTo: range.dateTo, period: undefined });
    setShowCustomRange(false);
  }

  function goToThisMonth() {
    const currentMonth = getExpenseMonthRange(now.getFullYear(), now.getMonth());
    navigate({ dateFrom: currentMonth.dateFrom, dateTo: currentMonth.dateTo, period: undefined });
    setShowCustomRange(false);
  }

  function goToAllTime() {
    navigate({ dateFrom: undefined, dateTo: undefined, period: "all" });
    setShowCustomRange(false);
  }

  const periodLabel = isAllTime
    ? "All Time"
    : formatExpensePeriodLabel(currentDateFrom, currentDateTo);

  const isCurrentMonth =
    !isAllTime &&
    currentDateFrom === thisMonth.dateFrom &&
    currentDateTo === thisMonth.dateTo;

  const hasNonPeriodFilters = currentStatus !== "all" || currentCategoryId !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Period navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPrevMonth}
            disabled={isAllTime}
            className="flex size-9 items-center justify-center rounded-lg border border-input text-heading transition hover:bg-surface-secondary disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[160px] text-center text-sm font-medium text-heading">
            {periodLabel}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            disabled={isAllTime}
            className="flex size-9 items-center justify-center rounded-lg border border-input text-heading transition hover:bg-surface-secondary disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Period quick actions */}
        <div className="flex items-center gap-1.5">
          {!isCurrentMonth && !isAllTime && (
            <button
              type="button"
              onClick={goToThisMonth}
              className="rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-heading transition hover:bg-surface-secondary"
            >
              This Month
            </button>
          )}
          {!isAllTime && (
            <button
              type="button"
              onClick={goToAllTime}
              className="rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-heading transition hover:bg-surface-secondary"
            >
              All Time
            </button>
          )}
          {isAllTime && (
            <button
              type="button"
              onClick={goToThisMonth}
              className="rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-heading transition hover:bg-surface-secondary"
            >
              This Month
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCustomRange(!showCustomRange)}
            className={`flex items-center gap-1 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium transition hover:bg-surface-secondary ${showCustomRange ? "bg-surface-secondary text-heading" : "text-heading"}`}
          >
            <Calendar size={12} />
            Custom
          </button>
        </div>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-border sm:block" />

        {/* Status filter */}
        <div className="w-[160px]">
          <SearchableSelect
            items={statusOptions}
            value={currentStatus}
            onValueChange={(value) => navigate({ status: value })}
            placeholder="Status"
            searchPlaceholder="Search status..."
          />
        </div>

        {/* Category filter */}
        <div className="w-[220px]">
          <SearchableSelect
            items={categoryItems}
            value={currentCategoryId}
            onValueChange={(value) => navigate({ categoryId: value })}
            placeholder="Category"
            searchPlaceholder="Search categories..."
          />
        </div>

        {hasNonPeriodFilters && (
          <button
            type="button"
            onClick={() => navigate({ status: undefined, categoryId: undefined })}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-surface-secondary hover:text-heading"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>

      {/* Custom date range inputs */}
      {showCustomRange && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={isAllTime ? "" : currentDateFrom}
            onChange={(e) => {
              if (e.target.value) {
                navigate({ dateFrom: e.target.value, period: undefined });
              }
            }}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-heading outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={isAllTime ? "" : currentDateTo}
            onChange={(e) => {
              if (e.target.value) {
                navigate({ dateTo: e.target.value, period: undefined });
              }
            }}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-heading outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      )}

      {/* Active filter tags */}
      {hasNonPeriodFilters && (
        <div className="flex flex-wrap gap-2">
          {currentStatus !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-heading">
              Status: {statusOptions.find((s) => s.value === currentStatus)?.label}
              <button
                type="button"
                onClick={() => navigate({ status: undefined })}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-surface-hover hover:text-heading"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {currentCategoryId !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-heading">
              Category: {categories.find((c) => c.value === currentCategoryId)?.label ?? currentCategoryId}
              <button
                type="button"
                onClick={() => navigate({ categoryId: undefined })}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-surface-hover hover:text-heading"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
