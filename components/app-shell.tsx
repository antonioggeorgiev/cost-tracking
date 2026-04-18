import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

type SpaceInfo = {
  id: string;
  name: string;
  slug: string;
  baseCurrencyCode: string;
  role: string;
};

type AppShellProps = {
  children: ReactNode;
  spaces?: SpaceInfo[];
  selectedSpace?: SpaceInfo | null;
  user?: {
    name: string;
    email: string;
    imageUrl: string;
    isPlatformAdmin?: boolean;
  };
};

export function AppShell({ children, spaces = [], selectedSpace, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <DesktopSidebar spaces={spaces} selectedSpace={selectedSpace ?? null} user={user} />

      <div className="lg:pl-[260px]">
        <TopBar />

        <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-[960px] space-y-6">
            {children}
          </div>
        </main>
      </div>

      <BottomNav selectedSpace={selectedSpace ?? null} />
    </div>
  );
}
