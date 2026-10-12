/**
 * Discriminated envelope for the Builder's native JSON export format.
 * Distinct from a Foundry VTT actor JSON — `kind` is the authoritative
 * discriminator and must be checked before processing the file.
 *
 * `identity` + `core` + `multiclass` + `snapshot` are the restorable state.
 * `meta`, `provenance` and `derived` are read-only summaries regenerated on
 * every export: the Builder ignores them on import (it re-derives everything
 * from the choices), while the Character Sheet compiler and external tools
 * read them. Key order (`art` last) keeps the file readable by hand.
 */
import type { AbilityKey, AbilityScores, DamageType, SkillKey } from "@/shared/types";
import type {
  BuilderAutosaveCore,
  BuilderAutosaveIdentity,
  BuilderAutosaveMulticlass,
} from "../storage/builder-autosave.storage";
import { BUILDER_SNAPSHOT_VERSION } from "../foundry-export/builder-snapshot";
import type { BuilderChoiceSnapshot } from "../foundry-export/builder-snapshot";
import type { AbilityScoreGenerationMethod } from "@/shared/utils/ability-scores";

export const BUILDER_CHARACTER_JSON_KIND = "amellwind-builder-character" as const;

/**
 * Bump when the envelope shape changes; add a step to
 * `migrate-builder-character.ts` so older files keep importing.
 * v2: `meta` (exportedAt moved here), `derived`, ids in `provenance`.
 */
export const BUILDER_CHARACTER_JSON_VERSION = 2;

export const BUILDER_CHARACTER_JSON_APP = "amellwind-toolbox" as const;

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
  /** Catalog id (`SOURCE::Name`). Absent in v1 files. */
  id?: string;
  name: string;
  subclassId?: string | null;
  subclass: string | null;
  level: number;
  primary: boolean;
  features: { level: number; name: string; from: string }[];
}

export interface ProvenanceFeat {
  id?: string;
  name: string;
  source: string;
  grantedBy: string;
  /** Ability score picks made for this feat/ASI, e.g. ["STR +2"]. */
  abilityChoices: string[];
  spellList: string | null;
}

export interface ProvenanceSpell {
  id?: string;
  name: string;
  level: number;
  source: string;
  grantedBy: string;
}

/** Catalog reference for an equipped item (the snapshot keeps the full object). */
export interface ProvenanceItemRef {
  id: string | null;
  name: string;
  source: string | null;
}

export interface ProvenanceRuneRef {
  name: string;
  monster: string | null;
}

export interface ProvenanceEquipment {
  slot: string;
  name: string;
  rarity: string | null;
  /** Rune names; v2 exports also fill `runeRefs`. */
  runes: string[];
  ref?: ProvenanceItemRef;
  runeRefs?: ProvenanceRuneRef[];
}

export interface ProvenanceOptionalFeature extends ProvenanceGrant {
  id?: string;
  progressionId?: string;
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
  optionalFeatures: ProvenanceOptionalFeature[];
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

/** Export metadata (informational; never restored). */
export interface BuilderCharacterMeta {
  /** ISO timestamp of the export. */
  exportedAt: string | null;
  app: string;
  /** Book / UA / brew source codes the build depends on, sorted. */
  sources: string[];
  /** True when the Builder's creation checks passed at export time. */
  complete: boolean;
  /** Pending creation checks at export time (empty when complete). */
  pendingChoices: string[];
}

/** Builder-computed stats at export time (read-only; ignored on import). */
export interface BuilderCharacterDerived {
  proficiencyBonus: number;
  /** Null until a class is chosen. */
  hitPoints: { max: number; hitDice: string } | null;
  armorClass: number;
  initiative: number;
  /** Feet per movement type, e.g. `{ walk: 30, climb: 30 }`. */
  speed: Partial<Record<"walk" | "fly" | "swim" | "climb" | "burrow", number>>;
  passivePerception: number;
  spellcasting: { ability: AbilityKey; saveDc: number; attackBonus: number } | null;
  attunement: { slots: number; artificerBonusMaterialSlots: number };
}

export interface BuilderCharacterJson {
  kind: typeof BUILDER_CHARACTER_JSON_KIND;
  /** Envelope schema version (see BUILDER_CHARACTER_JSON_VERSION). */
  version: number;
  /** Snapshot schema version — must match BUILDER_SNAPSHOT_VERSION. */
  snapshotVersion: number;
  meta?: BuilderCharacterMeta;
  identity: BuilderAutosaveIdentity;
  core: BuilderAutosaveCore;
  multiclass: BuilderAutosaveMulticlass;
  snapshot: BuilderChoiceSnapshot;
  provenance?: BuilderCharacterProvenance;
  derived?: BuilderCharacterDerived;
  art?: BuilderCharacterArt;
}
