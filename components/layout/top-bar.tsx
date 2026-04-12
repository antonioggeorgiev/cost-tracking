import Link from "next/link";
import { routes } from "@/lib/routes";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-[rgba(248,250,252,0.7)] backdrop-blur-[12px] border-b border-border lg:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={routes.home} className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <span className="font-heading text-base font-bold text-heading">Cost Tracking</span>
        </Link>
      </div>
    </header>
  );
}
