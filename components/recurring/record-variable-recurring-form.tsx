"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RecordVariableRecurringFormProps = {
  workspaceSlug: string;
  templateId: string;
  currencyCode: string;
  action: (formData: FormData) => Promise<{ success: true } | { error: string }>;
};

export function RecordVariableRecurringForm({ workspaceSlug, templateId, currencyCode, action }: RecordVariableRecurringFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setFormError(null);

        const formData = new FormData();
        formData.set("workspaceSlug", workspaceSlug);
        formData.set("templateId", templateId);
        formData.set("amount", amount);
        formData.set("notes", notes);

        startTransition(async () => {
          const result = await action(formData);
          if ("error" in result) {
            setFormError(result.error);
            return;
          }

          setAmount("");
          setNotes("");
          router.refresh();
        });
      }}
      className="grid gap-3"
    >
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`amount-${templateId}`}>Amount ({currencyCode})</Label>
          <Input id={`amount-${templateId}`} type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder="0.00" />
        </div>
        <Button type="submit" disabled={isPending} className="sm:mb-px">
          {isPending ? "Saving..." : "Record Amount"}
        </Button>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`notes-${templateId}`}>Notes</Label>
        <Textarea id={`notes-${templateId}`} value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Optional notes for this occurrence" />
      </div>
    </form>
  );
}
