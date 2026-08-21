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
 * Once-per-day (or similar) spell cast or expended-slot recovery from a rune,
 * by spell / slot level. Common floor for cantrips / 1st-level grants; higher
 * levels step up (2nd–3rd Uncommon, 4th–5th Rare, …).
 */
export const INLINE_SPELL_CAST_RARITY_BY_LEVEL: Array<{
  maxLevel: number;
  rarity: ResourceRarity;
}> = [
  { maxLevel: 1, rarity: "Common" },
  { maxLevel: 3, rarity: "Uncommon" },
  { maxLevel: 5, rarity: "Rare" },
  { maxLevel: 8, rarity: "Very Rare" },
];

export const INLINE_SPELL_CAST_LEGENDARY_RARITY: ResourceRarity = "Legendary";

/**
 * Nat-20 rider (~5%) whose only payoff is a push and no extra damage.
 * Weaker than even a 1/day cantrip, so it sits at Common.
 */
export const INLINE_ROLL20_PUSH_NO_DAMAGE_RARITY: ResourceRarity = "Common";

/**
 * Reaction to make an attack with a natural weapon or unarmed strike
 * (no listed extra dice). Similar action economy to limited resistance.
 */
export const INLINE_REACTION_ATTACK_RARITY: ResourceRarity = "Uncommon";

/**
 * Extended hold-breath underwater (twice as long). Mild always-on utility —
 * weaker than full water breathing + swim speed.
 */
export const INLINE_HOLD_BREATH_UNDERWATER_RARITY: ResourceRarity = "Common";

/**
 * MH field gather that doubles a single resource type (Botanist / Expert Fisherman).
 * Core hunt-loop utility — Uncommon floor.
 */
export const INLINE_GATHER_RESOURCES_RARITY: ResourceRarity = "Uncommon";

/**
 * Stronger gather (extra 1d4, party double, free gather on high check).
 * One step above the x2 base skills.
 */
export const INLINE_GATHER_RESOURCES_MAJOR_RARITY: ResourceRarity = "Rare";

/**
 * Once-per-rest recovery of a class pool (ki / Channel Divinity–style).
 * Aligns with unleveled spell-slot recovery (Arcane Recovery boost) at Uncommon.
 */
export const INLINE_CLASS_RESOURCE_RECOVERY_RARITY: ResourceRarity = "Uncommon";

/**
 * Flat attack-range bump (Deadeye +20 ft). Mild always-on utility.
 */
export const INLINE_ATTACK_RANGE_RARITY: ResourceRarity = "Common";

/**
 * Doubled normal attack range (Deadeye+ / underwater). One step above +N ft.
 */
export const INLINE_ATTACK_RANGE_MAJOR_RARITY: ResourceRarity = "Uncommon";

/**
 * Limited-use advantage on an attack roll (Aim Booster: BA, ½ PB / long rest).
 * Always-on attack advantage sits one step higher.
 */
export const INLINE_ATTACK_ADVANTAGE_LIMITED_RARITY: ResourceRarity = "Uncommon";

/** Always-on advantage on attack rolls (no action economy / rest gate). */
export const INLINE_ATTACK_ADVANTAGE_ALWAYS_RARITY: ResourceRarity = "Rare";

/**
 * Always-on alternate movement modes (burrow / swim / climb) or +10 ft walk.
 */
export const INLINE_MOVEMENT_MODE_RARITY: ResourceRarity = "Uncommon";

/** Mild walk bump (+5 ft Marathon Runner). */
export const INLINE_WALKING_SPEED_MINOR_RARITY: ResourceRarity = "Common";

/**
 * Ice/snow surface mobility (Boots of the Winterlands–adjacent: climb icy
 * surfaces without checks + ignore ice/snow difficult terrain).
 */
export const INLINE_ICY_SURFACES_RARITY: ResourceRarity = "Uncommon";

/** Always-on flying speed below 60 ft (Winged Boots–adjacent). */
export const INLINE_FLYING_SPEED_RARITY: ResourceRarity = "Rare";

/** Always-on flying speed 60+ ft. */
export const INLINE_FLYING_SPEED_MAJOR_RARITY: ResourceRarity = "Very Rare";

/**
 * Always-on advantage on saves against one condition (e.g. poisoned).
 * Milder than condition immunity; Common floor for unnamed inline text.
 */
export const INLINE_CONDITION_SAVE_ADVANTAGE_RARITY: ResourceRarity = "Common";

/**
 * Always-on immunity to a named condition (poisoned, stunned, …).
 * Stronger than save advantage; below always-on damage immunity (Rare+).
 */
export const INLINE_CONDITION_IMMUNITY_RARITY: ResourceRarity = "Uncommon";

/**
 * Mild always-on illumination (shed bright/dim light, Moon-touched–style).
 * Weaker than darkvision; Common floor.
 */
export const INLINE_LIGHT_RARITY: ResourceRarity = "Common";

/**
 * Always-on darkvision grant (Goggles of Night–adjacent).
 */
export const INLINE_DARKVISION_RARITY: ResourceRarity = "Uncommon";

/**
 * See normally in magical darkness (Devil's Sight–adjacent / Gaismagorm).
 * One step above plain darkvision.
 */
export const INLINE_MAGICAL_DARKNESS_SIGHT_RARITY: ResourceRarity = "Rare";

export const UNKNOWN_MATERIAL_EFFECT_TIER = "Unknown" as const;

export type MaterialEffectTierFilter =
  | ResourceRarity
  | typeof UNKNOWN_MATERIAL_EFFECT_TIER;

export const MATERIAL_EFFECT_TIER_FILTER_OPTIONS: MaterialEffectTierFilter[] =
  [...MATERIAL_EFFECT_RARITIES, UNKNOWN_MATERIAL_EFFECT_TIER];

export const MATERIAL_EFFECT_INTRO =
  "Named material effects from Amellwind's Guide (Monster Hunter Monster Loot Table Material List). These are the reusable effect templates you can assign when creating loot tables — distinct from the rune materials tied to each monster.";
