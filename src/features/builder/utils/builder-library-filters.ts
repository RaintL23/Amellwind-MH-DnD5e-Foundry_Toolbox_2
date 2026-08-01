import { DMG_TYPE_LABELS, PROPERTY_LABELS } from "@/shared/types";
import type { ArmorItem, DndFeat, Weapon } from "@/shared/types";
import type {
  ListFilterSectionConfig,
  ListFilterValues,
} from "@/shared/components/list-filters";
import type { LibraryListOption } from "@/features/builder/utils/library-variant.utils";
import {
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import type {
  BookSourceNameMap,
  SourceCatalogEntry,
} from "@/shared/services/source-catalog.service";

export const WEAPON_LIBRARY_FILTER_SECTIONS: ListFilterSectionConfig[] = [
  {
    id: "dmg",
    title: "Damage Type",
    mode: "single",
    options: [
      { value: "S", label: DMG_TYPE_LABELS.S },
      { value: "P", label: DMG_TYPE_LABELS.P },
      { value: "B", label: DMG_TYPE_LABELS.B },
    ],
  },
  {
    id: "prop",
    title: "Property",
    mode: "single",
    options: Object.entries(PROPERTY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
];

export const ARMOR_LIBRARY_FILTER_SECTIONS: ListFilterSectionConfig[] = [
  {
    id: "category",
    title: "Category",
    mode: "single",
    options: [
      { value: "light", label: "Light Armor" },
      { value: "medium", label: "Medium Armor" },
      { value: "heavy", label: "Heavy Armor" },
      { value: "shield", label: "Shield" },
      { value: "clothing", label: "Clothing" },
    ],
  },
];

export const FEAT_LIBRARY_FILTER_SECTIONS: ListFilterSectionConfig[] = [
  {
    id: "filter",
    title: "Feat Type",
    mode: "single",
    options: [
      { value: "origin", label: "Origin Feats" },
      { value: "repeatable", label: "Repeatable" },
      { value: "ability", label: "With ability increases" },
      { value: "prerequisite", label: "With prerequisites" },
    ],
  },
];

export function buildLibrarySourceFilterSections(
  sourceCodes: Iterable<string>,
  catalog: Map<string, SourceCatalogEntry>,
  bookNames: BookSourceNameMap,
): ListFilterSectionConfig[] {
  const section = buildSourcesFilterSection(
    sourceCodes,
    catalog,
    bookNames,
    [],
  );
  return section.options.length > 0 ? [section] : [];
}

export function asFilterString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export function asFilterStringArray(
  value: string | string[] | undefined,
): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

export function weaponMatchesLibraryFilters(
  weapon: Weapon,
  values: ListFilterValues,
): boolean {
  const dmg = asFilterString(values.dmg);
  if (dmg && weapon.dmgType !== dmg) return false;
  const prop = asFilterString(values.prop);
  if (prop && !weapon.properties.includes(prop)) return false;
  return true;
}

export function armorMatchesLibraryFilters(
  armor: ArmorItem,
  values: ListFilterValues,
): boolean {
  const category = asFilterString(values.category);
  if (category && armor.category !== category) return false;
  return true;
}

export function dndFeatMatchesTypeFilter(
  feat: DndFeat,
  typeFilter: string,
): boolean {
  if (!typeFilter) return true;
  if (typeFilter === "origin") return feat.isOriginFeat;
  if (typeFilter === "repeatable") return feat.repeatable;
  if (typeFilter === "ability") return feat.abilityIncreases.length > 0;
  if (typeFilter === "prerequisite") return feat.prerequisites.length > 0;
  return true;
}

export function libraryOptionMatchesSourceFilter(
  option: LibraryListOption,
  selectedSources: string[],
  catalog?: Map<string, SourceCatalogEntry>,
  bookNames?: BookSourceNameMap,
): boolean {
  if (selectedSources.length === 0) return true;
  if (!option.source && !(option.variantSources?.length)) return true;
  return entityMatchesSourceFilter(
    {
      source: option.source ?? "",
      variantSources: option.variantSources,
    },
    selectedSources,
    catalog,
    bookNames,
  );
}
