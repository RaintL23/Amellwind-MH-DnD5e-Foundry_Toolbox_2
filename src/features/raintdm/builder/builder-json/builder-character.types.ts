/**
 * Discriminated envelope for the Builder's native JSON export format.
 * Distinct from a Foundry VTT actor JSON — `kind` is the authoritative
 * discriminator and must be checked before processing the file.
 */
import type {
  BuilderAutosaveCore,
  BuilderAutosaveIdentity,
  BuilderAutosaveMulticlass,
} from "../storage/builder-autosave.storage";
import { BUILDER_SNAPSHOT_VERSION } from "../foundry-export/builder-snapshot";
import type { BuilderChoiceSnapshot } from "../foundry-export/builder-snapshot";

export const BUILDER_CHARACTER_JSON_KIND = "amellwind-builder-character" as const;

/** Bump when the envelope shape changes in a backward-incompatible way. */
export const BUILDER_CHARACTER_JSON_VERSION = 1;

export { BUILDER_SNAPSHOT_VERSION };

export interface BuilderCharacterJson {
  kind: typeof BUILDER_CHARACTER_JSON_KIND;
  /** Envelope schema version — bump on incompatible envelope changes. */
  version: number;
  /** Snapshot schema version — must match BUILDER_SNAPSHOT_VERSION. */
  snapshotVersion: number;
  identity: BuilderAutosaveIdentity;
  core: BuilderAutosaveCore;
  multiclass: BuilderAutosaveMulticlass;
  snapshot: BuilderChoiceSnapshot;
}
