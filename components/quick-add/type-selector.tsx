"use client";

import { Landmark, Receipt, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuickAddType = "expense" | "recurring" | "debt";

type TypeSelectorProps = {
  value: QuickAddType;
  onChange: (value: QuickAddType) => void;
};

const types = [
  { value: "expense", label: "Expense", icon: Receipt, enabled: true },
  { value: "recurring", label: "Recurring", icon: RefreshCw, enabled: true },
  { value: "debt", label: "Debt", icon: Landmark, enabled: true },
] satisfies Array<{ value: QuickAddType; label: string; icon: typeof Receipt; enabled: boolean }>;

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div className="flex gap-3">
      {types.map((type) => {
        const Icon = type.icon;

        return (
          <Button
            key={type.value}
            type="button"
            variant={value === type.value ? "default" : "outline"}
            disabled={!type.enabled}
            onClick={() => onChange(type.value)}
            className="h-auto rounded-xl px-4 py-3"
          >
            <Icon size={16} />
            {type.label}
            {!type.enabled ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Soon
              </span>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
