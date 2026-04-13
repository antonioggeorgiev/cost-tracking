import { cn } from "@/lib/utils";

type FormSectionProps = {
  legend: string;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({ legend, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {legend}
      </h3>
      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}
