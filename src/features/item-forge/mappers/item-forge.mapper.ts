import type {
  RaintdmCraftingRule,
  RaintdmItem,
  RaintdmItemMeta,
} from "../types/item-forge.types";

const TYPE_LABELS: Record<string, string> = {
  MHMAG: "Magazine (Repeaters)",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseRaintdmMeta(raw: unknown): RaintdmItemMeta | undefined {
  if (!isRecord(raw)) return undefined;

  const author = parseString(raw.author);
  const kind = parseString(raw.kind);
  const magazineKey = parseString(raw.magazineKey);
  const chargesPerMagazine = parseNumber(raw.chargesPerMagazine);
  const damageType = parseString(raw.damageType);
  const baseWeapon = parseString(raw.baseWeapon);

  if (
    !author &&
    !kind &&
    !magazineKey &&
    chargesPerMagazine == null &&
    !damageType &&
    !baseWeapon
  ) {
    return undefined;
  }

  return {
    author,
    kind,
    magazineKey,
    chargesPerMagazine,
    damageType,
    baseWeapon,
  };
}

function parseCrafting(raw: unknown): RaintdmCraftingRule | undefined {
  if (!isRecord(raw)) return undefined;
  const tool = parseString(raw.tool);
  const item1 = parseString(raw.item1);
  const item2 = parseString(raw.item2);
  const dc =
    parseString(raw.dc) ??
    (typeof raw.dc === "number" && Number.isFinite(raw.dc)
      ? String(raw.dc)
      : undefined);
  if (!tool || !item1 || !item2 || !dc) return undefined;
  return {
    tool,
    item1,
    item2,
    dc,
    quantity: parseString(raw.quantity),
  };
}

function parseOneItem(raw: unknown): RaintdmItem {
  const record = isRecord(raw) ? raw : {};
  const type = parseString(record.type) ?? "misc";

  return {
    name: parseString(record.name) ?? "Unknown",
    source: parseString(record.source) ?? "RAINTDM",
    type,
    typeLabel: TYPE_LABELS[type] ?? "Misc",
    rarity: parseString(record.rarity) ?? "none",
    valueCp: parseNumber(record.value) ?? null,
    weight: parseNumber(record.weight) ?? null,
    page: parseNumber(record.page),
    entries: Array.isArray(record.entries) ? record.entries : [],
    raintdm: parseRaintdmMeta(record._raintdm),
    crafting: parseCrafting(record.crafting),
  };
}

/** Parse a category file, a single item, or an array of either. */
export function parseImportedItems(data: unknown): RaintdmItem[] {
  if (Array.isArray(data)) {
    return data.flatMap((entry) => parseImportedItems(entry));
  }

  if (isRecord(data) && Array.isArray(data.items)) {
    return data.items.flatMap((entry) => parseImportedItems(entry));
  }

  if (!isRecord(data)) return [];
  return [parseOneItem(data)];
}
