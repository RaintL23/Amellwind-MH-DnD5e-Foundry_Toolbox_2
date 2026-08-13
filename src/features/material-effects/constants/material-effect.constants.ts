import type { MaterialEffectSlot } from "@/shared/types";
import type { ResourceRarity } from "@/shared/types";

export type MaterialEffectFiltersState = {
  name: string;
  slot: MaterialEffectSlot[];
  rarity: ResourceRarity[];
};

export const MATERIAL_EFFECT_RARITIES: ResourceRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
];

/** Always-on damage resistance in rune text (Armor of Resistance / Ring of Resistance). */
export const INLINE_DAMAGE_RESISTANCE_RARITY: ResourceRarity = "Rare";

/** Always-on damage immunity in rune text (one step above resistance). */
export const INLINE_DAMAGE_IMMUNITY_RARITY: ResourceRarity = "Very Rare";

/**
 * Always-on "extra NdX damage" weapon text, by dice score (n × faces or flat amount).
 * Aligns with Dragon's Wrath / Flame Tongue-style scaling and rune `extra-damage` tags.
 */
export const INLINE_EXTRA_DAMAGE_RARITY_BY_SCORE: Array<{
  maxScore: number;
  rarity: ResourceRarity;
}> = [
  { maxScore: 6, rarity: "Uncommon" },
  { maxScore: 12, rarity: "Rare" },
  { maxScore: 20, rarity: "Very Rare" },
];

export const INLINE_EXTRA_DAMAGE_LEGENDARY_RARITY: ResourceRarity = "Legendary";

export const UNKNOWN_MATERIAL_EFFECT_TIER = "Unknown" as const;

export type MaterialEffectTierFilter =
  | ResourceRarity
  | typeof UNKNOWN_MATERIAL_EFFECT_TIER;

export const MATERIAL_EFFECT_TIER_FILTER_OPTIONS: MaterialEffectTierFilter[] =
  [...MATERIAL_EFFECT_RARITIES, UNKNOWN_MATERIAL_EFFECT_TIER];

export const MATERIAL_EFFECT_INTRO =
  "Named material effects from Amellwind's Guide (Monster Hunter Monster Loot Table Material List). These are the reusable effect templates you can assign when creating loot tables — distinct from the rune materials tied to each monster.";
