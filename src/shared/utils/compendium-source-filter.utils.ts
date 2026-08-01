import type { ListFilterSectionConfig } from "@/shared/components/list-filters";
import { optionFilterValues } from "@/shared/components/list-filters/list-filter.utils";
import {
  buildSourceFilterSectionOptions,
  defaultOfficialSourceCodes,
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

/** Build a Sources multi section grouped by publication year (collapsed by name). */
export function buildSourcesFilterSection(
  sourceCodes: Iterable<string>,
  catalog: Map<string, SourceCatalogEntry>,
  bookNames: BookSourceNameMap,
  defaultCodes?: string[],
): ListFilterSectionConfig {
  const { options, groups } = buildSourceFilterSectionOptions(
    sourceCodes,
    catalog,
    bookNames,
  );
  const baseDefaults =
    defaultCodes ?? defaultOfficialSourceCodes(sourceCodes, catalog);
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

export function entityMatchesSourceFilter(
  entity: { source: string; variantSources?: string[] },
  selectedSources: string[],
  catalog?: Map<string, SourceCatalogEntry>,
  bookNames?: BookSourceNameMap,
): boolean {
  if (selectedSources.length === 0) return false;
  const sources = entity.variantSources ?? [entity.source];
  if (sources.some((s) => selectedSources.includes(s))) return true;

  // Same display name, different identity codes (e.g. DnDBeyondDrops / BndD).
  if (!catalog || !bookNames) return false;
  const selectedNames = new Set(
    selectedSources.map((code) =>
      normalizeSourceLabel(getSourceDisplayName(code, catalog, bookNames)),
    ),
  );
  return sources.some((source) =>
    selectedNames.has(
      normalizeSourceLabel(getSourceDisplayName(source, catalog, bookNames)),
    ),
  );
}
