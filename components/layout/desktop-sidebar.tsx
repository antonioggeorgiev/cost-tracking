"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import {
  Activity, Receipt, RefreshCw, Landmark, Settings, LogOut,
  ChevronDown, User, PlusCircle, Wallet,
  Users, Shield, Check, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { switchSpace } from "@/app/(app)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SpaceInfo = {
  id: string;
  name: string;
  slug: string;
  baseCurrencyCode: string;
  role: string;
};

type DesktopSidebarProps = {
  spaces: SpaceInfo[];
  selectedSpace: SpaceInfo | null;
  user?: {
    name: string;
    email: string;
    imageUrl: string;
    isPlatformAdmin?: boolean;
  };
};

const topNavItems = [
  { label: "Quick Add", icon: PlusCircle, path: routes.quickAdd },
  { label: "Overview", icon: Activity, path: routes.overview },
] as const;

const financeNavItems = [
  { label: "Expenses", icon: Receipt, path: routes.expenses },
  { label: "Recurring", icon: RefreshCw, path: routes.recurring },
  { label: "Debts", icon: Landmark, path: routes.debts },
] as const;

const spaceOnlyNavItems = [
  { label: "Members", icon: Users, path: routes.members },
  { label: "Settings", icon: Settings, path: routes.settings },
] as const;

export function DesktopSidebar({ spaces, selectedSpace, user }: DesktopSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const financeActive = financeNavItems.some((item) => pathname.startsWith(item.path));
  const [financeOpen, setFinanceOpen] = useState(true);

  function isActive(path: string) {
    if (path === routes.quickAdd) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  }

  async function handleSelectSpace(slug: string | null) {
    await switchSpace(slug);
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[260px] lg:border-r lg:border-border lg:bg-surface">
      <div className="flex flex-col h-full p-5 overflow-y-auto">
        <Link href={routes.home} className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <span className="font-heading text-lg font-bold text-heading">Cost Tracking</span>
        </Link>

        {/* Space Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2.5 text-sm font-medium text-heading transition hover:bg-surface outline-none mb-6">
            <Layers size={16} className="shrink-0 text-body" />
            <span className="flex-1 text-left truncate">
              {selectedSpace?.name ?? "All Spaces"}
            </span>
            <ChevronDown size={14} className="shrink-0 text-body" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            <DropdownMenuItem
              onClick={() => handleSelectSpace(null)}
              className="flex items-center gap-3 py-2"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                <Layers size={14} />
              </div>
              <span className="flex-1 text-sm font-medium">All Spaces</span>
              {!selectedSpace && (
                <Check size={14} className="shrink-0 text-primary ml-auto" />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {spaces.map((space) => (
              <DropdownMenuItem
                key={space.id}
                onClick={() => handleSelectSpace(space.slug)}
                className="flex items-center gap-3 py-2"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-xs font-bold text-heading">
                  {space.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {space.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {space.baseCurrencyCode} · {space.role}
                  </span>
                </div>
                {selectedSpace?.slug === space.slug && (
                  <Check size={14} className="shrink-0 text-primary ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Navigation */}
        <nav className="space-y-1 mb-6">
          {topNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary-lighter text-primary"
                    : "text-body hover:bg-surface-secondary hover:text-heading"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}

          {/* Finance group */}
          <div>
            <button
              onClick={() => setFinanceOpen(!financeOpen)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                financeActive && !financeOpen
                  ? "bg-primary-lighter text-primary"
                  : "text-body hover:bg-surface-secondary hover:text-heading"
              )}
            >
              <Wallet size={16} />
              Finance
              <ChevronDown
                size={14}
                className={cn(
                  "ml-auto transition-transform",
                  financeOpen && "rotate-180"
                )}
              />
            </button>
            {financeOpen && (
              <div className="ml-5 mt-1 space-y-0.5 border-l border-border pl-3">
                {financeNavItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.path}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "text-primary"
                          : "text-body hover:text-heading"
                      )}
                    >
                      <Icon size={14} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Space-only items (hidden when "All Spaces") */}
          {selectedSpace && (
            <>
              {spaceOnlyNavItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-primary-lighter text-primary"
                        : "text-body hover:bg-surface-secondary hover:text-heading"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Profile dropdown at bottom */}
        <div className="mt-auto">
          <div className="border-t border-border pt-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-secondary outline-none"
              >
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {user?.name
                      ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <span className="block text-sm font-medium text-heading truncate">
                    {user?.name ?? "User"}
                  </span>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" sideOffset={8} className="min-w-[220px]">
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href={routes.profile} />}>
                    <User size={14} />
                    My profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {user?.isPlatformAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem render={<Link href="/admin" />}>
                        <Shield size={14} />
                        Admin Panel
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}

                {isClerkConfigured && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                        <LogOut size={14} />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </aside>
  );
}
