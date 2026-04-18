import { routes } from "@/lib/routes";
import { formatMonthDay, formatMonthDayYear, formatMonthYear } from "@/lib/format-date";

export type ExpenseListSearchParams = {
  search?: string;
  status?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: string;
  page?: string;
};

export function getDefaultExpenseDateRange() {
  const now = new Date();
  return getExpenseMonthRange(now.getFullYear(), now.getMonth());
}

export function getExpenseMonthRange(year: number, month: number) {
  const dateFrom = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return { dateFrom, dateTo };
}

export function formatExpensePeriodLabel(dateFrom: string, dateTo: string) {
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);

  if (from.getDate() === 1) {
    const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
    if (to.getDate() === lastDay && from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
      return formatMonthYear(from);
    }
  }

  return `${formatMonthDay(from)} - ${formatMonthDayYear(to)}`;
}

export function buildExpensesUrl(
  searchParams: ExpenseListSearchParams,
  overrides: Partial<ExpenseListSearchParams>,
) {
  const merged = {
    search: searchParams.search,
    status: searchParams.status,
    categoryId: searchParams.categoryId,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    period: searchParams.period,
    page: searchParams.page,
    ...overrides,
  };

  const query = new URLSearchParams(
    Object.entries(merged).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ).toString();

  return `${routes.expenses}${query ? `?${query}` : ""}`;
}
