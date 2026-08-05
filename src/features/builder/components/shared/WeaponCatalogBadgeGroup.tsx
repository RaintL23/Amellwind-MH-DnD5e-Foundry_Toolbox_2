import { PillToggleGroup } from "./PillToggleGroup";

/** Catalog shown in the weapon library while Amellwind Homebrew is on. */
export type WeaponLibraryCatalog = "forge" | "base";

const SOURCES = [
  { id: "forge" as const, label: "Weapon Forge" },
  { id: "base" as const, label: "Base (AGMH)" },
];

interface WeaponCatalogBadgeGroupProps {
  value: WeaponLibraryCatalog;
  onChange: (source: WeaponLibraryCatalog) => void;
}

export function WeaponCatalogBadgeGroup({
  value,
  onChange,
}: WeaponCatalogBadgeGroupProps) {
  return <PillToggleGroup options={SOURCES} value={value} onChange={onChange} />;
}
