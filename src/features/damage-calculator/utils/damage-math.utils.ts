import type {
  AttackDamageConfig,
  AttackDamageResult,
  DiceGroup,
  RollMode,
  WeaponDamageResult,
  WeaponSetup,
} from "../types/damage-calculator.types";

export const COMMON_DICE_SIDES = [4, 6, 8, 10, 12] as const;

export function newId(): string {
  return crypto.randomUUID();
}

export function averageDiceGroup(count: number, sides: number): number {
  return count * ((sides + 1) / 2);
}

export function totalDiceAverage(groups: DiceGroup[]): number {
  return groups.reduce((sum, g) => sum + averageDiceGroup(g.count, g.sides), 0);
}

export function formatDiceExpression(
  groups: DiceGroup[],
  flatBonus: number,
): string {
  const dicePart = groups
    .filter((g) => g.count > 0)
    .map((g) => `${g.count}d${g.sides}`)
    .join(" + ");
  if (!dicePart && flatBonus === 0) return "0";
  if (flatBonus === 0) return dicePart;
  const sign = flatBonus > 0 ? " + " : " − ";
  return dicePart ? `${dicePart}${sign}${Math.abs(flatBonus)}` : `${flatBonus}`;
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

function resolveAttackDamage(
  attack: AttackDamageConfig,
  firstAttack: AttackDamageConfig,
): { groups: DiceGroup[]; flatBonus: number } {
  if (attack.useFirstAttackDamage && attack.id !== firstAttack.id) {
    return {
      groups: firstAttack.diceGroups,
      flatBonus: firstAttack.flatBonus,
    };
  }
  return { groups: attack.diceGroups, flatBonus: attack.flatBonus };
}

function calcBrutalCritBonus(
  groups: DiceGroup[],
  extraDice: number,
): number {
  if (extraDice <= 0 || groups.length === 0) return 0;
  const primary = groups[0];
  return averageDiceGroup(extraDice, primary.sides);
}

function calcAttackAverages(
  groups: DiceGroup[],
  flatBonus: number,
  brutalCritExtraDice: number,
): { averageHit: number; averageCrit: number; averageWithCrit: number } {
  const diceAvg = totalDiceAverage(groups);
  const averageHit = diceAvg + flatBonus;
  const brutalBonus = calcBrutalCritBonus(groups, brutalCritExtraDice);
  const averageCrit = diceAvg * 2 + brutalBonus + flatBonus;
  return { averageHit, averageCrit, averageWithCrit: averageHit };
}

export function calcWeaponDamage(weapon: WeaponSetup): WeaponDamageResult {
  const firstAttack = weapon.attacks[0];

  const attacks: AttackDamageResult[] = weapon.attacks.map((attack, index) => {
    const { groups, flatBonus } = resolveAttackDamage(attack, firstAttack);
    const brutalExtra = weapon.useBrutalCrit ? weapon.brutalCritExtraDice : 0;
    const { averageHit, averageCrit } = calcAttackAverages(
      groups,
      flatBonus,
      brutalExtra,
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
        ? calcSaveSuccessChance(attack.saveDC, attack.targetSaveBonus)
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
      diceExpression: formatDiceExpression(groups, flatBonus),
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

  return {
    weaponId: weapon.id,
    weaponName: weapon.name,
    attacks,
    totalExpectedPerTurn,
    totalAveragePerTurn,
    totalCritAveragePerTurn,
  };
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function createDefaultDiceGroup(sides = 8): DiceGroup {
  return { id: newId(), count: 1, sides };
}

export function createDefaultAttack(index: number): AttackDamageConfig {
  return {
    id: newId(),
    label: `Attack ${index + 1}`,
    useFirstAttackDamage: index > 0,
    diceGroups: [createDefaultDiceGroup()],
    flatBonus: 0,
    rollMode: "normal",
    resolution: "attack-roll",
    saveDC: 13,
    targetSaveBonus: 2,
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
    attacks: [createDefaultAttack(0)],
  };
}
