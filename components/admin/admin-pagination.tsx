import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  previousHref: { pathname: string; query: { search?: string; page: number } } | null;
  nextHref: { pathname: string; query: { search?: string; page: number } } | null;
};

export function AdminPagination({ page, totalPages, previousHref, nextHref }: Props) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-3">
      <p className="text-sm text-body">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {previousHref ? (
          <Link
            href={previousHref}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-heading hover:bg-surface-secondary"
          >
            Previous
          </Link>
        ) : null}
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-heading hover:bg-surface-secondary"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
