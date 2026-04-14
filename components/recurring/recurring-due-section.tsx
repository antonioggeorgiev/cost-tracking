"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { RecordVariableRecurringForm } from "@/components/recurring/record-variable-recurring-form";
import { getDueStatus } from "@/lib/recurring-display";

type DueTemplate = {
  id: string;
  title: string;
  originalCurrencyCode: string;
  nextOccurrenceDate: Date | string;
  paymentUrl: string | null;
  category: {
    name: string;
    parentCategory: { name: string } | null;
  };
};

type RecurringDueSectionProps = {
  dueVariableTemplates: DueTemplate[];
  workspaceSlug: string;
  canManage: boolean;
  recordAction: (formData: FormData) => Promise<{ success: true } | { error: string }>;
};

export function RecurringDueSection({ dueVariableTemplates, workspaceSlug, canManage, recordAction }: RecurringDueSectionProps) {
  if (dueVariableTemplates.length === 0) return null;

  return (
    <section className="rounded-2xl border-2 border-danger/30 bg-danger-bg/30 p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
          <AlertTriangle size={16} />
        </div>
        <h2 className="font-heading text-lg font-semibold text-heading">Action Required</h2>
        <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
          {dueVariableTemplates.length}
        </span>
      </div>

      <div className="space-y-4">
        {dueVariableTemplates.map((template) => {
          const categoryPath = template.category.parentCategory
            ? `${template.category.parentCategory.name} / ${template.category.name}`
            : template.category.name;
          const dueStatus = getDueStatus(template.nextOccurrenceDate, true);

          return (
            <div key={template.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-heading">{template.title}</p>
                    <span className="rounded-full bg-pending-bg px-2 py-0.5 text-xs font-semibold text-pending-badge">
                      Variable
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-body">{categoryPath}</p>
                  <p className="mt-1 text-xs font-medium text-danger">{dueStatus.label}</p>
                </div>
                {template.paymentUrl && (
                  <Link
                    href={template.paymentUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Payment link
                    <ExternalLink size={14} />
                  </Link>
                )}
              </div>

              {canManage && (
                <div className="mt-3">
                  <RecordVariableRecurringForm
                    workspaceSlug={workspaceSlug}
                    templateId={template.id}
                    currencyCode={template.originalCurrencyCode}
                    action={recordAction}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
