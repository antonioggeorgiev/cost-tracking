import { create } from "zustand";
import { persist } from "zustand/middleware";

type SpaceState = {
  lastSpaceSlug: string | null;
  setLastSpaceSlug: (slug: string) => void;
};

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set) => ({
      lastSpaceSlug: null,
      setLastSpaceSlug: (slug) => set({ lastSpaceSlug: slug }),
    }),
    {
      name: "cost-tracking:space",
    },
  ),
);
