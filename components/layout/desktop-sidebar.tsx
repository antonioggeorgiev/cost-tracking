"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import {
  Activity, Receipt, RefreshCw, Landmark, FolderTree, Settings, LogOut,
  ChevronDown, ChevronUp, User, Check, PlusCircle, Wallet,
  ArrowLeftRight, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { routes, WORKSPACE_SLUG_PATTERN } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DesktopSidebarProps = {
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    baseCurrencyCode: string;
    role: string;
  }>;
  user?: {
    name: string;
    email: string;
    imageUrl: string;
  };
};

const topNavItems = [
  { label: "Quick Add", icon: PlusCircle, segment: "" },
  { label: "Overview", icon: Activity, segment: "/overview" },
] as const;

const financeNavItems = [
  { label: "Expenses", icon: Receipt, segment: "/expenses" },
  { label: "Recurring", icon: RefreshCw, segment: "/recurring" },
  { label: "Debts", icon: Landmark, segment: "/debts" },
] as const;

const bottomNavItems = [
  { label: "Categories", icon: FolderTree, segment: "/categories" },
] as const;

export function DesktopSidebar({ workspaces, user }: DesktopSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  // Derive active workspace from URL: /workspaces/[slug]/...
  const match = pathname.match(WORKSPACE_SLUG_PATTERN);
  const activeWorkspaceSlug = match?.[1] ?? null;
  const base = activeWorkspaceSlug ? routes.workspace(activeWorkspaceSlug) : null;
  const activeWorkspace = workspaces.find((w) => w.slug === activeWorkspaceSlug);

  const financeActive = base ? financeNavItems.some((item) => pathname.startsWith(base + item.segment)) : false;
  const [financeOpen, setFinanceOpen] = useState(true);

  function isActive(segment: string) {
    if (!base) return false;
    const target = base + segment;
    if (segment === "") {
      return pathname === target;
    }
    return pathname.startsWith(target);
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[260px] lg:border-r lg:border-border lg:bg-surface">
      <div className="flex flex-col h-full p-5 overflow-y-auto">
        <Link href={routes.home} className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <span className="font-heading text-lg font-bold text-heading">Cost Tracking</span>
        </Link>

        {base && (
          <nav className="space-y-1 mb-6">
            {topNavItems.map((item) => {
              const active = isActive(item.segment);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={base + item.segment}
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
                    const active = isActive(item.segment);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={base + item.segment}
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

            {bottomNavItems.map((item) => {
              const active = isActive(item.segment);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={base + item.segment}
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
          </nav>
        )}

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
                  <span className="block text-xs text-body truncate">
                    {activeWorkspace?.name ?? "No workspace"}
                  </span>
                </div>
                <ChevronUp
                  size={16}
                  className="shrink-0 text-body transition-transform group-data-[popup-open]:rotate-180"
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" sideOffset={8} className="min-w-[220px]">
                {/* Workspace section */}
                <DropdownMenuGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowLeftRight size={14} />
                      Switch workspace
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="min-w-[220px]">
                      {workspaces.map((workspace) => (
                        <DropdownMenuItem
                          key={workspace.id}
                          render={<Link href={routes.workspace(workspace.slug)} />}
                          className="flex items-center gap-3 py-2"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-xs font-bold text-heading">
                            {workspace.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate">
                              {workspace.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {workspace.baseCurrencyCode} · {workspace.role}
                            </span>
                          </div>
                          {activeWorkspaceSlug === workspace.slug && (
                            <Check size={14} className="shrink-0 text-primary ml-auto" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  {base && (
                    <>
                      <DropdownMenuItem render={<Link href={base + "/settings"} />}>
                        <Settings size={14} />
                        Workspace settings
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href={base + "/members"} />}>
                        <Users size={14} />
                        Team members
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Account section */}
                <DropdownMenuGroup>
                  {base && (
                    <DropdownMenuItem render={<Link href={base + "/profile"} />}>
                      <User size={14} />
                      My profile
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>

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
