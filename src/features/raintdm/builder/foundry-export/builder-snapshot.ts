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
import type { BuilderPersonality } from "../storage/builder.storage";
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

/**
 * Reads and version-checks a builder snapshot from a Foundry document's `flags`.
 * Returns `null` when the flag is missing or the version is unsupported.
 */
export function readBuilderSnapshot(flags: unknown): BuilderChoiceSnapshot | null {
  if (typeof flags !== "object" || flags === null) return null;
  const namespaced = (flags as Record<string, unknown>)[TOOLBOX_FLAG_NAMESPACE];
  if (typeof namespaced !== "object" || namespaced === null) return null;
  const snapshot = (namespaced as Record<string, unknown>).builderSnapshot;
  if (typeof snapshot !== "object" || snapshot === null) return null;
  if ((snapshot as Record<string, unknown>).version !== BUILDER_SNAPSHOT_VERSION) {
    return null;
  }
  return snapshot as BuilderChoiceSnapshot;
}
