export type DebtSchedulePayment = {
  id: string;
  paymentDate: string;
  dueDate: string | null;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
};

export type DebtScheduleItem = {
  date: string;
  paid: boolean;
  payment: DebtSchedulePayment | null;
};

export function buildDebtMonthSchedule(
  payments: DebtSchedulePayment[],
  unpaidDueDates: string[],
  referenceDate = new Date(),
) {
  const currentMonthPayments = payments.filter((payment) => {
    if (!payment.dueDate) return false;

    const dueDate = new Date(`${payment.dueDate}T00:00:00`);
    return dueDate.getMonth() === referenceDate.getMonth() && dueDate.getFullYear() === referenceDate.getFullYear();
  });

  const allItems: DebtScheduleItem[] = [
    ...currentMonthPayments.map((payment) => ({
      date: payment.dueDate!,
      paid: true,
      payment,
    })),
    ...unpaidDueDates.map((date) => ({
      date,
      paid: false,
      payment: null,
    })),
  ].sort((left, right) => left.date.localeCompare(right.date));

  const seen = new Set<string>();
  return allItems.filter((item) => {
    if (seen.has(item.date)) {
      return false;
    }

    seen.add(item.date);
    return true;
  });
}
