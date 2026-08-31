import type { MaterialEffectSlot, ResourceRarity } from "@/shared/types";

/**
 * Rarity assignments for named MHMM rune effects that are not in the GTMH
 * catalog. Key = `${slot}:${normalized name}` (lowercase, no trailing period).
 */
const DISCOVERED_EFFECT_RARITY_BY_KEY: Record<string, ResourceRarity> = {
  "armor:flexible leathercraft": "Common",
  /** Always-on DoT cleanse at start of turn (Khezu / Gigginox / Red Khezu). */
  "armor:recovery level": "Rare",

  "weapon:fastcharge": "Uncommon",
  "weapon:fastcharge+": "Rare",
  "weapon:fastcharge+2": "Rare",

  "armor:divine blessing": "Rare",
  "armor:divine blessing+": "Rare",
  "armor:divine blessing+2": "Very Rare",
  "armor:divine blessing+3": "Very Rare",
  "armor:divine blessing+4": "Legendary",
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
