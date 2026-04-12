"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, RefreshCw, Landmark, Settings, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

type BottomNavProps = {
  workspaceSlug: string;
};

const tabs = [
  { label: "ADD", icon: PlusCircle, segment: "" },
  { label: "DASHBOARD", icon: LayoutDashboard, segment: "/dashboard" },
  { label: "EXPENSES", icon: Receipt, segment: "/expenses" },
  { label: "RECURRING", icon: RefreshCw, segment: "/recurring" },
  { label: "DEBTS", icon: Landmark, segment: "/debts" },
  { label: "SETTINGS", icon: Settings, segment: "/settings" },
] as const;

export function BottomNav({ workspaceSlug }: BottomNavProps) {
  const pathname = usePathname();
  const base = routes.workspace(workspaceSlug);

  function isActive(segment: string) {
    const target = base + segment;
    if (segment === "") {
      return pathname === target;
    }
    return pathname.startsWith(target);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-[24px] rounded-t-3xl border-t border-border shadow-lg lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.segment);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={base + tab.segment}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 min-w-0",
                active ? "text-primary" : "text-muted"
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
