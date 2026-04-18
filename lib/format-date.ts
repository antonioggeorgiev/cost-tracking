const DEFAULT_LOCALE = "en-US";

export function formatMonthDay(date: Date | string) {
  return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
    month: "short",
    day: "numeric",
  });
}

export function formatMonthDayYear(date: Date | string) {
  return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLongMonthDayYear(date: Date | string) {
  return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthYear(date: Date | string) {
  return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
    month: "long",
    year: "numeric",
  });
}

export function formatShortDateTime(date: Date | string) {
  return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string) {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";

  return `${diffDay}d ago`;
}
