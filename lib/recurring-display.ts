const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Human-readable frequency description.
 * Examples: "Monthly on the 15th", "Every 2 weeks on Mon, Wed", "Yearly on the 1st"
 */
export function formatFrequencyDescription(
  frequency: string,
  interval: number,
  anchorDays: number[],
): string {
  const sorted = [...anchorDays].sort((a, b) => a - b);

  if (frequency === "weekly") {
    const dayNames = sorted.map((d) => DAY_NAMES[d] ?? `day ${d}`).join(", ");
    if (interval === 1) return dayNames ? `Weekly on ${dayNames}` : "Weekly";
    return dayNames ? `Every ${interval} weeks on ${dayNames}` : `Every ${interval} weeks`;
  }

  if (frequency === "monthly") {
    const dayList = sorted.map((d) => ordinal(d)).join(", ");
    if (interval === 1) return dayList ? `Monthly on the ${dayList}` : "Monthly";
    return dayList ? `Every ${interval} months on the ${dayList}` : `Every ${interval} months`;
  }

  if (frequency === "yearly") {
    const dayList = sorted.map((d) => ordinal(d)).join(", ");
    if (interval === 1) return dayList ? `Yearly on the ${dayList}` : "Yearly";
    return dayList ? `Every ${interval} years on the ${dayList}` : `Every ${interval} years`;
  }

  return `Every ${interval} ${frequency}`;
}

export type DueStatus = {
  status: "overdue" | "due_soon" | "upcoming" | "inactive";
  days: number; // positive = days until, negative = days overdue
  label: string;
};

/**
 * Compute how a recurring template relates to the current date.
 */
export function getDueStatus(nextOccurrenceDate: Date | string, isActive: boolean): DueStatus {
  if (!isActive) {
    return { status: "inactive", days: 0, label: "Inactive" };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next = new Date(nextOccurrenceDate);
  next.setHours(0, 0, 0, 0);

  const diffMs = next.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      status: "overdue",
      days: diffDays,
      label: overdue === 1 ? "1 day overdue" : `${overdue} days overdue`,
    };
  }

  if (diffDays === 0) {
    return { status: "overdue", days: 0, label: "Due today" };
  }

  if (diffDays <= 7) {
    return {
      status: "due_soon",
      days: diffDays,
      label: diffDays === 1 ? "Due tomorrow" : `Due in ${diffDays} days`,
    };
  }

  return {
    status: "upcoming",
    days: diffDays,
    label: `Due in ${diffDays} days`,
  };
}

/**
 * Normalize an amount to a monthly equivalent in minor units.
 */
export function normalizeToMonthlyMinor(
  amountMinor: number,
  frequency: string,
  interval: number,
): number {
  switch (frequency) {
    case "weekly":
      return Math.round((amountMinor * (52 / 12)) / interval);
    case "monthly":
      return Math.round(amountMinor / interval);
    case "yearly":
      return Math.round(amountMinor / (12 * interval));
    default:
      return amountMinor;
  }
}
