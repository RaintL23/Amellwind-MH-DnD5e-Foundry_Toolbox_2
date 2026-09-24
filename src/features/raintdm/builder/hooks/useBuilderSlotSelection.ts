import {
  EquipmentSlotType,
  CharacterIdentitySlot,
  BuilderFeatSlot,
  SpellLevelSlot,
  BuilderPactSpellSlot,
  BuilderBonusCantripSlot,
  BuilderBonusFeatSpellSlot,
  BuilderOptionalFeatureSlot,
  BuilderOptionalOriginFeatSlot,
  BuilderMulticlassClassSlot,
  BuilderMulticlassSubclassSlot,
} from "@/shared/types";
import { useBuilderSlotSelectionContext, type BuilderSlotSelectionContextValue } from "../context/BuilderSlotSelectionContext";
import { PACT_SPELL_SLOT } from "../utils/pact-magic.utils";
import { isBonusSpellPoolSlot } from "../utils/cantrip-pools.utils";

export type BuilderSlotSelection =
  | EquipmentSlotType
  | CharacterIdentitySlot
  | BuilderMulticlassClassSlot
  | BuilderMulticlassSubclassSlot
  | BuilderFeatSlot
  | SpellLevelSlot
  | BuilderPactSpellSlot
  | BuilderBonusCantripSlot
  | BuilderBonusFeatSpellSlot
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
): slot is SpellLevelSlot | BuilderPactSpellSlot | BuilderBonusCantripSlot | BuilderBonusFeatSpellSlot {
  return (
    isSpellLevelSlot(slot) ||
    isPactSpellSlot(slot) ||
    (typeof slot === "string" && isBonusSpellPoolSlot(slot))
  );
}

export function parseSpellLevel(slot: SpellLevelSlot): number {
  return parseInt(slot.replace("spell-level-", ""), 10);
}

export function toSpellLevelSlot(level: number): SpellLevelSlot {
  return `spell-level-${level}`;
}

/** Reads shared slot selection from BuilderSlotSelectionProvider. */
export function useBuilderSlotSelection(): BuilderSlotSelectionContextValue {
  return useBuilderSlotSelectionContext();
}
