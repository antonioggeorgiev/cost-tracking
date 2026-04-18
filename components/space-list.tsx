import Link from "next/link";
import { MemberRoleBadge } from "@/components/member-role-badge";
import { routes } from "@/lib/routes";
import { ChevronRight } from "lucide-react";

type SpaceListProps = {
  spaces: Array<{
    id: string;
    name: string;
    slug: string;
    baseCurrencyCode: string;
    role: string;
  }>;
};

export function SpaceList({ spaces }: SpaceListProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="font-heading text-base font-semibold text-heading">Your Spaces</h2>
        <span className="text-sm text-body">{spaces.length} total</span>
      </div>

      <div className="divide-y divide-border">
        {spaces.map((space) => (
          <Link
            key={space.id}
            href={routes.spaces}
            className="flex items-center gap-4 px-6 py-4 transition hover:bg-surface-secondary"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-lighter text-primary font-bold text-sm">
              {space.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-heading">{space.name}</p>
              <p className="mt-0.5 text-xs text-body">/{space.slug} · {space.baseCurrencyCode}</p>
            </div>
            <MemberRoleBadge role={space.role} />
            <ChevronRight size={16} className="text-body" />
          </Link>
        ))}
      </div>
    </section>
  );
}
