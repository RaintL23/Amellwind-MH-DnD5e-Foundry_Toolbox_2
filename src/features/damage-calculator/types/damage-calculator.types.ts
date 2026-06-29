import type { DamageType } from "@/shared/types";

export interface DiceGroup {
  id: string;
  count: number;
  sides: number;
  damageType?: DamageType;
  comment?: string;
}

export interface FlatBonus {
  id: string;
  value: number;
  damageType?: DamageType;
  comment?: string;
}

export interface AttackDamageConfig {
  id: string;
  label: string;
  /** When true, copies dice and flat bonuses from the first attack. */
  useFirstAttackDamage: boolean;
  diceGroups: DiceGroup[];
  flatBonuses: FlatBonus[];
  rollMode: RollMode;
  resolution: AttackResolution;
  saveDC: number;
  halfDamageOnSave: boolean;
}

export type AttackResolution = "attack-roll" | "save";

export type RollMode = "normal" | "advantage" | "disadvantage";

export interface WeaponSetup {
  id: string;
  name: string;
  attackBonus: number;
  /** Lowest d20 face that counts as a critical hit (20 = only nat 20). */
  critRange: number;
  useBrutalCrit: boolean;
  /** Extra weapon damage dice rolled on a critical hit (Brutal Critical). */
  brutalCritExtraDice: number;
  targetAC: number;
  targetSaveBonus: number;
  damageResistances: DamageType[];
  damageImmunities: DamageType[];
  attacks: AttackDamageConfig[];
}

export interface AttackDamageResult {
  label: string;
  diceExpression: string;
  averageHit: number;
  averageCrit: number;
  averageWithCrit: number;
  expectedDamage: number;
  hitChance: number;
  critChance: number;
  saveFailChance: number;
}

export interface WeaponDamageResult {
  weaponId: string;
  weaponName: string;
  attacks: AttackDamageResult[];
  totalExpectedPerTurn: number;
  totalAveragePerTurn: number;
  totalCritAveragePerTurn: number;
  /** P(at least one attack-roll attack hits) for the full turn. */
  turnHitChance: number;
}

export interface DamageCalculatorState {
  weapons: WeaponSetup[];
  selectedWeaponId: string;
}
