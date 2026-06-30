/**
 * Shared 5etools "fluff" attachment helpers.
 *
 * Several feature services (feats, backgrounds, …) load an entity file plus a
 * parallel `*-fluff` file and merge the matching fluff entry onto each entity
 * by `name|source`. This logic used to be copy-pasted per feature.
 */
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
