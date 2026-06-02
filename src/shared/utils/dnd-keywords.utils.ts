export type DndKeywordCategory =
  | "action"
  | "combat"
  | "save"
  | "condition"
  | "resource"
  | "defense"
  | "movement";

export const DND_KEYWORD_CLASS: Record<DndKeywordCategory, string> = {
  action: "text-sky-400 font-medium",
  combat: "text-amber-400 font-medium",
  save: "text-violet-400 font-medium",
  condition: "text-rose-400 font-medium",
  resource: "text-emerald-400 font-medium",
  defense: "text-orange-400 font-medium",
  movement: "text-teal-400 font-medium",
};

interface DndKeyword {
  term: string;
  category: DndKeywordCategory;
}

/** Common D&D 5e terms, longest first for safe overlapping matches. */
const DND_KEYWORDS: DndKeyword[] = [
  // Action economy
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

  // Saves, checks & rolls
  { term: "saving throws", category: "save" },
  { term: "saving throw", category: "save" },
  { term: "proficiency bonus", category: "save" },
  { term: "advantage", category: "save" },
  { term: "disadvantage", category: "save" },

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

export interface DndTextSegment {
  text: string;
  category: DndKeywordCategory | null;
}

export function splitDndKeywords(text: string): DndTextSegment[] {
  if (!text) return [];

  return text
    .split(KEYWORD_REGEX)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      category: KEYWORD_LOOKUP.get(part.toLowerCase()) ?? null,
    }));
}