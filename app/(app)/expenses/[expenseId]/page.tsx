import { notFound } from "next/navigation";
import { getServerCaller } from "@/server/trpc-caller";
import { supportedCurrencies } from "@/lib/currency";
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

  const role = workspace.memberships[0]?.role ?? "viewer";
  const canManage = role === "owner" || role === "editor";

  const categoryTree = categories.map((c) => ({
    id: c.id,
    name: c.name,
    children: c.children.map((child) => ({ id: child.id, name: child.name })),
  }));

  const attachment = expense.attachments[0] ?? null;

  return (
    <ExpenseDetailClient
      spaceSlug={spaceSlug}
      expense={{
        id: expense.id,
        title: expense.title,
        description: expense.description,
        notes: expense.notes,
        originalAmountMinor: expense.originalAmountMinor,
        originalCurrencyCode: expense.originalCurrencyCode,
        workspaceAmountMinor: expense.workspaceAmountMinor,
        workspaceCurrencyCode: expense.workspaceCurrencyCode,
        expenseDate: expense.expenseDate.toISOString().slice(0, 10),
        status: expense.status,
        type: expense.type,
        categoryId: expense.categoryId,
        parentCategoryId: expense.category?.parentCategory?.id ?? expense.category?.id ?? null,
        categoryPath: expense.categoryPath,
        createdByLabel: expense.createdByLabel,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      }}
      attachment={attachment ? {
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        contentType: attachment.contentType,
        url: attachment.url,
        imageWidth: attachment.imageWidth,
        imageHeight: attachment.imageHeight,
      } : null}
      categories={categoryTree}
      currencies={supportedCurrencies}
      baseCurrencyCode={workspace.baseCurrencyCode}
      canManage={canManage}
    />
  );
}
