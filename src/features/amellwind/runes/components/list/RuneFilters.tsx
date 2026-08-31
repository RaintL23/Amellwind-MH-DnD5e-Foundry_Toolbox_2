import { useMemo } from "react";
import { ListSearchWithFilters, pickFilterValues } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import {
  mergeTagFilterSelections,
  splitTagFilterSelections,
} from "../../utils/rune-tag-categories.utils";
import {
  buildRuneFilterSections,
  type RuneFiltersState,
} from "./rune-filters.utils";

const NON_TAG_FILTER_KEYS = [
  "monster",
  "monsterCr",
  "slot",
  "obtainment",
  "materialEffect",
  "monsterTier",
  "materialEffectTier",
] as const;

export type { RuneFiltersState, RuneSlotFilter } from "./rune-filters.utils";

interface RuneFiltersProps {
  filters: RuneFiltersState;
  uniqueMonsters: string[];
  uniqueMonsterCrs: string[];
  uniqueTags: string[];
  uniqueMaterialEffects: string[];
  onChange: (filters: RuneFiltersState) => void;
  /** Immediate search draft; when set, typing does not push filters until the parent commits. */
  onSearchChange?: (name: string) => void;
}

export function RuneFilters({
  filters,
  uniqueMonsters,
  uniqueMonsterCrs,
  uniqueTags,
  uniqueMaterialEffects,
  onChange,
  onSearchChange,
}: RuneFiltersProps) {
  const sections = useMemo(
    () =>
      buildRuneFilterSections(
        uniqueMonsters,
        uniqueMonsterCrs,
        uniqueTags,
        uniqueMaterialEffects,
      ),
    [uniqueMonsters, uniqueMonsterCrs, uniqueTags, uniqueMaterialEffects],
  );

  const filterValues = useMemo(
    () => ({
      ...pickFilterValues(filters, [...NON_TAG_FILTER_KEYS]),
      ...splitTagFilterSelections(filters.tag),
    }),
    [filters],
  );

  function applyDialogFilters(values: ListFilterValues) {
    onChange({
      ...filters,
      monster: (values.monster as string[]) ?? [],
      monsterCr: (values.monsterCr as string[]) ?? [],
      slot: ((values.slot as string) || "") as RuneFiltersState["slot"],
      obtainment: (values.obtainment as string[]) ?? [],
      tag: mergeTagFilterSelections({
        tagWeapon: (values.tagWeapon as string[]) ?? [],
        tagClass: (values.tagClass as string[]) ?? [],
        tagDamage: (values.tagDamage as string[]) ?? [],
        tagPlayStyle: (values.tagPlayStyle as string[]) ?? [],
        tag: (values.tag as string[]) ?? [],
      }),
      materialEffect: (values.materialEffect as string[]) ?? [],
      monsterTier: (values.monsterTier as string[]) ?? [],
      materialEffectTier: (values.materialEffectTier as string[]) ?? [],
    });
  }

  return (
    <ListSearchWithFilters
      className="mb-6"
      searchValue={filters.name}
      onSearchChange={(name) =>
        onSearchChange
          ? onSearchChange(name)
          : onChange({ ...filters, name })
      }
      searchPlaceholder="Search name, monster, effect..."
      sections={sections}
      filterValues={filterValues}
      onFiltersApply={applyDialogFilters}
      dialogTitle="Filters"
      dialogDescription="Refine materials by monster, CR, slots, tags, and more. Selected tags must all appear on the same armor or weapon effect. Changes apply when you save."
    />
  );
}
