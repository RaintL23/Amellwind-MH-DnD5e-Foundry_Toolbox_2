/**
 * Persists the shared Rune Build (weapon/armor/trinket runes and rarities) so
 * it survives reloads, browser restarts and leaving the /runes + /builder
 * routes. Runes are stored by identity (name + monster) and re-resolved against
 * the rune service on load, so stale rune data never lingers.
 */
import type { Rune } from "@/shared/types";
import { readJson, removeKey, writeJson } from "@/shared/utils/local-storage.utils";
import type { ItemRarity } from "../context/RuneBuildContext";

const STORAGE_KEY = "mh-rune-build";

/** Bump when the persisted shape changes incompatibly. */
export const RUNE_BUILD_STORAGE_VERSION = 1;

export interface RuneRef {
  name: string;
  monsterName: string;
}

export interface RuneBuildPersistedState {
  version: number;
  weaponRarity: ItemRarity;
  armorRarity: ItemRarity;
  weaponRunes: (RuneRef | null)[];
  armorRunes: (RuneRef | null)[];
  trinket1Rune: RuneRef | null;
  trinket2Rune: RuneRef | null;
}

export function runeToRef(rune: Rune | null): RuneRef | null {
  if (!rune) return null;
  return { name: rune.name, monsterName: rune.monsterName };
}

export function runeRefKey(ref: Pick<Rune, "name" | "monsterName">): string {
  return `${ref.name}||${ref.monsterName}`;
}

export function loadRuneBuild(): RuneBuildPersistedState | null {
  const raw = readJson<RuneBuildPersistedState | null>(STORAGE_KEY, null);
  if (!raw || typeof raw !== "object") return null;
  if (raw.version !== RUNE_BUILD_STORAGE_VERSION) return null;
  return raw;
}

export function persistRuneBuild(
  state: Omit<RuneBuildPersistedState, "version">,
): void {
  writeJson(STORAGE_KEY, { version: RUNE_BUILD_STORAGE_VERSION, ...state });
}

export function clearRuneBuild(): void {
  removeKey(STORAGE_KEY);
}
