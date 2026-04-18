import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

type AdminShellProps = {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    imageUrl: string;
  };
};

export function AdminShell({ children, user }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar user={user} />

      <div className="lg:pl-[260px]">
        <TopBar />

        <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-[1200px] space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
