import { toCategoryTree } from "@/lib/category-tree";

function toIsoDate(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : null;
}

function toIsoDateTime(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

export function serializeCategoryTree(
  categories: Array<{
    id: string;
    name: string;
    children: Array<{ id: string; name: string }>;
  }>,
) {
  return toCategoryTree(categories);
}

export function serializeExpenseDetail(expense: {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  originalAmountMinor: number;
  originalCurrencyCode: string;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  expenseDate: Date;
  status: string;
  type: string;
  categoryId: string | null;
  categoryPath: string;
  createdByLabel: string;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; parentCategory?: { id: string } | null } | null;
}) {
  return {
    id: expense.id,
    title: expense.title,
    description: expense.description,
    notes: expense.notes,
    originalAmountMinor: expense.originalAmountMinor,
    originalCurrencyCode: expense.originalCurrencyCode,
    workspaceAmountMinor: expense.workspaceAmountMinor,
    workspaceCurrencyCode: expense.workspaceCurrencyCode,
    expenseDate: toIsoDate(expense.expenseDate)!,
    status: expense.status,
    type: expense.type,
    categoryId: expense.categoryId,
    parentCategoryId: expense.category?.parentCategory?.id ?? expense.category?.id ?? null,
    categoryPath: expense.categoryPath,
    createdByLabel: expense.createdByLabel,
    createdAt: toIsoDateTime(expense.createdAt)!,
    updatedAt: toIsoDateTime(expense.updatedAt)!,
  };
}

export function serializeExpenseAttachment(attachment: {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  url: string;
  imageWidth: number | null;
  imageHeight: number | null;
} | null) {
  if (!attachment) {
    return null;
  }

  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    contentType: attachment.contentType,
    url: attachment.url,
    imageWidth: attachment.imageWidth,
    imageHeight: attachment.imageHeight,
  };
}

export function serializeRecurringTemplateDetail(template: {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  notes: string | null;
  originalAmountMinor: number | null;
  originalCurrencyCode: string;
  workspaceAmountMinor: number | null;
  workspaceCurrencyCode: string;
  frequency: string;
  interval: number;
  anchorDays: number[];
  startDate: Date;
  endDate: Date | null;
  nextOccurrenceDate: Date;
  lastGeneratedAt: Date | null;
  defaultStatus: string;
  paymentUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  categoryPath: string;
  createdByLabel: string;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; parentCategory?: { id: string } | null } | null;
}) {
  return {
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
    startDate: toIsoDate(template.startDate)!,
    endDate: toIsoDate(template.endDate),
    nextOccurrenceDate: toIsoDate(template.nextOccurrenceDate)!,
    lastGeneratedAt: toIsoDateTime(template.lastGeneratedAt),
    defaultStatus: template.defaultStatus,
    paymentUrl: template.paymentUrl,
    isActive: template.isActive,
    categoryId: template.categoryId,
    parentCategoryId: template.category?.parentCategory?.id ?? template.category?.id ?? null,
    categoryPath: template.categoryPath,
    createdByLabel: template.createdByLabel,
    createdAt: toIsoDateTime(template.createdAt)!,
    updatedAt: toIsoDateTime(template.updatedAt)!,
  };
}

export function serializeRecurringGeneratedExpense(expense: {
  id: string;
  title: string;
  expenseDate: Date;
  originalAmountMinor: number;
  originalCurrencyCode: string;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  status: string;
}) {
  return {
    id: expense.id,
    title: expense.title,
    expenseDate: toIsoDate(expense.expenseDate)!,
    originalAmountMinor: expense.originalAmountMinor,
    originalCurrencyCode: expense.originalCurrencyCode,
    workspaceAmountMinor: expense.workspaceAmountMinor,
    workspaceCurrencyCode: expense.workspaceCurrencyCode,
    status: expense.status,
  };
}

export function serializeDebtDetail(debt: {
  id: string;
  kind: string;
  direction: string;
  name: string;
  provider: string | null;
  counterparty: string | null;
  originalAmountMinor: number;
  currencyCode: string;
  currentBalanceMinor: number;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  workspaceBalanceMinor: number;
  workspaceMonthlyAmountMinor: number | null;
  workspaceResidualValueMinor: number | null;
  interestRateBps: number | null;
  termMonths: number | null;
  monthlyAmountMinor: number | null;
  residualValueMinor: number | null;
  frequency: string | null;
  interval: number | null;
  anchorDays: number[];
  nextPaymentDate: Date | null;
  openedAt: Date;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: debt.id,
    kind: debt.kind,
    direction: debt.direction,
    name: debt.name,
    provider: debt.provider,
    counterparty: debt.counterparty,
    originalAmountMinor: debt.originalAmountMinor,
    currencyCode: debt.currencyCode,
    currentBalanceMinor: debt.currentBalanceMinor,
    workspaceAmountMinor: debt.workspaceAmountMinor,
    workspaceCurrencyCode: debt.workspaceCurrencyCode,
    workspaceBalanceMinor: debt.workspaceBalanceMinor,
    workspaceMonthlyAmountMinor: debt.workspaceMonthlyAmountMinor,
    workspaceResidualValueMinor: debt.workspaceResidualValueMinor,
    interestRateBps: debt.interestRateBps,
    termMonths: debt.termMonths,
    monthlyAmountMinor: debt.monthlyAmountMinor,
    residualValueMinor: debt.residualValueMinor,
    frequency: debt.frequency,
    interval: debt.interval,
    anchorDays: debt.anchorDays,
    nextPaymentDate: toIsoDate(debt.nextPaymentDate),
    openedAt: toIsoDate(debt.openedAt)!,
    isActive: debt.isActive,
    notes: debt.notes,
    createdAt: toIsoDateTime(debt.createdAt)!,
    updatedAt: toIsoDateTime(debt.updatedAt)!,
  };
}

export function serializeDebtPayment(payment: {
  id: string;
  originalAmountMinor: number;
  originalCurrencyCode: string;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  paymentDate: Date;
  dueDate: Date | null;
  notes: string | null;
  paidByUser: { name: string | null; email: string };
  expense?: { id: string } | null;
}) {
  return {
    id: payment.id,
    originalAmountMinor: payment.originalAmountMinor,
    originalCurrencyCode: payment.originalCurrencyCode,
    workspaceAmountMinor: payment.workspaceAmountMinor,
    workspaceCurrencyCode: payment.workspaceCurrencyCode,
    paymentDate: toIsoDate(payment.paymentDate)!,
    dueDate: toIsoDate(payment.dueDate),
    notes: payment.notes,
    paidByLabel: payment.paidByUser.name || payment.paidByUser.email,
    expenseId: payment.expense?.id ?? null,
  };
}

export function serializeDebtMonthStatus(monthStatus: {
  dueCount: number;
  paidCount: number;
  unpaidCount: number;
  unpaidDueDates: Date[];
}) {
  return {
    dueCount: monthStatus.dueCount,
    paidCount: monthStatus.paidCount,
    unpaidCount: monthStatus.unpaidCount,
    unpaidDueDates: monthStatus.unpaidDueDates.map((date) => toIsoDate(date)!),
  };
}
