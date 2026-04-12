import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  posted: "bg-posted-bg text-posted",
  pending: "bg-pending-bg text-pending-badge",
  planned: "bg-planned-bg text-planned",
  cancelled: "bg-surface-secondary text-muted",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        statusStyles[status] ?? "bg-surface-secondary text-muted"
      )}
    >
      {status}
    </span>
  );
}
