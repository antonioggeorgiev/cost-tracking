import { notFound } from "next/navigation";
import {
  serializeCategoryTree,
  serializeExpenseAttachment,
  serializeExpenseDetail,
} from "@/lib/detail-serializers";
import { getServerCaller } from "@/server/trpc-caller";
import { supportedCurrencies } from "@/lib/currency";
import { canManageSpace } from "@/lib/space-permissions";
import { getSelectedSpaceSlug } from "@/lib/space-context";
import { ExpenseDetailClient } from "./expense-detail-client";

type ExpenseDetailPageProps = {
  params: Promise<{ expenseId: string }>;
};

export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const spaceSlug = await getSelectedSpaceSlug();

  if (!spaceSlug) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-heading">Select a space to view this expense</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the space selector to pick a workspace first.
        </p>
      </div>
    );
  }

  const { expenseId } = await params;
  const caller = await getServerCaller();

  const [workspace, expense, categories] = await Promise.all([
    caller.spaces.bySlug({ spaceSlug }),
    caller.expenses.getById({ spaceSlug, expenseId }),
    caller.categories.list({ spaceSlug }),
  ]);

  if (!workspace || !expense) {
    notFound();
  }

  const canManage = canManageSpace(workspace.memberships[0]?.role);

  const attachment = expense.attachments[0] ?? null;

  return (
    <ExpenseDetailClient
      spaceSlug={spaceSlug}
      expense={serializeExpenseDetail(expense)}
      attachment={serializeExpenseAttachment(attachment)}
      categories={serializeCategoryTree(categories)}
      currencies={supportedCurrencies}
      baseCurrencyCode={workspace.baseCurrencyCode}
      canManage={canManage}
    />
  );
}
