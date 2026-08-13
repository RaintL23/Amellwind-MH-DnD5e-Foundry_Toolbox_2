/**
 * Local autosave of the active Character Builder build. Persists a lossless
 * `BuilderChoiceSnapshot` plus the pieces the snapshot omits (identity refs,
 * core character fields and multiclass), so a reload or browser restart
 * restores exactly what the user had configured.
 *
 * Only the active build is kept (single slot). The catalog data resolved from
 * services (classData/speciesData) is never persisted — it is re-fetched and
 * the selection is re-linked by ref on rehydration.
 */
import type {
  AbilityScores,
  CharacterSelectionRef,
} from "@/shared/types";
import type { BuilderMulticlassEntry } from "@/shared/types/character.types";
import { readJson, removeKey, writeJson } from "@/shared/utils/local-storage.utils";
import type { BuilderChoiceSnapshot } from "../foundry-export/builder-snapshot";
import { BUILDER_SNAPSHOT_VERSION } from "../foundry-export/builder-snapshot";

const STORAGE_KEY = "mh-builder-autosave";

/** Bump when the autosave envelope shape changes incompatibly. */
export const BUILDER_AUTOSAVE_VERSION = 1;

export interface BuilderAutosaveIdentity {
  class: CharacterSelectionRef | null;
  subclass: CharacterSelectionRef | null;
  species: CharacterSelectionRef | null;
  background: CharacterSelectionRef | null;
}

export interface BuilderAutosaveCore {
  name: string;
  size: string;
  alignment: string[];
  level: number;
  abilities: AbilityScores;
}

export interface BuilderAutosaveMulticlass {
  enabled: boolean;
  entries: BuilderMulticlassEntry[];
  primaryClassLevel: number;
}

export interface BuilderAutosaveState {
  version: number;
  snapshotVersion: number;
  identity: BuilderAutosaveIdentity;
  core: BuilderAutosaveCore;
  multiclass: BuilderAutosaveMulticlass;
  snapshot: BuilderChoiceSnapshot;
}

/** Reads the saved build, or null when absent/incompatible/corrupt. */
export function loadBuilderAutosave(): BuilderAutosaveState | null {
  const raw = readJson<BuilderAutosaveState | null>(STORAGE_KEY, null);
  if (!raw || typeof raw !== "object") return null;
  if (raw.version !== BUILDER_AUTOSAVE_VERSION) return null;
  if (raw.snapshotVersion !== BUILDER_SNAPSHOT_VERSION) return null;
  if (!raw.snapshot || !raw.identity || !raw.core || !raw.multiclass) return null;
  return raw;
}

export function persistBuilderAutosave(
  state: Omit<BuilderAutosaveState, "version" | "snapshotVersion">,
): void {
  writeJson(STORAGE_KEY, {
    version: BUILDER_AUTOSAVE_VERSION,
    snapshotVersion: BUILDER_SNAPSHOT_VERSION,
    ...state,
  } satisfies BuilderAutosaveState);
}

export function clearBuilderAutosave(): void {
  removeKey(STORAGE_KEY);
}
