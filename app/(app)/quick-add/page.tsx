import { notFound } from "next/navigation";
import { createExpenseAction } from "@/app/(app)/expenses/actions";
import { createDebtAccountAction } from "@/app/(app)/debts/actions";
import { createRecurringTemplateAction } from "@/app/(app)/recurring/actions";
import { QuickAddPanel } from "@/components/quick-add/quick-add-panel";
import { RecentExpensesTable } from "@/components/quick-add/recent-expenses-table";
import { supportedCurrencies } from "@/lib/currency";
import { db } from "@/lib/db";
import { getSelectedSpaceSlug } from "@/lib/space-context";
import { getServerCaller } from "@/server/trpc-caller";
import { auth } from "@clerk/nextjs/server";

export default async function QuickAddPage() {
  const selectedSlug = await getSelectedSpaceSlug();
  const caller = await getServerCaller();
  const session = await auth();

  const spaces = await caller.spaces.listMine();

  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-heading">No spaces yet</h1>
        <p className="mt-2 text-sm text-body">Create a space first to start adding expenses.</p>
      </div>
    );
  }

  // Use selected space, or fall back to first space
  const spaceSlug = selectedSlug && spaces.some((s) => s.slug === selectedSlug)
    ? selectedSlug
    : spaces[0].slug;

  const isAllSpacesMode = !selectedSlug;

  const [space, categories, recentResult, members, dbUser] = await Promise.all([
    caller.spaces.bySlug({ spaceSlug }),
    caller.categories.list({ spaceSlug }),
    caller.expenses.list({ spaceSlug, page: 1, perPage: 5 }),
    caller.members.listSimple({ spaceSlug }),
    session.userId
      ? db.user.findUnique({ where: { clerkUserId: session.userId }, select: { id: true } })
      : null,
  ]);

  if (!space) {
    notFound();
  }

  const currentUserId = dbUser?.id;

  const categoryTree = categories.map((c) => ({
    id: c.id,
    name: c.name,
    children: c.children.map((child) => ({ id: child.id, name: child.name })),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
          {isAllSpacesMode ? "All Spaces" : space.name}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-heading">Quick Add</h1>
      </div>

      <QuickAddPanel
        spaceSlug={spaceSlug}
        baseCurrencyCode={space.baseCurrencyCode}
        categories={categoryTree}
        currencies={supportedCurrencies}
        createExpense={createExpenseAction}
        createRecurring={createRecurringTemplateAction}
        createDebtAccount={createDebtAccountAction}
        members={members}
        currentUserId={currentUserId}
        availableSpaces={isAllSpacesMode
          ? spaces.map((s) => ({ slug: s.slug, name: s.name }))
          : undefined
        }
      />

      {/* Recent expenses table */}
      <RecentExpensesTable
        expenses={recentResult.items.map((e) => ({
          id: e.id,
          title: e.title,
          categoryPath: e.categoryPath,
          expenseDate: e.expenseDate.toISOString(),
          createdAt: e.createdAt.toISOString(),
          originalAmountMinor: e.originalAmountMinor,
          originalCurrencyCode: e.originalCurrencyCode,
          workspaceAmountMinor: e.workspaceAmountMinor,
          workspaceCurrencyCode: e.workspaceCurrencyCode,
          status: e.status,
        }))}
      />
    </div>
  );
}
