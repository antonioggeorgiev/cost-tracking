"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ExpenseStatus, RecurringFrequency } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

const createRecurringSchema = z.object({
  workspaceSlug: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  categoryId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  currencyCode: z.enum(supportedCurrencies),
  startDate: z.string().min(1),
  frequency: z.nativeEnum(RecurringFrequency),
  interval: z.coerce.number().int().min(1).max(24),
  defaultStatus: z.nativeEnum(ExpenseStatus),
  description: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function createRecurringTemplateAction(formData: FormData) {
  const input = createRecurringSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    currencyCode: formData.get("currencyCode"),
    startDate: formData.get("startDate"),
    frequency: formData.get("frequency"),
    interval: formData.get("interval"),
    defaultStatus: formData.get("defaultStatus"),
    description: formData.get("description") || null,
    notes: formData.get("notes") || null,
  });

  try {
    const caller = await getServerCaller();
    await caller.recurring.create({
      ...input,
      startDate: new Date(input.startDate),
    });
    revalidatePath(routes.workspaceRecurring(input.workspaceSlug));
    revalidatePath(routes.workspace(input.workspaceSlug));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create recurring template.";
    redirect(`${routes.workspaceRecurring(input.workspaceSlug)}?error=${encodeURIComponent(message)}`);
  }
}
