import type { AbilityScores, ArmorClass, DamageType } from "@/shared/types";
import type { Species } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { detectNaturalArmorFromTraits } from "@/features/builder/utils/species-natural-armor";

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
  let ac: number;
  if (template.defaultAc === "unarmored-dex") {
    ac = 10 + dexMod;
  } else if (template.defaultAc === "unarmored-dex-max2") {
    ac = 11 + Math.min(2, dexMod);
  } else {
    ac = template.defaultAc;
  }

  const from: string[] = [template.defaultAcFrom];

  if (shieldBonus > 0) {
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
