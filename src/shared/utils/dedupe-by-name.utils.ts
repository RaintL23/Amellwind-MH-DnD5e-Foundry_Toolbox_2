/**
 * Shared "one row per name, with variant metadata" deduper.
 *
 * Several D&D catalogs (feats, backgrounds, spells, races…) collapse multiple
 * source printings of the same-named entry into a single canonical row while
 * aggregating the variant sources, a variant count and a search blob. The
 * group → pick-canonical → merge-variants boilerplate used to be copy-pasted
 * per feature; only the source-priority list, the search-text builder and the
 * final ordering actually differ, so those are the configurable parts here.
 */
export interface DedupeByNameConfig<T> {
  /** Source codes in preference order; earlier = more canonical. */
  sourcePriority: readonly string[];
  /** Builds the lowercase search blob aggregated across a name group. */
  buildSearchText: (group: T[]) => string;
  /** Extra fields merged onto the canonical entry (e.g. a union of class lists). */
  mergeExtra?: (group: T[]) => Partial<T>;
  /** Optional ordering applied to the deduped result. */
  sort?: (a: T, b: T) => number;
}

interface VariantMeta {
  name: string;
  source: string;
  variantCount?: number;
  variantSources?: string[];
  searchText?: string;
}

export function dedupeByNameWithVariants<T extends VariantMeta>(
  items: T[],
  config: DedupeByNameConfig<T>,
): T[] {
  const { sourcePriority, buildSearchText, mergeExtra, sort } = config;

  const rank = (source: string): number => {
    const index = sourcePriority.indexOf(source);
    return index === -1 ? sourcePriority.length : index;
  };

  const pickCanonical = (group: T[]): T =>
    [...group].sort((a, b) => {
      const byPriority = rank(a.source) - rank(b.source);
      return byPriority !== 0 ? byPriority : a.source.localeCompare(b.source);
    })[0];

  const byName = new Map<string, T[]>();
  for (const item of items) {
    const group = byName.get(item.name) ?? [];
    group.push(item);
    byName.set(item.name, group);
  }

  const result = Array.from(byName.values()).map((group): T => {
    const canonical = pickCanonical(group);
    const variantSources = [...new Set(group.map((g) => g.source))].sort(
      (a, b) => a.localeCompare(b),
    );
    return {
      ...canonical,
      ...(mergeExtra ? mergeExtra(group) : {}),
      variantCount: group.length,
      variantSources,
      searchText: buildSearchText(group),
    };
  });

  if (sort) result.sort(sort);
  return result;
}
