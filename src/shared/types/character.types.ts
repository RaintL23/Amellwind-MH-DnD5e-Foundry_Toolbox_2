import { AbilityScores, AbilityKey } from "./actor.types";
import { Weapon } from "./weapon.types";
import { Rune } from "./rune.types";

// ─── Equipment Slots ─────────────────────────────────────────────────────────

export type EquipmentSlotType =
  | "mainHand"
  | "offHand"
  | "armor"
  | "trinket1"
  | "trinket2";

// ─── Armor (placeholder until real data source exists) ───────────────────────

export type ArmorCategory = "light" | "medium" | "heavy";

export interface ArmorItem {
  name: string;
  category: ArmorCategory;
  baseAC: number;
  maxDexBonus: number | null; // null = unlimited, 0 = none
  rarity: string;
  runeSlots: number;
  stealthDisadvantage: boolean;
  weight: number;
}

// ─── Equipped Items ──────────────────────────────────────────────────────────

export interface EquippedWeapon {
  weapon: Weapon;
  rarity: string;
  runeSlots: number;
  runes: (Rune | null)[];
  /** Whether the weapon is wielded two-handed (for versatile weapons) */
  useVersatile: boolean;
}

export interface EquippedArmor {
  armor: ArmorItem;
  runes: (Rune | null)[];
}

export interface EquippedTrinket {
  name: string;
  rune: Rune | null;
}

// ─── Character Stats ─────────────────────────────────────────────────────────

export interface CharacterStats {
  level: number;
  abilities: AbilityScores;
  proficiencyBonus: number;
  modifiers: Record<AbilityKey, number>;
  ac: number;
  initiative: number;
  attacksPerTurn: number;
}

// ─── Combat Calculation ──────────────────────────────────────────────────────

export interface DiceRoll {
  count: number;
  sides: number;
  average: number;
  notation: string;
}

export interface DamageSource {
  source: string; // e.g. "Longsword", "Rathalos Scale (rune)"
  type: "weapon" | "rune" | "ability";
  dice: DiceRoll | null;
  flatBonus: number;
  average: number;
}

export interface DamageBreakdown {
  weaponDice: DiceRoll;
  abilityModifier: number;
  abilityUsed: AbilityKey;
  runeDice: DiceRoll[];
  totalPerHit: number;
  attacksPerTurn: number;
  attackBonus: number;
  totalPerTurn: number;
  diceExpression: string;
  sources: DamageSource[];
}

export interface CombatCalculation {
  mainHand: DamageBreakdown | null;
  offHand: DamageBreakdown | null;
  totalDPT: number;
}
