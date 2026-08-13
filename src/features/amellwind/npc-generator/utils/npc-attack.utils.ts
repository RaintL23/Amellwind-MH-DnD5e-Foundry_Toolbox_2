import type { AbilityKey, AbilityScores } from "@/shared/types";
import type { NpcAttackDefinition } from "@/shared/types/npc.types";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import type { NpcPowerProfile } from "./npc-power-scaling";

export function addDamageDice(damageDice: string, extraDice: number): string {
  if (extraDice <= 0) return damageDice;
  const match = damageDice.match(/(\d+)d(\d+)/);
  if (!match) return damageDice;
  return `${Number(match[1]) + extraDice}d${match[2]}`;
}

export function rollAverage(dice: string): number {
  const match = dice.match(/(\d+)d(\d+)/);
  if (!match) return 0;
  const count = Number(match[1]);
  const sides = Number(match[2]);
  return count * (Math.floor(sides / 2) + 1);
}

export function formatDamageExpression(
  damageDice: string,
  abilityMod: number,
  flatBonus: number,
): string {
  const totalBonus = abilityMod + flatBonus;
  if (totalBonus === 0) return damageDice;
  return `${damageDice}${totalBonus >= 0 ? ` + ${totalBonus}` : ` ${totalBonus}`}`;
}

export function formatAttackEntry(
  attack: NpcAttackDefinition,
  abilities: AbilityScores,
  pb: number,
): string {
  const abilityMod = getAbilityModifier(abilities[attack.ability]);
  const hit = pb + abilityMod + (attack.extraHitBonus ?? 0);
  const flat = attack.flatDamageBonus ?? 0;
  const avgDamage = rollAverage(attack.damageDice) + abilityMod + flat;
  const attackLabel =
    attack.kind === "mw" ? "Melee Weapon Attack" : "Ranged Weapon Attack";
  const distanceLabel = attack.kind === "mw" ? "reach" : "range";
  const damageExpr = formatDamageExpression(
    attack.damageDice,
    abilityMod,
    flat,
  );

  return `${attackLabel}: ${formatModifier(hit)} to hit, ${distanceLabel} ${attack.reachOrRange}, one target. Hit: ${avgDamage} (${damageExpr}) ${attack.damageType} damage.`;
}

/**
 * Returns a flat exponential boost applied on top of the band's statBoost when
 * the NPC's CR exceeds 3. Keeps Standard Array viable for low-CR NPCs while
 * producing appropriately high stats at CR 8–12.
 *
 * CR 4 → +1, CR 8 → +3, CR 12 → +6
 */
function calcExponentialBoost(crNumeric: number): number {
  if (crNumeric <= 3) return 0;
  return Math.round(Math.pow(crNumeric - 3, 1.25));
}

export function applyAbilityPowerScaling(
  abilities: AbilityScores,
  abilityPriority: AbilityKey[],
  profile: NpcPowerProfile,
): AbilityScores {
  const totalBoost = profile.statBoost + calcExponentialBoost(profile.crNumeric);
  if (totalBoost <= 0) return abilities;

  const result = { ...abilities };
  const primary = abilityPriority[0];
  const secondary = abilityPriority[1];

  result[primary] = Math.min(30, result[primary] + totalBoost);
  result.con = Math.min(30, result.con + totalBoost);

  if (totalBoost >= 2 && secondary) {
    result[secondary] = Math.min(30, result[secondary] + Math.floor(totalBoost / 2));
  }

  return result;
}

export function scaleNpcAttack(
  attack: NpcAttackDefinition,
  profile: NpcPowerProfile,
  isPrimary: boolean,
): NpcAttackDefinition {
  const extraDice = isPrimary
    ? profile.bonusDamageDice
    : Math.max(0, profile.bonusDamageDice - 1);
  const flatBonus = isPrimary
    ? profile.flatDamageBonus
    : Math.max(0, Math.floor(profile.flatDamageBonus / 2));

  return {
    ...attack,
    damageDice: addDamageDice(attack.damageDice, extraDice),
    flatDamageBonus: (attack.flatDamageBonus ?? 0) + flatBonus,
    extraHitBonus: profile.attackHitBonus,
  };
}

export function scaleNpcAttacks(
  attacks: NpcAttackDefinition[],
  profile: NpcPowerProfile,
): NpcAttackDefinition[] {
  return attacks.map((attack, index) =>
    scaleNpcAttack(attack, profile, index === 0),
  );
}
