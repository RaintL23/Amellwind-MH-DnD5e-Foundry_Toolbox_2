import type {
  ListFilterOption,
  ListFilterSectionConfig,
  ListFilterValues,
} from "./list-filter.types";

/** Primary value plus any aliases for a filter option. */
export function optionFilterValues(option: ListFilterOption): string[] {
  if (!option.aliases || option.aliases.length === 0) {
    return [option.value];
  }
  return [option.value, ...option.aliases];
}

export function isFilterOptionSelected(
  option: ListFilterOption,
  selectedSet: Set<string>,
): boolean {
  if (selectedSet.has(option.value)) return true;
  return (option.aliases ?? []).some((alias) => selectedSet.has(alias));
}

export function toggleMultiFilterValue(
  selected: string[],
  value: string,
): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

/** Toggle a multi option, keeping all alias codes in sync with the primary value. */
export function toggleMultiFilterOption(
  selected: string[],
  option: ListFilterOption,
): string[] {
  const group = optionFilterValues(option);
  const selectedSet = new Set(selected);
  const isOn = isFilterOptionSelected(option, selectedSet);
  if (isOn) {
    for (const code of group) selectedSet.delete(code);
  } else {
    for (const code of group) selectedSet.add(code);
  }
  return [...selectedSet];
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

export function buildDefaultFilterValues(
  sections: ListFilterSectionConfig[],
): ListFilterValues {
  const defaults: ListFilterValues = {};
  for (const section of sections) {
    if (section.mode === "multi") {
      defaults[section.id] = section.defaultValues
        ? [...section.defaultValues]
        : [];
    } else {
      defaults[section.id] = section.defaultValues?.[0] ?? "";
    }
  }
  return defaults;
}

/**
 * Sections with an explicit defaultValues list count as "active" only when
 * the current selection differs from that default (so official-source defaults
 * and Standard rarity do not inflate the Filters badge).
 */
export function isFilterSectionActive(
  section: ListFilterSectionConfig,
  values: ListFilterValues,
): boolean {
  const raw = values[section.id];
  if (section.mode === "multi") {
    const selected = Array.isArray(raw) ? raw : [];
    if (section.defaultValues && section.defaultValues.length > 0) {
      if (selected.length !== section.defaultValues.length) return true;
      const defaults = new Set(section.defaultValues);
      return selected.some((v) => !defaults.has(v));
    }
    return selected.length > 0;
  }
  const selected = typeof raw === "string" ? raw : "";
  const defaultValue = section.defaultValues?.[0] ?? "";
  if (defaultValue) return selected !== defaultValue;
  return selected !== "";
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
