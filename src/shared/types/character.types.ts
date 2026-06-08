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

export type CharacterIdentitySlot =
  | "species"
  | "background"
  | "backstory"
  | "class"
  | "subclass";

export type BuilderFeatSlot = `feat-${number}`;

export type BuilderFeatSource = "asi" | "amellwind" | "dnd2014" | "dnd2024";

export interface BuilderFeatSelection {
  id: string;
  name: string;
  source: BuilderFeatSource;
}

export interface CharacterSelectionRef {
  id: string;
  name: string;
}

// ─── Armor (placeholder until real data source exists) ───────────────────────

export type ArmorCategory = "light" | "medium" | "heavy" | "clothing";

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
  rarity: string;
  runeSlots: number;
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

export interface CritRune {
  name: string;
  monsterName: string;
  /** How many numbers the crit range is expanded (e.g. +1 → 19-20) */
  rangeBonus: number;
  /** True when the bonus only applies on the first round (Critical Draw) */
  conditional: boolean;
  /** Raw description of the crit effect */
  description: string;
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
  /** Minimum d20 roll needed to crit (permanent effects only, default 20) */
  critRange: number;
  /** Runes that affect the critical hit range or add crit effects */
  critRunes: CritRune[];
}

export interface CombatCalculation {
  mainHand: DamageBreakdown | null;
  offHand: DamageBreakdown | null;
  totalDPT: number;
}
