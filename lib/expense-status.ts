export const expenseStatusValues = ["planned", "pending", "posted", "cancelled"] as const;

export type ExpenseStatus = (typeof expenseStatusValues)[number];
