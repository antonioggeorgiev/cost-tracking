"use client";

import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Paperclip, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { cn } from "@/lib/utils";
import { saveAttachmentsAction } from "@/app/(app)/workspaces/[workspaceSlug]/expenses/attachment-action";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

type QuickAddExpenseFormProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  categories: Category[];
  currencies: readonly string[];
  createExpense: (formData: FormData) => Promise<{ id: string } | { error: string }>;
  createCategory: (formData: FormData) => Promise<{ id: string }>;
};

const expenseFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  amount: z.number().positive("Amount must be positive"),
  expenseDate: z.string().min(1, "Date is required"),
  status: z.enum(["planned", "pending", "posted"]),
  parentCategoryId: z.string(),
  categoryId: z.string(),
  currencyCode: z.string().min(1),
  description: z.string().max(500),
});

const statusItems = [
  { value: "planned", label: "Planned" },
  { value: "pending", label: "Pending" },
  { value: "posted", label: "Posted" },
];

export function QuickAddExpenseForm({
  workspaceSlug,
  baseCurrencyCode,
  categories,
  currencies,
  createExpense,
  createCategory,
}: QuickAddExpenseFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      amount: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      status: "posted" as "planned" | "pending" | "posted",
      parentCategoryId: "",
      categoryId: "",
      currencyCode: baseCurrencyCode,
      description: "",
    },
    validators: {
      onSubmit: expenseFormSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError(null);

      const formData = new FormData();
      formData.set("workspaceSlug", workspaceSlug);
      formData.set("title", value.title);
      formData.set("amount", String(value.amount));
      formData.set("expenseDate", value.expenseDate);
      formData.set("status", value.status);
      if (value.categoryId) {
        formData.set("categoryId", value.categoryId);
      }
      formData.set("currencyCode", value.currencyCode);
      formData.set("description", value.description ?? "");

      startTransition(async () => {
        const result = await createExpense(formData);

        if ("error" in result) {
          setFormError(result.error);
          return;
        }

        // Upload file to Vercel Blob via API route
        if (file) {
          const body = new FormData();
          body.set("file", file);
          const res = await fetch("/api/upload", { method: "POST", body });
          const attachment = await res.json() as { url: string; fileName: string; fileSize: number; contentType: string };
          await saveAttachmentsAction(result.id, [attachment]);
        }

        form.reset();

        setFile(null);
        router.refresh();
      });
    },
  });

  const selectedParentId = useStore(form.store, (state) => state.values.parentCategoryId);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  async function handleReceiptScan(scannedFile: File) {
    setIsScanning(true);
    setFormError(null);
    try {
      const body = new FormData();
      body.set("file", scannedFile);
      body.set("workspaceSlug", workspaceSlug);
      const res = await fetch("/api/scan-receipt", { method: "POST", body });
      const result = await res.json();

      if (result.error) {
        setFormError(result.error);
        return;
      }

      // Reset form for a fresh expense from the scan
      form.reset();

      if (result.title) form.setFieldValue("title", result.title);
      if (result.description) form.setFieldValue("description", result.description);
      if (result.amount) form.setFieldValue("amount", result.amount);
      if (result.currencyCode) form.setFieldValue("currencyCode", result.currencyCode);
      if (result.expenseDate) form.setFieldValue("expenseDate", result.expenseDate);

      if (result.parentCategoryId && categories.some((c) => c.id === result.parentCategoryId)) {
        form.setFieldValue("parentCategoryId", result.parentCategoryId);

        if (result.categoryId) {
          const parent = categories.find((c) => c.id === result.parentCategoryId);
          if (parent?.children.some((ch) => ch.id === result.categoryId)) {
            form.setFieldValue("categoryId", result.categoryId);
          }
        }
      }

      // Replace any existing file with the scanned receipt
      setFile(scannedFile);
    } catch {
      setFormError("Failed to scan receipt. Please try again or fill in manually.");
    } finally {
      setIsScanning(false);
    }
  }
  const selectedParent = categories.find((c) => c.id === selectedParentId);
  const childCategories = selectedParent?.children ?? [];

  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const subcategoryItems = childCategories.map((c) => ({ value: c.id, label: c.name }));
  const currencyItems = currencies.map((c) => ({ value: c, label: c }));

  return (
    <>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Receipt scan */}
      <div className="grid gap-1.5">
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleReceiptScan(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isScanning || isPending}
          onClick={() => receiptInputRef.current?.click()}
          className="h-12 w-full border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10"
        >
          {isScanning ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Scanning receipt...
            </>
          ) : (
            <>
              <ScanLine className="size-5" />
              Scan Receipt / Invoice
            </>
          )}
        </Button>
      </div>

      {formError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form.Field name="title">
        {(field) => (
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              required
              placeholder="Tiles for bathroom"
            />
            {field.state.meta.errors.length > 0 && (
              <span className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="amount">
        {(field) => (
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={field.state.value || ""}
                onChange={(e) => field.handleChange(e.target.valueAsNumber || 0)}
                onBlur={field.handleBlur}
                required
                placeholder="199.99"
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                {baseCurrencyCode}
              </span>
            </div>
            {field.state.meta.errors.length > 0 && (
              <span className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</span>
            )}
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="expenseDate">
          {(field) => {
            const dateValue = field.state.value ? new Date(field.state.value + "T00:00:00") : undefined;
            return (
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger
                    className={cn(
                      "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      !field.state.value && "text-muted-foreground"
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
                        if (date) {
                          field.handleChange(format(date, "yyyy-MM-dd"));
                        }
                        setCalendarOpen(false);
                      }}
                      defaultMonth={dateValue}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            );
          }}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <SearchableSelect
                items={statusItems}
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as "planned" | "pending" | "posted")}
                placeholder="Select status"
                searchPlaceholder="Search status..."
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="parentCategoryId">
          {(field) => (
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <SearchableSelect
                items={categoryItems}
                value={field.state.value}
                onValueChange={(val) => {
                  field.handleChange(val);

                  form.setFieldValue("categoryId", "");
                }}
                placeholder="Select category"
                searchPlaceholder="Search categories..."
                emptyMessage="No categories found."
                onCreateNew={() => setCategoryDialogOpen(true)}
                createNewLabel="Create category"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="categoryId">
          {(field) => (
            <div className="grid gap-1.5">
              <Label>Subcategory</Label>
              <SearchableSelect
                items={subcategoryItems}
                value={field.state.value}
                onValueChange={field.handleChange}
                placeholder={!selectedParentId ? "Select category first" : "Select subcategory"}
                searchPlaceholder="Search subcategories..."
                emptyMessage="No subcategories found."
                disabled={!selectedParentId}
                onCreateNew={selectedParentId ? () => setSubcategoryDialogOpen(true) : undefined}
                createNewLabel="Create subcategory"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</span>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="currencyCode">
        {(field) => (
          <div className="grid gap-1.5">
            <Label>Currency</Label>
            <SearchableSelect
              items={currencyItems}
              value={field.state.value}
              onValueChange={field.handleChange}
              placeholder="Select currency"
              searchPlaceholder="Search currencies..."
            />
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={field.state.value ?? ""}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Optional short description"
            />
          </div>
        )}
      </form.Field>

      {/* File attachment */}
      <div className="grid gap-1.5">
        <Label>Attachment</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) setFile(selected);
            e.target.value = "";
          }}
        />
        {file ? (
          <div className="flex items-center justify-between rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-foreground">{file.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setFile(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-dashed"
          >
            <Paperclip className="size-4" />
            Attach file
          </Button>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full" size="lg">
          {isPending ? "Adding..." : "Add Expense"}
        </Button>
      </div>

    </form>

      <CreateCategoryDialog
        type="category"
        workspaceSlug={workspaceSlug}
        createCategory={createCategory}
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={(id) => {
          form.setFieldValue("parentCategoryId", id);
          form.setFieldValue("categoryId", "");
        }}
      />
      <CreateCategoryDialog
        type="subcategory"
        workspaceSlug={workspaceSlug}
        parentCategoryId={selectedParentId}
        createCategory={createCategory}
        open={subcategoryDialogOpen}
        onOpenChange={setSubcategoryDialogOpen}
        onCreated={(id) => {
          form.setFieldValue("categoryId", id);
        }}
      />
    </>
  );
}
