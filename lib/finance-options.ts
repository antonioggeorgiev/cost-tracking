import { DebtAccountKind, DebtDirection } from "@/generated/prisma/enums";

export const editableExpenseStatusItems = [
  { value: "planned", label: "Planned" },
  { value: "pending", label: "Pending" },
  { value: "posted", label: "Posted" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const debtKindLabels: Record<string, string> = {
  [DebtAccountKind.bank_loan]: "Bank Loan",
  [DebtAccountKind.personal_loan]: "Personal",
  [DebtAccountKind.leasing]: "Leasing",
};

export const debtKindItems = [
  { value: DebtAccountKind.bank_loan, label: "Bank Loan", description: "Mortgage, personal loan, etc." },
  { value: DebtAccountKind.personal_loan, label: "Personal", description: "Money lent to/from someone" },
  { value: DebtAccountKind.leasing, label: "Leasing", description: "Car, equipment, etc." },
] as const;

export const debtDirectionItems = [
  { value: DebtDirection.i_owe, label: "I owe" },
  { value: DebtDirection.they_owe_me, label: "They owe me" },
] as const;

export function formatBasisPointsPercent(bps: number) {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatExpenseTypeLabel(type: string) {
  return type.replace(/_/g, " ");
}
