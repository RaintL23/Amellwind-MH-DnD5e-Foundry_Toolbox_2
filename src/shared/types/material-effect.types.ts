import type { ResourceRarity } from "./resource.types";

export type MaterialEffectSlot = "weapon" | "armor";

export interface MaterialEffect {
  id: string;
  name: string;
  effect: string;
  summary: string;
  slot: MaterialEffectSlot;
  rarity: ResourceRarity;
  /** Points to a named material on a monster loot table instead of a standalone rule. */
  isReference: boolean;
}

export const MATERIAL_EFFECT_SLOT_LABELS: Record<MaterialEffectSlot, string> = {
  weapon: "Weapon",
  armor: "Armor",
};
