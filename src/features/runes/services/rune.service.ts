/**
 * Rune Service
 * Handles fetching and processing runes from monster data
 */

import type {
  Monster,
  Entry,
  ComplexEntry,
  Rune,
} from "@/features/monsters/types/monster.types";
import type { RuneWithMonster } from "../types/rune.types";
import { MONSTER_HUNTER_JSON_URL } from "@/constants/api.constants";

/**
 * Fetch all runes from all monsters
 */
export async function fetchAllRunes(): Promise<RuneWithMonster[]> {
  const response = await fetch(MONSTER_HUNTER_JSON_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch monster data");
  }

  const data = await response.json();
  const monsters: Monster[] = data.monster || [];

  const allRunes: RuneWithMonster[] = [];

  // Extract runes from each monster's fluff data
  for (const monster of monsters) {
    // The fluff is inside each monster object
    const fluff = monster.fluff;

    if (fluff && fluff.entries) {
      const runes = extractRunes(fluff.entries);

      // Add monster information to each rune
      const runesWithMonster = runes.map((rune) => ({
        ...rune,
        monsterName: monster.name,
        monsterSource: monster.source,
      }));

      allRunes.push(...runesWithMonster);
    }
  }

  return allRunes;
}

/**
 * Extract runes from fluff entries
 * (Reused logic from MonsterDetailCard)
 */
function extractRunes(entries: Entry[] | ComplexEntry[]): Rune[] {
  const runes: Rune[] = [];
  if (!entries || entries.length === 0) return runes;

  // Handle case where entries is wrapped in a single inset object
  if (
    entries.length === 1 &&
    typeof entries[0] === "object" &&
    entries[0].entries
  ) {
    entries = entries[0].entries;
  }

  // Helper function to extract runes from list entries
  const extractRunesFromList = (listEntries: any[]) => {
    for (const listEntry of listEntries) {
      if (
        typeof listEntry === "object" &&
        listEntry.type === "list" &&
        listEntry.items
      ) {
        const runeType = determineRuneType(listEntry.name);

        for (const item of listEntry.items) {
          if (typeof item === "object" && item.name) {
            const rune: Rune = {
              name: item.name || "Unknown",
              type: runeType,
              effect: extractEffect(item.entries),
            };
            runes.push(rune);
          }
        }
      }
    }
  };

  // First attempt: Extract runes directly from entries
  extractRunesFromList(entries);

  // Second attempt: If no runes found, look inside inset entries
  if (runes.length === 0) {
    for (const entry of entries) {
      if (
        typeof entry === "object" &&
        entry.type === "inset" &&
        entry.entries
      ) {
        extractRunesFromList(entry.entries);
      }
    }
  }

  return runes;
}

/**
 * Determine rune type from section name
 */
function determineRuneType(sectionName?: string): string {
  if (!sectionName) return "other";

  const name = sectionName.toUpperCase();

  if (name.includes("ARMOR")) return "armor";
  if (name.includes("WEAPON")) return "weapon";

  return "other";
}

/**
 * Extract effect text from entries
 */
function extractEffect(entries?: Entry[] | ComplexEntry[]): string {
  if (!entries || entries.length === 0) return "";

  const effectParts: string[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      effectParts.push(entry);
    } else if (typeof entry === "object") {
      // Try to extract text from complex entries
      if (entry.entries) {
        effectParts.push(extractEffect(entry.entries));
      }
    }
  }

  return effectParts.filter(Boolean).join(" ");
}
