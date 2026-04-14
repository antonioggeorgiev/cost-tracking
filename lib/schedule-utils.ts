import { format, getISOWeek, getISOWeekYear, getDay, getDate, getMonth } from "date-fns";

export type FrequencyOption = "weekly" | "monthly" | "yearly";

/**
 * Determine which frequency options are valid given the selected days.
 * - All days in the same ISO week → weekly, monthly, yearly
 * - Days in different weeks → monthly, yearly
 * - No days → empty
 */
export function getFrequencyOptions(selectedDays: Date[]): FrequencyOption[] {
  if (selectedDays.length === 0) return [];

  const weekKeys = new Set(
    selectedDays.map((d) => `${getISOWeekYear(d)}-W${getISOWeek(d)}`),
  );

  if (weekKeys.size === 1) {
    return ["weekly", "monthly", "yearly"];
  }

  return ["monthly", "yearly"];
}

/**
 * Derive the server-compatible schedule fields from the calendar selection.
 */
export function deriveScheduleFields(
  selectedDays: Date[],
  frequency: FrequencyOption,
  interval: number,
): {
  startDate: string;
  frequency: FrequencyOption;
  interval: number;
  anchorDays: number[];
} {
  const sorted = [...selectedDays].sort((a, b) => a.getTime() - b.getTime());
  const startDate = format(sorted[0], "yyyy-MM-dd");

  let anchorDays: number[];
  if (frequency === "weekly") {
    // Day-of-week: 0 = Sunday, 6 = Saturday
    anchorDays = [...new Set(sorted.map((d) => getDay(d)))].sort(
      (a, b) => a - b,
    );
  } else {
    // Day-of-month: 1–31
    anchorDays = [...new Set(sorted.map((d) => getDate(d)))].sort(
      (a, b) => a - b,
    );
  }

  return { startDate, frequency, interval, anchorDays };
}

/**
 * Build a human-readable summary of the schedule.
 */
export function formatScheduleSummary(
  selectedDays: Date[],
  frequency: FrequencyOption,
  interval: number,
): string {
  if (selectedDays.length === 0) return "Select days on the calendar";

  const { anchorDays } = deriveScheduleFields(selectedDays, frequency, interval);

  const frequencyLabel =
    interval === 1
      ? frequency === "weekly"
        ? "week"
        : frequency === "monthly"
          ? "month"
          : "year"
      : frequency === "weekly"
        ? `${interval} weeks`
        : frequency === "monthly"
          ? `${interval} months`
          : `${interval} years`;

  let daysLabel: string;
  if (frequency === "weekly") {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysLabel = anchorDays.map((d) => dayNames[d]).join(", ");
  } else if (frequency === "yearly") {
    const sorted = [...selectedDays].sort((a, b) => a.getTime() - b.getTime());
    const months = new Set(sorted.map((d) => getMonth(d)));
    if (months.size === 1) {
      // All in same month: "13th, 14th April"
      const monthName = format(sorted[0], "MMMM");
      daysLabel = anchorDays.map((d) => ordinal(d)).join(", ") + " " + monthName;
    } else {
      // Different months: "13 Apr, 5 May"
      daysLabel = sorted.map((d) => format(d, "d MMM")).join(", ");
    }
  } else {
    daysLabel = anchorDays.map((d) => ordinal(d)).join(", ");
  }

  return `${daysLabel} — every ${frequencyLabel}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
