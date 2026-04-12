import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceState = {
  lastWorkspaceSlug: string | null;
  setLastWorkspaceSlug: (slug: string) => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      lastWorkspaceSlug: null,
      setLastWorkspaceSlug: (slug) => set({ lastWorkspaceSlug: slug }),
    }),
    {
      name: "cost-tracking:workspace",
    },
  ),
);
