"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: string;
};

export function DatePickerField({ value, onChange, label, hint }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const dateValue = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            !value && "text-muted-foreground",
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
                onChange(format(date, "yyyy-MM-dd"));
              }
              setOpen(false);
            }}
            defaultMonth={dateValue}
          />
        </PopoverContent>
      </Popover>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
