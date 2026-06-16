import type { DndItem, DndItemRarity } from "@/shared/types/dnd-item.types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import type { ItemBaseIndexes, RawItemEntity } from "../utils/item-raw.types";
import { formatDndItemProperties } from "../utils/item-property.utils";
import { itemId, unpackItemTypeUid } from "../utils/item-uids.utils";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function renderEntries(entries: unknown[], depth = 0): string[] {
  const result: string[] = [];
  for (const entry of entries) {
    if (typeof entry === "string") {
      const text = parseFiveToolsMarkup(entry).trim();
      if (text) result.push(text);
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;
    const obj = entry as Raw;

    if (obj.type === "list" && Array.isArray(obj.items)) {
      for (const item of obj.items as unknown[]) {
        if (typeof item === "string") {
          result.push(`• ${parseFiveToolsMarkup(item).trim()}`);
        } else if (typeof item === "object" && item !== null) {
          const subObj = item as Raw;
          if (subObj.type === "item" && subObj.name) {
            result.push(
              `• **${parseFiveToolsMarkup(String(subObj.name))}**: ${parseFiveToolsMarkup(String(subObj.entry ?? "")).trim()}`,
            );
          }
        }
      }
    } else if (obj.type === "entries" && obj.name) {
      const name = parseFiveToolsMarkup(String(obj.name));
      result.push(`**${name}**`);
      if (Array.isArray(obj.entries)) {
        result.push(...renderEntries(obj.entries as unknown[], depth + 1));
      }
    } else if (obj.type === "table" && obj.caption) {
      result.push(`**${parseFiveToolsMarkup(String(obj.caption))}**`);
    } else if (obj.type === "inset" && Array.isArray(obj.entries)) {
      result.push(
        ...renderEntries(obj.entries as unknown[], depth).map((l) => `» ${l}`),
      );
    } else if (Array.isArray(obj.entries)) {
      result.push(...renderEntries(obj.entries as unknown[], depth));
    }
  }
  return result;
}

function formatValueGp(valueCp: number | null | undefined): string {
  if (valueCp == null || valueCp === undefined) return "—";
  const gp = valueCp / 100;
  if (gp >= 1000) return `${gp.toLocaleString("en-US")} gp`;
  return `${gp} gp`;
}

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

function mapDamage(raw: RawItemEntity): string | null {
  const parts: string[] = [];
  if (raw.dmg1) parts.push(String(raw.dmg1));
  if (raw.dmg2) parts.push(String(raw.dmg2));
  if (raw.dmgType) parts.push(String(raw.dmgType));
  return parts.length ? parts.join(" ") : null;
}

export function mapDndItem(
  raw: RawItemEntity,
  indexes: ItemBaseIndexes,
): DndItem {
  const rarity = (raw.rarity ?? "none") as DndItemRarity;
  const isMundane = rarity === "none";
  const typeCode = raw.type != null ? String(raw.type) : undefined;
  const description = renderEntries([
    ...(Array.isArray(raw.entries) ? raw.entries : []),
    ...(Array.isArray(raw.additionalEntries) ? raw.additionalEntries : []),
  ]);

  const name = String(raw.name ?? "Unknown");
  const source = String(raw.source ?? "");
  const valueCp =
    typeof raw.value === "number"
      ? raw.value
      : raw._baseValue != null
        ? null
        : null;

  const typeLabel = resolveTypeLabel(typeCode, indexes);
  const searchText = [
    name,
    source,
    typeLabel,
    rarity,
    description.join(" "),
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
    valueGp: formatValueGp(valueCp),
    valueCp,
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
    properties: formatDndItemProperties(
      Array.isArray(raw.property) ? raw.property : undefined,
      indexes,
    ),
  };
}
