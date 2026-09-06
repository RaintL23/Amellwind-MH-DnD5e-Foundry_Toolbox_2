/**
 * Detects condition/disease catalog names in prose and builds RichText phrase
 * links (no href — `DndRichText` opens an in-place detail dialog).
 *
 * Longer names win overlapping spans. Unlike spells, single-word names may
 * match bare (they are already keyword-highlighted in DndRichText).
 */

import type { RichTextPhraseLink } from "./dnd-rich-text.utils";

export type ConditionPhraseKind = "condition" | "disease";

export interface ConditionCatalogEntry {
  name: string;
  kind: ConditionPhraseKind;
}

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

export interface ConditionNameHit {
  name: string;
  kind: ConditionPhraseKind;
  phrase: string;
  start: number;
  end: number;
}

/**
 * Finds catalog condition/disease names in `text`. Longer names win
 * overlapping spans. When the same name exists as both kinds, `disease` wins
 * if listed later in `entries` with equal length (entries should list
 * diseases after conditions, or dedupe with disease preferred).
 */
export function findConditionNameHitsInText(
  text: string,
  entries: readonly ConditionCatalogEntry[],
): ConditionNameHit[] {
  if (!text || entries.length === 0) return [];

  const searchText = text.replace(/[\u2018\u2019\u02BC]/g, "'");
  const lower = searchText.toLowerCase();

  const byLower = new Map<string, ConditionCatalogEntry>();
  for (const entry of entries) {
    const key = entry.name.trim().toLowerCase();
    if (key.length < 3) continue;
    // Prefer disease when both kinds share a name.
    const prev = byLower.get(key);
    if (!prev || entry.kind === "disease") byLower.set(key, entry);
  }

  const sorted = [...byLower.values()].sort(
    (a, b) => b.name.trim().length - a.name.trim().length,
  );

  const claimed: Array<{ start: number; end: number }> = [];
  const hits: ConditionNameHit[] = [];

  for (const entry of sorted) {
    const needle = entry.name
      .trim()
      .replace(/[\u2018\u2019\u02BC]/g, "'")
      .toLowerCase();
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

      if (claimed.some((r) => rangesOverlap(idx, nameEnd, r.start, r.end))) {
        from = idx + 1;
        continue;
      }

      claimed.push({ start: idx, end: nameEnd });
      hits.push({
        name: entry.name.trim(),
        kind: entry.kind,
        phrase: searchText.slice(idx, nameEnd),
        start: idx,
        end: nameEnd,
      });
      break;
    }
  }

  return hits.sort((a, b) => a.start - b.start);
}

/** Builds phrase links for condition/disease names found in `text`. */
export function buildConditionPhraseLinksForText(
  text: string,
  entries: readonly ConditionCatalogEntry[],
): RichTextPhraseLink[] {
  const hits = findConditionNameHitsInText(text, entries);
  const links: RichTextPhraseLink[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    const phrases = new Set<string>([hit.phrase, hit.name]);
    for (const phrase of phrases) {
      const key = phrase.toLowerCase();
      if (!phrase || seen.has(key)) continue;
      seen.add(key);
      links.push({
        id: `${hit.kind}:${hit.name}`,
        phrase,
      });
    }
  }

  return links.sort((a, b) => b.phrase.length - a.phrase.length);
}
