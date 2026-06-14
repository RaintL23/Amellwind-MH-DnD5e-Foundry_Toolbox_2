import { useState, useCallback } from "react";
import {
  EquipmentSlotType,
  CharacterIdentitySlot,
  BuilderFeatSlot,
  SpellLevelSlot,
  BuilderPactSpellSlot,
  BuilderOptionalFeatureSlot,
  BuilderOptionalOriginFeatSlot,
  BuilderMulticlassClassSlot,
  BuilderMulticlassSubclassSlot,
} from "@/shared/types";
import { PACT_SPELL_SLOT } from "../utils/pact-magic.utils";

export type BuilderSlotSelection =
  | EquipmentSlotType
  | CharacterIdentitySlot
  | BuilderMulticlassClassSlot
  | BuilderMulticlassSubclassSlot
  | BuilderFeatSlot
  | SpellLevelSlot
  | BuilderPactSpellSlot
  | BuilderOptionalFeatureSlot
  | BuilderOptionalOriginFeatSlot
  | null;

export function isSpellLevelSlot(
  slot: BuilderSlotSelection,
): slot is SpellLevelSlot {
  return typeof slot === "string" && slot.startsWith("spell-level-");
}

export function isPactSpellSlot(
  slot: BuilderSlotSelection,
): slot is BuilderPactSpellSlot {
  return slot === PACT_SPELL_SLOT;
}

export function isSpellPickerSlot(
  slot: BuilderSlotSelection,
): slot is SpellLevelSlot | BuilderPactSpellSlot {
  return isSpellLevelSlot(slot) || isPactSpellSlot(slot);
}

export function parseSpellLevel(slot: SpellLevelSlot): number {
  return parseInt(slot.replace("spell-level-", ""), 10);
}

export function toSpellLevelSlot(level: number): SpellLevelSlot {
  return `spell-level-${level}`;
}

export function useBuilderSlotSelection() {
  const [selectedSlot, setSelectedSlot] = useState<BuilderSlotSelection>(null);

  const selectSlot = useCallback((slot: BuilderSlotSelection) => {
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
