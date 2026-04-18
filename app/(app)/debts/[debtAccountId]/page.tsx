import { notFound } from "next/navigation";
import {
  serializeDebtDetail,
  serializeDebtMonthStatus,
  serializeDebtPayment,
} from "@/lib/detail-serializers";
import { getServerCaller } from "@/server/trpc-caller";
import { supportedCurrencies } from "@/lib/currency";
import { canManageSpace } from "@/lib/space-permissions";
import { getSelectedSpaceSlug } from "@/lib/space-context";
import { debtService } from "@/server/services/debt-service";
import { DebtAccountDetailClient } from "./debt-account-detail-client";

type DebtDetailPageProps = {
  params: Promise<{ debtAccountId: string }>;
};

export default async function DebtDetailPage({ params }: DebtDetailPageProps) {
  const spaceSlug = await getSelectedSpaceSlug();
  if (!spaceSlug) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16 text-center shadow-sm">
        <p className="font-heading text-lg font-semibold text-heading">No space selected</p>
        <p className="mt-1 text-sm text-body">Please select a space from the sidebar to view this debt account.</p>
      </div>
    );
  }

  const { debtAccountId } = await params;
  const caller = await getServerCaller();

  const [workspace, debt] = await Promise.all([
    caller.spaces.bySlug({ spaceSlug }),
    caller.debts.getById({ spaceSlug, debtAccountId }),
  ]);

  if (!workspace || !debt) {
    notFound();
  }

  const canManage = canManageSpace(workspace.memberships[0]?.role);

  const now = new Date();
  const monthStatus = await debtService.getMonthPaymentStatus(
    workspace.id,
    debtAccountId,
    now.getFullYear(),
    now.getMonth(),
  );

  return (
    <DebtAccountDetailClient
      spaceSlug={spaceSlug}
      debt={serializeDebtDetail(debt)}
      payments={debt.payments.map(serializeDebtPayment)}
      monthStatus={serializeDebtMonthStatus(monthStatus)}
      currencies={supportedCurrencies}
      baseCurrencyCode={workspace.baseCurrencyCode}
      canManage={canManage}
    />
  );
}
