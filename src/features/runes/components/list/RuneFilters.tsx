import { useMemo } from "react";
import { ListSearchWithFilters, pickFilterValues } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import {
  buildRuneFilterSections,
  type RuneFiltersState,
} from "./rune-filters.utils";

export type { RuneFiltersState, RuneSlotFilter } from "./rune-filters.utils";

interface RuneFiltersProps {
  filters: RuneFiltersState;
  uniqueMonsters: string[];
  uniqueMonsterCrs: string[];
  uniqueTags: string[];
  onChange: (filters: RuneFiltersState) => void;
}

export function RuneFilters({
  filters,
  uniqueMonsters,
  uniqueMonsterCrs,
  uniqueTags,
  onChange,
}: RuneFiltersProps) {
  const sections = useMemo(
    () =>
      buildRuneFilterSections(uniqueMonsters, uniqueMonsterCrs, uniqueTags),
    [uniqueMonsters, uniqueMonsterCrs, uniqueTags],
  );

  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );

  function applyDialogFilters(values: ListFilterValues) {
    onChange({
      ...filters,
      monster: (values.monster as string[]) ?? [],
      monsterCr: (values.monsterCr as string[]) ?? [],
      slot: ((values.slot as string) || "") as RuneFiltersState["slot"],
      obtainment: (values.obtainment as string[]) ?? [],
      tag: (values.tag as string[]) ?? [],
      monsterTier: (values.monsterTier as string[]) ?? [],
      materialEffectTier: (values.materialEffectTier as string[]) ?? [],
    });
  }

  return (
    <ListSearchWithFilters
      className="mb-6"
      searchValue={filters.name}
      onSearchChange={(name) => onChange({ ...filters, name })}
      searchPlaceholder="Search name, monster, effect..."
      sections={sections}
      filterValues={pickFilterValues(filters, sectionIds)}
      onFiltersApply={applyDialogFilters}
      dialogTitle="Filters"
      dialogDescription="Refine materials by monster, CR, slots, tags, and more. Changes apply when you save."
    />
  );
}
