import type { DamageType } from "@/shared/types";
import type {
  AttackDamageConfig,
  AttackDamageResult,
  DiceGroup,
  FlatBonus,
  RollMode,
  WeaponDamageResult,
  WeaponSetup,
} from "../types/damage-calculator.types";

export const COMMON_DICE_SIDES = [4, 6, 8, 10, 12] as const;

export const ALL_DAMAGE_TYPES: DamageType[] = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];

export function newId(): string {
  return crypto.randomUUID();
}

export function averageDiceGroup(count: number, sides: number): number {
  return count * ((sides + 1) / 2);
}

export function totalDiceAverage(groups: DiceGroup[]): number {
  return groups.reduce((sum, g) => sum + averageDiceGroup(g.count, g.sides), 0);
}

export function sumFlatBonuses(flatBonuses: FlatBonus[]): number {
  return flatBonuses.reduce((sum, b) => sum + b.value, 0);
}

function formatBrackets(
  damageType?: DamageType,
  comment?: string,
): string {
  let suffix = "";
  if (damageType) suffix += `[${damageType}]`;
  const trimmed = comment?.trim();
  if (trimmed) suffix += `[${trimmed}]`;
  return suffix;
}

function formatDiceGroup(group: DiceGroup): string {
  if (group.count <= 0) return "";
  return `${group.count}d${group.sides}${formatBrackets(group.damageType, group.comment)}`;
}

function formatFlatBonusPart(bonus: FlatBonus): string {
  if (bonus.value === 0) return "";
  const sign = bonus.value > 0 ? "+" : "−";
  return `${sign}${Math.abs(bonus.value)}${formatBrackets(bonus.damageType, bonus.comment)}`;
}

export function formatDiceExpression(
  groups: DiceGroup[],
  flatBonuses: FlatBonus[],
): string {
  const parts = [
    ...groups.map(formatDiceGroup).filter(Boolean),
    ...flatBonuses.map(formatFlatBonusPart).filter(Boolean),
  ];
  if (parts.length === 0) return "0";
  return parts.join(" ");
}

function damageMultiplier(
  damageType: DamageType | undefined,
  resistances: DamageType[],
  immunities: DamageType[],
): number {
  if (!damageType) return 1;
  if (immunities.includes(damageType)) return 0;
  if (resistances.includes(damageType)) return 0.5;
  return 1;
}

function weightedDiceAverage(
  groups: DiceGroup[],
  resistances: DamageType[],
  immunities: DamageType[],
): number {
  return groups.reduce((sum, g) => {
    const avg = averageDiceGroup(g.count, g.sides);
    return sum + avg * damageMultiplier(g.damageType, resistances, immunities);
  }, 0);
}

function weightedFlatBonus(
  flatBonuses: FlatBonus[],
  resistances: DamageType[],
  immunities: DamageType[],
): number {
  return flatBonuses.reduce((sum, b) => {
    return sum + b.value * damageMultiplier(b.damageType, resistances, immunities);
  }, 0);
}

function d20Outcomes(mode: RollMode): number[][] {
  if (mode === "normal") {
    return Array.from({ length: 20 }, (_, i) => [i + 1]);
  }
  const pairs: number[][] = [];
  for (let d1 = 1; d1 <= 20; d1++) {
    for (let d2 = 1; d2 <= 20; d2++) {
      pairs.push([d1, d2]);
    }
  }
  return pairs;
}

function selectedD20(rolls: number[], mode: RollMode): number {
  if (mode === "advantage") return Math.max(rolls[0], rolls[1]);
  if (mode === "disadvantage") return Math.min(rolls[0], rolls[1]);
  return rolls[0];
}

function isAttackHit(d20: number, attackBonus: number, targetAC: number): boolean {
  return d20 === 20 || d20 + attackBonus >= targetAC;
}

/** Probability of meeting or exceeding AC on a d20 attack roll (5e rules). */
export function calcHitChance(
  attackBonus: number,
  targetAC: number,
  mode: RollMode = "normal",
): number {
  const outcomes = d20Outcomes(mode);
  let hits = 0;
  for (const rolls of outcomes) {
    const d20 = selectedD20(rolls, mode);
    if (isAttackHit(d20, attackBonus, targetAC)) hits++;
  }
  return hits / outcomes.length;
}

/** Probability of a critical hit on a d20 attack roll. */
export function calcCritChance(
  critRange: number,
  attackBonus: number,
  targetAC: number,
  mode: RollMode = "normal",
): number {
  const outcomes = d20Outcomes(mode);
  let crits = 0;
  for (const rolls of outcomes) {
    const d20 = selectedD20(rolls, mode);
    if (isAttackHit(d20, attackBonus, targetAC) && d20 >= critRange) crits++;
  }
  return crits / outcomes.length;
}

/** Probability the target succeeds on a saving throw. */
export function calcSaveSuccessChance(
  saveDC: number,
  saveBonus: number,
): number {
  let successes = 0;
  for (let d = 1; d <= 20; d++) {
    if (d === 20 || d + saveBonus >= saveDC) successes++;
  }
  return successes / 20;
}

/** P(at least one attack-roll attack hits during the turn). */
export function calcTurnHitChance(
  weapon: WeaponSetup,
  attacks: AttackDamageResult[],
): number {
  let missAll = 1;
  let hasAttackRoll = false;
  weapon.attacks.forEach((attack, index) => {
    if ((attack.resolution ?? "attack-roll") !== "attack-roll") return;
    hasAttackRoll = true;
    missAll *= 1 - attacks[index].hitChance;
  });
  return hasAttackRoll ? 1 - missAll : 0;
}

function resolveAttackDamage(
  attack: AttackDamageConfig,
  firstAttack: AttackDamageConfig,
): { groups: DiceGroup[]; flatBonuses: FlatBonus[] } {
  if (attack.useFirstAttackDamage && attack.id !== firstAttack.id) {
    return {
      groups: firstAttack.diceGroups,
      flatBonuses: firstAttack.flatBonuses,
    };
  }
  return { groups: attack.diceGroups, flatBonuses: attack.flatBonuses };
}

function calcBrutalCritBonus(
  groups: DiceGroup[],
  extraDice: number,
  resistances: DamageType[],
  immunities: DamageType[],
): number {
  if (extraDice <= 0 || groups.length === 0) return 0;
  const primary = groups[0];
  const avg = averageDiceGroup(extraDice, primary.sides);
  return avg * damageMultiplier(primary.damageType, resistances, immunities);
}

function calcAttackAverages(
  groups: DiceGroup[],
  flatBonuses: FlatBonus[],
  brutalCritExtraDice: number,
  resistances: DamageType[],
  immunities: DamageType[],
): { averageHit: number; averageCrit: number; averageWithCrit: number } {
  const diceAvg = weightedDiceAverage(groups, resistances, immunities);
  const flatAvg = weightedFlatBonus(flatBonuses, resistances, immunities);
  const averageHit = diceAvg + flatAvg;
  const brutalBonus = calcBrutalCritBonus(
    groups,
    brutalCritExtraDice,
    resistances,
    immunities,
  );
  const averageCrit = diceAvg * 2 + brutalBonus + flatAvg;
  return { averageHit, averageCrit, averageWithCrit: averageHit };
}

export function calcWeaponDamage(weapon: WeaponSetup): WeaponDamageResult {
  const firstAttack = weapon.attacks[0];
  const resistances = weapon.damageResistances ?? [];
  const immunities = weapon.damageImmunities ?? [];

  const attacks: AttackDamageResult[] = weapon.attacks.map((attack, index) => {
    const { groups, flatBonuses } = resolveAttackDamage(attack, firstAttack);
    const brutalExtra = weapon.useBrutalCrit ? weapon.brutalCritExtraDice : 0;
    const { averageHit, averageCrit } = calcAttackAverages(
      groups,
      flatBonuses,
      brutalExtra,
      resistances,
      immunities,
    );

    const resolution = attack.resolution ?? "attack-roll";
    const rollMode = attack.rollMode ?? "normal";
    const hitChance =
      resolution === "attack-roll"
        ? calcHitChance(weapon.attackBonus, weapon.targetAC, rollMode)
        : 0;
    const critChance =
      resolution === "attack-roll"
        ? calcCritChance(
            weapon.critRange,
            weapon.attackBonus,
            weapon.targetAC,
            rollMode,
          )
        : 0;
    const saveSuccessChance =
      resolution === "save"
        ? calcSaveSuccessChance(attack.saveDC, weapon.targetSaveBonus)
        : 0;
    const saveFailChance = 1 - saveSuccessChance;

    const normalHitChance = hitChance - critChance;
    const averageWithCrit =
      resolution === "attack-roll"
        ? normalHitChance * averageHit + critChance * averageCrit
        : averageHit;

    let expectedDamage: number;
    if (resolution === "save") {
      const onFail = averageHit;
      const onSuccess = attack.halfDamageOnSave ? averageHit / 2 : 0;
      expectedDamage = saveFailChance * onFail + saveSuccessChance * onSuccess;
    } else {
      expectedDamage = averageWithCrit;
    }

    return {
      label: attack.label || `Attack ${index + 1}`,
      diceExpression: formatDiceExpression(groups, flatBonuses),
      averageHit,
      averageCrit,
      averageWithCrit,
      expectedDamage,
      hitChance,
      critChance,
      saveFailChance,
    };
  });

  const totalExpectedPerTurn = attacks.reduce(
    (sum, a) => sum + a.expectedDamage,
    0,
  );
  const totalAveragePerTurn = attacks.reduce((sum, a) => sum + a.averageHit, 0);
  const totalCritAveragePerTurn = attacks.reduce(
    (sum, a) => sum + a.averageCrit,
    0,
  );
  const turnHitChance = calcTurnHitChance(weapon, attacks);

  return {
    weaponId: weapon.id,
    weaponName: weapon.name,
    attacks,
    totalExpectedPerTurn,
    totalAveragePerTurn,
    totalCritAveragePerTurn,
    turnHitChance,
  };
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function createDefaultDiceGroup(sides = 8): DiceGroup {
  return { id: newId(), count: 1, sides };
}

export function createDefaultFlatBonus(value = 0): FlatBonus {
  return { id: newId(), value };
}

export function createDefaultAttack(index: number): AttackDamageConfig {
  return {
    id: newId(),
    label: `Attack ${index + 1}`,
    useFirstAttackDamage: index > 0,
    diceGroups: [createDefaultDiceGroup()],
    flatBonuses: [createDefaultFlatBonus()],
    rollMode: "normal",
    resolution: "attack-roll",
    saveDC: 13,
    halfDamageOnSave: true,
  };
}

export function createDefaultWeapon(name = "Weapon 1"): WeaponSetup {
  return {
    id: newId(),
    name,
    attackBonus: 5,
    critRange: 20,
    useBrutalCrit: false,
    brutalCritExtraDice: 1,
    targetAC: 15,
    targetSaveBonus: 2,
    damageResistances: [],
    damageImmunities: [],
    attacks: [createDefaultAttack(0)],
  };
}
