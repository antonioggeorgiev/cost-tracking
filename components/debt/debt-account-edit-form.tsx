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
import { cn } from "@/lib/utils";

type SelectItem = { value: string; label: string };

type Props = {
  kind: string;
  direction: string;
  name: string;
  provider: string;
  counterparty: string;
  originalAmount: number;
  alreadyPaid: number;
  currencyCode: string;
  openedAt: string;
  interestRateBps: number | "";
  termMonths: number | "";
  monthlyAmount: number | "";
  residualValue: number | "";
  notes: string;
  kindItems: readonly SelectItem[];
  directionItems: readonly SelectItem[];
  currencyItems: SelectItem[];
  calendarOpen: boolean;
  openedDateValue: Date | undefined;
  isPending: boolean;
  onKindChange: (value: string) => void;
  onDirectionChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onCounterpartyChange: (value: string) => void;
  onOriginalAmountChange: (value: number) => void;
  onAlreadyPaidChange: (value: number) => void;
  onCurrencyCodeChange: (value: string) => void;
  onOpenedAtChange: (value: string) => void;
  onInterestRateBpsChange: (value: number | "") => void;
  onTermMonthsChange: (value: number | "") => void;
  onMonthlyAmountChange: (value: number | "") => void;
  onResidualValueChange: (value: number | "") => void;
  onNotesChange: (value: string) => void;
  onCalendarOpenChange: (open: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function DebtAccountEditForm(props: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Type</Label>
          <SearchableSelect items={[...props.kindItems]} value={props.kind} onValueChange={props.onKindChange} placeholder="Type" />
        </div>
        <div className="grid gap-1.5">
          <Label>Direction</Label>
          <SearchableSelect items={[...props.directionItems]} value={props.direction} onValueChange={props.onDirectionChange} placeholder="Direction" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" value={props.name} onChange={(e) => props.onNameChange(e.target.value)} required />
      </div>

      {(props.kind === "bank_loan" || props.kind === "leasing") ? (
        <div className="grid gap-1.5">
          <Label htmlFor="edit-provider">Provider</Label>
          <Input id="edit-provider" value={props.provider} onChange={(e) => props.onProviderChange(e.target.value)} placeholder="Bank or company name" />
        </div>
      ) : null}

      {props.kind === "personal_loan" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="edit-counterparty">Counterparty</Label>
          <Input id="edit-counterparty" value={props.counterparty} onChange={(e) => props.onCounterpartyChange(e.target.value)} placeholder="Person name" />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="edit-amount">Original Amount</Label>
          <Input id="edit-amount" type="number" min="0.01" step="0.01" value={props.originalAmount || ""} onChange={(e) => props.onOriginalAmountChange(e.target.valueAsNumber || 0)} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="edit-already-paid">Already Paid</Label>
          <Input id="edit-already-paid" type="number" min="0" step="0.01" value={props.alreadyPaid || ""} onChange={(e) => props.onAlreadyPaidChange(e.target.valueAsNumber || 0)} placeholder="0.00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Currency</Label>
          <SearchableSelect items={props.currencyItems} value={props.currencyCode} onValueChange={props.onCurrencyCodeChange} placeholder="Currency" searchPlaceholder="Search..." />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Opened At</Label>
        <Popover open={props.calendarOpen} onOpenChange={props.onCalendarOpenChange}>
          <PopoverTrigger className={cn("flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", !props.openedAt && "text-muted-foreground")}>
            {props.openedDateValue ? format(props.openedDateValue, "MMM d, yyyy") : "Pick a date"}
            <CalendarIcon className="size-4 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={props.openedDateValue}
              onSelect={(date) => {
                if (date) props.onOpenedAtChange(format(date, "yyyy-MM-dd"));
                props.onCalendarOpenChange(false);
              }}
              defaultMonth={props.openedDateValue}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="edit-interest">Interest Rate (%)</Label>
          <Input id="edit-interest" type="number" min="0" step="0.01" value={props.interestRateBps} onChange={(e) => props.onInterestRateBpsChange(e.target.value === "" ? "" : e.target.valueAsNumber)} placeholder="e.g. 5.25" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="edit-term">Term (months)</Label>
          <Input id="edit-term" type="number" min="1" step="1" value={props.termMonths} onChange={(e) => props.onTermMonthsChange(e.target.value === "" ? "" : e.target.valueAsNumber)} placeholder="e.g. 24" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="edit-monthly">Monthly Payment</Label>
          <Input id="edit-monthly" type="number" min="0.01" step="0.01" value={props.monthlyAmount} onChange={(e) => props.onMonthlyAmountChange(e.target.value === "" ? "" : e.target.valueAsNumber)} placeholder="Amount" />
        </div>
        {props.kind === "leasing" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="edit-residual">Residual Value</Label>
            <Input id="edit-residual" type="number" min="0" step="0.01" value={props.residualValue} onChange={(e) => props.onResidualValueChange(e.target.value === "" ? "" : e.target.valueAsNumber)} placeholder="Amount" />
          </div>
        ) : null}
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
