"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import { LayoutDashboard, Receipt, RefreshCw, Landmark, Users, FolderTree, Settings, LogOut, ChevronDown, ChevronUp, User, Check, PlusCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes, WORKSPACE_SLUG_PATTERN } from "@/lib/routes";

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
] as const;

const financeNavItems = [
  { label: "Expenses", icon: Receipt, segment: "/expenses" },
  { label: "Recurring", icon: RefreshCw, segment: "/recurring" },
  { label: "Debts", icon: Landmark, segment: "/debts" },
] as const;

const bottomNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, segment: "/dashboard" },
  { label: "Categories", icon: FolderTree, segment: "/categories" },
  { label: "Members", icon: Users, segment: "/members" },
] as const;

export function DesktopSidebar({ workspaces, user }: DesktopSidebarProps) {
  const pathname = usePathname();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Derive active workspace from URL: /workspaces/[slug]/...
  const match = pathname.match(WORKSPACE_SLUG_PATTERN);
  const activeWorkspaceSlug = match?.[1] ?? null;
  const base = activeWorkspaceSlug ? routes.workspace(activeWorkspaceSlug) : null;
  const activeWorkspace = workspaces.find((w) => w.slug === activeWorkspaceSlug);

  const settingsActive = base ? pathname.startsWith(base + "/settings") || pathname.startsWith(base + "/profile") : false;
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  const financeActive = base ? financeNavItems.some((item) => pathname.startsWith(base + item.segment)) : false;
  const [financeOpen, setFinanceOpen] = useState(true);

  // Close popover on click outside
  useEffect(() => {
    if (!popoverOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

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

            {/* Settings dropdown */}
            <div>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  settingsActive
                    ? "bg-primary-lighter text-primary"
                    : "text-body hover:bg-surface-secondary hover:text-heading"
                )}
              >
                <Settings size={16} />
                Settings
                <ChevronDown
                  size={14}
                  className={cn(
                    "ml-auto transition-transform",
                    settingsOpen && "rotate-180"
                  )}
                />
              </button>
              {settingsOpen && (
                <div className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
                  <Link
                    href={base + "/settings"}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive("/settings")
                        ? "text-primary"
                        : "text-body hover:text-heading"
                    )}
                  >
                    <Settings size={14} />
                    Workspace
                  </Link>
                  <Link
                    href={base + "/profile"}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive("/profile")
                        ? "text-primary"
                        : "text-body hover:text-heading"
                    )}
                  >
                    <User size={14} />
                    Profile
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Profile button + popover at bottom */}
        <div className="mt-auto relative">
          {/* Popover */}
          {popoverOpen && (
            <div
              ref={popoverRef}
              className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border bg-surface shadow-lg"
            >
              {workspaces.length > 0 && (
                <div className="p-2">
                  <p className="mb-1 px-2 pt-1 text-xs font-semibold uppercase tracking-widest text-body">
                    Workspaces
                  </p>
                  <div className="space-y-0.5">
                    {workspaces.map((workspace) => (
                      <Link
                        key={workspace.id}
                        href={routes.workspace(workspace.slug)}
                        onClick={() => setPopoverOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-2 transition",
                          activeWorkspaceSlug === workspace.slug
                            ? "bg-surface-secondary"
                            : "hover:bg-surface-secondary"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-heading truncate">
                            {workspace.name}
                          </span>
                          <span className="block text-xs text-body">
                            {workspace.baseCurrencyCode} · {workspace.role}
                          </span>
                        </div>
                        {activeWorkspaceSlug === workspace.slug && (
                          <Check size={14} className="shrink-0 text-primary" />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {isClerkConfigured && (
                <>
                  <div className="border-t border-border" />
                  <div className="p-2">
                    <SignOutButton>
                      <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-body transition hover:bg-surface-secondary hover:text-heading">
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </SignOutButton>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Profile trigger button */}
          <div className="border-t border-border pt-3">
            <button
              ref={buttonRef}
              onClick={() => setPopoverOpen((prev) => !prev)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-secondary"
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
                className={cn(
                  "shrink-0 text-body transition-transform",
                  popoverOpen && "rotate-180"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
