import { formatMonthDay, formatMonthDayYear, formatMonthYear } from "@/lib/format-date";
import { formatMoney } from "@/lib/money";

type Props = {
  dueCount: number;
  paidCount: number;
  unpaidCount: number;
  paymentSchedule: Array<{
    date: string;
    paid: boolean;
    payment: {
      paymentDate: string;
      workspaceAmountMinor: number;
      workspaceCurrencyCode: string;
    } | null;
  }>;
  workspaceMonthlyAmountMinor: number | null;
  workspaceCurrencyCode: string;
  nextPaymentDate: string | null;
  isActive: boolean;
};

export function DebtPaymentSchedule({
  dueCount,
  paidCount,
  unpaidCount,
  paymentSchedule,
  workspaceMonthlyAmountMinor,
  workspaceCurrencyCode,
  nextPaymentDate,
  isActive,
}: Props) {
  return (
    <>
      {isActive && dueCount > 0 ? (
        <div className="rounded-xl border border-border bg-surface-secondary p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-heading">Payment Schedule - {formatMonthYear(new Date())}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${unpaidCount === 0 ? "bg-posted/10 text-posted" : "bg-warning/10 text-warning"}`}>
              {unpaidCount === 0 ? "All paid" : `${paidCount}/${dueCount} paid`}
            </span>
          </div>
          <div className="space-y-1.5">
            {paymentSchedule.map((item) => {
              const dueDate = new Date(`${item.date}T00:00:00`);
              return (
                <div key={item.date} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${item.paid ? "bg-posted/5" : "bg-surface"}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${item.paid ? "bg-posted/20 text-posted" : "bg-surface-secondary text-body"}`}>
                    {item.paid ? "\u2713" : "\u00B7"}
                  </span>
                  <span className="text-sm font-medium text-heading">{formatMonthDay(dueDate)}</span>
                  {item.paid && item.payment ? (
                    <span className="text-xs text-posted">
                      Paid - {formatMoney(item.payment.workspaceAmountMinor, item.payment.workspaceCurrencyCode)} on {formatMonthDay(`${item.payment.paymentDate}T00:00:00`)}
                    </span>
                  ) : (
                    <span className="text-xs text-body">
                      {dueDate < new Date() ? "Overdue" : "Due"}
                      {workspaceMonthlyAmountMinor != null ? ` - ${formatMoney(workspaceMonthlyAmountMinor, workspaceCurrencyCode)}` : ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {nextPaymentDate && isActive && dueCount === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">Next payment due:</span>
          <span className="text-sm font-semibold text-heading">{formatMonthDayYear(`${nextPaymentDate}T00:00:00`)}</span>
          {workspaceMonthlyAmountMinor != null ? (
            <span className="ml-auto text-sm font-semibold text-heading">
              {formatMoney(workspaceMonthlyAmountMinor, workspaceCurrencyCode)}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
