import type { ListFilterSectionConfig } from "@/shared/components/list-filters";
import { optionFilterValues } from "@/shared/components/list-filters/list-filter.utils";
import {
  buildSourceFilterSectionOptions,
  defaultOfficialSourceCodes,
  defaultOfficialSourceCodesSince,
  getSourceDisplayName,
  type BookSourceNameMap,
  type SourceCatalogEntry,
} from "@/shared/services/source-catalog.service";

function normalizeSourceLabel(label: string): string {
  return label.trim().toLowerCase();
}

/** Expand selected codes so every alias that shares a display name is included. */
export function expandSourceFilterSelection(
  selected: string[],
  options: ListFilterSectionConfig["options"],
): string[] {
  if (selected.length === 0 || options.length === 0) return selected;
  const selectedSet = new Set(selected);
  const expanded = new Set<string>();
  for (const option of options) {
    const group = optionFilterValues(option);
    if (group.some((code) => selectedSet.has(code))) {
      for (const code of group) expanded.add(code);
    }
  }
  for (const code of selected) {
    if (![...options].some((o) => optionFilterValues(o).includes(code))) {
      expanded.add(code);
    }
  }
  return [...expanded];
}

/** Build a Sources multi section grouped by kind + publication year (collapsed by name). */
export function buildSourcesFilterSection(
  sourceCodes: Iterable<string>,
  catalog: Map<string, SourceCatalogEntry>,
  bookNames: BookSourceNameMap,
  defaultCodes?: string[],
): ListFilterSectionConfig {
  // Materialize once — Map.keys() / generators are single-pass; options + defaults
  // both need the full code list.
  const codes = [...new Set(sourceCodes)];
  const { options, groups } = buildSourceFilterSectionOptions(
    codes,
    catalog,
    bookNames,
  );
  const baseDefaults =
    defaultCodes ?? defaultOfficialSourceCodes(codes, catalog);
  const defaults = expandSourceFilterSelection(baseDefaults, options);

  return {
    id: "src",
    title: "Sources",
    mode: "multi",
    options,
    groups,
    defaultValues: defaults,
  };
}

/**
 * Sources section for tools that should default to official D&D 2024+ books.
 */
export function buildSourcesFilterSectionFrom2024(
  sourceCodes: Iterable<string>,
  catalog: Map<string, SourceCatalogEntry>,
  bookNames: BookSourceNameMap,
): ListFilterSectionConfig {
  const codes = [...new Set(sourceCodes)];
  return {
    ...buildSourcesFilterSection(
      codes,
      catalog,
      bookNames,
      defaultOfficialSourceCodesSince(codes, catalog, 2024),
    ),
    defaultExpanded: true,
  };
}

export interface SourceFilterMatcher {
  (entity: { source: string; variantSources?: string[] }): boolean;
}

/**
 * Precompute selected source codes + display-name aliases once, then match
 * entities with O(1) Set lookups (avoids rebuilding Sets per row).
 */
export function createSourceFilterMatcher(
  selectedSources: string[],
  catalog?: Map<string, SourceCatalogEntry>,
  bookNames?: BookSourceNameMap,
): SourceFilterMatcher {
  if (selectedSources.length === 0) {
    return () => false;
  }

  const selectedCodes = new Set(selectedSources);
  const selectedNames =
    catalog && bookNames
      ? new Set(
          selectedSources.map((code) =>
            normalizeSourceLabel(getSourceDisplayName(code, catalog, bookNames)),
          ),
        )
      : null;

  return (entity) => {
    const sources = entity.variantSources ?? [entity.source];
    if (sources.some((s) => selectedCodes.has(s))) return true;
    if (!selectedNames || !catalog || !bookNames) return false;
    return sources.some((source) =>
      selectedNames.has(
        normalizeSourceLabel(getSourceDisplayName(source, catalog, bookNames)),
      ),
    );
  };
}

export function entityMatchesSourceFilter(
  entity: { source: string; variantSources?: string[] },
  selectedSources: string[],
  catalog?: Map<string, SourceCatalogEntry>,
  bookNames?: BookSourceNameMap,
): boolean {
  return createSourceFilterMatcher(selectedSources, catalog, bookNames)(entity);
}
