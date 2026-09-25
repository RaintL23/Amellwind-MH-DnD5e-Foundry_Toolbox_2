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
import {
  BUILDER_SNAPSHOT_VERSION,
  normalizeBuilderSnapshot,
  type BuilderChoiceSnapshot,
} from "../foundry-export/builder-snapshot";

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

export type BuilderPersistedBuild = Omit<
  BuilderAutosaveState,
  "version" | "snapshotVersion"
>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSelectionRef(value: unknown): CharacterSelectionRef | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;
  return {
    id: value.id,
    name: value.name,
    subraceId: typeof value.subraceId === "string" ? value.subraceId : null,
    subraceName: typeof value.subraceName === "string" ? value.subraceName : null,
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

/**
 * Validates identity/core/multiclass/snapshot of a persisted build and fills
 * defaults for missing optional pieces. Returns null when the shape is not a
 * restorable build (wrong snapshot version, missing sections).
 */
export function normalizeBuilderPersistedBuild(
  raw: UnknownRecord,
): BuilderPersistedBuild | null {
  const snapshot = normalizeBuilderSnapshot(raw.snapshot);
  if (!snapshot) return null;
  if (!isRecord(raw.identity) || !isRecord(raw.core)) return null;

  const identity = raw.identity;
  const core = raw.core;
  const multiclass = isRecord(raw.multiclass) ? raw.multiclass : {};
  const rawAbilities = isRecord(core.abilities) ? core.abilities : {};

  const abilities = Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, clampInt(rawAbilities[key], 1, 30, 10)]),
  ) as unknown as AbilityScores;

  const entries: BuilderMulticlassEntry[] = Array.isArray(multiclass.entries)
    ? multiclass.entries.filter(isRecord).map((entry) => ({
        classRef: normalizeSelectionRef(entry.classRef),
        subclass: normalizeSelectionRef(entry.subclass),
        level: clampInt(entry.level, 0, 19, 1),
      }))
    : [];

  return {
    identity: {
      class: normalizeSelectionRef(identity.class),
      subclass: normalizeSelectionRef(identity.subclass),
      species: normalizeSelectionRef(identity.species),
      background: normalizeSelectionRef(identity.background),
    },
    core: {
      name: typeof core.name === "string" ? core.name : "Hunter",
      size: core.size === "S" ? "S" : "M",
      alignment: Array.isArray(core.alignment)
        ? core.alignment.filter((a): a is string => typeof a === "string")
        : [],
      level: clampInt(core.level, 1, 20, 1),
      abilities,
    },
    multiclass: {
      enabled: multiclass.enabled === true && entries.length > 0,
      entries,
      primaryClassLevel: clampInt(multiclass.primaryClassLevel, 1, 20, 1),
    },
    snapshot,
  };
}

/** Reads the saved build, or null when absent/incompatible/corrupt. */
export function loadBuilderAutosave(): BuilderAutosaveState | null {
  const raw = readJson<unknown>(STORAGE_KEY, null);
  if (!isRecord(raw)) return null;
  if (raw.version !== BUILDER_AUTOSAVE_VERSION) return null;
  if (raw.snapshotVersion !== BUILDER_SNAPSHOT_VERSION) return null;
  const build = normalizeBuilderPersistedBuild(raw);
  if (!build) return null;
  return {
    version: BUILDER_AUTOSAVE_VERSION,
    snapshotVersion: BUILDER_SNAPSHOT_VERSION,
    ...build,
  };
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
