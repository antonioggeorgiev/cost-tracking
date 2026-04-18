"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw, ExternalLink, AlertTriangle, Clock, Check, CheckCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatFrequencyDescription, getDueStatus } from "@/lib/recurring-display";
import { routes } from "@/lib/routes";

type RecurringCardProps = {
  template: {
    id: string;
    kind: string;
    title: string;
    originalAmountMinor: number | null;
    originalCurrencyCode: string;
    workspaceAmountMinor: number | null;
    workspaceCurrencyCode: string;
    frequency: string;
    interval: number;
    anchorDays: number[];
    nextOccurrenceDate: Date | string;
    lastGeneratedAt: Date | string | null;
    defaultStatus: string;
    isActive: boolean;
    paymentUrl: string | null;
    category: {
      name: string;
      parentCategory: { name: string } | null;
    };
  };
  spaceSlug: string;
  canManage: boolean;
  markPaidAction?: (formData: FormData) => Promise<{ success: true } | { error: string }>;
};

export function RecurringCard({ template, spaceSlug, canManage, markPaidAction }: RecurringCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const categoryPath = template.category.parentCategory
    ? `${template.category.parentCategory.name} / ${template.category.name}`
    : template.category.name;

  const isFixed = template.kind === "fixed_amount";
  const dueStatus = getDueStatus(template.nextOccurrenceDate, template.isActive);
  const freqDesc = formatFrequencyDescription(template.frequency, template.interval, template.anchorDays);

  // Check if recently paid (lastGeneratedAt within past 7 days for fixed)
  const recentlyPaid =
    isFixed &&
    template.lastGeneratedAt &&
    (Date.now() - new Date(template.lastGeneratedAt).getTime()) < 7 * 24 * 60 * 60 * 1000 &&
    dueStatus.status !== "overdue";

  const showMarkPaid = canManage && isFixed && !recentlyPaid && (dueStatus.status === "overdue" || dueStatus.days === 0);

  function handleMarkPaid(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!markPaidAction) return;
    const formData = new FormData();
    formData.set("spaceSlug", spaceSlug);
    formData.set("templateId", template.id);
    startTransition(async () => {
      await markPaidAction(formData);
      router.refresh();
    });
  }

  return (
    <Link
      href={routes.recurringTemplate(template.id)}
      className={`block rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md hover:border-primary/30 ${
        !template.isActive ? "opacity-60" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <RefreshCw size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-heading">{template.title}</p>
            <p className="truncate text-xs text-body">{categoryPath}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            isFixed ? "bg-posted-bg text-posted" : "bg-pending-bg text-pending-badge"
          }`}
        >
          {isFixed ? "Fixed" : "Variable"}
        </span>
      </div>

      {/* Amount + frequency */}
      <div className="mt-4">
        {isFixed && template.workspaceAmountMinor != null ? (
          <p className="font-heading text-xl font-bold text-heading">
            {formatMoney(template.workspaceAmountMinor, template.workspaceCurrencyCode)}
          </p>
        ) : (
          <p className="text-sm italic text-body">Amount varies</p>
        )}
        <p className="mt-0.5 text-sm text-body">{freqDesc}</p>
      </div>

      {/* Due status */}
      <div className="mt-3">
        {recentlyPaid ? (
          <div className="flex items-center gap-2 rounded-lg bg-posted-bg px-3 py-2">
            <Check size={14} className="text-posted" />
            <span className="text-sm font-medium text-posted">
              Paid {new Date(template.lastGeneratedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        ) : dueStatus.status === "overdue" ? (
          <div className="flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-2">
            <AlertTriangle size={14} className="text-danger" />
            <span className="text-sm font-medium text-danger">{dueStatus.label}</span>
          </div>
        ) : dueStatus.status === "due_soon" ? (
          <div className="flex items-center gap-2 rounded-lg bg-planned-bg px-3 py-2">
            <Clock size={14} className="text-planned" />
            <span className="text-sm font-medium text-planned">{dueStatus.label}</span>
          </div>
        ) : dueStatus.status === "inactive" ? (
          <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2">
            <span className="text-sm font-medium text-body">Inactive</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2">
            <Clock size={14} className="text-body" />
            <span className="text-sm text-body">
              Next: {new Date(template.nextOccurrenceDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {template.isActive && (showMarkPaid || template.paymentUrl) && (
        <div className="mt-4 flex items-center gap-2">
          {showMarkPaid && (
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-heading px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-heading/90 disabled:opacity-50"
            >
              <CheckCircle size={14} />
              {isPending ? "Marking..." : "Mark as Paid"}
            </button>
          )}
          {template.paymentUrl && (
            <Link
              href={template.paymentUrl}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-primary transition hover:bg-surface-secondary"
            >
              <ExternalLink size={14} />
              Pay
            </Link>
          )}
        </div>
      )}
    </Link>
  );
}
