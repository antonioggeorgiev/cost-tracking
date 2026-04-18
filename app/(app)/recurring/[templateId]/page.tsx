import { notFound } from "next/navigation";
import {
  serializeCategoryTree,
  serializeRecurringGeneratedExpense,
  serializeRecurringTemplateDetail,
} from "@/lib/detail-serializers";
import { getServerCaller } from "@/server/trpc-caller";
import { supportedCurrencies } from "@/lib/currency";
import { canManageSpace } from "@/lib/space-permissions";
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

  const canManage = canManageSpace(workspace.memberships[0]?.role);

  return (
    <RecurringTemplateDetailClient
      spaceSlug={spaceSlug}
      template={serializeRecurringTemplateDetail(template)}
      generatedExpenses={template.expenses.map(serializeRecurringGeneratedExpense)}
      categories={serializeCategoryTree(categories)}
      currencies={supportedCurrencies}
      baseCurrencyCode={workspace.baseCurrencyCode}
      canManage={canManage}
    />
  );
}
