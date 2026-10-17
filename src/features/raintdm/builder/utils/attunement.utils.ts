import type { BuilderMulticlassEntry } from "@/shared/types";
import {
  ARTIFICER_BONUS_MATERIAL_LEVELS,
  ARTIFICER_BONUS_MATERIAL_SLOTS_TOOLTIP,
  getArtificerBonusMaterialSlots,
} from "@/shared/utils/artificer-material-slots.utils";
import { getPrimaryClassLevel } from "./multiclass.utils";

const BASE_ATTUNEMENT_SLOTS = 3;
/** AGMH: attunement covers one weapon, one armor and two trinkets. */
const AMELLWIND_ATTUNED_ITEMS = 4;

export interface AttunementInfo {
  /**
   * D&D: magic item attunement slots (Artificer: 4/5/6 at 10/14/18).
   * Amellwind: attuned gear (weapon + armor + two trinkets).
   */
  attunementSlots: number;
  isArtificer: boolean;
  /** Extra material slots on weapon and armor (Artificer Amellwind rule). */
  artificerBonusMaterialSlots: number;
  tooltip?: string;
}

function isArtificerName(name: string | null | undefined): boolean {
  return name?.trim().toLowerCase() === "artificer";
}

/** Artificer class levels in the build (primary class or multiclass entries). */
export function getArtificerLevel(
  primaryClassName: string | null | undefined,
  totalLevel: number,
  multiclassEntries: BuilderMulticlassEntry[] = [],
): number {
  if (isArtificerName(primaryClassName)) {
    return getPrimaryClassLevel(totalLevel, multiclassEntries);
  }
  return multiclassEntries
    .filter((entry) => isArtificerName(entry.classRef?.name))
    .reduce((sum, entry) => sum + entry.level, 0);
}

export function getAttunementInfo(
  artificerLevel: number,
  useAmellwindHomebrew: boolean,
): AttunementInfo {
  const isArtificer = artificerLevel > 0;

  if (useAmellwindHomebrew) {
    const artificerBonusMaterialSlots =
      getArtificerBonusMaterialSlots(artificerLevel);
    return {
      attunementSlots: AMELLWIND_ATTUNED_ITEMS,
      isArtificer,
      artificerBonusMaterialSlots,
      tooltip:
        artificerBonusMaterialSlots > 0
          ? ARTIFICER_BONUS_MATERIAL_SLOTS_TOOLTIP
          : undefined,
    };
  }

  // Magic Item Adept / Savant / Master share the AGMH breakpoints (10/14/18).
  const artificerAttunement = ARTIFICER_BONUS_MATERIAL_LEVELS.filter(
    (level) => artificerLevel >= level,
  ).length;
  return {
    attunementSlots: BASE_ATTUNEMENT_SLOTS + artificerAttunement,
    isArtificer,
    artificerBonusMaterialSlots: 0,
  };
}
