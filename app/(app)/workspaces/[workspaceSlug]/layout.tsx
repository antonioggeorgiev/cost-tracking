import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SaveWorkspaceSlug } from "@/components/save-workspace-slug";
import { getServerCaller } from "@/server/trpc-caller";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspaceSlug } = await params;
  const caller = await getServerCaller();
  const workspace = await caller.workspaces.bySlug({ workspaceSlug });

  if (!workspace) {
    notFound();
  }

  return (
    <>
      <SaveWorkspaceSlug slug={workspaceSlug} />
      {children}
      <BottomNav workspaceSlug={workspaceSlug} />
    </>
  );
}
