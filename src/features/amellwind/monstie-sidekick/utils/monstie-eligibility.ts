import type { Monster } from "@/shared/types";

const BLOCKED_GROUPS = new Set(["Elder Dragons"]);

export function isParagonMonster(monster: Monster): boolean {
  const allEntries = [...monster.traits, ...monster.actions, ...monster.reactions];
  return allEntries.some((e) => /paragon creature/i.test(e.name));
}

export function isMonstieEligible(monster: Monster): boolean {
  if (monster.group?.some((g) => BLOCKED_GROUPS.has(g))) return false;
  if (isParagonMonster(monster)) return false;
  return true;
}

export function getMonstieIneligibleReason(monster: Monster): string | null {
  if (monster.group?.some((g) => BLOCKED_GROUPS.has(g))) {
    return "Los Elder Dragons no pueden ser Monsties.";
  }
  if (isParagonMonster(monster)) {
    return "Los monstruos Paragon no pueden ser Monsties.";
  }
  return null;
}
