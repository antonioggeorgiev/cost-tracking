"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ExpenseStatus, RecurringFrequency, RecurringTemplateKind } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

const createRecurringSchema = z.object({
  workspaceSlug: z.string().min(1),
  kind: z.nativeEnum(RecurringTemplateKind),
  title: z.string().trim().min(2).max(120),
  categoryId: z.string().cuid(),
  amount: z.coerce.number().positive().optional(),
  currencyCode: z.enum(supportedCurrencies),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  frequency: z.nativeEnum(RecurringFrequency),
  interval: z.coerce.number().int().min(1).max(24),
  anchorDays: z.array(z.number().int().min(0).max(31)).default([]),
  defaultStatus: z.nativeEnum(ExpenseStatus),
  paymentUrl: z.url().max(500).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
}).superRefine((input, ctx) => {
  if (input.kind === RecurringTemplateKind.fixed_amount && input.amount === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: "Amount is required for fixed recurring templates." });
  }
});

export async function createRecurringTemplateAction(formData: FormData): Promise<{ success: true } | { error: string }> {
  try {
    const input = createRecurringSchema.parse({
      workspaceSlug: formData.get("workspaceSlug"),
      kind: formData.get("kind"),
      title: formData.get("title"),
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount") || undefined,
      currencyCode: formData.get("currencyCode"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate") || null,
      frequency: formData.get("frequency"),
      interval: formData.get("interval"),
      anchorDays: JSON.parse((formData.get("anchorDays") as string) || "[]"),
      defaultStatus: formData.get("defaultStatus"),
      paymentUrl: formData.get("paymentUrl") || null,
      description: formData.get("description") || null,
      notes: formData.get("notes") || null,
    });

    const caller = await getServerCaller();
    await caller.recurring.create({
      ...input,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      anchorDays: input.anchorDays,
    });
    revalidatePath(routes.workspaceRecurring(input.workspaceSlug));
    revalidatePath(routes.workspace(input.workspaceSlug));
    revalidatePath(routes.workspaceDashboard(input.workspaceSlug));
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create recurring template.";
    return { error: message };
  }
}

const recordVariableRecurringSchema = z.object({
  workspaceSlug: z.string().min(1),
  templateId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function recordVariableRecurringExpenseAction(formData: FormData): Promise<{ success: true } | { error: string }> {
  try {
    const input = recordVariableRecurringSchema.parse({
      workspaceSlug: formData.get("workspaceSlug"),
      templateId: formData.get("templateId"),
      amount: formData.get("amount"),
      notes: formData.get("notes") || null,
    });

    const caller = await getServerCaller();
    await caller.recurring.recordVariableExpense(input);
    revalidatePath(routes.workspaceRecurring(input.workspaceSlug));
    revalidatePath(routes.workspace(input.workspaceSlug));
    revalidatePath(routes.workspaceDashboard(input.workspaceSlug));
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record recurring expense.";
    return { error: message };
  }
}
