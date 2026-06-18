const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

const CANTRIP_BONUS_PATTERNS: RegExp[] = [
  /\b(?:you|your character)\s+(?:also\s+)?know(?:s)?\s+(?:(?<word>a|an|one|two|three|four|five|\d+)\s+)?(?:(?:extra|additional|more|another)\s+)cantrips?\b/gi,
  /\b(?:gain|gains|learn(?:s)?|get(?:s)?)\s+(?:(?<word>a|an|one|two|three|four|five|\d+)\s+)?(?:(?:extra|additional|more|another)\s+)?cantrips?\b/gi,
  /\b(?:(?<word>a|an|one|two|three|four|five|\d+)\s+)?(?:extra|additional|more|another)\s+cantrips?\b/gi,
  /\bcantrips?\b.{0,40}\b(?:extra|additional|more|another)\b/gi,
];

function parseCount(raw: string | undefined, fallback = 1): number {
  if (!raw) return fallback;
  const lower = raw.trim().toLowerCase();
  if (/^\d+$/.test(lower)) return Math.max(1, Number(lower));
  return WORD_NUMBERS[lower] ?? fallback;
}

/**
 * Detects how many additional cantrips a feature grants from plain text
 * (e.g. Magician: "You know one extra cantrip from the Druid spell list").
 */
export function parseCantripBonusFromText(text: string): number {
  if (!text.trim()) return 0;

  let max = 0;
  for (const pattern of CANTRIP_BONUS_PATTERNS) {
    pattern.lastIndex = 0;
    let patternTotal = 0;
    for (const match of text.matchAll(pattern)) {
      const groups = match.groups as { word?: string } | undefined;
      patternTotal += parseCount(groups?.word);
    }
    max = Math.max(max, patternTotal);
  }

  return max;
}

export function parseCantripBonusFromEntries(entries: string[]): number {
  return parseCantripBonusFromText(entries.join(" "));
}

export interface ParsedCantripGrant {
  count: number;
  spellListClassName: string | null;
}

const SPELL_LIST_CLASS_PATTERNS: RegExp[] = [
  /\bfrom the\s+(\w+)\s+spell list\b/gi,
  /\blearn\s+(?:(?:a|an|one|two|three|four|five|\d+)\s+)?cantrips?\s+of your choice from the\s+(\w+)\b/gi,
  /\{@filter\s+[^|}]*\|[^|}]*class=(\w+)/gi,
  /\bclass=(\w+)\b/gi,
];

/** Resolves which class spell list a cantrip grant uses (e.g. "Druid", "Cleric"). */
export function parseSpellListClassFromText(text: string): string | null {
  for (const pattern of SPELL_LIST_CLASS_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.[1]) {
      const raw = match[1].trim();
      if (!raw || /^(spells?|level|filter)$/i.test(raw)) continue;
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
  }
  return null;
}

/** Parses cantrip choose grants from feature/feat text (one pool per passage). */
export function parseCantripGrantsFromText(
  text: string,
  fallbackClassName?: string | null,
): ParsedCantripGrant[] {
  if (!text.trim()) return [];

  const count = parseCantripBonusFromText(text);
  if (count <= 0) return [];

  const spellListClassName =
    parseSpellListClassFromText(text) ?? fallbackClassName ?? null;
  if (!spellListClassName) return [];

  return [{ count, spellListClassName }];
}

export function parseCantripGrantsFromEntries(
  entries: string[],
  fallbackClassName?: string | null,
): ParsedCantripGrant[] {
  return parseCantripGrantsFromText(entries.join(" "), fallbackClassName);
}

const ALWAYS_PREPARED_SPELL_RE =
  /\balways have (?:the )?(.+?) spell (?:prepared|cast)\b/gi;
const ALWAYS_PREPARED_SHORT_RE =
  /\balways have (?:the )?(.+?) prepared\b/gi;

/** Fixed spells granted by feature text (already plain, post-markup). */
export function extractFixedSpellNamesFromText(text: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string) => {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name || /cantrip/i.test(name)) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(name);
  };

  for (const pattern of [ALWAYS_PREPARED_SPELL_RE, ALWAYS_PREPARED_SHORT_RE]) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      add(match[1] ?? "");
    }
  }

  return names;
}

export function extractFixedSpellNamesFromEntries(entries: string[]): string[] {
  return extractFixedSpellNamesFromText(entries.join(" "));
}
