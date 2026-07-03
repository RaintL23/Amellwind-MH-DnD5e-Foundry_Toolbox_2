import type {
  ListFilterSectionConfig,
  ListFilterValues,
} from "./list-filter.types";

export function toggleMultiFilterValue(
  selected: string[],
  value: string,
): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

export function getSectionSelected(
  section: ListFilterSectionConfig,
  values: ListFilterValues,
): string[] {
  const raw = values[section.id];
  if (section.mode === "multi") {
    return Array.isArray(raw) ? raw : [];
  }
  return typeof raw === "string" && raw ? [raw] : [];
}

export function setSectionSelected(
  section: ListFilterSectionConfig,
  values: ListFilterValues,
  selected: string[],
): ListFilterValues {
  if (section.mode === "multi") {
    return { ...values, [section.id]: selected };
  }
  return { ...values, [section.id]: selected[0] ?? "" };
}

export function isFilterSectionActive(
  section: ListFilterSectionConfig,
  values: ListFilterValues,
): boolean {
  const raw = values[section.id];
  if (section.mode === "multi") {
    return Array.isArray(raw) && raw.length > 0;
  }
  return typeof raw === "string" && raw !== "";
}

export function countActiveListFilters(
  values: ListFilterValues,
  sections: ListFilterSectionConfig[],
): number {
  return sections.filter((section) => isFilterSectionActive(section, values))
    .length;
}

export function pickFilterValues(
  source: object,
  sectionIds: string[],
): ListFilterValues {
  const record = source as Record<string, string | string[] | undefined>;
  const picked: ListFilterValues = {};
  for (const id of sectionIds) {
    const value = record[id];
    if (Array.isArray(value)) {
      picked[id] = [...value];
    } else if (typeof value === "string") {
      picked[id] = value;
    } else {
      picked[id] = [];
    }
  }
  return picked;
}

export function buildDefaultFilterValues(
  sections: ListFilterSectionConfig[],
): ListFilterValues {
  const defaults: ListFilterValues = {};
  for (const section of sections) {
    defaults[section.id] = section.mode === "multi" ? [] : "";
  }
  return defaults;
}
