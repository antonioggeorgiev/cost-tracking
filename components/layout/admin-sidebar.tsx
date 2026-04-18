"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import {
  LayoutDashboard, Users, Building2, FolderTree, ArrowLeft,
  LogOut, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminSidebarProps = {
  user?: {
    name: string;
    email: string;
    imageUrl: string;
  };
};

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Spaces", icon: Building2, href: "/admin/spaces" },
  { label: "Categories", icon: FolderTree, href: "/admin/categories" },
] as const;

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[260px] lg:border-r lg:border-border lg:bg-surface">
      <div className="flex flex-col h-full p-5 overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-heading">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <div>
            <span className="font-heading text-lg font-bold text-heading">Cost Tracking</span>
            <span className="ml-2 rounded-md bg-primary-lighter px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Admin
            </span>
          </div>
        </Link>

        <nav className="space-y-1 mb-6">
          {adminNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
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

        <div className="border-t border-border pt-3 mb-6">
          <Link
            href={routes.spaces}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-body transition hover:bg-surface-secondary hover:text-heading"
          >
            <ArrowLeft size={16} />
            Back to App
          </Link>
        </div>

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
                    {user?.email ?? ""}
                  </span>
                </div>
                <ChevronUp
                  size={16}
                  className="shrink-0 text-body transition-transform group-data-[popup-open]:rotate-180"
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" sideOffset={8} className="min-w-[220px]">
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href={routes.spaces} />}>
                    <ArrowLeft size={14} />
                    Back to App
                  </DropdownMenuItem>
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
