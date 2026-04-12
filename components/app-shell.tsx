import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

type AppShellProps = {
  children: ReactNode;
  workspaces?: Array<{
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

export function AppShell({ children, workspaces = [], user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <DesktopSidebar workspaces={workspaces} user={user} />

      <div className="lg:pl-[260px]">
        <TopBar />

        <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-[960px] space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
