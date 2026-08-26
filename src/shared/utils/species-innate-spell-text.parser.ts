/**
 * Fallback parser: species trait prose → innate cantrips / leveled spell grants.
 * Used when `additionalSpells` is missing but traits say e.g.
 * "You know the {@spell create bonfire|XGE} cantrip. When you reach 3rd level…"
 */
import type {
  SpeciesLineageInnateSpell,
  SpeciesNamedSpellGroup,
} from "@/shared/types/dnd-race.types";

const SPELL_TAG_RE = /\{@spell\s+([^|}]+)(?:\|[^}]*)?\}/gi;
const REACH_LEVEL_RE = /reach\s+(\d+)(?:st|nd|rd|th)\s+level/gi;

function titleCaseSpellName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function flattenTraitTexts(entries: unknown[]): string[] {
  const texts: string[] = [];

  const walk = (value: unknown) => {
    if (typeof value === "string") {
      if (value.trim()) texts.push(value);
      return;
    }
    if (Array.isArray(value)) {
      for (const child of value) walk(child);
      return;
    }
    if (typeof value !== "object" || value === null) return;
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.entries)) walk(obj.entries);
  };

  walk(entries);
  return texts;
}

function unlockLevelBeforeIndex(text: string, index: number): number {
  const before = text.slice(0, index);
  let level = 1;
  REACH_LEVEL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = REACH_LEVEL_RE.exec(before)) !== null) {
    level = Number(match[1]);
  }
  return level;
}

export function parseInnateSpellGrantsFromText(text: string): {
  cantrips: string[];
  innateSpells: SpeciesLineageInnateSpell[];
} {
  const cantrips: string[] = [];
  const innateSpells: SpeciesLineageInnateSpell[] = [];
  const seenCantrips = new Set<string>();
  const seenInnate = new Set<string>();

  SPELL_TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SPELL_TAG_RE.exec(text)) !== null) {
    const name = titleCaseSpellName(match[1] ?? "");
    if (!name) continue;

    const beforeTail = text.slice(Math.max(0, match.index - 40), match.index);
    const after = text.slice(
      match.index,
      Math.min(text.length, match.index + match[0].length + 48),
    );
    const isCantrip =
      /\bcantrips?\b/i.test(after) || /\bcantrips?\b/i.test(beforeTail);
    const unlockLevel = unlockLevelBeforeIndex(text, match.index);

    if (isCantrip) {
      const key = name.toLowerCase();
      if (seenCantrips.has(key)) continue;
      seenCantrips.add(key);
      cantrips.push(name);
      continue;
    }

    const innateKey = `${name.toLowerCase()}@${unlockLevel}`;
    if (seenInnate.has(innateKey)) continue;
    seenInnate.add(innateKey);
    innateSpells.push({ name, unlockedAtCharacterLevel: unlockLevel });
  }

  return { cantrips, innateSpells };
}

/**
 * Builds a synthetic named spell group from trait entries when structured
 * `additionalSpells` is absent.
 */
export function parseInnateSpellGroupFromTraitEntries(
  traitEntries: unknown[],
): SpeciesNamedSpellGroup | null {
  const texts = flattenTraitTexts(traitEntries);
  if (!texts.length) return null;

  const cantrips: string[] = [];
  const innateSpells: SpeciesLineageInnateSpell[] = [];
  const seenCantrips = new Set<string>();
  const seenInnate = new Set<string>();

  for (const text of texts) {
    const parsed = parseInnateSpellGrantsFromText(text);
    for (const name of parsed.cantrips) {
      const key = name.toLowerCase();
      if (seenCantrips.has(key)) continue;
      seenCantrips.add(key);
      cantrips.push(name);
    }
    for (const grant of parsed.innateSpells) {
      const key = `${grant.name.toLowerCase()}@${grant.unlockedAtCharacterLevel}`;
      if (seenInnate.has(key)) continue;
      seenInnate.add(key);
      innateSpells.push(grant);
    }
  }

  if (!cantrips.length && !innateSpells.length) return null;

  return {
    name: "Innate Spells",
    cantrips,
    innateSpells,
  };
}
