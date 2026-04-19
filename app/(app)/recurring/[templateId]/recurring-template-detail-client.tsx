"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, CalendarIcon, ExternalLink, Pause, Play, Pencil, RefreshCw } from "lucide-react";
import { RecurringTemplateEditForm } from "@/components/recurring/recurring-template-edit-form";
import { RecurringTemplateScheduleCard } from "@/components/recurring/recurring-template-schedule-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  toCategorySelectItems,
  toSubcategorySelectItems,
  type CategoryTreeNode,
} from "@/lib/category-tree";
import { formatShortDateTime } from "@/lib/format-date";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";
import { updateRecurringTemplateAction, toggleRecurringTemplateAction } from "../actions";

type TemplateData = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  notes: string | null;
  originalAmountMinor: number | null;
  originalCurrencyCode: string;
  workspaceAmountMinor: number | null;
  workspaceCurrencyCode: string;
  frequency: string;
  interval: number;
  anchorDays: number[];
  startDate: string;
  endDate: string | null;
  nextOccurrenceDate: string;
  lastGeneratedAt: string | null;
  defaultStatus: string;
  paymentUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  parentCategoryId: string | null;
  categoryPath: string;
  createdByLabel: string;
  createdAt: string;
  updatedAt: string;
};

type GeneratedExpense = {
  id: string;
  title: string;
  expenseDate: string;
  originalAmountMinor: number;
  originalCurrencyCode: string;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  status: string;
};

type RecurringTemplateDetailClientProps = {
  spaceSlug: string;
  template: TemplateData;
  generatedExpenses: GeneratedExpense[];
  categories: CategoryTreeNode[];
  currencies: readonly string[];
  baseCurrencyCode: string;
  canManage: boolean;
};

export function RecurringTemplateDetailClient({
  spaceSlug,
  template,
  generatedExpenses,
  categories,
  currencies,
  baseCurrencyCode,
  canManage,
}: RecurringTemplateDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [endDateCalendarOpen, setEndDateCalendarOpen] = useState(false);

  // Edit form state
  const [title, setTitle] = useState(template.title);
  const [amount, setAmount] = useState<number | "">(template.originalAmountMinor != null ? template.originalAmountMinor / 100 : "");
  const [currencyCode, setCurrencyCode] = useState(template.originalCurrencyCode);
  const [parentCategoryId, setParentCategoryId] = useState(template.parentCategoryId ?? "");
  const [categoryId, setCategoryId] = useState(template.categoryId ?? "");
  const [defaultStatus, setDefaultStatus] = useState(template.defaultStatus);
  const [paymentUrl, setPaymentUrl] = useState(template.paymentUrl ?? "");
  const [description, setDescription] = useState(template.description ?? "");
  const [notes, setNotes] = useState(template.notes ?? "");
  const [endDate, setEndDate] = useState(template.endDate ?? "");

  const categoryItems = toCategorySelectItems(categories);
  const subcategoryItems = toSubcategorySelectItems(categories, parentCategoryId);
  const currencyItems = currencies.map((c) => ({ value: c, label: c }));

  const isFixed = template.kind === "fixed_amount";

  function resetForm() {
    setTitle(template.title);
    setAmount(template.originalAmountMinor != null ? template.originalAmountMinor / 100 : "");
    setCurrencyCode(template.originalCurrencyCode);
    setParentCategoryId(template.parentCategoryId ?? "");
    setCategoryId(template.categoryId ?? "");
    setDefaultStatus(template.defaultStatus);
    setPaymentUrl(template.paymentUrl ?? "");
    setDescription(template.description ?? "");
    setNotes(template.notes ?? "");
    setEndDate(template.endDate ?? "");
    setFormError(null);
  }

  function handleCancel() {
    resetForm();
    setIsEditing(false);
  }

  function handleSave() {
    setFormError(null);
    const formData = new FormData();
    formData.set("spaceSlug", spaceSlug);
    formData.set("templateId", template.id);
    formData.set("title", title);
    formData.set("currencyCode", currencyCode);
    formData.set("categoryId", categoryId || "");
    formData.set("defaultStatus", defaultStatus);
    formData.set("description", description);
    formData.set("notes", notes);
    formData.set("endDate", endDate || "");
    if (paymentUrl) formData.set("paymentUrl", paymentUrl);
    if (isFixed && amount !== "") formData.set("amount", String(amount));

    startTransition(async () => {
      const result = await updateRecurringTemplateAction(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleToggleActive() {
    const formData = new FormData();
    formData.set("spaceSlug", spaceSlug);
    formData.set("templateId", template.id);
    formData.set("isActive", String(!template.isActive));

    startTransition(async () => {
      const result = await toggleRecurringTemplateAction(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const endDateValue = endDate ? new Date(endDate + "T00:00:00") : undefined;

  return (
    <div className="space-y-6">
      {/* Back link + actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-heading"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        {canManage && !isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={isPending}>
              {template.isActive ? <Pause size={14} data-icon="inline-start" /> : <Play size={14} data-icon="inline-start" />}
              {template.isActive ? "Pause" : "Resume"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil size={14} data-icon="inline-start" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {formError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      {/* Main content card */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="px-6 py-5">
          {isEditing ? (
            /* ---------- EDIT MODE ---------- */
              <RecurringTemplateEditForm
                title={title}
                amount={amount}
                currencyCode={currencyCode}
                parentCategoryId={parentCategoryId}
                categoryId={categoryId}
                defaultStatus={defaultStatus}
                endDate={endDate}
                paymentUrl={paymentUrl}
                description={description}
                notes={notes}
                isFixed={isFixed}
                endDateCalendarOpen={endDateCalendarOpen}
                endDateValue={endDateValue}
                categoryItems={categoryItems}
                subcategoryItems={subcategoryItems}
                currencyItems={currencyItems}
                isPending={isPending}
                onTitleChange={setTitle}
                onAmountChange={setAmount}
                onCurrencyCodeChange={setCurrencyCode}
                onParentCategoryChange={setParentCategoryId}
                onCategoryChange={setCategoryId}
                onDefaultStatusChange={setDefaultStatus}
                onEndDateChange={setEndDate}
                onPaymentUrlChange={setPaymentUrl}
                onDescriptionChange={setDescription}
                onNotesChange={setNotes}
                onEndDateCalendarOpenChange={setEndDateCalendarOpen}
                onSave={handleSave}
                onCancel={handleCancel}
              />
          ) : (
            /* ---------- VIEW MODE ---------- */
            <div className="space-y-5">
              {/* Title + badges */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h1 className="font-heading text-xl font-bold text-heading">{template.title}</h1>
                    {template.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {isFixed ? "Fixed" : "Variable"}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${template.isActive ? "bg-posted-bg text-posted" : "bg-surface-secondary text-muted"}`}>
                    {template.isActive ? "Active" : "Paused"}
                  </span>
                </div>
              </div>

              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Amount</p>
                  <p className="mt-1 text-lg font-semibold text-heading">
                    {template.workspaceAmountMinor != null
                      ? formatMoney(template.workspaceAmountMinor, template.workspaceCurrencyCode)
                      : "Set when due"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Category</p>
                  <p className="mt-1 font-medium text-heading">{template.categoryPath}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Default Status</p>
                  <div className="mt-1">
                    <StatusBadge status={template.defaultStatus} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Created by</p>
                  <p className="mt-1 font-medium text-heading">{template.createdByLabel}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last updated</p>
                  <p className="mt-1 font-medium text-heading">
                    {formatShortDateTime(template.updatedAt)}
                  </p>
                </div>

                {template.paymentUrl && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Payment Link</p>
                    <a href={template.paymentUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      Open link
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Notes */}
              {template.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-body">{template.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <RecurringTemplateScheduleCard template={template} generatedExpenses={generatedExpenses} />
    </div>
  );
}
