import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { formatTotalGp } from "@/features/shops/utils/cost.utils";
import type {
  StartingEquipmentGroup,
  StartingEquipmentItem,
  StartingEquipmentOffers,
  StartingEquipmentOption,
} from "@/shared/types/starting-equipment.types";

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  weaponMartial: "Martial weapon",
  weaponSimple: "Simple weapon",
  instrumentMusical: "Musical instrument",
  focusSpellcastingArcane: "Arcane focus",
  focusSpellcastingHoly: "Holy symbol",
  focusSpellcastingDruidic: "Druidic focus",
  toolArtisan: "Artisan's tools",
};

function titleCaseItemName(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseItemKey(key: string): { name: string; source: string } {
  const trimmed = key.trim();
  const pipe = trimmed.indexOf("|");
  if (pipe === -1) {
    return { name: titleCaseItemName(trimmed), source: "" };
  }
  return {
    name: titleCaseItemName(trimmed.slice(0, pipe).trim()),
    source: trimmed.slice(pipe + 1).trim().toUpperCase(),
  };
}

function buildItemId(
  groupIndex: number,
  optionKey: string,
  itemIndex: number,
  suffix: string,
): string {
  return `${groupIndex}:${optionKey}:${itemIndex}:${suffix}`;
}

function parseRawItem(
  raw: unknown,
  ctx: { groupIndex: number; optionKey: string; itemIndex: number },
): StartingEquipmentItem | null {
  if (typeof raw === "string") {
    const { name, source } = parseItemKey(raw);
    return {
      id: buildItemId(ctx.groupIndex, ctx.optionKey, ctx.itemIndex, name),
      name,
      quantity: 1,
      source: source || undefined,
    };
  }

  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.value === "number") {
    const gp = obj.value / 100;
    const name = `${gp % 1 === 0 ? gp : gp.toFixed(2)} gp`;
    return {
      id: buildItemId(ctx.groupIndex, ctx.optionKey, ctx.itemIndex, "value"),
      name,
      quantity: 1,
      cost: formatTotalGp(gp),
      weight: "—",
    };
  }

  if (typeof obj.special === "string") {
    const qty = typeof obj.quantity === "number" ? obj.quantity : 1;
    const name = qty > 1 ? `${obj.special} (×${qty})` : obj.special;
    return {
      id: buildItemId(ctx.groupIndex, ctx.optionKey, ctx.itemIndex, obj.special),
      name,
      quantity: qty,
    };
  }

  if (typeof obj.equipmentType === "string") {
    const label =
      EQUIPMENT_TYPE_LABELS[obj.equipmentType] ?? titleCaseItemName(obj.equipmentType);
    const qty = typeof obj.quantity === "number" ? obj.quantity : 1;
    return {
      id: buildItemId(
        ctx.groupIndex,
        ctx.optionKey,
        ctx.itemIndex,
        obj.equipmentType,
      ),
      name: qty > 1 ? `${qty} × ${label}` : label,
      quantity: qty,
    };
  }

  const itemKey = typeof obj.item === "string" ? obj.item : null;
  if (!itemKey) return null;

  const { name: parsedName, source } = parseItemKey(itemKey);
  const displayName =
    typeof obj.displayName === "string" ? obj.displayName : parsedName;
  const qty = typeof obj.quantity === "number" ? obj.quantity : 1;

  return {
    id: buildItemId(ctx.groupIndex, ctx.optionKey, ctx.itemIndex, parsedName),
    name: qty > 1 ? `${displayName} (×${qty})` : displayName,
    quantity: qty,
    source: source || undefined,
  };
}

function parseGroupObject(
  obj: Record<string, unknown>,
  groupIndex: number,
): StartingEquipmentGroup {
  const guaranteed: StartingEquipmentItem[] = [];
  const options: StartingEquipmentOption[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (!Array.isArray(value)) continue;

    const items = value
      .map((raw, itemIndex) =>
        parseRawItem(raw, { groupIndex, optionKey: key, itemIndex }),
      )
      .filter((item): item is StartingEquipmentItem => item !== null);

    if (key === "_") {
      guaranteed.push(...items);
    } else {
      options.push({ key, items });
    }
  }

  const label =
    options.length > 1
      ? `Elige una opción (${options.map((option) => option.key.toUpperCase()).join(", ")})`
      : options.length === 1
        ? `Opción ${options[0].key.toUpperCase()}`
        : undefined;

  return {
    id: `group-${groupIndex}`,
    label,
    guaranteed: guaranteed.length ? guaranteed : undefined,
    options: options.length ? options : undefined,
  };
}

export function parseStartingEquipmentGroups(
  raw: unknown,
): StartingEquipmentGroup[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null,
    )
    .map((entry, index) => parseGroupObject(entry, index))
    .filter(
      (group) =>
        (group.guaranteed?.length ?? 0) > 0 || (group.options?.length ?? 0) > 0,
    );
}

export interface RawClassStartingEquipment {
  default?: string[];
  entries?: string[];
  defaultData?: unknown[];
  goldAlternative?: string;
  additionalFromBackground?: boolean;
}

export function parseClassStartingEquipment(
  raw?: RawClassStartingEquipment,
): StartingEquipmentOffers {
  if (!raw) return { groups: [] };

  return {
    groups: parseStartingEquipmentGroups(raw.defaultData),
    goldAlternative: raw.goldAlternative
      ? parseFiveToolsMarkup(raw.goldAlternative)
      : undefined,
    additionalFromBackground: raw.additionalFromBackground,
  };
}

export function parseBackgroundStartingEquipment(
  raw: unknown,
): StartingEquipmentOffers {
  return { groups: parseStartingEquipmentGroups(raw) };
}

export function hasStartingEquipmentOffers(
  offers: StartingEquipmentOffers | undefined,
): boolean {
  return (offers?.groups.length ?? 0) > 0;
}
