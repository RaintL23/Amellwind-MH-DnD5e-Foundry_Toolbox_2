import {
  ARTIFICER_BONUS_MATERIAL_SLOTS_TOOLTIP,
  getArtificerBonusMaterialSlots,
} from "@/shared/utils/artificer-material-slots.utils";

const BASE_ATTUNEMENT_SLOTS = 3;

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
    ? getArtificerBonusMaterialSlots(level)
    : 0;

  let tooltip: string | undefined;
  if (isArtificer && artificerBonusMaterialSlots > 0) {
    tooltip = ARTIFICER_BONUS_MATERIAL_SLOTS_TOOLTIP;
  }

  return {
    attunementSlots: BASE_ATTUNEMENT_SLOTS,
    isArtificer,
    artificerBonusMaterialSlots,
    tooltip,
  };
}
