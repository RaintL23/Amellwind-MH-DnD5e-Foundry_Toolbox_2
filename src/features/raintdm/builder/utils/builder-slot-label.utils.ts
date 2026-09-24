/**
 * Format a builder slot id into a short English label for the editing header.
 */
export function formatBuilderSlotLabel(slot: string | null): string {
  if (!slot) return "Slot";
  if (slot === "mainHand") return "Main Hand";
  if (slot === "offHand") return "Off Hand";
  if (slot === "origin-feat") return "Origin Feat";
  if (slot === "backstory") return "Backstory";
  if (slot.startsWith("spell-level-")) {
    const level = slot.replace("spell-level-", "");
    return level === "0" ? "Cantrips" : `Level ${level} Spells`;
  }
  if (slot.startsWith("feat-")) return `Feat Slot ${Number(slot.replace("feat-", "")) + 1}`;
  if (slot.startsWith("optional-feature-")) return "Optional Feature";
  if (slot.startsWith("optional-origin-feat-")) return "Origin Feat";
  if (slot.startsWith("multiclass-class-")) return "Multiclass";
  if (slot.startsWith("multiclass-subclass-")) return "Multiclass Subclass";
  if (slot.startsWith("bonus-cantrip-") || slot.startsWith("bonus-feat-spell-")) {
    return "Bonus Spells";
  }
  if (slot === "pact-spells") return "Pact Spells";
  // species, background, class, subclass, armor, faction, trinket1, …
  return slot
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/(\d+)$/, " $1");
}
