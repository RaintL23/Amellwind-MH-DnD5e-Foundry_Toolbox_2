import { createContext, useContext } from "react";
import type { MaterialEffect, MaterialEffectSlot } from "@/shared/types";

export interface MaterialEffectLinkValue {
  /** Catalog entry for a name (optionally narrowed by slot), or null while loading / unknown. */
  find: (name: string, slot?: MaterialEffectSlot) => MaterialEffect | null;
  open: (effect: MaterialEffect) => void;
}

export const MaterialEffectLinkContext = createContext<MaterialEffectLinkValue>({
  find: () => null,
  open: () => undefined,
});

export function useMaterialEffectLink(): MaterialEffectLinkValue {
  return useContext(MaterialEffectLinkContext);
}
