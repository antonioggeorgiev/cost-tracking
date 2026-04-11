"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supportedCurrencies } from "@/lib/currency";
import { getServerCaller } from "@/server/trpc-caller";

const createDebtAccountSchema = z.object({
  workspaceSlug: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  provider: z.string().max(120).optional().nullable(),
  originalAmount: z.coerce.number().positive(),
  currencyCode: z.enum(supportedCurrencies),
  openedAt: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
});

const createDebtPaymentSchema = z.object({
  workspaceSlug: z.string().min(1),
  debtAccountId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  currencyCode: z.enum(supportedCurrencies),
  paymentDate: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
  createLinkedExpense: z.boolean(),
});

export async function createDebtAccountAction(formData: FormData) {
  const input = createDebtAccountSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    name: formData.get("name"),
    provider: formData.get("provider") || null,
    originalAmount: formData.get("originalAmount"),
    currencyCode: formData.get("currencyCode"),
    openedAt: formData.get("openedAt"),
    notes: formData.get("notes") || null,
  });

  try {
    const caller = await getServerCaller();
    await caller.debts.createAccount({
      ...input,
      openedAt: new Date(input.openedAt),
    });
    revalidatePath(`/app/${input.workspaceSlug}/debts`);
    revalidatePath(`/app/${input.workspaceSlug}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create debt account.";
    redirect(`/app/${input.workspaceSlug}/debts?error=${encodeURIComponent(message)}`);
  }
}

export async function createDebtPaymentAction(formData: FormData) {
  const input = createDebtPaymentSchema.parse({
    workspaceSlug: formData.get("workspaceSlug"),
    debtAccountId: formData.get("debtAccountId"),
    amount: formData.get("amount"),
    currencyCode: formData.get("currencyCode"),
    paymentDate: formData.get("paymentDate"),
    notes: formData.get("notes") || null,
    createLinkedExpense: formData.get("createLinkedExpense") === "on",
  });

  try {
    const caller = await getServerCaller();
    await caller.debts.createPayment({
      ...input,
      paymentDate: new Date(input.paymentDate),
    });
    revalidatePath(`/app/${input.workspaceSlug}/debts`);
    revalidatePath(`/app/${input.workspaceSlug}/expenses`);
    revalidatePath(`/app/${input.workspaceSlug}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record debt payment.";
    redirect(`/app/${input.workspaceSlug}/debts?error=${encodeURIComponent(message)}`);
  }
}
