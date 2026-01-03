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
import { MONSTER_HUNTER_MONSTER_MANUAL_JSON_URL } from "@/constants/api.constants";
import { getCRValue } from "@/features/monsters/services/monster.service";

/**
 * Fetch all runes from all monsters
 */
export async function fetchAllRunes(): Promise<RuneWithMonster[]> {
  const response = await fetch(MONSTER_HUNTER_MONSTER_MANUAL_JSON_URL);
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

      // Calculate tier based on monster CR
      const crValue = getCRValue(monster.cr);
      const tier = calculateTier(crValue);

      // Add monster information and metadata to each rune
      const runesWithMonster = runes.map((rune) => ({
        ...rune,
        monsterName: monster.name,
        monsterSource: monster.source,
        tier,
        intent: detectIntent(rune.effect),
        weapons: detectWeapons(rune.effect),
        classes: detectClasses(rune.effect),
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

/**
 * Calculate tier based on monster CR
 */
function calculateTier(crValue: number): number {
  if (crValue < 1) return 0;
  if (crValue >= 1 && crValue < 8) return 1;
  if (crValue >= 8 && crValue < 14) return 2;
  if (crValue >= 14 && crValue < 18) return 3;
  return 4;
}

/**
 * Detect intencionalidad (intent) from rune effect text
 */
function detectIntent(effect: string): string[] {
  const intents: string[] = [];
  const lowerEffect = effect.toLowerCase();

  // Critical damage/hits
  if (lowerEffect.includes("critical") || lowerEffect.includes("crit")) {
    intents.push("critical");
  }

  // Elemental damage
  if (
    lowerEffect.includes("fire") ||
    lowerEffect.includes("cold") ||
    lowerEffect.includes("lightning") ||
    lowerEffect.includes("thunder") ||
    lowerEffect.includes("acid") ||
    lowerEffect.includes("poison") ||
    lowerEffect.includes("psychic") ||
    lowerEffect.includes("necrotic") ||
    lowerEffect.includes("radiant") ||
    lowerEffect.includes("force")
  ) {
    intents.push("elemental");
  }

  // Weapon damage
  if (
    lowerEffect.includes("weapon damage") ||
    lowerEffect.includes("weapon attack") ||
    lowerEffect.includes("melee weapon") ||
    lowerEffect.includes("ranged weapon")
  ) {
    intents.push("weapon-damage");
  }

  // Spells with charges
  if (
    lowerEffect.includes("spell") &&
    (lowerEffect.includes("charge") ||
      lowerEffect.includes("cast") ||
      lowerEffect.includes("once per"))
  ) {
    intents.push("spell-charges");
  }

  // Healing
  if (lowerEffect.includes("heal") || lowerEffect.includes("hit point")) {
    intents.push("healing");
  }

  // AC/Defense
  if (
    lowerEffect.includes("armor class") ||
    lowerEffect.includes("ac") ||
    lowerEffect.includes("defense")
  ) {
    intents.push("defense");
  }

  // Resistance
  if (lowerEffect.includes("resistance")) {
    intents.push("resistance");
  }

  // Movement
  if (
    lowerEffect.includes("speed") ||
    lowerEffect.includes("movement") ||
    lowerEffect.includes("fly") ||
    lowerEffect.includes("swim")
  ) {
    intents.push("movement");
  }

  // Saving throws
  if (lowerEffect.includes("saving throw")) {
    intents.push("saving-throw");
  }

  // Ability scores
  if (
    lowerEffect.includes("strength") ||
    lowerEffect.includes("dexterity") ||
    lowerEffect.includes("constitution") ||
    lowerEffect.includes("intelligence") ||
    lowerEffect.includes("wisdom") ||
    lowerEffect.includes("charisma")
  ) {
    intents.push("ability-score");
  }

  return intents;
}

/**
 * Detect specific weapons mentioned in rune effect
 */
function detectWeapons(effect: string): string[] {
  const weapons: string[] = [];
  const lowerEffect = effect.toLowerCase();

  const weaponList = [
    "longsword",
    "greatsword",
    "shortsword",
    "sword",
    "bow",
    "longbow",
    "shortbow",
    "crossbow",
    "lance",
    "hammer",
    "axe",
    "greataxe",
    "battleaxe",
    "handaxe",
    "switch axe",
    "charge blade",
    "insect glaive",
    "hunting horn",
    "gunlance",
    "heavy bowgun",
    "light bowgun",
    "dual blades",
    "katana",
    "staff",
    "quarterstaff",
    "spear",
    "pike",
    "halberd",
    "glaive",
    "club",
    "mace",
    "flail",
    "whip",
    "dagger",
    "rapier",
    "scimitar",
  ];

  for (const weapon of weaponList) {
    if (lowerEffect.includes(weapon)) {
      weapons.push(weapon);
    }
  }

  return weapons;
}

/**
 * Detect specific classes mentioned in rune effect
 */
function detectClasses(effect: string): string[] {
  const classes: string[] = [];
  const lowerEffect = effect.toLowerCase();

  const classList = [
    "barbarian",
    "bard",
    "cleric",
    "druid",
    "fighter",
    "monk",
    "paladin",
    "ranger",
    "rogue",
    "sorcerer",
    "warlock",
    "wizard",
    "artificer",
  ];

  for (const className of classList) {
    if (lowerEffect.includes(className)) {
      classes.push(className);
    }
  }

  return classes;
}
