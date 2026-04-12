import { Receipt, Landmark, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const types = [
  { value: "expense", label: "Expense", icon: Receipt, enabled: true },
  { value: "debt", label: "Debt", icon: Landmark, enabled: false },
  { value: "recurring", label: "Recurring", icon: RefreshCw, enabled: false },
];

export function TypeSelector() {
  return (
    <div className="flex gap-3">
      {types.map((type) => {
        const Icon = type.icon;
        return (
          <div
            key={type.value}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium",
              type.enabled
                ? "border-primary bg-primary-lighter text-primary shadow-sm"
                : "cursor-not-allowed border-border bg-surface-secondary text-muted opacity-50"
            )}
          >
            <Icon size={16} />
            {type.label}
            {!type.enabled && (
              <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Soon
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
