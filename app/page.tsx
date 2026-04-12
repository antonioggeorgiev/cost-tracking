"use client";

import { redirect } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { routes } from "@/lib/routes";

export default function HomePage() {
  const lastSlug = useWorkspaceStore((s) => s.lastWorkspaceSlug);

  if (lastSlug) {
    return redirect(routes.workspace(lastSlug));
  }

  return redirect(routes.workspaces);
}
