import { cn } from "@/lib/utils";

type MemberRoleBadgeProps = {
  role: string;
};

const roleStyles: Record<string, string> = {
  owner: "bg-primary-lighter text-primary",
  editor: "bg-success-bg text-success-dark",
  viewer: "bg-surface-secondary text-body",
};

export function MemberRoleBadge({ role }: MemberRoleBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", roleStyles[role] ?? "bg-surface-secondary text-body")}>
      {role}
    </span>
  );
}
