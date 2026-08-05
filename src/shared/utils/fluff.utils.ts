/**
 * Shared 5etools "fluff" attachment helpers.
 *
 * Several feature services (feats, backgrounds, …) load an entity file plus a
 * parallel `*-fluff` file and merge the matching fluff entry onto each entity
 * by `name|source`. This logic used to be copy-pasted per feature.
 */
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

export type RawWithSource = Record<string, unknown>;

export function buildFluffIndex(
  fluffEntries: RawWithSource[],
): Map<string, RawWithSource> {
  const index = new Map<string, RawWithSource>();
  for (const entry of fluffEntries) {
    const name = entry.name;
    const source = entry.source;
    if (typeof name === "string" && typeof source === "string") {
      index.set(`${name}|${source}`.toLowerCase(), entry);
    }
  }
  return index;
}

export function attachFluff(
  raw: RawWithSource,
  fluffIndex: Map<string, RawWithSource>,
): RawWithSource {
  const name = raw.name;
  const source = raw.source;
  if (typeof name !== "string" || typeof source !== "string") return raw;
  if (raw.fluff) return raw;

  const fluffEntry = fluffIndex.get(`${name}|${source}`.toLowerCase());
  if (fluffEntry && raw.hasFluff !== false) {
    return { ...raw, fluff: fluffEntry };
  }
  return raw;
}

/** Attaches matching fluff entries onto a list of raw entities. */
export function attachFluffEntries(
  raws: RawWithSource[],
  fluffEntries: RawWithSource[],
): RawWithSource[] {
  const fluffIndex = buildFluffIndex(fluffEntries);
  return raws.map((raw) => attachFluff(raw, fluffIndex));
}

export interface MapFluffEntriesToTextOptions {
  /**
   * When true, object entries with an `entries` array are flattened.
   * When false (default), only top-level string entries are included.
   */
  nested?: boolean;
  /**
   * When nested, use full section content extraction (D&D backgrounds) instead
   * of string-only nested entries (species/races).
   */
  sectionNested?: boolean;
  /** Joiner between top-level fluff paragraphs. Default: `\n\n`. */
  entryJoiner?: string;
}

type FluffEntryProcessor = (entries: unknown[]) => string;

/**
 * Converts a 5etools `fluff` object's `entries` array into display text.
 * Replaces per-mapper `mapFluff` copies in species, races, and backgrounds.
 */
export function mapFluffEntriesToText(
  fluff: unknown,
  options: MapFluffEntriesToTextOptions = {},
  sectionProcessor?: FluffEntryProcessor,
): string {
  const { nested = false, sectionNested = false, entryJoiner = "\n\n" } =
    options;

  if (typeof fluff !== "object" || fluff === null) return "";
  const f = fluff as Record<string, unknown>;
  if (!Array.isArray(f.entries)) return "";

  const mapNestedStrings = (entries: unknown[]): string =>
    entries
      .filter((t: unknown) => typeof t === "string")
      .map((t: string) => parseFiveToolsMarkup(t))
      .join(" ");

  return (f.entries as unknown[])
    .map((e: unknown) => {
      if (typeof e === "string") return parseFiveToolsMarkup(e);
      if (!nested || typeof e !== "object" || e === null) return "";
      const obj = e as Record<string, unknown>;
      if (!Array.isArray(obj.entries)) return "";
      if (sectionNested && sectionProcessor) {
        return sectionProcessor(obj.entries);
      }
      return mapNestedStrings(obj.entries);
    })
    .filter(Boolean)
    .join(entryJoiner);
}
