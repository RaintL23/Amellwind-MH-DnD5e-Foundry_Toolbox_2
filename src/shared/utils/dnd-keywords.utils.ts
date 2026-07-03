import { ABILITY_NAMES, SKILL_LABELS } from "@/shared/constants/dnd";
import type { DamageType } from "@/shared/types";

export type DndKeywordCategory =
  | "action"
  | "combat"
  | "save"
  | "condition"
  | "resource"
  | "defense"
  | "movement"
  | "distance"
  | "dice";

export const DND_KEYWORD_CLASS: Record<DndKeywordCategory, string> = {
  action: "text-sky-400 font-medium",
  combat: "text-amber-400 font-medium",
  save: "text-violet-400 font-medium",
  condition: "text-rose-400 font-medium",
  resource: "text-emerald-400 font-medium",
  defense: "text-orange-400 font-medium",
  movement: "text-teal-400 font-medium",
  distance: "text-cyan-400 font-medium",
  dice: "font-mono text-fuchsia-400 font-semibold",
};

interface DndKeyword {
  term: string;
  category: DndKeywordCategory;
}

const DAMAGE_TYPES: DamageType[] = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];

function formatDamageTypeTerm(type: DamageType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Common D&D 5e terms, longest first for safe overlapping matches. */
const STATIC_DND_KEYWORDS: DndKeyword[] = [
  // Action economy
  { term: "action bonus", category: "action" },
  { term: "bonus actions", category: "action" },
  { term: "bonus action", category: "action" },
  { term: "opportunity attacks", category: "action" },
  { term: "opportunity attack", category: "action" },
  { term: "reactions", category: "action" },
  { term: "reaction", category: "action" },
  { term: "melee weapon attacks", category: "action" },
  { term: "ranged weapon attacks", category: "action" },
  { term: "melee weapon attack", category: "action" },
  { term: "ranged weapon attack", category: "action" },
  { term: "attack action", category: "action" },
  { term: "dash action", category: "action" },
  { term: "dodge action", category: "action" },
  { term: "disengage action", category: "action" },
  { term: "help action", category: "action" },
  { term: "hide action", category: "action" },
  { term: "ready action", category: "action" },
  { term: "search action", category: "action" },
  { term: "your action", category: "action" },
  { term: "an action", category: "action" },
  { term: "the action", category: "action" },
  { term: "actions", category: "action" },
  { term: "action", category: "action" },

  // Combat & damage
  { term: "temporary hit points", category: "combat" },
  { term: "critical hits", category: "combat" },
  { term: "critical hit", category: "combat" },
  { term: "attack rolls", category: "combat" },
  { term: "attack roll", category: "combat" },
  { term: "spell attacks", category: "combat" },
  { term: "spell attack", category: "combat" },
  { term: "weapon attacks", category: "combat" },
  { term: "weapon attack", category: "combat" },
  { term: "unarmed strikes", category: "combat" },
  { term: "unarmed strike", category: "combat" },
  { term: "hit points", category: "combat" },
  { term: "hit point", category: "combat" },
  { term: "damage", category: "combat" },
  { term: "healing", category: "combat" },
  { term: "attacks", category: "combat" },
  { term: "attack", category: "combat" },
  { term: "attacker", category: "combat" },
  { term: "unarmed attacks", category: "combat" },
  { term: "unarmed strikes", category: "combat" },

  // Saves, checks & rolls
  { term: "saving throws", category: "save" },
  { term: "saving throw", category: "save" },
  { term: "proficiency bonus", category: "save" },
  { term: "advantage", category: "save" },
  { term: "disadvantage", category: "save" },
  { term: "saving throw", category: "save" },
  { term: " DC ", category: "save" },
  { term: " dc ", category: "save" },
  { term: "dc bonus", category: "save" },
  { term: " check rolls bonus", category: "save" },
  { term: " check roll ", category: "save" },
  { term: " check ", category: "save" },
  { term: " checks ", category: "save" },
  { term: " check ", category: "save" },

  // Resources & duration
  { term: "spell slots", category: "resource" },
  { term: "spell slot", category: "resource" },
  { term: "short rest", category: "resource" },
  { term: "long rest", category: "resource" },
  { term: "concentration", category: "resource" },
  { term: "duration", category: "resource" },

  // Conditions
  { term: "incapacitated", category: "condition" },
  { term: "unconscious", category: "condition" },
  { term: "frightened", category: "condition" },
  { term: "restrained", category: "condition" },
  { term: "paralyzed", category: "condition" },
  { term: "petrified", category: "condition" },
  { term: "exhaustion", category: "condition" },
  { term: "grappled", category: "condition" },
  { term: "invisible", category: "condition" },
  { term: "poisoned", category: "condition" },
  { term: "blinded", category: "condition" },
  { term: "deafened", category: "condition" },
  { term: "charmed", category: "condition" },
  { term: "stunned", category: "condition" },
  { term: "prone", category: "condition" },

  // Defense & resistances
  { term: "armor class", category: "defense" },
  { term: " AC ", category: "defense" },
  { term: "nonmagical", category: "defense" },
  { term: "resistance", category: "defense" },
  { term: "immunity", category: "defense" },
  { term: "vulnerability", category: "defense" },
  { term: "magical", category: "defense" },

  // Movement & senses
  { term: "difficult terrain", category: "movement" },
  { term: "darkvision", category: "movement" },
  { term: "tremorsense", category: "movement" },
  { term: "truesight", category: "movement" },
  { term: "blindsight", category: "movement" },
  { term: "movement", category: "movement" },
  { term: "speed", category: "movement" },
  { term: "jump", category: "movement" },

  // Distance, range & area (static phrases; numeric measures use DISTANCE_PATTERN)
  { term: "line of sight", category: "distance" },
  { term: "point of origin", category: "distance" },
  { term: "area of effect", category: "distance" },
  { term: "hemisphere", category: "distance" },
  { term: "emanation", category: "distance" },
  { term: "cylinder", category: "distance" },
  { term: "diameter", category: "distance" },
  { term: "spreads", category: "distance" },
  { term: "spread", category: "distance" },
  { term: "bursts", category: "distance" },
  { term: "burst", category: "distance" },
  { term: "spheres", category: "distance" },
  { term: "sphere", category: "distance" },
  { term: "cylinders", category: "distance" },
  { term: "cones", category: "distance" },
  { term: "cone", category: "distance" },
  { term: "cubes", category: "distance" },
  { term: "cube", category: "distance" },
  { term: "radius", category: "distance" },
  { term: "miles", category: "distance" },
  { term: "mile", category: "distance" },
  { term: "reach", category: "distance" },
  { term: "range", category: "distance" },
  { term: "ranged", category: "distance" },
  { term: "melee", category: "distance" },
];

const DND_KEYWORDS: DndKeyword[] = [
  ...STATIC_DND_KEYWORDS,
  ...Object.values(ABILITY_NAMES).map((term) => ({
    term,
    category: "save" as const,
  })),
  ...Object.values(SKILL_LABELS).map((term) => ({
    term,
    category: "save" as const,
  })),
  ...DAMAGE_TYPES.map((type) => ({
    term: formatDamageTypeTerm(type),
    category: "combat" as const,
  })),
];

const KEYWORD_LOOKUP = new Map(
  DND_KEYWORDS.map((kw) => [kw.term.toLowerCase(), kw.category]),
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const KEYWORD_REGEX = new RegExp(
  `(${[...DND_KEYWORDS]
    .sort((a, b) => b.term.length - a.term.length)
    .map(({ term }) => escapeRegex(term).replace(/\s+/g, "\\s+"))
    .join("|")})`,
  "gi",
);

/**
 * Numeric distances and hyphenated measures common in 5e text
 * (e.g. "30-foot", "60 feet", "5 ft.", "1 mile", "20-foot radius").
 */
const DISTANCE_PATTERN = new RegExp(
  [
    "\\d+(?:\\s*[-–]\\s*|\\s+)(?:foot|feet|ft\\.?)(?:\\s+(?:radius|cube|cone|cylinder|sphere|line|emanation|hemisphere|diameter|square|long|wide|high|deep))?",
    "\\d+(?:\\s*[-–]\\s*|\\s+)(?:mile|miles)\\b",
    "\\b\\d+\\s*[-–]\\s*(?:foot|feet)\\b",
  ].join("|"),
  "gi",
);

/**
 * Dice notation in plain text (e.g. "1d10", "2d6+3", "8d6", "d20", "d%").
 */
const DICE_PATTERN = /\d+d\d+(?:\s*[-+×x]\s*\d+)?|\bd\d+\b|d%/gi;

function splitByPattern(
  text: string,
  pattern: RegExp,
  category: DndKeywordCategory,
): DndTextSegment[] {
  if (!text) return [];

  const segments: DndTextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        category: null,
      });
    }
    segments.push({ text: match[0], category });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), category: null });
  }

  return segments.length > 0 ? segments : [{ text, category: null }];
}

function splitDistancePatterns(text: string): DndTextSegment[] {
  return splitByPattern(text, DISTANCE_PATTERN, "distance");
}

function splitDicePatterns(text: string): DndTextSegment[] {
  return splitByPattern(text, DICE_PATTERN, "dice");
}

export interface DndTextSegment {
  text: string;
  category: DndKeywordCategory | null;
}

export function splitDndKeywords(text: string): DndTextSegment[] {
  if (!text) return [];

  const result: DndTextSegment[] = [];

  for (const distanceSegment of splitDistancePatterns(text)) {
    if (distanceSegment.category) {
      result.push(distanceSegment);
      continue;
    }

    for (const diceSegment of splitDicePatterns(distanceSegment.text)) {
      if (diceSegment.category) {
        result.push(diceSegment);
        continue;
      }

      const keywordParts = diceSegment.text
        .split(KEYWORD_REGEX)
        .filter((part) => part.length > 0)
        .map((part) => ({
          text: part,
          category: KEYWORD_LOOKUP.get(part.toLowerCase()) ?? null,
        }));

      result.push(...keywordParts);
    }
  }

  return result;
}
