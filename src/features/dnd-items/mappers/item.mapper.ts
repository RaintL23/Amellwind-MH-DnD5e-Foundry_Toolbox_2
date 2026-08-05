import type { DndItem, DndItemRarity } from "@/shared/types/dnd-item.types";
import { DMG_TYPE_LABELS } from "@/shared/types";
import {
  mapStatBlockEntries,
  statBlockContentsToPlainText,
} from "@/shared/utils/statblock-entries.mapper";
import type { ItemBaseIndexes, RawItemEntity } from "../utils/item-raw.types";
import {
  collectDndItemAttachedRuleEntries,
  formatAmmoTypeLabel,
  formatDndItemMastery,
  formatDndItemProperties,
} from "../utils/item-property.utils";
import { expandItemEntryRefs } from "../utils/item-entry-resolve.utils";
import { itemId, unpackItemTypeUid } from "../utils/item-uids.utils";
import { formatGpFromCp } from "@/shared/utils/currency.utils";

const RARITY_LABELS: Record<string, string> = {
  none: "None",
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "very rare": "Very Rare",
  legendary: "Legendary",
  artifact: "Artifact",
  varies: "Varies",
  unknown: "Unknown",
};

const GENERIC_VARIANT_ABBREV = "GV";

function formatWeight(weight: number | string | undefined): string | null {
  if (weight == null) return null;
  if (typeof weight === "number") {
    return weight === 0 ? "—" : `${weight} lb.`;
  }
  return String(weight);
}

function mapAttunement(raw: RawItemEntity): string | null {
  if (raw.reqAttune === true) return "Required";
  if (typeof raw.reqAttune === "string") return raw.reqAttune;
  if (raw.reqAttuneTags) return "Required (conditional)";
  return null;
}

function resolveTypeLabel(
  typeCode: string | undefined,
  indexes: ItemBaseIndexes,
): string {
  if (!typeCode) return "—";
  const { abbreviation, source } = unpackItemTypeUid(typeCode);
  const key = source
    ? `${abbreviation}|${source}`.toLowerCase()
    : abbreviation.toLowerCase();
  const entry = indexes.itemTypes.get(key);
  if (entry?.name) return entry.name;
  return abbreviation;
}

function isGenericVariantType(typeCode: string | undefined): boolean {
  if (!typeCode) return false;
  return unpackItemTypeUid(typeCode).abbreviation === GENERIC_VARIANT_ABBREV;
}

/** Primary damage line (versatile/two-hand damage lives in the property template). */
function mapDamage(raw: RawItemEntity): string | null {
  const parts: string[] = [];
  if (raw.dmg1) parts.push(String(raw.dmg1));
  if (raw.dmgType) {
    const typeKey = String(raw.dmgType);
    parts.push(DMG_TYPE_LABELS[typeKey] ?? typeKey);
  }
  return parts.length ? parts.join(" ") : null;
}

function mapRange(raw: RawItemEntity): string | null {
  if (typeof raw.range !== "string" || !raw.range.trim()) return null;
  return `${raw.range.trim()} ft.`;
}

function mapAmmoType(raw: RawItemEntity): string | null {
  if (typeof raw.ammoType !== "string" || !raw.ammoType.trim()) return null;
  return formatAmmoTypeLabel(raw.ammoType) || null;
}

function mapArmorClass(raw: RawItemEntity): string | null {
  if (typeof raw.ac !== "number") return null;
  const { abbreviation } = unpackItemTypeUid(
    raw.type != null ? String(raw.type) : "",
  );
  // Shields are listed as a bonus (e.g. "+2").
  if (abbreviation.toUpperCase() === "S") return `+${raw.ac}`;
  return String(raw.ac);
}

function mapStealth(raw: RawItemEntity): string | null {
  return raw.stealth === true ? "Disadvantage" : null;
}

function mapStrengthRequirement(raw: RawItemEntity): string | null {
  if (raw.strength == null || raw.strength === "") return null;
  return `Str ${raw.strength}`;
}

export function parseWeaponCategory(
  raw: RawItemEntity,
): "simple" | "martial" | undefined {
  const category = raw.weaponCategory;
  if (category === "simple" || category === "martial") return category;
  return undefined;
}

function formatWeaponCategoryLabel(
  category: "simple" | "martial",
): string {
  return category === "martial" ? "Martial" : "Simple";
}

export function mapDndItem(
  raw: RawItemEntity,
  indexes: ItemBaseIndexes,
): DndItem {
  const rarity = (raw.rarity ?? "none") as DndItemRarity;
  const isMundane = rarity === "none";
  const typeCode = raw.type != null ? String(raw.type) : undefined;

  const attachedRules = collectDndItemAttachedRuleEntries(raw, indexes);
  const ownEntries = [
    ...(Array.isArray(raw.entries) ? raw.entries : []),
    ...(Array.isArray(raw.additionalEntries) ? raw.additionalEntries : []),
  ];
  const resolvedEntries = expandItemEntryRefs(
    [...attachedRules, ...ownEntries],
    raw,
    indexes,
  );
  const description = mapStatBlockEntries(resolvedEntries);
  const descriptionPlain = statBlockContentsToPlainText(description, " ");

  const name = String(raw.name ?? "Unknown");
  const source = String(raw.source ?? "");
  const valueCp = typeof raw.value === "number" ? raw.value : null;
  const baseValueCp =
    typeof raw._baseValue === "number" ? raw._baseValue : null;

  const typeLabel = resolveTypeLabel(typeCode, indexes);
  const weaponCategory = parseWeaponCategory(raw);
  const mastery = formatDndItemMastery(
    Array.isArray(raw.mastery) ? raw.mastery : undefined,
  );
  const properties = formatDndItemProperties(
    Array.isArray(raw.property) ? raw.property : undefined,
    indexes,
    raw,
  );
  const range = mapRange(raw);
  const ammoType = mapAmmoType(raw);
  const armorClass = mapArmorClass(raw);
  const stealth = mapStealth(raw);
  const strengthRequirement = mapStrengthRequirement(raw);

  const searchText = [
    name,
    source,
    typeLabel,
    weaponCategory ? formatWeaponCategoryLabel(weaponCategory) : null,
    mastery,
    properties,
    range,
    ammoType,
    armorClass,
    stealth,
    strengthRequirement,
    rarity,
    descriptionPlain,
    raw._baseName,
    raw._variantName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    id: itemId({ name, source }),
    name,
    source,
    page: typeof raw.page === "number" ? raw.page : undefined,
    rarity,
    rarityLabel: RARITY_LABELS[rarity] ?? rarity,
    typeCode,
    typeLabel,
    isMundane,
    isMagic: !isMundane,
    isItemGroup: !!raw._isItemGroup,
    isBaseItem: !!raw._isBaseItem,
    isGenericVariant: isGenericVariantType(typeCode),
    isSpecificVariant: !!raw._variantName && !raw._isBaseItem,
    attunement: mapAttunement(raw),
    weight: formatWeight(raw.weight as number | string | undefined),
    valueGp: formatGpFromCp(valueCp),
    valueCp,
    baseValueCp,
    description,
    searchText,
    category: String(raw._category ?? "Other"),
    groupItemRefs: Array.isArray(raw.items)
      ? (raw.items as string[])
      : undefined,
    baseItemRef:
      typeof raw.baseItem === "string" ? raw.baseItem : undefined,
    variantName:
      typeof raw._variantName === "string" ? raw._variantName : undefined,
    baseName: typeof raw._baseName === "string" ? raw._baseName : undefined,
    bonusWeapon:
      typeof raw.bonusWeapon === "string" ? raw.bonusWeapon : undefined,
    bonusAc: typeof raw.bonusAc === "string" ? raw.bonusAc : undefined,
    damage: mapDamage(raw),
    properties,
    mastery,
    range,
    ammoType,
    armorClass,
    stealth,
    strengthRequirement,
    weaponCategory,
  };
}
