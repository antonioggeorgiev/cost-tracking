"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatLongMonthDayYear } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type Props = {
  unpaidDueDates: string[];
  dueCount: number;
  paymentDueDate: string;
  paymentAmount: string;
  paymentDate: string;
  paymentNotes: string;
  createLinkedExpense: boolean;
  paymentCalendarOpen: boolean;
  paymentDateValue: Date | undefined;
  currencyCode: string;
  isPending: boolean;
  onPaymentDueDateChange: (value: string) => void;
  onPaymentAmountChange: (value: string) => void;
  onPaymentDateChange: (value: string) => void;
  onPaymentNotesChange: (value: string) => void;
  onCreateLinkedExpenseChange: (value: boolean) => void;
  onPaymentCalendarOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function DebtRecordPaymentForm(props: Props) {
  return (
    <div className="border-t border-border px-6 py-4 space-y-4">
      {props.unpaidDueDates.length > 0 ? (
        <div className="grid gap-1.5">
          <Label>Due date</Label>
          <select
            value={props.paymentDueDate}
            onChange={(e) => props.onPaymentDueDateChange(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {props.unpaidDueDates.map((date) => (
              <option key={date} value={date}>
                {formatLongMonthDayYear(`${date}T00:00:00`)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {props.dueCount > 0 && props.unpaidDueDates.length === 0 ? (
        <div className="rounded-lg border border-posted/20 bg-posted/5 px-4 py-3 text-sm text-posted">
          All scheduled payments for this month have been recorded.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="payment-amount">Amount ({props.currencyCode})</Label>
          <Input id="payment-amount" type="number" min="0.01" step="0.01" value={props.paymentAmount} onChange={(e) => props.onPaymentAmountChange(e.target.value)} placeholder="0.00" />
        </div>
        <div className="grid gap-1.5">
          <Label>Payment Date</Label>
          <Popover open={props.paymentCalendarOpen} onOpenChange={props.onPaymentCalendarOpenChange}>
            <PopoverTrigger className={cn("flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", !props.paymentDate && "text-muted-foreground")}>
              {props.paymentDateValue ? format(props.paymentDateValue, "MMM d, yyyy") : "Pick a date"}
              <CalendarIcon className="size-4 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={props.paymentDateValue}
                onSelect={(date) => {
                  if (date) props.onPaymentDateChange(format(date, "yyyy-MM-dd"));
                  props.onPaymentCalendarOpenChange(false);
                }}
                defaultMonth={props.paymentDateValue}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="payment-notes">Notes</Label>
        <Input id="payment-notes" value={props.paymentNotes} onChange={(e) => props.onPaymentNotesChange(e.target.value)} placeholder="Optional" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={props.createLinkedExpense} onChange={(e) => props.onCreateLinkedExpenseChange(e.target.checked)} className="rounded border-input" />
        Create linked expense record
      </label>

      <div className="flex items-center gap-2">
        <Button onClick={props.onSubmit} disabled={props.isPending || !props.paymentAmount}>{props.isPending ? "Recording..." : "Record Payment"}</Button>
        <Button variant="ghost" onClick={props.onCancel} disabled={props.isPending}>Cancel</Button>
      </div>
    </div>
  );
}
