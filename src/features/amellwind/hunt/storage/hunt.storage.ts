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
import type { HuntRollEntry } from "../hooks/useHuntState";
import { readJson, removeKey, writeJson } from "@/shared/utils/local-storage.utils";

const STORAGE_KEY = "mh-hunt";
const TAB_STORAGE_KEY = "mh-hunt:tab";

/** Bump when the persisted shape changes incompatibly. */
export const HUNT_STORAGE_VERSION = 1;

export interface HuntPersistedState {
  version: number;
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

/** Revives `Date` fields lost to JSON serialization in the roll history. */
function reviveRollHistory(history: unknown): HuntRollEntry[] {
  if (!Array.isArray(history)) return [];
  return history.map((entry) => ({
    ...(entry as HuntRollEntry),
    createdAt: new Date((entry as HuntRollEntry).createdAt),
  }));
}

export function loadHuntState(): HuntPersistedState | null {
  const raw = readJson<Partial<HuntPersistedState> | null>(STORAGE_KEY, null);
  if (!raw || typeof raw !== "object") return null;
  if (raw.version !== HUNT_STORAGE_VERSION) return null;
  return {
    version: HUNT_STORAGE_VERSION,
    monsterName: raw.monsterName ?? null,
    monsterSource: raw.monsterSource ?? null,
    environmentName: raw.environmentName ?? null,
    selectedTierIndex: raw.selectedTierIndex ?? 0,
    signsFound: raw.signsFound ?? 0,
    signsRequired: raw.signsRequired ?? 3,
    areasVisited: raw.areasVisited ?? 0,
    flatBonus: raw.flatBonus ?? 0,
    rollMode: raw.rollMode ?? "normal",
    survivalSucceeded: raw.survivalSucceeded ?? true,
    rollHistory: reviveRollHistory(raw.rollHistory),
    prepTables: raw.prepTables ?? createEmptyHuntPrepTables(),
    setupComplete: raw.setupComplete ?? false,
    encounterDifficulty: raw.encounterDifficulty ?? "normal",
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
