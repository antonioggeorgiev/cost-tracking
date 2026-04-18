"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, ExternalLink, Pause, Play, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { updateRecurringTemplateAction, toggleRecurringTemplateAction } from "../actions";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

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
  workspaceSlug: string;
  template: TemplateData;
  generatedExpenses: GeneratedExpense[];
  categories: Category[];
  currencies: readonly string[];
  baseCurrencyCode: string;
  canManage: boolean;
};

const statusItems = [
  { value: "planned", label: "Planned" },
  { value: "pending", label: "Pending" },
  { value: "posted", label: "Posted" },
  { value: "cancelled", label: "Cancelled" },
];

export function RecurringTemplateDetailClient({
  workspaceSlug,
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
  const [amount, setAmount] = useState(template.originalAmountMinor != null ? template.originalAmountMinor / 100 : "");
  const [currencyCode, setCurrencyCode] = useState(template.originalCurrencyCode);
  const [parentCategoryId, setParentCategoryId] = useState(template.parentCategoryId ?? "");
  const [categoryId, setCategoryId] = useState(template.categoryId ?? "");
  const [defaultStatus, setDefaultStatus] = useState(template.defaultStatus);
  const [paymentUrl, setPaymentUrl] = useState(template.paymentUrl ?? "");
  const [description, setDescription] = useState(template.description ?? "");
  const [notes, setNotes] = useState(template.notes ?? "");
  const [endDate, setEndDate] = useState(template.endDate ?? "");

  const selectedParent = categories.find((c) => c.id === parentCategoryId);
  const childCategories = selectedParent?.children ?? [];
  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const subcategoryItems = childCategories.map((c) => ({ value: c.id, label: c.name }));
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
    formData.set("workspaceSlug", workspaceSlug);
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
    formData.set("workspaceSlug", workspaceSlug);
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
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : e.target.valueAsNumber || 0)}
                    disabled={!isFixed}
                    placeholder={isFixed ? "0.00" : "Set when due"}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Currency</Label>
                  <SearchableSelect items={currencyItems} value={currencyCode} onValueChange={setCurrencyCode} placeholder="Currency" searchPlaceholder="Search..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Category</Label>
                  <SearchableSelect
                    items={categoryItems}
                    value={parentCategoryId}
                    onValueChange={(val) => { setParentCategoryId(val); setCategoryId(""); }}
                    placeholder="Select category"
                    searchPlaceholder="Search categories..."
                    emptyMessage="No categories found."
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Subcategory</Label>
                  <SearchableSelect
                    items={subcategoryItems}
                    value={categoryId}
                    onValueChange={setCategoryId}
                    placeholder={childCategories.length === 0 ? "Select category first" : "Select subcategory"}
                    searchPlaceholder="Search..."
                    emptyMessage="No subcategories found."
                    disabled={childCategories.length === 0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Default Status</Label>
                  <SearchableSelect items={statusItems} value={defaultStatus} onValueChange={setDefaultStatus} placeholder="Status" searchPlaceholder="Search..." />
                </div>
                <div className="grid gap-1.5">
                  <Label>End Date</Label>
                  <Popover open={endDateCalendarOpen} onOpenChange={setEndDateCalendarOpen}>
                    <PopoverTrigger className={cn("flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", !endDate && "text-muted-foreground")}>
                      {endDateValue ? format(endDateValue, "MMM d, yyyy") : "No end date"}
                      <CalendarIcon className="size-4 text-muted-foreground" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDateValue} onSelect={(date) => { setEndDate(date ? format(date, "yyyy-MM-dd") : ""); setEndDateCalendarOpen(false); }} defaultMonth={endDateValue} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-payment-url">Payment URL</Label>
                <Input id="edit-payment-url" type="url" value={paymentUrl} onChange={(e) => setPaymentUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional short description" />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="ghost" onClick={handleCancel} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </div>
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
                    {new Date(template.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
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

      {/* Schedule card */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Schedule</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frequency</p>
              <p className="mt-1 font-medium text-heading capitalize">
                Every {template.interval > 1 ? `${template.interval} ` : ""}{template.frequency.replace("ly", template.interval > 1 ? "s" : "")}
              </p>
            </div>

            {template.anchorDays.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Anchor Days</p>
                <p className="mt-1 font-medium text-heading">
                  {template.frequency === "weekly"
                    ? template.anchorDays.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")
                    : template.anchorDays.join(", ")}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Start Date</p>
              <p className="mt-1 font-medium text-heading">
                {new Date(template.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">End Date</p>
              <p className="mt-1 font-medium text-heading">
                {template.endDate
                  ? new Date(template.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "No end date"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next Occurrence</p>
              <p className="mt-1 font-medium text-heading">
                {new Date(template.nextOccurrenceDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            {template.lastGeneratedAt && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last Generated</p>
                <p className="mt-1 font-medium text-heading">
                  {new Date(template.lastGeneratedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Generated Expenses */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Generated Expenses</h2>
          <span className="text-sm text-muted">{generatedExpenses.length} shown</span>
        </div>

        {generatedExpenses.length > 0 ? (
          <div className="divide-y divide-border">
            {generatedExpenses.map((expense) => (
              <Link
                key={expense.id}
                href={routes.workspaceExpense(workspaceSlug, expense.id)}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-surface-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-heading">{expense.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(expense.expenseDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-heading">
                    {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={expense.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">
            No expenses generated from this template yet.
          </div>
        )}
      </section>
    </div>
  );
}
