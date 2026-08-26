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

/** Additional class slot when multiclassing (index 0 = second class). */
export type BuilderMulticlassClassSlot = `multiclass-class-${number}`;

/** Subclass slot for an additional multiclass entry. */
export type BuilderMulticlassSubclassSlot = `multiclass-subclass-${number}`;

export interface BuilderMulticlassEntry {
  classRef: CharacterSelectionRef | null;
  level: number;
  subclass: CharacterSelectionRef | null;
}

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

/**
 * Parallel to {@link import("./feat.types").Feat.abilityIncreases}.
 * Fixed increases auto-fill `ability`; choose blocks start as null until picked.
 */
export interface BuilderFeatAbilityIncreaseChoice {
  ability: AbilityKey | null;
  amount: number;
}

export interface BuilderFeatSelection {
  id: string;
  name: string;
  source: BuilderFeatSource;
  asiChoices?: BuilderAsiChoices;
  /** Ability score picks from the feat's abilityIncreases (non-ASI feats). */
  abilityIncreaseChoices?: BuilderFeatAbilityIncreaseChoice[];
  /** Chosen class spell list for feats like Magic Initiate (Cleric, Druid, Wizard, …). */
  spellListClassChoice?: string | null;
}

export interface CharacterSelectionRef {
  id: string;
  name: string;
  /** D&D subrace/subspecies variant linked to the base species entry. */
  subraceId?: string | null;
  subraceName?: string | null;
}

// ─── Armor (placeholder until real data source exists) ───────────────────────

export type ArmorCategory = "light" | "medium" | "heavy" | "clothing" | "shield";

export interface ArmorItem {
  name: string;
  category: ArmorCategory;
  baseAC: number;
  maxDexBonus: number | null; // null = unlimited, 0 = none
  rarity: string;
  runeSlots: number;
  stealthDisadvantage: boolean;
  weight: number;
  /** Rendered item description (from 5etools entries), if available. */
  description?: string;
  /** D&D catalog items from items-base / magic variants. */
  contentSource?: "dnd";
  /** Normalized rarity label for D&D filters and badges. */
  itemRarityLabel?: string;
  /** Base item name for magic variants (e.g. Breastplate for Adamantine Breastplate). */
  baseName?: string;
  source?: string;
}

/** D&D 5e standalone shield (PHB / items catalog), distinct from armor. */
export interface StandaloneShieldItem {
  name: string;
  acBonus: number;
  weight: number;
  rarity: string;
}

// ─── Equipped Items ──────────────────────────────────────────────────────────

export interface EquippedWeapon {
  weapon: Weapon;
  rarity: string;
  runeSlots: number;
  runes: (Rune | null)[];
  /**
   * Active grip/switch mode index (0 = primary).
   * For PHB Versatile, 0 = one-hand (`dmg1`), 1 = two-hand (`dmg2`).
   */
  activeModeIndex: number;
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

/** Bonus cantrip pool from a feature, feat, or origin feat. */
export type BuilderBonusCantripSlot = `spell-cantrip-${string}`;

/** Bonus leveled spell pool from a feat (e.g. Magic Initiate level-1 spell). */
export type BuilderBonusFeatSpellSlot = `spell-feat-${string}`;

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
