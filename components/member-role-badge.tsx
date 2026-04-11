type MemberRoleBadgeProps = {
  role: string;
};

export function MemberRoleBadge({ role }: MemberRoleBadgeProps) {
  return (
    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-slate-300">
      {role}
    </span>
  );
}
