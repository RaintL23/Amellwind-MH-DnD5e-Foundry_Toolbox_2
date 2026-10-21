import { isFeatSlotSelection, isOptionalOriginFeatSlot } from "./builder-class.utils";
import {
  isMulticlassClassSlot,
  isMulticlassSpellSlot,
  isMulticlassSubclassSlot,
  parseMulticlassSpellSlot,
} from "./multiclass.utils";
import { isBonusSpellPoolSlot } from "./cantrip-pools.utils";
import {
  isOptionalFeatureSlot,
  parseOptionalFeatureSlot,
} from "./class-optional-features.utils";

/**
 * Format a builder slot id into a short English label for the editing header.
 * `progressionNames` maps optional-feature progression ids to their display
 * name (e.g. "Weapon Mastery"); without it those slots read "Optional Feature".
 */
export function formatBuilderSlotLabel(
  slot: string | null,
  progressionNames?: Readonly<Record<string, string>>,
): string {
  if (!slot) return "Slot";
  if (isMulticlassSpellSlot(slot)) {
    const { index, innerSlot } = parseMulticlassSpellSlot(slot);
    return `Class ${index + 2} · ${formatBuilderSlotLabel(innerSlot)}`;
  }
  if (slot === "mainHand") return "Main Hand";
  if (slot === "offHand") return "Off Hand";
  if (slot === "origin-feat" || isOptionalOriginFeatSlot(slot)) {
    return "Origin Feat";
  }
  if (slot === "backstory") return "Backstory";
  if (slot === "spell-pact") return "Pact Spells";
  if (slot.startsWith("spell-level-")) {
    const level = slot.replace("spell-level-", "");
    return level === "0" ? "Cantrips" : `Level ${level} Spells`;
  }
  if (isBonusSpellPoolSlot(slot)) return "Bonus Spells";
  if (isFeatSlotSelection(slot)) {
    return `Feat Slot ${Number(slot.replace("feat-", "")) + 1}`;
  }
  if (isOptionalFeatureSlot(slot)) {
    const progressionId = parseOptionalFeatureSlot(slot)?.progressionId;
    return (progressionId && progressionNames?.[progressionId]) || "Optional Feature";
  }
  if (isMulticlassClassSlot(slot)) return "Multiclass";
  if (isMulticlassSubclassSlot(slot)) return "Multiclass Subclass";
  // species, background, class, subclass, armor, faction, trinket1, …
  return slot
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/(\d+)$/, " $1");
}
