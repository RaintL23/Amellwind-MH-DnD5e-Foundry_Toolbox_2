/** Amellwind: +1 material slot on weapon and armor at artificer levels 10, 14, and 18. */
export const ARTIFICER_BONUS_MATERIAL_LEVELS = [10, 14, 18] as const;

export function getArtificerBonusMaterialSlots(level: number): number {
  return ARTIFICER_BONUS_MATERIAL_LEVELS.filter((lv) => level >= lv).length;
}

export const ARTIFICER_BONUS_MATERIAL_SLOTS_TOOLTIP =
  "Amellwind: Artificers do not gain extra attunement slots. Instead, +1 material slot on weapon and armor at levels 10, 14, and 18.";
