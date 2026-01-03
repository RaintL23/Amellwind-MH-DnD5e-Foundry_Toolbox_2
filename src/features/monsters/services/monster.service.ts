/**
 * Monster data fetching service
 *
 * Handles fetching and parsing monster data from external sources
 * Uses TanStack Query for caching and state management
 */

import type {
  MonsterData,
  Monster,
  MonsterFluff,
} from "../types/monster.types";
import { MONSTER_HUNTER_JSON_URL } from "@/constants/api.constants";

// Cache for the full data to avoid re-fetching for fluff
let cachedData: MonsterData | null = null;

/**
 * Fetches the complete monster data from the Monster Hunter homebrew JSON
 * @throws Error if fetch fails or JSON is invalid
 */
async function fetchMonsterData(): Promise<MonsterData> {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(MONSTER_HUNTER_JSON_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MonsterData = await response.json();
    cachedData = data;
    return data;
  } catch (error) {
    console.error("Failed to fetch monster data:", error);
    throw error;
  }
}

/**
 * Fetches monster data from the Monster Hunter homebrew JSON
 * @throws Error if fetch fails or JSON is invalid
 */
export async function fetchMonsters(): Promise<Monster[]> {
  const data = await fetchMonsterData();

  // Extract monsters array from the response
  if (!data.monster || !Array.isArray(data.monster)) {
    throw new Error("Invalid monster data structure");
  }

  return data.monster;
}

/**
 * Fetches fluff (lore/description) for a specific monster
 * @param monsterName - Name of the monster
 * @param source - Source of the monster
 * @returns MonsterFluff or null if not found
 */
export async function fetchMonsterFluff(
  monsterName: string,
  source: string
): Promise<MonsterFluff | null> {
  try {
    const data = await fetchMonsterData();

    if (!data.monster || !Array.isArray(data.monster)) {
      return null;
    }

    const selectedMonsterData = data.monster.find(
      (m) => m.name === monsterName && m.source === source
    );

    if (!selectedMonsterData) {
      return null;
    }

    return selectedMonsterData.fluff || null;
  } catch (error) {
    console.error("Failed to fetch monster fluff:", error);
    return null;
  }
}

/**
 * Helper function to get monster CR as a sortable number
 * Handles fractional CRs like "1/2", "1/4", etc.
 * Also handles CR objects with {cr, lair} structure
 */
export function getCRValue(
  cr:
    | string
    | number
    | { cr: string | number; lair?: string | number }
    | undefined
): number {
  if (cr === undefined) return 0;
  if (typeof cr === "number") return cr;

  // Handle CR object (e.g., {cr: "5", lair: "7"})
  if (typeof cr === "object" && "cr" in cr) {
    const crValue = cr.cr;
    if (typeof crValue === "number") return crValue;
    if (typeof crValue === "string") {
      if (crValue.includes("/")) {
        const [numerator, denominator] = crValue.split("/").map(Number);
        return numerator / denominator;
      }
      return Number(crValue) || 0;
    }
    return 0;
  }

  // Handle fractional CRs
  if (cr.includes("/")) {
    const [numerator, denominator] = cr.split("/").map(Number);
    return numerator / denominator;
  }

  return Number(cr) || 0;
}

/**
 * Helper function to format CR for display
 * Handles CR objects with lair/coven information
 */
export function formatCR(
  cr:
    | string
    | number
    | { cr: string | number; lair?: string | number; coven?: string | number }
    | undefined
): string {
  if (cr === undefined) return "—";
  if (typeof cr === "number") return String(cr);
  if (typeof cr === "string") return cr;

  // Handle CR object with lair
  if (typeof cr === "object" && "cr" in cr) {
    const baseCR = String(cr.cr);
    const parts = [baseCR];

    if (cr.lair !== undefined) {
      parts.push(`${cr.lair} (lair)`);
    }
    if (cr.coven !== undefined) {
      parts.push(`${cr.coven} (coven)`);
    }

    return parts.join(" / ");
  }

  return "—";
}

/**
 * Helper function to format monster type
 * Handles both string and object type formats
 */
export function getMonsterType(
  type: string | { type: string; tags?: string[] } | undefined
): string {
  if (!type) return "Unknown";
  if (typeof type === "string") return type;
  return type.type;
}

/**
 * Size abbreviation to full name mapping
 */
const SIZE_MAP: Record<string, string> = {
  T: "Tiny",
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
};

/**
 * Helper function to convert size abbreviation to full name
 */
export function formatSizeName(sizeAbbr: string): string {
  return SIZE_MAP[sizeAbbr] || sizeAbbr;
}

/**
 * Helper function to get monster size(s)
 * Handles both single size and array of sizes
 * Converts abbreviations to full names (e.g., "M" -> "Medium")
 */
export function getMonsterSize(size: string | string[] | undefined): string {
  if (!size) return "Unknown";
  if (Array.isArray(size)) {
    return size.map(formatSizeName).join(", ");
  }
  return formatSizeName(size);
}
