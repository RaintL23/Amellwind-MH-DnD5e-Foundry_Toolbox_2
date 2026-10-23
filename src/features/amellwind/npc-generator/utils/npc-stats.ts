import type { AbilityScores, HP, Speed } from "@/shared/types";
import type { NpcHitDie } from "@/shared/types/npc.types";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { resolveNpcPowerProfile } from "./npc-power-scaling";

export function estimateCrValue(hitDiceCount: number, templateTier: number): number {
  return resolveNpcPowerProfile(templateTier, hitDiceCount).cr;
}

export function formatCrString(value: number): string {
  if (value <= 0.125) return "1/8";
  if (value <= 0.25) return "1/4";
  if (value <= 0.5) return "1/2";
  if (value <= 0.75) return "3/4";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

export function getNpcProficiencyBonus(hitDiceCount: number, tier: number): number {
  return resolveNpcPowerProfile(tier, hitDiceCount).proficiencyBonus;
}

export function getNpcHitPoints(
  abilities: AbilityScores,
  hitDiceCount: number,
  hitDie: NpcHitDie,
): HP {
  const conMod = getAbilityModifier(abilities.con);
  const conTotal = hitDiceCount * conMod;
  const average = Math.floor((hitDiceCount * (hitDie + 1)) / 2) + conTotal;
  const modPart =
    conTotal === 0 ? "" : ` ${conTotal > 0 ? "+" : "-"} ${Math.abs(conTotal)}`;
  return {
    average: Math.max(1, average),
    formula: `${hitDiceCount}d${hitDie}${modPart}`,
  };
}

export function parseSpeciesSpeed(speedText: string): Speed {
  const walkMatch = speedText.match(/(?:walk\s+)?(\d+)\s*ft/i);
  const flyMatch = speedText.match(/fly\s+(\d+)\s*ft/i);
  const swimMatch = speedText.match(/swim\s+(\d+)\s*ft/i);
  const climbMatch = speedText.match(/climb\s+(\d+)\s*ft/i);
  const burrowMatch = speedText.match(/burrow\s+(\d+)\s*ft/i);

  const speed: Speed = {};
  if (walkMatch) speed.walk = Number(walkMatch[1]);
  if (flyMatch) speed.fly = Number(flyMatch[1]);
  if (swimMatch) speed.swim = Number(swimMatch[1]);
  if (climbMatch) speed.climb = Number(climbMatch[1]);
  if (burrowMatch) speed.burrow = Number(burrowMatch[1]);
  if (!speed.walk && /^\d+\s*ft/i.test(speedText.trim())) {
    speed.walk = Number(speedText.match(/(\d+)/)?.[1] ?? 30);
  }
  if (!speed.walk) speed.walk = 30;
  return speed;
}

export function estimateXpFromCr(crString: string): number {
  const xpTable: Record<string, number> = {
    "1/8": 25,
    "1/4": 50,
    "1/2": 100,
    "3/4": 150,
    "1": 200,
    "2": 450,
    "3": 700,
    "4": 1100,
    "5": 1800,
    "6": 2300,
    "7": 2900,
    "8": 3900,
    "9": 5000,
    "10": 5900,
    "11": 7200,
    "12": 8400,
  };
  return xpTable[crString] ?? 0;
}
