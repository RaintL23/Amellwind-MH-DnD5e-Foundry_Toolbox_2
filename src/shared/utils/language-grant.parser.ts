/**
 * Parse language grants from species/race trait entries (e.g. AGMH "Languages" trait).
 */
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import type { NamedProficiencyGrant, ProficiencySource } from "@/shared/types/proficiency.types";
import { getChooseableLanguages } from "@/shared/data/chooseable-languages";

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  a: 1,
  an: 1,
};

function titleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseCount(token: string): number {
  const lower = token.toLowerCase();
  return NUMBER_WORDS[lower] ?? (Number.parseInt(token, 10) || 1);
}

/** Extract {@language Name|source} references from 5etools markup. */
function extractLanguageMarkup(text: string): string[] {
  const names: string[] = [];
  const pattern = /\{@language\s+([^|}]+)(?:\|[^}]*)?\}/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const name = titleCase(match[1].trim());
    if (name) names.push(name);
  }
  return names;
}

const CHOOSE_SUFFIX =
  /,?\s*and\s+(?:(one|two|three|four|five|a|an|\d+)\s+(?:other\s+)?languages?\s+of\s+(?:your|their)\s+choice)(?:\b|,|\.|$)/i;

const CHOOSE_SUFFIX_SHORT =
  /,?\s*and\s+(?:(one|two|three|four|five|a|an|\d+)\s+(?:other\s+)?languages?)\s+of\s+(?:your|their)\s+choice(?:\b|,|\.|$)/i;

const LEARN_CHOOSE_PATTERN =
  /\b(?:also\s+)?learn(?:s)?\s+(?:(one|two|three|four|five|a|an|\d+)\s+)?languages?\s+of\s+(?:your|their)\s+choice/i;

const YOU_KNOW_CHOOSE_PATTERN =
  /\byou know\s+(.+?)\s+and\s+(one|two|three|four|five|a|an|\d+)\s+other\s+languages?\s+of\s+(?:your|their)\s+choice/i;

function normalizeLanguageName(raw: string): string {
  const trimmed = raw.trim();
  if (/^thieves' cant$/i.test(trimmed)) return "Thieves' Cant";
  return titleCase(trimmed);
}

function pushChooseGrant(
  grants: NamedProficiencyGrant[],
  count: number,
  fixedItems: string[],
  source: ProficiencySource,
  chooseableLanguages: readonly string[],
): void {
  const fixedLower = new Set(fixedItems.map((l) => l.toLowerCase()));
  const options = chooseableLanguages.filter(
    (lang) => !fixedLower.has(lang.toLowerCase()),
  );
  grants.push({
    kind: "any",
    count,
    label: `Language${count > 1 ? "s" : ""}`,
    options: options.length ? [...options] : [...chooseableLanguages],
    source,
  });
}

/**
 * Parse a "Languages" trait block into fixed + choose grants.
 *
 * Examples:
 * - "Common, Lynian, and one other language of their choice."
 * - "Common, Dwarvish, and Troverian."
 * - "Common and one other language of your choice."
 */
export function parseLanguageText(
  text: string,
  source: ProficiencySource,
  chooseableLanguages: readonly string[] = getChooseableLanguages(),
): NamedProficiencyGrant[] {
  const grants: NamedProficiencyGrant[] = [];
  const plain = parseFiveToolsMarkup(text).trim();
  if (!plain) return grants;

  const markupLanguages = extractLanguageMarkup(text);

  let body = plain
    .replace(/^you can speak,?\s*read,?\s*and\s*write\s+/i, "")
    .replace(/\.$/, "")
    .trim();

  let chooseCount = 0;
  const chooseMatch = body.match(CHOOSE_SUFFIX) ?? body.match(CHOOSE_SUFFIX_SHORT);
  if (chooseMatch) {
    chooseCount = parseCount(chooseMatch[1]);
    body = body.slice(0, chooseMatch.index).trim();
  }

  const fixedFromText: string[] = [];
  if (body) {
    for (const segment of body.split(/,\s*/)) {
      const cleaned = segment
        .replace(/^and\s+/i, "")
        .replace(/\s+and\s*$/i, "")
        .trim();
      if (!cleaned || /language/i.test(cleaned)) continue;
      fixedFromText.push(titleCase(cleaned));
    }
  }

  const fixedItems = [...new Set([...markupLanguages, ...fixedFromText])];

  if (fixedItems.length) {
    grants.push({ kind: "fixed", items: fixedItems, source });
  }

  if (chooseCount > 0) {
    pushChooseGrant(grants, chooseCount, fixedItems, source, chooseableLanguages);
  }

  return grants;
}

/**
 * Parse language grants from class feature / trait prose.
 * Handles Rogue Thieves' Cant (2024), Mastermind "learn two languages", etc.
 */
export function parseLanguageGrantsFromFeatureText(
  text: string,
  source: ProficiencySource,
  chooseableLanguages: readonly string[] = getChooseableLanguages(),
): NamedProficiencyGrant[] {
  const grants: NamedProficiencyGrant[] = [];
  const plain = parseFiveToolsMarkup(text);

  const learnMatch = plain.match(LEARN_CHOOSE_PATTERN);
  if (learnMatch) {
    const countToken = learnMatch[1]?.trim();
    const count = countToken ? parseCount(countToken) : 1;
    pushChooseGrant(grants, count, [], source, chooseableLanguages);
    return grants;
  }

  const knowMatch = plain.match(YOU_KNOW_CHOOSE_PATTERN);
  if (knowMatch) {
    const fixedItems = [normalizeLanguageName(knowMatch[1])];
    const count = parseCount(knowMatch[2]);
    grants.push({ kind: "fixed", items: fixedItems, source });
    pushChooseGrant(grants, count, fixedItems, source, chooseableLanguages);
    return grants;
  }

  if (/you can speak,?\s*read,?\s*and\s*write/i.test(plain)) {
    return parseLanguageText(text, source, chooseableLanguages);
  }

  return grants;
}

export function parseLanguageGrantsFromTraits(
  traits: Array<{ name: string; entries: string[] }>,
  source: ProficiencySource,
  chooseableLanguages: readonly string[] = getChooseableLanguages(),
): NamedProficiencyGrant[] {
  const langTrait = traits.find((t) => /^languages?$/i.test(t.name.trim()));
  if (!langTrait?.entries.length) return [];

  const text = langTrait.entries.join(" ");
  return parseLanguageText(text, source, chooseableLanguages);
}

/** Merge structured + trait-based language grants without duplicates. */
export function mergeLanguageGrants(
  ...groups: NamedProficiencyGrant[][]
): NamedProficiencyGrant[] {
  const result: NamedProficiencyGrant[] = [];
  for (const group of groups) {
    for (const grant of group) {
      const duplicate = result.some(
        (g) =>
          g.kind === grant.kind &&
          g.source.type === grant.source.type &&
          g.source.name === grant.source.name &&
          JSON.stringify(g) === JSON.stringify(grant),
      );
      if (!duplicate) result.push(grant);
    }
  }
  return result;
}
