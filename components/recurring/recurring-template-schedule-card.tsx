import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatLongMonthDayYear, formatShortDateTime } from "@/lib/format-date";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";

type Props = {
  template: {
    interval: number;
    frequency: string;
    anchorDays: number[];
    startDate: string;
    endDate: string | null;
    nextOccurrenceDate: string;
    lastGeneratedAt: string | null;
    workspaceAmountMinor: number | null;
    workspaceCurrencyCode: string;
    categoryPath: string;
    defaultStatus: string;
    paymentUrl: string | null;
  };
  generatedExpenses: Array<{
    id: string;
    title: string;
    expenseDate: string;
    workspaceAmountMinor: number;
    workspaceCurrencyCode: string;
    status: string;
  }>;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatFrequencyLabel(frequency: string, interval: number) {
  return `Every ${interval > 1 ? `${interval} ` : ""}${frequency.replace("ly", interval > 1 ? "s" : "")}`;
}

function formatAnchorDays(frequency: string, anchorDays: number[]) {
  if (frequency === "weekly") {
    return anchorDays.map((day) => WEEKDAY_LABELS[day]).join(", ");
  }

  return anchorDays.join(", ");
}

export function RecurringTemplateScheduleCard({ template, generatedExpenses }: Props) {
  return (
    <>
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Schedule</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frequency</p>
              <p className="mt-1 font-medium capitalize text-heading">
                {formatFrequencyLabel(template.frequency, template.interval)}
              </p>
            </div>

            {template.anchorDays.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Anchor Days</p>
                <p className="mt-1 font-medium text-heading">
                  {formatAnchorDays(template.frequency, template.anchorDays)}
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Start Date</p>
              <p className="mt-1 font-medium text-heading">{formatLongMonthDayYear(`${template.startDate}T00:00:00`)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">End Date</p>
              <p className="mt-1 font-medium text-heading">
                {template.endDate ? formatLongMonthDayYear(`${template.endDate}T00:00:00`) : "No end date"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next Occurrence</p>
              <p className="mt-1 font-medium text-heading">{formatLongMonthDayYear(`${template.nextOccurrenceDate}T00:00:00`)}</p>
            </div>

            {template.lastGeneratedAt ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last Generated</p>
                <p className="mt-1 font-medium text-heading">{formatShortDateTime(template.lastGeneratedAt)}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-heading">Generated Expenses</h2>
          <span className="text-sm text-muted">{generatedExpenses.length} shown</span>
        </div>

        {generatedExpenses.length > 0 ? (
          <div className="divide-y divide-border">
            {generatedExpenses.map((expense) => (
              <Link
                key={expense.id}
                href={routes.expense(expense.id)}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-surface-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-heading">{expense.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatLongMonthDayYear(`${expense.expenseDate}T00:00:00`)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-heading">
                    {formatMoney(expense.workspaceAmountMinor, expense.workspaceCurrencyCode)}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={expense.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted">No expenses generated from this template yet.</div>
        )}
      </section>
    </>
  );
}
