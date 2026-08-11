import { DMG_TYPE_LABELS, PROPERTY_LABELS } from "@/shared/types";
import type {
  ArmorItem,
  BuilderFeatSource,
  DndFeat,
  Weapon,
} from "@/shared/types";
import type {
  ListFilterSectionConfig,
  ListFilterValues,
} from "@/shared/components/list-filters";
import type { LibraryListOption } from "@/features/builder/utils/library-variant.utils";
import {
  EQUIPMENT_RARITY_FILTERS,
  matchesEquipmentRarityFilter,
  type EquipmentRarityFilter,
} from "@/features/builder/utils/dnd-rarity.utils";
import {
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import type {
  BookSourceNameMap,
  SourceCatalogEntry,
} from "@/shared/services/source-catalog.service";

export const EQUIPMENT_RARITY_LIBRARY_FILTER_SECTION: ListFilterSectionConfig = {
  id: "rarity",
  title: "Rarity",
  mode: "single",
  defaultExpanded: true,
  defaultValues: ["Standard"],
  options: EQUIPMENT_RARITY_FILTERS.map((rarity) => ({
    value: rarity,
    label: rarity,
  })),
};

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

function asEquipmentRarityFilter(
  value: string,
): EquipmentRarityFilter | null {
  return (EQUIPMENT_RARITY_FILTERS as readonly string[]).includes(value)
    ? (value as EquipmentRarityFilter)
    : null;
}

function matchesLibraryRarityFilter(
  itemRarityLabel: string,
  values: ListFilterValues,
): boolean {
  const rarity = asEquipmentRarityFilter(asFilterString(values.rarity));
  if (!rarity) return true;
  return matchesEquipmentRarityFilter(itemRarityLabel, rarity);
}

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

/** Catalog switchers formerly rendered as header pill badges. */
export type FeatDataSource = Exclude<BuilderFeatSource, "asi">;
export type IdentityDataSource = "amellwind" | "dnd";
export type WeaponLibraryCatalog = "forge" | "base";

export const LIBRARY_CATALOG_FILTER_ID = "catalog";

export function buildFeatCatalogFilterSection(options: {
  includeAmellwind: boolean;
  defaultValue: FeatDataSource;
}): ListFilterSectionConfig {
  const opts = [
    ...(options.includeAmellwind
      ? [{ value: "amellwind", label: "Amellwind Monster Hunter" }]
      : []),
    { value: "dnd2014", label: "D&D 2014" },
    { value: "dnd2024", label: "D&D 2024" },
  ];
  return {
    id: LIBRARY_CATALOG_FILTER_ID,
    title: "Catalog",
    mode: "single",
    defaultExpanded: true,
    defaultValues: [options.defaultValue],
    options: opts,
  };
}

export function buildIdentityCatalogFilterSection(
  defaultValue: IdentityDataSource,
): ListFilterSectionConfig {
  return {
    id: LIBRARY_CATALOG_FILTER_ID,
    title: "Catalog",
    mode: "single",
    defaultExpanded: true,
    defaultValues: [defaultValue],
    options: [
      { value: "amellwind", label: "Amellwind Monster Hunter" },
      { value: "dnd", label: "Dungeons & Dragons" },
    ],
  };
}

export function buildWeaponCatalogFilterSection(
  defaultValue: WeaponLibraryCatalog = "forge",
): ListFilterSectionConfig {
  return {
    id: LIBRARY_CATALOG_FILTER_ID,
    title: "Catalog",
    mode: "single",
    defaultExpanded: true,
    defaultValues: [defaultValue],
    options: [
      { value: "forge", label: "Weapon Forge" },
      { value: "base", label: "Base (AGMH)" },
    ],
  };
}

export function parseFeatDataSource(
  value: string | string[] | undefined,
  fallback: FeatDataSource,
): FeatDataSource {
  const raw = asFilterString(value);
  if (raw === "amellwind" || raw === "dnd2014" || raw === "dnd2024") return raw;
  return fallback;
}

export function parseIdentityDataSource(
  value: string | string[] | undefined,
  fallback: IdentityDataSource,
): IdentityDataSource {
  const raw = asFilterString(value);
  if (raw === "amellwind" || raw === "dnd") return raw;
  return fallback;
}

export function parseWeaponLibraryCatalog(
  value: string | string[] | undefined,
  fallback: WeaponLibraryCatalog = "forge",
): WeaponLibraryCatalog {
  const raw = asFilterString(value);
  if (raw === "forge" || raw === "base") return raw;
  return fallback;
}

export function buildLibrarySourceFilterSections(
  sourceCodes: Iterable<string>,
  catalog: Map<string, SourceCatalogEntry>,
  bookNames: BookSourceNameMap,
): ListFilterSectionConfig[] {
  // Omit defaultCodes so official sources are preselected (passing [] disables defaults).
  const section = buildSourcesFilterSection(sourceCodes, catalog, bookNames);
  if (section.options.length === 0) return [];
  return [{ ...section, defaultExpanded: true }];
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
  if (
    !matchesLibraryRarityFilter(weapon.itemRarityLabel ?? "Standard", values)
  ) {
    return false;
  }
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
  if (
    !matchesLibraryRarityFilter(
      armor.itemRarityLabel ?? armor.rarity ?? "Standard",
      values,
    )
  ) {
    return false;
  }
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
