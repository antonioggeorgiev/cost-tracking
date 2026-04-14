"use client";

import { useEffect, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, RepeatIcon } from "lucide-react";
import {
  type FrequencyOption,
  getFrequencyOptions,
  formatScheduleSummary,
} from "@/lib/schedule-utils";

type SchedulePickerProps = {
  selectedDays: Date[];
  onSelectedDaysChange: (days: Date[]) => void;
  frequency: FrequencyOption;
  onFrequencyChange: (f: FrequencyOption) => void;
  interval: string;
  onIntervalChange: (v: string) => void;
};

const frequencyLabels: Record<FrequencyOption, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function unitLabel(frequency: FrequencyOption, interval: number) {
  if (frequency === "weekly") return interval === 1 ? "week" : "weeks";
  if (frequency === "monthly") return interval === 1 ? "month" : "months";
  return interval === 1 ? "year" : "years";
}

export function SchedulePicker({
  selectedDays,
  onSelectedDaysChange,
  frequency,
  onFrequencyChange,
  interval,
  onIntervalChange,
}: SchedulePickerProps) {
  const options = useMemo(
    () => getFrequencyOptions(selectedDays),
    [selectedDays],
  );

  useEffect(() => {
    if (options.length > 0 && !options.includes(frequency)) {
      onFrequencyChange(options[0]);
    }
  }, [options, frequency, onFrequencyChange]);

  const summary = useMemo(
    () =>
      formatScheduleSummary(selectedDays, frequency, Number(interval) || 1),
    [selectedDays, frequency, interval],
  );

  const hasDays = selectedDays.length > 0;

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Calendar */}
      <div className="border-b border-border">
        <DayPicker
          mode="multiple"
          selected={selectedDays}
          onSelect={(days) => onSelectedDaysChange(days ?? [])}
          showOutsideDays={false}
          max={28}
          components={{
            Chevron: ({ orientation }) =>
              orientation === "left" ? (
                <ChevronLeftIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              ),
          }}
          classNames={{
            root: "w-full p-4",
            months: "relative w-full",
            month: "w-full",
            month_caption: "flex items-center justify-center h-8 mb-2",
            caption_label: "text-sm font-semibold text-heading",
            nav: "absolute inset-x-0 top-0 flex items-center justify-between z-10",
            button_previous:
              "inline-flex items-center justify-center size-8 rounded-lg text-body hover:bg-surface-secondary transition-colors",
            button_next:
              "inline-flex items-center justify-center size-8 rounded-lg text-body hover:bg-surface-secondary transition-colors",
            month_grid: "w-full border-collapse",
            weekdays: "",
            weekday:
              "pb-2 pt-1 text-center text-xs font-medium uppercase tracking-wider text-body",
            weeks: "",
            week: "h-11",
            day: "text-center align-middle",
            day_button:
              "inline-flex items-center justify-center size-10 text-sm text-body rounded-lg transition-colors hover:bg-surface-secondary cursor-pointer select-none",
            selected:
              "[&>button]:!bg-primary [&>button]:!text-on-primary [&>button]:!font-semibold [&>button]:hover:!bg-primary-dark [&>button]:shadow-sm",
            today:
              "[&:not(.rdp-selected)>button]:font-bold [&:not(.rdp-selected)>button]:text-heading",
            outside: "text-body opacity-50",
            disabled: "text-body opacity-30 cursor-not-allowed",
          }}
        />
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Frequency chips */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Frequency
          </Label>
          <div className="flex gap-1.5">
            {(["weekly", "monthly", "yearly"] as const).map((opt) => {
              const available = options.includes(opt);
              const active = frequency === opt && hasDays;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={!available}
                  onClick={() => onFrequencyChange(opt)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-on-primary shadow-sm"
                      : available
                        ? "bg-surface-secondary text-body hover:bg-surface-hover"
                        : "bg-surface-secondary text-body cursor-not-allowed opacity-50",
                  )}
                >
                  {frequencyLabels[opt]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Repeat interval */}
        <div className="flex items-center gap-3">
          <RepeatIcon className="size-4 shrink-0 text-muted-foreground" />
          <Label htmlFor="schedule-interval" className="text-sm shrink-0">
            Repeat every
          </Label>
          <Input
            id="schedule-interval"
            type="number"
            min="1"
            max="24"
            value={interval}
            onChange={(e) => onIntervalChange(e.target.value)}
            className="w-16 text-center"
            required
          />
          <span className="text-sm text-muted-foreground">
            {unitLabel(frequency, Number(interval) || 1)}
          </span>
        </div>

        {/* Summary */}
        {hasDays ? (
          <div className="rounded-md bg-primary-lighter px-3 py-2 text-sm font-medium text-primary">
            {summary}
          </div>
        ) : (
          <div className="rounded-md bg-surface-secondary px-3 py-2 text-sm text-body text-center">
            Select days on the calendar above
          </div>
        )}
      </div>
    </div>
  );
}
