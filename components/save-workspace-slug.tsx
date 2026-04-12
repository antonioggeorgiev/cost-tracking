"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function SaveWorkspaceSlug({ slug }: { slug: string }) {
  const setLastWorkspaceSlug = useWorkspaceStore((s) => s.setLastWorkspaceSlug);

  useEffect(() => {
    setLastWorkspaceSlug(slug);
  }, [slug, setLastWorkspaceSlug]);

  return null;
}
