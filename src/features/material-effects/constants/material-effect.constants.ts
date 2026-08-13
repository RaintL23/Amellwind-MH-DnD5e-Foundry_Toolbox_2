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
 * Activated / limited resistance (reaction, bonus action, or action; short duration;
 * uses per rest). Common Amellwind pattern — one step below always-on Rare.
 */
export const INLINE_LIMITED_DAMAGE_RESISTANCE_RARITY: ResourceRarity = "Uncommon";

/** Limited/activated damage immunity — one step below always-on Very Rare. */
export const INLINE_LIMITED_DAMAGE_IMMUNITY_RARITY: ResourceRarity = "Rare";

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

/**
 * Once-per-day (or similar) spell cast from a rune, by spell level.
 * Aligned with DMG 2024 Magic Item Power by Rarity (max spell level),
 * with Uncommon as the floor (runes are not Common consumables).
 */
export const INLINE_SPELL_CAST_RARITY_BY_LEVEL: Array<{
  maxLevel: number;
  rarity: ResourceRarity;
}> = [
  { maxLevel: 3, rarity: "Uncommon" },
  { maxLevel: 5, rarity: "Rare" },
  { maxLevel: 8, rarity: "Very Rare" },
];

export const INLINE_SPELL_CAST_LEGENDARY_RARITY: ResourceRarity = "Legendary";

export const UNKNOWN_MATERIAL_EFFECT_TIER = "Unknown" as const;

export type MaterialEffectTierFilter =
  | ResourceRarity
  | typeof UNKNOWN_MATERIAL_EFFECT_TIER;

export const MATERIAL_EFFECT_TIER_FILTER_OPTIONS: MaterialEffectTierFilter[] =
  [...MATERIAL_EFFECT_RARITIES, UNKNOWN_MATERIAL_EFFECT_TIER];

export const MATERIAL_EFFECT_INTRO =
  "Named material effects from Amellwind's Guide (Monster Hunter Monster Loot Table Material List). These are the reusable effect templates you can assign when creating loot tables — distinct from the rune materials tied to each monster.";
