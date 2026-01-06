/**
 * Weapon Service
 * Handles fetching and processing Hunter Weapons from Amellwind's Guide
 */

import type {
  HunterWeapon,
  WeaponData,
  ParsedFeature,
  OptionalFeature,
} from "../types/weapon.types";
import { MONSTER_HUNTER_GUIDE_JSON_URL } from "@/constants/api.constants";

// Cache for the full data to avoid re-fetching
let cachedData: WeaponData | null = null;

/**
 * Fetches the complete weapon data from the Guide JSON
 */
async function fetchWeaponData(): Promise<WeaponData> {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(MONSTER_HUNTER_GUIDE_JSON_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch weapon data: ${response.statusText}`);
    }

    const data: WeaponData = await response.json();
    cachedData = data;
    return data;
  } catch (error) {
    console.error("Error fetching weapon data:", error);
    throw error;
  }
}

/**
 * Fetches all Hunter Weapons (type: "HW")
 */
export async function fetchHunterWeapons(): Promise<HunterWeapon[]> {
  const data = await fetchWeaponData();

  if (!data.item || !Array.isArray(data.item)) {
    throw new Error("Invalid weapon data structure");
  }

  // Filter only Hunter Weapons (type: "HW")
  const hunterWeapons = data.item.filter(
    (item): item is HunterWeapon => item.type === "HW"
  );

  return hunterWeapons;
}

/**
 * Extract text from any cell value (handles nested tables and objects)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCellValue(cellValue: any): string {
  if (cellValue === null || cellValue === undefined) {
    return "";
  }

  // If it's a simple string or number, return it
  if (typeof cellValue === "string" || typeof cellValue === "number") {
    return String(cellValue);
  }

  // If it's an object (like a nested table)
  if (typeof cellValue === "object") {
    // Handle nested table structure
    if (cellValue.type === "table" && Array.isArray(cellValue.rows)) {
      const features: string[] = [];
      for (const row of cellValue.rows) {
        if (Array.isArray(row)) {
          // Extract all cells in the row
          for (const cell of row) {
            const extracted = extractCellValue(cell);
            if (extracted) {
              features.push(extracted);
            }
          }
        }
      }
      return features.join(", ");
    }

    // Handle other object types with entries
    if (Array.isArray(cellValue.entries)) {
      return cellValue.entries.map(extractCellValue).filter(Boolean).join(" ");
    }

    // Try to stringify if nothing else works
    try {
      return JSON.stringify(cellValue);
    } catch {
      return String(cellValue);
    }
  }

  return String(cellValue);
}

/**
 * Extract rarity information as a dynamic object structure
 * Returns an array of objects where each key is a column label
 */
export function extractRarityInfo(
  weapon: HunterWeapon
): Record<string, string>[] {
  if (!weapon.entries || weapon.entries.length === 0) {
    return [];
  }
  const rarityInfo2: Record<string, string>[] = [];

  // Find the inset entry that contains the rarity table
  for (const entry of weapon.entries) {
    if (typeof entry === "object" && entry.type === "inset" && entry.entries) {
      // Look for the table inside the inset
      for (const innerEntry of entry.entries) {
        if (
          typeof innerEntry === "object" &&
          innerEntry.type === "table" &&
          innerEntry.rows
        ) {
          const colLabels = innerEntry.colLabels || [];
          for (let i = 0; i < innerEntry.rows.length; i++) {
            const row = innerEntry.rows[i];
            const info: Record<string, string> = {};

            for (let j = 0; j < row.length; j++) {
              const label = colLabels[j] || `Column ${j + 1}`;
              // Use extractCellValue to handle nested structures
              info[label] = extractCellValue(row[j]);
            }

            rarityInfo2.push(info);
          }
        }
      }
    }
  }
  return rarityInfo2;
}

/**
 * Extract rarity information from weapon entries
 * Fully dynamic - works with any table structure
 */
// export function extractRarityInfo(weapon: HunterWeapon): RarityInfo[] {
//   if (!weapon.entries || weapon.entries.length === 0) {
//     return [];
//   }
//   const rarities: RarityInfo[] = [];

//   // Find the inset entry that contains the rarity table
//   for (const entry of weapon.entries) {
//     if (typeof entry === "object" && entry.type === "inset" && entry.entries) {
//       // Look for the table inside the inset
//       for (const innerEntry of entry.entries) {
//         if (
//           typeof innerEntry === "object" &&
//           innerEntry.type === "table" &&
//           innerEntry.rows
//         ) {
//           // Get column labels if available
//           const colLabels = innerEntry.colLabels || [];

//           // Find the indices of the core columns (these should always exist)
//           const rarityIdx = colLabels.findIndex(
//             (label: string) => label.toLowerCase() === "rarity"
//           );
//           const slotsIdx = colLabels.findIndex(
//             (label: string) => label.toLowerCase() === "slots"
//           );
//           const bonusIdx = colLabels.findIndex(
//             (label: string) => label.toLowerCase() === "bonus"
//           );

//           // Use default indices if colLabels not found
//           const useRarityIdx = rarityIdx !== -1 ? rarityIdx : 0;
//           const useSlotsIdx = slotsIdx !== -1 ? slotsIdx : 1;
//           const useBonusIdx = bonusIdx !== -1 ? bonusIdx : 2;

//           // Find indices of core columns to exclude from additional columns
//           const coreIndices = new Set([useRarityIdx, useSlotsIdx, useBonusIdx]);

//           // Parse each row
//           for (const row of innerEntry.rows) {
//             if (Array.isArray(row) && row.length > 0) {
//               // Extract additional columns (everything that's not rarity, slots, or bonus)
//               const additionalColumns: RarityColumnData[] = [];

//               for (let i = 0; i < row.length; i++) {
//                 // Skip core columns
//                 if (coreIndices.has(i)) continue;

//                 // Get the label for this column
//                 const label = colLabels[i] || `Column ${i + 1}`;

//                 // Extract the value (handles nested structures)
//                 const value = extractCellValue(row[i]);

//                 if (value) {
//                   additionalColumns.push({ label, value });
//                 }
//               }

//               const rarityInfo: RarityInfo = {
//                 rarity: extractCellValue(row[useRarityIdx]),
//                 slots: extractCellValue(row[useSlotsIdx]),
//                 bonus: extractCellValue(row[useBonusIdx]),
//                 additionalColumns,
//               };

//               rarities.push(rarityInfo);
//             }
//           }
//         }
//       }
//     }
//   }
//   return rarities;
// }

/**
 * Get weapon description (first string entry)
 */
export function getWeaponDescription(weapon: HunterWeapon): string {
  if (!weapon.entries || weapon.entries.length === 0) {
    return "No description available.";
  }
  let description = "";
  // Find the first string entry
  for (const entry of weapon.entries) {
    if (typeof entry === "string") {
      description += entry + "\n";
    }
  }
  if (description.trim() !== "") {
    return description;
  }

  return "No description available.";
}

/**
 * Format weapon properties for display
 */
export function formatWeaponProperties(weapon: HunterWeapon): string[] {
  const properties: string[] = [];

  if (weapon.property && weapon.property.length > 0) {
    const propertyMap: Record<string, string> = {
      H: "Heavy",
      "2H": "Two-Handed",
      F: "Finesse",
      L: "Light",
      V: "Versatile",
      T: "Thrown",
      R: "Reach",
      A: "Ammunition",
      LD: "Loading",
      S: "Special",
    };

    weapon.property.forEach((prop) => {
      properties.push(propertyMap[prop] || prop);
    });
  }

  return properties;
}

/**
 * Format damage for display
 */
export function formatDamage(weapon: HunterWeapon): string {
  const damageTypeMap: Record<string, string> = {
    S: "Slashing",
    P: "Piercing",
    B: "Bludgeoning",
  };

  let damage = "";

  if (weapon.dmg1) {
    damage = weapon.dmg1;
    if (weapon.dmgType) {
      damage += ` ${damageTypeMap[weapon.dmgType] || weapon.dmgType}`;
    }
  }

  if (weapon.dmg2) {
    damage += ` (${weapon.dmg2} versatile)`;
  }

  return damage || "—";
}

/**
 * Format cost for display
 */
export function formatCost(value?: number): string {
  if (!value) return "—";

  const gp = value / 100; // Convert copper to gold
  return `${gp.toLocaleString()} gp`;
}

/**
 * Parse feature string to extract optional feature references
 * Example: "{@optfeature Accelerator Gauge|AGMH}, {@optfeature Detonation Velocity|AGMH}"
 */
export function parseFeatureString(featureString: string): string[] {
  if (!featureString) return [];

  // Regex to match {@optfeature NAME|SOURCE}
  const regex = /\{@optfeature ([^|]+)\|([^}]+)\}/g;
  const features: string[] = [];
  let match;

  while ((match = regex.exec(featureString)) !== null) {
    features.push(match[1].trim()); // Extract feature name
  }

  return features;
}

/**
 * Get optional feature details from cached data
 */
export async function getOptionalFeature(
  featureName: string
): Promise<OptionalFeature | null> {
  try {
    const data = await fetchWeaponData();

    if (!data.optionalfeature || !Array.isArray(data.optionalfeature)) {
      return null;
    }

    const feature = data.optionalfeature.find(
      (f) => f.name.toLowerCase() === featureName.toLowerCase()
    );

    return feature || null;
  } catch (error) {
    console.error("Failed to fetch optional feature:", error);
    return null;
  }
}

/**
 * Parse and fetch all features from a feature string
 */
export async function parseAndFetchFeatures(
  featureString: string
): Promise<ParsedFeature[]> {
  if (!featureString) return [];

  const featureNames = parseFeatureString(featureString);
  const parsedFeatures: ParsedFeature[] = [];

  for (const name of featureNames) {
    const feature = await getOptionalFeature(name);

    if (feature) {
      // Extract description from entries
      let description = "";
      if (feature.entries && feature.entries.length > 0) {
        const firstEntry = feature.entries[0];
        if (typeof firstEntry === "string") {
          description = firstEntry;
        }
      }

      parsedFeatures.push({
        name: feature.name,
        source: feature.source,
        description,
      });
    } else {
      // If not found, add with just the name
      parsedFeatures.push({
        name,
        source: "AGMH",
        description: undefined,
      });
    }
  }

  return parsedFeatures;
}
