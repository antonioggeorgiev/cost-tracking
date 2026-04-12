"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarIcon, Paperclip, X } from "lucide-react";
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
  createCategory: (formData: FormData) => Promise<void>;
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

        // Upload files to Vercel Blob via API route
        if (files.length > 0) {
          const attachments = await Promise.all(
            files.map(async (file) => {
              const body = new FormData();
              body.set("file", file);
              const res = await fetch("/api/upload", { method: "POST", body });
              return res.json() as Promise<{ url: string; fileName: string; fileSize: number; contentType: string }>;
            }),
          );
          await saveAttachmentsAction(result.id, attachments);
        }

        form.reset();
        setSelectedParentId("");
        setFiles([]);
        router.refresh();
      });
    },
  });

  const [selectedParentId, setSelectedParentId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedParent = categories.find((c) => c.id === selectedParentId);
  const childCategories = selectedParent?.children ?? [];

  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const subcategoryItems = childCategories.map((c) => ({ value: c.id, label: c.name }));
  const currencyItems = currencies.map((c) => ({ value: c, label: c }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
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
                  setSelectedParentId(val);
                  form.setFieldValue("categoryId", "");
                }}
                placeholder="Select category"
                searchPlaceholder="Search categories..."
                emptyMessage="No categories found."
                footerAction={
                  <CreateCategoryDialog
                    type="category"
                    workspaceSlug={workspaceSlug}
                    createCategory={createCategory}
                  />
                }
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
                placeholder={childCategories.length === 0 ? "Select category first" : "Select subcategory"}
                searchPlaceholder="Search subcategories..."
                emptyMessage="No subcategories found."
                disabled={childCategories.length === 0}
                footerAction={
                  selectedParentId ? (
                    <CreateCategoryDialog
                      type="subcategory"
                      workspaceSlug={workspaceSlug}
                      parentCategoryId={selectedParentId}
                      createCategory={createCategory}
                    />
                  ) : undefined
                }
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

      {/* File attachments */}
      <div className="grid gap-1.5">
        <Label>Attachments</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
            }
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input text-sm text-muted-foreground transition hover:border-ring hover:text-foreground"
        >
          <Paperclip className="size-4" />
          Attach files
        </button>
        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-input bg-muted/50 px-3 py-1.5 text-sm"
              >
                <span className="truncate text-foreground">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full" size="lg">
          {isPending ? "Adding..." : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
