import type { Monster } from "@/shared/types";

const BLOCKED_GROUPS = new Set(["Elder Dragons", "Monster Templates"]);

/** Tempered / arch-tempered / risen stat blocks are not "original" monsters. */
const NON_ORIGINAL_NAME = /^(?:arch[\s-]?tempered|tempered|risen)\s/i;

export function isParagonMonster(monster: Monster): boolean {
  const allEntries = [
    ...monster.traits,
    ...monster.actions,
    ...monster.reactions,
    ...(monster.bonusActions ?? []),
  ];
  return allEntries.some((e) => /paragon/i.test(e.name));
}

/** Elder dragons are tagged by group, and some (e.g. Shagaru Magala) only by type tag. */
export function isElderDragon(monster: Monster): boolean {
  if (monster.group?.some((g) => g === "Elder Dragons")) return true;
  return (monster.type.tags ?? []).some((tag) => /^elder$/i.test(tag));
}

export function isTemperedVariant(monster: Monster): boolean {
  return NON_ORIGINAL_NAME.test(monster.name.trim());
}

export function getMonstieIneligibleReason(monster: Monster): string | null {
  if (isElderDragon(monster)) {
    return "Elder Dragons cannot be monsties.";
  }
  if (isParagonMonster(monster)) {
    return "Paragon monsters cannot be monsties.";
  }
  if (isTemperedVariant(monster)) {
    return "Monsties use the original stat block, not a tempered version.";
  }
  if (monster.group?.some((g) => BLOCKED_GROUPS.has(g))) {
    return "Templates are not monsters and cannot be monsties.";
  }
  return null;
}

export function isMonstieEligible(monster: Monster): boolean {
  return getMonstieIneligibleReason(monster) === null;
}
