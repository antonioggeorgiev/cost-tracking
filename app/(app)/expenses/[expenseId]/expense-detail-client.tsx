"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { ExpenseAttachmentSection } from "@/components/expenses/expense-attachment-section";
import { ExpenseDetailEditForm } from "@/components/expenses/expense-detail-edit-form";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  toCategorySelectItems,
  toSubcategorySelectItems,
  type CategoryTreeNode,
} from "@/lib/category-tree";
import { formatExpenseTypeLabel } from "@/lib/finance-options";
import { formatLongMonthDayYear, formatShortDateTime } from "@/lib/format-date";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";
import { updateExpenseAction, deleteAttachmentAction } from "../actions";
import { saveAttachmentsAction } from "../attachment-action";

type ExpenseData = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  originalAmountMinor: number;
  originalCurrencyCode: string;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  expenseDate: string;
  status: string;
  type: string;
  categoryId: string | null;
  parentCategoryId: string | null;
  categoryPath: string;
  createdByLabel: string;
  createdAt: string;
  updatedAt: string;
};

type AttachmentData = {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  url: string;
  imageWidth: number | null;
  imageHeight: number | null;
} | null;

type ExpenseDetailClientProps = {
  spaceSlug: string;
  expense: ExpenseData;
  attachment: AttachmentData;
  categories: CategoryTreeNode[];
  currencies: readonly string[];
  baseCurrencyCode: string;
  canManage: boolean;
};

export function ExpenseDetailClient({
  spaceSlug,
  expense,
  attachment,
  categories,
  currencies,
  baseCurrencyCode,
  canManage,
}: ExpenseDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Edit form state
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(expense.originalAmountMinor / 100);
  const [currencyCode, setCurrencyCode] = useState(expense.originalCurrencyCode);
  const [expenseDate, setExpenseDate] = useState(expense.expenseDate);
  const [status, setStatus] = useState(expense.status);
  const [description, setDescription] = useState(expense.description ?? "");
  const [notes, setNotes] = useState(expense.notes ?? "");
  const [parentCategoryId, setParentCategoryId] = useState(expense.parentCategoryId ?? "");
  const [categoryId, setCategoryId] = useState(expense.categoryId ?? "");

  const categoryItems = toCategorySelectItems(categories);
  const subcategoryItems = toSubcategorySelectItems(categories, parentCategoryId);
  const currencyItems = currencies.map((c) => ({ value: c, label: c }));

  function resetForm() {
    setTitle(expense.title);
    setAmount(expense.originalAmountMinor / 100);
    setCurrencyCode(expense.originalCurrencyCode);
    setExpenseDate(expense.expenseDate);
    setStatus(expense.status);
    setDescription(expense.description ?? "");
    setNotes(expense.notes ?? "");
    setParentCategoryId(expense.parentCategoryId ?? "");
    setCategoryId(expense.categoryId ?? "");
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
    formData.set("expenseId", expense.id);
    formData.set("title", title);
    formData.set("amount", String(amount));
    formData.set("currencyCode", currencyCode);
    formData.set("expenseDate", expenseDate);
    formData.set("status", status);
    formData.set("description", description);
    formData.set("notes", notes);
    formData.set("categoryId", categoryId || "");

    startTransition(async () => {
      const result = await updateExpenseAction(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleFileUpload(file: File) {
    setIsUploadingFile(true);
    startTransition(async () => {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const uploaded = await res.json() as { url: string; fileName: string; fileSize: number; contentType: string; imageWidth?: number | null; imageHeight?: number | null };
      await saveAttachmentsAction(expense.id, [uploaded]);
      setIsUploadingFile(false);
      router.refresh();
    });
  }

  function handleReplaceAttachment(attachmentId: string, file: File) {
    setIsUploadingFile(true);
    startTransition(async () => {
      await deleteAttachmentAction(attachmentId, spaceSlug, expense.id);
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const uploaded = await res.json() as { url: string; fileName: string; fileSize: number; contentType: string; imageWidth?: number | null; imageHeight?: number | null };
      await saveAttachmentsAction(expense.id, [uploaded]);
      setIsUploadingFile(false);
      router.refresh();
    });
  }

  function handleDeleteAttachment(attachmentId: string) {
    startTransition(async () => {
      await deleteAttachmentAction(attachmentId, spaceSlug, expense.id);
      router.refresh();
    });
  }

  const dateValue = expenseDate ? new Date(expenseDate + "T00:00:00") : undefined;

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
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil size={14} data-icon="inline-start" />
            Edit
          </Button>
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
              <ExpenseDetailEditForm
                title={title}
                amount={amount}
                currencyCode={currencyCode}
                expenseDate={expenseDate}
                status={status}
                description={description}
                notes={notes}
                parentCategoryId={parentCategoryId}
                categoryId={categoryId}
                categoryItems={categoryItems}
                subcategoryItems={subcategoryItems}
                currencyItems={currencyItems}
                calendarOpen={calendarOpen}
                dateValue={dateValue}
                isPending={isPending}
                onTitleChange={setTitle}
                onAmountChange={setAmount}
                onCurrencyCodeChange={setCurrencyCode}
                onExpenseDateChange={setExpenseDate}
                onStatusChange={setStatus}
                onDescriptionChange={setDescription}
                onNotesChange={setNotes}
                onParentCategoryChange={setParentCategoryId}
                onCategoryChange={setCategoryId}
                onCalendarOpenChange={setCalendarOpen}
                onSave={handleSave}
                onCancel={handleCancel}
              />
          ) : (
            /* ---------- VIEW MODE ---------- */
            <div className="space-y-5">
              {/* Title + status */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-heading text-xl font-bold text-heading">{expense.title}</h1>
                  {expense.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{expense.description}</p>
                  )}
                </div>
                <StatusBadge status={expense.status} />
              </div>

              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Amount</p>
                  <p className="mt-1 text-lg font-semibold text-heading">
                    {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Date</p>
                  <p className="mt-1 font-medium text-heading">
                    {formatLongMonthDayYear(`${expense.expenseDate}T00:00:00`)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Category</p>
                  <p className="mt-1 font-medium text-heading">{expense.categoryPath}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
                  <p className="mt-1 font-medium capitalize text-heading">{formatExpenseTypeLabel(expense.type)}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Created by</p>
                  <p className="mt-1 font-medium text-heading">{expense.createdByLabel}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last updated</p>
                  <p className="mt-1 font-medium text-heading">
                    {formatShortDateTime(expense.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {expense.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-body">{expense.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ExpenseAttachmentSection
        attachment={attachment}
        canManage={canManage}
        isPending={isPending}
        isUploadingFile={isUploadingFile}
        fileInputRef={fileInputRef}
        replaceFileInputRef={replaceFileInputRef}
        onUpload={handleFileUpload}
        onReplace={handleReplaceAttachment}
        onDelete={handleDeleteAttachment}
      />
    </div>
  );
}
