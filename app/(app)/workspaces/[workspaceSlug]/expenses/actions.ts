"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ExpenseStatus } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

const createExpenseSchema = z.object({
  workspaceSlug: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  categoryId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  currencyCode: z.enum(supportedCurrencies),
  expenseDate: z.string().min(1),
  status: z.nativeEnum(ExpenseStatus),
  description: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  redirectOnError: z.string().optional(),
});

export async function createExpenseAction(formData: FormData) {
  const input = createExpenseSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    currencyCode: formData.get("currencyCode"),
    expenseDate: formData.get("expenseDate"),
    status: formData.get("status"),
    description: formData.get("description") || null,
    notes: formData.get("notes") || null,
  });

  try {
    const caller = await getServerCaller();
    await caller.expenses.create({
      ...input,
      expenseDate: new Date(input.expenseDate),
    });

    revalidatePath(routes.workspaceExpenses(input.workspaceSlug));
    revalidatePath(routes.workspace(input.workspaceSlug));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create expense.";
    const errorRedirect = input.redirectOnError ?? routes.workspaceExpenses(input.workspaceSlug);
    redirect(`${errorRedirect}?error=${encodeURIComponent(message)}`);
  }
}
