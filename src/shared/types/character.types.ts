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
  | "faction"
  | "backstory"
  | "class"
  | "subclass"
  | "origin-feat";

/** Origin Feat granted by an optional feature (e.g. Eldritch Invocation). */
export type BuilderOptionalOriginFeatSlot = `origin-feat-opt-${number}`;

export type BuilderFeatSlot = `feat-${number}`;

export type BuilderFeatSource = "asi" | "amellwind" | "dnd2014" | "dnd2024";

export type AsiDistributionMode = "plus2" | "plus1plus1";

export interface BuilderAsiChoices {
  mode: AsiDistributionMode;
  plus2: AbilityKey | null;
  plus1a: AbilityKey | null;
  plus1b: AbilityKey | null;
}

export interface BuilderFeatSelection {
  id: string;
  name: string;
  source: BuilderFeatSource;
  asiChoices?: BuilderAsiChoices;
}

export interface CharacterSelectionRef {
  id: string;
  name: string;
  /** D&D subrace/subspecies variant linked to the base species entry. */
  subraceId?: string | null;
  subraceName?: string | null;
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
  /** Which material effect the trinket rune applies (weapon or armor). */
  runeMaterialEffect?: "weapon" | "armor";
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

// ─── Spellcasting ─────────────────────────────────────────────────────────────

/** Identifies a spell-level slot in the spellcasting grid. "spell-level-0" = cantrips. */
export type SpellLevelSlot = `spell-level-${number}`;

/** Unified Warlock pact spell list (all levels 1–slot level in one pool). */
export type BuilderPactSpellSlot = "spell-pact";

export interface BuilderSpellSelection {
  id: string;
  name: string;
  level: number;
  source: string;
  school?: string;
  /** Damage notation extracted from spell entries, e.g. "8d6" */
  damageRoll?: string;
}

/** Spell selections keyed by level (0 = cantrips; -1 = Warlock pact pool; 1–9 = normal casters). */
export type BuilderSpellSelections = Record<number, BuilderSpellSelection[]>;

// ─── Optional class features (EI, Metamagic, Maneuvers, …) ─────────────────

/** Slot id: opt-{progressionId} — one grid slot per progression. */
export type BuilderOptionalFeatureSlot = `opt-${string}`;

export type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
} from "./dnd-optionalfeature.types";
