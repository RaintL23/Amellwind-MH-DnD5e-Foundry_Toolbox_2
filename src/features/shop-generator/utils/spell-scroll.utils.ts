import type { DndItem, Spell } from "@/shared/types";

const ORDINAL_TO_LEVEL: Record<string, number> = {
  cantrip: 0,
  "0": 0,
  "1": 1,
  "1st": 1,
  "2": 2,
  "2nd": 2,
  "3": 3,
  "3rd": 3,
  "4": 4,
  "4th": 4,
  "5": 5,
  "5th": 5,
  "6": 6,
  "6th": 6,
  "7": 7,
  "7th": 7,
  "8": 8,
  "8th": 8,
  "9": 9,
  "9th": 9,
};

/**
 * Parse a generic spell-scroll template name to its spell level.
 * Returns null for non-templates (including already-named scrolls).
 */
export function parseSpellScrollLevel(itemName: string): number | null {
  const raw = itemName.trim().toLowerCase();
  if (!raw.startsWith("spell scroll")) return null;

  const paren = raw.match(
    /^spell scroll\s*\(\s*(cantrip|level\s*\d+|\d+(?:st|nd|rd|th)?(?:\s*level)?)\s*\)$/i,
  );
  if (paren) {
    return normalizeScrollLevelToken(paren[1]);
  }

  const comma = raw.match(
    /^spell scroll\s*,\s*(cantrip|\d+(?:st|nd|rd|th)?)\s*$/i,
  );
  if (comma) {
    return normalizeScrollLevelToken(comma[1]);
  }

  return null;
}

function normalizeScrollLevelToken(token: string): number | null {
  const cleaned = token
    .toLowerCase()
    .replace(/level/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned in ORDINAL_TO_LEVEL) return ORDINAL_TO_LEVEL[cleaned];
  const digits = cleaned.match(/^(\d+)/);
  if (digits) {
    const n = Number(digits[1]);
    if (n >= 0 && n <= 9) return n;
  }
  return null;
}

export function isGenericSpellScrollItem(item: Pick<DndItem, "name">): boolean {
  return parseSpellScrollLevel(item.name) != null;
}

export function formatSpellScrollName(spellName: string): string {
  return `Spell Scroll (${spellName})`;
}

/** CSV / pricing aliases for catalog names like "Spell Scroll (3rd Level)". */
export function spellScrollPricingAliasKeys(normalizedName: string): string[] {
  const level = parseSpellScrollLevel(normalizedName);
  if (level == null) return [];
  if (level === 0) return ["spell scroll cantrip"];
  const ordinal =
    level === 1
      ? "1st"
      : level === 2
        ? "2nd"
        : level === 3
          ? "3rd"
          : `${level}th`;
  return [`spell scroll ${ordinal}`];
}

export function filterSpellsForShopSources(
  spells: Spell[],
  sources: string[],
): Spell[] {
  if (sources.length === 0) return spells;
  const allowed = new Set(sources);
  const filtered = spells.filter(
    (spell) =>
      allowed.has(spell.source) ||
      (spell.variantSources?.some((s) => allowed.has(s)) ?? false),
  );
  // Item sources and spell sources don't always overlap (e.g. DMG-only shops).
  return filtered.length > 0 ? filtered : spells;
}

export function spellsByLevel(
  spells: Spell[],
): Map<number, Spell[]> {
  const map = new Map<number, Spell[]>();
  for (const spell of spells) {
    const list = map.get(spell.level);
    if (list) list.push(spell);
    else map.set(spell.level, [spell]);
  }
  return map;
}

export function pickRandomSpell(
  candidates: Spell[],
  usedSpellKeys: Set<string>,
): Spell | null {
  const unused = candidates.filter(
    (spell) => !usedSpellKeys.has(spell.name.toLowerCase()),
  );
  const pool = unused.length > 0 ? unused : candidates;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function collectUsedSpellKeysFromStock(
  names: Iterable<string>,
): Set<string> {
  const used = new Set<string>();
  for (const name of names) {
    const match = name.match(/^spell scroll\s*\(\s*(.+?)\s*\)$/i);
    if (!match) continue;
    const inner = match[1].trim().toLowerCase();
    // Skip generic level labels so they don't block real spell names.
    if (parseSpellScrollLevel(`Spell Scroll (${match[1].trim()})`) != null) {
      continue;
    }
    used.add(inner);
  }
  return used;
}
