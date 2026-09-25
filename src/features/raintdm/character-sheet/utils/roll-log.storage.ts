import type { PlayRollEntry } from "./play-character.types";

const PREFIX = "mh-play-sheet-rolls:";
const MAX_ROLLS = 30;

function key(characterId: string): string {
  return `${PREFIX}${characterId}`;
}

export function loadRollLog(characterId: string): PlayRollEntry[] {
  try {
    const raw = localStorage.getItem(key(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is PlayRollEntry =>
          e != null &&
          typeof e === "object" &&
          typeof (e as PlayRollEntry).id === "string" &&
          typeof (e as PlayRollEntry).label === "string" &&
          typeof (e as PlayRollEntry).total === "number",
      )
      .slice(0, MAX_ROLLS);
  } catch {
    return [];
  }
}

export function saveRollLog(
  characterId: string,
  rolls: PlayRollEntry[],
): void {
  try {
    localStorage.setItem(
      key(characterId),
      JSON.stringify(rolls.slice(0, MAX_ROLLS)),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function clearRollLog(characterId: string): void {
  try {
    localStorage.removeItem(key(characterId));
  } catch {
    // ignore
  }
}

export { MAX_ROLLS };
