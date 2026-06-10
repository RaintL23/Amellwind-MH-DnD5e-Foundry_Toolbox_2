import { useState, useCallback } from "react";
import {
  EquipmentSlotType,
  CharacterIdentitySlot,
  BuilderFeatSlot,
  SpellLevelSlot,
} from "@/shared/types";

export type PaperDollSelection =
  | EquipmentSlotType
  | CharacterIdentitySlot
  | BuilderFeatSlot
  | SpellLevelSlot
  | null;

export function isSpellLevelSlot(
  slot: PaperDollSelection,
): slot is SpellLevelSlot {
  return typeof slot === "string" && slot.startsWith("spell-level-");
}

export function parseSpellLevel(slot: SpellLevelSlot): number {
  return parseInt(slot.replace("spell-level-", ""), 10);
}

export function toSpellLevelSlot(level: number): SpellLevelSlot {
  return `spell-level-${level}`;
}

export function usePaperDollSelection() {
  const [selectedSlot, setSelectedSlot] = useState<PaperDollSelection>(null);

  const selectSlot = useCallback((slot: PaperDollSelection) => {
    setSelectedSlot(slot);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  return {
    selectedSlot,
    selectSlot,
    clearSelection,
    setSelectedSlot,
  };
}
