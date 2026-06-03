import {
  ITEMS_BASE_JSON_URL,
  ITEMS_JSON_URL,
  MAGIC_VARIANTS_JSON_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import {
  resolveItemsByNameSource,
  resolveItemTypesByAbbreviation,
} from "./item-copy.utils";
import type {
  ItemBaseIndexes,
  ItemPropertyIndexEntry,
  ItemTypeIndexEntry,
  ItemsBaseJson,
  ItemsJson,
  MagicVariantsJson,
  RawItemEntity,
  RawItemType,
  RawMagicVariant,
} from "./item-raw.types";
import { itemEntityKey, unpackItemTypeUid } from "./item-uids.utils";

const INHERITED_PROPS_BLOCKLIST = new Set([
  "entries",
  "propertyAdd",
  "namePrefix",
  "nameSuffix",
  "propertyRemove",
  "vulnerable",
  "resist",
  "immune",
]);

function copyFast<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function buildItemTypeIndex(itemTypes: RawItemType[]): Map<string, ItemTypeIndexEntry> {
  const map = new Map<string, ItemTypeIndexEntry>();
  for (const t of itemTypes) {
    map.set(`${t.abbreviation}|${t.source}`.toLowerCase(), {
      abbreviation: t.abbreviation,
      source: t.source,
      name: t.name,
    });
  }
  return map;
}

function buildItemPropertyIndex(
  itemProperties: { abbreviation: string; source?: string; name?: string }[],
): Map<string, ItemPropertyIndexEntry> {
  const map = new Map<string, ItemPropertyIndexEntry>();
  for (const p of itemProperties) {
    const key = p.source
      ? `${p.abbreviation}|${p.source}`.toLowerCase()
      : p.abbreviation.toLowerCase();
    map.set(key, {
      abbreviation: p.abbreviation,
      source: p.source,
      name: p.name,
    });
  }
  return map;
}

/** Merge inherits into generic variant (5etools _genericVariants_addInheritedPropertiesToSelf). */
export function procGenericVariants(
  variants: RawMagicVariant[],
): RawMagicVariant[] {
  return variants.map((genericVariant) => {
    if (genericVariant._isInherited) return genericVariant;
    const out = copyFast(genericVariant);
    out._isInherited = true;
    const inherits = out.inherits ?? {};

    for (const prop of Object.keys(inherits)) {
      if (INHERITED_PROPS_BLOCKLIST.has(prop)) continue;
      const val = inherits[prop];
      if (val == null) delete out[prop];
      else if (out[prop] != null) {
        if (Array.isArray(out[prop]) && Array.isArray(val)) {
          out[prop] = [...(out[prop] as unknown[]), ...val];
        } else {
          out[prop] = val;
        }
      } else {
        out[prop] = val;
      }
    }

    if (!out.entries && inherits.entries) {
      out.entries = copyFast(inherits.entries as unknown[]);
    }

    if (inherits.propertyAdd) {
      const add = inherits.propertyAdd as unknown[];
      out.property = [...((out.property as unknown[]) ?? []), ...add];
    }

    const requires = out.requires as Array<Record<string, unknown>>;
    if (requires?.some((r) => r.armor)) {
      out.armor = true;
    }

    return out;
  });
}

/** Edition matching for base × generic variant (5etools, no VTT branch). */
export function isEditionMatch(
  baseEdition: string | null | undefined,
  variantEdition: string | null | undefined,
): boolean {
  if (baseEdition === variantEdition) return true;
  if (baseEdition === "classic") return false;
  if (baseEdition == null) return true;
  if (baseEdition === "one") return variantEdition !== "classic";
  return true;
}

function isRequiresExcludesMatch(
  candidate: RawItemEntity,
  requirements: Record<string, unknown>,
  method: "every" | "some",
): boolean {
  return Object.entries(requirements)[method](([reqKey, reqVal]) => {
    if (reqVal instanceof Array) {
      const cand = candidate[reqKey];
      return cand instanceof Array
        ? (cand as unknown[]).some((it) => (reqVal as unknown[]).includes(it))
        : (reqVal as unknown[]).includes(cand);
    }
    if (reqVal != null && typeof reqVal === "object") {
      return isRequiresExcludesMatch(
        (candidate[reqKey] as RawItemEntity) ?? {},
        reqVal as Record<string, unknown>,
        method,
      );
    }
    const cand = candidate[reqKey];
    return cand instanceof Array
      ? (cand as unknown[]).some((it) => it === reqVal)
      : cand === reqVal;
  });
}

function typeMatchesRequire(baseItem: RawItemEntity, req: Record<string, unknown>): boolean {
  if (req.type != null) {
    const reqType = String(req.type);
    const baseType = baseItem.type != null ? String(baseItem.type) : "";
    if (reqType.includes("|")) {
      return baseType === reqType;
    }
    const { abbreviation } = unpackItemTypeUid(baseType);
    if (abbreviation !== reqType) return false;
  }
  if (req.armor === true) {
    const t = baseItem.type != null ? String(baseItem.type) : "";
    const { abbreviation } = unpackItemTypeUid(t);
    return ["LA", "MA", "HA"].includes(abbreviation);
  }
  return isRequiresExcludesMatch(baseItem, req, "every");
}

export function hasRequiredProperty(
  baseItem: RawItemEntity,
  genericVariant: RawMagicVariant,
): boolean {
  const requires = genericVariant.requires ?? [];
  return requires.some((req) => typeMatchesRequire(baseItem, req));
}

export function hasExcludedProperty(
  baseItem: RawItemEntity,
  genericVariant: RawMagicVariant,
): boolean {
  const excludes = genericVariant.excludes;
  if (!excludes || typeof excludes !== "object") return false;
  return isRequiresExcludesMatch(baseItem, excludes as Record<string, unknown>, "some");
}

function applyTemplateString(text: string, props: Record<string, unknown>): string {
  return text.replace(/\{=([^}]+)\}/g, (_m, key: string) => {
    const val = props[key.trim()];
    return val != null ? String(val) : "";
  });
}

function applyEntriesTemplates(
  entries: unknown[],
  props: Record<string, unknown>,
): unknown[] {
  return entries.map((entry) => {
    if (typeof entry === "string") {
      return applyTemplateString(entry, props);
    }
    if (entry && typeof entry === "object") {
      const obj = copyFast(entry as Record<string, unknown>);
      if (typeof obj.entries === "object" && Array.isArray(obj.entries)) {
        obj.entries = applyEntriesTemplates(obj.entries as unknown[], props);
      }
      if (typeof obj.text === "string") {
        obj.text = applyTemplateString(obj.text, props);
      }
      return obj;
    }
    return entry;
  });
}

export function createSpecificVariant(
  baseItem: RawItemEntity,
  genericVariant: RawMagicVariant,
): RawItemEntity {
  const inherits = genericVariant.inherits ?? {};
  const specificVariant = copyFast(baseItem) as RawItemEntity;

  delete specificVariant._isBaseItem;
  specificVariant._baseName = baseItem.name;
  if (baseItem.source !== inherits.source) {
    specificVariant._baseSource = baseItem.source;
  }
  specificVariant._variantName = genericVariant.name;
  specificVariant._baseValue = baseItem.value;
  delete specificVariant.value;
  delete specificVariant.page;
  delete specificVariant.srd;
  delete specificVariant.reprintedAs;
  delete specificVariant.referenceSources;
  delete specificVariant.hasFluff;
  delete specificVariant.hasFluffImages;
  specificVariant._category = "Specific Variant";
  specificVariant.baseItem = itemEntityKey(baseItem);

  const injectProps: Record<string, unknown> = {
    baseName: baseItem.name,
    bonusAc: inherits.bonusAc,
    bonusWeapon: inherits.bonusWeapon,
    bonusSpellAttack: inherits.bonusSpellAttack,
  };

  const inheritEntries = Object.entries(inherits).sort(
    ([kA], [kB]) => Number(kB.includes("Remove")) - Number(kA.includes("Remove")),
  );

  for (const [inheritedProperty, val] of inheritEntries) {
    switch (inheritedProperty) {
      case "namePrefix":
        specificVariant.name = `${val}${specificVariant.name}`;
        break;
      case "nameSuffix":
        specificVariant.name = `${specificVariant.name}${val}`;
        break;
      case "nameRemove":
        specificVariant.name = specificVariant.name.replace(
          new RegExp(String(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          "",
        );
        break;
      case "entries": {
        const applied = applyEntriesTemplates(val as unknown[], injectProps);
        specificVariant.entries = [
          ...applied,
          ...(specificVariant.entries ?? []),
        ];
        break;
      }
      case "propertyAdd": {
        const add = val as unknown[];
        specificVariant.property = [
          ...((specificVariant.property as unknown[]) ?? []),
          ...add,
        ];
        break;
      }
      case "propertyRemove": {
        const remove = (val as unknown[]).map((it) =>
          typeof it === "object" && it && "uid" in (it as object)
            ? (it as { uid: string }).uid
            : it,
        );
        if (specificVariant.property) {
          specificVariant.property = (specificVariant.property as unknown[]).filter(
            (it) => {
              const uid =
                typeof it === "object" && it && "uid" in (it as object)
                  ? (it as { uid: string }).uid
                  : it;
              return !remove.includes(uid);
            },
          );
          if (!(specificVariant.property as unknown[]).length) {
            delete specificVariant.property;
          }
        }
        break;
      }
      case "vulnerable":
      case "resist":
      case "immune":
        break;
      default:
        if (!INHERITED_PROPS_BLOCKLIST.has(inheritedProperty)) {
          (specificVariant as Record<string, unknown>)[inheritedProperty] = val;
        }
    }
  }

  for (const prop of ["vulnerable", "resist", "immune"] as const) {
    if (inherits[prop]) {
      const existing = (specificVariant[prop] as unknown[]) ?? [];
      specificVariant[prop] = [
        ...existing,
        ...(inherits[prop] as unknown[]),
      ];
    }
  }

  if (inherits.source) specificVariant.source = String(inherits.source);
  if (inherits.rarity) specificVariant.rarity = String(inherits.rarity);
  if (inherits.page != null) specificVariant.page = Number(inherits.page);

  return specificVariant;
}

export function createSpecificVariants(
  baseItems: RawItemEntity[],
  genericVariants: RawMagicVariant[],
): RawItemEntity[] {
  const out: RawItemEntity[] = [];
  for (const base of baseItems) {
    base._category = "Basic";
    if (base.entries == null) base.entries = [];
    if (base.packContents) continue;

    for (const variant of genericVariants) {
      if (!isEditionMatch(base.edition, variant.edition)) continue;
      if (!hasRequiredProperty(base, variant)) continue;
      if (hasExcludedProperty(base, variant)) continue;
      out.push(createSpecificVariant(base, variant));
    }
  }
  return out;
}

function lightEnhanceItem(item: RawItemEntity): void {
  item._category ??= item._isBaseItem
    ? "Basic"
    : item._isItemGroup
      ? "Item Group"
      : item._variantName
        ? "Specific Variant"
        : "Other";
}

export async function buildRawItemList(): Promise<{
  items: RawItemEntity[];
  indexes: ItemBaseIndexes;
  linkedLootTables: Record<string, unknown>;
}> {
  const [itemsJson, baseJson, variantsJson] = await Promise.all([
    fetchFiveToolsJson<ItemsJson>(ITEMS_JSON_URL, "items.json"),
    fetchFiveToolsJson<ItemsBaseJson>(ITEMS_BASE_JSON_URL, "items-base.json"),
    fetchFiveToolsJson<MagicVariantsJson>(
      MAGIC_VARIANTS_JSON_URL,
      "magicvariants.json",
    ),
  ]);

  const resolvedItems = resolveItemsByNameSource(itemsJson.item ?? []);
  const itemGroups = (itemsJson.itemGroup ?? []).map((g) => ({
    ...g,
    _isItemGroup: true,
  }));
  const resolvedGroups = resolveItemsByNameSource(itemGroups);

  const resolvedTypes = resolveItemTypesByAbbreviation(baseJson.itemType ?? []);
  const indexes: ItemBaseIndexes = {
    itemTypes: buildItemTypeIndex(resolvedTypes),
    itemProperties: buildItemPropertyIndex(baseJson.itemProperty ?? []),
  };

  const baseItems = resolveItemsByNameSource(baseJson.baseitem ?? []).map(
    (b) => ({ ...b, _isBaseItem: true }),
  );

  const genericVariants = procGenericVariants(variantsJson.magicvariant ?? []);
  const specificVariants = createSpecificVariants(baseItems, genericVariants);

  const allItems: RawItemEntity[] = [
    ...resolvedItems,
    ...resolvedGroups,
    ...baseItems,
    ...(genericVariants as unknown as RawItemEntity[]),
    ...specificVariants,
  ];

  for (const item of allItems) {
    lightEnhanceItem(item);
  }

  return {
    items: allItems,
    indexes,
    linkedLootTables: variantsJson.linkedLootTables ?? {},
  };
}
