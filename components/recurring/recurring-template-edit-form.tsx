"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { editableExpenseStatusItems } from "@/lib/finance-options";
import { cn } from "@/lib/utils";

type SelectItem = { value: string; label: string };

type Props = {
  title: string;
  amount: number | "";
  currencyCode: string;
  parentCategoryId: string;
  categoryId: string;
  defaultStatus: string;
  endDate: string;
  paymentUrl: string;
  description: string;
  notes: string;
  isFixed: boolean;
  endDateCalendarOpen: boolean;
  endDateValue: Date | undefined;
  categoryItems: SelectItem[];
  subcategoryItems: SelectItem[];
  currencyItems: SelectItem[];
  isPending: boolean;
  onTitleChange: (value: string) => void;
  onAmountChange: (value: number | "") => void;
  onCurrencyCodeChange: (value: string) => void;
  onParentCategoryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDefaultStatusChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onPaymentUrlChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onEndDateCalendarOpenChange: (open: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function RecurringTemplateEditForm(props: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" value={props.title} onChange={(e) => props.onTitleChange(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="edit-amount">Amount</Label>
          <Input
            id="edit-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={props.amount}
            onChange={(e) => props.onAmountChange(e.target.value === "" ? "" : e.target.valueAsNumber || 0)}
            disabled={!props.isFixed}
            placeholder={props.isFixed ? "0.00" : "Set when due"}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Currency</Label>
          <SearchableSelect items={props.currencyItems} value={props.currencyCode} onValueChange={props.onCurrencyCodeChange} placeholder="Currency" searchPlaceholder="Search..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Category</Label>
          <SearchableSelect
            items={props.categoryItems}
            value={props.parentCategoryId}
            onValueChange={(value) => {
              props.onParentCategoryChange(value);
              props.onCategoryChange("");
            }}
            placeholder="Select category"
            searchPlaceholder="Search categories..."
            emptyMessage="No categories found."
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Subcategory</Label>
          <SearchableSelect
            items={props.subcategoryItems}
            value={props.categoryId}
            onValueChange={props.onCategoryChange}
            placeholder={props.subcategoryItems.length === 0 ? "Select category first" : "Select subcategory"}
            searchPlaceholder="Search..."
            emptyMessage="No subcategories found."
            disabled={props.subcategoryItems.length === 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Default Status</Label>
          <SearchableSelect items={editableExpenseStatusItems} value={props.defaultStatus} onValueChange={props.onDefaultStatusChange} placeholder="Status" searchPlaceholder="Search..." />
        </div>
        <div className="grid gap-1.5">
          <Label>End Date</Label>
          <Popover open={props.endDateCalendarOpen} onOpenChange={props.onEndDateCalendarOpenChange}>
            <PopoverTrigger className={cn("flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", !props.endDate && "text-muted-foreground")}>
              {props.endDateValue ? format(props.endDateValue, "MMM d, yyyy") : "No end date"}
              <CalendarIcon className="size-4 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={props.endDateValue}
                onSelect={(date) => {
                  props.onEndDateChange(date ? format(date, "yyyy-MM-dd") : "");
                  props.onEndDateCalendarOpenChange(false);
                }}
                defaultMonth={props.endDateValue}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="edit-payment-url">Payment URL</Label>
        <Input id="edit-payment-url" type="url" value={props.paymentUrl} onChange={(e) => props.onPaymentUrlChange(e.target.value)} placeholder="https://..." />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <Input id="edit-description" value={props.description} onChange={(e) => props.onDescriptionChange(e.target.value)} placeholder="Optional short description" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea id="edit-notes" value={props.notes} onChange={(e) => props.onNotesChange(e.target.value)} placeholder="Optional notes" />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={props.onSave} disabled={props.isPending}>{props.isPending ? "Saving..." : "Save Changes"}</Button>
        <Button variant="ghost" onClick={props.onCancel} disabled={props.isPending}>Cancel</Button>
      </div>
    </div>
  );
}
