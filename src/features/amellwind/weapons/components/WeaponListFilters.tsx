import { useMemo } from "react";
import { DMG_TYPE_LABELS, PROPERTY_LABELS } from "@/shared/types";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import type { ListFilterValues } from "@/shared/components/list-filters";
import { COMPATIBLE_PROFICIENCY_OPTIONS } from "../data/weapon-proficiencies.data";

const WEAPON_FILTER_SECTIONS = [
  {
    id: "dmg",
    title: "Damage Type",
    mode: "single" as const,
    options: [
      { value: "S", label: DMG_TYPE_LABELS.S },
      { value: "P", label: DMG_TYPE_LABELS.P },
      { value: "B", label: DMG_TYPE_LABELS.B },
    ],
  },
  {
    id: "prop",
    title: "Property",
    mode: "single" as const,
    options: Object.entries(PROPERTY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    id: "compat",
    title: "Weapon Proficiency Compatibility",
    mode: "single" as const,
    options: COMPATIBLE_PROFICIENCY_OPTIONS.map((value) => ({
      value,
      label: value,
    })),
  },
];

export interface WeaponListFiltersState {
  search: string;
  dmgFilter: string;
  propFilter: string;
  compatFilter: string;
}

interface WeaponListFiltersProps {
  filters: WeaponListFiltersState;
  onSearchChange: (value: string) => void;
  onFiltersApply: (dmg: string, prop: string, compat: string) => void;
}

export function WeaponListFilters({
  filters,
  onSearchChange,
  onFiltersApply,
}: WeaponListFiltersProps) {
  const filterValues = useMemo(
    () => ({
      dmg: filters.dmgFilter,
      prop: filters.propFilter,
      compat: filters.compatFilter,
    }),
    [filters.dmgFilter, filters.propFilter, filters.compatFilter],
  );

  function handleFiltersApply(values: ListFilterValues) {
    onFiltersApply(
      typeof values.dmg === "string" ? values.dmg : "",
      typeof values.prop === "string" ? values.prop : "",
      typeof values.compat === "string" ? values.compat : "",
    );
  }

  return (
    <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
      <ListSearchWithFilters
        searchValue={filters.search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search weapon..."
        inputClassName="h-8 text-sm"
        sections={WEAPON_FILTER_SECTIONS}
        filterValues={filterValues}
        onFiltersApply={handleFiltersApply}
        dialogTitle="Weapon Filters"
        dialogDescription="Filter hunter weapons by damage type, property, and D&D proficiency compatibility."
      />
    </div>
  );
}
