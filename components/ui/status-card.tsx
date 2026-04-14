import { cn } from "@/lib/utils";

type StatusCardProps = {
  label: string;
  value: string;
  helpText?: string;
  variant: "pending" | "planned";
};

const borderColors = {
  pending: "border-l-pending-badge",
  planned: "border-l-planned",
};

export function StatusCard({ label, value, helpText, variant }: StatusCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-sm border-l-4", borderColors[variant])}>
      <p className="text-xs font-semibold uppercase tracking-widest text-body">{label}</p>
      <p className="mt-2 font-heading text-2xl font-extrabold text-heading">{value}</p>
      {helpText ? <p className="mt-1 text-sm text-body">{helpText}</p> : null}
    </div>
  );
}
