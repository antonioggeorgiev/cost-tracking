"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DebtAccountKind, DebtDirection, RecurringFrequency } from "@/generated/prisma/enums";
import { supportedCurrencies } from "@/lib/currency";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

const createDebtAccountSchema = z.object({
  workspaceSlug: z.string().min(1),
  kind: z.nativeEnum(DebtAccountKind),
  direction: z.nativeEnum(DebtDirection),
  name: z.string().trim().min(2).max(120),
  provider: z.string().max(120).optional().nullable(),
  counterparty: z.string().max(120).optional().nullable(),
  originalAmount: z.coerce.number().positive(),
  alreadyPaid: z.coerce.number().min(0).optional().nullable(),
  currencyCode: z.enum(supportedCurrencies),
  openedAt: z.string().min(1),
  interestRateBps: z.coerce.number().int().min(0).optional().nullable(),
  termMonths: z.coerce.number().int().min(1).optional().nullable(),
  monthlyAmount: z.coerce.number().positive().optional().nullable(),
  residualValue: z.coerce.number().min(0).optional().nullable(),
  frequency: z.nativeEnum(RecurringFrequency).optional().nullable(),
  interval: z.coerce.number().int().min(1).optional().nullable(),
  anchorDays: z.string().optional().nullable(),
  nextPaymentDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const createDebtPaymentSchema = z.object({
  workspaceSlug: z.string().min(1),
  debtAccountId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  currencyCode: z.enum(supportedCurrencies),
  paymentDate: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  createLinkedExpense: z.boolean(),
});

export async function createDebtAccountAction(formData: FormData) {
  const input = createDebtAccountSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    kind: formData.get("kind"),
    direction: formData.get("direction"),
    name: formData.get("name"),
    provider: formData.get("provider") || null,
    counterparty: formData.get("counterparty") || null,
    originalAmount: formData.get("originalAmount"),
    alreadyPaid: formData.get("alreadyPaid") || null,
    currencyCode: formData.get("currencyCode"),
    openedAt: formData.get("openedAt"),
    interestRateBps: formData.get("interestRateBps") || null,
    termMonths: formData.get("termMonths") || null,
    monthlyAmount: formData.get("monthlyAmount") || null,
    residualValue: formData.get("residualValue") || null,
    frequency: formData.get("frequency") || null,
    interval: formData.get("interval") || null,
    anchorDays: formData.get("anchorDays") || null,
    nextPaymentDate: formData.get("nextPaymentDate") || null,
    notes: formData.get("notes") || null,
  });

  try {
    const caller = await getServerCaller();
    await caller.debts.createAccount({
      ...input,
      openedAt: new Date(input.openedAt),
      anchorDays: input.anchorDays ? JSON.parse(input.anchorDays) : undefined,
      nextPaymentDate: input.nextPaymentDate ? new Date(input.nextPaymentDate) : undefined,
    });
    revalidatePath(routes.workspaceDebts(input.workspaceSlug));
    revalidatePath(routes.workspace(input.workspaceSlug));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create debt account.";
    redirect(`${routes.workspaceDebts(input.workspaceSlug)}?error=${encodeURIComponent(message)}`);
  }
}

export async function createDebtPaymentAction(formData: FormData) {
  const input = createDebtPaymentSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    debtAccountId: formData.get("debtAccountId"),
    amount: formData.get("amount"),
    currencyCode: formData.get("currencyCode"),
    paymentDate: formData.get("paymentDate"),
    dueDate: formData.get("dueDate") || null,
    notes: formData.get("notes") || null,
    createLinkedExpense: formData.get("createLinkedExpense") === "on",
  });

  try {
    const caller = await getServerCaller();
    await caller.debts.createPayment({
      ...input,
      paymentDate: new Date(input.paymentDate),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    });
    revalidatePath(routes.workspaceDebts(input.workspaceSlug));
    revalidatePath(routes.workspaceDebt(input.workspaceSlug, input.debtAccountId));
    revalidatePath(routes.workspaceExpenses(input.workspaceSlug));
    revalidatePath(routes.workspace(input.workspaceSlug));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record debt payment.";
    redirect(`${routes.workspaceDebts(input.workspaceSlug)}?error=${encodeURIComponent(message)}`);
  }
}

const updateDebtAccountSchema = z.object({
  workspaceSlug: z.string().min(1),
  debtAccountId: z.string().min(1),
  kind: z.nativeEnum(DebtAccountKind).optional(),
  direction: z.nativeEnum(DebtDirection).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  provider: z.string().max(120).optional().nullable(),
  counterparty: z.string().max(120).optional().nullable(),
  originalAmount: z.coerce.number().positive().optional(),
  alreadyPaid: z.coerce.number().min(0).optional().nullable(),
  currencyCode: z.enum(supportedCurrencies).optional(),
  openedAt: z.string().min(1).optional(),
  interestRateBps: z.coerce.number().int().min(0).optional().nullable(),
  termMonths: z.coerce.number().int().min(1).optional().nullable(),
  monthlyAmount: z.coerce.number().positive().optional().nullable(),
  residualValue: z.coerce.number().min(0).optional().nullable(),
  frequency: z.nativeEnum(RecurringFrequency).optional().nullable(),
  interval: z.coerce.number().int().min(1).optional().nullable(),
  anchorDays: z.string().optional().nullable(),
  nextPaymentDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function updateDebtAccountAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const raw: Record<string, unknown> = {
      workspaceSlug: formData.get("workspaceSlug"),
      debtAccountId: formData.get("debtAccountId"),
    };

    for (const key of ["kind", "direction", "name", "originalAmount", "currencyCode", "openedAt", "notes"] as const) {
      if (formData.has(key)) raw[key] = formData.get(key) || undefined;
    }
    if (formData.has("alreadyPaid")) raw.alreadyPaid = formData.get("alreadyPaid") || null;
    for (const key of ["provider", "counterparty"] as const) {
      if (formData.has(key)) raw[key] = formData.get(key) || null;
    }
    for (const key of ["interestRateBps", "termMonths", "monthlyAmount", "residualValue"] as const) {
      if (formData.has(key)) raw[key] = formData.get(key) || null;
    }
    for (const key of ["frequency"] as const) {
      if (formData.has(key)) raw[key] = formData.get(key) || null;
    }
    if (formData.has("interval")) raw.interval = formData.get("interval") || null;
    if (formData.has("anchorDays")) raw.anchorDays = formData.get("anchorDays") || null;
    if (formData.has("nextPaymentDate")) raw.nextPaymentDate = formData.get("nextPaymentDate") || null;

    const input = updateDebtAccountSchema.parse(raw);

    const caller = await getServerCaller();
    await caller.debts.update({
      ...input,
      openedAt: input.openedAt ? new Date(input.openedAt) : undefined,
      anchorDays: input.anchorDays ? JSON.parse(input.anchorDays) : undefined,
      nextPaymentDate: input.nextPaymentDate ? new Date(input.nextPaymentDate) : undefined,
    });

    revalidatePath(routes.workspaceDebts(input.workspaceSlug));
    revalidatePath(routes.workspaceDebt(input.workspaceSlug, input.debtAccountId));
    revalidatePath(routes.workspace(input.workspaceSlug));

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update debt account.";
    return { error: message };
  }
}

export async function toggleDebtActiveAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const workspaceSlug = formData.get("workspaceSlug") as string;
    const debtAccountId = formData.get("debtAccountId") as string;
    const isActive = formData.get("isActive") === "true";

    const caller = await getServerCaller();
    await caller.debts.update({ workspaceSlug, debtAccountId, isActive });

    revalidatePath(routes.workspaceDebts(workspaceSlug));
    revalidatePath(routes.workspaceDebt(workspaceSlug, debtAccountId));
    revalidatePath(routes.workspace(workspaceSlug));

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update debt account status.";
    return { error: message };
  }
}
