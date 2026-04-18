"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

type SpaceInfo = {
  id: string;
  name: string;
  slug: string;
  baseCurrencyCode: string;
  role: string;
};

type SpaceContextValue = {
  spaces: SpaceInfo[];
  selectedSpace: SpaceInfo | null;
  spaceSlug: string | null;
};

const SpaceContext = createContext<SpaceContextValue>({
  spaces: [],
  selectedSpace: null,
  spaceSlug: null,
});

export function SpaceProvider({
  spaces,
  selectedSpace,
  children,
}: {
  spaces: SpaceInfo[];
  selectedSpace: SpaceInfo | null;
  children: ReactNode;
}) {
  return (
    <SpaceContext.Provider
      value={{
        spaces,
        selectedSpace,
        spaceSlug: selectedSpace?.slug ?? null,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  return useContext(SpaceContext);
}
