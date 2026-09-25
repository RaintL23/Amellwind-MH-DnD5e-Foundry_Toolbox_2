/**
 * Discriminated envelope for the Builder's native JSON export format.
 * Distinct from a Foundry VTT actor JSON — `kind` is the authoritative
 * discriminator and must be checked before processing the file.
 *
 * `identity` + `core` + `multiclass` + `snapshot` are the restorable state.
 * `provenance` is a read-only, human-readable explanation of why the character
 * has each feature/proficiency; it is regenerated on export and ignored on
 * import (the builder re-derives everything from the choices).
 */
import type { AbilityKey, AbilityScores, DamageType, SkillKey } from "@/shared/types";
import type {
  BuilderAutosaveCore,
  BuilderAutosaveIdentity,
  BuilderAutosaveMulticlass,
} from "../storage/builder-autosave.storage";
import { BUILDER_SNAPSHOT_VERSION } from "../foundry-export/builder-snapshot";
import type { BuilderChoiceSnapshot } from "../foundry-export/builder-snapshot";
import type { AbilityScoreGenerationMethod } from "../utils/ability-scores";

export const BUILDER_CHARACTER_JSON_KIND = "amellwind-builder-character" as const;

/** Bump when the envelope shape changes in a backward-incompatible way. */
export const BUILDER_CHARACTER_JSON_VERSION = 1;

export { BUILDER_SNAPSHOT_VERSION };

/** Portrait/token as data URLs (session-only in the builder, kept in the file). */
export interface BuilderCharacterArt {
  portrait: string | null;
  token: string | null;
}

/** One granted thing plus the human-readable reasons it is on the sheet. */
export interface ProvenanceGrant {
  name: string;
  grantedBy: string[];
}

export interface ProvenanceClassEntry {
  name: string;
  subclass: string | null;
  level: number;
  primary: boolean;
  features: { level: number; name: string; from: string }[];
}

export interface ProvenanceFeat {
  name: string;
  source: string;
  grantedBy: string;
  /** Ability score picks made for this feat/ASI, e.g. ["STR +2"]. */
  abilityChoices: string[];
  spellList: string | null;
}

export interface ProvenanceSpell {
  name: string;
  level: number;
  source: string;
  grantedBy: string;
}

export interface ProvenanceEquipment {
  slot: string;
  name: string;
  rarity: string | null;
  runes: string[];
}

export interface BuilderCharacterProvenance {
  /** e.g. "Human · Fighter 5 (Champion) · Soldier". */
  summary: string;
  totalLevel: number;
  classes: ProvenanceClassEntry[];
  species: {
    name: string;
    traits: string[];
    spellGroupChoice: string | null;
  } | null;
  background: { name: string; faction: string | null } | null;
  abilityScores: {
    method: AbilityScoreGenerationMethod;
    base: AbilityScores;
    final: AbilityScores;
    /** Origin bonuses picked by the player, e.g. ["Background: DEX +2"]. */
    originBonuses: string[];
  };
  feats: ProvenanceFeat[];
  optionalFeatures: ProvenanceGrant[];
  savingThrows: AbilityKey[];
  skills: (ProvenanceGrant & { skill: SkillKey; expertise: string | null })[];
  tools: ProvenanceGrant[];
  languages: ProvenanceGrant[];
  armor: ProvenanceGrant[];
  weapons: ProvenanceGrant[];
  defenses: (ProvenanceGrant & { damageType: DamageType; kind: string })[];
  spells: ProvenanceSpell[];
  /** Spells granted automatically by class/subclass optional features. */
  grantedSpells: { name: string; grantedBy: string; unlockedAtLevel: number }[];
  equipment: ProvenanceEquipment[];
}

export interface BuilderCharacterJson {
  kind: typeof BUILDER_CHARACTER_JSON_KIND;
  /** Envelope schema version — bump on incompatible envelope changes. */
  version: number;
  /** Snapshot schema version — must match BUILDER_SNAPSHOT_VERSION. */
  snapshotVersion: number;
  /** ISO timestamp of the export (informational). */
  exportedAt?: string;
  identity: BuilderAutosaveIdentity;
  core: BuilderAutosaveCore;
  multiclass: BuilderAutosaveMulticlass;
  snapshot: BuilderChoiceSnapshot;
  art?: BuilderCharacterArt;
  provenance?: BuilderCharacterProvenance;
}
