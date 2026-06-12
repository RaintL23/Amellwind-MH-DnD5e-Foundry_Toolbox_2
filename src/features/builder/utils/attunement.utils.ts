const BASE_ATTUNEMENT_SLOTS = 3;

const ARTIFICER_BONUS_MATERIAL_LEVELS = [10, 14, 18] as const;

export interface AttunementInfo {
  /** Standard magic item attunement slots (always 3 in Amellwind). */
  attunementSlots: number;
  isArtificer: boolean;
  /** Extra material slots on weapon and armor (Artificer Amellwind rule). */
  artificerBonusMaterialSlots: number;
  tooltip?: string;
}

export function getAttunementInfo(
  className: string | null | undefined,
  level: number,
): AttunementInfo {
  const isArtificer = className?.toLowerCase() === "artificer";
  const artificerBonusMaterialSlots = isArtificer
    ? ARTIFICER_BONUS_MATERIAL_LEVELS.filter((lv) => level >= lv).length
    : 0;

  let tooltip: string | undefined;
  if (isArtificer && artificerBonusMaterialSlots > 0) {
    tooltip =
      "Amellwind: Artificers do not gain extra attunement slots. Instead, +1 material slot on weapon and armor at levels 10, 14, and 18.";
  }

  return {
    attunementSlots: BASE_ATTUNEMENT_SLOTS,
    isArtificer,
    artificerBonusMaterialSlots,
    tooltip,
  };
}
