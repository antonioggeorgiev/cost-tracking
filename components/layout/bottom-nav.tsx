"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Receipt, RefreshCw, Landmark, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

type SpaceInfo = {
  id: string;
  name: string;
  slug: string;
  baseCurrencyCode: string;
  role: string;
};

type BottomNavProps = {
  selectedSpace: SpaceInfo | null;
};

const tabs = [
  { label: "ADD", icon: PlusCircle, path: routes.quickAdd },
  { label: "OVERVIEW", icon: Activity, path: routes.overview },
  { label: "EXPENSES", icon: Receipt, path: routes.expenses },
  { label: "RECURRING", icon: RefreshCw, path: routes.recurring },
  { label: "DEBTS", icon: Landmark, path: routes.debts },
] as const;

export function BottomNav({ selectedSpace: _selectedSpace }: BottomNavProps) {
  const pathname = usePathname();

  function isActive(path: string) {
    if (path === routes.quickAdd) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-[24px] rounded-t-3xl border-t border-border shadow-lg lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.path}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 min-w-0",
                active ? "text-primary" : "text-body"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] truncate">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
