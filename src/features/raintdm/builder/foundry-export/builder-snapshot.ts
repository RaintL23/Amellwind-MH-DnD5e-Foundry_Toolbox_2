/**
 * Lossless snapshot of the Character Builder's choice state, embedded in the
 * exported Foundry actor under a namespaced module flag
 * (`flags["amellwind-toolbox"].builderSnapshot`).
 *
 * Foundry VTT preserves unknown module flags across its own import/export, so a
 * character exported by this app round-trips through Foundry without losing the
 * optional selections (fighting styles, invocations, ASI choices, chosen
 * skills/tools/languages, expertise, spells, feats, …) and equipment metadata
 * (properties/tags, rarity, runes) that the plain dnd5e actor schema cannot
 * represent. When the flag is present on import it is the authoritative source
 * for restoring those choices; when absent (e.g. a Foundry-authored actor) the
 * importer falls back to heuristic, name-based catalog matching.
 */
import type {
  AbilityKey,
  BackgroundAsiMode,
  BackgroundFaction,
  BuilderFeatSelection,
  BuilderOptionalFeatureSelections,
  BuilderSpellSelections,
  CartEntry,
  DamageType,
  EquippedArmor,
  EquippedTrinket,
  EquippedWeapon,
  SkillKey,
} from "@/shared/types";
import type { StandaloneShieldItem } from "../data/shield.data";
import {
  EMPTY_BUILDER_PERSONALITY,
  type BuilderPersonality,
} from "../storage/builder.storage";
import type { AbilityScoreGenerationMethod } from "../utils/ability-scores";

/** Module namespace used for the Foundry actor/item `flags` object. */
export const TOOLBOX_FLAG_NAMESPACE = "amellwind-toolbox";

/** Bump when the snapshot shape changes in a backward-incompatible way. */
export const BUILDER_SNAPSHOT_VERSION = 1;

/** Exact equipped/inventory state, preserving properties, rarity and runes. */
export interface BuilderSnapshotEquipment {
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  armor: EquippedArmor | null;
  shield: StandaloneShieldItem | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;
  /** Loose inventory entries not tied to an equipment slot. */
  inventory: CartEntry[];
}

/**
 * Full set of builder choices that are not recoverable from the dnd5e actor
 * schema alone. Every field maps 1:1 to a `CharacterBuilderContext` value and
 * has a matching setter used during restore.
 */
export interface BuilderChoiceSnapshot {
  version: number;

  // ── Global toggles / misc ──
  useAmellwindHomebrew: boolean;
  abilityScoreMethod: AbilityScoreGenerationMethod;
  useUnarmedStrike: boolean;
  attacksPerTurnOverride: number | null;
  faction: BackgroundFaction | null;
  personality: BuilderPersonality;
  /**
   * Free-form backstory. Optional because snapshots written before it was
   * added must not wipe the notes persisted separately in localStorage.
   */
  backstoryNotes?: string;

  // ── Feats & optional features ──
  featSelections: (BuilderFeatSelection | null)[];
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
  optionalFeatureOriginFeats: (BuilderFeatSelection | null)[];
  originFeatSkillChoices: SkillKey[];
  optionalFeatureOriginFeatSkillChoices: Record<number, SkillKey[]>;
  optionalFeatureSelections: BuilderOptionalFeatureSelections;
  speciesSpellGroupChoice: string | null;

  // ── Ability score origin choices ──
  useTashaOrigin: boolean;
  tashaPlus2: AbilityKey | null;
  tashaPlus1: AbilityKey | null;
  speciesAbilityChoices: (AbilityKey | null)[];
  backgroundAsiMode: BackgroundAsiMode | null;
  backgroundAsiPlus2: AbilityKey | null;
  backgroundAsiPlus1: AbilityKey | null;

  // ── Proficiency choices ──
  classSkillChoices: Record<number, SkillKey[]>;
  backgroundSkillChoices: SkillKey[];
  speciesSkillChoices: SkillKey[];
  featSkillChoices: Record<number, SkillKey[]>;
  expertiseChoices: Record<string, SkillKey[]>;
  classToolChoices: Record<number, string[]>;
  backgroundToolChoices: string[];
  speciesToolChoices: string[];
  speciesWeaponChoices: string[];
  classLanguageChoices: Record<number, string[]>;
  backgroundLanguageChoices: string[];
  speciesLanguageChoices: string[];
  speciesDefenseChoices: Record<number, DamageType[]>;

  // ── Spells ──
  spellSelections: BuilderSpellSelections;

  // ── Equipment ──
  equipment: BuilderSnapshotEquipment;
}

/** Wraps a snapshot in the namespaced flag object placed on the exported actor. */
export function toBuilderSnapshotFlags(
  snapshot: BuilderChoiceSnapshot,
): Record<string, unknown> {
  return { [TOOLBOX_FLAG_NAMESPACE]: { builderSnapshot: snapshot } };
}

// ─── Normalization ────────────────────────────────────────────────────────────

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function arrayOr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function recordOr<T>(value: unknown): Record<string, T> {
  return isRecord(value) ? (value as Record<string, T>) : {};
}

function nullableOr<T>(value: unknown): T | null {
  return value === undefined ? null : (value as T | null);
}

/**
 * Validates the version and fills every missing field with its empty default,
 * so snapshots written by older builds (or edited by hand) restore without
 * crashing on absent arrays/records. Returns `null` for unsupported versions.
 */
export function normalizeBuilderSnapshot(raw: unknown): BuilderChoiceSnapshot | null {
  if (!isRecord(raw) || raw.version !== BUILDER_SNAPSHOT_VERSION) return null;
  const eq = isRecord(raw.equipment) ? raw.equipment : {};
  const personality = isRecord(raw.personality) ? raw.personality : {};

  return {
    version: BUILDER_SNAPSHOT_VERSION,
    useAmellwindHomebrew: raw.useAmellwindHomebrew === true,
    abilityScoreMethod:
      typeof raw.abilityScoreMethod === "string"
        ? (raw.abilityScoreMethod as AbilityScoreGenerationMethod)
        : "manual",
    useUnarmedStrike: raw.useUnarmedStrike === true,
    attacksPerTurnOverride:
      typeof raw.attacksPerTurnOverride === "number"
        ? raw.attacksPerTurnOverride
        : null,
    faction: nullableOr<BackgroundFaction>(raw.faction),
    personality: {
      ...EMPTY_BUILDER_PERSONALITY,
      ...(personality as Partial<BuilderPersonality>),
    },
    ...(typeof raw.backstoryNotes === "string"
      ? { backstoryNotes: raw.backstoryNotes }
      : {}),

    featSelections: arrayOr<BuilderFeatSelection | null>(raw.featSelections),
    speciesOriginFeat: nullableOr<BuilderFeatSelection>(raw.speciesOriginFeat),
    backgroundOriginFeat: nullableOr<BuilderFeatSelection>(raw.backgroundOriginFeat),
    optionalFeatureOriginFeats: arrayOr<BuilderFeatSelection | null>(
      raw.optionalFeatureOriginFeats,
    ),
    originFeatSkillChoices: arrayOr<SkillKey>(raw.originFeatSkillChoices),
    optionalFeatureOriginFeatSkillChoices: recordOr<SkillKey[]>(
      raw.optionalFeatureOriginFeatSkillChoices,
    ),
    optionalFeatureSelections: recordOr<
      BuilderOptionalFeatureSelections[string]
    >(raw.optionalFeatureSelections),
    speciesSpellGroupChoice: nullableOr<string>(raw.speciesSpellGroupChoice),

    useTashaOrigin: raw.useTashaOrigin === true,
    tashaPlus2: nullableOr<AbilityKey>(raw.tashaPlus2),
    tashaPlus1: nullableOr<AbilityKey>(raw.tashaPlus1),
    speciesAbilityChoices: arrayOr<AbilityKey | null>(raw.speciesAbilityChoices),
    backgroundAsiMode: nullableOr<BackgroundAsiMode>(raw.backgroundAsiMode),
    backgroundAsiPlus2: nullableOr<AbilityKey>(raw.backgroundAsiPlus2),
    backgroundAsiPlus1: nullableOr<AbilityKey>(raw.backgroundAsiPlus1),

    classSkillChoices: recordOr<SkillKey[]>(raw.classSkillChoices),
    backgroundSkillChoices: arrayOr<SkillKey>(raw.backgroundSkillChoices),
    speciesSkillChoices: arrayOr<SkillKey>(raw.speciesSkillChoices),
    featSkillChoices: recordOr<SkillKey[]>(raw.featSkillChoices),
    expertiseChoices: recordOr<SkillKey[]>(raw.expertiseChoices),
    classToolChoices: recordOr<string[]>(raw.classToolChoices),
    backgroundToolChoices: arrayOr<string>(raw.backgroundToolChoices),
    speciesToolChoices: arrayOr<string>(raw.speciesToolChoices),
    speciesWeaponChoices: arrayOr<string>(raw.speciesWeaponChoices),
    classLanguageChoices: recordOr<string[]>(raw.classLanguageChoices),
    backgroundLanguageChoices: arrayOr<string>(raw.backgroundLanguageChoices),
    speciesLanguageChoices: arrayOr<string>(raw.speciesLanguageChoices),
    speciesDefenseChoices: recordOr<DamageType[]>(raw.speciesDefenseChoices),

    spellSelections: recordOr<BuilderSpellSelections[number]>(raw.spellSelections),

    equipment: {
      mainHand: nullableOr<EquippedWeapon>(eq.mainHand),
      offHand: nullableOr<EquippedWeapon>(eq.offHand),
      armor: nullableOr<EquippedArmor>(eq.armor),
      shield: nullableOr<StandaloneShieldItem>(eq.shield),
      trinket1: nullableOr<EquippedTrinket>(eq.trinket1),
      trinket2: nullableOr<EquippedTrinket>(eq.trinket2),
      inventory: arrayOr<CartEntry>(eq.inventory),
    },
  };
}

/**
 * Reads and version-checks a builder snapshot from a Foundry document's `flags`.
 * Returns `null` when the flag is missing or the version is unsupported.
 */
export function readBuilderSnapshot(flags: unknown): BuilderChoiceSnapshot | null {
  if (!isRecord(flags)) return null;
  const namespaced = flags[TOOLBOX_FLAG_NAMESPACE];
  if (!isRecord(namespaced)) return null;
  return normalizeBuilderSnapshot(namespaced.builderSnapshot);
}
