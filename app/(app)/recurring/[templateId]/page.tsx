import { notFound } from "next/navigation";
import { getServerCaller } from "@/server/trpc-caller";
import { supportedCurrencies } from "@/lib/currency";
import { getSelectedSpaceSlug } from "@/lib/space-context";
import { RecurringTemplateDetailClient } from "./recurring-template-detail-client";

type RecurringDetailPageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function RecurringDetailPage({ params }: RecurringDetailPageProps) {
  const spaceSlug = await getSelectedSpaceSlug();
  if (!spaceSlug) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16 text-center shadow-sm">
        <p className="font-heading text-lg font-semibold text-heading">No space selected</p>
        <p className="mt-1 text-sm text-body">Please select a space from the sidebar to view this template.</p>
      </div>
    );
  }

  const { templateId } = await params;
  const caller = await getServerCaller();

  const [workspace, template, categories] = await Promise.all([
    caller.spaces.bySlug({ spaceSlug }),
    caller.recurring.getById({ spaceSlug, templateId }),
    caller.categories.list({ spaceSlug }),
  ]);

  if (!workspace || !template) {
    notFound();
  }

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";

  const categoryTree = categories.map((c) => ({
    id: c.id,
    name: c.name,
    children: c.children.map((child) => ({ id: child.id, name: child.name })),
  }));

  return (
    <RecurringTemplateDetailClient
      spaceSlug={spaceSlug}
      template={{
        id: template.id,
        kind: template.kind,
        title: template.title,
        description: template.description,
        notes: template.notes,
        originalAmountMinor: template.originalAmountMinor,
        originalCurrencyCode: template.originalCurrencyCode,
        workspaceAmountMinor: template.workspaceAmountMinor,
        workspaceCurrencyCode: template.workspaceCurrencyCode,
        frequency: template.frequency,
        interval: template.interval,
        anchorDays: template.anchorDays,
        startDate: template.startDate.toISOString().slice(0, 10),
        endDate: template.endDate?.toISOString().slice(0, 10) ?? null,
        nextOccurrenceDate: template.nextOccurrenceDate.toISOString().slice(0, 10),
        lastGeneratedAt: template.lastGeneratedAt?.toISOString() ?? null,
        defaultStatus: template.defaultStatus,
        paymentUrl: template.paymentUrl,
        isActive: template.isActive,
        categoryId: template.categoryId,
        parentCategoryId: template.category?.parentCategory?.id ?? template.category?.id ?? null,
        categoryPath: template.categoryPath,
        createdByLabel: template.createdByLabel,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      }}
      generatedExpenses={template.expenses.map((e) => ({
        id: e.id,
        title: e.title,
        expenseDate: e.expenseDate.toISOString().slice(0, 10),
        originalAmountMinor: e.originalAmountMinor,
        originalCurrencyCode: e.originalCurrencyCode,
        workspaceAmountMinor: e.workspaceAmountMinor,
        workspaceCurrencyCode: e.workspaceCurrencyCode,
        status: e.status,
      }))}
      categories={categoryTree}
      currencies={supportedCurrencies}
      baseCurrencyCode={workspace.baseCurrencyCode}
      canManage={canManage}
    />
  );
}
