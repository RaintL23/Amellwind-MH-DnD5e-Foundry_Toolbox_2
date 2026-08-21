import type { MaterialEffectSlot, ResourceRarity } from "@/shared/types";

/**
 * Rarity assignments for named MHMM rune effects that are not in the GTMH
 * catalog. Key = `${slot}:${normalized name}` (lowercase, no trailing period).
 */
const DISCOVERED_EFFECT_RARITY_BY_KEY: Record<string, ResourceRarity> = {
  "armor:flexible leathercraft": "Common",
};

function overlayKey(slot: MaterialEffectSlot, name: string): string {
  return `${slot}:${name.replace(/\.$/, "").trim().toLowerCase()}`;
}

/** Assigned rarity for a discovered named effect, or null if still unclassified. */
export function lookupDiscoveredEffectRarity(
  name: string,
  slot: MaterialEffectSlot,
): ResourceRarity | null {
  return DISCOVERED_EFFECT_RARITY_BY_KEY[overlayKey(slot, name)] ?? null;
}
