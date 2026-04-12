"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ExpenseStatus } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { db } from "@/lib/db";
import { getServerCaller } from "@/server/trpc-caller";

const createExpenseSchema = z.object({
  workspaceSlug: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  categoryId: z.string().cuid().optional().nullable(),
  amount: z.coerce.number().positive(),
  currencyCode: z.enum(supportedCurrencies),
  expenseDate: z.string().min(1),
  status: z.nativeEnum(ExpenseStatus),
  description: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function createExpenseAction(
  formData: FormData,
): Promise<{ id: string } | { error: string }> {
  let workspaceSlug = "";

  try {
    const input = createExpenseSchema.parse({
      workspaceSlug: formData.get("workspaceSlug"),
      title: formData.get("title"),
      categoryId: formData.get("categoryId") || null,
      amount: formData.get("amount"),
      currencyCode: formData.get("currencyCode"),
      expenseDate: formData.get("expenseDate"),
      status: formData.get("status"),
      description: formData.get("description") || null,
      notes: formData.get("notes") || null,
    });

    workspaceSlug = input.workspaceSlug;

    const caller = await getServerCaller();
    const expense = await caller.expenses.create({
      ...input,
      expenseDate: new Date(input.expenseDate),
    });

    revalidatePath(routes.workspaceExpenses(input.workspaceSlug));
    revalidatePath(routes.workspace(input.workspaceSlug));

    return { id: expense.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create expense.";
    return { error: message };
  }
}

const updateExpenseSchema = z.object({
  workspaceSlug: z.string().min(1),
  expenseId: z.string().min(1),
  title: z.string().trim().min(2).max(120).optional(),
  categoryId: z.string().cuid().optional().nullable(),
  amount: z.coerce.number().positive().optional(),
  currencyCode: z.enum(supportedCurrencies).optional(),
  expenseDate: z.string().min(1).optional(),
  status: z.nativeEnum(ExpenseStatus).optional(),
  description: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function updateExpenseAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  let workspaceSlug = "";

  try {
    const raw: Record<string, unknown> = {
      workspaceSlug: formData.get("workspaceSlug"),
      expenseId: formData.get("expenseId"),
    };

    // Only include fields that were submitted
    for (const key of ["title", "amount", "currencyCode", "expenseDate", "status", "description", "notes"] as const) {
      if (formData.has(key)) raw[key] = formData.get(key) || undefined;
    }
    if (formData.has("categoryId")) raw.categoryId = formData.get("categoryId") || null;

    const input = updateExpenseSchema.parse(raw);
    workspaceSlug = input.workspaceSlug;

    const caller = await getServerCaller();
    await caller.expenses.update({
      ...input,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined,
    });

    revalidatePath(routes.workspaceExpenses(workspaceSlug));
    revalidatePath(routes.workspaceExpense(workspaceSlug, input.expenseId));
    revalidatePath(routes.workspace(workspaceSlug));

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update expense.";
    return { error: message };
  }
}

export async function deleteAttachmentAction(
  attachmentId: string,
  workspaceSlug: string,
  expenseId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    await db.expenseAttachment.update({ where: { id: attachmentId }, data: { deletedAt: new Date() } });
    revalidatePath(routes.workspaceExpense(workspaceSlug, expenseId));
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete attachment.";
    return { error: message };
  }
}
