import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import type { SourceFilterMatcher } from "@/shared/utils/compendium-source-filter.utils";

export interface BestiaryListFilters {
  search: string;
  crs: string[];
  sizes: string[];
  types: string[];
  environments: string[];
}

/**
 * Single-pass filter for the bestiary list view. Search uses the prebuilt
 * `searchText` (name, CR, size, type, tags, sources, environment, group).
 */
export function filterBestiaryCreatures(
  list: BestiaryCreature[],
  filters: BestiaryListFilters,
  sourceMatcher: SourceFilterMatcher | null,
): BestiaryCreature[] {
  const q = filters.search.trim().toLowerCase();
  const crSet = filters.crs.length > 0 ? new Set(filters.crs) : null;
  const sizeSet = filters.sizes.length > 0 ? new Set(filters.sizes) : null;
  const typeSet = filters.types.length > 0 ? new Set(filters.types) : null;
  const envSet =
    filters.environments.length > 0 ? new Set(filters.environments) : null;

  if (!q && !crSet && !sizeSet && !typeSet && !envSet && !sourceMatcher) {
    return list;
  }

  return list.filter((c) => {
    if (q && !(c.searchText?.includes(q) ?? false)) return false;
    if (crSet && !crSet.has(c.cr)) return false;
    if (sizeSet && !sizeSet.has(c.size)) return false;
    if (typeSet && !typeSet.has(c.type.type)) return false;
    if (envSet && !(c.environment ?? []).some((e) => envSet.has(e))) {
      return false;
    }
    if (sourceMatcher && !sourceMatcher(c)) return false;
    return true;
  });
}
