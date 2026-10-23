import type { AbilityScores, ArmorClass, DamageType } from "@/shared/types";
import type { Species } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { detectNaturalArmorFromTraits } from "@/shared/utils/species-natural-armor";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

const GENERIC_SHIELD_AC = 2;

/** Worn armor named in `defaultAcFrom`: base AC and Dex cap (PHB). */
const ARMOR_FORMULAS: Array<{ pattern: RegExp; base: number; dexCap: number }> = [
  { pattern: /studded leather/i, base: 12, dexCap: Infinity },
  { pattern: /\bleather armor\b/i, base: 11, dexCap: Infinity },
  { pattern: /\bhide armor\b/i, base: 12, dexCap: 2 },
  { pattern: /\bchain shirt\b/i, base: 13, dexCap: 2 },
  { pattern: /\bfine clothes\b|\bunarmored\b/i, base: 10, dexCap: Infinity },
];

/** AC for formula templates ("unarmored-dex" / "unarmored-dex-max2"), honoring the named armor. */
function getFormulaArmorAc(template: NpcTemplate, dexMod: number): number {
  const armor = ARMOR_FORMULAS.find(({ pattern }) =>
    pattern.test(template.defaultAcFrom),
  );
  let ac = armor
    ? armor.base + Math.min(armor.dexCap, dexMod)
    : template.defaultAc === "unarmored-dex"
      ? 10 + dexMod
      : 11 + Math.min(2, dexMod);
  // Barkskin: AC can't be lower than 16.
  if (/barkskin/i.test(template.defaultAcFrom)) ac = Math.max(ac, 16);
  return ac;
}

/**
 * Compute the ArmorClass array for a generated NPC, taking into account:
 *  - Species natural armor (e.g. Tortle / elder-dragon base AC) including
 *    whether the species blocks worn armor.
 *  - Template base AC (fixed number or unarmored formula).
 *  - Optional shield bonus from MH weapon.
 *  - Power-profile AC bonus from upgraded armor quality (suppressed when the
 *    species blocks armor).
 */
export function resolveNpcArmorClass(
  template: NpcTemplate,
  abilities: AbilityScores,
  species: Species,
  shieldBonus = 0,
  powerAcBonus = 0,
): ArmorClass[] {
  const dexMod = getAbilityModifier(abilities.dex);

  const naturalArmor = detectNaturalArmorFromTraits(
    species.traits,
    species.name,
  );

  if (naturalArmor) {
    const base = naturalArmor.includesDex
      ? naturalArmor.baseAc + dexMod
      : naturalArmor.baseAc;

    const shield = naturalArmor.allowsShield ? shieldBonus : 0;
    const from: string[] = [naturalArmor.featureName];
    if (shield > 0) from.push(`+${shield} MH shield`);

    return [{ ac: base + shield, from }];
  }

  // No natural armor — use template formula + optional bonuses.
  let ac =
    typeof template.defaultAc === "number"
      ? template.defaultAc
      : getFormulaArmorAc(template, dexMod);

  const acFrom = parseFiveToolsMarkup(template.defaultAcFrom);
  const templateHasShield = /\bshield\b/i.test(acFrom);
  const from: string[] = [acFrom];

  if (shieldBonus > 0) {
    // The MH weapon's shield replaces the template's generic +2 shield.
    if (templateHasShield) {
      ac -= GENERIC_SHIELD_AC;
      from[0] = acFrom.replace(/,?\s*\bshield\b/i, "").trim();
    }
    ac += shieldBonus;
    from.push(`+${shieldBonus} MH shield`);
  }

  if (powerAcBonus > 0) {
    ac += powerAcBonus;
  }

  return [{ ac, from }];
}

/**
 * Derive fixed damage immunities from a species' defenseGrants, to be merged
 * into the NPC stat block's damageImmunities field.
 */
export function resolveNpcDamageImmunities(species: Species): DamageType[] {
  return species.defenseGrants
    .filter((g) => g.kind === "fixed" && g.defenseKind === "immunity")
    .flatMap((g) => (g.kind === "fixed" ? g.types : []));
}

/**
 * Derive fixed damage resistances from both species.resistances (legacy) and
 * species.defenseGrants, deduplicating entries.
 */
export function resolveNpcDamageResistances(species: Species): DamageType[] {
  const fromGrants = species.defenseGrants
    .filter((g) => g.kind === "fixed" && g.defenseKind === "resistance")
    .flatMap((g) => (g.kind === "fixed" ? g.types : []));

  const combined = [...species.resistances, ...fromGrants];
  return [...new Set(combined)];
}
