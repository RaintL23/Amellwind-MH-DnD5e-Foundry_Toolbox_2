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

export const MATERIAL_EFFECT_INTRO =
  "Named material effects from Amellwind's Guide (Monster Hunter Monster Loot Table Material List). These are the reusable effect templates you can assign when creating loot tables — distinct from the rune materials tied to each monster.";
