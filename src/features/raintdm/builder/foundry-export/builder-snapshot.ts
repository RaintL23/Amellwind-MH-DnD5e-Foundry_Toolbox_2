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
  BuilderMulticlassEntry,
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
import type { AbilityScoreGenerationMethod } from "@/shared/utils/ability-scores";
import {
  abilityMethodOr,
  abilityOr,
  backgroundAsiModeOr,
  factionOr,
  inventoryOf,
  isDamageType,
  isRecord,
  isSkillKey,
  isSpellSelection,
  isString,
  listOf,
  normalizeEquippedArmor,
  normalizeEquippedWeapon,
  normalizeFeatSelection,
  normalizeMulticlassEntries,
  normalizeOptionalFeature,
  normalizeShield,
  normalizeTrinket,
  recordOfLists,
  slotListOf,
  type SnapshotWarn,
} from "./builder-snapshot-validators";

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
  /**
   * Permanent species trait picks keyed by lowercased trait name
   * (e.g. `"giant ancestry"` → `"cloud-s-jaunt-cloud-giant"`).
   */
  speciesTraitChoices: Record<string, string>;

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
  classWeaponChoices: Record<number, string[]>;
  featWeaponChoices: Record<number, string[]>;
  featToolChoices: Record<number, string[]>;
  classLanguageChoices: Record<number, string[]>;
  backgroundLanguageChoices: string[];
  speciesLanguageChoices: string[];
  speciesDefenseChoices: Record<number, DamageType[]>;

  // ── Spells ──
  spellSelections: BuilderSpellSelections;

  // ── Equipment ──
  equipment: BuilderSnapshotEquipment;
}

/**
 * Wraps a snapshot (and the multiclass entries, which carry each additional
 * class's spells) in the namespaced flag object placed on the exported actor.
 */
export function toBuilderSnapshotFlags(
  snapshot: BuilderChoiceSnapshot,
  multiclassEntries: BuilderMulticlassEntry[] = [],
): Record<string, unknown> {
  return {
    [TOOLBOX_FLAG_NAMESPACE]: {
      builderSnapshot: snapshot,
      ...(multiclassEntries.length > 0 ? { builderMulticlass: multiclassEntries } : {}),
    },
  };
}

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Validates the version and fills every missing field with its empty default,
 * so snapshots written by older builds (or edited by hand) restore without
 * crashing. Malformed entries are dropped (or nulled when their index carries
 * meaning) and described in `warnings` when provided. Returns `null` for
 * unsupported versions.
 */
export function normalizeBuilderSnapshot(
  raw: unknown,
  warnings?: string[],
): BuilderChoiceSnapshot | null {
  if (!isRecord(raw) || raw.version !== BUILDER_SNAPSHOT_VERSION) return null;
  const warn: SnapshotWarn = warnings ? (message) => warnings.push(message) : () => {};
  const eq = isRecord(raw.equipment) ? raw.equipment : {};
  const personality = isRecord(raw.personality) ? raw.personality : {};

  const feat = (value: unknown, label: string) => normalizeFeatSelection(value, label, warn);
  const skills = (value: unknown, label: string) => listOf(value, isSkillKey, label, warn);
  const strings = (value: unknown, label: string) => listOf(value, isString, label, warn);
  const skillRecord = (value: unknown, label: string) =>
    recordOfLists(value, skills, label, warn);
  const stringRecord = (value: unknown, label: string) =>
    recordOfLists(value, strings, label, warn);

  const optionalFeatureSelections: BuilderOptionalFeatureSelections = {};
  if (isRecord(raw.optionalFeatureSelections)) {
    for (const [progressionId, picks] of Object.entries(raw.optionalFeatureSelections)) {
      optionalFeatureSelections[progressionId] = slotListOf(
        picks,
        (item) => normalizeOptionalFeature(item, progressionId),
        `Optional feature (${progressionId})`,
        warn,
      );
    }
  }

  const speciesTraitChoices: Record<string, string> = {};
  if (isRecord(raw.speciesTraitChoices)) {
    for (const [trait, optionId] of Object.entries(raw.speciesTraitChoices)) {
      if (isString(optionId)) speciesTraitChoices[trait.toLowerCase()] = optionId;
      else warn(`Species trait choice "${trait}": invalid option was dropped.`);
    }
  }

  return {
    version: BUILDER_SNAPSHOT_VERSION,
    useAmellwindHomebrew: raw.useAmellwindHomebrew === true,
    abilityScoreMethod: abilityMethodOr(raw.abilityScoreMethod, warn),
    useUnarmedStrike: raw.useUnarmedStrike === true,
    attacksPerTurnOverride:
      typeof raw.attacksPerTurnOverride === "number" &&
      Number.isInteger(raw.attacksPerTurnOverride) &&
      raw.attacksPerTurnOverride >= 1
        ? raw.attacksPerTurnOverride
        : null,
    faction: factionOr(raw.faction, warn),
    personality: Object.fromEntries(
      (Object.keys(EMPTY_BUILDER_PERSONALITY) as (keyof BuilderPersonality)[]).map((key) => [
        key,
        typeof personality[key] === "string"
          ? (personality[key] as string)
          : EMPTY_BUILDER_PERSONALITY[key],
      ]),
    ) as unknown as BuilderPersonality,
    ...(typeof raw.backstoryNotes === "string"
      ? { backstoryNotes: raw.backstoryNotes }
      : {}),

    featSelections: slotListOf(raw.featSelections, feat, "Feat slot", warn),
    speciesOriginFeat: raw.speciesOriginFeat
      ? feat(raw.speciesOriginFeat, "Species origin feat")
      : null,
    backgroundOriginFeat: raw.backgroundOriginFeat
      ? feat(raw.backgroundOriginFeat, "Background origin feat")
      : null,
    optionalFeatureOriginFeats: slotListOf(
      raw.optionalFeatureOriginFeats,
      feat,
      "Optional-feature origin feat",
      warn,
    ),
    originFeatSkillChoices: skills(raw.originFeatSkillChoices, "Origin feat skills"),
    optionalFeatureOriginFeatSkillChoices: skillRecord(
      raw.optionalFeatureOriginFeatSkillChoices,
      "Optional-feature origin feat skills",
    ),
    optionalFeatureSelections,
    speciesSpellGroupChoice: isString(raw.speciesSpellGroupChoice)
      ? raw.speciesSpellGroupChoice
      : null,
    speciesTraitChoices,

    useTashaOrigin: raw.useTashaOrigin === true,
    tashaPlus2: abilityOr(raw.tashaPlus2, "Tasha +2", warn),
    tashaPlus1: abilityOr(raw.tashaPlus1, "Tasha +1", warn),
    speciesAbilityChoices: Array.isArray(raw.speciesAbilityChoices)
      ? raw.speciesAbilityChoices.map((ability, index) =>
          abilityOr(ability, `Species ability choice #${index + 1}`, warn),
        )
      : [],
    backgroundAsiMode: backgroundAsiModeOr(raw.backgroundAsiMode, warn),
    backgroundAsiPlus2: abilityOr(raw.backgroundAsiPlus2, "Background +2", warn),
    backgroundAsiPlus1: abilityOr(raw.backgroundAsiPlus1, "Background +1", warn),

    classSkillChoices: skillRecord(raw.classSkillChoices, "Class skills"),
    backgroundSkillChoices: skills(raw.backgroundSkillChoices, "Background skills"),
    speciesSkillChoices: skills(raw.speciesSkillChoices, "Species skills"),
    featSkillChoices: skillRecord(raw.featSkillChoices, "Feat skills"),
    expertiseChoices: recordOfLists(raw.expertiseChoices, skills, "Expertise", warn, false),
    classToolChoices: stringRecord(raw.classToolChoices, "Class tools"),
    backgroundToolChoices: strings(raw.backgroundToolChoices, "Background tools"),
    speciesToolChoices: strings(raw.speciesToolChoices, "Species tools"),
    speciesWeaponChoices: strings(raw.speciesWeaponChoices, "Species weapons"),
    classWeaponChoices: stringRecord(raw.classWeaponChoices, "Class weapons"),
    featWeaponChoices: stringRecord(raw.featWeaponChoices, "Feat weapons"),
    featToolChoices: stringRecord(raw.featToolChoices, "Feat tools"),
    classLanguageChoices: stringRecord(raw.classLanguageChoices, "Class languages"),
    backgroundLanguageChoices: strings(raw.backgroundLanguageChoices, "Background languages"),
    speciesLanguageChoices: strings(raw.speciesLanguageChoices, "Species languages"),
    speciesDefenseChoices: recordOfLists(
      raw.speciesDefenseChoices,
      (value, label) => listOf(value, isDamageType, label, warn),
      "Species defenses",
      warn,
    ),

    spellSelections: recordOfLists(
      raw.spellSelections,
      (value, label) => listOf(value, isSpellSelection, label, warn),
      "Spells",
      warn,
    ),

    equipment: {
      mainHand: normalizeEquippedWeapon(eq.mainHand, "Main hand", warn),
      offHand: normalizeEquippedWeapon(eq.offHand, "Off hand", warn),
      armor: normalizeEquippedArmor(eq.armor, warn),
      shield: normalizeShield(eq.shield, warn),
      trinket1: normalizeTrinket(eq.trinket1, "Trinket 1", warn),
      trinket2: normalizeTrinket(eq.trinket2, "Trinket 2", warn),
      inventory: inventoryOf(eq.inventory, warn),
    },
  };
}

/**
 * Reads and version-checks a builder snapshot from a Foundry document's `flags`.
 * Returns `null` when the flag is missing or the version is unsupported.
 */
/** Additional classes saved by this app on an exported actor ([] when absent). */
export function readBuilderMulticlass(flags: unknown): BuilderMulticlassEntry[] {
  if (!isRecord(flags)) return [];
  const namespaced = flags[TOOLBOX_FLAG_NAMESPACE];
  if (!isRecord(namespaced)) return [];
  return normalizeMulticlassEntries(namespaced.builderMulticlass, () => {});
}

export function readBuilderSnapshot(flags: unknown): BuilderChoiceSnapshot | null {
  if (!isRecord(flags)) return null;
  const namespaced = flags[TOOLBOX_FLAG_NAMESPACE];
  if (!isRecord(namespaced)) return null;
  return normalizeBuilderSnapshot(namespaced.builderSnapshot);
}
