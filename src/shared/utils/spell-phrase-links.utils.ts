/**
 * Detects untagged spell names in prose (e.g. "the haste spell", "mending cantrip")
 * and builds RichText phrase links to `/spells?spell=…`.
 *
 * Single-word spell names only link when followed by "spell"/"cantrip" (optionally
 * with a parenthetical like "(lightning)") or by a list parenthetical like
 * "(2 runes)", to avoid false positives on common words (Shield, Jump, Slow, …).
 * Multi-word names may match bare.
 */

import type { RichTextPhraseLink } from "./dnd-rich-text.utils";
import { buildToolboxQueryPath } from "./toolbox-entity-links";

const SPELL_CUE_AFTER_RE = /^(?:\s*\([^)]*\))?\s*(?:spell|cantrip)\b/i;
/** Bare single-word names in cast lists: "harm (6 runes)". */
const LIST_PAREN_AFTER_RE = /^\s*\(/;

function isWordChar(ch: string | undefined): boolean {
  return ch != null && /[a-z0-9']/i.test(ch);
}

function hasWordBoundaries(
  haystack: string,
  start: number,
  end: number,
): boolean {
  const before = start > 0 ? haystack[start - 1] : undefined;
  const after = end < haystack.length ? haystack[end] : undefined;
  return !isWordChar(before) && !isWordChar(after);
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function isSingleWordName(normalizedName: string): boolean {
  return !/\s/.test(normalizedName);
}

function hasSingleWordCue(afterSlice: string): boolean {
  return (
    SPELL_CUE_AFTER_RE.test(afterSlice) || LIST_PAREN_AFTER_RE.test(afterSlice)
  );
}

export interface SpellNameHit {
  /** Canonical catalog name. */
  name: string;
  /** Exact substring from the source text (preserves casing / cue words). */
  phrase: string;
  start: number;
  end: number;
}

/**
 * Finds catalog spell names that appear in `text`. Longer names win overlapping
 * spans. Returns hits sorted by start index.
 */
export function findSpellNameHitsInText(
  text: string,
  spellNames: readonly string[],
): SpellNameHit[] {
  if (!text || spellNames.length === 0) return [];

  const searchText = text.replace(/[\u2018\u2019\u02BC]/g, "'");
  const lower = searchText.toLowerCase();

  const sorted = [...spellNames]
    .map((name) => name.trim())
    .filter((name) => name.length >= 3)
    .sort((a, b) => b.length - a.length);

  const claimed: Array<{ start: number; end: number }> = [];
  const hits: SpellNameHit[] = [];

  for (const name of sorted) {
    const needle = name.replace(/[\u2018\u2019\u02BC]/g, "'").toLowerCase();
    if (!needle) continue;

    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx < 0) break;

      const nameEnd = idx + needle.length;
      if (!hasWordBoundaries(lower, idx, nameEnd)) {
        from = idx + 1;
        continue;
      }

      const afterSlice = searchText.slice(nameEnd);
      const spellCue = afterSlice.match(SPELL_CUE_AFTER_RE);
      const cueLen = spellCue?.[0]?.length ?? 0;
      const spanEnd = nameEnd + cueLen;

      if (isSingleWordName(needle) && !hasSingleWordCue(afterSlice)) {
        from = idx + 1;
        continue;
      }

      if (claimed.some((r) => rangesOverlap(idx, spanEnd, r.start, r.end))) {
        from = idx + 1;
        continue;
      }

      claimed.push({ start: idx, end: spanEnd });
      hits.push({
        name,
        phrase: searchText.slice(idx, spanEnd).replace(/\s+/g, " ").trim(),
        start: idx,
        end: spanEnd,
      });
      break;
    }
  }

  return hits.sort((a, b) => a.start - b.start);
}

/** Builds phrase links for spell names found in `text`. */
export function buildSpellPhraseLinksForText(
  text: string,
  spellNames: readonly string[],
): RichTextPhraseLink[] {
  const hits = findSpellNameHitsInText(text, spellNames);
  const links: RichTextPhraseLink[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    const href = buildToolboxQueryPath("/spells", "spell", hit.name);
    const phrases = new Set<string>([hit.phrase, hit.name]);
    for (const phrase of phrases) {
      const key = phrase.toLowerCase();
      if (!phrase || seen.has(key)) continue;
      seen.add(key);
      links.push({
        id: `spell:${hit.name}`,
        phrase,
        href,
      });
    }
  }

  return links.sort((a, b) => b.phrase.length - a.phrase.length);
}
