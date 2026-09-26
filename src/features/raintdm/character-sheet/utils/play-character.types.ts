/**
 * Play-mode Character Sheet: compiled build snapshot + mutable session state.
 */
import type { AbilityKey, AbilityScores, SkillKey } from "@/shared/types";
import type { BuilderCharacterJson } from "@/features/raintdm/builder/builder-json/builder-character.types";
import type { FeatureActivationType, FeatureRecoveryPeriod } from "@/features/raintdm/builder/foundry-export/feature-usage.utils";

export type RulesEdition = "2014" | "2024";
export type RollMode = "normal" | "advantage" | "disadvantage";
export type FeatureSourceKind =
  | "class"
  | "subclass"
  | "species"
  | "background"
  | "feat"
  | "item"
  | "spell"
  | "standard";

export type PlayActivationBucket =
  | "action"
  | "bonus"
  | "reaction"
  | "passive"
  | "other";

export interface PlayDeathSaves {
  successes: number;
  failures: number;
}

export interface PlayHp {
  current: number;
  max: number;
  temp: number;
}

export interface ConditionEffectFlags {
  denyActions?: boolean;
  denyBonusActions?: boolean;
  denyReactions?: boolean;
  denyMovement?: boolean;
  denyAttacks?: boolean;
  denyConcentration?: boolean;
  attackDisadvantage?: boolean;
  abilityCheckDisadvantage?: boolean;
  savingThrowDisadvantage?: AbilityKey[] | "all";
  autoFailStrDexSaves?: boolean;
  speedZero?: boolean;
  /** 2014 Exhaustion L1 (and similar): disadvantage on D20 Tests */
  d20TestDisadvantage?: boolean;
  /**
   * 2024 Exhaustion: subtract this from every D20 Test (2 × level).
   * Not disadvantage — a flat penalty that stacks with level.
   */
  d20TestPenalty?: number;
  speedHalf?: boolean;
  /** 2024 Exhaustion: Speed reduced by this many feet (5 × level) */
  speedReductionFt?: number;
  /** Notes shown in UI (e.g. "attacks against you have advantage") */
  notes?: string[];
}

export type PlayConditionKind = "condition" | "disease" | "status";
export type PlayConditionSource = "dnd" | "amellwind" | "custom";

export interface PlayConditionInstance {
  id: string;
  kind: PlayConditionKind;
  source: PlayConditionSource;
  refId?: string;
  name: string;
  summary?: string;
  /** Exhaustion level 1–6 when name is Exhaustion */
  level?: number;
  effectOverride?: Partial<ConditionEffectFlags>;
  notes?: string;
}

export interface PlayFeatureUses {
  max: number;
  recovery: FeatureRecoveryPeriod | "";
}

/** Passive sheet-stat contribution attributed to a feature (speed, AC, senses, …). */
export type PlayFeatureStatEffectKind =
  | "speed"
  | "ac"
  | "darkvision"
  | "resistance"
  | "other";

export interface PlayFeatureStatEffect {
  kind: PlayFeatureStatEffectKind;
  /** Short UI label, e.g. "Darkvision 60 ft." or "Speed +10 ft." */
  label: string;
}

export interface PlayFeature {
  id: string;
  name: string;
  sourceKind: FeatureSourceKind;
  sourceLabel: string;
  level?: number;
  description: string;
  activation: FeatureActivationType | "";
  /** Default UI bucket; can be overridden in session */
  bucket: PlayActivationBucket;
  uses?: PlayFeatureUses;
  /**
   * Passive effects this feature currently applies to the sheet
   * (speed / AC / darkvision / resistances). Empty for pure action features.
   */
  statEffects?: PlayFeatureStatEffect[];
}

export interface PlayAttackDamage {
  expression: string;
  type?: string;
}

export interface PlayAttack {
  id: string;
  name: string;
  attackBonus: number;
  damage: PlayAttackDamage[];
  versatile?: PlayAttackDamage[];
  range?: string;
  properties: string[];
  mastery?: string;
  critRange: number;
  /** action | bonus (off-hand light) */
  bucket: "action" | "bonus";
  sourceKind: FeatureSourceKind;
}

export interface PlaySpell {
  id: string;
  name: string;
  level: number;
  school?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  isConcentration: boolean;
  isRitual: boolean;
  components?: { v?: boolean; s?: boolean; m?: string };
  description?: string;
  /** At Higher Levels text when present in the catalog */
  higherLevel?: string;
  alwaysPrepared?: boolean;
  prepared?: boolean;
  /** Derived bucket from casting time */
  bucket: PlayActivationBucket;
  /**
   * Passive-like sheet effects implied by the spell text (speed / AC / …).
   * Shown as Active while concentrating on this spell (or always for non-conc
   * lasting effects when we can detect them).
   */
  statEffects?: PlayFeatureStatEffect[];
}

export interface PlaySpellcasting {
  ability: AbilityKey | "";
  mod: number;
  saveDc: number;
  attackBonus: number;
  slotMax: Record<number, number>;
  pact?: { max: number; level: number };
  isPreparedCaster: boolean;
  isPactMagic: boolean;
  preparedMax?: number;
  spells: PlaySpell[];
}

export interface PlayResource {
  id: string;
  label: string;
  max: number;
  recovery: FeatureRecoveryPeriod | "";
  /** When set, spend/clear use `featureUsesSpent` (synced with Actions / Features). */
  featureId?: string;
}

export interface PlayHitDie {
  die: string;
  max: number;
}

export interface PlayAbilityExport {
  score: number;
  mod: number;
}

export type PlayInventoryItemKind =
  | "weapon"
  | "armor"
  | "shield"
  | "gear"
  | "magic"
  | "custom";

export type PlayInventoryItemSource = "dnd" | "amellwind" | "custom";

export interface PlayInventoryItem {
  id: string;
  name: string;
  quantity: number;
  weightLb: number;
  equipped: boolean;
  attuned: boolean;
  requiresAttunement: boolean;
  notes?: string;
  /** Short catalog blurb for detail UI */
  summary?: string;
  kind?: PlayInventoryItemKind;
  source?: PlayInventoryItemSource;
  catalogId?: string;
  /** When true, generates/shows as a weapon attack */
  isWeapon?: boolean;
  attackBonus?: number;
  damageExpression?: string;
  properties?: string[];
  /** Armor base AC (before DEX) when kind is armor */
  armorAc?: number;
  /** Max DEX applied to armor AC; null/undefined = unlimited; 0 = none */
  armorMaxDex?: number | null;
  /** Shield AC bonus when kind is shield (default 2) */
  shieldBonus?: number;
}

export interface PlayCurrency {
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
}

export interface PlayCharacterCompiled {
  name: string;
  species: string;
  background: string;
  className: string;
  subclass: string;
  level: number;
  size: string;
  speedDisplay: string;
  speedFt: number;
  initiativeMod: number;
  passivePerception: number;
  proficiencyBonus: number;
  armorClass: number;
  hpMax: number;
  hitDice: PlayHitDie[];
  abilities: Record<AbilityKey, PlayAbilityExport>;
  abilityScores: AbilityScores;
  savingThrows: Record<AbilityKey, number>;
  saveProficiencies: AbilityKey[];
  skills: Record<SkillKey, number>;
  skillProficiencies: Partial<Record<SkillKey, 1 | 2>>;
  languages: string[];
  weaponProficiencies: string[];
  armorProficiencies: string[];
  toolProficiencies: string[];
  features: PlayFeature[];
  attacks: PlayAttack[];
  spellcasting: PlaySpellcasting | null;
  resources: PlayResource[];
  carryingCapacityLb: number;
  attunementMax: number;
  rulesEdition: RulesEdition;
  portraitImage?: string | null;
  notes?: string;
  /** True when multiclass data existed but only primary class was compiled */
  multiclassPartial?: boolean;
}

export interface PlayFeatureOverride {
  bucket?: PlayActivationBucket;
  usesMax?: number;
  recovery?: FeatureRecoveryPeriod | "";
}

export interface PlaySessionState {
  hp: PlayHp;
  deathSaves: PlayDeathSaves;
  /** Hit dice spent per die size key (e.g. "d10") */
  hitDiceSpent: Record<string, number>;
  /** Spell slots spent by level 1–9 */
  slotsSpent: Record<number, number>;
  pactSpent: number;
  featureUsesSpent: Record<string, number>;
  resourcesSpent: Record<string, number>;
  featureOverrides: Record<string, PlayFeatureOverride>;
  conditions: PlayConditionInstance[];
  exhaustion: number;
  inspiration: boolean;
  concentration: string | null;
  preparedSpellIds: string[];
  inventory: PlayInventoryItem[];
  currency: PlayCurrency;
  acAdjust: number;
  notes: string;
  /** Optional: include coin weight (50 coins = 1 lb) */
  countCoinWeight: boolean;
  /** Optional variant encumbrance */
  useVariantEncumbrance: boolean;
}

/** Bump when compile output shape / rules change so sheets recompile once. */
export const PLAY_COMPILE_VERSION = 2;

export interface PlayCharacterRecord {
  id: string;
  version: 1;
  /** Set after a successful compile/recompile; missing → treat as 0. */
  compileVersion?: number;
  compiled: PlayCharacterCompiled;
  builderJson: BuilderCharacterJson;
  session: PlaySessionState;
  createdAt: string;
  updatedAt: string;
}

export interface PlayRollEntry {
  id: string;
  label: string;
  expression: string;
  total: number;
  detail: string;
  mode: RollMode;
  at: string;
  /** Natural d20 face kept (1–20) when the roll used a d20 test */
  natural?: number;
}

export const EMPTY_DEATH_SAVES: PlayDeathSaves = { successes: 0, failures: 0 };

export const EMPTY_CURRENCY: PlayCurrency = {
  pp: 0,
  gp: 0,
  ep: 0,
  sp: 0,
  cp: 0,
};

export function createInitialSession(
  compiled: PlayCharacterCompiled,
): PlaySessionState {
  const prepared = compiled.spellcasting?.spells
    .filter((s) => s.prepared || s.alwaysPrepared || s.level === 0)
    .map((s) => s.id) ?? [];

  return {
    hp: { current: compiled.hpMax, max: compiled.hpMax, temp: 0 },
    deathSaves: { ...EMPTY_DEATH_SAVES },
    hitDiceSpent: {},
    slotsSpent: {},
    pactSpent: 0,
    featureUsesSpent: {},
    resourcesSpent: {},
    featureOverrides: {},
    conditions: [],
    exhaustion: 0,
    inspiration: false,
    concentration: null,
    preparedSpellIds: prepared,
    inventory: [],
    currency: { ...EMPTY_CURRENCY },
    acAdjust: 0,
    notes: compiled.notes ?? "",
    countCoinWeight: false,
    useVariantEncumbrance: false,
  };
}
