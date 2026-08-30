/**
 * Persists the active Hunt Planner session so a reload or browser restart
 * restores the setup, generated prep tables and tracker progress.
 *
 * Monster/environment are stored by name (+ source for monsters, which can
 * collide across books) and re-resolved against the catalogs on load. Catalog
 * objects themselves are never persisted.
 */
import type { RollMode } from "@/features/amellwind/environments/utils/environmentRoll.utils";
import type { HuntPrepTables } from "../data/hunt-prep-defaults.data";
import { createEmptyHuntPrepTables } from "../data/hunt-prep-defaults.data";
import type { HuntEncounterDifficulty } from "../utils/hunt-prep-generator.utils";
import type { HuntRollEntry, HuntTrackingRollMode } from "../hooks/useHuntState";
import type { HuntTargetProgress } from "../utils/hunt-party.utils";
import {
  createDefaultHunterLevels,
  DEFAULT_HUNTER_COUNT,
} from "../utils/hunt-party.utils";
import { readJson, removeKey, writeJson } from "@/shared/utils/local-storage.utils";

const STORAGE_KEY = "mh-hunt";
const TAB_STORAGE_KEY = "mh-hunt:tab";

/** Bump when the persisted shape changes incompatibly. */
export const HUNT_STORAGE_VERSION = 3;

export interface HuntMonsterRef {
  name: string;
  source: string | null;
}

export interface HuntTargetRef {
  id: string;
  name: string;
  source: string | null;
}

export interface HuntPersistedStateV1 {
  version: 1;
  monsterName: string | null;
  monsterSource: string | null;
  environmentName: string | null;
  selectedTierIndex: number;
  signsFound: number;
  signsRequired: number;
  areasVisited: number;
  flatBonus: number;
  rollMode: RollMode;
  survivalSucceeded: boolean;
  rollHistory: HuntRollEntry[];
  prepTables: HuntPrepTables;
  setupComplete: boolean;
  encounterDifficulty: HuntEncounterDifficulty;
}

export interface HuntPersistedStateV2 {
  version: 2;
  monsters: HuntMonsterRef[];
  activeTrackingTargetKey: string | null;
  environmentName: string | null;
  selectedTierIndex: number;
  signsRequired: number;
  targetProgress: Record<string, HuntTargetProgress>;
  areasVisited: number;
  flatBonus: number;
  rollMode: RollMode;
  trackingRollMode: HuntTrackingRollMode;
  manualFindingSignsRoll: number | null;
  survivalSucceeded: boolean;
  hunterCount: number;
  hunterLevels: number[];
  scoutAmbushSpotNoticed: boolean;
  rollHistory: HuntRollEntry[];
  prepTables: HuntPrepTables;
  setupComplete: boolean;
  encounterDifficulty: HuntEncounterDifficulty;
}

export interface HuntPersistedState {
  version: typeof HUNT_STORAGE_VERSION;
  targets: HuntTargetRef[];
  activeTrackingTargetKey: string | null;
  environmentName: string | null;
  selectedTierIndex: number;
  signsRequired: number;
  targetProgress: Record<string, HuntTargetProgress>;
  areasVisited: number;
  flatBonus: number;
  rollMode: RollMode;
  trackingRollMode: HuntTrackingRollMode;
  manualFindingSignsRoll: number | null;
  survivalSucceeded: boolean;
  hunterCount: number;
  hunterLevels: number[];
  scoutAmbushSpotNoticed: boolean;
  rollHistory: HuntRollEntry[];
  prepTables: HuntPrepTables;
  setupComplete: boolean;
  encounterDifficulty: HuntEncounterDifficulty;
}

/** Revives `Date` fields lost to JSON serialization in the roll history. */
function reviveRollHistory(history: unknown): HuntRollEntry[] {
  if (!Array.isArray(history)) return [];
  return history.map((entry) => ({
    ...(entry as HuntRollEntry),
    createdAt: new Date((entry as HuntRollEntry).createdAt),
  }));
}

function createPersistedTargetId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `hunt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function monsterRefKey(ref: Pick<HuntMonsterRef, "name" | "source">): string {
  return `${ref.name}::${ref.source ?? ""}`;
}

function migrateV1ToV2(raw: HuntPersistedStateV1): HuntPersistedStateV2 {
  const monsters: HuntMonsterRef[] =
    raw.monsterName != null
      ? [{ name: raw.monsterName, source: raw.monsterSource ?? null }]
      : [];
  const activeKey =
    monsters.length > 0
      ? `${monsters[0].name}::${monsters[0].source ?? ""}`
      : null;
  const targetProgress: Record<string, HuntTargetProgress> = {};
  if (activeKey) {
    targetProgress[activeKey] = {
      signsFound: raw.signsFound ?? 0,
      found: (raw.signsFound ?? 0) >= (raw.signsRequired ?? 3),
    };
  }

  return {
    version: 2,
    monsters,
    activeTrackingTargetKey: activeKey,
    environmentName: raw.environmentName ?? null,
    selectedTierIndex: raw.selectedTierIndex ?? 0,
    signsRequired: raw.signsRequired ?? 3,
    targetProgress,
    areasVisited: raw.areasVisited ?? 0,
    flatBonus: raw.flatBonus ?? 0,
    rollMode: raw.rollMode ?? "normal",
    trackingRollMode: "random",
    manualFindingSignsRoll: null,
    survivalSucceeded: raw.survivalSucceeded ?? true,
    hunterCount: DEFAULT_HUNTER_COUNT,
    hunterLevels: createDefaultHunterLevels(DEFAULT_HUNTER_COUNT),
    scoutAmbushSpotNoticed: false,
    rollHistory: reviveRollHistory(raw.rollHistory),
    prepTables: raw.prepTables ?? createEmptyHuntPrepTables(),
    setupComplete: raw.setupComplete ?? false,
    encounterDifficulty: raw.encounterDifficulty ?? "normal",
  };
}

function migrateV2ToV3(raw: HuntPersistedStateV2): HuntPersistedState {
  const targets: HuntTargetRef[] = (raw.monsters ?? []).map((monster) => ({
    id: createPersistedTargetId(),
    name: monster.name,
    source: monster.source,
  }));

  const targetProgress: Record<string, HuntTargetProgress> = {};
  for (const target of targets) {
    targetProgress[target.id] =
      raw.targetProgress[monsterRefKey(target)] ?? {
        signsFound: 0,
        found: false,
      };
  }

  let activeTrackingTargetKey = raw.activeTrackingTargetKey;
  if (activeTrackingTargetKey) {
    const matchedTarget = targets.find(
      (target) => monsterRefKey(target) === activeTrackingTargetKey,
    );
    activeTrackingTargetKey = matchedTarget?.id ?? targets[0]?.id ?? null;
  }

  return {
    version: HUNT_STORAGE_VERSION,
    targets,
    activeTrackingTargetKey,
    environmentName: raw.environmentName ?? null,
    selectedTierIndex: raw.selectedTierIndex ?? 0,
    signsRequired: raw.signsRequired ?? 3,
    targetProgress,
    areasVisited: raw.areasVisited ?? 0,
    flatBonus: raw.flatBonus ?? 0,
    rollMode: raw.rollMode ?? "normal",
    trackingRollMode: raw.trackingRollMode ?? "random",
    manualFindingSignsRoll: raw.manualFindingSignsRoll ?? null,
    survivalSucceeded: raw.survivalSucceeded ?? true,
    hunterCount: raw.hunterCount ?? DEFAULT_HUNTER_COUNT,
    hunterLevels:
      raw.hunterLevels ??
      createDefaultHunterLevels(raw.hunterCount ?? DEFAULT_HUNTER_COUNT),
    scoutAmbushSpotNoticed: raw.scoutAmbushSpotNoticed ?? false,
    rollHistory: reviveRollHistory(raw.rollHistory),
    prepTables: raw.prepTables ?? createEmptyHuntPrepTables(),
    setupComplete: raw.setupComplete ?? false,
    encounterDifficulty: raw.encounterDifficulty ?? "normal",
  };
}

export function loadHuntState(): HuntPersistedState | null {
  const raw = readJson<
    Partial<HuntPersistedState | HuntPersistedStateV2 | HuntPersistedStateV1> | null
  >(STORAGE_KEY, null);
  if (!raw || typeof raw !== "object") return null;

  if (raw.version === 1) {
    return migrateV2ToV3(migrateV1ToV2(raw as HuntPersistedStateV1));
  }

  if (raw.version === 2) {
    return migrateV2ToV3(raw as HuntPersistedStateV2);
  }

  if (raw.version !== HUNT_STORAGE_VERSION) return null;

  const state = raw as HuntPersistedState;
  return {
    version: HUNT_STORAGE_VERSION,
    targets: Array.isArray(state.targets) ? state.targets : [],
    activeTrackingTargetKey: state.activeTrackingTargetKey ?? null,
    environmentName: state.environmentName ?? null,
    selectedTierIndex: state.selectedTierIndex ?? 0,
    signsRequired: state.signsRequired ?? 3,
    targetProgress: state.targetProgress ?? {},
    areasVisited: state.areasVisited ?? 0,
    flatBonus: state.flatBonus ?? 0,
    rollMode: state.rollMode ?? "normal",
    trackingRollMode: state.trackingRollMode ?? "random",
    manualFindingSignsRoll: state.manualFindingSignsRoll ?? null,
    survivalSucceeded: state.survivalSucceeded ?? true,
    hunterCount: state.hunterCount ?? DEFAULT_HUNTER_COUNT,
    hunterLevels:
      state.hunterLevels ??
      createDefaultHunterLevels(state.hunterCount ?? DEFAULT_HUNTER_COUNT),
    scoutAmbushSpotNoticed: state.scoutAmbushSpotNoticed ?? false,
    rollHistory: reviveRollHistory(state.rollHistory),
    prepTables: state.prepTables ?? createEmptyHuntPrepTables(),
    setupComplete: state.setupComplete ?? false,
    encounterDifficulty: state.encounterDifficulty ?? "normal",
  };
}

export function persistHuntState(
  state: Omit<HuntPersistedState, "version">,
): void {
  writeJson(STORAGE_KEY, { version: HUNT_STORAGE_VERSION, ...state });
}

export function clearHuntState(): void {
  removeKey(STORAGE_KEY);
}

/** True when any prep table has content worth preserving on reload. */
export function huntPrepTablesHaveContent(tables: HuntPrepTables): boolean {
  return (
    tables.signs.length > 0 ||
    tables.minorChallenges.length > 0 ||
    tables.majorChallenges.length > 0 ||
    tables.benefits.length > 0
  );
}

export function loadHuntActiveTab(): string | null {
  return readJson<string | null>(TAB_STORAGE_KEY, null);
}

export function persistHuntActiveTab(tab: string): void {
  writeJson(TAB_STORAGE_KEY, tab);
}
