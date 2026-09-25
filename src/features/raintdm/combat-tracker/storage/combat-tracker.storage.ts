/**
 * Persists the active Combat Tracker session so a reload restores initiative,
 * HP, rounds, and death saves. Catalog creatures are stored only as refs.
 */
import {
  readJson,
  removeKey,
  writeJson,
} from "@/shared/utils/local-storage.utils";
import type { CombatState } from "../utils/combat-tracker.types";
import { createEmptyCombatState } from "../utils/combat-tracker.types";

const STORAGE_KEY = "raintdm-combat-tracker";

export const COMBAT_TRACKER_STORAGE_VERSION = 1;

export function loadCombatState(): CombatState {
  const raw = readJson<CombatState | null>(STORAGE_KEY, null);
  if (!raw || raw.version !== COMBAT_TRACKER_STORAGE_VERSION) {
    return createEmptyCombatState();
  }
  return {
    ...createEmptyCombatState(),
    ...raw,
    version: 1,
    combatants: Array.isArray(raw.combatants) ? raw.combatants : [],
  };
}

export function saveCombatState(state: CombatState): void {
  writeJson(STORAGE_KEY, state);
}

export function clearCombatState(): void {
  removeKey(STORAGE_KEY);
}
