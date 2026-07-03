import { useMemo } from "react";
import type { MaterialEffectSlot } from "@/shared/types";
import type { ResourceRarity } from "@/shared/types";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import {
  MATERIAL_EFFECT_RARITIES,
  type MaterialEffectFiltersState,
} from "../constants/material-effect.constants";

interface MaterialEffectFiltersProps {
  filters: MaterialEffectFiltersState;
  onChange: (next: MaterialEffectFiltersState) => void;
}

const SLOT_OPTIONS: Array<{ value: MaterialEffectSlot; label: string }> = [
  { value: "armor", label: "Armor" },
  { value: "weapon", label: "Weapon" },
];

const MATERIAL_EFFECT_FILTER_SECTIONS = [
  {
    id: "slot",
    title: "Slot",
    mode: "multi" as const,
    options: SLOT_OPTIONS,
  },
  {
    id: "rarity",
    title: "Rarity",
    mode: "multi" as const,
    options: MATERIAL_EFFECT_RARITIES.map((rarity) => ({
      value: rarity,
      label: rarity,
    })),
  },
];

export function MaterialEffectFilters({
  filters,
  onChange,
}: MaterialEffectFiltersProps) {
  const filterValues = useMemo(
    () => ({
      slot: filters.slot,
      rarity: filters.rarity,
    }),
    [filters.slot, filters.rarity],
  );

  function applyDialogFilters(values: ListFilterValues) {
    onChange({
      ...filters,
      slot: (values.slot as MaterialEffectSlot[]) ?? [],
      rarity: (values.rarity as ResourceRarity[]) ?? [],
    });
  }

  return (
    <ListSearchWithFilters
      searchValue={filters.name}
      onSearchChange={(name) => onChange({ ...filters, name })}
      searchPlaceholder="Search effect name or text..."
      inputClassName="h-8 text-sm"
      sections={MATERIAL_EFFECT_FILTER_SECTIONS}
      filterValues={filterValues}
      onFiltersApply={applyDialogFilters}
      dialogTitle="Material Effect Filters"
      dialogDescription="Filter by equipment slot and rarity tier."
    />
  );
}
