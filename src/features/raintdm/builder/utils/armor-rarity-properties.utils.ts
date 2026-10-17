/**
 * AGMH armor rarity properties: when armor reaches Rare, Very Rare and
 * Legendary it gains one property each — +1 AC, +1 to two skills, +1 to one
 * saving throw, or +1 to every saving throw you are not proficient in.
 */
import type {
  AbilityKey,
  ArmorRarityProperty,
  EquippedArmor,
  SkillKey,
} from "@/shared/types";
import { ABILITY_ORDER } from "@/shared/constants/dnd";

const RARITY_ORDER = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];

export const ARMOR_RARITY_PROPERTY_LABELS: Record<
  ArmorRarityProperty["kind"],
  string
> = {
  ac: "+1 bonus to AC",
  skills: "+1 to two skills of your choice",
  save: "+1 to a chosen saving throw",
  "unproficient-saves": "+1 to all saving throws you are not proficient with",
};

/** Number of property picks for a rarity (Rare 1, Very Rare 2, Legendary 3). */
export function getArmorRarityPropertyCount(rarity: string): number {
  const index = RARITY_ORDER.indexOf(rarity);
  return index < 2 ? 0 : index - 1;
}

/** Keeps the picks that still fit after a rarity change. */
export function fitArmorRarityProperties(
  properties: (ArmorRarityProperty | null)[] | undefined,
  rarity: string,
): (ArmorRarityProperty | null)[] {
  const count = getArmorRarityPropertyCount(rarity);
  const next = (properties ?? []).slice(0, count);
  while (next.length < count) next.push(null);
  return next;
}

export function isArmorRarityPropertyComplete(
  property: ArmorRarityProperty | null,
): boolean {
  if (!property) return false;
  if (property.kind === "skills") {
    return property.skills.length === 2 && property.skills.every(Boolean);
  }
  if (property.kind === "save") return !!property.ability;
  return true;
}

export interface ArmorRarityBonuses {
  ac: number;
  skills: Partial<Record<SkillKey, number>>;
  saves: Partial<Record<AbilityKey, number>>;
}

/** Bonuses granted by the equipped armor's rarity properties (Amellwind only). */
export function getArmorRarityBonuses(
  armor: EquippedArmor | null,
  isSaveProficient: (ability: AbilityKey) => boolean,
  useAmellwindHomebrew: boolean,
): ArmorRarityBonuses {
  const bonuses: ArmorRarityBonuses = { ac: 0, skills: {}, saves: {} };
  if (!armor || !useAmellwindHomebrew) return bonuses;

  for (const property of fitArmorRarityProperties(
    armor.rarityProperties,
    armor.rarity,
  )) {
    if (!property) continue;
    if (property.kind === "ac") {
      bonuses.ac += 1;
    } else if (property.kind === "skills") {
      for (const skill of property.skills) {
        if (skill) bonuses.skills[skill] = (bonuses.skills[skill] ?? 0) + 1;
      }
    } else if (property.kind === "save") {
      if (property.ability) {
        bonuses.saves[property.ability] =
          (bonuses.saves[property.ability] ?? 0) + 1;
      }
    } else {
      for (const ability of ABILITY_ORDER) {
        if (!isSaveProficient(ability)) {
          bonuses.saves[ability] = (bonuses.saves[ability] ?? 0) + 1;
        }
      }
    }
  }

  return bonuses;
}
