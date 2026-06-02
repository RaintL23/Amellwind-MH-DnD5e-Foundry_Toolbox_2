import type { AbilityScores, ArmorClass, HP, Senses, Speed } from "@/shared/types";
import { getAbilityModifier } from "@/shared/utils/cr.utils";

export function getSidekickProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function getMonstieSize(level: number): string {
  if (level >= 15) return "Large";
  if (level >= 6) return "Medium";
  return "Small";
}

export function getMonstieSpeed(base: Speed, level: number): Speed {
  const bonus = (level - 1) * 5;

  const apply = (
    original: number | undefined,
    start: number,
  ): number | undefined => {
    if (original === undefined) return undefined;
    return Math.min(original, start + bonus);
  };

  return {
    walk: apply(base.walk, 25) ?? 25,
    fly: apply(base.fly, 15),
    swim: apply(base.swim, 15),
    burrow: apply(base.burrow, 15),
    climb: apply(base.climb, 15),
    hover: base.hover,
  };
}

export function getMonstieSenses(base: Senses, level: number): Senses {
  const cap = level >= 15 ? 120 : level >= 6 ? 60 : 30;
  const limit = (val?: number) =>
    val === undefined ? undefined : Math.min(val, cap);

  return {
    darkvision: limit(base.darkvision),
    blindsight: limit(base.blindsight),
    tremorsense: limit(base.tremorsense),
    truesight: limit(base.truesight),
    special: base.special,
  };
}

export function getMonstieArmorClass(
  abilities: AbilityScores,
  level: number,
): ArmorClass[] {
  const pb = getSidekickProficiencyBonus(level);
  const dexMod = getAbilityModifier(abilities.dex);
  return [{ ac: 10 + dexMod + pb, from: ["natural armor"] }];
}

export function getMonstieHitPoints(
  abilities: AbilityScores,
  level: number,
): HP {
  const conMod = getAbilityModifier(abilities.con);
  let average = 10 + conMod;
  if (level > 1) {
    average += (level - 1) * (4.5 + conMod);
  }
  if (level >= 15) {
    average += 15 + Math.max(0, level - 15);
  }
  const formula =
    level === 1
      ? `10 + ${conMod >= 0 ? "+" : ""}${conMod} (Con)`
      : `10 + Con + ${level - 1}d8+Con por nivel${level >= 15 ? `; +15 HP máx. al 15º, +1/nivel` : ""}`;
  return { average: Math.round(average), formula };
}

export function getMaxSkillSlots(level: number, totalBaseSkills: number): number {
  const slotsByLevel: Record<number, number> = {
    1: 2,
    4: 3,
    8: 4,
    12: 5,
    14: 6,
    16: 7,
    19: 8,
  };
  let slots = 0;
  for (const [lvl, count] of Object.entries(slotsByLevel)) {
    if (level >= Number(lvl)) slots = count;
  }
  return Math.min(slots, totalBaseSkills);
}

export function getTraitPickSlots(level: number): number {
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  if (level >= 2) return 1;
  return 0;
}

export function getCreatureFeatureSlots(level: number): number {
  if (level >= 18) return 3;
  if (level >= 11) return 2;
  if (level >= 3) return 1;
  return 0;
}

export function getSaveDc(abilities: AbilityScores, ability: keyof AbilityScores): number {
  return 8 + getAbilityModifier(abilities[ability]);
}
