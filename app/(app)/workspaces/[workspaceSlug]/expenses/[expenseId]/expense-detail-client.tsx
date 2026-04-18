"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Download, FileText, Paperclip, Pencil, RefreshCw, Trash2, X, Image as ImageIcon } from "lucide-react";
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
import { updateExpenseAction, deleteAttachmentAction } from "../actions";
import { saveAttachmentsAction } from "../attachment-action";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

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
  workspaceSlug: string;
  expense: ExpenseData;
  attachment: AttachmentData;
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(contentType: string) {
  return contentType.startsWith("image/");
}

export function ExpenseDetailClient({
  workspaceSlug,
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

  const selectedParent = categories.find((c) => c.id === parentCategoryId);
  const childCategories = selectedParent?.children ?? [];
  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const subcategoryItems = childCategories.map((c) => ({ value: c.id, label: c.name }));
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
    formData.set("workspaceSlug", workspaceSlug);
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
      await deleteAttachmentAction(attachmentId, workspaceSlug, expense.id);
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
      await deleteAttachmentAction(attachmentId, workspaceSlug, expense.id);
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
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount || ""}
                    onChange={(e) => setAmount(e.target.valueAsNumber || 0)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Currency</Label>
                  <SearchableSelect
                    items={currencyItems}
                    value={currencyCode}
                    onValueChange={setCurrencyCode}
                    placeholder="Currency"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Date</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger
                      className={cn(
                        "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        !expenseDate && "text-muted-foreground"
                      )}
                    >
                      {dateValue ? format(dateValue, "MMM d, yyyy") : "Pick a date"}
                      <CalendarIcon className="size-4 text-muted-foreground" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={(date) => {
                          if (date) setExpenseDate(format(date, "yyyy-MM-dd"));
                          setCalendarOpen(false);
                        }}
                        defaultMonth={dateValue}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-1.5">
                  <Label>Status</Label>
                  <SearchableSelect
                    items={statusItems}
                    value={status}
                    onValueChange={setStatus}
                    placeholder="Status"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Category</Label>
                  <SearchableSelect
                    items={categoryItems}
                    value={parentCategoryId}
                    onValueChange={(val) => {
                      setParentCategoryId(val);
                      setCategoryId("");
                    }}
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

              <div className="grid gap-1.5">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional short description"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                />
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
                    {new Date(expense.expenseDate + "T00:00:00").toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Category</p>
                  <p className="mt-1 font-medium text-heading">{expense.categoryPath}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
                  <p className="mt-1 font-medium capitalize text-heading">{expense.type.replace(/_/g, " ")}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Created by</p>
                  <p className="mt-1 font-medium text-heading">{expense.createdByLabel}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last updated</p>
                  <p className="mt-1 font-medium text-heading">
                    {new Date(expense.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
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

      {/* Attachment section */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Attachment</h2>
          {canManage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || isUploadingFile || !!attachment}
                title={attachment ? "Limited to 1 file per expense" : undefined}
              >
                <Paperclip size={14} data-icon="inline-start" />
                {isUploadingFile ? "Uploading..." : "Attach file"}
              </Button>
            </>
          )}
        </div>

        <div className="border-t border-border px-6 py-4">
          {attachment ? (
            <div className="overflow-hidden rounded-lg border border-border">
              {/* Image preview */}
              {isImageType(attachment.contentType) && attachment.imageWidth && attachment.imageHeight && (
                <div className="border-b border-border bg-muted/40 p-4">
                  <Image
                    src={`/api/download?url=${encodeURIComponent(attachment.url)}`}
                    alt={attachment.fileName}
                    width={attachment.imageWidth}
                    height={attachment.imageHeight}
                    className="mx-auto max-h-96 w-auto rounded object-contain"
                    unoptimized
                  />
                </div>
              )}

              {/* File info + actions */}
              <div className="flex items-center justify-between bg-surface-secondary/50 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {isImageType(attachment.contentType) ? (
                    <ImageIcon size={20} className="shrink-0 text-primary" />
                  ) : (
                    <FileText size={20} className="shrink-0 text-primary" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-heading">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`/api/download?url=${encodeURIComponent(attachment.url)}`}
                    download={attachment.fileName}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Download file"
                  >
                    <Download size={14} />
                  </a>
                  {canManage && (
                    <>
                      <input
                        ref={replaceFileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReplaceAttachment(attachment.id, file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => replaceFileInputRef.current?.click()}
                        disabled={isPending || isUploadingFile}
                        title="Replace file"
                      >
                        <RefreshCw size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        disabled={isPending || isUploadingFile}
                        title="Delete file"
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No file attached to this expense.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
