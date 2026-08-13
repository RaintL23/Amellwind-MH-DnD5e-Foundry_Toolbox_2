import { useEffect, useState } from "react";
import type { MaterialEffectSlot } from "@/shared/types";
import {
  getMaterialEffectNameIndex,
  type MaterialEffectNameIndex,
} from "../services/material-effect.service";

export function useMaterialEffectNameIndex(): MaterialEffectNameIndex | null {
  const [index, setIndex] = useState<MaterialEffectNameIndex | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMaterialEffectNameIndex().then((data) => {
      if (!cancelled) setIndex(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return index;
}

export function useMaterialEffectNames(
  slot: MaterialEffectSlot,
  index: MaterialEffectNameIndex | null,
): string[] {
  if (!index) return [];
  return index.bySlot[slot];
}
