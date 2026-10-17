/**
 * Standing AC bonuses from Amellwind gear: armor materials (rule 3: one AC
 * material per armor), the active trinket's armor material and the armor's
 * Rare+ "+1 AC" rarity property.
 */
import type { EquippedArmor, EquippedTrinket, Rune } from "@/shared/types";
import {
  grantsAcBonusToWearer,
  parseAcBonusAmount,
} from "@/features/amellwind/material-effects/utils/inline-ac-bonus-rarity.utils";
import { isLimitedFlatBonus } from "@/features/amellwind/material-effects/utils/inline-flat-bonus-rarity.utils";
import { getArmorRarityBonuses } from "./armor-rarity-properties.utils";
import { getActiveTrinket, getTrinketMaterialEffect } from "./trinket.utils";

export interface AcBonusLine {
  label: string;
  amount: number;
}

/** Always-on +N AC from a material (reaction / active bonuses are excluded). */
export function getMaterialStandingAcBonus(rune: Rune): number {
  if (!grantsAcBonusToWearer(rune)) return 0;
  if (isLimitedFlatBonus(rune.armorTags)) return 0;
  return parseAcBonusAmount(rune.armorEffect ?? "") ?? 0;
}

export function collectAmellwindAcBonuses(options: {
  armor: EquippedArmor | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;
  useAmellwindHomebrew: boolean;
}): AcBonusLine[] {
  const { armor, trinket1, trinket2, useAmellwindHomebrew } = options;
  if (!useAmellwindHomebrew || !armor) return [];

  const lines: AcBonusLine[] = [];

  const armorMaterial = armor.runes
    .filter((rune): rune is Rune => !!rune)
    .map((rune) => ({ rune, amount: getMaterialStandingAcBonus(rune) }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];
  if (armorMaterial) {
    lines.push({
      label: `${armorMaterial.rune.name} (armor material)`,
      amount: armorMaterial.amount,
    });
  }

  // Trinket armor materials only work while wearing the attuned armor.
  const trinket = getActiveTrinket(trinket1, trinket2);
  if (trinket?.rune && getTrinketMaterialEffect(trinket) === "armor") {
    const amount = getMaterialStandingAcBonus(trinket.rune);
    if (amount > 0) {
      lines.push({
        label: `${trinket.rune.name} (trinket: ${trinket.name})`,
        amount,
      });
    }
  }

  const rarityAc = getArmorRarityBonuses(armor, () => false, true).ac;
  if (rarityAc > 0) {
    lines.push({ label: `${armor.rarity} armor property`, amount: rarityAc });
  }

  return lines;
}
