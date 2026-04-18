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
    revalidatePath(routes.workspaceOverview(input.workspaceSlug));
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

const updateRecurringSchema = z.object({
  workspaceSlug: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().trim().min(2).max(120).optional(),
  categoryId: z.string().cuid().optional(),
  amount: z.coerce.number().positive().optional().nullable(),
  currencyCode: z.enum(supportedCurrencies).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().optional().nullable(),
  frequency: z.nativeEnum(RecurringFrequency).optional(),
  interval: z.coerce.number().int().min(1).max(24).optional(),
  anchorDays: z.array(z.number().int().min(0).max(31)).optional(),
  defaultStatus: z.nativeEnum(ExpenseStatus).optional(),
  paymentUrl: z.string().url().max(500).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function updateRecurringTemplateAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const raw: Record<string, unknown> = {
      workspaceSlug: formData.get("workspaceSlug"),
      templateId: formData.get("templateId"),
    };

    for (const key of ["title", "categoryId", "currencyCode", "startDate", "frequency", "defaultStatus", "description", "notes"] as const) {
      if (formData.has(key)) raw[key] = formData.get(key) || undefined;
    }
    if (formData.has("amount")) raw.amount = formData.get("amount") || null;
    if (formData.has("endDate")) raw.endDate = formData.get("endDate") || null;
    if (formData.has("interval")) raw.interval = formData.get("interval");
    if (formData.has("anchorDays")) raw.anchorDays = JSON.parse((formData.get("anchorDays") as string) || "[]");
    if (formData.has("paymentUrl")) raw.paymentUrl = formData.get("paymentUrl") || null;

    const input = updateRecurringSchema.parse(raw);

    const caller = await getServerCaller();
    await caller.recurring.update({
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : input.endDate === null ? null : undefined,
    });

    revalidatePath(routes.workspaceRecurring(input.workspaceSlug));
    revalidatePath(routes.workspaceRecurringTemplate(input.workspaceSlug, input.templateId));
    revalidatePath(routes.workspace(input.workspaceSlug));
    revalidatePath(routes.workspaceOverview(input.workspaceSlug));

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update recurring template.";
    return { error: message };
  }
}

export async function toggleRecurringTemplateAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const workspaceSlug = formData.get("workspaceSlug") as string;
    const templateId = formData.get("templateId") as string;
    const isActive = formData.get("isActive") === "true";

    const caller = await getServerCaller();
    await caller.recurring.update({ workspaceSlug, templateId, isActive });

    revalidatePath(routes.workspaceRecurring(workspaceSlug));
    revalidatePath(routes.workspaceRecurringTemplate(workspaceSlug, templateId));
    revalidatePath(routes.workspace(workspaceSlug));
    revalidatePath(routes.workspaceOverview(workspaceSlug));

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update template status.";
    return { error: message };
  }
}

export async function markFixedAsPaidAction(formData: FormData): Promise<{ success: true } | { error: string }> {
  try {
    const workspaceSlug = z.string().min(1).parse(formData.get("workspaceSlug"));
    const templateId = z.string().min(1).parse(formData.get("templateId"));
    const caller = await getServerCaller();
    await caller.recurring.markFixedAsPaid({ workspaceSlug, templateId });
    revalidatePath(routes.workspaceRecurring(workspaceSlug));
    revalidatePath(routes.workspaceExpenses(workspaceSlug));
    revalidatePath(routes.workspace(workspaceSlug));
    revalidatePath(routes.workspaceOverview(workspaceSlug));
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark as paid.";
    return { error: message };
  }
}

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
    revalidatePath(routes.workspaceOverview(input.workspaceSlug));
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record recurring expense.";
    return { error: message };
  }
}
